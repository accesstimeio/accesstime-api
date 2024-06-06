import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { DeploymentService } from "./deployment.service";
import { ApiQuery } from "@nestjs/swagger";
import { Address } from "src/helpers";

@UsePipes(new ValidationPipe())
@Controller("deployment")
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) {}

    @Get("/last/:address")
    lastDeployments(@Param("address") address: Address) {
        return this.deploymentService.lastDeployments(address);
    }

    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @Get("/list/:address")
    listDeployments(@Param("address") address: Address, @Query("page") page?: number) {
        return this.deploymentService.listDeployments(address, page);
    }
}
