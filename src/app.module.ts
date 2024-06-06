import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import Joi from "joi";

const NODE_ENV = process.env.NODE_ENV;

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: !NODE_ENV ? ".env" : `.env.${NODE_ENV}`,
            isGlobal: true,
            validationSchema: Joi.object({
                SUBGRAPH_URL: Joi.string().required()
            })
        })
    ],
    controllers: [],
    providers: []
})
export class AppModule {}
