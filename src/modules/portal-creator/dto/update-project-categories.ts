import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UpdateProjectCategoriesDto {
    @Expose()
    @ApiProperty({ required: true, isArray: true })
    payload: number[];
}
