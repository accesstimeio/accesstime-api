import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { GraphQLClient } from "graphql-request";
import { Address, Hash } from "viem";
import { Chain, extractDomain, SUPPORTED_CHAIN } from "@accesstimeio/accesstime-common";

import { SUBGRAPH_TYPE, SUPPORTED_SUBGRAPH_TYPES } from "src/common";

import {
    SyncResponse,
    CountDeploymentsResponse,
    RatesDocument,
    CountProjectsResponse,
    LastDeploymentsDocument,
    ListDeploymentsDocument,
    CountDeploymentsDocument,
    SyncDocument,
    ProjectByIdDocument,
    NewestProjectsResponse,
    NewestProjectsDocument,
    TopRatedProjectsResponse,
    TopRatedProjectsDocument,
    WeeklyPopularProjectsResponse,
    WeeklyPopularProjectsDocument,
    ProjectWeeklyVoteDocument,
    ProjectWeeklyVoteResponse,
    CountProjectsDocument,
    CountWeeklyVoteProjectsDocument,
    CountWeeklyVoteProjectsResponse
} from "./query/thegraph";

import {
    CountDeploymentsResponse as pCountDeploymentsResponse,
    RatesDocument as pRatesDocument,
    CountProjectsResponse as pCountProjectsResponse,
    LastDeploymentsDocument as pLastDeploymentsDocument,
    ListDeploymentsDocument as pListDeploymentsDocument,
    CountDeploymentsDocument as pCountDeploymentsDocument,
    SyncDocument as pSyncDocument,
    ProjectByIdDocument as pProjectByIdDocument,
    NewestProjectsResponse as pNewestProjectsResponse,
    NewestProjectsDocument as pNewestProjectsDocument,
    TopRatedProjectsResponse as pTopRatedProjectsResponse,
    TopRatedProjectsDocument as pTopRatedProjectsDocument,
    WeeklyPopularProjectsResponse as pWeeklyPopularProjectsResponse,
    WeeklyPopularProjectsDocument as pWeeklyPopularProjectsDocument,
    ProjectWeeklyVoteDocument as pProjectWeeklyVoteDocument,
    ProjectWeeklyVoteResponse as pProjectWeeklyVoteResponse,
    CountProjectsDocument as pCountProjectsDocument,
    CountWeeklyVoteProjectsDocument as pCountWeeklyVoteProjectsDocument,
    CountWeeklyVoteProjectsResponse as pCountWeeklyVoteProjectsResponse,
    StatisticsResponse,
    StatisticsDocument,
    StatisticDocument,
    AccessTimeUsersDocument,
    AccessTimeUsersResponse
} from "./query/ponder";

import { DeploymentService } from "../deployment/deployment.service";
import { DeploymentDto, RatesDto } from "../deployment/dto";
import { ProjectResponseDto } from "../project/dto";
import { ProjectService } from "../project/project.service";
import { PortalService } from "../portal/portal.service";
import { FactoryService } from "../factory/factory.service";
import { StatisticService } from "../statistic/statistic.service";

