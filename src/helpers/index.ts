import { WEEK_IN_SECONDS } from "src/common";

const getEpochWeek = () => Math.floor(Math.floor(Date.now() / 1000) / WEEK_IN_SECONDS);

const aWeekAgo = () => Math.floor(Date.now() / 1000) - WEEK_IN_SECONDS;

export { getEpochWeek, aWeekAgo };
