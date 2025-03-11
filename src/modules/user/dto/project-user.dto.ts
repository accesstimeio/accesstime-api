import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Address } from "viem";

export class ProjectUserDto {
    @Expose()
    @ApiProperty()
    address: Address;

    @Expose()
    @ApiProperty()
    totalPurchasedTime: string;

    @Expose()
    @ApiProperty()
    endTime: string;
}

export class ProjectUsersDto {
    @Expose()
    @ApiProperty({
        type: ProjectUserDto,
        isArray: true
    })
    items: ProjectUserDto[];

    @Expose()
    @ApiProperty()
    totalCount: number;

    @Expose()
    @ApiProperty()
    pageCursor: string | null;
}
