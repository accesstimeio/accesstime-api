import { OmitType } from "@nestjs/swagger";

import { SubscriptionDto } from "./user-subscriptions.dto";

export class UserSubscriptionResponseDto extends OmitType(SubscriptionDto, [
    "chainId",
    "accessTimeAddress"
]) {}
