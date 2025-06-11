import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { FarcasterController } from "./farcaster.controller";
import { FarcasterService } from "./farcaster.service";
import { FrameUser, FrameUserSchema } from "./schemas/frame-user.schema";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            { name: FrameUser.name, useFactory: () => FrameUserSchema }
        ])
    ],
    controllers: [FarcasterController],
    providers: [FarcasterService]
})
export class FarcasterModule {}
