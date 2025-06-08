import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import {
    FrameNotificationDetails,
    ParseWebhookEvent,
    parseWebhookEvent,
    ParseWebhookEventResult,
    verifyAppKeyWithNeynar
} from "@farcaster/frame-node";
import * as Joi from "joi";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";

import { FrameUser } from "./schemas/frame-user.schema";
import { User } from "@neynar/nodejs-sdk/build/api";

@Injectable()
export class FarcasterService {
    private neynarClient: NeynarAPIClient;

    constructor(@InjectModel(FrameUser.name) private readonly frameUserModel: Model<FrameUser>) {
        this.neynarClient = new NeynarAPIClient(
            new Configuration({
                apiKey: process.env.NEYNAR_API_KEY
            })
        );
    }

    async getUserDetails(fid: number) {
        let userDetails: User | null = null;
        try {
            const foundUsers = await this.neynarClient.fetchBulkUsers({
                fids: [fid],
                viewerFid: fid
            });

            if (foundUsers.users && foundUsers.users[0]) {
                userDetails = foundUsers.users[0];
            }
        } catch (err) {}

        return userDetails;
    }

    private async getUserNotificationDetails(
        fid: number
    ): Promise<FrameNotificationDetails | null> {
        const user = await this.frameUserModel.findOne({ fid }).exec();

        if (user) {
            return user.notificationDetails;
        }

        return null;
    }

    private async setUserNotificationDetails(
        fid: number,
        notificationDetails: FrameNotificationDetails
    ) {
        const userDetails = await this.getUserDetails(fid);
        if (userDetails != null) {
            const newUser = new this.frameUserModel({
                fid,
                notificationDetails,
                custodyAddress: userDetails.custody_address.toLowerCase(),
                verifiedAddresses: [
                    userDetails.verified_addresses.primary.eth_address.toLowerCase(),
                    ...userDetails.verified_addresses.eth_addresses.map((address) =>
                        address.toLowerCase()
                    )
                ]
            });

            newUser.save();
        }
    }

    private async deleteUserNotificationDetails(fid: number) {
        await this.frameUserModel.deleteMany({ fid });
    }

    async sendFrameNotification({
        fid,
        title,
        body
    }: {
        fid: number;
        title: string;
        body: string;
    }): Promise<{ state: "no_token" | "error" | "rate_limit" | "success" }> {
        const notificationDetails = await this.getUserNotificationDetails(fid);
        if (!notificationDetails) {
            return { state: "no_token" };
        }

        const response = await fetch(notificationDetails.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                notificationId: crypto.randomUUID(),
                title,
                body,
                targetUrl: process.env.FARCASTER_APP_URL,
                tokens: [notificationDetails.token]
            })
        });

        const responseJson = await response.json();

        const schema = Joi.object({
            result: Joi.object({
                successfulTokens: Joi.array().items(Joi.string()).required(),
                invalidTokens: Joi.array().items(Joi.string()).required(),
                rateLimitedTokens: Joi.array().items(Joi.string()).required()
            }).required()
        });

        const { value, error } = schema.validate(responseJson, { abortEarly: false });

        if (response.status === 200) {
            if (error) {
                // Malformed response
                return { state: "error" };
            }

            if (value.result.rateLimitedTokens.length) {
                // Rate limited
                return { state: "rate_limit" };
            }

            return { state: "success" };
        } else {
            // Error response
            return { state: "error" };
        }
    }

    async webhookHandle(body: any): Promise<{ success: boolean; error?: string }> {
        let data: ParseWebhookEventResult;

        try {
            data = await parseWebhookEvent(body, verifyAppKeyWithNeynar);
        } catch (e: unknown) {
            const error = e as ParseWebhookEvent.ErrorType;

            switch (error.name) {
                case "VerifyJsonFarcasterSignature.InvalidDataError":
                case "VerifyJsonFarcasterSignature.InvalidEventDataError":
                    throw new HttpException(
                        {
                            success: false,
                            errors: { message: error.message }
                        },
                        HttpStatus.BAD_REQUEST
                    );

                case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
                    throw new HttpException(
                        {
                            success: false,
                            errors: { message: error.message }
                        },
                        HttpStatus.UNAUTHORIZED
                    );

                case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
                    throw new HttpException(
                        {
                            success: false,
                            errors: { message: error.message }
                        },
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );

                default:
                    throw new HttpException(
                        {
                            success: false,
                            errors: { message: "Unknown error occurred." }
                        },
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
            }
        }

        const fid = data.fid;
        const event = data.event;

        switch (event.event) {
            case "frame_added":
                if (event.notificationDetails) {
                    await this.setUserNotificationDetails(fid, event.notificationDetails);
                    await this.sendFrameNotification({
                        fid,
                        title: "Welcome to AccessTime Me",
                        body: "Frame is now added to your client"
                    });
                } else {
                    await this.deleteUserNotificationDetails(fid);
                }
                break;

            case "frame_removed":
                await this.deleteUserNotificationDetails(fid);
                break;

            case "notifications_enabled":
                await this.setUserNotificationDetails(fid, event.notificationDetails);
                await this.sendFrameNotification({
                    fid,
                    title: "Ding ding ding",
                    body: "Notifications are now enabled"
                });
                break;

            case "notifications_disabled":
                await this.deleteUserNotificationDetails(fid);
                break;
        }

        return { success: true };
    }
}
