import { MiddlewareConsumer, Module, NestModule, forwardRef } from "@nestjs/common";
import { DeploymentController } from "./deployment.controller";
import { DeploymentService } from "./deployment.service";
import { SubgraphModule } from "../subgraph/subgraph.module";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";
import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";

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
    controllers: [DeploymentController],
    providers: [DeploymentService],
    exports: [DeploymentService]
})
export class DeploymentModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ChainIdCheckMiddleware).forRoutes(DeploymentController);
    }
}
