import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Address } from "viem";

import { ProjectSocial, ProjectSocialSchema } from "./project-social.schema";
import { ProjectPackage, ProjectPackageSchema } from "./project-package.schema";

export type ProjectDocument = HydratedDocument<Project, ProjectDocumentOverride>;

export type ProjectDocumentOverride = {
    socials: Types.DocumentArray<ProjectSocial>;
    packages: Types.DocumentArray<ProjectPackage>;
};

@Schema({ timestamps: true })
export class Project {
    @Prop({ required: true, index: true })
    id: number;

    @Prop({ required: true, index: true })
    chainId: number;

    @Prop({ required: true })
    chainUpdateTimestamp: number;

    @Prop({ required: true })
    address: Address;

    @Prop({ default: null })
    avatarUrl: string | null;

    @Prop({ default: [], type: [ProjectSocialSchema] })
    socials: ProjectSocial[];

    @Prop({ default: [] })
    categories: number[];

    @Prop({ default: null })
    contentUrl: string;

    @Prop({ default: [] })
    paymentMethods: Address[];

    @Prop({ default: [], type: [ProjectPackageSchema] })
    packages: ProjectPackage[];

    @Prop({ default: false })
    featured: boolean;

    @Prop({ default: false })
    domainVerify: boolean;

    @Prop({ default: false })
    portalVerify: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
