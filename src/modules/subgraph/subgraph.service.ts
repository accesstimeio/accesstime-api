import { Inject, Injectable, OnModuleInit, forwardRef } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { GraphQLClient } from "graphql-request";
import { Address, Hash } from "viem";
import {
    Chain,
    extractDomain,
    StatisticTimeGap,
    SUPPORTED_CHAIN,
    SUPPORTED_SORT_TYPE
} from "@accesstimeio/accesstime-common";

import {
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
    CountWeeklyVoteProjectsResponse,
    StatisticsResponse,
    StatisticsDocument,
    StatisticDocument,
    AccessTimeUsersDocument,
    AccessTimeUsersResponse,
    PurchasesResponse,
    PurchasesDocument,
    SyncStatisticsDocument,
    SyncStatisticsResponse,
    SyncResponse
} from "./query";

import { DeploymentService } from "../deployment/deployment.service";
import { DeploymentDto, RatesDto } from "../deployment/dto";
import { ProjectResponseDto } from "../project/dto";
import { ProjectService } from "../project/project.service";
import { PortalService } from "../portal/portal.service";
import { FactoryService } from "../factory/factory.service";
import { StatisticService } from "../statistic/statistic.service";
import { UserService } from "../user/user.service";
import { AccountingService } from "../accounting/accounting.service";

