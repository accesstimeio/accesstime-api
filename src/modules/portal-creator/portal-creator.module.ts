import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { PortalCreatorController } from "./portal-creator.controller";
import { PortalCreatorService } from "./portal-creator.service";
import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";

@Module({
    imports: [],
    controllers: [PortalCreatorController],
    providers: [PortalCreatorService]
})
export class PortalCreatorModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ChainIdCheckMiddleware).forRoutes(PortalCreatorController);
    }
}
