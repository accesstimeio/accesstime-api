import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { hashMessage, keccak256, zeroHash } from "viem";

import { ProjectUsersDto } from "./dto";

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
        pageCursor?: string
    ): Promise<ProjectUsersDto> {
        const pageCursor_ = pageCursor ? hashMessage(pageCursor) : zeroHash;
        const cacheDataKey = `${chainId}-${id}-project-user-${keccak256(pageCursor_)}`;
        const cachedData = await this.cacheService.get<ProjectUsersDto>(cacheDataKey);

        if (cachedData) {
            return cachedData;
        }
        const projectFromChain = await this.projectService.getProjectById(chainId, id);

        const projectUsers = await this.subgraphService.accessTimeUsers(
            chainId,
            projectFromChain.id,
            pageCursor
        );

        if (projectUsers.items.length > 0) {
            await this.cacheService.set(cacheDataKey, projectUsers, {
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

        return projectUsers;
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
}
