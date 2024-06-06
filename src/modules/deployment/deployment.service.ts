import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Address, isAddress } from "src/helpers";
import { SubgraphService } from "../subgraph/subgraph.service";
import { LastDeploymentResponseDto } from "./dto";

@Injectable()
export class DeploymentService {
    constructor(private readonly subgraphService: SubgraphService) {}

    async lastDeployments(address: Address): Promise<LastDeploymentResponseDto[]> {
        const validAddress = isAddress(address);

        if (!validAddress) {
            throw new HttpException(
                {
                    errors: { message: "Given fields is not valid." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        return this.subgraphService.lastDeployments(address);
    }

    async listDeployments(address: Address, page?: number) {
        const validAddress = isAddress(address);
        const requestedPage = page ? page : 0;

        if (!validAddress) {
            throw new HttpException(
                {
                    errors: { message: "Given fields is not valid." }
                },
                HttpStatus.BAD_REQUEST
            );
        }
        console.log(address);
        console.log(requestedPage);

        return true;
    }
}
