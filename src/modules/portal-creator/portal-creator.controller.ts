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

import {
    PROJECT_AVATAR_UPLOAD_MAX_SIZE,
    PROJECT_CONTENT_UPLOAD_MAX_SIZE,
    PROJECT_PACKAGE_BACKGROUND_UPLOAD_MAX_SIZE,
    PROJECT_PACKAGE_CONTENT_UPLOAD_MAX_SIZE
} from "src/common";
import { Signer } from "src/decorators/signer.decorator";
import { FileTypeValidationPipe } from "src/pipes/file-type.validation.pipe";

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
    @UseInterceptors(FileInterceptor("file"))
    updateProjectAvatar(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: PROJECT_AVATAR_UPLOAD_MAX_SIZE }),
                    new FileTypeValidationPipe({ mimeType: "image/jpeg" })
                ]
            })
        )
        file: Express.Multer.File
    ) {
        return this.portalCreatorService.updateProjectAvatar(chainId, id, signer, file);
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
    @UseInterceptors(FileInterceptor("file"))
    updateProjectContent(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Signer(true) signer: Address,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: PROJECT_CONTENT_UPLOAD_MAX_SIZE })
                    // new FileTypeValidationPipe({ mimeType: "text/plain" })
                ]
            })
        )
        file: Express.Multer.File
    ) {
        return this.portalCreatorService.updateProjectContent(chainId, id, signer, file);
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
                        maxSize: PROJECT_PACKAGE_BACKGROUND_UPLOAD_MAX_SIZE
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
                    new MaxFileSizeValidator({ maxSize: PROJECT_PACKAGE_CONTENT_UPLOAD_MAX_SIZE })
                    // new FileTypeValidationPipe({ mimeType: "text/plain" })
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