@Injectable()
export class SubgraphService {
    private client: { [key: number]: GraphQLClient | null } = {};
    private clientUrls: { [key: number]: string } = {};
    private clientTypes: { [key: number]: SUBGRAPH_TYPE } = {};
    private syncBusy: boolean = false;
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => DeploymentService))
        private readonly deploymentsService: DeploymentService,
        @Inject(forwardRef(() => ProjectService))
        private readonly projectService: ProjectService,
        @Inject(forwardRef(() => PortalService))
        private readonly portalService: PortalService,
        private readonly factoryService: FactoryService,
        @Inject(forwardRef(() => StatisticService))
        private readonly statisticService: StatisticService
    ) {
        const subgraphUrls = process.env.SUBGRAPH_URL.split(",");
        const subgraphTypes = process.env.SUBGRAPH_TYPE.split(",");

        Chain.ids.forEach((chainId, index) => {
            if (
                !subgraphUrls[index] ||
                !subgraphTypes[index] ||
                !SUPPORTED_SUBGRAPH_TYPES.includes(subgraphTypes[index] as SUBGRAPH_TYPE)
            ) {
                throw new Error("Subgraph config is invalid!");
            }

            this.client[chainId] = null;
            this.clientUrls[chainId] = subgraphUrls[index];
            this.clientTypes[chainId] = subgraphTypes[index] as SUBGRAPH_TYPE;
        });
    }

    private getClient(chainId: number) {
        if (this.client[chainId] == null) {
            this.client[chainId] = new GraphQLClient(this.clientUrls[chainId]);
        }
        return this.client[chainId];
    }

    private async syncCall(chainId: SUPPORTED_CHAIN) {
        switch (this.clientTypes[chainId]) {
            case "thegraph":
                const result = await this.getClient(chainId).request(SyncDocument);
                const { accessTimes } = result as { accessTimes: SyncResponse[] };
                return accessTimes.reverse();
            case "ponder":
                const presult = await this.getClient(chainId).request(pSyncDocument);
                const { accessTimes: paccessTimes } = presult as {
                    accessTimes: { items: SyncResponse[] };
                };
                return Array.isArray(paccessTimes?.items) ? paccessTimes.items.reverse() : [];
            default:
                return [];
        }
    }

    async sync() {
        try {
            if (!this.syncBusy) {
                this.syncBusy = true;
                for (let i = 0; i < Chain.ids.length; i++) {
                    const chainId = Chain.ids[i];
                    const factory = this.factoryService.client[chainId];

                    const reversedAccessTimes = await this.syncCall(chainId);

                    let lastUpdateTimestamp =
                        (await this.cacheService.get<string>("lastUpdateTimestamp")) ?? "0";
                    for (const accessTime of reversedAccessTimes) {
                        const { owner, prevOwner, updateTimestamp, accessTimeId, id } = accessTime;
                        if (BigInt(updateTimestamp) > BigInt(lastUpdateTimestamp)) {
                            // check domain changes
                            const [, , , , , , currentDomain] =
                                await factory.read.deploymentDetails([id]);
                            const projectDomain = await this.portalService.getProjectDomain(
                                chainId,
                                Number(accessTimeId)
                            );
                            if (
                                projectDomain &&
                                projectDomain.domain != extractDomain(currentDomain)
                            ) {
                                await this.portalService.removeDomainVerify(
                                    chainId,
                                    Number(accessTimeId)
                                );
                            }

                            const lastOwner =
                                (await this.cacheService.get<Address>(
                                    `project-id-${accessTimeId}-owner`
                                )) ?? null;
                            // current owner update job
                            await this.deploymentsService.removeLastDeployments(chainId, owner);
                            await this.deploymentsService.removeListDeployments(chainId, owner);
                            await this.projectService.removeProjectById(
                                chainId,
                                Number(accessTimeId)
                            );
                            // if owner transferred, clean both
                            if (lastOwner?.toLowerCase() != owner.toLowerCase()) {
                                const deleteThis =
                                    lastOwner != null
                                        ? lastOwner.toLowerCase()
                                        : prevOwner.toLowerCase();
                                await this.deploymentsService.removeLastDeployments(
                                    chainId,
                                    deleteThis as Address
                                );
                                await this.deploymentsService.removeListDeployments(
                                    chainId,
                                    deleteThis as Address
                                );

                                await this.projectService.updateProjectOwner(
                                    chainId,
                                    Number(accessTimeId),
                                    owner
                                );

                                await this.portalService.removeDomainVerify(
                                    chainId,
                                    Number(accessTimeId)
                                );
                            }
                            // update last update timestamp
                            await this.cacheService.set("lastUpdateTimestamp", updateTimestamp, {
                                ttl: 0
                            });
                            lastUpdateTimestamp = updateTimestamp;
                        }
                    }
                }
                this.syncBusy = false;
            }
        } catch (err) {
            this.syncBusy = false;
            console.error("[sync]: Subgraph query failed!", err);
        }
    }

    async lastDeployments(chainId: number, address: Address): Promise<DeploymentDto[]> {
        try {
            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(LastDeploymentsDocument, {
                        owner: address,
                        limit: Number(process.env.LAST_DEPLOYMENTS_LIMIT)
                    });
                    const { accessTimes } = result as { accessTimes: DeploymentDto[] };

                    return accessTimes;
                case "ponder":
                    const presult = await this.getClient(chainId).request(
                        pLastDeploymentsDocument,
                        {
                            owner: address.toLowerCase(),
                            limit: Number(process.env.LAST_DEPLOYMENTS_LIMIT)
                        }
                    );
                    const { accessTimes: paccessTimes } = presult as {
                        accessTimes: { items: DeploymentDto[] };
                    };

                    return Array.isArray(paccessTimes?.items) ? paccessTimes.items : [];
                default:
                    return [];
            }
        } catch (_err) {
            throw new Error("[lastDeployments]: Subgraph query failed!");
        }
    }

    async listDeployments(
        chainId: number,
        address: Address,
        page?: number,
        ponderPageCursor?: string | null
    ): Promise<{ deployments: DeploymentDto[]; pageCursor: string | null }> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            const skip = page ? page * limit : 0;
            ponderPageCursor ??= null;

            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(ListDeploymentsDocument, {
                        owner: address,
                        limit,
                        skip
                    });
                    const { accessTimes } = result as { accessTimes: DeploymentDto[] };

                    return {
                        deployments: accessTimes,
                        pageCursor: null
                    };
                case "ponder":
                    const presult = await this.getClient(chainId).request(
                        pListDeploymentsDocument,
                        {
                            owner: address.toLowerCase(),
                            limit,
                            after: ponderPageCursor
                        }
                    );
                    const { accessTimes: paccessTimes } = presult as {
                        accessTimes: {
                            items: DeploymentDto[];
                            pageInfo: { endCursor: string | null };
                        };
                    };

                    return Array.isArray(paccessTimes?.items)
                        ? {
                              deployments: paccessTimes.items,
                              pageCursor: paccessTimes.pageInfo.endCursor
                          }
                        : {
                              deployments: [],
                              pageCursor: null
                          };
                default:
                    return {
                        deployments: [],
                        pageCursor: null
                    };
            }
        } catch (_err) {
            throw new Error("[listDeployments]: Subgraph query failed!");
        }
    }

    async countDeployments(chainId: number, address: Address): Promise<CountDeploymentsResponse> {
        try {
            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(CountDeploymentsDocument, {
                        owner: address
                    });
                    const { owner } = result as { owner: CountDeploymentsResponse };

                    return owner == null ? { deploymentCount: "0" } : owner;
                case "ponder":
                    const presult = await this.getClient(chainId).request(
                        pCountDeploymentsDocument,
                        {
                            owner: address.toLowerCase()
                        }
                    );
                    const { owner: powner } = presult as { owner: pCountDeploymentsResponse };

                    return powner == null
                        ? { deploymentCount: "0" }
                        : { deploymentCount: powner.deploymentCount.toString() };
                default:
                    return { deploymentCount: "0" };
            }
        } catch (_err) {
            throw new Error("[countDeployments]: Subgraph query failed!");
        }
    }

    async projectById(chainId: number, id: number) {
        try {
            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(ProjectByIdDocument, {
                        id
                    });
                    const { accessTimes } = result as { accessTimes: ProjectResponseDto[] };

                    return accessTimes;
                case "ponder":
                    const presult = await this.getClient(chainId).request(pProjectByIdDocument, {
                        id
                    });
                    const { accessTimes: paccessTimes } = presult as {
                        accessTimes: { items: ProjectResponseDto[] };
                    };

                    if (Array.isArray(paccessTimes?.items) && paccessTimes?.items.length > 0) {
                        return paccessTimes.items;
                    } else {
                        return [];
                    }
                default:
                    return [];
            }
        } catch (_err) {
            throw new Error("[projectById]: Subgraph query failed!");
        }
    }

    async rates(chainId: number): Promise<RatesDto[]> {
        try {
            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(RatesDocument, {});
                    const { factoryRates } = result as { factoryRates: RatesDto[] };

                    return factoryRates == null ? [] : factoryRates;
                case "ponder":
                    const presult = await this.getClient(chainId).request(pRatesDocument, {});
                    const { factoryRates: pfactoryRates } = presult as {
                        factoryRates: { items: RatesDto[] };
                    };

                    return Array.isArray(pfactoryRates?.items) ? pfactoryRates.items : [];
                default:
                    return [];
            }
        } catch (_err) {
            throw new Error("[rates]: Subgraph query failed!");
        }
    }

    async countProjects(chainId: number, paymentMethods?: Address[]): Promise<number> {
        try {
            paymentMethods ??= [];

            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(CountProjectsDocument, {
                        paymentMethods
                    });
                    const { accessTimes } = result as { accessTimes: CountProjectsResponse[] };

                    return paymentMethods.length == 0 || accessTimes == null
                        ? 0
                        : accessTimes.length != 0
                          ? Number(accessTimes[0].accessTimeId) + 1
                          : 0;
                case "ponder":
                    const presult = await this.getClient(chainId).request(pCountProjectsDocument, {
                        // eslint-disable-next-line prettier/prettier
                        filter: {
                            AND: paymentMethods.map((paymentMethod) => ({
                                // eslint-disable-next-line prettier/prettier
                                paymentMethods_has: paymentMethod.toLowerCase()
                            }))
                        }
                    });
                    const { accessTimes: paccessTimes } = presult as {
                        accessTimes: pCountProjectsResponse;
                    };

                    return paccessTimes?.totalCount ? paccessTimes.totalCount : 0;
                default:
                    return 0;
            }
        } catch (_err) {
            throw new Error("[countProjects]: Subgraph query failed!");
        }
    }

    async newestProjects(
        chainId: number,
        page?: number,
        paymentMethods?: Address[],
        ponderPageCursor?: string | null
    ): Promise<{ projects: NewestProjectsResponse[]; pageCursor: string | null }> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            const skip = page ? (page - 1) * limit : 0;
            paymentMethods ??= [];
            ponderPageCursor ??= null;

            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(NewestProjectsDocument, {
                        limit,
                        skip,
                        paymentMethods
                    });
                    const { accessTimes } = result as { accessTimes: NewestProjectsResponse[] };

                    return accessTimes == null
                        ? { projects: [], pageCursor: null }
                        : { projects: accessTimes, pageCursor: null };
                case "ponder":
                    const presult = await this.getClient(chainId).request(pNewestProjectsDocument, {
                        limit,
                        after: ponderPageCursor,
                        // eslint-disable-next-line prettier/prettier
                        filter: {
                            AND: paymentMethods.map((paymentMethod) => ({
                                // eslint-disable-next-line prettier/prettier
                                paymentMethods_has: paymentMethod.toLowerCase()
                            }))
                        }
                    });
                    const { accessTimes: paccessTimes } = presult as {
                        accessTimes: {
                            items: pNewestProjectsResponse[];
                            pageInfo: { endCursor: string | null };
                        };
                    };

                    if (Array.isArray(paccessTimes?.items)) {
                        return {
                            projects: paccessTimes.items.map((item) => ({
                                id: item.id,
                                accessTimeId: item.accessTimeId,
                                totalVotePoint: item.totalVotePoint,
                                totalVoteParticipantCount: item.totalVoteParticipantCount.toString()
                            })),
                            pageCursor: paccessTimes.pageInfo.endCursor
                        };
                    } else {
                        return { projects: [], pageCursor: null };
                    }
                default:
                    return { projects: [], pageCursor: null };
            }
        } catch (_err) {
            throw new Error("[newestProjects]: Subgraph query failed!");
        }
    }

    async topRatedProjects(
        chainId: number,
        page?: number,
        paymentMethods?: Address[],
        ponderPageCursor?: string | null
    ): Promise<{ projects: TopRatedProjectsResponse[]; pageCursor: string | null }> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            const skip = page ? (page - 1) * limit : 0;
            paymentMethods ??= [];
            ponderPageCursor ??= null;

            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(TopRatedProjectsDocument, {
                        limit,
                        skip,
                        paymentMethods
                    });
                    const { accessTimes } = result as { accessTimes: TopRatedProjectsResponse[] };

                    return accessTimes == null
                        ? { projects: [], pageCursor: null }
                        : { projects: accessTimes, pageCursor: null };
                case "ponder":
                    const presult = await this.getClient(chainId).request(
                        pTopRatedProjectsDocument,
                        {
                            limit,
                            after: ponderPageCursor,
                            // eslint-disable-next-line prettier/prettier
                            filter: {
                                AND: paymentMethods.map((paymentMethod) => ({
                                    // eslint-disable-next-line prettier/prettier
                                    paymentMethods_has: paymentMethod.toLowerCase()
                                }))
                            }
                        }
                    );
                    const { accessTimes: paccessTimes } = presult as {
                        accessTimes: {
                            items: pTopRatedProjectsResponse[];
                            pageInfo: { endCursor: string | null };
                        };
                    };

                    if (Array.isArray(paccessTimes?.items)) {
                        return {
                            projects: paccessTimes.items.map((item) => ({
                                id: item.id,
                                accessTimeId: item.accessTimeId,
                                totalVotePoint: item.totalVotePoint,
                                totalVoteParticipantCount: item.totalVoteParticipantCount.toString()
                            })),
                            pageCursor: paccessTimes.pageInfo.endCursor
                        };
                    } else {
                        return { projects: [], pageCursor: null };
                    }
                default:
                    return { projects: [], pageCursor: null };
            }
        } catch (_err) {
            throw new Error("[topRatedProjects]: Subgraph query failed!");
        }
    }

    async weeklyPopularProjects(
        chainId: number,
        epochWeek: number,
        page?: number,
        paymentMethods?: Address[],
        ponderPageCursor?: string | null
    ): Promise<{ projects: WeeklyPopularProjectsResponse[]; pageCursor: string | null }> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            const skip = page ? (page - 1) * limit : 0;
            paymentMethods ??= [];
            ponderPageCursor ??= null;

            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(
                        WeeklyPopularProjectsDocument,
                        {
                            epochWeek,
                            limit,
                            skip,
                            paymentMethods
                        }
                    );
                    const { accessVotes } = result as {
                        accessVotes: WeeklyPopularProjectsResponse[];
                    };

                    return accessVotes == null
                        ? { projects: [], pageCursor: null }
                        : { projects: accessVotes, pageCursor: null };
                case "ponder":
                    const filterContent: any[] = paymentMethods.map((paymentMethod) => ({
                        // eslint-disable-next-line prettier/prettier
                        accessTimePaymentMethods_has: paymentMethod.toLowerCase()
                    }));
                    // eslint-disable-next-line prettier/prettier
                    filterContent.push({ epochWeek: epochWeek.toString() });

                    const presult = await this.getClient(chainId).request(
                        pWeeklyPopularProjectsDocument,
                        {
                            limit,
                            after: ponderPageCursor,
                            filter: {
                                AND: filterContent
                            }
                        }
                    );
                    const { accessVotes: paccessVotes } = presult as {
                        accessVotes: {
                            items: pWeeklyPopularProjectsResponse[];
                            pageInfo: { endCursor: string | null };
                        };
                    };

                    if (Array.isArray(paccessVotes?.items)) {
                        return {
                            projects: paccessVotes.items.map((item) => ({
                                accessTime: {
                                    id: item.accessTimeAddress,
                                    accessTimeId: item.accessTimeId
                                },
                                participantCount: item.participantCount.toString(),
                                votePoint: item.votePoint
                            })),
                            pageCursor: paccessVotes.pageInfo.endCursor
                        };
                    } else {
                        return { projects: [], pageCursor: null };
                    }
                default:
                    return { projects: [], pageCursor: null };
            }
        } catch (_err) {
            throw new Error("[weeklyPopularProjects]: Subgraph query failed!");
        }
    }

    async projectWeeklyVote(
        chainId: number,
        epochWeek: number,
        accessTime: Address
    ): Promise<ProjectWeeklyVoteResponse[]> {
        try {
            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(
                        ProjectWeeklyVoteDocument,
                        {
                            epochWeek,
                            accessTime
                        }
                    );
                    const { accessVotes } = result as {
                        accessVotes: ProjectWeeklyVoteResponse[];
                    };

                    return accessVotes == null ? [] : accessVotes;
                case "ponder":
                    const presult = await this.getClient(chainId).request(
                        pProjectWeeklyVoteDocument,
                        {
                            epochWeek,
                            accessTime: accessTime.toLowerCase()
                        }
                    );
                    const { accessVotes: paccessVotes } = presult as {
                        accessVotes: {
                            items: pProjectWeeklyVoteResponse[];
                        };
                    };

                    if (Array.isArray(paccessVotes?.items)) {
                        return paccessVotes.items.map((item) => ({
                            participantCount: item.participantCount.toString(),
                            votePoint: item.votePoint
                        }));
                    } else {
                        return [];
                    }
                default:
                    return [];
            }
        } catch (_err) {
            throw new Error("[projectWeeklyVote]: Subgraph query failed!");
        }
    }

    async countWeeklyVoteProjects(
        chainId: number,
        epochWeek: number,
        paymentMethods?: Address[]
    ): Promise<number> {
        try {
            paymentMethods ??= [];

            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    const result = await this.getClient(chainId).request(
                        CountWeeklyVoteProjectsDocument,
                        {
                            epochWeek: epochWeek.toString(),
                            paymentMethods
                        }
                    );
                    const { weeklyVotes } = result as {
                        weeklyVotes: CountWeeklyVoteProjectsResponse;
                    };

                    return weeklyVotes == null || !weeklyVotes[0]
                        ? 0
                        : Number(weeklyVotes[0].accessTimes.length);
                case "ponder":
                    const filterContent: any[] = paymentMethods.map((paymentMethod) => ({
                        // eslint-disable-next-line prettier/prettier
                        accessTimePaymentMethods_has: paymentMethod.toLowerCase()
                    }));
                    // eslint-disable-next-line prettier/prettier
                    filterContent.push({ epochWeek: epochWeek.toString() });

                    const presult = await this.getClient(chainId).request(
                        pCountWeeklyVoteProjectsDocument,
                        {
                            filter: {
                                AND: filterContent
                            }
                        }
                    );
                    const { accessVotes: paccessVotes } = presult as {
                        accessVotes: pCountWeeklyVoteProjectsResponse;
                    };

                    return paccessVotes?.totalCount ? paccessVotes.totalCount : 0;
                default:
                    return 0;
            }
        } catch (_err) {
            throw new Error("[countProjects]: Subgraph query failed!");
        }
    }

    async statistics(
        chainId: number,
        address: Address,
        limit: number,
        type: number,
        internalType: number,
        timeGap: string
    ): Promise<StatisticsResponse[]> {
        try {
            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    return [];
                case "ponder":
                    const presult = await this.getClient(chainId).request(StatisticsDocument, {
                        address,
                        limit,
                        type,
                        internalType,
                        timeGap
                    });
                    const { statistics } = presult as {
                        statistics: {
                            items: StatisticsResponse[];
                        };
                    };

                    return statistics ? statistics.items : [];
                default:
                    return [];
            }
        } catch (_err) {
            throw new Error("[statistics]: Subgraph query failed!");
        }
    }

    async statisticById(chainId: number, id: Hash): Promise<StatisticsResponse | null> {
        try {
            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    return null;
                case "ponder":
                    const presult = await this.getClient(chainId).request(StatisticDocument, {
                        id
                    });
                    const { statistic } = presult as {
                        statistic: StatisticsResponse | null;
                    };

                    return statistic;
                default:
                    return null;
            }
        } catch (_err) {
            console.log(_err);
            throw new Error("[statisticById]: Subgraph query failed!");
        }
    }

    async accessTimeUsers(
        chainId: number,
        address: Address,
        limit: number,
        orderBy?: string,
        ponderPageCursor?: string | null
    ): Promise<{
        items: AccessTimeUsersResponse[];
        totalCount: number;
        pageCursor: string | null;
    }> {
        try {
            ponderPageCursor ??= null;
            orderBy ??= "accessTimeAddress";

            switch (this.clientTypes[chainId]) {
                case "thegraph":
                    return { items: [], totalCount: 0, pageCursor: null };
                case "ponder":
                    const presult = await this.getClient(chainId).request(AccessTimeUsersDocument, {
                        limit,
                        after: ponderPageCursor,
                        accessTimeAddress: address,
                        orderBy
                    });
                    const { accessTimeUsers } = presult as {
                        accessTimeUsers: {
                            items: AccessTimeUsersResponse[];
                            totalCount: number;
                            pageInfo: { endCursor: string | null };
                        };
                    };

                    return accessTimeUsers
                        ? {
                              items: accessTimeUsers.items,
                              totalCount: accessTimeUsers.totalCount,
                              pageCursor: accessTimeUsers.pageInfo.endCursor
                          }
                        : { items: [], totalCount: 0, pageCursor: null };
                default:
                    return { items: [], totalCount: 0, pageCursor: null };
            }
        } catch (_err) {
            console.log(_err);
            throw new Error("[accessTimeUsers]: Subgraph query failed!");
        }
    }
}
