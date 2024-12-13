import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";
import ChainIdCheckMiddleware from "src/common/middlewares/chain-id-check.middleware";

@Module({
    imports: [],
    controllers: [PortalController],
    providers: [PortalService]
})
export class PortalModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ChainIdCheckMiddleware).forRoutes(PortalController);
    }
}
