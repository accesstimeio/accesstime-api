import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { Address } from "viem";

export class ProjectSocialDto {
    @Expose()
    @ApiProperty()
    type: number;

    @Expose()
    @ApiProperty()
    url: string;
}

export class ProjectPackageDto {
    @Expose()
    @ApiProperty()
    id: number;

    @Expose()
    @ApiProperty()
    title: string;

    @Expose()
    @ApiProperty()
    backgroundUrl: string;

    @Expose()
    @ApiProperty()
    contentUrl: string;
}

export class ProjectCardDto {
    @Expose()
    @ApiProperty()
    id: Address;

    @Expose()
    @ApiProperty()
    avatarUrl: string | null;

    @Expose()
    @ApiProperty()
    votePoint: number;

    @Expose()
    @ApiProperty()
    voteParticipantCount: number;

    @Expose()
    @ApiProperty()
    isFavorited: boolean;

    @Expose()
    @ApiProperty({
        isArray: true
    })
    categories: number[];
}

export class ProjectDto extends OmitType(ProjectCardDto, ["id"]) {
    @Expose()
    @ApiProperty({
        type: ProjectSocialDto,
        isArray: true
    })
    @ValidateNested({ each: true })
    @Type(() => ProjectSocialDto)
    socials: ProjectSocialDto[];

    @Expose()
    @ApiProperty()
    contentUrl: string | null;

    @Expose()
    @ApiProperty()
    paymentMethods: Address[];

    @Expose()
    @ApiProperty({
        type: ProjectPackageDto,
        isArray: true
    })
    @ValidateNested({ each: true })
    @Type(() => ProjectPackageDto)
    packages: ProjectPackageDto[];
}
