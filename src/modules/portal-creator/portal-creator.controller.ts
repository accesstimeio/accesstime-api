import {
    Body,
    Controller,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Post,
    UploadedFile,
    UseInterceptors,
    UsePipes,
    ValidationPipe
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Address } from "viem";
import { Express } from "express";
import { Portal } from "@accesstimeio/accesstime-common";
import { ApiHeaders } from "@nestjs/swagger";
import { days, Throttle } from "@nestjs/throttler";

import { Signer } from "src/decorators/signer.decorator";
import { FileTypeValidationPipe } from "src/pipes/file-type.validation.pipe";
import { MarkdownValidationPipe } from "src/pipes/markdown.validation.pipe";

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
    @Throttle({ default: { limit: 3, ttl: days(1) } })
    @Post("/update-project-avatar/:chainId/:id")
    @UseInterceptors(FileInterceptor("file"))
    updateProjectAvatar(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: Portal.uploadMaxSizes.avatar }),
                    new FileTypeValidationPipe({ mimeType: "image/jpeg" })
                ]
            })
        )
        file: Express.Multer.File
    ) {
        return this.portalCreatorService.updateProjectAvatar(chainId, id, signer, file);
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
    @Post("/update-project-socials/:chainId/:id")
    @Throttle({ default: { limit: 5, ttl: days(1) } })
    updateProjectSocials(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @Body() data: UpdateProjectSocialsDto
    ) {
        return this.portalCreatorService.updateProjectSocials(chainId, id, signer, data);
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
    @Throttle({ default: { limit: 5, ttl: days(1) } })
    @Post("/update-project-categories/:chainId/:id")
    updateProjectCategories(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @Body() data: UpdateProjectCategoriesDto
    ) {
        return this.portalCreatorService.updateProjectCategories(chainId, id, signer, data);
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
    @Throttle({ default: { limit: 3, ttl: days(1) } })
    @Post("/update-project-content/:chainId/:id")
    @UseInterceptors(FileInterceptor("file"))
    updateProjectContent(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: Portal.uploadMaxSizes.content }),
                    new MarkdownValidationPipe({ maxError: 0 })
                ]
            })
        )
        file: Express.Multer.File
    ) {
        return this.portalCreatorService.updateProjectContent(chainId, id, signer, file);
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
    @Throttle({ default: { limit: 5, ttl: days(1) } })
    @Post("/update-project-packages/:chainId/:id")
    updateProjectPackages(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @Body() data: UpdateProjectPackagesDto
    ) {
        return this.portalCreatorService.updateProjectPackages(chainId, id, signer, data);
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
    @Throttle({ default: { limit: 7, ttl: days(1) } })
    @Post("/update-project-package-image/:chainId/:id/:packageId")
    @UseInterceptors(FileInterceptor("file"))
    updateProjectPackageImage(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Param("packageId") packageId: number,
        @Signer(true) signer: Address,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: Portal.uploadMaxSizes.packageBackground
                    }),
                    new FileTypeValidationPipe({ mimeType: "image/jpeg" })
                ]
            })
        )
        file: Express.Multer.File
    ) {
        return this.portalCreatorService.updateProjectPackageImage(
            chainId,
            id,
            packageId,
            signer,
            file
        );
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
    @Throttle({ default: { limit: 5, ttl: days(1) } })
    @Post("/update-project-package-content/:chainId/:id/:packageId")
    @UseInterceptors(FileInterceptor("file"))
    updateProjectPackageContent(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Param("packageId") packageId: number,
        @Signer(true) signer: Address,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: Portal.uploadMaxSizes.packageContent }),
                    new MarkdownValidationPipe({ maxError: 0 })
                ]
            })
        )
        file: Express.Multer.File
    ) {
        return this.portalCreatorService.updateProjectPackageContent(
            chainId,
            id,
            packageId,
            signer,
            file
        );
    }
}
