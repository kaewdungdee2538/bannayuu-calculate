import { Injectable } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';

@Injectable()
export class GetCalConfigSubService {
    constructor(
        private readonly errMessageUtilsTh: ErrMessageUtilsTH,
        private readonly dbconnecttion: dbConnection,
    ) { }

    async calculateSub(inPutObj: any, body: any) {
        const getSubConfigPromise = await inPutObj.map(async item => {
            // const cphObject = item.
            //************Header Main**************//
            const subHeaderMainInput = item.calculate_object.calculate_form_zone.main;
            //------------หา sub เพื่อนำไปคำนวณค่าจอด
            const getSubFromHeaderMain = await this.getCalSubFromBetweenOrLastSub(subHeaderMainInput, body)
            //------------คำนวณค่าจอดหลัก
            const calParkingSubFromMain = await this.calParkingPriceFromSubObj(subHeaderMainInput, getSubFromHeaderMain);
            //------------For Return
            const SubFromHeaderMainObj = {
                ...item.calculate_object.calculate_form_zone.main,
                sub_object: getSubFromHeaderMain,
                parking_object: calParkingSubFromMain
            };
            //************//////////**************//
            //===========Header Zone=============//
            //------------
            const subHeaderZoneInput = item.calculate_object.calculate_form_zone.zone
            const getSubFromHeaderZonePromise = await subHeaderZoneInput.map(async subitem => {
                //------------หา sub เพื่อนำไปคำนวณค่าจอด
                const getSubFormHeaderZone = await this.getCalSubFromBetweenOrLastSub(subitem, body);
                //------------คำนวณค่าจอดหลัก
                const calParkingSubFromMain = await this.calParkingPriceFromSubObj(subitem, getSubFormHeaderZone);
                return {
                    ...subitem,
                    sub_object: getSubFormHeaderZone,
                    parking_object: calParkingSubFromMain
                }
            })
            //==============//////////=============//
            const getSubFromHeaderZone = await Promise.all(getSubFromHeaderZonePromise);
            const subObjResult = {
                ...item,
                calculate_object: {
                    calculate_form_zone: {
                        main: SubFromHeaderMainObj,
                        zone: getSubFromHeaderZone
                    }
                }
            }
            return subObjResult;
        })
        const getSubConfig = await Promise.all(getSubConfigPromise);
        return getSubConfig;
    }
    async getCalSubFromBetweenOrLastSub(inPutObj: any, body: any) {
        const cps_id = await this.getCalSubCpsID(inPutObj, body)
        if (cps_id) {
            const result = await this.getCalSubConfigStandard(cps_id, body);
            return result;
        } else {
            const result = await this.getCalSubConfigOverInBase(inPutObj, body);
            console.log(`getCalSubConfigOverInBase : ${JSON.stringify(result)}`)
            return result;
        }
    }

