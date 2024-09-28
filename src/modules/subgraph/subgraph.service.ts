import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Address, isAsyncIterable } from "src/helpers";
import {
    execute,
    subscribe,
    CountDeploymentsDocument,
    SyncDocument,
    LastDeploymentsDocument,
    ListDeploymentsDocument,
    ProjectByIdDocument
} from "@graphclient/index";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { SyncResponse, CountDeploymentsResponse } from "./query";
import { DeploymentService } from "../deployment/deployment.service";
import { DeploymentDto } from "../deployment/dto";
import { ProjectResponseDto } from "../project/dto";
import { ProjectService } from "../project/project.service";

@Injectable()
export class SubgraphService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => DeploymentService))
        private readonly deploymentsService: DeploymentService,
        @Inject(forwardRef(() => ProjectService))
        private readonly projectService: ProjectService
    ) {
        this.sync();
    }

    async sync() {
        const results = await subscribe(SyncDocument);
        if (isAsyncIterable(results)) {
            try {
                let lastUpdateTimestamp =
                    (await this.cacheService.get<string>("lastUpdateTimestamp")) ?? "0";
                for await (const result of results) {
                    if (!result.data) {
                        for (const error of result.errors) {
                            console.error(error);
                        }
                        throw new Error("Subgraph query response is not as expected!");
                    }
                    const { accessTimes }: { accessTimes: SyncResponse[] } = result.data;
                    for (const accessTime of accessTimes) {
                        const updateTimestamp = accessTime.updateTimestamp;
                        if (BigInt(updateTimestamp) > BigInt(lastUpdateTimestamp)) {
                            // job
                            await this.deploymentsService.removeLastDeployments(accessTime.owner);
                            await this.deploymentsService.removeListDeployments(accessTime.owner);
                            await this.projectService.removeProjectById(
                                Number(accessTime.accessTimeId)
                            );
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
                }
            } catch (error) {
                console.error("Error during subscription:", error);
            } finally {
                console.log("Subscription finished");
                this.sync();
            }
        }
    }

    async lastDeployments(address: Address) {
        const result = await execute(LastDeploymentsDocument, {
            owner: address,
            limit: Number(process.env.LAST_DEPLOYMENTS_LIMIT)
        });
        if (result.errors && result.errors.length != 0) {
            throw new Error("Subgraph query failed!");
        }
        const { accessTimes }: { accessTimes: DeploymentDto[] } = result.data;

        return accessTimes;
    }

    async listDeployments(address: Address, page?: number) {
        const limit = Number(process.env.LIST_DEPLOYMENTS_LIMIT);
        const skip = page ? page * limit : 0;
        const result = await execute(ListDeploymentsDocument, {
            owner: address,
            limit,
            skip
        });
        if (result.errors && result.errors.length != 0) {
            throw new Error("Subgraph query failed!");
        }
        const { accessTimes }: { accessTimes: DeploymentDto[] } = result.data;

        return accessTimes;
    }

    async countDeployments(address: Address): Promise<CountDeploymentsResponse> {
        const result = await execute(CountDeploymentsDocument, {
            owner: address
        });
        if (result.errors && result.errors.length != 0) {
            throw new Error("Subgraph query failed!");
        }
        const { owner }: { owner: CountDeploymentsResponse } = result.data;

        return owner == null ? { deploymentCount: "0" } : owner;
    }

    async projectById(id: number) {
        const result = await execute(ProjectByIdDocument, {
            id
        });
        if (result.errors && result.errors.length != 0) {
            throw new Error("Subgraph query failed!");
        }
        const { accessTimes }: { accessTimes: ProjectResponseDto[] } = result.data;

        return accessTimes;
    }
}
