import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { SubgraphService } from "../subgraph/subgraph.service";

@Injectable()
export class CronService {
    constructor(private readonly subgraphService: SubgraphService) {}

    @Cron(CronExpression.EVERY_5_SECONDS)
    subgraphSync() {
        this.subgraphService.sync();
    }
}
