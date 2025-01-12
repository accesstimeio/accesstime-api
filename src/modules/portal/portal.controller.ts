import { Controller, Get, Param, Post, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";
import { Address } from "viem";
import { SUPPORTED_SORT_TYPE } from "@accesstimeio/accesstime-common";

import { Signer } from "src/decorators/signer.decorator";

import { PortalService } from "./portal.service";
import {
    ExploreResponseDto,
    FeaturedsResponseDto,
    ProjectDto,
    ProjectToggleFavoriteResponseDto,
    ProjectVotesResponseDto,
    UserFavoritesResponseDto
} from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller()
export class PortalController {
    constructor(private readonly portalService: PortalService) {}

    @ApiResponse({
        type: FeaturedsResponseDto,
        isArray: true
    })
    @Get("/featureds")
    getFeatureds() {
        return this.portalService.getFeatureds();
    }

    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @ApiQuery({
        name: "sort",
        type: String,
        required: false
    })
    @ApiQuery({
        name: "paymentMethods",
        type: String,
        required: false
    })
    @ApiResponse({
        type: ExploreResponseDto
    })
    @Get("/explore/:chainId")
    async getExplore(
        @Param("chainId") chainId: number,
        @Query("page") page: number,
        @Query("sort") sort: SUPPORTED_SORT_TYPE,
        @Query("paymentMethods") paymentMethods: string,
        @Signer(false) signer: Address
    ) {
        const paymentMethods_: Address[] | undefined =
            paymentMethods && (paymentMethods.split(",") as Address[]);
        return this.portalService.getExplore(chainId, page, sort, paymentMethods_, signer);
    }

    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @ApiResponse({
        type: UserFavoritesResponseDto
    })
    @Get("/favorites/:chainId")
    getFavorites(
        @Param("chainId") chainId: number,
        @Query("page") page: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.getFavorites(chainId, signer, page);
    }

    @ApiResponse({
        type: ProjectDto
    })
    @Get("/project/:chainId/:id")
    async getProjectById(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(false) signer: Address
    ) {
        return this.portalService.getProjectById(chainId, id, signer);
    }

    @ApiResponse({
        type: ProjectToggleFavoriteResponseDto
    })
    @Post("/project/:chainId/:id/toggle-favorite")
    toggleFavorite(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ): Promise<{ isFavoritedNow: boolean | null }> {
        return this.portalService.toggleFavorite(chainId, id, signer);
    }

    @ApiResponse({
        type: ProjectVotesResponseDto
    })
    @Get("/project/:chainId/:id/votes")
    async getProjectVotes(@Param("chainId") chainId: number, @Param("id") id: number) {
        return this.portalService.getProjectVotes(chainId, id);
    }

    @Post("/project/:chainId/:id/toggle-featured")
    getToggleFeatured(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.toggleFeatured(chainId, id, signer);
    }

    @Post("/project/:chainId/:id/toggle-portal-verify")
    getTogglePortalVerify(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.togglePortalVerify(chainId, id, signer);
    }
}
