import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Address, isAsyncIterable } from "src/helpers";
import { execute, subscribe } from "@graphclient/index";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import {
    COUNT_DEPLOYMENTS_QUERY,
    CountDeploymentsResponse,
    LAST_DEPLOYMENTS_QUERY,
    LIST_DEPLOYMENTS_QUERY,
    SYNC_QUERY,
    SyncResponse
} from "./query";
import { DeploymentService } from "../deployment/deployment.service";
import { DeploymentDto } from "../deployment/dto";

@Injectable()
export class SubgraphService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => DeploymentService))
        private readonly deploymentsService: DeploymentService
    ) {
        this.sync();
    }

    async sync() {
        const results = await subscribe(SYNC_QUERY);
        if (isAsyncIterable(results)) {
            try {
                let lastUpdateTimestamp =
                    (await this.cacheService.get<string>("lastUpdateTimestamp")) ?? "0";
                for await (const result of results) {
                    const { accessTimes }: { accessTimes: SyncResponse[] } = result.data;
                    for (const accessTime of accessTimes) {
                        const updateTimestamp = accessTime.updateTimestamp;
                        if (BigInt(updateTimestamp) > BigInt(lastUpdateTimestamp)) {
                            // job
                            await this.deploymentsService.removeLastDeployments(accessTime.owner);
                            await this.deploymentsService.removeListDeployments(accessTime.owner);
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
            }
        }
    }

    async lastDeployments(address: Address) {
        const result = await execute(LAST_DEPLOYMENTS_QUERY, {
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
        const result = await execute(LIST_DEPLOYMENTS_QUERY, {
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

    async countDeployments(address: Address) {
        const result = await execute(COUNT_DEPLOYMENTS_QUERY, {
            owner: address
        });
        if (result.errors && result.errors.length != 0) {
            throw new Error("Subgraph query failed!");
        }
        const { owner }: { owner: CountDeploymentsResponse } = result.data;

        return owner;
    }
}
