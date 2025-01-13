import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { PortalLinkController } from "./portal-link.controller";
import { PortalLinkService } from "./portal-link.service";
import { Domain, DomainSchema } from "./schemas/domain.schema";
import { FactoryModule } from "../factory/factory.module";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([{ name: Domain.name, useFactory: () => DomainSchema }]),
        FactoryModule
    ],
    controllers: [PortalLinkController],
    providers: [PortalLinkService]
})
export class PortalLinkModule {}