@Injectable()
export class SubgraphService implements OnModuleInit {
    private client: GraphQLClient;
    private syncBusy: boolean = false;
    private syncStatisticsBusy: boolean = false;
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
        private readonly statisticService: StatisticService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        @Inject(forwardRef(() => AccountingService))
        private readonly accountingService: AccountingService
    ) {}

    onModuleInit() {
        this.client = new GraphQLClient(process.env.SUBGRAPH_URL);
    }

    private async syncCall(chainId: SUPPORTED_CHAIN) {
        const result = await this.client.request(SyncDocument, { chainId });
        const { accessTimes } = result as {
            accessTimes: { items: SyncResponse[] };
        };
        return Array.isArray(accessTimes?.items) ? accessTimes.items.reverse() : [];
    }

    private async syncStatisticsCall(chainId: SUPPORTED_CHAIN, pageCursor?: string) {
        const limit = Number(process.env.PAGE_ITEM_LIMIT);
        const timeIndex = (BigInt(Date.now()) / 1000n / BigInt(StatisticTimeGap.WEEK)).toString();
        pageCursor ??= null;

        const result = await this.client.request(SyncStatisticsDocument, {
            limit,
            after: pageCursor,
            timeIndex,
            chainId
        });
        const { statistics } = result as {
            statistics: {
                items: SyncStatisticsResponse[];
                totalCount: number;
                pageInfo: { endCursor: string | null; hasNextPage: boolean };
            };
        };
        return statistics
            ? {
                  items: statistics.items,
                  totalCount: statistics.totalCount,
                  pageCursor: statistics.pageInfo.endCursor,
                  hasNextPage: statistics.pageInfo.hasNextPage
              }
            : { items: [], totalCount: 0, pageCursor: null, hasNextPage: false };
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

    async syncStatistics() {
        try {
            if (!this.syncStatisticsBusy) {
                this.syncStatisticsBusy = true;
                for (let i = 0; i < Chain.ids.length; i++) {
                    const chainId = Chain.ids[i];
                    const factory = this.factoryService.client[chainId];

                    let pageCursor: string | undefined = undefined;
                    let endLoop: boolean = true;

                    const clearQueue: number[] = [];

                    while (endLoop) {
                        const statistics = await this.syncStatisticsCall(chainId, pageCursor);

                        for (let i2 = 0; i2 < statistics.items.length; i2++) {
                            const statistic = statistics.items[i2];
                            const [, id, , , , ,] = await factory.read.deploymentDetails([
                                statistic.address
                            ]);
                            const projectId = Number(id.toString());
                            const statisticCacheKey = `statistic-sync-${statistic.id}`;
                            const lastSaved =
                                await this.cacheService.get<string>(statisticCacheKey);

                            if (lastSaved && lastSaved != statistic.value) {
                                if (!clearQueue.includes(projectId)) {
                                    clearQueue.push(projectId);
                                }
                            }

                            await this.cacheService.set(statisticCacheKey, statistic.value, {
                                ttl: Number(process.env.STATISTIC_TTL) * 2
                            });
                        }

                        pageCursor = statistics.pageCursor;
                        endLoop = statistics.hasNextPage;
                    }

                    for (let i3 = 0; i3 < clearQueue.length; i3++) {
                        const projectId = clearQueue[i3];

                        await this.statisticService.removeProjectStatistics(chainId, projectId);
                        await this.userService.removeProjectUsers(chainId, projectId);
                        await this.accountingService.removeProjectIncomes(chainId, projectId);
                    }
                }
                this.syncStatisticsBusy = false;
            }
        } catch (err) {
            this.syncStatisticsBusy = false;
            console.error("[syncStatistics]: Subgraph query failed!", err);
        }
    }

    async lastDeployments(chainId: number, address: Address): Promise<DeploymentDto[]> {
        try {
            const result = await this.client.request(LastDeploymentsDocument, {
                owner: address.toLowerCase(),
                limit: Number(process.env.LAST_DEPLOYMENTS_LIMIT),
                chainId
            });
            const { accessTimes } = result as {
                accessTimes: { items: DeploymentDto[] };
            };

            return Array.isArray(accessTimes?.items) ? accessTimes.items : [];
        } catch (_err) {
            throw new Error("[lastDeployments]: Subgraph query failed!");
        }
    }

    async listDeployments(
        chainId: number,
        address: Address,
        ponderPageCursor?: string | null
    ): Promise<{ deployments: DeploymentDto[]; pageCursor: string | null }> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            ponderPageCursor ??= null;

            const result = await this.client.request(ListDeploymentsDocument, {
                owner: address.toLowerCase(),
                limit,
                after: ponderPageCursor,
                chainId
            });
            const { accessTimes } = result as {
                accessTimes: {
                    items: DeploymentDto[];
                    pageInfo: { endCursor: string | null };
                };
            };

            return Array.isArray(accessTimes?.items)
                ? {
                      deployments: accessTimes.items,
                      pageCursor: accessTimes.pageInfo.endCursor
                  }
                : {
                      deployments: [],
                      pageCursor: null
                  };
        } catch (_err) {
            throw new Error("[listDeployments]: Subgraph query failed!");
        }
    }

    async countDeployments(chainId: number, address: Address): Promise<number> {
        try {
            const result = await this.client.request(CountDeploymentsDocument, {
                owner: address.toLowerCase(),
                chainId
            });
            const { owner } = result as { owner: CountDeploymentsResponse };

            return owner == null ? 0 : owner.deploymentCount;
        } catch (_err) {
            throw new Error("[countDeployments]: Subgraph query failed!");
        }
    }

    async projectById(chainId: number, id: number) {
        try {
            const result = await this.client.request(ProjectByIdDocument, {
                id,
                chainId
            });
            const { accessTimes } = result as {
                accessTimes: { items: ProjectResponseDto[] };
            };

            if (Array.isArray(accessTimes?.items) && accessTimes?.items.length > 0) {
                return accessTimes.items;
            } else {
                return [];
            }
        } catch (_err) {
            throw new Error("[projectById]: Subgraph query failed!");
        }
    }

    async rates(chainId: number): Promise<RatesDto[]> {
        try {
            const result = await this.client.request(RatesDocument, { chainId });
            const { factoryRates } = result as {
                factoryRates: { items: RatesDto[] };
            };

            return Array.isArray(factoryRates?.items) ? factoryRates.items : [];
        } catch (_err) {
            throw new Error("[rates]: Subgraph query failed!");
        }
    }

    async countProjects(chainId: number, paymentMethods?: Address[]): Promise<number> {
        try {
            paymentMethods ??= [];

            const result = await this.client.request(CountProjectsDocument, {
                // eslint-disable-next-line prettier/prettier
                filter: {
                    chainId,
                    AND: paymentMethods.map((paymentMethod) => ({
                        // eslint-disable-next-line prettier/prettier
                        paymentMethods_has: paymentMethod.toLowerCase()
                    }))
                }
            });
            const { accessTimes } = result as {
                accessTimes: CountProjectsResponse;
            };

            return accessTimes?.totalCount ? accessTimes.totalCount : 0;
        } catch (_err) {
            throw new Error("[countProjects]: Subgraph query failed!");
        }
    }

    async newestProjects(
        chainId: number,
        paymentMethods?: Address[],
        ponderPageCursor?: string | null
    ): Promise<{ projects: NewestProjectsResponse[]; pageCursor: string | null }> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            paymentMethods ??= [];
            ponderPageCursor ??= null;

            const result = await this.client.request(NewestProjectsDocument, {
                limit,
                after: ponderPageCursor,
                // eslint-disable-next-line prettier/prettier
                filter: {
                    chainId,
                    AND: paymentMethods.map((paymentMethod) => ({
                        // eslint-disable-next-line prettier/prettier
                        paymentMethods_has: paymentMethod.toLowerCase()
                    }))
                }
            });
            const { accessTimes } = result as {
                accessTimes: {
                    items: NewestProjectsResponse[];
                    pageInfo: { endCursor: string | null };
                };
            };

            if (Array.isArray(accessTimes?.items)) {
                return {
                    projects: accessTimes.items.map((item) => ({
                        id: item.id,
                        accessTimeId: item.accessTimeId,
                        totalVotePoint: item.totalVotePoint,
                        totalVoteParticipantCount: item.totalVoteParticipantCount
                    })),
                    pageCursor: accessTimes.pageInfo.endCursor
                };
            } else {
                return { projects: [], pageCursor: null };
            }
        } catch (_err) {
            throw new Error("[newestProjects]: Subgraph query failed!");
        }
    }

    async topRatedProjects(
        chainId: number,
        paymentMethods?: Address[],
        ponderPageCursor?: string | null
    ): Promise<{ projects: TopRatedProjectsResponse[]; pageCursor: string | null }> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            paymentMethods ??= [];
            ponderPageCursor ??= null;

            const result = await this.client.request(TopRatedProjectsDocument, {
                limit,
                after: ponderPageCursor,
                // eslint-disable-next-line prettier/prettier
                filter: {
                    chainId,
                    AND: paymentMethods.map((paymentMethod) => ({
                        // eslint-disable-next-line prettier/prettier
                        paymentMethods_has: paymentMethod.toLowerCase()
                    }))
                }
            });
            const { accessTimes } = result as {
                accessTimes: {
                    items: TopRatedProjectsResponse[];
                    pageInfo: { endCursor: string | null };
                };
            };

            if (Array.isArray(accessTimes?.items)) {
                return {
                    projects: accessTimes.items.map((item) => ({
                        id: item.id,
                        accessTimeId: item.accessTimeId,
                        totalVotePoint: item.totalVotePoint,
                        totalVoteParticipantCount: item.totalVoteParticipantCount
                    })),
                    pageCursor: accessTimes.pageInfo.endCursor
                };
            } else {
                return { projects: [], pageCursor: null };
            }
        } catch (_err) {
            throw new Error("[topRatedProjects]: Subgraph query failed!");
        }
    }

    async weeklyPopularProjects(
        chainId: number,
        epochWeek: number,
        paymentMethods?: Address[],
        ponderPageCursor?: string | null
    ): Promise<{ projects: WeeklyPopularProjectsResponse[]; pageCursor: string | null }> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            paymentMethods ??= [];
            ponderPageCursor ??= null;

            const filterContent: any[] = paymentMethods.map((paymentMethod) => ({
                // eslint-disable-next-line prettier/prettier
                accessTimePaymentMethods_has: paymentMethod.toLowerCase()
            }));
            // eslint-disable-next-line prettier/prettier
            filterContent.push({ epochWeek: epochWeek.toString() });

            const presult = await this.client.request(WeeklyPopularProjectsDocument, {
                limit,
                after: ponderPageCursor,
                filter: {
                    chainId,
                    AND: filterContent
                }
            });
            const { accessVotes: accessVotes } = presult as {
                accessVotes: {
                    items: WeeklyPopularProjectsResponse[];
                    pageInfo: { endCursor: string | null };
                };
            };

            if (Array.isArray(accessVotes?.items)) {
                return {
                    projects: accessVotes.items,
                    pageCursor: accessVotes.pageInfo.endCursor
                };
            } else {
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
            const result = await this.client.request(ProjectWeeklyVoteDocument, {
                epochWeek,
                accessTime: accessTime.toLowerCase(),
                chainId
            });
            const { accessVotes } = result as {
                accessVotes: {
                    items: ProjectWeeklyVoteResponse[];
                };
            };

            if (Array.isArray(accessVotes?.items)) {
                return accessVotes.items;
            } else {
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

            const filterContent: any[] = paymentMethods.map((paymentMethod) => ({
                // eslint-disable-next-line prettier/prettier
                accessTimePaymentMethods_has: paymentMethod.toLowerCase()
            }));
            // eslint-disable-next-line prettier/prettier
            filterContent.push({ epochWeek: epochWeek.toString() });

            const presult = await this.client.request(CountWeeklyVoteProjectsDocument, {
                filter: {
                    chainId,
                    AND: filterContent
                }
            });
            const { accessVotes } = presult as {
                accessVotes: CountWeeklyVoteProjectsResponse;
            };

            return accessVotes?.totalCount ? accessVotes.totalCount : 0;
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
            const result = await this.client.request(StatisticsDocument, {
                address,
                limit,
                type,
                internalType,
                timeGap,
                chainId
            });
            const { statistics } = result as {
                statistics: {
                    items: StatisticsResponse[];
                };
            };

            return statistics ? statistics.items : [];
        } catch (_err) {
            throw new Error("[statistics]: Subgraph query failed!");
        }
    }

    async statisticById(chainId: number, id: Hash): Promise<StatisticsResponse | null> {
        try {
            const result = await this.client.request(StatisticDocument, {
                id,
                chainId
            });
            const { statistic } = result as {
                statistic: StatisticsResponse | null;
            };

            return statistic;
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

            const result = await this.client.request(AccessTimeUsersDocument, {
                limit,
                after: ponderPageCursor,
                accessTimeAddress: address,
                orderBy,
                chainId
            });
            const { accessTimeUsers } = result as {
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
        } catch (_err) {
            console.log(_err);
            throw new Error("[accessTimeUsers]: Subgraph query failed!");
        }
    }

    async purchases(
        chainId: number,
        address: Address,
        limit: number,
        ponderPageCursor?: string | null
    ): Promise<{
        items: PurchasesResponse[];
        totalCount: number;
        pageCursor: string | null;
    }> {
        try {
            ponderPageCursor ??= null;

            const result = await this.client.request(PurchasesDocument, {
                limit,
                after: ponderPageCursor,
                accessTimeAddress: address,
                chainId
            });
            const { purchases } = result as {
                purchases: {
                    items: PurchasesResponse[];
                    totalCount: number;
                    pageInfo: { endCursor: string | null };
                };
            };

            return purchases
                ? {
                      items: purchases.items,
                      totalCount: purchases.totalCount,
                      pageCursor: purchases.pageInfo.endCursor
                  }
                : { items: [], totalCount: 0, pageCursor: null };
        } catch (_err) {
            console.log(_err);
            throw new Error("[purchases]: Subgraph query failed!");
        }
    }

    async apiListDeployments(
        chainId: number,
        address: Address,
        page?: number
    ): Promise<{ deployments: DeploymentDto[]; totalCount: string }> {
        try {
            const query = new URLSearchParams();
            const limit = Number(process.env.PAGE_ITEM_LIMIT);

            query.append("owner", address);
            query.append("limit", limit.toString());
            if (page) {
                query.append("page", page.toString());
            }

            const result: { deployments: DeploymentDto[]; totalCount: string } = await (
                await fetch(`${process.env.SUBGRAPH_URL}/deployment/${chainId}?${query.toString()}`)
            ).json();

            return result;
        } catch (_err) {
            throw new Error("[apiListDeployments]: Ponder API query failed!");
        }
    }

    async apiPortalExplore(
        chainId: number,
        page?: number,
        sort?: SUPPORTED_SORT_TYPE,
        paymentMethods?: Address[]
    ): Promise<{
        projects: {
            id: Address;
            accessTimeId: number;
            totalVotePoint: number;
            totalVoteParticipantCount: number;
        }[];
        totalCount: string;
    }> {
        try {
            const query = new URLSearchParams();
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            paymentMethods ??= [];

            query.append("limit", limit.toString());
            if (paymentMethods.length > 0) {
                query.append("paymentMethods", paymentMethods.join(","));
            }
            if (page) {
                query.append("page", page.toString());
            }
            if (sort) {
                query.append("sort", sort);
            }

            const result: {
                projects: {
                    id: Address;
                    accessTimeId: number;
                    totalVotePoint: number;
                    totalVoteParticipantCount: number;
                }[];
                totalCount: string;
            } = await (
                await fetch(
                    `${process.env.SUBGRAPH_URL}/portal/explore/${chainId}?${query.toString()}`
                )
            ).json();

            return result;
        } catch (_err) {
            throw new Error("[apiPortalExplore]: Ponder API query failed!");
        }
    }
}
