import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { LoadSettingLocalUtils } from 'src/utils/load_setting_local.utils';
@Injectable()
export class CalTimeDiffService {
    async calTimeDiff(calConfigObj: any, body: any, checkDiscountMinute: boolean) {
        const getCalTimeDiffPromise = await calConfigObj.map(async item => {
            return await this.calculate(item, checkDiscountMinute);
        })
        const getCalTimeDiff = await Promise.all(getCalTimeDiffPromise);
        return getCalTimeDiff;
    }

    async calculate(calConfigObj: any, checkDiscountMinute: boolean) {
        const timeDiffBeforResult = await this.calDiffToMinutes(calConfigObj.timestart, calConfigObj.timeend, checkDiscountMinute);
        const timeDiffAfterResult = await this.calDiffToMinutes(calConfigObj.calculate_object.newtimestart, calConfigObj.calculate_object.newtimeend, checkDiscountMinute);
        const calDiffFormHeader = await this.calDiffFormCalculateParkingHeader(calConfigObj, checkDiscountMinute);
        const calDiffFromHeaderToSub = {
            newtimestart: calConfigObj.calculate_object.newtimestart,
            newtimeend: calConfigObj.calculate_object.newtimeend,
            overnight_fine_amount: calConfigObj.calculate_object.overnight_fine_amount,
            ...calConfigObj,
            calculate_object:{
                ...calConfigObj.calculate_object,
                time_diff_before_overnight: timeDiffBeforResult,
                time_diff_after_overnight: timeDiffAfterResult,
                calculate_form_zone: calDiffFormHeader
            }
        }
        return calDiffFromHeaderToSub;
    }

    async calDiffToMinutes(timeStart: string, timeEnd: string, checkDiscountMinute: boolean) {
        const timeDiff = moment.duration(moment(timeEnd, 'HH:mm a').diff(moment(timeStart, 'HH:mm a')));
        return timeDiff.asMinutes();
    }

    async calDiffFormCalculateParkingHeader(calConfigObj: any, checkDiscountMinute: boolean) {
        if (calConfigObj.cph_object) {
            let newTimeStart, newTimeStop;
            const calDiffHeaderPromise = await calConfigObj.cph_object.map(async item => {
                const timeStart = moment(calConfigObj.calculate_object.newtimestart, 'HH:mm a')
                const timeEnd = moment(calConfigObj.calculate_object.newtimeend, 'HH:mm a')
                const timeZoneStart = moment(item.time_zone_start, 'HH:mm a')
                const timeZoneStop = moment(item.time_zone_stop, 'HH:mm a')
                if (timeStart > timeZoneStart && timeEnd < timeZoneStop && timeEnd > timeZoneStart) {
                    newTimeStart = timeStart;
                    newTimeStop = timeEnd;
                } else if (timeStart <= timeZoneStart && timeEnd >= timeZoneStop) {
                    newTimeStart = timeZoneStart;
                    newTimeStop = timeZoneStop;
                } else if (timeStart <= timeZoneStart && timeEnd > timeZoneStart && timeEnd < timeZoneStop) {
                    newTimeStart = timeZoneStart;
                    newTimeStop = timeEnd;
                } else if (timeStart >= timeZoneStart && timeStart < timeZoneStop && timeEnd >= timeZoneStop) {
                    newTimeStart = timeStart;
                    newTimeStop = timeZoneStop;
                } else if (timeStart === timeZoneStart && timeEnd === timeZoneStop) {
                    newTimeStart = timeZoneStart;
                    newTimeStop = timeZoneStop;
                } else {
                    newTimeStart = "00:00:00"
                    newTimeStop = "00:00:00"
                }
                return this.calDiffToMinutes(newTimeStart, newTimeStop, checkDiscountMinute);
            });
            const calDiffHeader = await Promise.all(calDiffHeaderPromise);
            const calDiffMainZone = this.calDiffMainTime(calDiffHeader, calConfigObj)
            return calDiffMainZone;
        }
        return null;
    }

    async calDiffMainTime(minuteTimeZones: any, calDiffHeader: any) {
        let mainMinuteZone = minuteTimeZones[0];
        // if (checkDiscountMinute) {
        //     const getHoursFree = cpm_time_for_free.hours ? cpm_time_for_free.hours : 0;
        //     const getMinutesFree = cpm_time_for_free.minutes ? cpm_time_for_free.minutes : 0
        //     const minute_free = getHoursFree * 60 + getMinutesFree;
        //     const newMinuteMainZone = mainMinuteZone - minute_free;
        //     mainMinuteZone = newMinuteMainZone > 0 ? newMinuteMainZone : 0;
        // }
        const getHoursEveryMain = calDiffHeader.cph_object[0].cph_cal_every_interval.hours ? calDiffHeader.cph_object[0].cph_cal_every_interval.hours : 0;
        const getMinutesEveryMain = calDiffHeader.cph_object[0].cph_cal_every_interval.minutes ? calDiffHeader.cph_object[0].cph_cal_every_interval.minutes : 0
        const minuteEveryMain = getHoursEveryMain * 60 + getMinutesEveryMain;
        const priceEveryMain = calDiffHeader.cph_object[0].cph_cal_amount_value;
        //******************************//
        let zoneCount = 1;
        //----------------ถ้า header มีมากกว่า 1
        if (minuteTimeZones.length > 1) {
            let newMinuteMainZone = mainMinuteZone;
            let newMinuteZones = minuteTimeZones;
            newMinuteZones.shift();
            const mainMinute = newMinuteZones.map(item => {
                const calMinuteZone = newMinuteMainZone - item;
                return calMinuteZone > 0 ? calMinuteZone : 0;
            })
            const newZoneConvertObj = newMinuteZones.map(item => {
                const getHoursEveryZone = calDiffHeader.cph_object[zoneCount].cph_cal_every_interval.hours ? calDiffHeader.cph_object[zoneCount].cph_cal_every_interval.hours : 0;
                const getMinutesEveryZone = calDiffHeader.cph_object[zoneCount].cph_cal_every_interval.minutes ? calDiffHeader.cph_object[zoneCount].cph_cal_every_interval.minutes : 0
                const minuteEveryZone = getHoursEveryZone * 60 + getMinutesEveryZone;
                const priceEveryZone = calDiffHeader.cph_object[zoneCount].cph_cal_amount_value
                const result = {
                    cpm_id: calDiffHeader.cpm_object.cpm_id,
                    cph_id: calDiffHeader.cph_object[zoneCount].cph_id,
                    cph_cal_every_interval: minuteEveryZone,
                    cph_cal_amount_value: priceEveryZone,
                    minutes: item
                }
                zoneCount++;
                return result;
            })
            return {
                main: {
                    cpm_id: calDiffHeader.cpm_object.cpm_id,
                    cph_id: calDiffHeader.cph_object[0].cph_id,
                    cph_cal_every_interval: minuteEveryMain,
                    cph_cal_amount_value: priceEveryMain,
                    minutes: mainMinute[0]
                }, zone: newZoneConvertObj
            };
        } return {
            main: {
                cpm_id: calDiffHeader.cpm_object.cpm_id,
                cph_id: calDiffHeader.cph_object[0].cph_id,
                cph_cal_every_interval: minuteEveryMain,
                cph_cal_amount_value: priceEveryMain,
                minutes: mainMinuteZone
            }, zone: []
        };
    }

    async calTimeDiffFormDateStartToDateEnd(dateStart:string,dateEnd:string){
        const start = moment(dateStart);
        const end = moment(dateEnd);
        const diffTime = moment.duration(end.diff(start));
        return diffTime.asMinutes();
    }
}