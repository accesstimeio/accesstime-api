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
