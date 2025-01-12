import { Expose } from "class-transformer";
import { CheckResponseDto } from "./check.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateStatusDto extends CheckResponseDto {}

export class UpdateStatusResponseDto {
    @Expose()
    @ApiProperty()
    allowed: boolean | null;
}
