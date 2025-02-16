import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { Address } from "viem";
import { ProjectCardDto } from "./project.dto";

export class FeaturedsResponseDto extends OmitType(ProjectCardDto, [
    "id",
    "votePoint",
    "voteParticipantCount",
    "isFavorited",
    "categories"
]) {
    @Expose()
    @ApiProperty()
    id: string;

    @Expose()
    @ApiProperty()
    chainId: number;

    @Expose()
    @ApiProperty()
    address: Address;
}
