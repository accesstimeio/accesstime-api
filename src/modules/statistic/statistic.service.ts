import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Address, encodeAbiParameters, Hash, keccak256, zeroAddress } from "viem";

import { StatisticsResponseDto } from "./dto";

import { SubgraphService } from "../subgraph/subgraph.service";
import { ProjectService } from "../project/project.service";

const day = 60n * 60n * 24n;
const week = 7n * day;
const month = 30n * day;

export enum StatisticTimeGap {
    WEEK = Number(week.toString()),
    MONTH = Number(month.toString())
}

enum StatisticType {
    DEPLOY_COUNT = 0,
    SOLD_ACCESSTIME = 1,
    USER = 2,
    NEW_USER = 3,
    VOTE = 4,
    INCOME = 5
}

enum StatisticSoldAccessTimeType {
    COMPANY = 10,
    PROJECT = 11
}

enum StatisticUserType {
    COMPANY = 20,
    PROJECT = 21
}

enum StatisticNewUserType {
    COMPANY = 30,
    PROJECT = 31,
    CUMULATIVE_PROJECTS = 32
}

enum StatisticVoteType {
    COMPANY = 40,
    PROJECT = 51
}

enum StatisticIncomeType {
    COMPANY = 50,
    PROJECT = 51,
    CUMULATIVE_PROJECTS = 52
}

type GenerateCacheIdDetails =
    | { type: StatisticType.DEPLOY_COUNT }
    | { type: StatisticType.SOLD_ACCESSTIME; internalType: StatisticSoldAccessTimeType }
    | { type: StatisticType.USER; internalType: StatisticUserType }
    | { type: StatisticType.NEW_USER; internalType: StatisticNewUserType }
    | { type: StatisticType.VOTE; internalType: StatisticVoteType }
    | { type: StatisticType.INCOME; internalType: StatisticIncomeType; paymentMethod: Address };

@Injectable()
export class StatisticService {
    private readonly defaultTimeTick = 8;
    private readonly defaultPaymentMethod = zeroAddress;
    private readonly defaultTimeGap = StatisticTimeGap.WEEK;

    constructor(
        @Inject(forwardRef(() => SubgraphService))
        private readonly subgraphService: SubgraphService,
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        private readonly projectService: ProjectService
    ) {}

    private generateStatisticId(
        chainId: number,
        id: number,
        timeGap: StatisticTimeGap,
        details: GenerateCacheIdDetails
    ) {
        if (details.type == StatisticType.DEPLOY_COUNT) {
            return keccak256(
                encodeAbiParameters(
                    [
                        { type: "uint256" }, // chainId
                        { type: "uint256" }, // id
                        { type: "uint256" }, // timeGap
                        { type: "uint8" } // statisticType
                    ],
                    [BigInt(chainId), BigInt(id), BigInt(timeGap), details.type]
                )
            );
        } else if (details.type == StatisticType.INCOME) {
            return keccak256(
                encodeAbiParameters(
                    [
                        { type: "uint256" }, // chainId
                        { type: "uint256" }, // id
                        { type: "uint256" }, // timeGap
                        { type: "uint8" }, // statisticType
                        { type: "uint8" }, // statisticInternalType
                        { type: "address" } // paymentMethod
                    ],
                    [
                        BigInt(chainId),
                        BigInt(id),
                        BigInt(timeGap),
                        details.type,
                        details.internalType,
                        details.paymentMethod.toLowerCase() as Address
                    ]
                )
            );
        } else {
            return keccak256(
                encodeAbiParameters(
                    [
                        { type: "uint256" }, // chainId
                        { type: "uint256" }, // id
                        { type: "uint256" }, // timeGap
                        { type: "uint8" }, // statisticType
                        { type: "uint8" } // statisticInternalType
                    ],
                    [
                        BigInt(chainId),
                        BigInt(id),
                        BigInt(timeGap),
                        details.type,
                        details.internalType
                    ]
                )
            );
        }
    }

    private generateIncomePonderStatisticId(
        timeIndex: bigint,
        timeGap: StatisticTimeGap,
        accessTime: Address,
        internalType: StatisticIncomeType,
        paymentMethod: Address
    ) {
        return keccak256(
            encodeAbiParameters(
                [
                    { type: "uint256" },
                    { type: "uint256" },
                    { type: "uint8" },
                    { type: "uint8" },
                    { type: "address" },
                    { type: "address" }
                ],
                [
                    timeIndex,
                    BigInt(timeGap),
                    StatisticType.INCOME,
                    internalType,
                    accessTime,
                    paymentMethod
                ]
            )
        );
    }

