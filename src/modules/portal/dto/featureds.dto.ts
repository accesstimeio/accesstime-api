import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Address } from "viem";

export class FeaturedsResponseDto {
    @Expose()
    @ApiProperty()
    id: string;

    @Expose()
    @ApiProperty()
    chainId: number;

    @Expose()
    @ApiProperty()
    address: Address;

    @Expose()
    @ApiProperty()
    avatarUrl: string | null;

    @Expose()
    @ApiProperty()
    domainVerify: boolean;

    @Expose()
    @ApiProperty()
    portalVerify: boolean;
}
