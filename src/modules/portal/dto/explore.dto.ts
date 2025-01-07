import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { ProjectCardDto } from "./project.dto";

export class ExploreResponseDto {
    @Expose()
    @ApiProperty()
    countProjects: number;

    @Expose()
    @ApiProperty()
    maxPage: number;

    @Expose()
    @ApiProperty({
        type: ProjectCardDto,
        isArray: true
    })
    @ValidateNested({ each: true })
    @Type(() => ProjectCardDto)
    projects: ProjectCardDto[];
}
