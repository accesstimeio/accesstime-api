import { HttpException, HttpStatus } from "@nestjs/common";
import { Address, decodeAbiParameters, Hash, isAddress, zeroAddress } from "viem";
import { Api, AuthSignature } from "@accesstimeio/accesstime-common";

import { aWeekAgo } from "src/helpers";

export const signatureCheck = async (
    message: Hash,
    signature: Hash,
    throwError: boolean
): Promise<[boolean, Address]> => {
    if (!message || !signature) {
        if (!throwError) {
            return [false, zeroAddress];
        }
        throw new HttpException(
            {
                errors: { message: "Required fields are empty!" }
            },
            HttpStatus.EXPECTATION_FAILED
        );
    }

    const messageValues = decodeAbiParameters(AuthSignature.abiParameters, message);
    const messageTimestamp = Number(messageValues[0].toString());
    const messageCaller = messageValues[1];

    if (aWeekAgo() > messageTimestamp) {
        if (!throwError) {
            return [false, zeroAddress];
        }
        throw new HttpException(
            {
                errors: { message: "Signature's timestamp is very old!" }
            },
            HttpStatus.EXPECTATION_FAILED
        );
    }

    if (!isAddress(messageCaller)) {
        if (!throwError) {
            return [false, zeroAddress];
        }
        throw new HttpException(
            {
                errors: { message: "Caller address is invalid!" }
            },
            HttpStatus.EXPECTATION_FAILED
        );
    }

    if (messageValues[2] != Api.version) {
        if (!throwError) {
            return [false, zeroAddress];
        }
        throw new HttpException(
            {
                errors: { message: "Signature's API version it not correct!" }
            },
            HttpStatus.EXPECTATION_FAILED
        );
    }

    const isValid = await AuthSignature.verifyAuthConfig(
        BigInt(messageTimestamp),
        messageCaller,
        signature
    );

    if (!isValid) {
        if (!throwError) {
            return [false, zeroAddress];
        }
        throw new HttpException(
            {
                errors: { message: "Signature is invalid!" }
            },
            HttpStatus.UNAUTHORIZED
        );
    }

    return [isValid, messageCaller.toLowerCase() as Address];
};
