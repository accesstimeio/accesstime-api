import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProjectDomainDocument = HydratedDocument<ProjectDomain>;

@Schema()
export class ProjectDomain {
    @Prop({ required: true, index: true })
    id: number;

    @Prop({ required: true, index: true })
    chainId: number;

    @Prop({ required: true })
    domain: string;

    @Prop({ required: true })
    recordKey: string;

    @Prop({ required: true })
    recordValue: string;
}

export const ProjectDomainSchema = SchemaFactory.createForClass(ProjectDomain);
