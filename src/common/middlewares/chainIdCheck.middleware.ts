import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { SUPPORTED_CHAIN_IDS } from "..";

@Injectable()
export default class ChainIdCheckMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction) {
        const foundChainId: string | undefined = req.params.chainId || req.body.chainId;
        if (!foundChainId) {
            throw new HttpException(
                {
                    errors: { message: "Required chainId is not found." }
                },
                HttpStatus.BAD_REQUEST
            );
        } else {
            if (
                !isNaN(Number(foundChainId)) &&
                !SUPPORTED_CHAIN_IDS.includes(Number(foundChainId))
            ) {
                throw new HttpException(
                    {
                        errors: { message: "Requested chainId is not supported." }
                    },
                    HttpStatus.BAD_REQUEST
                );
            }
        }
        next();
    }
}
