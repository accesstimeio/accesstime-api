import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";
import { Address } from "viem";

import { LastDeploymentResponseDto, ListDeploymentResponseDto, RatesDto } from "./dto";
import { DeploymentService } from "./deployment.service";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) {}

    @ApiResponse({
        type: LastDeploymentResponseDto,
        isArray: true
    })
    @Get("/last/:chainId/:address")
    lastDeployments(@Param("chainId") chainId: number, @Param("address") address: Address) {
        return this.deploymentService.lastDeployments(chainId, address);
    }

    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @ApiResponse({
        type: ListDeploymentResponseDto
    })
    @Get("/list/:chainId/:address")
    listDeployments(
        @Param("chainId") chainId: number,
        @Param("address") address: Address,
        @Query("page") page?: number
    ) {
        return this.deploymentService.listDeployments(chainId, address, page);
    }

    @ApiResponse({
        type: RatesDto,
        isArray: true
    })
    @Get("/:chainId/rates")
    rates(@Param("chainId") chainId: number) {
        return this.deploymentService.rates(chainId);
    }
}
