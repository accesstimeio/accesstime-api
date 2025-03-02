import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";

import { StatisticService, StatisticTimeGap } from "./statistic.service";
import { Address } from "viem";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
export class StatisticController {
    constructor(private readonly statisticService: StatisticService) {}

    // todo: api-responses
    @Get("/:chainId/:id")
    getProjectTotalSoldAccessTime(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectTotalSoldAccessTime(chainId, id, timeGap);
    }

    // todo: api-responses
    @Get("/:chainId/:id")
    getProjectTotalUser(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectTotalUser(chainId, id, timeGap);
    }

    // todo: api-responses
    @Get("/:chainId/:id")
    getProjectTotalVotes(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectTotalVotes(chainId, id, timeGap);
    }

    // todo: api-responses
    @Get("/:chainId/:id")
    getProjectTotalIncome(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("paymentMethod") paymentMethod: Address,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectTotalIncome(chainId, id, paymentMethod, timeGap);
    }

    // todo: api-responses
    @Get("/:chainId/:id")
    getProjectNewUser(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectNewUser(chainId, id, timeGap);
    }
}
