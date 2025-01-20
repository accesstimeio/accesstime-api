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
    query ListDeployments($owner: String!, $limit: Int!, $skip: Int!) {
        accessTimes(
            orderDirection: desc
            orderBy: updateTimestamp
            limit: $limit
            skip: $skip
            where: { owner: $owner }
        ) {
            accessTimeId
            id
            paused
        }
    }
`; // to-do, pagination issue

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
                rates {
                    items {
                        token
                    }
                }
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
    accessTimeId: string;
};

export const CountProjectsDocument = gql`
    query CountProjects($paymentMethods: [String!]) {
        accessTimes(
            orderDirection: desc
            orderBy: accessTimeId
            limit: 1
            where: { paymentMethods_contains: $paymentMethods }
        ) {
            accessTimeId
        }
    }
`; // to-do, filtering issue

export interface NewestProjectsResponse {
    id: Address;
    accessTimeId: string;
    totalVotePoint: string;
    totalVoteParticipantCount: string;
}

export const NewestProjectsDocument = gql`
    query NewestProjects($limit: Int!, $skip: Int!, $paymentMethods: [String!]) {
        accessTimes(
            orderDirection: desc
            orderBy: accessTimeId
            limit: $limit
            skip: $skip
            where: { paymentMethods_contains: $paymentMethods }
        ) {
            id
            accessTimeId
            totalVotePoint
            totalVoteParticipantCount
        }
    }
`; // to-do, pagination issue - filtering issue

export interface TopRatedProjectsResponse extends NewestProjectsResponse {}

export const TopRatedProjectsDocument = gql`
    query TopRatedProjects($limit: Int!, $skip: Int!, $paymentMethods: [String!]) {
        accessTimes(
            orderDirection: desc
            orderBy: totalVotePoint
            limit: $limit
            skip: $skip
            where: { paymentMethods_contains: $paymentMethods }
        ) {
            id
            accessTimeId
            totalVotePoint
            totalVoteParticipantCount
        }
    }
`; // to-do, pagination issue - filtering issue

export type WeeklyPopularProjectsResponse = {
    accessTime: {
        id: Address;
        accessTimeId: string;
    };
    participantCount: string;
    votePoint: string;
};

export const WeeklyPopularProjectsDocument = gql`
    query WeeklyPopularProjects(
        $epochWeek: BigInt!
        $limit: Int!
        $skip: Int!
        $paymentMethods: [String!]
    ) {
        accessVotes(
            orderDirection: desc
            orderBy: votePoint
            limit: $limit
            skip: $skip
            where: {
                and: [
                    { accessTime_: { paymentMethods_contains: $paymentMethods } }
                    { epochWeek: $epochWeek }
                ]
            }
        ) {
            accessTime {
                id
                accessTimeId
            }
            participantCount
            votePoint
        }
    }
`; // to-do, pagination issue - filtering issue

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
    accessTimes: { paymentMethods: Address[] }[];
};

export const CountWeeklyVoteProjectsDocument = gql`
    query CountWeeklyVoteProjects($epochWeek: String!, $paymentMethods: [String!]) {
        weeklyVotes(where: { id: $epochWeek }) {
            accessTimes(where: { paymentMethods_contains: $paymentMethods }) {
                paymentMethods
            }
        }
    }
`; // to-do, filtering issue
