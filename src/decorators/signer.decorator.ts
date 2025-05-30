import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Address, Hash, zeroAddress } from "viem";

import { signatureCheck } from "../helpers";

export const Signer = createParamDecorator(async (data: boolean, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    let signer: Address | undefined = request.signer as Address;

    if (data == false) {
        const message = request.get("X-ACCESSTIME-AUTH-MESSAGE");
        const signature = request.get("X-ACCESSTIME-AUTH-SIGNATURE");

        if (message && signature) {
            const [verifyResult, verifiedAddress] = await signatureCheck(
                message as Hash,
                signature as Hash,
                false
            );

            if (verifyResult == true) {
                signer = verifiedAddress;
            } else {
                return zeroAddress;
            }
        } else {
            return zeroAddress;
        }
    }
    return signer ? (signer.toLowerCase() as Address) : zeroAddress;
});
