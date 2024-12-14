import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Address } from "viem";

import { ProjectResponseDto } from "./dto";

import { SubgraphService } from "../subgraph/subgraph.service";

@Injectable()
export class ProjectService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => SubgraphService))
        private readonly subgraphService: SubgraphService
    ) {}

    async getProjectById(chainId: number, id: number) {
        const dataKey = `${chainId}-project-id-${id}`;

        const cachedData = await this.cacheService.get<ProjectResponseDto>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const results = await this.subgraphService.projectById(chainId, id);

            if (!results[0]) {
                throw new HttpException(
                    {
                        errors: { message: "Project with given id is not found." }
                    },
                    HttpStatus.NOT_FOUND
                );
            }

            const project = results[0];

            await this.cacheService.set(dataKey, project, {
                ttl: Number(process.env.PROJECT_TTL)
            });

            await this.updateProjectOwner(chainId, id, project.owner);

            return project;
        }
    }

    async updateProjectOwner(chainId: number, id: number, owner: Address) {
        const dataKey = `${chainId}-project-id-${id}-owner`;
        await this.cacheService.set(dataKey, owner.toLowerCase(), {
            ttl: 0
        });
    }

    async removeProjectById(chainId: number, id: number) {
        const dataKey = `${chainId}-project-id-${id}`;
        await this.cacheService.del(dataKey);
    }
}
