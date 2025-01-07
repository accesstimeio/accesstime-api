import { FileValidator, HttpException, HttpStatus, Injectable } from "@nestjs/common";

async function fileTypeParse(): Promise<any> {
    const module = await (eval(`import('file-type')`) as Promise<any>);
    return module;
}

@Injectable()
export class FileTypeValidationPipe extends FileValidator<
    { mimeType: string },
    Express.Multer.File
> {
    buildErrorMessage(): string {
        throw new HttpException(
            {
                errors: { message: "File mime-type validation failed!" }
            },
            HttpStatus.BAD_REQUEST
        );
    }

    async isValid(file?: Express.Multer.File | Express.Multer.File[]): Promise<boolean> {
        let validFile: boolean = true;

        if (Array.isArray(file)) {
            for (let i = 0; i < file.length; i++) {
                const result = await (await fileTypeParse())?.fileTypeFromBuffer(file[i].buffer);
                if (result?.mime != this.validationOptions.mimeType) {
                    validFile = false;
                    break;
                }
            }
        } else {
            const result = await (await fileTypeParse())?.fileTypeFromBuffer(file.buffer);
            if (result?.mime != this.validationOptions.mimeType) {
                validFile = false;
            }
        }

        return validFile;
    }
}
