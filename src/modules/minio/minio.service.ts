import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { MINIO_CONNECTION } from "nestjs-minio";
import { Client } from "minio";

@Injectable()
export class MinioService {
    constructor(@Inject(MINIO_CONNECTION) private readonly minioClient: Client) {}

    async uploadFile(bucketName: string, fileName: string, file: Express.Multer.File) {
        try {
            return await this.minioClient.putObject(bucketName, fileName, file.buffer, file.size);
        } catch (_err) {
            throw new HttpException(
                {
                    errors: { message: "File upload failed!" }
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deleteFile(bucketName: string, fileName: string) {
        const file = await this.minioClient.getObject(bucketName, fileName);
        if (!file.readableLength) {
            throw new HttpException(
                {
                    errors: { message: "File is not found!" }
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
        try {
            return await this.minioClient.removeObject(bucketName, fileName);
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
