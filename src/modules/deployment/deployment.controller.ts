import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { DeploymentService } from "./deployment.service";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";
import { Address } from "src/helpers";
import { LastDeploymentResponseDto, ListDeploymentResponseDto, RatesDto } from "./dto";

@UsePipes(new ValidationPipe())
@Controller("deployment")
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) {}

    @ApiResponse({
        type: LastDeploymentResponseDto,
        isArray: true
    })
    @Get("/last/:address")
    lastDeployments(@Param("address") address: Address) {
        return this.deploymentService.lastDeployments(address);
    }

    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @ApiResponse({
        type: ListDeploymentResponseDto
    })
    @Get("/list/:address")
    listDeployments(@Param("address") address: Address, @Query("page") page?: number) {
        return this.deploymentService.listDeployments(address, page);
    }

    @ApiResponse({
        type: RatesDto,
        isArray: true
    })
    @Get("/rates")
    rates() {
        return this.deploymentService.rates();
    }
}
