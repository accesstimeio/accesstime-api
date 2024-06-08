import { gql } from "graphql-request";
import { LastDeploymentResponseDto } from "src/modules/deployment/dto";

export const LAST_DEPLOYMENTS_QUERY = gql`
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

export interface LastDeploymentsResponse extends LastDeploymentResponseDto {}
