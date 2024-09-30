import { Injectable } from "@nestjs/common";
import { SubgraphService } from "../subgraph/subgraph.service";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class CronService {
    constructor(private readonly subgraphService: SubgraphService) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    subgraphSync() {
        this.subgraphService.sync();
    }
}