    private currentTimestamp() {
        return BigInt(Date.now()) / 1000n;
    }

    private currentWeekIndex() {
        return this.currentTimestamp() / week;
    }

    private currentMonthIndex() {
        return this.currentTimestamp() / month;
    }

    private fillIndexGap(
        type: StatisticType,
        timeGap: StatisticTimeGap,
        data: StatisticsResponseDto[]
    ): StatisticsResponseDto[] {
        let currentIndex: bigint = 0n;
        if (timeGap == StatisticTimeGap.WEEK) {
            currentIndex = this.currentWeekIndex();
        }
        if (timeGap == StatisticTimeGap.MONTH) {
            currentIndex = this.currentMonthIndex();
        }

        if (currentIndex == 0n) {
            return data;
        }

        if (!data[0]) {
            return new Array(this.defaultTimeTick).fill("").map((_item, index) => ({
                timeIndex: (currentIndex - BigInt(index)).toString(),
                value: "0"
            }));
        }

        const newTicks: StatisticsResponseDto[] = [];
        const lastTickIndex = BigInt(data[0].timeIndex);

        if (currentIndex != lastTickIndex) {
            const requiredTickCount =
                currentIndex - lastTickIndex > BigInt(this.defaultTimeTick)
                    ? BigInt(this.defaultTimeTick)
                    : currentIndex - lastTickIndex;
            let fillValue: string = "0";
            if (type == StatisticType.USER) {
                fillValue = data[0].value;
            }
            for (let i = 0; i < Number(requiredTickCount.toString()); i++) {
                newTicks.push({
                    timeIndex: (currentIndex - BigInt(i)).toString(),
                    value: fillValue
                });
            }
        }

        for (let i2 = 0; i2 < data.length; i2++) {
            const timeTick = data[i2];
            const nextTimeTick = data[i2 + 1];
            if (newTicks.length >= this.defaultTimeTick) {
                break;
            }
            newTicks.push(timeTick);

            const gapAvaliable =
                nextTimeTick && Number(timeTick.timeIndex) - Number(nextTimeTick.timeIndex) > 1;
            if (gapAvaliable) {
                const gapLength = Number(timeTick.timeIndex) - Number(nextTimeTick.timeIndex);
                let fillValue: string = "0";
                if (type == StatisticType.USER) {
                    fillValue = data[0].value;
                }
                for (let i3 = 1; i3 < gapLength; i3++) {
                    if (newTicks.length >= this.defaultTimeTick) {
                        break;
                    }
                    newTicks.push({
                        timeIndex: (Number(timeTick.timeIndex) - i3).toString(),
                        value: fillValue
                    });
                }
            }
        }

        const requiredZeroTickCount = this.defaultTimeTick - newTicks.length;
        const lastTick = newTicks[newTicks.length - 1];
        for (let i4 = 0; i4 < requiredZeroTickCount; i4++) {
            newTicks.push({
                timeIndex: (Number(lastTick.timeIndex) - (i4 + 1)).toString(),
                value: "0"
            });
        }

        return newTicks;
    }

    async getProjectTotalSoldAccessTime(
        chainId: number,
        id: number,
        timeGap: StatisticTimeGap
    ): Promise<StatisticsResponseDto[]> {
        if (!timeGap) {
            timeGap = this.defaultTimeGap;
        }
        const statisticId = this.generateStatisticId(chainId, id, timeGap, {
            type: StatisticType.SOLD_ACCESSTIME,
            internalType: StatisticSoldAccessTimeType.PROJECT
        });
        const cacheDataKey = `statistic_${statisticId}`;
        const cachedData = await this.cacheService.get<StatisticsResponseDto[]>(cacheDataKey);

        if (cachedData) {
            return cachedData;
        }
        const projectFromChain = await this.projectService.getProjectById(chainId, id);
        const statistics = await this.subgraphService.statistics(
            chainId,
            projectFromChain.id,
            this.defaultTimeTick,
            StatisticType.SOLD_ACCESSTIME,
            StatisticSoldAccessTimeType.PROJECT,
            timeGap.toString()
        );
        const filledStatistics = this.fillIndexGap(
            StatisticType.SOLD_ACCESSTIME,
            timeGap,
            statistics
        );

        await this.cacheService.set(cacheDataKey, filledStatistics, {
            ttl: Number(process.env.STATISTIC_TTL)
        });

        return filledStatistics;
    }

