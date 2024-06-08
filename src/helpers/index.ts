import { isAddress, Address } from "./address";

function isAsyncIterable<T>(obj: any): obj is AsyncIterable<T> {
    return typeof obj[Symbol.asyncIterator] === "function";
}

export { isAddress, Address, isAsyncIterable };
