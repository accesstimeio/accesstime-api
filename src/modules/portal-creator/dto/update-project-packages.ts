import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ProjectPackageDto {
    @Expose()
    @ApiProperty({ required: true })
    id: number;

    @Expose()
    @ApiProperty({ required: true })
    title: string;
}

export class UpdateProjectPackagesDto {
    @Expose()
    @ApiProperty({ required: true, isArray: true, type: [ProjectPackageDto] })
    payload: ProjectPackageDto[];
}
