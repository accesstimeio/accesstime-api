import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model } from "mongoose";
import { Address, isAddress, zeroAddress } from "viem";
import { SUPPORTED_SORT_TYPE, Portal, extractDomain } from "@accesstimeio/accesstime-common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

import { getEpochWeek } from "src/helpers";
import { RRDA_RESULT } from "src/types/rrda";

import { Project } from "./schemas/project.schema";
import { ProjectFavorite } from "./schemas/project-favorite.schema";
import {
    CheckDomainVerifyResponseDto,
    ExploreResponseDto,
    FeaturedsResponseDto,
    ProjectCardDto,
    ProjectDto,
    ProjectToggleFavoriteResponseDto,
    ProjectVotesResponseDto,
    RequestDomainVerifyResponseDto,
    UserFavoritesResponseDto
} from "./dto";
import { ProjectDomain } from "./schemas/portal-domain.schema";

import { SubgraphService } from "../subgraph/subgraph.service";
import { ProjectService } from "../project/project.service";
import { FactoryService } from "../factory/factory.service";

interface CacheProject extends ProjectCardDto {
    accessTimeId: number;
}

@Injectable()
export class PortalService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<Project>,
        @InjectModel(ProjectFavorite.name)
        private readonly projectFavoriteModel: Model<ProjectFavorite>,
        @InjectModel(ProjectDomain.name)
        private readonly projectDomainModel: Model<ProjectDomain>,
        @Inject(forwardRef(() => SubgraphService))
        private readonly subgraphService: SubgraphService,
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        private readonly projectService: ProjectService,
        private readonly factoryService: FactoryService
    ) {}

    async getFeatureds() {
        const dataKey = `portal-featureds`;

        const cachedData = await this.cacheService.get<FeaturedsResponseDto[]>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const featuredProjects = await this.projectModel
                .find({ featured: true })
                .sort({
                    chainUpdateTimestamp: "desc"
                })
                .select(["id", "chainId", "address", "avatarUrl", "domainVerify", "portalVerify"])
                .exec();

            await this.cacheService.set(dataKey, featuredProjects, {
                ttl: Number(process.env.PROJECT_TTL)
            });

            return featuredProjects;
        }
    }

    async getExplore(
        chainId: number,
        sort?: SUPPORTED_SORT_TYPE,
        paymentMethods?: Address[],
        page?: number,
        user?: Address
    ): Promise<ExploreResponseDto> {
        let querySort: SUPPORTED_SORT_TYPE = Portal.defaultSortType;

        if (sort) {
            if (Portal.sortTypes.includes(sort)) {
                querySort = sort;
            } else {
                throw new HttpException(
                    {
                        errors: { message: "Requested sort type is not supported." }
                    },
                    HttpStatus.EXPECTATION_FAILED
                );
            }
        }

        if (paymentMethods) {
            let notSupportedPaymentMethod: boolean = false;
            for (let i = 0; i < paymentMethods.length; i++) {
                if (!isAddress(paymentMethods[i])) {
                    notSupportedPaymentMethod = true;
                    break;
                }
            }

            if (notSupportedPaymentMethod) {
                throw new HttpException(
                    {
                        errors: { message: "Requested payment method is not supported." }
                    },
                    HttpStatus.EXPECTATION_FAILED
                );
            }

            paymentMethods = paymentMethods.map(
                (paymentMethod) => paymentMethod.toLowerCase() as Address
            );
        }

        const apiResult = await this.subgraphService.apiPortalExplore(
            chainId,
            page,
            querySort,
            paymentMethods
        );

        return this.fillProjectDetails(
            apiResult.projects,
            Number(apiResult.totalCount),
            Number(process.env.PAGE_ITEM_LIMIT),
            user
        );
    }

    async getFavorites(
        chainId: number,
        user: Address,
        page?: number
    ): Promise<UserFavoritesResponseDto> {
        const queryPage = page ?? 1;
        const limit = Number(process.env.PAGE_ITEM_LIMIT);
        const skip = page ? (page - 1) * limit : 0;

        const countUserFavorites = await this.projectFavoriteModel.countDocuments({
            chainId,
            user
        });

        const requestable = limit - (queryPage * limit - countUserFavorites) > 0 ? true : false;

        if (queryPage != 1 && !requestable) {
            throw new HttpException(
                {
                    errors: { message: "Requested page exceeds page limit." }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }

        const userFavorites = await this.projectFavoriteModel
            .find(chainId == 0 ? { user } : { chainId, user })
            .limit(limit)
            .skip(skip)
            .select(["id", "chainId"])
            .exec();

        const userFavoritedProjectIds = userFavorites.map((favorite) => favorite.id);

        const userFPD = await this.projectModel
            .find()
            .where("id")
            .in(userFavoritedProjectIds)
            .select([
                "id",
                "address",
                "chainId",
                "avatarUrl",
                "categories",
                "domainVerify",
                "portalVerify"
            ])
            .exec();

        const projects: ProjectCardDto[] = userFavorites.map((project) => ({
            id:
                userFPD.find((pd) => pd.id == project.id && pd.chainId == project.chainId)
                    ?.address ?? zeroAddress,
            chainId: project.chainId,
            avatarUrl:
                userFPD.find((pd) => pd.id == project.id && pd.chainId == project.chainId)
                    ?.avatarUrl ?? null,
            votePoint: 0,
            voteParticipantCount: 0,
            isFavorited: true,
            categories:
                userFPD.find((pd) => pd.id == project.id && pd.chainId == project.chainId)
                    ?.categories ?? [],
            domainVerify:
                userFPD.find((pd) => pd.id == project.id && pd.chainId == project.chainId)
                    ?.domainVerify ?? false,
            portalVerify:
                userFPD.find((pd) => pd.id == project.id && pd.chainId == project.chainId)
                    ?.portalVerify ?? false
        }));

        const flooredMaxPage = Math.floor(countUserFavorites / limit);
        const maxPage = countUserFavorites % limit > 0 ? flooredMaxPage + 1 : flooredMaxPage;

        return {
            countProjects: countUserFavorites,
            maxPage,
            projects
        };
    }

    async getProjectById(chainId: number, id: number, user?: Address): Promise<ProjectDto> {
        const { project, projectAddress } = await this.getProject(chainId, id);

        let isFavorited: boolean = false;
        if (user) {
            isFavorited = await this.isProjectFavoritedByUser(chainId, id, user);
        }

        const projectWeeklyVote = await this.subgraphService.projectWeeklyVote(
            chainId,
            getEpochWeek(),
            projectAddress
        );

        const projectDomainVerifyDetails = await this.getProjectDomain(chainId, id);

        const {
            avatarUrl,
            socials,
            categories,
            contentUrl,
            paymentMethods,
            packages,
            domainVerify,
            portalVerify
        } = project;

        return {
            avatarUrl,
            votePoint: projectWeeklyVote.length > 0 ? Number(projectWeeklyVote[0].votePoint) : 0,
            voteParticipantCount:
                projectWeeklyVote.length > 0 ? projectWeeklyVote[0].participantCount : 0,
            isFavorited,
            socials,
            categories,
            contentUrl,
            paymentMethods,
            packages,
            domainVerify,
            portalVerify,
            domainVerifyDetails: projectDomainVerifyDetails
                ? {
                      domain: projectDomainVerifyDetails.domain,
                      recordKey: projectDomainVerifyDetails.recordKey,
                      recordValue: projectDomainVerifyDetails.recordValue
                  }
                : null
        };
    }

    async toggleFavorite(
        chainId: number,
        id: number,
        user: Address
    ): Promise<ProjectToggleFavoriteResponseDto> {
        const isFavorited = await this.isProjectFavoritedByUser(chainId, id, user);

        let isFavoritedNow: boolean | null = null;
        if (!isFavorited) {
            const newUserFavorite = new this.projectFavoriteModel({
                id,
                chainId,
                user
            });

            await newUserFavorite.save();

            isFavoritedNow = true;
        } else {
            const deleteUserFavorite = await this.projectFavoriteModel
                .findOne({
                    id,
                    chainId,
                    user
                })
                .exec();

            await deleteUserFavorite.deleteOne();

            isFavoritedNow = false;
        }

        return { isFavoritedNow };
    }

    async getProjectVotes(chainId: number, id: number): Promise<ProjectVotesResponseDto> {
        const projectFromChain = await this.projectService.getProjectById(chainId, id);
        const projectAddress = projectFromChain.id;

        const projectPreviousWeeklyVote = await this.subgraphService.projectWeeklyVote(
            chainId,
            getEpochWeek() - 1,
            projectAddress
        );
        const previousVotePoint =
            projectPreviousWeeklyVote.length > 0
                ? Number(projectPreviousWeeklyVote[0].votePoint)
                : 0;
        const previousVoteParticipantCount =
            projectPreviousWeeklyVote.length > 0
                ? projectPreviousWeeklyVote[0].participantCount
                : 0;

        const projectWeeklyVote = await this.subgraphService.projectWeeklyVote(
            chainId,
            getEpochWeek(),
            projectAddress
        );
        const votePoint = projectWeeklyVote.length > 0 ? Number(projectWeeklyVote[0].votePoint) : 0;
        const voteParticipantCount =
            projectWeeklyVote.length > 0 ? projectWeeklyVote[0].participantCount : 0;

        return {
            previousVotePoint,
            previousVoteParticipantCount,
            votePoint,
            voteParticipantCount
        };
    }

    async toggleFeatured(chainId: number, id: number, signer: Address) {
        const factory = this.factoryService.client[chainId];
        const factoryOwner = await factory.read.owner();

        if (factoryOwner.toLowerCase() != signer.toLowerCase()) {
            throw new HttpException(
                {
                    errors: { message: "Only factory owner authorized." }
                },
                HttpStatus.UNAUTHORIZED
            );
        }

        const { project } = await this.getProject(chainId, id);
        const newStatus = typeof project.featured == "boolean" ? !project.featured : true;

        project.$set({ featured: newStatus });

        await project.save();
        await this.cacheService.del("portal-featureds");

        return true;
    }

    async togglePortalVerify(chainId: number, id: number, signer: Address) {
        const factory = this.factoryService.client[chainId];
        const factoryOwner = await factory.read.owner();

        if (factoryOwner.toLowerCase() != signer.toLowerCase()) {
            throw new HttpException(
                {
                    errors: { message: "Only factory owner authorized." }
                },
                HttpStatus.UNAUTHORIZED
            );
        }

        const { project } = await this.getProject(chainId, id);
        const newStatus = typeof project.portalVerify == "boolean" ? !project.portalVerify : true;

        project.$set({ portalVerify: newStatus });

        await project.save();

        return true;
    }

    async requestDomainVerify(
        chainId: number,
        id: number,
        signer: Address
    ): Promise<RequestDomainVerifyResponseDto> {
        const { projectAddress, projectOwner } = await this.getProject(chainId, id);

        if (projectOwner != signer) {
            throw new HttpException(
                {
                    errors: { message: "Caller is not owner of project." }
                },
                HttpStatus.UNAUTHORIZED
            );
        }

        const factory = this.factoryService.client[chainId];
        const [, , , , , , currentDomain] = await factory.read.deploymentDetails([projectAddress]);
        const domain = extractDomain(currentDomain);

        if (domain == null) {
            throw new HttpException(
                {
                    errors: { message: "Project domain is not acceptable." }
                },
                HttpStatus.NOT_ACCEPTABLE
            );
        }

        const projectDomainCount = await this.projectDomainModel.countDocuments({ chainId, id });
        let projectDomain: (Document<unknown, unknown, ProjectDomain> & ProjectDomain) | null =
            null;

        if (projectDomainCount == 0) {
            projectDomain = new this.projectDomainModel({
                chainId,
                id,
                domain,
                recordKey: `_accesstime-${chainId}-${id}-${Math.random().toString(36).substring(2, 10)}`,
                recordValue: `at-${Math.random().toString(36).substring(2, 10)}`
            });

            await projectDomain.save();
        } else {
            projectDomain = await this.getProjectDomain(chainId, id);
        }

        if (projectDomain == null) {
            throw new HttpException(
                {
                    errors: { message: "Project domain verify process creation failed!" }
                },
                HttpStatus.FAILED_DEPENDENCY
            );
        }

        return {
            domain: projectDomain.domain,
            recordKey: projectDomain.recordKey,
            recordValue: projectDomain.recordValue
        };
    }

    async checkDomainVerify(
        chainId: number,
        id: number,
        signer: Address
    ): Promise<CheckDomainVerifyResponseDto> {
        const { project, projectOwner } = await this.getProject(chainId, id);

        if (projectOwner != signer) {
            throw new HttpException(
                {
                    errors: { message: "Caller is not owner of project." }
                },
                HttpStatus.UNAUTHORIZED
            );
        }

        const projectDomainCount = await this.projectDomainModel.countDocuments({ chainId, id });

        if (projectDomainCount == 0) {
            throw new HttpException(
                {
                    errors: { message: "Domain verify request is not found!" }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }

        const projectDomain = await this.getProjectDomain(chainId, id);

        try {
            // 1.1.1.1:53 -> cloudflare dns resolver
            const rrdaResult: RRDA_RESULT = await (
                await fetch(
                    `${process.env.RRDA_URL}/1.1.1.1:53/${projectDomain.recordKey}.${projectDomain.domain}/txt`
                )
            ).json();

            const recordValue = rrdaResult.answer[0]?.rdata;

            if (recordValue) {
                const cleanedRecordValue = recordValue.replace(/["\\]/g, "");
                if (cleanedRecordValue == projectDomain.recordValue) {
                    project.$set({ domainVerify: true });

                    await project.save();
                    return { status: true };
                }
            }

            return { status: false };
        } catch (_err) {
            return { status: false };
        }
    }

    async removeDomainVerify(chainId: number, id: number) {
        const { project } = await this.getProject(chainId, id);

        const projectDomain = await this.getProjectDomain(chainId, id);

        if (projectDomain) {
            await projectDomain.deleteOne();
        }

        if (project.domainVerify == true) {
            project.$set({ domainVerify: false });

            await project.save();
        }
    }

    async getProjectDomain(chainId: number, id: number) {
        return this.projectDomainModel.findOne({ chainId, id }).exec();
    }

    private async isProjectFavoritedByUser(
        chainId: number,
        id: number,
        user: Address
    ): Promise<boolean> {
        const userFavorite = await this.projectFavoriteModel.countDocuments({
            id,
            chainId,
            user
        });

        return userFavorite > 0 ? true : false;
    }

    private async getProject(chainId: number, id: number) {
        const projectFromChain = await this.projectService.getProjectById(chainId, id);

        const projectLastUpdate = Number(projectFromChain.updateTimestamp);
        const projectOwner = projectFromChain.owner;
        const projectAddress = projectFromChain.id;
        const projectPaymentMethods = projectFromChain.paymentMethods;
        const projectDocument = await this.projectModel.countDocuments({ id, chainId });

        let project: (Document<unknown, unknown, Project> & Project) | null = null;
        let requiredSave: boolean = false;
        if (projectDocument == 0) {
            project = new this.projectModel({
                id,
                chainId,
                chainUpdateTimestamp: 0,
                address: projectAddress
            });

            requiredSave = true;
        } else {
            project = (await this.projectModel.findOne({ id, chainId }).exec()) ?? null;
        }

        if (project.chainUpdateTimestamp < projectLastUpdate) {
            project.$set({
                chainUpdateTimestamp: projectLastUpdate,
                paymentMethods: projectPaymentMethods
            });

            requiredSave = true;
        }

        if (requiredSave && project != null) {
            await project.save();
        }

        return { project, projectAddress, projectOwner };
    }

    async search(name: string, page?: number, user?: Address): Promise<ExploreResponseDto> {
        const isValid = /^[a-zA-Z0-9 ]+$/.test(name);
        const correctLength = name.replace(/[^a-zA-Z0-9 ]/g, "").trim().length > 3;
        if (!isValid || !correctLength) {
            throw new HttpException(
                {
                    errors: { message: "Searched project name is not acceptable." }
                },
                HttpStatus.NOT_ACCEPTABLE
            );
        }

        const apiResult = await this.subgraphService.apiPortalSearch(
            name.replace(/[^a-zA-Z0-9 ]/g, "").trim(),
            page
        );

        return this.fillProjectDetails(
            apiResult.results,
            Number(apiResult.totalCount),
            Number(process.env.PAGE_ITEM_LIMIT),
            user
        );
    }

    private async fillProjectDetails(
        rawProjects: {
            id: Address;
            chainId: number;
            accessTimeId: number;
            totalVotePoint: number;
            totalVoteParticipantCount: number;
        }[],
        countProjects: number,
        limit: number,
        user?: Address
    ): Promise<ExploreResponseDto> {
        let projects: CacheProject[] = [];

        rawProjects.forEach(
            ({
                id,
                chainId: projectChainId,
                accessTimeId,
                totalVotePoint,
                totalVoteParticipantCount
            }) => {
                projects.push({
                    id,
                    chainId: projectChainId,
                    accessTimeId: Number(accessTimeId),
                    avatarUrl: null,
                    votePoint: Number(totalVotePoint),
                    voteParticipantCount: totalVoteParticipantCount,
                    isFavorited: false,
                    categories: [],
                    domainVerify: false,
                    portalVerify: false
                });
            }
        );

        const projectIds = projects.map((project) => project.accessTimeId);

        const projectDocuments = await this.projectModel
            .where("id")
            .in(projectIds)
            .select(["id", "chainId", "avatarUrl", "categories", "domainVerify", "portalVerify"])
            .exec();

        let userFavorites: ProjectFavorite[] = [];

        if (user) {
            userFavorites = await this.projectFavoriteModel
                .find({ user })
                .where("id")
                .in(projectIds)
                .select(["id", "chainId"])
                .exec();
        }

        projects = projects.map((project) => ({
            ...project,
            avatarUrl:
                projectDocuments.find(
                    (pd) => pd.id == project.accessTimeId && pd.chainId == project.chainId
                )?.avatarUrl ?? null,
            categories:
                projectDocuments.find(
                    (pd) => pd.id == project.accessTimeId && pd.chainId == project.chainId
                )?.categories ?? [],
            isFavorited: userFavorites.find(
                (uf) => uf.id == project.accessTimeId && uf.chainId == project.chainId
            )
                ? true
                : false,
            domainVerify:
                projectDocuments.find(
                    (pd) => pd.id == project.accessTimeId && pd.chainId == project.chainId
                )?.domainVerify ?? false,
            portalVerify:
                projectDocuments.find(
                    (pd) => pd.id == project.accessTimeId && pd.chainId == project.chainId
                )?.portalVerify ?? false
        }));

        const flooredMaxPage = Math.floor(countProjects / limit);
        const maxPage = countProjects % limit > 0 ? flooredMaxPage + 1 : flooredMaxPage;

        return {
            countProjects,
            maxPage,
            projects
        };
    }
}
