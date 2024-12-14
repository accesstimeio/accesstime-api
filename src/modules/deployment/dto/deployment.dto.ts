import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Address } from "viem";

export class DeploymentDto {
    @Expose()
    @ApiProperty()
    accessTimeId: string;

    @Expose()
    @ApiProperty()
    id: Address;

    @Expose()
    @ApiProperty()
    paused: boolean;
}
