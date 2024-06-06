import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Address, isAddress } from "src/helpers";

@Injectable()
export class DeploymentService {
    constructor() {}

    async lastDeployments(address: Address) {
        const validAddress = isAddress(address);

        if (!validAddress) {
            throw new HttpException(
                {
                    errors: { message: "Given fields is not valid." }
                },
                HttpStatus.BAD_REQUEST
            );
        }
        console.log(address);

        return true;
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
