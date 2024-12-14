import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";

import { SubgraphModule } from "../subgraph/subgraph.module";
import { PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Project, ProjectSchema } from "./schemas/project.schema";
import { ProjectFavorite, ProjectFavoriteSchema } from "./schemas/project-favorite.schema";

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
        consumer.apply(ChainIdCheckMiddleware).forRoutes(PortalController);
    }
}
