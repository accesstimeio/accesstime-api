import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CheckDomainVerifyResponseDto {
    @Expose()
    @ApiProperty()
    status: boolean;
}
