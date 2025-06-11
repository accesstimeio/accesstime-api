import { forwardRef, MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";

import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";
import SignatureCheckMiddleware from "src/common/middlewares/signature-check.middleware";

import { PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";
import { Project, ProjectSchema } from "./schemas/project.schema";
import { ProjectFavorite, ProjectFavoriteSchema } from "./schemas/project-favorite.schema";
import { ProjectDomain, ProjectDomainSchema } from "./schemas/portal-domain.schema";

import { SubgraphModule } from "../subgraph/subgraph.module";
import { ProjectModule } from "../project/project.module";
import { FactoryModule } from "../factory/factory.module";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            { name: Project.name, useFactory: () => ProjectSchema },
            { name: ProjectFavorite.name, useFactory: () => ProjectFavoriteSchema },
            { name: ProjectDomain.name, useFactory: () => ProjectDomainSchema }
        ]),
        forwardRef(() => SubgraphModule),
        CacheModule.registerAsync({
            useFactory: () => ({
                store: redisStore,
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            })
        }),
        ProjectModule,
        FactoryModule
    ],
    controllers: [PortalController],
    providers: [
        PortalService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard
        }
    ],
    exports: [PortalService]
})
export class PortalModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(ChainIdCheckMiddleware)
            .exclude(
                { path: "portal/featureds", method: RequestMethod.GET, version: ["1"] },
                { path: "portal/search", method: RequestMethod.GET, version: ["1"] }
            )
            .forRoutes(PortalController);
        consumer
            .apply(SignatureCheckMiddleware)
            .exclude(
                { path: "portal/featureds", method: RequestMethod.GET, version: ["1"] },
                { path: "portal/explore/:chainId", method: RequestMethod.GET, version: ["1"] },
                { path: "portal/project/:chainId/:id", method: RequestMethod.GET, version: ["1"] },
                {
                    path: "portal/project/:chainId/:id/votes",
                    method: RequestMethod.GET,
                    version: ["1"]
                },
                { path: "portal/search", method: RequestMethod.GET, version: ["1"] }
            )
            .forRoutes(PortalController);
    }
}
