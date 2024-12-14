import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { GraphQLClient } from "graphql-request";

import { SUPPORTED_CHAIN_IDS } from "src/common";
import { Address } from "src/helpers";

import { DeploymentService } from "../deployment/deployment.service";
import { DeploymentDto, RatesDto } from "../deployment/dto";
import { ProjectResponseDto } from "../project/dto";
import { ProjectService } from "../project/project.service";
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
    ProjectWeeklyVoteResponse
} from "./query";

@Injectable()
export class SubgraphService {
    private client: { [key: number]: GraphQLClient | null } = {};
    private clientUrls: { [key: number]: string } = {};
    private syncBusy: boolean = false;
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => DeploymentService))
        private readonly deploymentsService: DeploymentService,
        @Inject(forwardRef(() => ProjectService))
        private readonly projectService: ProjectService
    ) {
        const subgraphUrls = process.env.SUBGRAPH_URL.split(",");
        SUPPORTED_CHAIN_IDS.forEach((chainId, index) => {
            this.client[chainId] = null;
            this.clientUrls[chainId] = subgraphUrls[index];
        });
    }

    private getClient(chainId: number) {
        if (this.client[chainId] == null) {
            this.client[chainId] = new GraphQLClient(this.clientUrls[chainId]);
        }
        return this.client[chainId];
    }

    async sync() {
        try {
            if (!this.syncBusy) {
                const chainId = 84532; // temporary
                this.syncBusy = true;
                const result = await this.getClient(chainId).request(SyncDocument);
                let lastUpdateTimestamp =
                    (await this.cacheService.get<string>("lastUpdateTimestamp")) ?? "0";
                const { accessTimes } = result as { accessTimes: SyncResponse[] };
                const reversedAccessTimes = accessTimes.reverse();
                for (const accessTime of reversedAccessTimes) {
                    const { owner, prevOwner, updateTimestamp, accessTimeId } = accessTime;
                    if (BigInt(updateTimestamp) > BigInt(lastUpdateTimestamp)) {
                        const lastOwner =
                            (await this.cacheService.get<Address>(
                                `project-id-${accessTimeId}-owner`
                            )) ?? null;
                        // current owner update job
                        await this.deploymentsService.removeLastDeployments(chainId, owner);
                        await this.deploymentsService.removeListDeployments(chainId, owner);
                        await this.projectService.removeProjectById(chainId, Number(accessTimeId));
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
                        }
                        // update last update timestamp
                        await this.cacheService.set("lastUpdateTimestamp", updateTimestamp, {
                            ttl: 0
                        });
                        lastUpdateTimestamp = updateTimestamp;
                    }
                }
                this.syncBusy = false;
            }
        } catch (err) {
            this.syncBusy = false;
            console.error("[sync]: Subgraph query failed!", err);
        }
    }

    async lastDeployments(chainId: number, address: Address) {
        try {
            const result = await this.getClient(chainId).request(LastDeploymentsDocument, {
                owner: address,
                limit: Number(process.env.LAST_DEPLOYMENTS_LIMIT)
            });
            const { accessTimes } = result as { accessTimes: DeploymentDto[] };

            return accessTimes;
        } catch (_err) {
            throw new Error("[lastDeployments]: Subgraph query failed!");
        }
    }

    async listDeployments(chainId: number, address: Address, page?: number) {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            const skip = page ? page * limit : 0;
            const result = await this.getClient(chainId).request(ListDeploymentsDocument, {
                owner: address,
                limit,
                skip
            });
            const { accessTimes } = result as { accessTimes: DeploymentDto[] };

            return accessTimes;
        } catch (_err) {
            throw new Error("[listDeployments]: Subgraph query failed!");
        }
    }

    async countDeployments(chainId: number, address: Address): Promise<CountDeploymentsResponse> {
        try {
            const result = await this.getClient(chainId).request(CountDeploymentsDocument, {
                owner: address
            });
            const { owner } = result as { owner: CountDeploymentsResponse };

            return owner == null ? { deploymentCount: "0" } : owner;
        } catch (_err) {
            throw new Error("[countDeployments]: Subgraph query failed!");
        }
    }

    async projectById(chainId: number, id: number) {
        try {
            const result = await this.getClient(chainId).request(ProjectByIdDocument, {
                id
            });
            const { accessTimes } = result as { accessTimes: ProjectResponseDto[] };

            return accessTimes;
        } catch (_err) {
            throw new Error("[projectById]: Subgraph query failed!");
        }
    }

    async rates(chainId: number): Promise<RatesDto[]> {
        try {
            const result = await this.getClient(chainId).request(RatesDocument, {});
            const { factoryRates } = result as { factoryRates: RatesDto[] };

            return factoryRates == null ? [] : factoryRates;
        } catch (_err) {
            throw new Error("[rates]: Subgraph query failed!");
        }
    }

    async countProjects(chainId: number): Promise<number> {
        try {
            const result = await this.getClient(chainId).request(CountDeploymentsDocument);
            const { accessTimes } = result as { accessTimes: CountProjectsResponse[] };

            return accessTimes == null
                ? 0
                : accessTimes.length != 0
                  ? Number(accessTimes[0].accessTimeId)
                  : 0;
        } catch (_err) {
            throw new Error("[countProjects]: Subgraph query failed!");
        }
    }

    async newestProjects(chainId: number, page?: number): Promise<NewestProjectsResponse[]> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            const skip = page ? page * limit : 0;
            const result = await this.getClient(chainId).request(NewestProjectsDocument, {
                limit,
                skip
            });
            const { accessTimes } = result as { accessTimes: NewestProjectsResponse[] };

            return accessTimes == null ? [] : accessTimes;
        } catch (_err) {
            throw new Error("[newestProjects]: Subgraph query failed!");
        }
    }

    async topRatedProjects(chainId: number, page?: number): Promise<TopRatedProjectsResponse[]> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            const skip = page ? page * limit : 0;
            const result = await this.getClient(chainId).request(TopRatedProjectsDocument, {
                limit,
                skip
            });
            const { accessTimes } = result as { accessTimes: TopRatedProjectsResponse[] };

            return accessTimes == null ? [] : accessTimes;
        } catch (_err) {
            throw new Error("[topRatedProjects]: Subgraph query failed!");
        }
    }

    async weeklyPopularProjects(
        chainId: number,
        epochWeek: number,
        page?: number
    ): Promise<WeeklyPopularProjectsResponse[]> {
        try {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);
            const skip = page ? page * limit : 0;
            const result = await this.getClient(chainId).request(WeeklyPopularProjectsDocument, {
                epochWeek,
                limit,
                skip
            });
            const { accessVotes } = result as { accessVotes: WeeklyPopularProjectsResponse[] };

            return accessVotes == null ? [] : accessVotes;
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
            const result = await this.getClient(chainId).request(ProjectWeeklyVoteDocument, {
                epochWeek,
                accessTime
            });
            const { accessVotes } = result as { accessVotes: ProjectWeeklyVoteResponse[] };

            return accessVotes == null ? [] : accessVotes;
        } catch (_err) {
            throw new Error("[projectWeeklyVote]: Subgraph query failed!");
        }
    }
}
