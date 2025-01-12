import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Chain, extractDomain } from "@accesstimeio/accesstime-common";
import { Address, decodeAbiParameters, Hash } from "viem";

import { getFactoryOwner } from "src/helpers";

import { CheckResponseDto, UpdateStatusResponseDto } from "./dto";
import { Domain } from "./schemas/domain.schema";

@Injectable()
export class PortalLinkService {
    constructor(@InjectModel(Domain.name) private readonly domainModel: Model<Domain>) {}

    async getCheck(hashedLink: Hash): Promise<CheckResponseDto> {
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

        if (findDomain > 0) {
            const domain = await this.domainModel.findOne({ domain: useableDomain });

            return { allowed: domain.allowed };
        }

        return { allowed: true };
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

        const factoryOwner = await getFactoryOwner(Chain.ids[0]);

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

            return { allowed: status };
        } else {
            const domain = (await this.domainModel.findOne({ domain: useableDomain })) ?? null;

            if (domain != null) {
                domain.$set({ allowed: status });
                await domain.save();

                return { allowed: status };
            }

            return { allowed: null };
        }
    }
}
