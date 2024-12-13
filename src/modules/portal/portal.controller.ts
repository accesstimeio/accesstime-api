import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { PortalService } from "./portal.service";

@UsePipes(new ValidationPipe())
@Controller("portal")
export class PortalController {
    constructor(private readonly portalService: PortalService) {}

    @Get("/featureds")
    getFeatureds() {
        return true;
    }

    @Get("/explore/:chainId")
    getExplore(@Param("chainId") chainId: number, @Query("page") page: number) {
        return [chainId, page];
    }

    @Get("/favorites/:chainId")
    getFavorites(@Param("chainId") chainId: number, @Query("page") page: number) {
        // signature required
        return [chainId, page];
    }

    @Get("/project/:chainId/:id")
    getProjectById(@Param("chainId") chainId: number, @Param("id") id: number) {
        // project-avatar
        // project-socials
        // project-categories
        // project-content
        // project-packages, if available
        // project-votes
        return [chainId, id];
    }
}
