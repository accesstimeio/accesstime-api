import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Address, Hash } from "viem";

import { signatureCheck } from "../helpers/signature-check";

export const Signer = createParamDecorator((data: boolean, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    let signer: Address | undefined = request.signer as Address;

    if (data == false) {
        const message = request.get("X-ACCESSTIME-AUTH-MESSAGE");
        const signature = request.get("X-ACCESSTIME-AUTH-SIGNATURE");

        if (message && signature) {
            signatureCheck(message as Hash, signature as Hash, false).then((verifyResult) => {
                if (verifyResult[0] == true) {
                    signer = verifyResult[1];

                    return signer;
                } else {
                    return undefined;
                }
            });
        } else {
            return undefined;
        }
    } else {
        return signer;
    }
});
