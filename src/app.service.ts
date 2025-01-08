import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
    base() {
        return {
            status: true,
            name: "AccessTime API"
        };
    }
}
