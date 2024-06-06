import { Module } from "@nestjs/common";
import { DeploymentController } from "./deployment.controller";
import { DeploymentService } from "./deployment.service";
import { SubgraphModule } from "../subgraph/subgraph.module";

@Module({
    imports: [SubgraphModule],
    controllers: [DeploymentController],
    providers: [DeploymentService]
})
export class DeploymentModule {}
