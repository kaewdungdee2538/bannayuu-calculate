import { Injectable } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { StatusException } from 'src/utils/callback.status';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { SplitDateService } from '../split-date/split-date.service';
import * as moment from 'moment';
import { GetCalConfigMasterService } from '../get-cal-config-master/get-cal-config-master.service';
import { GetCalConfigHeaderService } from '../get-cal-config-header/get-cal-config-header.service';
import { LoadSettingLocalUtils } from 'src/utils/load_setting_local.utils';
import { GetCalConfigSubService } from '../get-cal-config-sub/get-cal-config-sub.service';
import { CalculateFinallyService } from '../calculate-finally/calculate-finally.service';
import { CalTimeDiffService } from '../cal-time-diff/cal-time-diff.service';
import { PromotionService } from '../promotion/promotion.service';
import { InsertLogService } from 'src/insert-log/insert-log.service';

@Injectable()
export class CalculateService {
    constructor(
        private readonly errMessageUtilsTh: ErrMessageUtilsTH,
        private readonly dbconnecttion: dbConnection,
        private splitDateService: SplitDateService,
        private getCalConfigmaster: GetCalConfigMasterService,
        private getCalConfigHeader: GetCalConfigHeaderService,
        private getCalConfigSub: GetCalConfigSubService,
        private localSettingLocalUtils: LoadSettingLocalUtils,
        private calculateFinallyService: CalculateFinallyService,
        private calTimeDiffService: CalTimeDiffService,
        private promotionService: PromotionService,
        private insertLogService: InsertLogService,
    ) { }
    async calculateParking(body: any) {
        const start_date = body.start_date;
        const end_date = body.end_date;
        const resGetDateArray = await this.splitDateService.splitDate(start_date, end_date)
        if (resGetDateArray.error)
            throw new StatusException(
                {
                    error: resGetDateArray.message,
                    result: null,
                    message: resGetDateArray.message,
                    statusCode: 200,
                },
                200);
        else {
            //-----------------------Get Promotion
            const getPromotiion = await this.promotionService.getPromotion(body);
            //-----------------------Split Date
            const DateArray = resGetDateArray.data.dateArray;
            console.log('DateArray : ' + JSON.stringify(DateArray))
            //-----------------------Get master calculate
            const getMasterDay = await this.checkMasterDay(DateArray, body, getPromotiion)
            //------------------------ตรวจสอบว่า แยกลดเวลาจอดออกเป็นวันหรือไม่
            const checkDiscountMinuteExpect = await this.localSettingLocalUtils.getCalculateSplitDiscountMinuteConfig(body.company_id);
            //------------------------คำนวณลดเวลาจอดฟรี
            const getNewCheckExceptTimePerDay = await this.checkExceptTimePerDay(getMasterDay, body, checkDiscountMinuteExpect, getPromotiion);
            const getCalHeader = await this.getCalConfigHeader.calHeader(getNewCheckExceptTimePerDay, body);
            //--------------------คำนวณหาค่าจอดจาก Sub หรือคำนวณหาจากช่วงที่อยู่นอกเหนือจาก Sub ด้วย
            const calFromSub = await this.getCalConfigSub.calculateSub(getCalHeader, body);
            //--------------------คำนวณรวมค่าจอดทั้งหมด
            const calParkingFinally = await this.calculateFinallyService.calculateParkingPriceFinally(calFromSub, getPromotiion);
            //--------------------คำนวณเวลาจอดทั้งหมด
            const minuteTimeDiffAll = await this.calTimeDiffService.calTimeDiffFormDateStartToDateEnd(start_date, end_date);
            //--------------------Convert interval to text format
            const minutesTimeDiffAllIsTextFormat = this.calTimeDiffService.convertTimeDiffToText(minuteTimeDiffAll);
            const minutesTimeDiffAfterDiscountIsTextFormat = this.calTimeDiffService.convertTimeDiffToText(calParkingFinally.sum_interval_before_cal)
            //----------------------------------Object values for return
            const calculateFinallyObj = {
                summary_data: {
                    cartype_id: body.cartype_id,
                    start_date,
                    end_date,
                    sum_interval: minuteTimeDiffAll,
                    sum_interval_text: minutesTimeDiffAllIsTextFormat,
                    sum_interval_after_discount_minute: minutesTimeDiffAfterDiscountIsTextFormat,
                    ...calParkingFinally,
                },
                daily_data: [...calFromSub],
            }
            //----------------------Insert Log
            const isInsertLogFail = await this.insertLogService.insertCalculate(body, calculateFinallyObj);
            if (isInsertLogFail) throw new StatusException({
                error: isInsertLogFail,
                result: null,
                message: this.errMessageUtilsTh.messageProcessFail,
                statusCode: 200
            }, 200);
            throw new StatusException({
                error: null,
                result: calculateFinallyObj,
                message: this.errMessageUtilsTh.messageSuccess,
                statusCode: 200
            }, 200);
        }
    }

