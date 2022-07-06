import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { LoadSettingLocalUtils } from 'src/utils/load_setting_local.utils';
@Injectable()
export class CalTimeDiffService {
  async calTimeDiff(calConfigObj: any, body: any) {
    const getCalTimeDiffPromise = await calConfigObj.map(async (item) => {
    //   console.log('calConfigObj : ' + JSON.stringify(item));
      return await this.calculate(item);
    });
    const getCalTimeDiff = await Promise.all(getCalTimeDiffPromise);
    return getCalTimeDiff;
  }

  async calculate(calConfigObj: any) {
    const timeDiffBeforResult = await this.calDiffToMinutes(
      calConfigObj.timestart,
      calConfigObj.timeend,
    );
    const timeDiffAfterResult = await this.calDiffToMinutes(
      calConfigObj.calculate_object.newtimestart,
      calConfigObj.calculate_object.newtimeend,
    );
    const calDiffFormHeader = await this.calDiffFormCalculateParkingHeader(
      calConfigObj,
    );

    const calDiffFromHeaderToSub = {
      newtimestart: calConfigObj.calculate_object.newtimestart,
      newtimeend: calConfigObj.calculate_object.newtimeend,
      overnight_fine_amount:
        calConfigObj.calculate_object.overnight_fine_amount,
      ...calConfigObj,
      calculate_object: {
        ...calConfigObj.calculate_object,
        time_diff_before_overnight: timeDiffBeforResult,
        time_diff_after_overnight: timeDiffAfterResult,
        calculate_form_zone: calDiffFormHeader,
      },
    };
    return calDiffFromHeaderToSub;
  }

