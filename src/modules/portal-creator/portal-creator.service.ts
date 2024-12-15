import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Document, Model } from "mongoose";
import { Address } from "viem";

import { SUPPORTED_CATEGORIES } from "src/common";

import { UpdateProjectCategoriesDto } from "./dto";

import { Project } from "../portal/schemas/project.schema";
import { SubgraphService } from "../subgraph/subgraph.service";

@Injectable()
export class PortalCreatorService {
    constructor(
        @InjectModel(Project.name) private readonly projectModel: Model<Project>,
        private readonly subgraphService: SubgraphService
    ) {}

    async updateProjectAvatar(chainId: number, id: number, signer: Address, data: any) {
        const project = await this.getProject(chainId, id, signer);
        return [chainId, id, signer, data];
    }

    async updateProjectSocials(chainId: number, id: number, signer: Address, data: any) {
        const project = await this.getProject(chainId, id, signer);
        return [chainId, id, signer, data];
    }

    async updateProjectCategories(
        chainId: number,
        id: number,
        signer: Address,
        data: UpdateProjectCategoriesDto
    ) {
        const project = await this.getProject(chainId, id, signer);

        let foundUnsupportedCategory: boolean = false;
        for (let i = 0; i < data.payload.length; i++) {
            const category = data.payload[i];
            if (isNaN(Number(category)) || !SUPPORTED_CATEGORIES.includes(Number(category))) {
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

    async updateProjectContent(chainId: number, id: number, signer: Address, data: any) {
        const project = await this.getProject(chainId, id, signer);
        return [chainId, id, signer, data];
    }

    async updateProjectPackages(chainId: number, id: number, signer: Address, data: any) {
        const project = await this.getProject(chainId, id, signer);
        return [chainId, id, signer, data];
    }

    async updateProjectPackageContent(
        chainId: number,
        id: number,
        packageId: number,
        signer: Address,
        data: any
    ) {
        const project = await this.getProject(chainId, id, signer);
        return [chainId, id, packageId, signer, data];
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
        if (!projectDocument) {
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

        return project;
    }
}
