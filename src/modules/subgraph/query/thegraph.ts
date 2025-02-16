import { gql } from "graphql-request";
import { Address } from "viem";

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
            updateTimestamp
        }
    }
`;

export type SyncResponse = {
    accessTimeId: string;
    id: Address;
    owner: Address;
    prevOwner: Address;
    nextOwner: Address;
    updateTimestamp: string;
};

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

export type CountProjectsResponse = {
    accessTimeId: string;
};

export const CountProjectsDocument = gql`
    query CountProjects($paymentMethods: [Bytes!]) {
        accessTimes(
            orderDirection: desc
            orderBy: accessTimeId
            first: 1
            where: { paymentMethods_contains: $paymentMethods }
        ) {
            accessTimeId
        }
    }
`; // to-do, in filtering its not correct to use

export interface NewestProjectsResponse {
    id: Address;
    accessTimeId: string;
    totalVotePoint: string;
    totalVoteParticipantCount: string;
}

export const NewestProjectsDocument = gql`
    query NewestProjects($limit: Int!, $skip: Int!, $paymentMethods: [Bytes!]) {
        accessTimes(
            orderDirection: desc
            orderBy: accessTimeId
            first: $limit
            skip: $skip
            where: { paymentMethods_contains: $paymentMethods }
        ) {
            id
            accessTimeId
            totalVotePoint
            totalVoteParticipantCount
        }
    }
`;

export interface TopRatedProjectsResponse extends NewestProjectsResponse {}

export const TopRatedProjectsDocument = gql`
    query TopRatedProjects($limit: Int!, $skip: Int!, $paymentMethods: [Bytes!]) {
        accessTimes(
            orderDirection: desc
            orderBy: totalVotePoint
            first: $limit
            skip: $skip
            where: { paymentMethods_contains: $paymentMethods }
        ) {
            id
            accessTimeId
            totalVotePoint
            totalVoteParticipantCount
        }
    }
`;

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
        $paymentMethods: [Bytes!]
    ) {
        accessVotes(
            orderDirection: desc
            orderBy: votePoint
            first: $limit
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
`;

export type ProjectWeeklyVoteResponse = {
    participantCount: string;
    votePoint: string;
};

export const ProjectWeeklyVoteDocument = gql`
    query ProjectWeeklyVote($epochWeek: BigInt!, $accessTime: Bytes!) {
        accessVotes(
            where: { and: [{ accessTime_: { id: $accessTime } }, { epochWeek: $epochWeek }] }
        ) {
            participantCount
            votePoint
        }
    }
`;

export type CountWeeklyVoteProjectsResponse = {
    accessTimes: { paymentMethods: Address[] }[];
};

export const CountWeeklyVoteProjectsDocument = gql`
    query CountWeeklyVoteProjects($epochWeek: String!, $paymentMethods: [Bytes!]) {
        weeklyVotes(where: { id: $epochWeek }) {
            accessTimes(where: { paymentMethods_contains: $paymentMethods }) {
                paymentMethods
            }
        }
    }
`;
