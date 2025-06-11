import { Controller, Get, Param, Post, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiHeaders, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { Address } from "viem";
import { SUPPORTED_SORT_TYPE } from "@accesstimeio/accesstime-common";
import { days, minutes, Throttle } from "@nestjs/throttler";

import { Signer } from "src/decorators/signer.decorator";

import { PortalService } from "./portal.service";
import {
    CheckDomainVerifyResponseDto,
    ExploreResponseDto,
    FeaturedsResponseDto,
    ProjectDto,
    ProjectToggleFavoriteResponseDto,
    ProjectVotesResponseDto,
    RequestDomainVerifyResponseDto,
    UserFavoritesResponseDto
} from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
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

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: false
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: false
        }
    ])
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
    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @ApiResponse({
        type: ExploreResponseDto
    })
    @Get("/explore/:chainId")
    async getExplore(
        @Param("chainId") chainId: number,
        @Query("sort") sort: SUPPORTED_SORT_TYPE,
        @Query("paymentMethods") paymentMethods: string,
        @Query("page") page: number,
        @Signer(false) signer: Address
    ) {
        const paymentMethods_: Address[] | undefined =
            paymentMethods && (paymentMethods.split(",") as Address[]);
        return this.portalService.getExplore(chainId, sort, paymentMethods_, page, signer);
    }

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: true
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: true
        }
    ])
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

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: false
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: false
        }
    ])
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

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: true
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: true
        }
    ])
    @ApiResponse({
        type: ProjectToggleFavoriteResponseDto
    })
    @Throttle({ default: { limit: 10, ttl: days(1) } })
    @Post("/project/:chainId/:id/toggle-favorite")
    toggleFavorite(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.toggleFavorite(chainId, id, signer);
    }

    @ApiResponse({
        type: ProjectVotesResponseDto
    })
    @Get("/project/:chainId/:id/votes")
    async getProjectVotes(@Param("chainId") chainId: number, @Param("id") id: number) {
        return this.portalService.getProjectVotes(chainId, id);
    }

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: true
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: true
        }
    ])
    @Post("/project/:chainId/:id/toggle-featured")
    getToggleFeatured(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.toggleFeatured(chainId, id, signer);
    }

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: true
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: true
        }
    ])
    @Post("/project/:chainId/:id/toggle-portal-verify")
    getTogglePortalVerify(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.togglePortalVerify(chainId, id, signer);
    }

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: true
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: true
        }
    ])
    @ApiResponse({
        type: RequestDomainVerifyResponseDto
    })
    @Throttle({ default: { limit: 10, ttl: minutes(5) } })
    @Post("/project/:chainId/:id/request-domain-verify")
    requestDomainVerify(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.requestDomainVerify(chainId, id, signer);
    }

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: true
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: true
        }
    ])
    @ApiResponse({
        type: CheckDomainVerifyResponseDto
    })
    @Throttle({ default: { limit: 10, ttl: days(1) } })
    @Post("/project/:chainId/:id/check-domain-verify")
    checkDomainVerify(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalService.checkDomainVerify(chainId, id, signer);
    }

    @ApiHeaders([
        {
            name: "X-ACCESSTIME-AUTH-MESSAGE",
            required: false
        },
        {
            name: "X-ACCESSTIME-AUTH-SIGNATURE",
            required: false
        }
    ])
    @ApiQuery({
        name: "name",
        type: String,
        required: true
    })
    @ApiQuery({
        name: "page",
        type: Number,
        required: false
    })
    @ApiResponse({
        type: ExploreResponseDto
    })
    @Get("/search")
    async search(
        @Query("name") name: string,
        @Query("page") page: number,
        @Signer(false) signer: Address
    ) {
        return this.portalService.search(name, page, signer);
    }
}
