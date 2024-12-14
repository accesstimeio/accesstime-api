import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const allowlist = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://accesstime.io",
        "https://app.accesstime.io",
        "https://portal.accesstime.io"
    ];
    const corsOptionsDelegate = function (req: any, callback: any) {
        let corsOptions: { origin: boolean };
        if (allowlist.indexOf(req) !== -1) {
            corsOptions = { origin: true };
        } else {
            corsOptions = { origin: false };
        }
        callback(null, corsOptions);
    };

    app.enableCors({
        origin: corsOptionsDelegate
    });

    const config = new DocumentBuilder()
        .setTitle("AccessTime")
        .setDescription("Dashboard API")
        .setVersion("0.1.0")
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    await app.listen(3000);
}
bootstrap();
