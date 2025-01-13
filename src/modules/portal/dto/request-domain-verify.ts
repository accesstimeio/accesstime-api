import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class RequestDomainVerifyResponseDto {
    @Expose()
    @ApiProperty()
    domain: string;

    @Expose()
    @ApiProperty()
    recordKey: string;

    @Expose()
    @ApiProperty()
    recordValue: string;
}
