import { HttpException, HttpStatus } from "@nestjs/common";
import { Address, decodeAbiParameters, Hash, isAddress, verifyTypedData, zeroAddress } from "viem";

import { aWeekAgo } from "src/helpers";

import {
    API_VERSION,
    SIGNATURE_AUTH_DOMAIN,
    SIGNATURE_AUTH_MESSAGE_ABI_PARAMETERS,
    SIGNATURE_AUTH_TYPES
} from "src/common";

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

    const messageValues = decodeAbiParameters(SIGNATURE_AUTH_MESSAGE_ABI_PARAMETERS, message);
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

    if (messageValues[2] != API_VERSION) {
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

    const isValid = await verifyTypedData({
        address: messageCaller,
        domain: SIGNATURE_AUTH_DOMAIN,
        types: SIGNATURE_AUTH_TYPES,
        primaryType: "Auth",
        message: {
            timestamp: messageTimestamp,
            caller: messageCaller,
            apiVersion: API_VERSION
        },
        signature: signature
    });

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
