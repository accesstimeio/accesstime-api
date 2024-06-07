import { Injectable } from "@nestjs/common";
import { InjectGraphQLClient } from "@golevelup/nestjs-graphql-request";
import { GraphQLClient, gql } from "graphql-request";
import { Address } from "src/helpers";
import { LastDeploymentResponseDto } from "../deployment/dto";

const LAST_DEPLOYMENTS_QUERY = gql`
    query LastDeployments($owner: String!, $limit: Int!) {
        accessTimes(
            orderDirection: desc
            orderBy: updateTimestamp
            first: $limit
            where: { owner: $owner }
        ) {
            accessTimeId
            id
            paused
        }
    }
`;

@Injectable()
export class SubgraphService {
    constructor(@InjectGraphQLClient() private readonly client: GraphQLClient) {}

    async lastDeployments(address: Address) {
        const { accessTimes }: { accessTimes: LastDeploymentResponseDto[] } =
            await this.client.request(LAST_DEPLOYMENTS_QUERY, {
                owner: address,
                limit: Number(process.env.LAST_DEPLOYMENTS_LIMIT)
            });

        return accessTimes;
    }
}
