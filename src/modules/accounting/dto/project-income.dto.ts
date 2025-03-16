import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Address } from "viem";

export class ProjectIncomeDto {
    @Expose()
    @ApiProperty()
    accessTimeAddress: Address;

    @Expose()
    @ApiProperty()
    address: Address;

    @Expose()
    @ApiProperty()
    amount: string;

    @Expose()
    @ApiProperty()
    packageId: string;

    @Expose()
    @ApiProperty()
    paymentAmount: string;

    @Expose()
    @ApiProperty()
    paymentMethod: Address;

    @Expose()
    @ApiProperty()
    timestamp: string;
}

export class ProjectIncomesDto {
    @Expose()
    @ApiProperty({
        type: ProjectIncomeDto,
        isArray: true
    })
    items: ProjectIncomeDto[];

    @Expose()
    @ApiProperty()
    totalCount: number;

    @Expose()
    @ApiProperty()
    pageCursor: string | null;

    @Expose()
    @ApiProperty()
    maxPage: number;
}
