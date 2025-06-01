import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Address, hashMessage, keccak256, zeroHash } from "viem";

import { ProjectUsersDto, UserSubscriptionsResponseDto } from "./dto";

import { SubgraphService } from "../subgraph/subgraph.service";
import { ProjectService } from "../project/project.service";

@Injectable()
export class UserService {
    constructor(
        @Inject(forwardRef(() => SubgraphService))
        private readonly subgraphService: SubgraphService,
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        private readonly projectService: ProjectService
    ) {}

    async getProjectUsers(
        chainId: number,
        id: number,
        orderBy?: string,
        pageCursor?: string
    ): Promise<ProjectUsersDto> {
        if (orderBy && !["totalPurchasedTime", "endTime", "accessTimeAddress"].includes(orderBy)) {
            throw new HttpException(
                {
                    errors: { message: "Invalid orderBy type." }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }
        orderBy ??= "accessTimeAddress";

        const limit = Number(process.env.PAGE_ITEM_LIMIT);
        const pageCursor_ = pageCursor ? hashMessage(pageCursor) : zeroHash;
        const cacheDataKey = `${chainId}-${id}-project-user-orderBy_${orderBy}-${keccak256(pageCursor_)}`;
        const cachedData = await this.cacheService.get<ProjectUsersDto>(cacheDataKey);

        if (cachedData) {
            return cachedData;
        }
        const projectFromChain = await this.projectService.getProjectById(chainId, id);

        const projectUsers = await this.subgraphService.accessTimeUsers(
            chainId,
            projectFromChain.id,
            limit,
            orderBy,
            pageCursor
        );

        const flooredMaxPage = Math.floor(projectUsers.totalCount / limit);
        const maxPage = projectUsers.totalCount % limit > 0 ? flooredMaxPage + 1 : flooredMaxPage;

        const returnData = {
            ...projectUsers,
            maxPage
        };

        if (projectUsers.items.length > 0) {
            await this.cacheService.set(cacheDataKey, returnData, {
                ttl: Number(process.env.STATISTIC_TTL)
            });

            let oldPages = await this.cacheService.get<string[]>(
                `${chainId}-${id}-project-user-pages`
            );
            oldPages =
                oldPages == null
                    ? [cacheDataKey]
                    : oldPages.includes(cacheDataKey)
                      ? oldPages
                      : oldPages.concat([cacheDataKey]);

            await this.cacheService.set(`${chainId}-${id}-project-user-pages`, oldPages, {
                ttl: Number(process.env.STATISTIC_TTL)
            });
        }

        return returnData;
    }

    async removeProjectUsers(chainId: number, id: number) {
        const pages = await this.cacheService.get<string[]>(`${chainId}-${id}-project-user-pages`);

        if (pages) {
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                await this.cacheService.del(page);
            }

            await this.cacheService.del(`${chainId}-${id}-project-user-pages`);
        }
    }

    async getUserSubscriptions(address: Address, page?: number) {
        const limit = Number(process.env.PAGE_ITEM_LIMIT);

        const apiResult = await this.subgraphService.apiUserSubscriptions(address, page);
        const deploymentCount = Number(apiResult.totalCount);

        const flooredMaxPage = Math.floor(deploymentCount / limit);
        const maxPage = deploymentCount % limit > 0 ? flooredMaxPage + 1 : flooredMaxPage;

        const response: UserSubscriptionsResponseDto = {
            maxPage,
            subscriptions: apiResult.subscriptions,
            totalCount: deploymentCount
        };

        return response;
    }

    getUserSubscription(address: Address, chainId: number, accessTimeAddress: Address) {
        return this.subgraphService.apiUserSubscription(address, chainId, accessTimeAddress);
    }
}
