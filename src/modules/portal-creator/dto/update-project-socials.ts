import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ProjectSocialDto {
    @Expose()
    @ApiProperty({ required: true })
    type: number;

    @Expose()
    @ApiProperty({ required: true })
    url: string;
}

export class UpdateProjectSocialsDto {
    @Expose()
    @ApiProperty({ required: true, isArray: true, type: [ProjectSocialDto] })
    payload: ProjectSocialDto[];
}
