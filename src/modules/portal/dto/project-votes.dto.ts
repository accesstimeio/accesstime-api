import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ProjectVotesResponseDto {
    @Expose()
    @ApiProperty()
    previousVotePoint: number;

    @Expose()
    @ApiProperty()
    previousVoteParticipantCount: number;

    @Expose()
    @ApiProperty()
    votePoint: number;

    @Expose()
    @ApiProperty()
    voteParticipantCount: number;
}
