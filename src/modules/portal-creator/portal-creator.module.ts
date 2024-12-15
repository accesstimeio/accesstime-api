import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";
import SignatureCheckMiddleware from "src/common/middlewares/signature-check.middleware";

import { PortalCreatorController } from "./portal-creator.controller";
import { PortalCreatorService } from "./portal-creator.service";

import { Project, ProjectSchema } from "../portal/schemas/project.schema";
import { SubgraphModule } from "../subgraph/subgraph.module";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([{ name: Project.name, useFactory: () => ProjectSchema }]),
        SubgraphModule
    ],
    controllers: [PortalCreatorController],
    providers: [PortalCreatorService]
})
export class PortalCreatorModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ChainIdCheckMiddleware).forRoutes(PortalCreatorController);
        consumer.apply(SignatureCheckMiddleware).forRoutes(PortalCreatorController);
    }
}
