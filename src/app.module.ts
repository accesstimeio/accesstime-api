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
                MONGO_URI: Joi.string().required()
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
            }
        ])
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
