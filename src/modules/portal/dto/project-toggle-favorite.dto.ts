import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ProjectToggleFavoriteResponseDto {
    @Expose()
    @ApiProperty()
    isFavoritedNow: boolean | null;
}
