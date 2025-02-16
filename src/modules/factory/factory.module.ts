import { Module } from "@nestjs/common";

import { FactoryService } from "./factory.service";

@Module({
    imports: [],
    controllers: [],
    providers: [FactoryService],
    exports: [FactoryService]
})
export class FactoryModule {}