    async checkMasterDay(DateArray: any, body: any, getPromotiion: any) {

        const checkMasterDayPromise = await DateArray.map(async item => {
            //------------------ถ้าหากส่วนลดมีการเปลี่ยนเลทการคำนวณใหม่
            if (getPromotiion) {
                if (getPromotiion.promotion_new_calculate_status.toUpperCase() === "Y") {
                    const dayTypeMaster = { ...item, day_type: "NEWCALCULATE", cpm_id: getPromotiion.promotion_new_cpm_id };
                    const cpm_object = await this.getCalConfigmaster.getMasterOfDay(dayTypeMaster, body)
                    return { ...dayTypeMaster, cpm_object, promotion_object: getPromotiion }
                }
            }
            //-----------------ตรวจสอบว่าอยู่ใน zone หรือไม่
            const checkMasterDateZone = await this.getCalConfigmaster.checkMasterDateZone(item, body);
            console.log('checkMasterDateZone : ' + checkMasterDateZone)
            if (checkMasterDateZone) {
                const dayTypeMaster = { ...item, day_type: "SPECIAL" };
                const cpm_object = await this.getCalConfigmaster.getMasterOfDay(dayTypeMaster, body)
                return { ...dayTypeMaster, cpm_object, promotion_object: getPromotiion }
            }
            //----------check holiday
            const checkMasterHoliday = await this.getCalConfigmaster.checkMasterHoliday(item, body);
            console.log('checkMasterHoliday : ' + checkMasterHoliday)
            if (checkMasterHoliday) {
                const dayTypeMaster = { ...item, day_type: "HOLIDAY" };
                const cpm_object = await this.getCalConfigmaster.getMasterOfDay(dayTypeMaster, body)
                return { ...dayTypeMaster, cpm_object, promotion_object: getPromotiion }
            }
            //----------check weekend
            const checkMasterWeekend = await this.getCalConfigmaster.checkMasterWeekend(item);
            console.log('checkMasterWeekend : ' + checkMasterWeekend);
            if (checkMasterWeekend) {
                const dayTypeMaster = { ...item, day_type: "WEEKEND" };
                const cpm_object = await this.getCalConfigmaster.getMasterOfDay(dayTypeMaster, body)
                return { ...dayTypeMaster, cpm_object, promotion_object: getPromotiion }
            }
            //----------day is normal
            const dayTypeMaster = { ...item, day_type: "N" };
            const cpm_object = await this.getCalConfigmaster.getMasterOfDay(dayTypeMaster, body)
            return { ...dayTypeMaster, cpm_object, promotion_object: getPromotiion }
        })
        const checkMasterDay = await Promise.all(checkMasterDayPromise);
        return checkMasterDay;
    }

