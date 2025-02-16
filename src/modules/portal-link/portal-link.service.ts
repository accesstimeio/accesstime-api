import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Chain, extractDomain } from "@accesstimeio/accesstime-common";
import { Address, decodeAbiParameters, Hash, keccak256 } from "viem";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";

import { CheckResponseDto, UpdateStatusResponseDto } from "./dto";
import { Domain } from "./schemas/domain.schema";

import { FactoryService } from "../factory/factory.service";

@Injectable()
export class PortalLinkService {
    constructor(
        @InjectModel(Domain.name) private readonly domainModel: Model<Domain>,
        private readonly factoryService: FactoryService,
        @Inject(CACHE_MANAGER) private cacheService: Cache
    ) {}

    async getCheck(hashedLink: Hash): Promise<CheckResponseDto> {
        const dataKey = `link-${keccak256(hashedLink)}`;
        const cachedData = await this.cacheService.get<{ allowed: boolean }>(dataKey);

        if (cachedData) {
            return cachedData;
        } else {
            let link: string;
            try {
                const [decodedLink] = decodeAbiParameters([{ type: "string" }], hashedLink);
                link = decodedLink;
            } catch (_err) {
                throw new HttpException(
                    {
                        errors: { message: "Given link is not hashed correctly." }
                    },
                    HttpStatus.BAD_REQUEST
                );
            }

            const useableDomain = extractDomain(link);
            if (useableDomain == null) {
                throw new HttpException(
                    {
                        errors: { message: "Domain is not found in given link." }
                    },
                    HttpStatus.BAD_REQUEST
                );
            }

            const findDomain = await this.domainModel.countDocuments({ domain: useableDomain });
            let allowed: boolean = true;

            if (findDomain > 0) {
                const domain = await this.domainModel.findOne({ domain: useableDomain }).exec();

                allowed = domain.allowed;
            }

            await this.cacheService.set(
                dataKey,
                { allowed },
                {
                    ttl: Number(process.env.RATES_TTL)
                }
            );

            return { allowed };
        }
    }

    async updateStatus(
        hashedLink: Hash,
        status: boolean,
        signer: Address
    ): Promise<UpdateStatusResponseDto> {
        let link: string;
        try {
            const [decodedLink] = decodeAbiParameters([{ type: "string" }], hashedLink);
            link = decodedLink;
        } catch (_err) {
            throw new HttpException(
                {
                    errors: { message: "Given link is not hashed correctly." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const factory = this.factoryService.client[Chain.ids[0]];
        const factoryOwner = await factory.read.owner();

        if (factoryOwner.toLowerCase() != signer.toLowerCase()) {
            throw new HttpException(
                {
                    errors: { message: "Only factory owner authorized." }
                },
                HttpStatus.UNAUTHORIZED
            );
        }

        const useableDomain = extractDomain(link);
        if (useableDomain == null) {
            throw new HttpException(
                {
                    errors: { message: "Domain is not found in given link." }
                },
                HttpStatus.BAD_REQUEST
            );
        }

        const findDomain = await this.domainModel.countDocuments({ domain: useableDomain });

        if (findDomain == 0) {
            const domain = new this.domainModel({
                domain: useableDomain,
                allowed: status
            });

            await domain.save();
            await this.removeCachedLink(hashedLink);

            return { allowed: status };
        } else {
            const domain =
                (await this.domainModel.findOne({ domain: useableDomain }).exec()) ?? null;

            if (domain != null) {
                domain.$set({ allowed: status });
                await domain.save();
                await this.removeCachedLink(hashedLink);

                return { allowed: status };
            }

            return { allowed: null };
        }
    }

    private async removeCachedLink(hashedLink: Hash) {
        const dataKey = `link-${keccak256(hashedLink)}`;
        await this.cacheService.del(dataKey);
    }
}
