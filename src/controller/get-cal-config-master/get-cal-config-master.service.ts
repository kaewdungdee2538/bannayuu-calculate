import { Injectable } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import * as moment from 'moment';
import { StatusException } from 'src/utils/callback.status';

@Injectable()
export class GetCalConfigMasterService {
    constructor(
        private readonly errMessageUtilsTh: ErrMessageUtilsTH,
        private readonly dbconnecttion: dbConnection,
    ) { }

    async getConfigCalFormTime(date_array: any, body: any) {
        const checkMasterZone = await this.checkMasterDateZone(date_array, body);
        return checkMasterZone
    }


    async checkMasterDateZone(date_array: any, body: any) {
        const datestart = date_array.datestart;
        const company_id = body.company_id;
        const cartype_id = body.cartype_id;
        let sql = `select cpm_id
        from m_calculate_parking_master
        where $1 between cpm_start_date and cpm_stop_date
        and company_id = $2
        and cartype_id = $3
        ;`
        const query = {
            text: sql,
            values: [datestart, company_id, cartype_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return true;
    }

    async checkMasterHoliday(date_array: any, body: any) {
        const datestart = date_array.datestart;
        const company_id = body.company_id;
        let sql = `select mhd_id
        from m_holiday
        where to_char(mhd_date,'YYYY-MM-dd') = $1
        and company_id = $2
        ;`
        const query = {
            text: sql,
            values: [datestart, company_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return true;
    }

    async checkMasterWeekend(date_array: any) {
        const date = moment(date_array.datestart)
        const day = date.day();
        console.log('check day of week :' + day)
        if (day === 0 || day === 7)
            return true;
        return null;
    }

    async getMasterOfDay(dayTypeMaster: any, body: any) {
        switch (dayTypeMaster.day_type) {
            case "SPECIAL":
                const getMsSpecial = await this.getMasterOfSpecial(dayTypeMaster, body);
                if (getMsSpecial)
                    return getMsSpecial;
                else
                    return await this.getMasterOfNormal(body);
            case "HOLIDAY":
                const getMsHoliday = await this.getMasterOfHoliday(body);
                if (getMsHoliday)
                    return getMsHoliday;
                else
                    return await this.getMasterOfNormal(body);
            case "WEEKEND":
                const getMsWeekend = await this.getMasterOfWeekend(body);
                if (getMsWeekend)
                    return getMsWeekend;
                else
                    return await this.getMasterOfNormal(body);
            default:
                return await this.getMasterOfNormal(body);
        }
    }

    //---------------------------------Get Master Calculate Parking
    async getMasterOfNormal(body: any) {
        const company_id = body.company_id;
        const cartype_id = body.cartype_id;
        const daytype = 'N';
        let sql = `select cpm_id,cpm_code,cpm_name_th,cpm_name_en
        ,cartype_id
        ,to_char(cpm_start_date,'YYYY-MM-DD HH24:MI:SS') as cpm_start_date
        ,to_char(cpm_stop_date,'YYYY-MM-DD HH24:MI:SS') as cpm_stop_date
        ,cpm_day_type
        ,cpm_overnight_status
        ,to_char(cpm_overnight_start::time,'HH24:MI:SS') as cpm_overnight_start
        ,to_char(cpm_overnight_stop::time,'HH24:MI:SS') as cpm_overnight_stop
        ,cpm_fine_amount,cpm_time_for_free
        ,cpm_status
        from m_calculate_parking_master
        where delete_flag = 'N'
        and cpm_day_type = $1
        and company_id = $2
        and cartype_id = $3
        limit 1
        ;`
        const query = {
            text: sql,
            values: [daytype, company_id, cartype_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error)
            throw new StatusException(
                {
                    error: res.error,
                    result: null,
                    message: this.errMessageUtilsTh.messageProcessFail,
                    statusCode: 200,
                },
                200);
        else if (res.result.length === 0)
            throw new StatusException(
                {
                    error: this.errMessageUtilsTh.messageProcessFail,
                    result: null,
                    message: this.errMessageUtilsTh.errCalParkingMasterNotInBase,
                    statusCode: 200,
                },
                200);
        else return res.result[0];
    }

    async getMasterOfSpecial(checkMasterDay: any, body: any) {
        const datestart = checkMasterDay.datestart;
        const company_id = body.company_id;
        const cartype_id = body.cartype_id;
        let sql = `select cpm_id,cpm_code,cpm_name_th,cpm_name_en
        ,cartype_id
        ,to_char(cpm_start_date,'YYYY-MM-DD HH24:MI:SS') as cpm_start_date
        ,to_char(cpm_stop_date,'YYYY-MM-DD HH24:MI:SS') as cpm_stop_date
        ,cpm_day_type
        ,cpm_overnight_status
        ,to_char(cpm_overnight_start::time,'HH24:MI:SS') as cpm_overnight_start
        ,to_char(cpm_overnight_stop::time,'HH24:MI:SS') as cpm_overnight_stop
        ,cpm_fine_amount,cpm_time_for_free
        ,cpm_status
        from m_calculate_parking_master
        where delete_flag = 'N'
        and $1 between cpm_start_date and cpm_stop_date
        and company_id = $2
        and cartype_id = $3
        limit 1
        ;`
        const query = {
            text: sql,
            values: [datestart, company_id, cartype_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return res.result[0];
    }

    async getMasterOfHoliday(body: any) {
        const company_id = body.company_id;
        const cartype_id = body.cartype_id;
        const daytype = 'HOLIDAY';
        let sql = `select cpm_id,cpm_code,cpm_name_th,cpm_name_en
        ,cartype_id
        ,to_char(cpm_start_date,'YYYY-MM-DD HH24:MI:SS') as cpm_start_date
        ,to_char(cpm_stop_date,'YYYY-MM-DD HH24:MI:SS') as cpm_stop_date
        ,cpm_day_type
        ,cpm_overnight_status
        ,to_char(cpm_overnight_start::time,'HH24:MI:SS') as cpm_overnight_start
        ,to_char(cpm_overnight_stop::time,'HH24:MI:SS') as cpm_overnight_stop
        ,cpm_fine_amount,cpm_time_for_free
        ,cpm_status
        from m_calculate_parking_master
        where delete_flag = 'N'
        and cpm_day_type = $1
        and company_id = $2
        and cartype_id = $3
        limit 1
        ;`
        const query = {
            text: sql,
            values: [daytype, company_id, cartype_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return res.result[0];
    }

    async getMasterOfWeekend(body: any) {
        const company_id = body.company_id;
        const cartype_id = body.cartype_id;
        const daytype = 'WEEKEND';
        let sql = `select cpm_id,cpm_code,cpm_name_th,cpm_name_en
        ,cartype_id
        ,to_char(cpm_start_date,'YYYY-MM-DD HH24:MI:SS') as cpm_start_date
        ,to_char(cpm_stop_date,'YYYY-MM-DD HH24:MI:SS') as cpm_stop_date
        ,cpm_day_type
        ,cpm_overnight_status
        ,to_char(cpm_overnight_start::time,'HH24:MI:SS') as cpm_overnight_start
        ,to_char(cpm_overnight_stop::time,'HH24:MI:SS') as cpm_overnight_stop
        ,cpm_fine_amount,cpm_time_for_free
        ,cpm_status
        from m_calculate_parking_master
        where delete_flag = 'N'
        and cpm_day_type = $1
        and company_id = $2
        and cartype_id = $3
        limit 1
        ;`
        const query = {
            text: sql,
            values: [daytype, company_id, cartype_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return res.result[0];
    }


}
