import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class StatisticsResponseDto {
    @Expose()
    @ApiProperty()
    value: string;

    @Expose()
    @ApiProperty()
    timeIndex: string;
}
