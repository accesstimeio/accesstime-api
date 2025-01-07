import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { MongooseModule } from "@nestjs/mongoose";
import { RouterModule } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SubgraphModule } from "./modules/subgraph/subgraph.module";
import { DeploymentModule } from "./modules/deployment/deployment.module";
import { ProjectModule } from "./modules/project/project.module";
import { CronModule } from "./modules/cron/cron.module";
import { PortalModule } from "./modules/portal/portal.module";
import { PortalCreatorModule } from "./modules/portal-creator/portal-creator.module";
import { NestMinioModule } from "nestjs-minio";

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
                MINIO_BUCKET_NAME: Joi.string().required()
            })
        }),
        ScheduleModule.forRoot(),
        MongooseModule.forRootAsync({
            useFactory: () => ({
                dbName: "api",
                uri: process.env.MONGO_URI
            })
        }),
        SubgraphModule,
        DeploymentModule,
        ProjectModule,
        CronModule,
        PortalModule,
        PortalCreatorModule,
        RouterModule.register([
            {
                path: "portal",
                module: PortalModule,
                children: [
                    {
                        path: "creator",
                        module: PortalCreatorModule
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
        })
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
