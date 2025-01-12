import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiHeaders, ApiResponse } from "@nestjs/swagger";
import { Address, Hash } from "viem";

import { Signer } from "src/decorators/signer.decorator";

import { PortalLinkService } from "./portal-link.service";
import { CheckResponseDto, UpdateStatusDto } from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller()
export class PortalLinkController {
    constructor(private readonly portalLinkService: PortalLinkService) {}

    @ApiResponse({
        type: CheckResponseDto
    })
    @Get("/check/:hashedLink")
    getCheck(@Param("hashedLink") hashedLink: Hash) {
        return this.portalLinkService.getCheck(hashedLink);
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
    @Post("/update-status/:hashedLink")
    updateStatus(
        @Param("hashedLink") hashedLink: Hash,
        @Signer(true) signer: Address,
        @Body() data: UpdateStatusDto
    ) {
        return this.portalLinkService.updateStatus(hashedLink, data.allowed, signer);
    }
}
