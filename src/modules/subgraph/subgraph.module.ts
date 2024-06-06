import { Module } from "@nestjs/common";
import { SubgraphService } from "./subgraph.service";
import { GraphQLRequestModule } from "@golevelup/nestjs-graphql-request";

@Module({
    imports: [
        GraphQLRequestModule.forRootAsync(GraphQLRequestModule, {
            useFactory: () => ({
                endpoint: process.env.SUBGRAPH_URL
            })
        })
    ],
    controllers: [],
    providers: [SubgraphService],
    exports: [SubgraphService]
})
export class SubgraphModule {}
