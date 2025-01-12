import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { PortalLinkController } from "./portal-link.controller";
import { PortalLinkService } from "./portal-link.service";
import { Domain, DomainSchema } from "./schemas/domain.schema";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([{ name: Domain.name, useFactory: () => DomainSchema }])
    ],
    controllers: [PortalLinkController],
    providers: [PortalLinkService]
})
export class PortalLinkModule {}
