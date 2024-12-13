import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";

import { SubgraphModule } from "../subgraph/subgraph.module";
import { PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";

@Module({
    imports: [SubgraphModule],
    controllers: [PortalController],
    providers: [PortalService]
})
export class PortalModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ChainIdCheckMiddleware).forRoutes(PortalController);
    }
}
