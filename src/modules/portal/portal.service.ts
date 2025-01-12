import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model } from "mongoose";
import { Address, isAddress } from "viem";
import { SUPPORTED_SORT_TYPE, Portal } from "@accesstimeio/accesstime-common";

import { getEpochWeek, getFactoryOwner } from "src/helpers";

import { Project } from "./schemas/project.schema";
import { ProjectFavorite } from "./schemas/project-favorite.schema";
import {
    ExploreResponseDto,
    FeaturedsResponseDto,
    ProjectCardDto,
    ProjectDto,
    ProjectToggleFavoriteResponseDto,
    ProjectVotesResponseDto,
    UserFavoritesResponseDto
} from "./dto";

import { SubgraphService } from "../subgraph/subgraph.service";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

interface CacheProject extends ProjectCardDto {
    accessTimeId: number;
}

@Injectable()
export class PortalService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<Project>,
        @InjectModel(ProjectFavorite.name)
        private readonly projectFavoriteModel: Model<ProjectFavorite>,
        private readonly subgraphService: SubgraphService,
        @Inject(CACHE_MANAGER) private cacheService: Cache
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
        page?: number,
        sort?: SUPPORTED_SORT_TYPE,
        paymentMethods?: Address[],
        user?: Address
    ): Promise<ExploreResponseDto> {
        const queryPage = page ?? 1;
        const limit = Number(process.env.PAGE_ITEM_LIMIT);
        let querySort: SUPPORTED_SORT_TYPE = Portal.defaultSortType;
        let countProjects: number = 0;

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

        let projects: CacheProject[] = [];

        if (querySort != "weekly_popular") {
            countProjects = await this.subgraphService.countProjects(chainId, paymentMethods);
        } else {
            countProjects = await this.subgraphService.countWeeklyVoteProjects(
                chainId,
                getEpochWeek(),
                paymentMethods
            );
        }
        const requestable = limit - (queryPage * limit - countProjects) > 0 ? true : false;

        if (queryPage != 1 && !requestable) {
            throw new HttpException(
                {
                    errors: { message: "Requested page exceeds page limit." }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }

        switch (querySort) {
            case "newest":
                const newestProjects = await this.subgraphService.newestProjects(
                    chainId,
                    queryPage,
                    paymentMethods
                );

                newestProjects.forEach(
                    ({ id, accessTimeId, totalVotePoint, totalVoteParticipantCount }) => {
                        projects.push({
                            id,
                            accessTimeId: Number(accessTimeId),
                            avatarUrl: null,
                            votePoint: Number(totalVotePoint),
                            voteParticipantCount: Number(totalVoteParticipantCount),
                            isFavorited: false,
                            categories: [],
                            domainVerify: false,
                            portalVerify: false
                        });
                    }
                );
                break;
            case "top_rated":
                const topRatedProjects = await this.subgraphService.topRatedProjects(
                    chainId,
                    queryPage,
                    paymentMethods
                );

                topRatedProjects.forEach(
                    ({ id, accessTimeId, totalVotePoint, totalVoteParticipantCount }) => {
                        projects.push({
                            id,
                            accessTimeId: Number(accessTimeId),
                            avatarUrl: null,
                            votePoint: Number(totalVotePoint),
                            voteParticipantCount: Number(totalVoteParticipantCount),
                            isFavorited: false,
                            categories: [],
                            domainVerify: false,
                            portalVerify: false
                        });
                    }
                );
                break;
            default:
                const weeklyPopularProjects = await this.subgraphService.weeklyPopularProjects(
                    chainId,
                    getEpochWeek(),
                    queryPage,
                    paymentMethods
                );

                weeklyPopularProjects.forEach(({ accessTime, votePoint, participantCount }) => {
                    projects.push({
                        id: accessTime.id,
                        accessTimeId: Number(accessTime.accessTimeId),
                        avatarUrl: null,
                        votePoint: Number(votePoint),
                        voteParticipantCount: Number(participantCount),
                        isFavorited: false,
                        categories: [],
                        domainVerify: false,
                        portalVerify: false
                    });
                });
                break;
        }

        const projectIds = projects.map((project) => project.accessTimeId);

        const projectDocuments = await this.projectModel
            .find({ chainId })
            .where("id")
            .in(projectIds)
            .select(["id", "avatarUrl", "categories", "domainVerify", "portalVerify"])
            .exec();

        let userFavorites: ProjectFavorite[] = [];

        if (user) {
            userFavorites = await this.projectFavoriteModel
                .find({ chainId, user })
                .where("id")
                .in(projectIds)
                .select("id")
                .exec();
        }

        projects = projects.map((project) => ({
            ...project,
            avatarUrl:
                projectDocuments.find((pd) => pd.id == project.accessTimeId)?.avatarUrl ?? null,
            categories:
                projectDocuments.find((pd) => pd.id == project.accessTimeId)?.categories ?? [],
            isFavorited: userFavorites.find((uf) => uf.id == project.accessTimeId) ? true : false,
            domainVerify:
                projectDocuments.find((pd) => pd.id == project.accessTimeId)?.domainVerify ?? false,
            portalVerify:
                projectDocuments.find((pd) => pd.id == project.accessTimeId)?.portalVerify ?? false
        }));

        return { countProjects, maxPage: Math.floor(countProjects / limit), projects };
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
            .find({ chainId, user })
            .limit(limit)
            .skip(skip)
            .select("id")
            .exec();

        const userFavoritedProjectIds = userFavorites.map((favorite) => favorite.id);

        const userFavoriteProjectDocuments = await this.projectModel
            .find()
            .where("id")
            .in(userFavoritedProjectIds)
            .select(["address", "avatarUrl", "categories", "domainVerify", "portalVerify"])
            .exec();

        const projects: ProjectCardDto[] = userFavoriteProjectDocuments.map((project) => ({
            id: project.address,
            avatarUrl: project.avatarUrl,
            votePoint: 0,
            voteParticipantCount: 0,
            isFavorited: true,
            categories: project.categories,
            domainVerify: project.domainVerify,
            portalVerify: project.portalVerify
        }));

        return {
            countProjects: countUserFavorites,
            maxPage: Math.floor(countUserFavorites / limit),
            projects
        };
    }

    async getProjectById(chainId: number, id: number, user?: Address): Promise<ProjectDto> {
        const projectFromChain = await this.getProjectFromChain(chainId, id);

        const projectLastUpdate = Number(projectFromChain.updateTimestamp);
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
            project = (await this.projectModel.findOne({ id, chainId })) ?? null;
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

        let isFavorited: boolean = false;
        if (user) {
            isFavorited = await this.isProjectFavoritedByUser(chainId, id, user);
        }

        const projectWeeklyVote = await this.subgraphService.projectWeeklyVote(
            chainId,
            getEpochWeek(),
            projectAddress
        );

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
                projectWeeklyVote.length > 0 ? Number(projectWeeklyVote[0].participantCount) : 0,
            isFavorited,
            socials,
            categories,
            contentUrl,
            paymentMethods,
            packages,
            domainVerify,
            portalVerify
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
        const projectFromChain = await this.getProjectFromChain(chainId, id);
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
                ? Number(projectPreviousWeeklyVote[0].participantCount)
                : 0;

        const projectWeeklyVote = await this.subgraphService.projectWeeklyVote(
            chainId,
            getEpochWeek(),
            projectAddress
        );
        const votePoint = projectWeeklyVote.length > 0 ? Number(projectWeeklyVote[0].votePoint) : 0;
        const voteParticipantCount =
            projectWeeklyVote.length > 0 ? Number(projectWeeklyVote[0].participantCount) : 0;

        return {
            previousVotePoint,
            previousVoteParticipantCount,
            votePoint,
            voteParticipantCount
        };
    }

    async toggleFeatured(chainId: number, id: number, signer: Address) {
        const factoryOwner = await getFactoryOwner(chainId);

        if (factoryOwner.toLowerCase() != signer.toLowerCase()) {
            throw new HttpException(
                {
                    errors: { message: "Only factory owner authorized." }
                },
                HttpStatus.UNAUTHORIZED
            );
        }

        const projectCount = await this.projectModel.countDocuments({ id, chainId });

        if (projectCount == 0) {
            throw new HttpException(
                {
                    errors: { message: "Requested project is not found." }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }

        const project = await this.projectModel.findOne({ id, chainId });
        const newStatus = typeof project.featured == "boolean" ? !project.featured : true;

        project.$set({ featured: newStatus });

        await project.save();
        await this.cacheService.del("portal-featureds");

        return true;
    }

    async togglePortalVerify(chainId: number, id: number, signer: Address) {
        const factoryOwner = await getFactoryOwner(chainId);

        if (factoryOwner.toLowerCase() != signer.toLowerCase()) {
            throw new HttpException(
                {
                    errors: { message: "Only factory owner authorized." }
                },
                HttpStatus.UNAUTHORIZED
            );
        }

        const projectCount = await this.projectModel.countDocuments({ id, chainId });

        if (projectCount == 0) {
            throw new HttpException(
                {
                    errors: { message: "Requested project is not found." }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }

        const project = await this.projectModel.findOne({ id, chainId });
        const newStatus = typeof project.portalVerify == "boolean" ? !project.portalVerify : true;

        project.$set({ portalVerify: newStatus });

        await project.save();

        return true;
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

    private async getProjectFromChain(chainId: number, id: number) {
        const projectFromChain = await this.subgraphService.projectById(chainId, id);

        if (projectFromChain.length == 0) {
            throw new HttpException(
                {
                    errors: { message: "Requested project is not found." }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }

        return projectFromChain[0];
    }
}
