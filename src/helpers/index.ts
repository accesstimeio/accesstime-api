import { isAddress, Address } from "./address";

const aWeek = 60 * 60 * 24 * 7; // seconds * minutes * hours * 7 day
const getEpochWeek = () => Math.floor(Math.floor(Date.now() / 1000) / aWeek);

export { isAddress, Address, getEpochWeek };
