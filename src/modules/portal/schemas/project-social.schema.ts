import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProjectSocialDocument = HydratedDocument<ProjectSocial>;

@Schema({ timestamps: true })
export class ProjectSocial {
    @Prop({ required: true })
    type: number;

    @Prop({ required: true })
    url: string;
}

export const ProjectSocialSchema = SchemaFactory.createForClass(ProjectSocial);
