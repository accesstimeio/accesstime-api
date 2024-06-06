import { Module } from "@nestjs/common";
import { DeploymentController } from "./deployment.controller";
import { DeploymentService } from "./deployment.service";

@Module({
    imports: [],
    controllers: [DeploymentController],
    providers: [DeploymentService]
})
export class DeploymentModule {}
