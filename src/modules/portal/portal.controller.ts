import { Controller, Get, Param, Post, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";
import { Address } from "viem";
import { SUPPORTED_SORT_TYPE } from "@accesstimeio/accesstime-common";

import { Signer } from "src/decorators/signer.decorator";

import { PortalService } from "./portal.service";
import { ExploreResponseDto } from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller()
export class PortalController {
    constructor(private readonly portalService: PortalService) {}

    @Get("/featureds")
    getFeatureds() {
        return true;
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
    @ApiResponse({
        type: ExploreResponseDto
    })
    @Get("/explore/:chainId")
    async getExplore(
        @Param("chainId") chainId: number,
        @Query("page") page: number,
        @Query("sort") sort: SUPPORTED_SORT_TYPE,
        @Signer(false) signer: Address
    ) {
        return this.portalService.getExplore(chainId, page, sort, signer);
    }

    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @Get("/favorites/:chainId")
    getFavorites(
        @Param("chainId") chainId: number,
        @Query("page") page: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.getFavorites(chainId, signer, page);
    }

    @Get("/project/:chainId/:id")
    async getProjectById(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(false) signer: Address
    ) {
        return this.portalService.getProjectById(chainId, id, signer);
    }

    @Post("/project/:chainId/:id/toggle-favorite")
    toggleFavorite(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ): Promise<{ isFavoritedNow: boolean | null }> {
        return this.portalService.toggleFavorite(chainId, id, signer);
    }
}
