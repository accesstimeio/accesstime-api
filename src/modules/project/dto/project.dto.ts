import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Address } from "src/helpers";

export class ProjectResponseDto {
    @Expose()
    @ApiProperty()
    id: Address;

    @Expose()
    @ApiProperty()
    extraTimes: string[];

    @Expose()
    @ApiProperty()
    nextOwner: Address;

    @Expose()
    @ApiProperty()
    owner: Address;

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
    updateTimestamp: string;
}
