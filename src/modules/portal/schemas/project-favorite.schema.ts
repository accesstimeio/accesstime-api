import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Address } from "src/helpers";

export type ProjectFavoriteDocument = HydratedDocument<ProjectFavorite>;

@Schema()
export class ProjectFavorite {
    @Prop({ required: true, index: true })
    id: number;

    @Prop({ required: true, index: true })
    chainId: number;

    @Prop({ required: true })
    user: Address;
}

export const ProjectFavoriteSchema = SchemaFactory.createForClass(ProjectFavorite);
