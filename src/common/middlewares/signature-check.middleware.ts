import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { Hash } from "viem";

import { signatureCheck } from "src/helpers";

@Injectable()
export default class SignatureCheckMiddleware implements NestMiddleware {
    async use(req: Request, _res: Response, next: NextFunction) {
        const message = req.get("X-ACCESSTIME-AUTH-MESSAGE");
        const signature = req.get("X-ACCESSTIME-AUTH-SIGNATURE");

        const verifyResult = await signatureCheck(message as Hash, signature as Hash, true);

        (req as any).signer = verifyResult[1].toLowerCase();

        next();
    }
}
