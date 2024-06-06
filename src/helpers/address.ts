export type Address = `0x${string}`;

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export function isAddress(address: string): address is Address {
    const result = (() => {
        if (!addressRegex.test(address)) return false;
        if (address.toLowerCase() === address) return true;
        return true;
    })();

    return result;
}
