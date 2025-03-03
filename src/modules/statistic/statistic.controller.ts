import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { Address } from "viem";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";

import { StatisticService, StatisticTimeGap } from "./statistic.service";
import { StatisticsResponseDto } from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
export class StatisticController {
    constructor(private readonly statisticService: StatisticService) {}

    @ApiResponse({
        type: StatisticsResponseDto,
        isArray: true
    })
    @ApiQuery({
        name: "timeGap",
        type: Number,
        required: false
    })
    @Get("/:chainId/:id/total-sold-accesstime")
    getProjectTotalSoldAccessTime(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectTotalSoldAccessTime(chainId, id, timeGap);
    }

    @ApiResponse({
        type: StatisticsResponseDto,
        isArray: true
    })
    @ApiQuery({
        name: "timeGap",
        type: Number,
        required: false
    })
    @Get("/:chainId/:id/total-user")
    getProjectTotalUser(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectTotalUser(chainId, id, timeGap);
    }

    @ApiResponse({
        type: StatisticsResponseDto,
        isArray: true
    })
    @ApiQuery({
        name: "timeGap",
        type: Number,
        required: false
    })
    @Get("/:chainId/:id/total-votes")
    getProjectTotalVotes(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectTotalVotes(chainId, id, timeGap);
    }

    @ApiResponse({
        type: StatisticsResponseDto,
        isArray: true
    })
    @ApiQuery({
        name: "paymentMethod",
        type: String,
        required: false
    })
    @ApiQuery({
        name: "timeGap",
        type: Number,
        required: false
    })
    @Get("/:chainId/:id/total-income")
    getProjectTotalIncome(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("paymentMethod") paymentMethod: Address,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectTotalIncome(chainId, id, paymentMethod, timeGap);
    }

    @ApiResponse({
        type: StatisticsResponseDto,
        isArray: true
    })
    @ApiQuery({
        name: "timeGap",
        type: Number,
        required: false
    })
    @Get("/:chainId/:id/new-user")
    getProjectNewUser(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("timeGap") timeGap: StatisticTimeGap
    ) {
        return this.statisticService.getProjectNewUser(chainId, id, timeGap);
    }
}
