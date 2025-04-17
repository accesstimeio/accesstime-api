import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { DeploymentDto } from "./deployment.dto";

export class ListDeploymentResponseDto {
    @Expose()
    @ApiProperty()
    maxPage: number;

    @Expose()
    @ApiProperty({
        type: DeploymentDto,
        isArray: true
    })
    @ValidateNested({ each: true })
    @Type(() => DeploymentDto)
    deployments: DeploymentDto[];

    @Expose()
    @ApiProperty()
    totalCount: number;

    @Expose()
    @ApiProperty()
    pageCursor: string | null;
}
