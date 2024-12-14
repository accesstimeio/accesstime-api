import { parseAbiParameters, TypedData, TypedDataDomain } from "viem";

export const SUPPORTED_CHAIN_IDS = [8453, 84532]; // base, baseSepolia

export const DEFAULT_SORT_TYPE = "weekly_popular";
export type SUPPORTED_PORTAL_SORT_TYPE = "weekly_popular" | "top_rated" | "newest";
export const SUPPORTED_PORTAL_SORT_TYPES = ["weekly_popular", "top_rated", "newest"];

export const WEEK_IN_SECONDS = 60 * 60 * 24 * 7; // seconds * minutes * hours * 7 day

export const API_VERSION = "0.1.0";

export const SIGNATURE_AUTH_MESSAGE_ABI_PARAMETERS = parseAbiParameters(
    "uint256 timestamp, address caller, string apiVersion"
);

export const SIGNATURE_AUTH_DOMAIN: TypedDataDomain = {
    name: "AccessTime API",
    version: API_VERSION
};

export const SIGNATURE_AUTH_TYPES: TypedData = {
    Auth: [
        { name: "timestamp", type: "uint256" },
        { name: "caller", type: "address" },
        { name: "apiVersion", type: "string" }
    ]
};
