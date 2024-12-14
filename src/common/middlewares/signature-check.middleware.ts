import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

import { signatureCheck } from "src/helpers/signature-check";
import { Hash } from "viem";

@Injectable()
export default class SignatureCheckMiddleware implements NestMiddleware {
    async use(req: Request, _res: Response, next: NextFunction) {
        const message = req.get("X-ACCESSTIME-AUTH-MESSAGE");
        const signature = req.get("X-ACCESSTIME-AUTH-SIGNATURE");

        await signatureCheck(message as Hash, signature as Hash, true);

        next();
    }
}
