import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model } from "mongoose";
import { Address, Hash, zeroHash } from "viem";
import { Portal, PortalSocialType } from "@accesstimeio/accesstime-common";

import { generateFilename } from "src/helpers";

import {
    UpdateProjectCategoriesDto,
    UpdateProjectPackagesDto,
    UpdateProjectSocialsDto
} from "./dto";

import { Project } from "../portal/schemas/project.schema";
import { SubgraphService } from "../subgraph/subgraph.service";
import { MinioService } from "../minio/minio.service";
import { ProjectPackage } from "../portal/schemas/project-package.schema";

@Injectable()
export class PortalCreatorService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<Project>,
        private readonly subgraphService: SubgraphService,
        private readonly minioService: MinioService
    ) {}

    async updateProjectAvatar(
        chainId: number,
        id: number,
        signer: Address,
        file: Express.Multer.File
    ) {
        const { project } = await this.getProject(chainId, id, signer);

        if (project.avatarUrl != null) {
            await this.minioService.deleteFile("project-avatar", project.avatarUrl);
        }

        const newFileName = generateFilename("project-avatar", signer);

        await this.minioService.uploadFile("project-avatar", newFileName, file);

        project.$set({ avatarUrl: newFileName });

        await project.save();

        return newFileName;
    }

    async updateProjectSocials(
        chainId: number,
        id: number,
        signer: Address,
        data: UpdateProjectSocialsDto
    ) {
        const { project } = await this.getProject(chainId, id, signer);

        let foundUnsupportedSocialType: boolean = false;
        let foundUnsupportedSocialUrl: boolean = false;
        for (let i = 0; i < data.payload.length; i++) {
            const { type, url } = data.payload[i];
            if (
                isNaN(Number(type)) ||
                Number(type) == PortalSocialType.None ||
                !Portal.socialTypes.includes(Number(type))
            ) {
                foundUnsupportedSocialType = true;
            }
            if (!Portal.socialUrlVerify(type, url, false)) {
                foundUnsupportedSocialUrl = true;
            }
        }

        if (foundUnsupportedSocialType) {
            throw new HttpException(
                {
                    errors: { message: "Given social type(s) are not supported." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        if (foundUnsupportedSocialUrl) {
            throw new HttpException(
                {
                    errors: { message: "Given social url(s) are not correct." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        project.$set({ socials: data.payload });

        await project.save();

        return true;
    }

    async updateProjectCategories(
        chainId: number,
        id: number,
        signer: Address,
        data: UpdateProjectCategoriesDto
    ) {
        const { project } = await this.getProject(chainId, id, signer);

        let foundUnsupportedCategory: boolean = false;
        for (let i = 0; i < data.payload.length; i++) {
            const category = data.payload[i];
            if (isNaN(Number(category)) || !Portal.categories.includes(Number(category))) {
                foundUnsupportedCategory = true;
            }
        }

        if (foundUnsupportedCategory) {
            throw new HttpException(
                {
                    errors: { message: "Given categories are not supported." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        project.$set({ categories: data.payload });

        await project.save();

        return true;
    }

    async updateProjectContent(
        chainId: number,
        id: number,
        signer: Address,
        file: Express.Multer.File
    ) {
        const { project } = await this.getProject(chainId, id, signer);

        if (project.contentUrl != null) {
            await this.minioService.deleteFile("project-content", project.contentUrl);
        }

        const newFileName = generateFilename("project-content", signer);

        await this.minioService.uploadFile("project-content", newFileName, file);

        project.$set({ contentUrl: newFileName });

        await project.save();

        return newFileName;
    }

    async updateProjectPackages(
        chainId: number,
        id: number,
        signer: Address,
        data: UpdateProjectPackagesDto
    ) {
        const { project, projectFromChain } = await this.getProject(chainId, id, signer);

        let foundInvalidPackage: boolean = false;
        for (let i = 0; i < data.payload.length; i++) {
            const { id, title } = data.payload[i];
            if (
                !projectFromChain[0].packages.includes(id.toString()) ||
                !Portal.packageNameVerify(title)
            ) {
                foundInvalidPackage = true;
            }
        }

        if (foundInvalidPackage) {
            throw new HttpException(
                {
                    errors: { message: "Given packages are not available." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const removedPackageIds: number[] = [];
        const updatedPackages = project.packages
            .map((_package) => {
                const payloadPackage = data.payload.find(
                    (_payloadPackage) => _payloadPackage.id == _package.id
                );

                if (payloadPackage) {
                    return {
                        ..._package,
                        title: payloadPackage.title
                    };
                } else {
                    removedPackageIds.push(_package.id);
                    return null;
                }
            })
            .filter((_package) => _package != null);

        for (let i = 0; i < removedPackageIds.length; i++) {
            const removedPackageId = removedPackageIds[i];
            const _package = project.packages.find((_package) => _package.id == removedPackageId);
            if (_package.backgroundUrl != null) {
                await this.minioService.deleteFile(
                    "project-package-background",
                    _package.backgroundUrl
                );
            }
            if (_package.contentUrl != null) {
                await this.minioService.deleteFile("project-package-content", _package.contentUrl);
            }
        }

        for (let i = 0; i < data.payload.length; i++) {
            const { id, title } = data.payload[i];
            const isExist = project.packages.find((_package) => _package.id == id);

            if (!isExist) {
                updatedPackages.push({ id, title, backgroundUrl: null, contentUrl: null });
            }
        }

        project.$set({ packages: updatedPackages });

        await project.save();

        return true;
    }

    async updateProjectPackageImage(
        chainId: number,
        id: number,
        packageId: number,
        signer: Address,
        file: Express.Multer.File
    ) {
        const { project, projectFromChain } = await this.getProject(chainId, id, signer);

        if (!projectFromChain[0].packages.includes(packageId.toString())) {
            throw new HttpException(
                {
                    errors: { message: "Given packages are not available." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        let newFileName: Hash = zeroHash;

        const newPackages: ProjectPackage[] = [];

        for (let i = 0; i < project.packages.length; i++) {
            const _package = project.packages[i];
            if (_package.id == packageId) {
                if (_package.backgroundUrl != null) {
                    await this.minioService.deleteFile(
                        "project-package-background",
                        _package.backgroundUrl
                    );
                }
                newFileName = generateFilename("project-package-background", signer);
                await this.minioService.uploadFile("project-package-background", newFileName, file);

                newPackages.push({
                    ..._package,
                    backgroundUrl: newFileName
                });
            } else {
                newPackages.push(_package);
            }
        }

        project.$set({ packages: newPackages });

        await project.save();

        return newFileName;
    }

    async updateProjectPackageContent(
        chainId: number,
        id: number,
        packageId: number,
        signer: Address,
        file: Express.Multer.File
    ) {
        const { project, projectFromChain } = await this.getProject(chainId, id, signer);

        if (!projectFromChain[0].packages.includes(packageId.toString())) {
            throw new HttpException(
                {
                    errors: { message: "Given packages are not available." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        let newFileName: Hash = zeroHash;

        const newPackages: ProjectPackage[] = [];

        for (let i = 0; i < project.packages.length; i++) {
            const _package = project.packages[i];
            if (_package.id == packageId) {
                if (_package.contentUrl != null) {
                    await this.minioService.deleteFile(
                        "project-package-content",
                        _package.contentUrl
                    );
                }

                newFileName = generateFilename("project-package-content", signer);
                await this.minioService.uploadFile("project-package-content", newFileName, file);

                newPackages.push({
                    ..._package,
                    contentUrl: newFileName
                });
            } else {
                newPackages.push(_package);
            }
        }

        project.$set({ packages: newPackages });

        await project.save();

        return newFileName;
    }

    private async getProject(chainId: number, id: number, checkOwner: Address) {
        const projectFromChain = await this.subgraphService.projectById(chainId, id);

        if (projectFromChain.length == 0) {
            throw new HttpException(
                {
                    errors: { message: "Requested project is not found." }
                },
                HttpStatus.EXPECTATION_FAILED
            );
        }

        const projectOwner = projectFromChain[0].owner;
        const projectAddress = projectFromChain[0].id;

        if (projectOwner != checkOwner) {
            throw new HttpException(
                {
                    errors: { message: "Caller is not owner of project." }
                },
                HttpStatus.UNAUTHORIZED
            );
        }

        const projectDocument = await this.projectModel.countDocuments({ id, chainId });

        let project: (Document<unknown, unknown, Project> & Project) | null = null;
        if (projectDocument == 0) {
            project = new this.projectModel({
                id,
                chainId,
                chainUpdateTimestamp: 0,
                address: projectAddress
            });

            await project.save();
        } else {
            project = (await this.projectModel.findOne({ id, chainId })) ?? null;
        }

        return { project, projectFromChain };
    }
}
