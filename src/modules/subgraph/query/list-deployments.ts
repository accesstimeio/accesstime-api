import { gql } from "graphql-request";

export const LIST_DEPLOYMENTS_QUERY = gql`
    query ListDeployments($owner: String!, $limit: Int!, $skip: Int!) {
        accessTimes(
            orderDirection: desc
            orderBy: updateTimestamp
            first: $limit
            skip: $skip
            where: { owner: $owner }
        ) {
            accessTimeId
            id
            paused
        }
    }
`;
