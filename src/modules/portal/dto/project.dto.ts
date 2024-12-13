import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { Address } from "src/helpers";

export class ProjectSocialDto {
    @Expose()
    @ApiProperty()
    type: number;

    @Expose()
    @ApiProperty()
    url: string;
}

export class ProjectCardDto {
    @Expose()
    @ApiProperty()
    id: Address;

    @Expose()
    @ApiProperty()
    avatar: string | null;

    @Expose()
    @ApiProperty()
    votePoint: number;

    @Expose()
    @ApiProperty()
    voteParticipantCount: number;

    @Expose()
    @ApiProperty()
    isFavorited: boolean;
}

export class ProjectDto extends ProjectCardDto {
    @Expose()
    @ApiProperty({
        type: ProjectSocialDto,
        isArray: true
    })
    @ValidateNested({ each: true })
    @Type(() => ProjectSocialDto)
    socials: ProjectSocialDto[];

    @Expose()
    @ApiProperty({
        isArray: true
    })
    categories: number[];
}
