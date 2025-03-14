import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { hashMessage, keccak256, zeroHash } from "viem";

import { ProjectIncomesDto } from "./dto";

import { SubgraphService } from "../subgraph/subgraph.service";
import { ProjectService } from "../project/project.service";

@Injectable()
export class AccountingService {
    constructor(
        @Inject(forwardRef(() => SubgraphService))
        private readonly subgraphService: SubgraphService,
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        private readonly projectService: ProjectService
    ) {}

    async getProjectIncomes(
        chainId: number,
        id: number,
        pageCursor?: string
    ): Promise<ProjectIncomesDto> {
        const limit = Number(process.env.PAGE_ITEM_LIMIT);
        const pageCursor_ = pageCursor ? hashMessage(pageCursor) : zeroHash;
        const cacheDataKey = `${chainId}-${id}-project-accounting-${keccak256(pageCursor_)}`;
        const cachedData = await this.cacheService.get<ProjectIncomesDto>(cacheDataKey);

        if (cachedData) {
            return cachedData;
        }
        const projectFromChain = await this.projectService.getProjectById(chainId, id);

        const purchases = await this.subgraphService.purchases(
            chainId,
            projectFromChain.id,
            limit,
            pageCursor
        );

        const returnData = {
            ...purchases,
            maxPage: Math.floor(purchases.totalCount / limit)
        };

        if (purchases.items.length > 0) {
            await this.cacheService.set(cacheDataKey, returnData, {
                ttl: Number(process.env.STATISTIC_TTL)
            });

            let oldPages = await this.cacheService.get<string[]>(
                `${chainId}-${id}-project-accounting-pages`
            );
            oldPages =
                oldPages == null
                    ? [cacheDataKey]
                    : oldPages.includes(cacheDataKey)
                      ? oldPages
                      : oldPages.concat([cacheDataKey]);

            await this.cacheService.set(`${chainId}-${id}-project-accounting-pages`, oldPages, {
                ttl: Number(process.env.STATISTIC_TTL)
            });
        }

        return returnData;
    }
}
