import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import { Address, isAddress } from "src/helpers";
import { SubgraphService } from "../subgraph/subgraph.service";
import { LastDeploymentResponseDto, ListDeploymentResponseDto } from "./dto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

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

    async listDeployments(address: Address, page?: number): Promise<ListDeploymentResponseDto> {
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

        const deploymentCount = Number(
            (await this.subgraphService.countDeployments(address)).deploymentCount
        );
        const limit = Number(process.env.LIST_DEPLOYMENTS_LIMIT);
        const requestable =
            limit - ((requestedPage + 1) * limit - deploymentCount) > 0 ? true : false;

        if (!requestable) {
            throw new HttpException(
                {
                    errors: { message: "Requested page exceeds page limit." }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }

        const dataKey = `${address}-deployments-page-${requestedPage}`;

        const cachedData = await this.cacheService.get<ListDeploymentResponseDto>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const listDeployments = await this.subgraphService.listDeployments(
                address,
                requestedPage
            );

            const response: ListDeploymentResponseDto = {
                page: requestedPage,
                maxPage: Math.floor(deploymentCount / limit),
                deployments: listDeployments
            };

            await this.cacheService.set(dataKey, response, {
                ttl: Number(process.env.LIST_DEPLOYMENTS_TTL)
            });

            return response;
        }
    }

    async removeListDeployments(address: Address) {
        const deploymentCount = Number(
            (await this.subgraphService.countDeployments(address)).deploymentCount
        );
        const limit = Number(process.env.LIST_DEPLOYMENTS_LIMIT);
        const maxPage = Math.floor(deploymentCount / limit);

        for (let i = 0; i < maxPage + 1; i++) {
            const dataKey = `${address}-deployments-page-${i}`;
            await this.cacheService.del(dataKey);
        }
    }
}
