import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Address } from "viem";
import { SubgraphService } from "./subgraph.service";

@Processor("accessTime")
export class SubgraphConsumer extends WorkerHost {
    constructor(private readonly subgraphService: SubgraphService) {
        super();
    }

    async process(
        job: Job<
            {
                chainId: number;
                id: Address;
                accessTimeId: string;
                owner: Address;
                prevOwner: Address;
                website: string;
            },
            void,
            "deployment" | "statistic"
        >
    ): Promise<void> {
        if (job.name == "deployment") {
            await this.subgraphService.queueDeploymentClear(job.data);
        }
        if (job.name == "statistic") {
            await this.subgraphService.queueStatisticClear({
                chainId: job.data.chainId,
                accessTimeId: Number(job.data.accessTimeId)
            });
        }
    }
}
