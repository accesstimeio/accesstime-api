import { Controller, Get, Param, Post, Query, UsePipes, ValidationPipe } from "@nestjs/common";

import { SUPPORTED_PORTAL_SORT_TYPE } from "src/common";

import { PortalService } from "./portal.service";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";
import { ExploreResponseDto } from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller("portal")
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
        type: Number,
        required: false
    })
    @ApiResponse({
        type: ExploreResponseDto
    })
    @Get("/explore/:chainId")
    getExplore(
        @Param("chainId") chainId: number,
        @Query("page") page: number,
        @Query("sort") sort: string
    ) {
        // if signature available, pass recovered user to function
        return this.portalService.getExplore(
            chainId,
            page,
            sort as SUPPORTED_PORTAL_SORT_TYPE,
            "0x123"
        );
    }

    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @Get("/favorites/:chainId")
    getFavorites(@Param("chainId") chainId: number, @Query("page") page: number) {
        // signature required
        return this.portalService.getFavorites(chainId, "0x123", page);
    }

    @Get("/project/:chainId/:id")
    getProjectById(@Param("chainId") chainId: number, @Param("id") id: number) {
        // if signature available, pass recovered user to function
        return this.portalService.getProjectById(chainId, id, "0x123");
    }

    @Post("/project/:chainId/:id/toggle-favorite")
    toggleFavorite(
        @Param("chainId") chainId: number,
        @Param("id") id: number
    ): Promise<{ isFavoritedNow: boolean | null }> {
        // signature required
        return this.portalService.toggleFavorite(chainId, id, "0x123");
    }
}
