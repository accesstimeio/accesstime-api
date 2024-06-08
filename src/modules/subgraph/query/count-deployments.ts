import { gql } from "graphql-request";

export const COUNT_DEPLOYMENTS_QUERY = gql`
    query CountDeployments($owner: String!) {
        owner(id: $owner) {
            deploymentCount
        }
    }
`;

export type CountDeploymentsResponse = {
    deploymentCount: string;
};
