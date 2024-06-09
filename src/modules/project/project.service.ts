import { HttpException, HttpStatus, Inject, Injectable, forwardRef } from "@nestjs/common";
import { SubgraphService } from "../subgraph/subgraph.service";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { ProjectResponseDto } from "./dto";

@Injectable()
export class ProjectService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @Inject(forwardRef(() => SubgraphService))
        private readonly subgraphService: SubgraphService
    ) {}

    async getProjectById(id: number) {
        const dataKey = `project-id-${id}`;

        const cachedData = await this.cacheService.get<ProjectResponseDto>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            const results = await this.subgraphService.projectById(id);

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
                ttl: Number(process.env.LIST_DEPLOYMENTS_TTL)
            });

            return project;
        }
    }

    async removeProjectById(id: number) {
        const dataKey = `project-id-${id}`;
        await this.cacheService.del(dataKey);
    }
}