    async getCalSubConfigStandard(cps_id: string, body: any) {
        const company_id = body.company_id;
        let sql = `select cps_id,mcps.cph_id,line_no
        ,TRUNC(EXTRACT(EPOCH FROM cps_start_interval::interval)/60) as cps_start_interval
        ,TRUNC(EXTRACT(EPOCH FROM cps_stop_interval::interval)/60) as cps_stop_interval
        ,cps_amount_value,cps_status
        ,mcph.cartype_id
        ,TRUNC(EXTRACT(EPOCH FROM mcph.cph_cal_every_interval::interval)/60) as cph_cal_every_interval
        ,mcph.cph_cal_amount_value
        from m_calculate_parking_sub mcps
        left join m_calculate_parking_header mcph
        on mcps.cph_id = mcph.cph_id
        where mcps.delete_flag = 'N'
        and mcps.cps_status = 'Y'
        and mcps.cps_id = $1
        and mcps.company_id = $2
        order by mcps.line_no 
        ;`
        const query = {
            text: sql,
            values: [cps_id, company_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return res.result[0];
    }

    async getCalSubConfigOverInBase(inPutObj: any, body: any) {
        console.log(`minuteInterval : ${inPutObj.minutes}`)
        const cph_id = inPutObj.cph_id;
        const minuteInterval = inPutObj.minutes;
        const company_id = body.company_id;
        let sql = `select cps_id,mcps.cph_id,line_no
        ,TRUNC(EXTRACT(EPOCH FROM cps_start_interval::interval)/60) as cps_start_interval
        ,TRUNC(EXTRACT(EPOCH FROM cps_stop_interval::interval)/60) as cps_stop_interval
        ,cps_amount_value,cps_status
        ,mcph.cartype_id
        ,TRUNC(EXTRACT(EPOCH FROM mcph.cph_cal_every_interval::interval)/60) as cph_cal_every_interval
        ,mcph.cph_cal_amount_value
        from m_calculate_parking_sub mcps
        left join m_calculate_parking_header mcph
        on mcps.cph_id = mcph.cph_id
        where mcps.delete_flag = 'N'
        and mcps.cps_status = 'Y'
        and mcps.cph_id = $1
        and mcps.company_id = $2
        and mcps.cps_stop_interval <= interval '${minuteInterval} minutes'
        order by mcps.line_no DESC
        limit 1
        ;`
        const query = {
            text: sql,
            values: [cph_id, company_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return res.result[0];
    }

    async getCalSubCpsID(inPutObj: any, body: any) {
        const cph_id = inPutObj.cph_id;
        const company_id = body.company_id;
        const minuteInterval = inPutObj.minutes;
        console.log('minuteInterval : '+minuteInterval)
        console.log('inPutObj : '+JSON.stringify(inPutObj))
        let sql = `select cps_id
        from m_calculate_parking_sub mcps
        where mcps.delete_flag = 'N'
        and cps_status = 'Y'
        and cph_id = $1
        and mcps.company_id = $2
        and interval '${minuteInterval} minutes' between mcps.cps_start_interval and mcps.cps_stop_interval 
        order by line_no 
        ;`
        const query = {
            text: sql,
            values: [cph_id, company_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if (res.error || res.result.length === 0)
            return null;
        else return res.result[0].cps_id;
    }

    async calParkingPriceFromSubObj(inputObj: any, subObj: any) {
        const minutesInput = inputObj.minutes > 0 ? inputObj.minutes : 0;
        //--------------เช็คว่าอยู่ในช่วงเวลาของ sub
        if (subObj) {
            const calEveryInterval = subObj.cph_cal_every_interval;
            const calEveryPrice = subObj.cph_cal_amount_value;
            //-------------------------
            const intervalForSubtract = subObj.cps_stop_interval
            const calInterval = minutesInput - intervalForSubtract
            const interval_before_cal = minutesInput;
            const interval_after_cal = calInterval > 0 ? calInterval : 0;
            const parking_amount_before = minutesInput > 0 ? subObj.cps_amount_value : 0;
            const parking_amount_after = this.calParkingPriceWithInterval(interval_after_cal, calEveryInterval, calEveryPrice)
            const parking_total = parking_amount_before + parking_amount_after;
            return {
                interval_before_cal,
                interval_after_cal,
                parking_amount_before,
                parking_amount_after,
                parking_total,
            }
        } else {
            const interval_before_cal = minutesInput;
            const interval_after_cal = minutesInput;
            const calEveryInterval = inputObj.cph_cal_every_interval;
            const calEveryPrice = inputObj.cph_cal_amount_value;
            //-------------------------
            const parking_amount_before = 0;
            const parking_amount_after = this.calParkingPriceWithInterval(interval_after_cal, calEveryInterval, calEveryPrice)
            const parking_total = parking_amount_before + parking_amount_after;
            return {
                interval_before_cal,
                interval_after_cal,
                parking_amount_before,
                parking_amount_after,
                parking_total,
            }
        }
    }

    calParkingPriceWithInterval(intervalNum: number, minutesNum: number, parkingPrice: number) {
        const countLoop = Math.ceil(intervalNum / minutesNum)
        return countLoop * parkingPrice
    }
}
