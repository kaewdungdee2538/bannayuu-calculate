import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';

@Injectable()
export class DefaultValueMiddleware implements NestMiddleware {
    constructor(
        private readonly errMessageUrilTh: ErrMessageUtilsTH,
        private readonly formatDataUtils: FormatDataUtils,
        private readonly dbconnection: dbConnection,
    ) { }
    async use(req: Request, res: Response, next: () => void) {
        const messageCheckvalue = await this.CheckValues(req.body)
        if (messageCheckvalue) {
            console.log('Middleware check default value  : ' + messageCheckvalue)
            res.send({
                response: {
                    error: messageCheckvalue
                    , result: null
                    , message: messageCheckvalue
                    , statusCode: 200
                }
            });
        } else
            next();
    }

    async CheckValues(body: any) {
        if (!body.company_id)
            return this.errMessageUrilTh.errCompanyIDNotFound
        else if (this.formatDataUtils.HaveSpecialFormat(body.company_id))
            return this.errMessageUrilTh.errCompanyIDProhibitSpecial
        else if (!this.formatDataUtils.IsNumber(body.company_id))
            return this.errMessageUrilTh.errCompanyIDNotNumber
        // else if(this.formatDataUtils.HaveSpecialFormat(body.company_code))
        //     return this.errMessageUrilTh.errCompanyCodeProhibitSpecial
        // else if(!body.guardhouse_id)
        //     return this.errMessageUrilTh.errGuardHouseIDNotFound
        // else if(this.formatDataUtils.HaveSpecialFormat(body.guardhouse_id))
        //     return this.errMessageUrilTh.errGuardHouseIDProhibitSpecial
        // else if(!this.formatDataUtils.IsNumber(body.guardhouse_id))
        //     return this.errMessageUrilTh.errGuardHouseIDNotNumber
        // else if(this.formatDataUtils.HaveSpecialFormat(body.guardhouse_code))
        //     return this.errMessageUrilTh.errGuardHouseCodeProhibitSpecial
        return await this.CheckCompanyInBase(body);
    }

    async CheckCompanyInBase(body: any) {
        const company_id = body.company_id;
        let sql = `select * from m_company where delete_flag = 'N' and company_id =$1;`
        const query = {
            text: sql
            , values: [company_id]
        }
        const res = await this.dbconnection.getPgData(query);
        if (res.error)
            return res.error
        else if (res.result.length === 0)
            return this.errMessageUrilTh.errCompanyNotInBase;
        else return null;
    }
};

