import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

import { PortalLinkController } from "./portal-link.controller";
import { PortalLinkService } from "./portal-link.service";
import { Domain, DomainSchema } from "./schemas/domain.schema";
import { FactoryModule } from "../factory/factory.module";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([{ name: Domain.name, useFactory: () => DomainSchema }]),
        FactoryModule,
        CacheModule.registerAsync({
            useFactory: () => ({
                store: redisStore,
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            })
        })
    ],
    controllers: [PortalLinkController],
    providers: [PortalLinkService]
})
export class PortalLinkModule {}
