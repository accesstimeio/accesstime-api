import { gql } from "graphql-request";
import { Address } from "src/helpers";

export const SYNC_QUERY = gql`
    query Sync @live {
        accessTimes(orderDirection: desc, orderBy: updateTimestamp, limit: 25) {
            accessTimeId
            id
            owner
            prevOwner
            nextOwner
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
