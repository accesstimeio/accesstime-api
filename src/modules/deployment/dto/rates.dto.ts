import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Address } from "src/helpers";

export class RatesDto {
    @Expose()
    @ApiProperty()
    id: Address;

    @Expose()
    @ApiProperty()
    rate: string;
}
