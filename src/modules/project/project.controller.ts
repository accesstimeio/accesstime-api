import { Controller, Get, Param, UsePipes, ValidationPipe } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { ApiResponse } from "@nestjs/swagger";
import { ProjectResponseDto } from "./dto";

@UsePipes(new ValidationPipe())
@Controller("project")
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