  async calDiffFormCalculateParkingHeader(calConfigObj: any) {
    if (calConfigObj.cph_object) {
      let newTimeStart, newTimeStop;
      const calDiffHeaderPromise = await calConfigObj.cph_object.map(
        async (item) => {
          const timeStart = moment(
            calConfigObj.calculate_object.newtimestart,
            'HH:mm:ss',
          );
          const timeEnd = moment(
            calConfigObj.calculate_object.newtimeend,
            'HH:mm:ss',
          );
          const timeZoneStart = moment(item.time_zone_start, 'HH:mm:ss');
          const timeZoneStop = moment(item.time_zone_stop, 'HH:mm:ss');

          console.log({ timeStart });
          console.log({ timeEnd });
          console.log({ timeZoneStart });
          console.log({ timeZoneStop });

          if (
            timeStart > timeZoneStart &&
            timeEnd < timeZoneStop &&
            timeEnd > timeZoneStart
          ) {
            newTimeStart = timeStart;
            newTimeStop = timeEnd;
          } else if (timeStart <= timeZoneStart && timeEnd >= timeZoneStop) {
            newTimeStart = timeZoneStart;
            newTimeStop = timeZoneStop;
          } else if (
            timeStart <= timeZoneStart &&
            timeEnd > timeZoneStart &&
            timeEnd < timeZoneStop
          ) {
            newTimeStart = timeZoneStart;
            newTimeStop = timeEnd;
          } else if (
            timeStart >= timeZoneStart &&
            timeStart < timeZoneStop &&
            timeEnd >= timeZoneStop
          ) {
            newTimeStart = timeStart;
            newTimeStop = timeZoneStop;
          } else if (timeStart === timeZoneStart && timeEnd === timeZoneStop) {
            newTimeStart = timeZoneStart;
            newTimeStop = timeZoneStop;
          } else {
            newTimeStart = '00:00:00';
            newTimeStop = '00:00:00';
          }
          console.log(
            `calDiffFormCalculateParkingHeader : ${newTimeStart} , ${newTimeStop}`,
          );
          return this.calDiffToMinutes(newTimeStart, newTimeStop);
        },
      );
      const calDiffHeader = await Promise.all(calDiffHeaderPromise);
      // console.log({calDiffHeader})
      const calDiffMainZone = this.calDiffMainTime(calDiffHeader, calConfigObj);
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
    const getHoursEveryMain = calDiffHeader.cph_object[0].cph_cal_every_interval
      .hours
      ? calDiffHeader.cph_object[0].cph_cal_every_interval.hours
      : 0;
    const getMinutesEveryMain = calDiffHeader.cph_object[0]
      .cph_cal_every_interval.minutes
      ? calDiffHeader.cph_object[0].cph_cal_every_interval.minutes
      : 0;
    const minuteEveryMain = getHoursEveryMain * 60 + getMinutesEveryMain;
    const priceEveryMain = calDiffHeader.cph_object[0].cph_cal_amount_value;
    //******************************//
    let zoneCount = 1;
    //----------------ถ้า header มีมากกว่า 1
    if (minuteTimeZones.length > 1) {
      let newMinuteMainZone = mainMinuteZone;
      let newMinuteZones = minuteTimeZones;
      newMinuteZones.shift();
      const mainMinute = newMinuteZones.map((item) => {
        const calMinuteZone = newMinuteMainZone - item;
        return calMinuteZone > 0 ? calMinuteZone : 0;
      });
      const newZoneConvertObj = newMinuteZones.map((item) => {
        const getHoursEveryZone = calDiffHeader.cph_object[zoneCount]
          .cph_cal_every_interval.hours
          ? calDiffHeader.cph_object[zoneCount].cph_cal_every_interval.hours
          : 0;
        const getMinutesEveryZone = calDiffHeader.cph_object[zoneCount]
          .cph_cal_every_interval.minutes
          ? calDiffHeader.cph_object[zoneCount].cph_cal_every_interval.minutes
          : 0;
        const minuteEveryZone = getHoursEveryZone * 60 + getMinutesEveryZone;
        const priceEveryZone =
          calDiffHeader.cph_object[zoneCount].cph_cal_amount_value;
        const result = {
          cpm_id: calDiffHeader.cpm_object.cpm_id,
          cph_id: calDiffHeader.cph_object[zoneCount].cph_id,
          cph_cal_every_interval: minuteEveryZone,
          cph_cal_amount_value: priceEveryZone,
          minutes: item,
        };
        zoneCount++;
        return result;
      });
      return {
        main: {
          cpm_id: calDiffHeader.cpm_object.cpm_id,
          cph_id: calDiffHeader.cph_object[0].cph_id,
          cph_cal_every_interval: minuteEveryMain,
          cph_cal_amount_value: priceEveryMain,
          minutes: mainMinute[0],
        },
        zone: newZoneConvertObj,
      };
    }
    return {
      main: {
        cpm_id: calDiffHeader.cpm_object.cpm_id,
        cph_id: calDiffHeader.cph_object[0].cph_id,
        cph_cal_every_interval: minuteEveryMain,
        cph_cal_amount_value: priceEveryMain,
        minutes: mainMinuteZone,
      },
      zone: [],
    };
  }

  async calDiffToMinutes(timeStart: string, timeEnd: string) {
    const timeDiff = moment.duration(
      moment(timeEnd, 'HH:mm:ss').diff(moment(timeStart, 'HH:mm:ss')),
    );
    const timeDiffReturn = Math.ceil(timeDiff.asMinutes());
    const minutesDiff = timeDiffReturn > 0 ? timeDiffReturn : 0;
    console.log(
      `calMinutesDiff : ${minutesDiff}, timeStart : ${timeStart},timeEnd : ${timeEnd}`,
    );
    return minutesDiff;
  }

  async calTimeDiffFormDateStartToDateEnd(dateStart: string, dateEnd: string) {
    const start = moment(dateStart);
    const end = moment(dateEnd);
    const diffTime = moment.duration(end.diff(start));
    const timeDiffReturn = Math.ceil(diffTime.asMinutes());
    const minuteDiff = timeDiffReturn > 0 ? timeDiffReturn : 0;
    console.log(
      `sumInterval : ${minuteDiff}, dateStart : ${dateStart}, dateEnd : ${dateEnd}`,
    );
    return minuteDiff;
  }

  convertTimeDiffToText(intervalInput: number) {
    let newInterval = intervalInput ? intervalInput : 0;
    const days = Math.floor(intervalInput / 1440);
    newInterval = Math.floor(intervalInput % 1440);
    const hours = Math.floor(newInterval / 60);
    const minutes = intervalInput % 60;
    const daysText = days > 0 ? `${days} วัน ` : '';
    const hoursText = hours > 0 ? `${hours} ชั่วโมง ` : '';
    const minutesText = `${minutes} นาที`;
    console.log(`days : ${days}, hours : ${hours}, minutes : ${minutes}`);
    return `${daysText}${hoursText}${minutesText}`;
  }
}