    async getProjectTotalUser(
        chainId: number,
        id: number,
        timeGap: StatisticTimeGap
    ): Promise<StatisticsResponseDto[]> {
        if (!timeGap) {
            timeGap = this.defaultTimeGap;
        }
        const statisticId = this.generateStatisticId(chainId, id, timeGap, {
            type: StatisticType.USER,
            internalType: StatisticUserType.PROJECT
        });
        const cacheDataKey = `statistic_${statisticId}`;
        const cachedData = await this.cacheService.get<StatisticsResponseDto[]>(cacheDataKey);

        if (cachedData) {
            return cachedData;
        }
        const projectFromChain = await this.projectService.getProjectById(chainId, id);
        const statistics = await this.subgraphService.statistics(
            chainId,
            projectFromChain.id,
            this.defaultTimeTick,
            StatisticType.USER,
            StatisticUserType.PROJECT,
            timeGap.toString()
        );
        const filledStatistics = this.fillIndexGap(StatisticType.USER, timeGap, statistics);

        await this.cacheService.set(cacheDataKey, filledStatistics, {
            ttl: Number(process.env.STATISTIC_TTL)
        });

        return filledStatistics;
    }

    async getProjectTotalVotes(
        chainId: number,
        id: number,
        timeGap: StatisticTimeGap
    ): Promise<StatisticsResponseDto[]> {
        if (!timeGap) {
            timeGap = this.defaultTimeGap;
        }
        const statisticId = this.generateStatisticId(chainId, id, timeGap, {
            type: StatisticType.VOTE,
            internalType: StatisticVoteType.PROJECT
        });
        const cacheDataKey = `statistic_${statisticId}`;
        const cachedData = await this.cacheService.get<StatisticsResponseDto[]>(cacheDataKey);

        if (cachedData) {
            return cachedData;
        }
        const projectFromChain = await this.projectService.getProjectById(chainId, id);
        const statistics = await this.subgraphService.statistics(
            chainId,
            projectFromChain.id,
            this.defaultTimeTick,
            StatisticType.VOTE,
            StatisticVoteType.PROJECT,
            timeGap.toString()
        );
        const filledStatistics = this.fillIndexGap(StatisticType.VOTE, timeGap, statistics);

        await this.cacheService.set(cacheDataKey, filledStatistics, {
            ttl: Number(process.env.STATISTIC_TTL)
        });

        return filledStatistics;
    }

    async getProjectTotalIncome(
        chainId: number,
        id: number,
        paymentMethod: Address = this.defaultPaymentMethod,
        timeGap: StatisticTimeGap
    ): Promise<StatisticsResponseDto[]> {
        if (!timeGap) {
            timeGap = this.defaultTimeGap;
        }
        let currentIndex: bigint = 0n;
        if (timeGap == StatisticTimeGap.WEEK) {
            currentIndex = this.currentWeekIndex();
        }
        if (timeGap == StatisticTimeGap.MONTH) {
            currentIndex = this.currentMonthIndex();
        }

        if (currentIndex == 0n) {
            return [];
        }

        const statisticId = this.generateStatisticId(chainId, id, timeGap, {
            type: StatisticType.INCOME,
            internalType: StatisticIncomeType.PROJECT,
            paymentMethod
        });
        const cacheDataKey = `statistic_${statisticId}`;
        const cachedData = await this.cacheService.get<StatisticsResponseDto[]>(cacheDataKey);

        if (cachedData) {
            return cachedData;
        }
        const projectFromChain = await this.projectService.getProjectById(chainId, id);
        const statistics: StatisticsResponseDto[] = [];
        for (let i = 0; i < this.defaultTimeTick; i++) {
            const statisticSubgraphId = this.generateIncomePonderStatisticId(
                currentIndex - BigInt(i),
                timeGap,
                projectFromChain.id,
                StatisticIncomeType.PROJECT,
                paymentMethod.toLowerCase() as Address
            );
            const statisticData = await this.subgraphService.statisticById(
                chainId,
                statisticSubgraphId
            );
            if (statisticData) {
                statistics.push(statisticData);
            }
        }
        const filledStatistics = this.fillIndexGap(StatisticType.INCOME, timeGap, statistics);

        await this.cacheService.set(cacheDataKey, filledStatistics, {
            ttl: Number(process.env.STATISTIC_TTL)
        });

        return filledStatistics;
    }

