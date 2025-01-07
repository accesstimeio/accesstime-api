import { WEEK_IN_SECONDS } from "src/common";
import { Address, encodeAbiParameters, keccak256 } from "viem";

const nowDate = () => Math.floor(Date.now() / 1000);

const getEpochWeek = () => Math.floor(nowDate() / WEEK_IN_SECONDS);

const aWeekAgo = () => nowDate() - WEEK_IN_SECONDS;

const generateFilename = (fileCategory: string, caller: Address) =>
    keccak256(
        encodeAbiParameters(
            [
                { name: "timestamp", type: "uint256" },
                { name: "caller", type: "address" },
                { name: "fileCategory", type: "string" }
            ],
            [BigInt(nowDate()), caller, fileCategory]
        )
    );

export { getEpochWeek, aWeekAgo, generateFilename };
