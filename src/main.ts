import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const allowlist = [
        "http://localhost:5173",
        "https://accesstime.io",
        "https://app.accesstime.io"
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
        .setVersion("0.0.1")
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    await app.listen(3000);
}
bootstrap();
