import { gql } from "graphql-request";
import { Address } from "src/helpers";

export type SyncResponse = {
    accessTimeId: string;
    id: Address;
    owner: Address;
    prevOwner: Address;
    nextOwner: Address;
    updateTimestamp: string;
};

export type CountDeploymentsResponse = {
    deploymentCount: string;
};

export const CountDeploymentsDocument = gql`
    query CountDeployments($owner: ID!) {
        owner(id: $owner) {
            deploymentCount
        }
    }
`;

export const LastDeploymentsDocument = gql`
    query LastDeployments($owner: Bytes!, $limit: Int!) {
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

export const ListDeploymentsDocument = gql`
    query ListDeployments($owner: Bytes!, $limit: Int!, $skip: Int!) {
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

export const ProjectByIdDocument = gql`
    query ProjectById($id: BigInt!) {
        accessTimes(where: { accessTimeId: $id }) {
            id
            extraTimes
            removedExtraTimes
            nextOwner
            owner
            packages
            removedPackages
            paused
            paymentMethods
            prevOwner
        }
    }
`;

export const SyncDocument = gql`
    query Sync {
        accessTimes(orderDirection: desc, orderBy: updateTimestamp, first: 25) {
            accessTimeId
            id
            owner
            prevOwner
            nextOwner
            updateTimestamp
        }
    }
`;

export const RatesDocument = gql`
    query Rates {
        factoryRates {
            id
            rate
        }
    }
`;
