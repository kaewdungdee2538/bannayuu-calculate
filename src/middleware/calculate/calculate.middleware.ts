import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from 'express';
import { dbConnection } from "src/pg.database/pg.database";
import { ErrMessageUtilsTH } from "src/utils/err_message_th.utils";
import { FormatDataUtils } from "src/utils/format_data.utils";
import { LoadSettingLocalUtils } from "src/utils/load_setting_local.utils";
@Injectable()
export class vsActionOutVerifyEstampMiddleware implements NestMiddleware {
    constructor(
        private readonly errMessageUrilTh: ErrMessageUtilsTH,
        private readonly formatDataUtils: FormatDataUtils,
        private readonly localSettingLocalUtils: LoadSettingLocalUtils,
        private readonly dbconnecttion: dbConnection,
    ) { }
    async use(req: Request, res: Response, next: () => void) {
        console.log('calculate parking middleware')
        const messageCheck= await this.checkValues(req.body);
        if (messageCheck) {
            console.log('calculate parking middleware : ' + messageCheck)
            res.send({
                response: {
                    error: messageCheck
                    , result: null
                    , message: messageCheck
                    , statusCode: 200
                }
            });
        } else
            next();
    }

   
    async checkValues(body:any) {
        return null;
    }

}