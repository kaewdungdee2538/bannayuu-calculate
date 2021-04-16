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
        private readonly dbconnection: dbConnection,
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
        if(!body.visitor_record_id)
            return this.errMessageUrilTh.errVisitorRecordIDNotFound;
        else if(this.formatDataUtils.HaveSpecialFormat(body.visitor_record_id))
            return this.errMessageUrilTh.errVisitorRecordIdProhibitSpecial;
        else if(!this.formatDataUtils.IsNumber(body.visitor_record_id))
            return this.errMessageUrilTh.errVisitorRecordIdNotNumber;
        return await this.CheckVisitorRecordInBase(body);
    }

    async CheckVisitorRecordInBase(body: any) {
        const company_id = body.company_id;
        const visitor_record_id = body.visitor_record_id;
        let sql = `select visitor_record_id from t_visitor_record where action_out_flag = 'N' and company_id =$1 and visitor_record_id = $2;`
        const query = {
            text: sql
            , values: [company_id,visitor_record_id]
        }
        const res = await this.dbconnection.getPgData(query);
        if (res.error)
            return res.error
        else if (res.result.length === 0)
            return this.errMessageUrilTh.errVisitorRecordInNotFound;
        else return null;
    }

}