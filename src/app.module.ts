import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CacheModule } from "@nestjs/cache-manager";
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
                LAST_DEPLOYMENTS_LIMIT: Joi.number().default(5)
            })
        }),
        CacheModule.register(),
        SubgraphModule,
        DeploymentModule,
        ProjectModule
    ],
    controllers: [],
    providers: []
})
export class AppModule {}
