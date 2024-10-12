import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Address } from "src/helpers";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { SyncResponse, CountDeploymentsResponse, RatesDocument } from "./query";
import { DeploymentService } from "../deployment/deployment.service";
import { DeploymentDto, RatesDto } from "../deployment/dto";
import { ProjectResponseDto } from "../project/dto";
import { ProjectService } from "../project/project.service";
import {
    LastDeploymentsDocument,
    ListDeploymentsDocument,
    CountDeploymentsDocument,
    SyncDocument,
    ProjectByIdDocument
} from "./query";
import { GraphQLClient } from "graphql-request";

@Injectable()
export class SubgraphService {
    private client: GraphQLClient | null = null;
    private syncBusy: boolean = false;
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => DeploymentService))
        private readonly deploymentsService: DeploymentService,
        @Inject(forwardRef(() => ProjectService))
        private readonly projectService: ProjectService
    ) {}

    private getClient() {
        if (this.client == null) {
            this.client = new GraphQLClient(process.env.SUBGRAPH_URL);
        }
        return this.client;
    }

    async sync() {
        try {
            if (!this.syncBusy) {
                this.syncBusy = true;
                const result = await this.getClient().request(SyncDocument);
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
                        await this.deploymentsService.removeLastDeployments(owner);
                        await this.deploymentsService.removeListDeployments(owner);
                        await this.projectService.removeProjectById(Number(accessTimeId));
                        // if owner transferred, clean both
                        if (lastOwner.toLowerCase() != owner.toLowerCase()) {
                            const deleteThis =
                                lastOwner != null
                                    ? lastOwner.toLowerCase()
                                    : prevOwner.toLowerCase();
                            await this.deploymentsService.removeLastDeployments(
                                deleteThis as Address
                            );
                            await this.deploymentsService.removeListDeployments(
                                deleteThis as Address
                            );

                            await this.projectService.updateProjectOwner(
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
        } catch (_err) {
            this.syncBusy = false;
            throw new Error("Subgraph query failed!");
        }
    }

    async lastDeployments(address: Address) {
        try {
            const result = await this.getClient().request(LastDeploymentsDocument, {
                owner: address,
                limit: Number(process.env.LAST_DEPLOYMENTS_LIMIT)
            });
            const { accessTimes } = result as { accessTimes: DeploymentDto[] };

            return accessTimes;
        } catch (_err) {
            throw new Error("Subgraph query failed!");
        }
    }

    async listDeployments(address: Address, page?: number) {
        try {
            const limit = Number(process.env.LIST_DEPLOYMENTS_LIMIT);
            const skip = page ? page * limit : 0;
            const result = await this.getClient().request(ListDeploymentsDocument, {
                owner: address,
                limit,
                skip
            });
            const { accessTimes } = result as { accessTimes: DeploymentDto[] };

            return accessTimes;
        } catch (_err) {
            throw new Error("Subgraph query failed!");
        }
    }

    async countDeployments(address: Address): Promise<CountDeploymentsResponse> {
        try {
            const result = await this.getClient().request(CountDeploymentsDocument, {
                owner: address
            });
            const { owner } = result as { owner: CountDeploymentsResponse };

            return owner == null ? { deploymentCount: "0" } : owner;
        } catch (_err) {
            throw new Error("Subgraph query failed!");
        }
    }

    async projectById(id: number) {
        try {
            const result = await this.getClient().request(ProjectByIdDocument, {
                id
            });
            const { accessTimes } = result as { accessTimes: ProjectResponseDto[] };

            return accessTimes;
        } catch (_err) {
            throw new Error("Subgraph query failed!");
        }
    }

    async rates(): Promise<RatesDto[]> {
        try {
            const result = await this.getClient().request(RatesDocument, {});
            const { factoryRates } = result as { factoryRates: RatesDto[] };

            return factoryRates == null ? [] : factoryRates;
        } catch (_err) {
            throw new Error("Subgraph query failed!");
        }
    }
}
