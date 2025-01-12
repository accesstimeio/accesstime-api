import {
    Chain,
    Contract,
    getFactoryAddress,
    SUPPORTED_CHAIN
} from "@accesstimeio/accesstime-common";
import { HttpException, HttpStatus } from "@nestjs/common";
import { createPublicClient, http, zeroAddress } from "viem";

export const getFactoryOwner = async (chainId: number, throwError?: boolean) => {
    const factoryAddress = getFactoryAddress(chainId as SUPPORTED_CHAIN);

    if (factoryAddress == zeroAddress) {
        if (!throwError) {
            return zeroAddress;
        }
        throw new HttpException(
            {
                errors: { message: "Required fields are empty!" }
            },
            HttpStatus.EXPECTATION_FAILED
        );
    }

    try {
        const client = createPublicClient({
            chain: Chain.wagmiConfig.find((chain) => chain.id == chainId),
            transport: http()
        });

        return await client.readContract({
            address: factoryAddress,
            abi: Contract.abis.factory,
            functionName: "owner"
        });
    } catch (_err) {
        if (!throwError) {
            return zeroAddress;
        }
        throw new HttpException(
            {
                errors: { message: "Factory contract call failed!" }
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
};
