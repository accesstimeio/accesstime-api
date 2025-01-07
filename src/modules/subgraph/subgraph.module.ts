import { Module, forwardRef } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

import { SubgraphService } from "./subgraph.service";

import { DeploymentModule } from "../deployment/deployment.module";
import { ProjectModule } from "../project/project.module";

@Module({
    imports: [
        CacheModule.registerAsync({
            useFactory: () => ({
                store: redisStore,
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            })
        }),
        forwardRef(() => DeploymentModule),
        forwardRef(() => ProjectModule)
    ],
    controllers: [],
    providers: [SubgraphService],
    exports: [SubgraphService]
})
export class SubgraphModule {}
