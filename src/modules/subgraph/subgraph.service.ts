import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Address } from "src/helpers";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { SyncResponse, CountDeploymentsResponse } from "./query";
import { DeploymentService } from "../deployment/deployment.service";
import { DeploymentDto } from "../deployment/dto";
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
            const result = await this.getClient().request(SyncDocument);
            let lastUpdateTimestamp =
                (await this.cacheService.get<string>("lastUpdateTimestamp")) ?? "0";
            const { accessTimes } = result as { accessTimes: SyncResponse[] };
            for (const accessTime of accessTimes) {
                const updateTimestamp = accessTime.updateTimestamp;
                if (BigInt(updateTimestamp) > BigInt(lastUpdateTimestamp)) {
                    // job
                    await this.deploymentsService.removeLastDeployments(accessTime.owner);
                    await this.deploymentsService.removeListDeployments(accessTime.owner);
                    await this.projectService.removeProjectById(Number(accessTime.accessTimeId));
                    // update last update timestamp
                    await this.cacheService.set(
                        "lastUpdateTimestamp",
                        accessTimes[0].updateTimestamp,
                        {
                            ttl: 0
                        }
                    );
                    lastUpdateTimestamp = updateTimestamp;
                }
            }
        } catch (_err) {
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
}
