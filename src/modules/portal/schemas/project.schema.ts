import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import { ProjectSocial, ProjectSocialSchema } from "./project-social.schema";

export type ProjectDocument = HydratedDocument<Project, ProjectDocumentOverride>;

export type ProjectDocumentOverride = {
    socials: Types.DocumentArray<ProjectSocial>;
};

@Schema({ timestamps: true })
export class Project {
    @Prop({ required: true })
    id: number;

    @Prop({ required: true })
    chainId: number;

    @Prop({ default: null })
    avatar: string | null;

    @Prop({ default: [], type: [ProjectSocialSchema] })
    socials: ProjectSocial[];

    @Prop({ default: [] })
    categories: number[];

    @Prop({ default: null })
    contentUrl: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
