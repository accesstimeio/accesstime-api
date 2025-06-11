import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Address } from "viem";

export type FrameUserDocument = HydratedDocument<FrameUser>;

export class FrameNotificationDetails {
    @Prop({ required: true })
    url: string;

    @Prop({ required: true })
    token: string;
}

@Schema({ timestamps: true })
export class FrameUser {
    @Prop({ required: true, index: true })
    fid: number;

    @Prop({ required: true, type: FrameNotificationDetails })
    notificationDetails: FrameNotificationDetails;

    @Prop({ required: true })
    custodyAddress: Address;

    @Prop({ default: [] })
    verifiedAddresses: Address[];
}

export const FrameUserSchema = SchemaFactory.createForClass(FrameUser);
