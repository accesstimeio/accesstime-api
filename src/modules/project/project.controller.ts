import { Controller, Get, Param, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";

import { ProjectResponseDto } from "./dto";
import { ProjectService } from "./project.service";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @ApiResponse({
        type: ProjectResponseDto
    })
    @Get("/:chainId/:id")
    getProjectById(@Param("chainId") chainId: number, @Param("id") id: number) {
        return this.projectService.getProjectById(chainId, id);
    }
}
