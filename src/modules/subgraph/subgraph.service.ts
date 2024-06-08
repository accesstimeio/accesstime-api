import { Injectable } from "@nestjs/common";
import { gql } from "graphql-request";
import { Address } from "src/helpers";
import { LastDeploymentResponseDto } from "../deployment/dto";
import { execute } from "@graphclient/index";

const LAST_DEPLOYMENTS_QUERY = gql`
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

@Injectable()
export class SubgraphService {
    async lastDeployments(address: Address) {
        const result = await execute(LAST_DEPLOYMENTS_QUERY, {
            owner: address,
            limit: Number(process.env.LAST_DEPLOYMENTS_LIMIT)
        });
        if (result.errors && result.errors.length != 0) {
            throw new Error("Subgraph query failed!");
        }
        const { accessTimes }: { accessTimes: LastDeploymentResponseDto[] } = result.data;

        return accessTimes;
    }
}
