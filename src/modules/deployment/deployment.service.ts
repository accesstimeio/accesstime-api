import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Address, isAddress } from "src/helpers";
import { SubgraphService } from "../subgraph/subgraph.service";
import { LastDeploymentResponseDto } from "./dto";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

@Injectable()
export class DeploymentService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
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

    async listDeployments(address: Address, page?: number) {
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
        console.log(address);
        console.log(requestedPage);

        return true;
    }
}
