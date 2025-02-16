import { gql } from "graphql-request";
import { Address } from "viem";

export type CountDeploymentsResponse = {
    deploymentCount: number;
};

export const CountDeploymentsDocument = gql`
    query CountDeployments($owner: String!) {
        owner(id: $owner) {
            deploymentCount
        }
    }
`;

export const LastDeploymentsDocument = gql`
    query LastDeployments($owner: String!, $limit: Int!) {
        accessTimes(
            orderDirection: "desc"
            orderBy: "updateTimestamp"
            limit: $limit
            where: { owner: $owner }
        ) {
            items {
                accessTimeId
                id
                paused
            }
        }
    }
`;

export const ListDeploymentsDocument = gql`
    query ListDeployments($owner: String!, $limit: Int!, $after: String) {
        accessTimes(
            orderDirection: "desc"
            orderBy: "updateTimestamp"
            limit: $limit
            after: $after
            where: { owner: $owner }
        ) {
            items {
                accessTimeId
                id
                paused
            }
            pageInfo {
                endCursor
            }
        }
    }
`;

export const ProjectByIdDocument = gql`
    query ProjectById($id: BigInt!) {
        accessTimes(where: { accessTimeId: $id }) {
            items {
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
                updateTimestamp
            }
        }
    }
`;

export const SyncDocument = gql`
    query Sync {
        accessTimes(orderDirection: "desc", orderBy: "updateTimestamp", limit: 25) {
            items {
                accessTimeId
                id
                owner
                prevOwner
                nextOwner
                updateTimestamp
            }
        }
    }
`;

export const RatesDocument = gql`
    query Rates {
        factoryRates {
            items {
                id
                rate
            }
        }
    }
`;

export type CountProjectsResponse = {
    totalCount: number;
};

export const CountProjectsDocument = gql`
    query CountProjects($filter: accessTimeFilter!) {
        accessTimes(where: $filter) {
            totalCount
        }
    }
`;

export interface NewestProjectsResponse {
    id: Address;
    accessTimeId: string;
    totalVotePoint: string;
    totalVoteParticipantCount: number;
}

export const NewestProjectsDocument = gql`
    query NewestProjects($limit: Int!, $after: String, $filter: accessTimeFilter!) {
        accessTimes(
            orderDirection: "desc"
            orderBy: "accessTimeId"
            limit: $limit
            after: $after
            where: $filter
        ) {
            items {
                id
                accessTimeId
                totalVotePoint
                totalVoteParticipantCount
            }
            pageInfo {
                endCursor
            }
        }
    }
`;

export interface TopRatedProjectsResponse extends NewestProjectsResponse {}

export const TopRatedProjectsDocument = gql`
    query TopRatedProjects($limit: Int!, $after: String, $filter: accessTimeFilter!) {
        accessTimes(
            orderDirection: "desc"
            orderBy: "totalVotePoint"
            limit: $limit
            after: $after
            where: $filter
        ) {
            items {
                id
                accessTimeId
                totalVotePoint
                totalVoteParticipantCount
            }
            pageInfo {
                endCursor
            }
        }
    }
`;

export type WeeklyPopularProjectsResponse = {
    accessTimeAddress: Address;
    accessTimeId: string;
    participantCount: number;
    votePoint: string;
};

export const WeeklyPopularProjectsDocument = gql`
    query WeeklyPopularProjects($limit: Int!, $after: String, $filter: accessVoteFilter!) {
        accessVotes(
            orderDirection: "desc"
            orderBy: "votePoint"
            limit: $limit
            after: $after
            where: $filter
        ) {
            items {
                accessTimeAddress
                accessTimeId
                participantCount
                votePoint
            }
            pageInfo {
                endCursor
            }
        }
    }
`;

export type ProjectWeeklyVoteResponse = {
    participantCount: number;
    votePoint: string;
};

export const ProjectWeeklyVoteDocument = gql`
    query ProjectWeeklyVote($epochWeek: BigInt!, $accessTime: String!) {
        accessVotes(
            where: { AND: [{ accessTimeAddress: $accessTime }, { epochWeek: $epochWeek }] }
        ) {
            items {
                participantCount
                votePoint
            }
        }
    }
`;

export type CountWeeklyVoteProjectsResponse = {
    totalCount: number;
};

export const CountWeeklyVoteProjectsDocument = gql`
    query CountWeeklyVoteProjects($filter: accessVoteFilter!) {
        accessVotes(where: $filter) {
            totalCount
        }
    }
`;
