import { Module } from "@nestjs/common";
import { SubgraphModule } from "../subgraph/subgraph.module";
import { CronService } from "./cron.service";

@Module({
    imports: [SubgraphModule],
    providers: [CronService]
})
export class CronModule {}