    async checkExceptTimePerDay(getMasterDay: any, body: any, checkDiscountMinuteExpectDay: boolean, getPromotiion: any) {
        const getHoursFree = getMasterDay[0].cpm_object.cpm_time_for_free.hours ? getMasterDay[0].cpm_object.cpm_time_for_free.hours : 0;
        const getMinutesFree = getMasterDay[0].cpm_object.cpm_time_for_free.minutes ? getMasterDay[0].cpm_object.cpm_time_for_free.minutes : 0
        let minute_free = getHoursFree * 60 + getMinutesFree;
        //---------------------------Promotion discount minute
        let minute_discount = getPromotiion ? getPromotiion.promotion_minutes_discount_value : 0;

        //เวลาออกล่าสุด ลบด้วย เวลาจอดฟรี
        let newMasterDay = [];
        // console.log('getMasterDay : ' + JSON.stringify(getMasterDay))
        for (let num = getMasterDay.length - 1; num >= 0; num--) {
            //---------เพิ่มส่วนลดนาทีเข้าไปก่อน
            minute_free = minute_free + minute_discount;
            const dateStartStr = `${getMasterDay[num].dateend} 00:00:00`
            const dateEndStr = `${getMasterDay[num].dateend} ${getMasterDay[num].timeend}`
            const duration = await this.getDurationDateTime(dateStartStr, dateEndStr);
            console.log('duration : ' + duration)
            console.log('minute_free : ' + minute_free)
            //-----------กรณีไม่แยกยกเว้นเวลาจอดออกเป็นวัน จะลดเวลาจอดโดยรวมก่อน
            if (!checkDiscountMinuteExpectDay) {
                //----------------ถ้าคำนวณแล้วจำนวนนาทีที่เหลือในวันนั้น น้อยกว่า ส่วนลดจอดฟรี
                if (duration < minute_free) {
                    const newTime = await this.setNewDatetimeAfterDisMinute(duration, dateEndStr);

                    newMasterDay.unshift({
                        ...getMasterDay[num],
                        have_a_discount_minute_from_cpm_time_for_free: true,
                        newDate: newTime,
                        timeend: moment(newTime).format('HH:mm:ss'),
                    })
                    //------------set ให้จอดฟรีลบ เวลาที่เหลือจากการจอด
                    minute_free = minute_free - duration
                }//--------------ถ้าคำนวณแล้วจำนวนนาทีที่เหลือในวันนั้นๆ มากกว่า ส่วนลดจอดฟรี และส่วนลดจอดฟรีมากกว่า 0
                else if (duration > minute_free && minute_free > 0) {
                    const newTime = await this.setNewDatetimeAfterDisMinute(minute_free, dateEndStr);
                    newMasterDay.unshift({
                        ...getMasterDay[num],
                        have_a_discount_minute_from_cpm_time_for_free: true,
                        newDate: newTime,
                        timeend: moment(newTime).format('HH:mm:ss'),
                    })
                    //-------------set ให้จอดฟรีเหลือ 0 เพราะ หมดส่วนลดแล้ว
                    minute_free = 0;
                } else {
                    newMasterDay.unshift({
                        ...getMasterDay[num],
                        have_a_discount_minute_from_cpm_time_for_free: false,
                        newDate: null
                    })
                }
            } //-----------กรณีแยกยกเว้นเวลาจอดออกเป็นวัน จะลดเวลาจอดโดยรวมก่อน
            else {
                //---------ลบเวลาจอดทุกวัน
                let newMinuteForFree = 0;
                if (duration < minute_free)
                    newMinuteForFree = duration
                else
                    newMinuteForFree = minute_free
                //--------หักลบส่วนลดนาทีออกไป เพราะไม่ให้ลดนาทีถูกนำไปคำนวณทุกวัน
                minute_discount = 0;
                const newTime = await this.setNewDatetimeAfterDisMinute(newMinuteForFree, dateEndStr);
                newMasterDay.unshift({
                    ...getMasterDay[num],
                    have_a_discount_minute_from_cpm_time_for_free: true,
                    newDate: newTime,
                    timeend: moment(newTime).format('HH:mm:ss'),
                })
            }
        }
        return newMasterDay;
    }

    async getDurationDateTime(datetimeStart: string, datetimeEnd: string) {
        return moment.duration(moment(datetimeEnd).diff(moment(datetimeStart))).asMinutes();
    }

    async setNewDatetimeAfterDisMinute(minutesDis: number, dateCurrent: string) {
        return moment(dateCurrent).subtract(minutesDis, 'minutes').format('YYYY-MM-DD HH:mm:ss')
    }
}
