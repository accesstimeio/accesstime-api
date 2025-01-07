import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { MINIO_CONNECTION } from "nestjs-minio";
import { Client } from "minio";

@Injectable()
export class MinioService {
    private BUCKET_NAME: string = "";
    constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Client) {
        this.BUCKET_NAME = process.env.MINIO_BUCKET_NAME;
    }

    async uploadFile(fileName: string, file: Express.Multer.File) {
        try {
            return await this.minioClient.putObject(
                this.BUCKET_NAME,
                fileName,
                file.buffer,
                file.size
            );
        } catch (_err) {
            throw new HttpException(
                {
                    errors: { message: "File upload failed!" }
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteFile(fileName: string) {
        const file = await this.minioClient.getObject(this.BUCKET_NAME, fileName);
        if (!file.readableLength) {
            throw new HttpException(
                {
                    errors: { message: "File is not found!" }
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
        try {
            return await this.minioClient.removeObject(this.BUCKET_NAME, fileName);
        } catch (_err) {
            throw new HttpException(
                {
                    errors: { message: "File remove failed!" }
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
