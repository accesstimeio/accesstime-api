import { Body, Controller, Post, UsePipes, ValidationPipe } from "@nestjs/common";

import { FarcasterService } from "./farcaster.service";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
export class FarcasterController {
    constructor(private readonly farcasterService: FarcasterService) {}

    @Post("/webhook")
    webhookHandle(@Body() body: any) {
        return this.farcasterService.webhookHandle(body);
    }
}
