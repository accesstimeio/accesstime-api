import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";
import SignatureCheckMiddleware from "src/common/middlewares/signature-check.middleware";

import { PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";
import { Project, ProjectSchema } from "./schemas/project.schema";
import { ProjectFavorite, ProjectFavoriteSchema } from "./schemas/project-favorite.schema";

import { SubgraphModule } from "../subgraph/subgraph.module";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            { name: Project.name, useFactory: () => ProjectSchema },
            { name: ProjectFavorite.name, useFactory: () => ProjectFavoriteSchema }
        ]),
        SubgraphModule
    ],
    controllers: [PortalController],
    providers: [PortalService]
})
export class PortalModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(ChainIdCheckMiddleware)
            .exclude({ path: "portal/featureds", method: RequestMethod.GET })
            .forRoutes(PortalController);
        consumer
            .apply(SignatureCheckMiddleware)
            .exclude(
                { path: "portal/featureds", method: RequestMethod.GET },
                { path: "portal/explore/:chainId", method: RequestMethod.GET },
                { path: "portal/project/:chainId/:id", method: RequestMethod.GET },
                { path: "portal/project/:chainId/:id/votes", method: RequestMethod.GET }
            )
            .forRoutes(PortalController);
    }
}
