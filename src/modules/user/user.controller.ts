import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";
import { Address } from "viem";

import { UserService } from "./user.service";
import { ProjectUsersDto, UserSubscriptionResponseDto, UserSubscriptionsResponseDto } from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
export class UserController {
    constructor(private readonly userService: UserService) {}

    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @ApiResponse({
        type: UserSubscriptionsResponseDto
    })
    @Get("/subscriptions/:address")
    getUserSubscriptions(@Param("address") address: Address, @Query("page") page?: number) {
        return this.userService.getUserSubscriptions(address, page);
    }

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

    @ApiResponse({
        type: UserSubscriptionResponseDto
    })
    @Get("/subscription/:address/:chainId/:accessTimeAddress")
    getUserSubscription(
        @Param("address") address: Address,
        @Param("chainId") chainId: number,
        @Param("accessTimeAddress") accessTimeAddress: Address
    ) {
        return this.userService.getUserSubscription(address, chainId, accessTimeAddress);
    }
}
