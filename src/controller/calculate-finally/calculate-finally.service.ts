import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculateFinallyService {

    async calculateParkingPriceFinally(getSubObj: any) {
        const CalculateObj = getSubObj.map(item => item.calculate_object)

        const getCalculateUnitsSplitDayPromise = await CalculateObj.map(async item => {
            //--------------คำนวนของ Main ก่อน
            const getCalUnitMain = this.getParkingUnit(item.calculate_form_zone.main);
            //--------------แยกคำนวณ ของ zone
            const getCalUnitZones = item.calculate_form_zone.zone.map(zoneItem => {
                return this.getParkingUnit(zoneItem);
            });
            const result = [getCalUnitMain, ...getCalUnitZones];
            //---------------Summary ของทั้งวัน
            const summaryParkingPrice = await this.calculateParkingSummary(result);
            return summaryParkingPrice;
        });
        const getCalculateSplitDayUnits = await Promise.all(getCalculateUnitsSplitDayPromise);
        //---------------------Summary all days
        const getSummaryAllDays = await this.calculateParkingSummaryAllDays(getCalculateSplitDayUnits);
        console.log('getSummaryAllDays: ' + JSON.stringify(getSummaryAllDays))
        const getSummaryOverNights = await this.summaryOverNightAll(getSubObj);
        console.log('getSummaryOverNights : ' + getSummaryOverNights)
        return {
            ...getSummaryAllDays
            , sum_overnight_fine_amount: getSummaryOverNights
            , sum_total: getSummaryAllDays.sum_parking_total + getSummaryOverNights
        };
    }

    getParkingUnit(calUnitObj: any) {
        const parkingObj = calUnitObj.parking_object;
        const interval_before_cal = parkingObj.interval_before_cal;
        const interval_after_cal = parkingObj.interval_after_cal;
        const parking_amount_before = parkingObj.parking_amount_before;
        const parking_amount_after = parkingObj.parking_amount_after;
        const parking_total = parkingObj.parking_total;
        return { interval_before_cal, interval_after_cal, parking_amount_before, parking_amount_after, parking_total };
    }
    //--------------------summary split day
    async calculateParkingSummary(calUnitObjs: any) {
        let sum_interval_before_cal = 0;
        let sum_interval_after_cal = 0;
        let sum_parking_amount_before = 0;
        let sum_parking_amount_after = 0;
        let sum_parking_total = 0;
        for (let num = 0; num < calUnitObjs.length; num++) {
            const sumObj = {
                sum_interval_before_cal,
                sum_interval_after_cal,
                sum_parking_amount_before,
                sum_parking_amount_after,
                sum_parking_total,
            }
            const inputObj = {
                interval_before_cal: calUnitObjs[num].interval_before_cal,
                interval_after_cal: calUnitObjs[num].interval_after_cal,
                parking_amount_before: calUnitObjs[num].parking_amount_before,
                parking_amount_after: calUnitObjs[num].parking_amount_after,
                parking_total: calUnitObjs[num].parking_total
            }
            // console.log(inputObj);
            const resultAfterSum = await this.summaryParking(sumObj, inputObj);
            sum_interval_before_cal = resultAfterSum.sum_interval_before_cal;
            sum_interval_after_cal = resultAfterSum.sum_interval_after_cal;
            sum_parking_amount_before = resultAfterSum.sum_parking_amount_before;
            sum_parking_amount_after = resultAfterSum.sum_parking_amount_after;
            sum_parking_total = resultAfterSum.sum_parking_total;
        }

        const result = {
            sum_interval_before_cal,
            sum_interval_after_cal,
            sum_parking_amount_before,
            sum_parking_amount_after,
            sum_parking_total,
        }
        return result;
    }

    async summaryParking(sumObj: any, inputObj: any) {
        const sum_interval_before_cal = sumObj.sum_interval_before_cal + inputObj.interval_before_cal;
        const sum_interval_after_cal = sumObj.sum_interval_after_cal + inputObj.interval_after_cal
        const sum_parking_amount_before = sumObj.sum_parking_amount_before + inputObj.parking_amount_before
        const sum_parking_amount_after = sumObj.sum_parking_amount_after + inputObj.parking_amount_after
        const sum_parking_total = sumObj.sum_parking_total + inputObj.parking_total
        return {
            sum_interval_before_cal,
            sum_interval_after_cal,
            sum_parking_amount_before,
            sum_parking_amount_after,
            sum_parking_total,
        }
    }
    //----------------------------All days
    async calculateParkingSummaryAllDays(calUnitObjs: any) {
        let sum_interval_before_cal = 0;
        let sum_interval_after_cal = 0;
        let sum_parking_amount_before = 0;
        let sum_parking_amount_after = 0;
        let sum_parking_total = 0;
        for (let num = 0; num < calUnitObjs.length; num++) {
            const sumObj = {
                sum_interval_before_cal,
                sum_interval_after_cal,
                sum_parking_amount_before,
                sum_parking_amount_after,
                sum_parking_total,
            }
            const inputObj = {
                interval_before_cal: calUnitObjs[num].sum_interval_before_cal,
                interval_after_cal: calUnitObjs[num].sum_interval_after_cal,
                parking_amount_before: calUnitObjs[num].sum_parking_amount_before,
                parking_amount_after: calUnitObjs[num].sum_parking_amount_after,
                parking_total: calUnitObjs[num].sum_parking_total
            }
            // console.log(inputObj);
            const resultAfterSum = await this.summaryParking(sumObj, inputObj);
            sum_interval_before_cal = resultAfterSum.sum_interval_before_cal;
            sum_interval_after_cal = resultAfterSum.sum_interval_after_cal;
            sum_parking_amount_before = resultAfterSum.sum_parking_amount_before;
            sum_parking_amount_after = resultAfterSum.sum_parking_amount_after;
            sum_parking_total = resultAfterSum.sum_parking_total;
        }

        const result = {
            sum_interval_before_cal,
            sum_interval_after_cal,
            sum_parking_amount_before,
            sum_parking_amount_after,
            sum_parking_total,
        }
        return result;
    }

    //---------------------Overnight
    async summaryOverNightAll(cpmObjs: any) {
        let sum_overnight_fine_amount = 0;
        for (let num = 0; num < cpmObjs.length; num++) {
            const overnightInput = cpmObjs[num].overnight_fine_amount;
            const resultAfterSum = await this.summaryOverNightSplitDay(sum_overnight_fine_amount, overnightInput);
            sum_overnight_fine_amount = resultAfterSum;
        }
        return sum_overnight_fine_amount;
    }

    async summaryOverNightSplitDay(summaryObj: any, inputObj: any) {
        return summaryObj + inputObj;
    }
}
