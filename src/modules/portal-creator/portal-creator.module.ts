import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";
import SignatureCheckMiddleware from "src/common/middlewares/signature-check.middleware";

import { PortalCreatorController } from "./portal-creator.controller";
import { PortalCreatorService } from "./portal-creator.service";

@Module({
    imports: [],
    controllers: [PortalCreatorController],
    providers: [PortalCreatorService]
})
export class PortalCreatorModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ChainIdCheckMiddleware).forRoutes(PortalCreatorController);
        consumer.apply(SignatureCheckMiddleware).forRoutes(PortalCreatorController);
    }
}
