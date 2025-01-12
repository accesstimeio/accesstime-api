import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DomainDocument = HydratedDocument<Domain>;

@Schema({ timestamps: true })
export class Domain {
    @Prop({ required: true })
    domain: string;

    @Prop({ required: true })
    allowed: boolean;
}

export const DomainSchema = SchemaFactory.createForClass(Domain);
