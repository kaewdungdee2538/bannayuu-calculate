import { Injectable } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { StatusException } from 'src/utils/callback.status';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';

@Injectable()
export class PromotionService {
    constructor(
        private readonly errMessageUtilsTh: ErrMessageUtilsTH,
        private readonly dbconnecttion: dbConnection,
    ) { }
    async getPromotion(body: any) {
        if (!body.promotion_code)
            return null;
        const getPromotionObj = await this.getPromotionInBase(body);
        if (!getPromotionObj) throw new StatusException(
            {
                error: this.errMessageUtilsTh.messageProcessFail,
                result: null,
                message: this.errMessageUtilsTh.errPromotionNotInDataBase,
                statusCode: 200,
            },
            200);
        return getPromotionObj;
    }

    async getPromotionInBase(body: any) {
        const company_id = body.company_id;
        const promotion_code = body.promotion_code;
        let sql = `select promotion_id,promotion_code,promotion_name_th,promotion_name_en
        ,promotion_new_calculate_status,promotion_new_cpm_id,promotion_minutes_discount_value,promotion_parking_discount_value
        ,promotion_status 
        from m_promotion
        where promotion_status = 'Y'
        and delete_flag = 'N' and cancel_flag = 'N'
        and company_id = $1
        and promotion_code = $2
        limit 1
        ;`
        const query = {
            text: sql,
            values: [company_id, promotion_code]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return res.result[0];
    }
}

