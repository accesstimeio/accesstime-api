import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Address } from "src/helpers";

export class LastDeploymentResponseDto {
    @Expose()
    @ApiProperty()
    accessTimeId: string;

    @Expose()
    @ApiProperty()
    extraTimes: string[];

    @Expose()
    @ApiProperty()
    id: Address;

    @Expose()
    @ApiProperty()
    packages: string[];

    @Expose()
    @ApiProperty()
    paused: boolean;

    @Expose()
    @ApiProperty()
    paymentMethods: Address[];

    @Expose()
    @ApiProperty()
    prevOwner: Address;

    @Expose()
    @ApiProperty()
    nextOwner: Address;
}
