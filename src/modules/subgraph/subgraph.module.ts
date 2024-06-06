import { Module } from "@nestjs/common";
import { SubgraphService } from "./subgraph.service";

@Module({
    imports: [],
    controllers: [],
    providers: [SubgraphService]
})
export class SubgraphModule {}
