import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { MongooseModule } from "@nestjs/mongoose";
import { RouterModule } from "@nestjs/core";
import { minutes, ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from "nestjs-throttler-storage-redis";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SubgraphModule } from "./modules/subgraph/subgraph.module";
import { DeploymentModule } from "./modules/deployment/deployment.module";
import { ProjectModule } from "./modules/project/project.module";
import { PortalModule } from "./modules/portal/portal.module";
import { PortalCreatorModule } from "./modules/portal-creator/portal-creator.module";
import { NestMinioModule } from "nestjs-minio";
import { PortalLinkModule } from "./modules/portal-link/portal-link.module";
import { FactoryModule } from "./modules/factory/factory.module";
import { StatisticModule } from "./modules/statistic/statistic.module";
import { UserModule } from "./modules/user/user.module";
import { AccountingModule } from "./modules/accounting/accounting.module";
import { BullModule } from "@nestjs/bullmq";
import { FarcasterModule } from "./modules/farcaster/farcaster.module";

const NODE_ENV = process.env.NODE_ENV;

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: !NODE_ENV ? ".env" : `.env.${NODE_ENV}`,
            isGlobal: true,
            validationSchema: Joi.object({
                LAST_DEPLOYMENTS_LIMIT: Joi.number().default(5),
                LAST_DEPLOYMENTS_TTL: Joi.number().default(86400), // 1 day as seconds
                LIST_DEPLOYMENTS_TTL: Joi.number().default(86400), // 1 day as seconds
                PAGE_ITEM_LIMIT: Joi.number().default(16),
                PROJECT_TTL: Joi.number().default(172800), // 2 day as seconds
                RATES_TTL: Joi.number().default(86400), // 1 day as seconds
                STATISTIC_TTL: Joi.number().default(3600), // 1 hour as seconds
                REDIS_HOST: Joi.string().required(),
                REDIS_PORT: Joi.number().required(),
                REDIS_PASSWORD: Joi.string().required(),
                SUBGRAPH_URL: Joi.string().required(),
                MONGO_URI: Joi.string().required(),
                MINIO_ENDPOINT: Joi.string().required(),
                MINIO_PORT: Joi.number(),
                MINIO_SSL: Joi.string().required(),
                MINIO_ACCESS_KEY: Joi.string().required(),
                MINIO_SECRET_KEY: Joi.string().required(),
                MINIO_BUCKET_NAME: Joi.string().required(),
                RRDA_URL: Joi.string().required(),
                FARCASTER_APP_URL: Joi.string().required(),
                NEYNAR_API_KEY: Joi.string().required()
            })
        }),
        MongooseModule.forRootAsync({
            useFactory: () => ({
                dbName: "api",
                uri: process.env.MONGO_URI
            })
        }),
        SubgraphModule,
        DeploymentModule,
        ProjectModule,
        PortalModule,
        PortalCreatorModule,
        PortalLinkModule,
        StatisticModule,
        UserModule,
        AccountingModule,
        RouterModule.register([
            {
                path: "portal",
                module: PortalModule,
                children: [
                    {
                        path: "creator",
                        module: PortalCreatorModule
                    },
                    {
                        path: "link",
                        module: PortalLinkModule
                    }
                ]
            },
            {
                path: "dashboard",
                children: [
                    {
                        path: "deployment",
                        module: DeploymentModule
                    },
                    {
                        path: "project",
                        module: ProjectModule
                    },
                    {
                        path: "statistic",
                        module: StatisticModule
                    },
                    {
                        path: "user",
                        module: UserModule
                    },
                    {
                        path: "accounting",
                        module: AccountingModule
                    }
                ]
            },
            {
                path: "me",
                children: [
                    {
                        path: "farcaster",
                        module: FarcasterModule
                    }
                ]
            }
        ]),
        NestMinioModule.registerAsync({
            useFactory: () => ({
                isGlobal: true,
                endPoint: process.env.MINIO_ENDPOINT,
                port: process.env.MINIO_PORT && Number(process.env.MINIO_PORT),
                useSSL: process.env.MINIO_SSL == "true",
                accessKey: process.env.MINIO_ACCESS_KEY,
                secretKey: process.env.MINIO_SECRET_KEY
            })
        }),
        FactoryModule,
        ThrottlerModule.forRootAsync({
            useFactory: () => ({
                throttlers: [
                    {
                        name: "default",
                        ttl: minutes(1),
                        limit: 48
                    }
                ],
                storage: new ThrottlerStorageRedisService({
                    host: process.env.REDIS_HOST,
                    port: Number(process.env.REDIS_PORT),
                    password: process.env.REDIS_PASSWORD
                })
            })
        }),
        BullModule.forRootAsync({
            useFactory: () => ({
                defaultJobOptions: {
                    attempts: 2,
                    delay: 2000,
                    removeOnComplete: true
                },
                connection: {
                    host: process.env.REDIS_HOST,
                    port: Number(process.env.REDIS_PORT),
                    password: process.env.REDIS_PASSWORD
                }
            })
        }),
        FarcasterModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
