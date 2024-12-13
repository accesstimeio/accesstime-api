import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import {
    DEFAULT_SORT_TYPE,
    SUPPORTED_PORTAL_SORT_TYPE,
    SUPPORTED_PORTAL_SORT_TYPES
} from "src/common";

import { SubgraphService } from "../subgraph/subgraph.service";

import { ExploreResponseDto, ProjectCardDto } from "./dto";

@Injectable()
export class PortalService {
    constructor(private readonly subgraphService: SubgraphService) {}

    async getExplore(
        chainId: number,
        page?: number,
        sort?: SUPPORTED_PORTAL_SORT_TYPE
    ): Promise<ExploreResponseDto> {
        const queryPage = page ?? 0;
        const limit = Number(process.env.LIST_DEPLOYMENTS_LIMIT); // to-do
        let querySort: SUPPORTED_PORTAL_SORT_TYPE = DEFAULT_SORT_TYPE;
        let countProjects: number = 0;

        if (sort) {
            if (SUPPORTED_PORTAL_SORT_TYPES.includes(sort)) {
                querySort = sort;
            } else {
                throw new HttpException(
                    {
                        errors: { message: "Requested sort type is not supported." }
                    },
                    HttpStatus.EXPECTATION_FAILED
                );
            }
        }

        const projects: ProjectCardDto[] = [];

        if (querySort != "weekly_popular") {
            countProjects = await this.subgraphService.countProjects(chainId);

            const requestable =
                limit - ((queryPage + 1) * limit - countProjects) > 0 ? true : false;

            if (!requestable) {
                throw new HttpException(
                    {
                        errors: { message: "Requested page exceeds page limit." }
                    },
                    HttpStatus.EXPECTATION_FAILED
                );
            }
        }

        switch (querySort) {
            case "newest":
                const newestProjects = await this.subgraphService.newestProjects(
                    chainId,
                    queryPage
                );

                // const newestProjectsIds = newestProjects.map((project) => project.id);

                newestProjects.forEach(({ id, totalVotePoint, totalVoteParticipantCount }) => {
                    projects.push({
                        id,
                        avatar: null,
                        votePoint: Number(totalVotePoint),
                        voteParticipantCount: Number(totalVoteParticipantCount),
                        isFavorited: false
                    });
                });
                break;
            case "top_rated":
                const topRatedProjects = await this.subgraphService.topRatedProjects(
                    chainId,
                    queryPage
                );

                // const topRatedProjectsIds = topRatedProjects.map((project) => project.id);

                topRatedProjects.forEach(({ id, totalVotePoint, totalVoteParticipantCount }) => {
                    projects.push({
                        id,
                        avatar: null,
                        votePoint: Number(totalVotePoint),
                        voteParticipantCount: Number(totalVoteParticipantCount),
                        isFavorited: false
                    });
                });
                break;
            default:
                const weeklyPopularProjects = await this.subgraphService.weeklyPopularProjects(
                    chainId,
                    queryPage
                );

                // const weeklyPopularProjectsIds = weeklyPopularProjects.map((project) => project.accessTime);

                weeklyPopularProjects.forEach(({ accessTime, totalPoint, participantCount }) => {
                    projects.push({
                        id: accessTime,
                        avatar: null,
                        votePoint: Number(totalPoint),
                        voteParticipantCount: Number(participantCount),
                        isFavorited: false
                    });
                });
                break;
        }

        return { countProjects, maxPage: Math.floor(countProjects / limit), projects };
    }
}
