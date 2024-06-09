import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

import { SubgraphModule } from "./modules/subgraph/subgraph.module";
import { DeploymentModule } from "./modules/deployment/deployment.module";
import { ProjectModule } from "./modules/project/project.module";

const NODE_ENV = process.env.NODE_ENV;

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: !NODE_ENV ? ".env" : `.env.${NODE_ENV}`,
            isGlobal: true,
            validationSchema: Joi.object({
                SUBGRAPH_URL: Joi.string().required(),
                LAST_DEPLOYMENTS_LIMIT: Joi.number().default(5),
                LAST_DEPLOYMENTS_TTL: Joi.number().default(86400), // 1 day as seconds
                LIST_DEPLOYMENTS_LIMIT: Joi.number().default(15),
                LIST_DEPLOYMENTS_TTL: Joi.number().default(86400), // 1 day as seconds
                PROJECT_TTL: Joi.number().default(172800), // 2 day as seconds
                REDIS_HOST: Joi.string().required(),
                REDIS_PORT: Joi.number().required(),
                REDIS_PASSWORD: Joi.string().required()
            })
        }),
        SubgraphModule,
        DeploymentModule,
        ProjectModule
    ],
    controllers: [],
    providers: []
})
export class AppModule {}
