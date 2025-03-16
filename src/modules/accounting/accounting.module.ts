import { forwardRef, Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

import { AccountingController } from "./accounting.controller";
import { AccountingService } from "./accounting.service";

import { SubgraphModule } from "../subgraph/subgraph.module";
import { ProjectModule } from "../project/project.module";

@Module({
    imports: [
        forwardRef(() => SubgraphModule),
        CacheModule.registerAsync({
            useFactory: () => ({
                store: redisStore,
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            })
        }),
        ProjectModule
    ],
    controllers: [AccountingController],
    providers: [AccountingService],
    exports: [AccountingService]
})
export class AccountingModule {}
