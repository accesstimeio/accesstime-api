import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import { Address, isAddress } from "src/helpers";
import { SubgraphService } from "../subgraph/subgraph.service";
import { LastDeploymentResponseDto } from "./dto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { ListDeploymentResponseDto } from "./dto/list-deployment.dto";

@Injectable()
export class DeploymentService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => SubgraphService))
        private readonly subgraphService: SubgraphService
    ) {}

    async lastDeployments(address: Address): Promise<LastDeploymentResponseDto[]> {
        const validAddress = isAddress(address);

        if (!validAddress) {
            throw new HttpException(
                {
                    errors: { message: "Given fields is not valid." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const dataKey = `${address}-deployments-last`;

        const cachedData = await this.cacheService.get<LastDeploymentResponseDto[]>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const lastDeployments = await this.subgraphService.lastDeployments(address);

            await this.cacheService.set(dataKey, lastDeployments, {
                ttl: Number(process.env.LAST_DEPLOYMENTS_TTL)
            });

            return lastDeployments;
        }
    }

    async removeLastDeployments(address: Address) {
        const dataKey = `${address}-deployments-last`;
        await this.cacheService.del(dataKey);
    }

    async listDeployments(address: Address, page?: number): Promise<ListDeploymentResponseDto[]> {
        const validAddress = isAddress(address);
        const requestedPage = page ? page : 0;

        if (!validAddress) {
            throw new HttpException(
                {
                    errors: { message: "Given fields is not valid." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const dataKey = `${address}-deployments-page-${requestedPage}`;

        const cachedData = await this.cacheService.get<ListDeploymentResponseDto[]>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const listDeployments = await this.subgraphService.listDeployments(
                address,
                requestedPage
            );

            await this.cacheService.set(dataKey, listDeployments, {
                ttl: Number(process.env.LIST_DEPLOYMENTS_TTL)
            });

            return listDeployments;
        }
    }
}
