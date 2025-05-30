import { Module, forwardRef } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

import { SubgraphService } from "./subgraph.service";
import { SubgraphConsumer } from "./subgraph.consumer";

import { DeploymentModule } from "../deployment/deployment.module";
import { ProjectModule } from "../project/project.module";
import { PortalModule } from "../portal/portal.module";
import { FactoryModule } from "../factory/factory.module";
import { StatisticModule } from "../statistic/statistic.module";
import { UserModule } from "../user/user.module";
import { AccountingModule } from "../accounting/accounting.module";
import { BullModule } from "@nestjs/bullmq";

@Module({
    imports: [
        CacheModule.registerAsync({
            useFactory: () => ({
                store: redisStore,
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD
            })
        }),
        forwardRef(() => DeploymentModule),
        forwardRef(() => ProjectModule),
        forwardRef(() => PortalModule),
        FactoryModule,
        forwardRef(() => StatisticModule),
        forwardRef(() => UserModule),
        forwardRef(() => AccountingModule),
        BullModule.registerQueueAsync({
            useFactory: () => ({
                name: "accessTime"
            })
        })
    ],
    controllers: [],
    providers: [SubgraphService, SubgraphConsumer],
    exports: [SubgraphService]
})
export class SubgraphModule {}
