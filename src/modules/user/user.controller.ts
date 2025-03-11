import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";

import { UserService } from "./user.service";
import { ProjectUsersDto } from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
export class UserController {
    constructor(private readonly userService: UserService) {}

    @ApiQuery({
        name: "orderBy",
        type: String,
        required: false
    })
    @ApiQuery({
        name: "pageCursor",
        type: String,
        required: false
    })
    @ApiResponse({
        type: ProjectUsersDto
    })
    @Get("/:chainId/:id")
    getProjectUsers(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("orderBy") orderBy: string,
        @Query("pageCursor") pageCursor: string
    ) {
        return this.userService.getProjectUsers(chainId, id, orderBy, pageCursor);
    }
}
