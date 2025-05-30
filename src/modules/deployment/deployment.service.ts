import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Address, isAddress } from "viem";

import { LastDeploymentResponseDto, ListDeploymentResponseDto, RatesDto } from "./dto";

import { SubgraphService } from "../subgraph/subgraph.service";

@Injectable()
export class DeploymentService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => SubgraphService))
        private readonly subgraphService: SubgraphService
    ) {}

    async lastDeployments(chainId: number, address: Address): Promise<LastDeploymentResponseDto[]> {
        const validAddress = isAddress(address);

        if (!validAddress) {
            throw new HttpException(
                {
                    errors: { message: "Given fields is not valid." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const dataKey = `${chainId}-${address.toLowerCase()}-deployments-last`;

        const cachedData = await this.cacheService.get<LastDeploymentResponseDto[]>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const lastDeployments = await this.subgraphService.lastDeployments(chainId, address);

            await this.cacheService.set(dataKey, lastDeployments, {
                ttl: Number(process.env.LAST_DEPLOYMENTS_TTL)
            });

            return lastDeployments;
        }
    }

    async removeLastDeployments(chainId: number, address: Address) {
        const dataKey = `${chainId}-${address.toLowerCase()}-deployments-last`;
        await this.cacheService.del(dataKey);
    }

    async listDeployments(
        chainId: number,
        address: Address,
        page?: number
    ): Promise<ListDeploymentResponseDto> {
        const validAddress = isAddress(address);

        if (!validAddress) {
            throw new HttpException(
                {
                    errors: { message: "Given fields is not valid." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const dataKey = `${chainId}-${address.toLowerCase()}-deployments-page-${page ? page : 0}`;

        const cachedData = await this.cacheService.get<ListDeploymentResponseDto>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const limit = Number(process.env.PAGE_ITEM_LIMIT);

            const apiResult = await this.subgraphService.apiListDeployments(chainId, address, page);
            const deploymentCount = Number(apiResult.totalCount);

            const flooredMaxPage = Math.floor(deploymentCount / limit);
            const maxPage = deploymentCount % limit > 0 ? flooredMaxPage + 1 : flooredMaxPage;

            const response: ListDeploymentResponseDto = {
                maxPage,
                deployments: apiResult.deployments,
                totalCount: deploymentCount
            };

            await this.cacheService.set(dataKey, response, {
                ttl: Number(process.env.LIST_DEPLOYMENTS_TTL)
            });

            return response;
        }
    }

    async removeListDeployments(chainId: number, address: Address) {
        const deploymentCount = await this.subgraphService.countDeployments(chainId, address);
        const limit = Number(process.env.PAGE_ITEM_LIMIT);
        const flooredMaxPage = Math.floor(deploymentCount / limit);
        const maxPage = deploymentCount % limit > 0 ? flooredMaxPage + 1 : flooredMaxPage;

        for (let i = 0; i < maxPage; i++) {
            const dataKey = `${chainId}-${address.toLowerCase()}-deployments-page-${i}`;
            await this.cacheService.del(dataKey);
        }
    }

    async rates(chainId: number): Promise<RatesDto[]> {
        const dataKey = `${chainId}-factory-rates`;

        const cachedData = await this.cacheService.get<RatesDto[]>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const rates = await this.subgraphService.rates(chainId);

            await this.cacheService.set(dataKey, rates, {
                ttl: Number(process.env.RATES_TTL)
            });

            return rates;
        }
    }
}
