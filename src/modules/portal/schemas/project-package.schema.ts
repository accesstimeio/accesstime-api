import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProjectPackageDocument = HydratedDocument<ProjectPackage>;

@Schema({ timestamps: true })
export class ProjectPackage {
    @Prop({ required: true })
    packageId: number;

    @Prop({ required: true })
    title: string;

    @Prop({ default: null })
    backgroundUrl: string;

    @Prop({ default: null })
    contentUrl: string;
}

export const ProjectPackageSchema = SchemaFactory.createForClass(ProjectPackage);
