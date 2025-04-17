import { gql } from "graphql-request";
import { Address, Hash } from "viem";

export type CountDeploymentsResponse = {
    deploymentCount: number;
};

export const CountDeploymentsDocument = gql`
    query CountDeployments($chainId: Float!, $owner: String!) {
        owner(id: $owner, chainId: $chainId) {
            deploymentCount
        }
    }
`;

export const LastDeploymentsDocument = gql`
    query LastDeployments($chainId: Int, $owner: String!, $limit: Int!) {
        accessTimes(
            orderDirection: "desc"
            orderBy: "updateTimestamp"
            limit: $limit
            where: { owner: $owner, chainId: $chainId }
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
    query ListDeployments($chainId: Int, $owner: String!, $limit: Int!, $after: String) {
        accessTimes(
            orderDirection: "desc"
            orderBy: "updateTimestamp"
            limit: $limit
            after: $after
            where: { owner: $owner, chainId: $chainId }
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
    query ProjectById($chainId: Int, $id: BigInt!) {
        accessTimes(where: { accessTimeId: $id, chainId: $chainId }) {
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

export type SyncResponse = {
    accessTimeId: string;
    id: Address;
    owner: Address;
    prevOwner: Address;
    nextOwner: Address;
    updateTimestamp: string;
};

export const SyncDocument = gql`
    query Sync($chainId: Int) {
        accessTimes(
            where: { chainId: $chainId }
            orderDirection: "desc"
            orderBy: "updateTimestamp"
            limit: 25
        ) {
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
    query Rates($chainId: Int) {
        factoryRates(where: { chainId: $chainId }) {
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
    query ProjectWeeklyVote($chainId: Int, $epochWeek: BigInt!, $accessTime: String!) {
        accessVotes(
            where: { chainId: $chainId, accessTimeAddress: $accessTime, epochWeek: $epochWeek }
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

export type StatisticsResponse = {
    value: string;
    timeIndex: string;
};

export const StatisticsDocument = gql`
    query StatisticsDocument(
        $chainId: Int
        $limit: Int
        $address: String
        $internalType: Int
        $timeGap: BigInt
        $type: Int
    ) {
        statistics(
            limit: $limit
            orderBy: "timeIndex"
            orderDirection: "desc"
            where: {
                chainId: $chainId
                address: $address
                timeGap: $timeGap
                internalType: $internalType
                type: $type
            }
        ) {
            items {
                value
                timeIndex
            }
        }
    }
`;

export const StatisticDocument = gql`
    query StatisticDocument($id: String!, $chainId: Float!) {
        statistic(id: $id, chainId: $chainId) {
            timeIndex
            value
        }
    }
`;

export type AccessTimeUsersResponse = {
    address: Address;
    totalPurchasedTime: string;
    endTime: string;
    usedPaymentMethods: Address[];
};

export const AccessTimeUsersDocument = gql`
    query AccessTimeUsersDocument(
        $chainId: Int
        $limit: Int!
        $after: String
        $accessTimeAddress: String
        $orderBy: String
    ) {
        accessTimeUsers(
            limit: $limit
            after: $after
            where: { accessTimeAddress: $accessTimeAddress, chainId: $chainId }
            orderBy: $orderBy
            orderDirection: "desc"
        ) {
            items {
                address
                totalPurchasedTime
                endTime
                usedPaymentMethods
            }
            pageInfo {
                endCursor
            }
            totalCount
        }
    }
`;

export type PurchasesResponse = {
    accessTimeAddress: Address;
    address: Address;
    amount: string;
    packageId: string;
    paymentAmount: string;
    paymentMethod: Address;
    timestamp: string;
};

export const PurchasesDocument = gql`
    query PurchasesDocument(
        $chainId: Int
        $limit: Int!
        $after: String
        $accessTimeAddress: String
    ) {
        purchases(
            orderBy: "timestamp"
            orderDirection: "desc"
            limit: $limit
            after: $after
            where: { accessTimeAddress: $accessTimeAddress, chainId: $chainId }
        ) {
            items {
                accessTimeAddress
                address
                amount
                packageId
                paymentAmount
                paymentMethod
                timestamp
            }
            totalCount
            pageInfo {
                endCursor
            }
        }
    }
`;

export type SyncStatisticsResponse = {
    address: Address;
    id: Hash;
    type: number;
    value: string;
};

export const SyncStatisticsDocument = gql`
    query SyncStatisticsDocument($chainId: Int, $limit: Int!, $after: String, $timeIndex: BigInt) {
        statistics(
            limit: $limit
            after: $after
            where: { timeGap: "604800", timeIndex: $timeIndex, chainId: $chainId }
        ) {
            items {
                address
                id
                type
                value
            }
            totalCount
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
`;
