import { FileValidator, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { isText } from "istextorbinary";

async function markdownLint(): Promise<any> {
    const module = await (eval(`import('markdownlint/promise')`) as Promise<any>);
    return module;
}

@Injectable()
export class MarkdownValidationPipe extends FileValidator<
    { maxError: number },
    Express.Multer.File
> {
    buildErrorMessage(): string {
        throw new HttpException(
            {
                errors: { message: "Markdown validation failed!" }
            },
            HttpStatus.BAD_REQUEST
        );
    }

    isText(file: Express.Multer.File): boolean {
        return isText(null, file.buffer);
    }

    async lint(file: Express.Multer.File): Promise<boolean> {
        const result = await (
            await markdownLint()
        ).lint({ strings: { content: file.buffer.toString("utf-8") } });

        if (!result || !result.content || !Array.isArray(result.content)) {
            return false;
        }

        return result.content.length > this.validationOptions.maxError ? false : true;
    }

    async isValid(file?: Express.Multer.File | Express.Multer.File[]): Promise<boolean> {
        let validFile: boolean = true;

        if (Array.isArray(file)) {
            for (let i = 0; i < file.length; i++) {
                const checkTextContent = this.isText(file[i]);
                if (!checkTextContent) {
                    validFile = false;
                    break;
                }

                const result = await this.lint(file[i]);
                if (!result) {
                    validFile = false;
                    break;
                }
            }
        } else {
            const checkTextContent = this.isText(file);
            if (!checkTextContent) {
                return false;
            }

            validFile = await this.lint(file);
        }

        return validFile;
    }
}
