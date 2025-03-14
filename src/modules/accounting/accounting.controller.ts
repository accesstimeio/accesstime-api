import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiQuery, ApiResponse } from "@nestjs/swagger";

import { AccountingService } from "./accounting.service";
import { ProjectIncomesDto } from "./dto";

@UsePipes(new ValidationPipe({ transform: true }))
@Controller({
    version: "1"
})
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) {}

    @ApiQuery({
        name: "pageCursor",
        type: String,
        required: false
    })
    @ApiResponse({
        type: ProjectIncomesDto
    })
    @Get("/:chainId/:id")
    getProjectIncomes(
        @Param("chainId") chainId: number,
        @Param("id") id: number,
        @Query("pageCursor") pageCursor: string
    ) {
        return this.accountingService.getProjectIncomes(chainId, id, pageCursor);
    }
}
