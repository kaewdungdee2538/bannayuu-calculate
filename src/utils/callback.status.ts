import { HttpStatus } from "@nestjs/common";
import { HttpException } from "@nestjs/common";
export class StatusException extends HttpException {
    constructor(response, status: HttpStatus) {
        const data = { response }
        super(data, status);
    }
}
