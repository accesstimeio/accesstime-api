import { Body, Controller, Param, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { Address } from "viem";

import { Signer } from "src/signer.decorator";

import { PortalCreatorService } from "./portal-creator.service";
import {
    UpdateProjectCategoriesDto,
    UpdateProjectPackagesDto,
    UpdateProjectSocialsDto
} from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller()
export class PortalCreatorController {
    constructor(private readonly portalCreatorService: PortalCreatorService) {}

    @Post("/update-project-avatar/:chainId/:id")
    updateProjectAvatar(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalCreatorService.updateProjectAvatar(chainId, id, signer, "to-do");
    }

    @Post("/update-project-socials/:chainId/:id")
    updateProjectSocials(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @Body() data: UpdateProjectSocialsDto
    ) {
        return this.portalCreatorService.updateProjectSocials(chainId, id, signer, data);
    }

    @Post("/update-project-categories/:chainId/:id")
    updateProjectCategories(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @Body() data: UpdateProjectCategoriesDto
    ) {
        return this.portalCreatorService.updateProjectCategories(chainId, id, signer, data);
    }

    @Post("/update-project-content/:chainId/:id")
    updateProjectContent(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address
    ) {
        return this.portalCreatorService.updateProjectContent(chainId, id, signer, "to-do");
    }

    @Post("/update-project-packages/:chainId/:id")
    updateProjectPackages(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @Body() data: UpdateProjectPackagesDto
    ) {
        return this.portalCreatorService.updateProjectPackages(chainId, id, signer, data);
    }

    @Post("/update-project-package-image/:chainId/:id/:packageId")
    updateProjectPackageImage(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Param("packageId") packageId: number,
        @Signer(true) signer: Address
    ) {
        return this.portalCreatorService.updateProjectPackageImage(
            chainId,
            id,
            packageId,
            signer,
            "to-do"
        );
    }

    @Post("/update-project-package-content/:chainId/:id/:packageId")
    updateProjectPackageContent(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Param("packageId") packageId: number,
        @Signer(true) signer: Address
    ) {
        return this.portalCreatorService.updateProjectPackageContent(
            chainId,
            id,
            packageId,
            signer,
            "to-do"
        );
    }
}
