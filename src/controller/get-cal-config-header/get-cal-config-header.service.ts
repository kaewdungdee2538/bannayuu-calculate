import { Injectable } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { StatusException } from 'src/utils/callback.status';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { CalOvernightService } from '../cal-overnight/cal-overnight.service';
import { CalTimeDiffService } from '../cal-time-diff/cal-time-diff.service';

@Injectable()
export class GetCalConfigHeaderService {
    constructor(
        private readonly errMessageUtilsTh: ErrMessageUtilsTH,
        private readonly dbconnecttion: dbConnection,
        private calOverNightService: CalOvernightService,
        private calTimeDiffService: CalTimeDiffService,
    ) { }

    async calHeader(cpm_object: any, body: any) {
        const getHeaderConfigPromise = await cpm_object.map(async item => {
            const cph_object = await this.getCalHeaderConfig(item, body)
            if (cph_object)
                return { ...item, cph_object }
            return null;
        })
        //------------------get header zone
        const getHeaderConfig = await Promise.all(getHeaderConfigPromise);
        // console.log(`getHeaderConfigZone : ${JSON.stringify(getHeaderConfig)}`)
        if (!getHeaderConfig[0]) throw new StatusException({
            error: this.errMessageUtilsTh.messageProcessFail
            , result: null
            , message: this.errMessageUtilsTh.errCalParkingHeaderMainNotSet
            , statusCode: 200
        }, 200)
        const getOverNight = await this.calOverNightService.calculateOverNight(getHeaderConfig,body);
        // console.log('getOverNight : '+JSON.stringify(getOverNight));
        const calTimeDiff = await this.calTimeDiffService.calTimeDiff(getOverNight, body);
        console.log({calTimeDiff})
        // const calSub = await 
        return calTimeDiff;
    }
    async getCalHeaderConfig(inPutObj: any, body: any) {
        const cpm_id = inPutObj.cpm_object.cpm_id;
        const company_id = body.company_id;
        const cartype_id = body.cartype_id;
        let sql = `select cph_id,cph_code,mcph.cpm_id
        ,cph_name_th,cph_name_en,card_type_id,mcph.cartype_id
        ,to_char(time_zone_start::time,'HH24:MI:SS') as time_zone_start
        ,to_char(time_zone_stop::time,'HH24:MI:SS') as time_zone_stop
        ,cph_cal_every_interval,cph_cal_amount_value
        ,cph_status,cph_priority_no
        from m_calculate_parking_header mcph
        where mcph.delete_flag = 'N'
        and cph_status = 'Y'
        and cpm_id = $1
        and company_id = $2
        and cartype_id = $3
        order by cph_priority_no,time_zone_start
        ;`
        const query = {
            text: sql,
            values: [cpm_id, company_id, cartype_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return res.result;
    }


}
