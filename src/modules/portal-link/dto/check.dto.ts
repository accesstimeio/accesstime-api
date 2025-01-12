import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CheckResponseDto {
    @Expose()
    @ApiProperty()
    allowed: boolean | null;
}
