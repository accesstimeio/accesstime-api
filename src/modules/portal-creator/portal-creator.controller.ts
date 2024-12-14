import { Controller, Param, Post, UsePipes, ValidationPipe } from "@nestjs/common";

import { PortalCreatorService } from "./portal-creator.service";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller()
export class PortalCreatorController {
    constructor(private readonly portalCreatorService: PortalCreatorService) {}

    @Post("/update-project-avatar/:chainId/:id")
    updateProjectAvatar(@Param("chainId") chainId: number, @Param("id") id: number) {
        // signature required
        return [chainId, id];
    }

    @Post("/update-project-socials/:chainId/:id")
    updateProjectSocials(@Param("chainId") chainId: number, @Param("id") id: number) {
        // signature required
        return [chainId, id];
    }

    @Post("/update-project-categories/:chainId/:id")
    updateProjectCategories(@Param("chainId") chainId: number, @Param("id") id: number) {
        // signature required
        return [chainId, id];
    }

    @Post("/update-project-content/:chainId/:id")
    updateProjectContent(@Param("chainId") chainId: number, @Param("id") id: number) {
        // signature required
        return [chainId, id];
    }

    @Post("/update-project-packages/:chainId/:id")
    updateProjectPackages(@Param("chainId") chainId: number, @Param("id") id: number) {
        // signature required
        return [chainId, id];
    }

    @Post("/update-project-package-content/:chainId/:id/:packageId")
    updateProjectPackageContent(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Param("packageId") packageId: number
    ) {
        // signature required
        return [chainId, id, packageId];
    }
}
