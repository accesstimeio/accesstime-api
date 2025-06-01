import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { Address } from "viem";

export class SubscriptionDto {
    @Expose()
    @ApiProperty()
    chainId: number;

    @Expose()
    @ApiProperty()
    accessTimeAddress: Address;

    @Expose()
    @ApiProperty()
    endTime: number;

    @Expose()
    @ApiProperty()
    totalPurchasedTime: number;
}

export class UserSubscriptionsResponseDto {
    @Expose()
    @ApiProperty()
    maxPage: number;

    @Expose()
    @ApiProperty({
        type: SubscriptionDto,
        isArray: true
    })
    @ValidateNested({ each: true })
    @Type(() => SubscriptionDto)
    subscriptions: SubscriptionDto[];

    @Expose()
    @ApiProperty()
    totalCount: number;
}
