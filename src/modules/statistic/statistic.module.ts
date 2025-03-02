import { forwardRef, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";

import { StatisticController } from "./statistic.controller";
import { StatisticService } from "./statistic.service";

import { SubgraphModule } from "../subgraph/subgraph.module";
import { ProjectModule } from "../project/project.module";

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
        }),
        ProjectModule
    ],
    controllers: [StatisticController],
    providers: [StatisticService],
    exports: [StatisticService]
})
export class StatisticModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ChainIdCheckMiddleware).forRoutes(StatisticController);
    }
}
