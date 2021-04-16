import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ErrMessageUtilsTH } from "src/utils/err_message_th.utils";
import { FormatDataUtils } from "src/utils/format_data.utils";
import { Request } from 'express-serve-static-core'
import { Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { StatusException } from 'src/utils/callback.status';
import { dbConnection } from 'src/pg.database/pg.database';

@Injectable()
export class PromotionInterceptor implements NestInterceptor {
    constructor(
        private readonly errMessageUrilTh: ErrMessageUtilsTH,
        private readonly formatDataUtils: FormatDataUtils,
        private readonly dbconnection: dbConnection,
    ) { }
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
       
        const errMessage = await this.checkInputValues(request);
        if (errMessage) throw new StatusException(
            {
                error: errMessage
                , result: null
                , message: errMessage
                , statusCode: 200
            }, 200)
        else return next.handle();

    }


    async checkInputValues(request: any) {
        const body = request.body;
        const file = request.files
        console.log(body)
         if(!body.promotion_id)
            return this.errMessageUrilTh.errPromotionCodeNotFound;
        else if(this.formatDataUtils.HaveSpecialFormat(body.promotion_id))
            return this.errMessageUrilTh.errPromotionCodeProhitbitSpecial;
        return await this.CheckPromotionInBase(body);
    }

    async CheckPromotionInBase(body: any) {
        const company_id = body.company_id;
        const promotion_code = body.promotion_code;
        let sql = `select promotion_id 
        from m_promotion
        where promotion_status = 'Y'
        and delete_flag = 'N' and cancel_flag = 'N'
        and company_id = $1
        and promotion_code = $2
        ;`
        const query = {
            text: sql,
            values: [company_id, promotion_code]
        }
        const res = await this.dbconnection.getPgData(query);
        if (res.error)
            return res.error
        else if (res.result.length === 0)
            return this.errMessageUrilTh.errPromotionNotInDataBase;
        else return null;
    }

}