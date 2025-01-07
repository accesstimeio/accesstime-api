import { MiddlewareConsumer, Module, NestModule, forwardRef } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";

import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";

import { SubgraphModule } from "../subgraph/subgraph.module";

@Module({
    imports: [
        forwardRef(() => SubgraphModule),
        CacheModule.registerAsync({
            useFactory: () => ({
                store: redisStore,
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            })
        })
    ],
    controllers: [ProjectController],
    providers: [ProjectService],
    exports: [ProjectService]
})
export class ProjectModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ChainIdCheckMiddleware).forRoutes(ProjectController);
    }
}
