import { Module } from "@nestjs/common";

import { CronService } from "./cron.service";

import { SubgraphModule } from "../subgraph/subgraph.module";

@Module({
    imports: [SubgraphModule],
    providers: [CronService]
})
export class CronModule {}