    async getProjectNewUser(
        chainId: number,
        id: number,
        timeGap: StatisticTimeGap
    ): Promise<StatisticsResponseDto[]> {
        if (!timeGap) {
            timeGap = this.defaultTimeGap;
        }
        const statisticId = this.generateStatisticId(chainId, id, timeGap, {
            type: StatisticType.NEW_USER,
            internalType: StatisticNewUserType.PROJECT
        });
        const cacheDataKey = `statistic_${statisticId}`;
        const cachedData = await this.cacheService.get<StatisticsResponseDto[]>(cacheDataKey);

        if (cachedData) {
            return cachedData;
        }
        const projectFromChain = await this.projectService.getProjectById(chainId, id);
        const statistics = await this.subgraphService.statistics(
            chainId,
            projectFromChain.id,
            this.defaultTimeTick,
            StatisticType.NEW_USER,
            StatisticNewUserType.PROJECT,
            timeGap.toString()
        );
        const filledStatistics = this.fillIndexGap(StatisticType.NEW_USER, timeGap, statistics);

        await this.cacheService.set(cacheDataKey, filledStatistics, {
            ttl: Number(process.env.STATISTIC_TTL)
        });

        return filledStatistics;
    }

    async removeProjectStatistics(chainId: number, id: number) {
        const projectFromChain = await this.projectService.getProjectById(chainId, id);
        const statisticIds: Hash[] = [];

        // week
        const statisticIdWeekTotalSoldAccessTime = this.generateStatisticId(
            chainId,
            id,
            StatisticTimeGap.WEEK,
            {
                type: StatisticType.SOLD_ACCESSTIME,
                internalType: StatisticSoldAccessTimeType.PROJECT
            }
        );
        const statisticIdWeekTotalUser = this.generateStatisticId(
            chainId,
            id,
            StatisticTimeGap.WEEK,
            {
                type: StatisticType.USER,
                internalType: StatisticUserType.PROJECT
            }
        );
        const statisticIdWeekTotalVote = this.generateStatisticId(
            chainId,
            id,
            StatisticTimeGap.WEEK,
            {
                type: StatisticType.VOTE,
                internalType: StatisticVoteType.PROJECT
            }
        );
        const statisticIdWeekNewUser = this.generateStatisticId(
            chainId,
            id,
            StatisticTimeGap.WEEK,
            {
                type: StatisticType.NEW_USER,
                internalType: StatisticNewUserType.PROJECT
            }
        );

        statisticIds.push(statisticIdWeekTotalSoldAccessTime);
        statisticIds.push(statisticIdWeekTotalUser);
        statisticIds.push(statisticIdWeekTotalVote);
        statisticIds.push(statisticIdWeekNewUser);
        // month
        const statisticIdMonthTotalSoldAccessTime = this.generateStatisticId(
            chainId,
            id,
            StatisticTimeGap.MONTH,
            {
                type: StatisticType.SOLD_ACCESSTIME,
                internalType: StatisticSoldAccessTimeType.PROJECT
            }
        );
        const statisticIdMonthTotalUser = this.generateStatisticId(
            chainId,
            id,
            StatisticTimeGap.MONTH,
            {
                type: StatisticType.USER,
                internalType: StatisticUserType.PROJECT
            }
        );
        const statisticIdMonthTotalVote = this.generateStatisticId(
            chainId,
            id,
            StatisticTimeGap.MONTH,
            {
                type: StatisticType.VOTE,
                internalType: StatisticVoteType.PROJECT
            }
        );
        const statisticIdMonthNewUser = this.generateStatisticId(
            chainId,
            id,
            StatisticTimeGap.MONTH,
            {
                type: StatisticType.NEW_USER,
                internalType: StatisticNewUserType.PROJECT
            }
        );

        statisticIds.push(statisticIdMonthTotalSoldAccessTime);
        statisticIds.push(statisticIdMonthTotalUser);
        statisticIds.push(statisticIdMonthTotalVote);
        statisticIds.push(statisticIdMonthNewUser);

        for (let i = 0; i < projectFromChain.paymentMethods.length; i++) {
            const paymentMethod = projectFromChain.paymentMethods[i];
            const statisticIdWeekTotalIncome = this.generateStatisticId(
                chainId,
                id,
                StatisticTimeGap.WEEK,
                {
                    type: StatisticType.INCOME,
                    internalType: StatisticIncomeType.PROJECT,
                    paymentMethod
                }
            );

            const statisticIdMonthTotalIncome = this.generateStatisticId(
                chainId,
                id,
                StatisticTimeGap.MONTH,
                {
                    type: StatisticType.INCOME,
                    internalType: StatisticIncomeType.PROJECT,
                    paymentMethod
                }
            );

            statisticIds.push(statisticIdWeekTotalIncome);
            statisticIds.push(statisticIdMonthTotalIncome);
        }

        for (let i2 = 0; i2 < statisticIds.length; i2++) {
            const statisticId = statisticIds[i2];
            await this.cacheService.del(`statistic_${statisticId}`);
        }
    }
}
