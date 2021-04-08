import { Injectable } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import * as moment from 'moment';
@Injectable()
export class SplitDateService {
    constructor(
        private readonly errMessageUtilsTh: ErrMessageUtilsTH,
        private readonly dbconnecttion: dbConnection,
        private readonly formarDataUtils: FormatDataUtils,
    ) { }


    async splitDate(date_start: string, date_end: string) {
        console.log('date_start' + date_start + 'date_end' + date_end)
        const middleware = await this.splitDateMiddleware(date_start, date_end);
        if (middleware) {
            console.log('middleware date split : ' + middleware);
            return {
                error: true,
                data: null,
                message: middleware
            }
        } else {
            let dateArray = []
            const dateDiff = moment(date_end,'YYYY-MM-DD').diff(moment(date_start,'YYYY-MM-DD'))
            const dateCount = moment(dateDiff).dayOfYear()
            console.log('dateCount : '+dateCount)
            if (dateCount > 1) {
                let dateCurrent = moment(date_start);
                for (let num = 1; num <= dateCount; num++) {
                    if (num === 1) {
                        const start = moment(dateCurrent).format('YYYY-MM-DD HH:mm:ss')
                        const datestart = moment(dateCurrent).format('YYYY-MM-DD')
                        const timestart = moment(dateCurrent).format('HH:mm:ss')
                        const timeend = moment(dateCurrent).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).format('HH:mm:ss');
                        const dateend = moment(dateCurrent).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).format('YYYY-MM-DD');
                        const end = moment(dateCurrent).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).format('YYYY-MM-DD HH:mm:ss');
                        dateArray = [...dateArray, { start, datestart, timestart, end, dateend, timeend }]
                    } else if (num === dateCount) {
                        const start = moment(dateCurrent).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).format('YYYY-MM-DD HH:mm:ss')
                        const datestart = moment(dateCurrent).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).format('YYYY-MM-DD')
                        const timestart = moment(dateCurrent).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).format('HH:mm:ss')
                        const end = moment(date_end).format('YYYY-MM-DD HH:mm:ss');
                        const dateend = moment(date_end).format('YYYY-MM-DD');
                        const timeend = moment(date_end).format('HH:mm:ss');
                        dateArray = [...dateArray, { start, datestart, timestart, end, dateend, timeend }]
                    } else {
                        const start = moment(dateCurrent).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).format('YYYY-MM-DD HH:mm:ss')
                        const datestart = moment(dateCurrent).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).format('YYYY-MM-DD')
                        const timestart = moment(dateCurrent).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).format('HH:mm:ss')
                        const end = moment(dateCurrent).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).format('YYYY-MM-DD HH:mm:ss');
                        const dateend = moment(dateCurrent).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).format('YYYY-MM-DD');
                        const timeend = moment(dateCurrent).set({ hour: 23, minute: 59, second: 59, millisecond: 0 }).format('HH:mm:ss');
                        dateArray = [...dateArray, { start, datestart, timestart, end, dateend, timeend }]
                    }
                    //---------------------Add Date 1 day
                    dateCurrent = moment(dateCurrent).add(1, 'day').set({ hour: 23, minute: 59, second: 59, millisecond: 0 });
                }
            } else {
                dateArray = [
                    {
                        start: moment(date_start).format('YYYY-MM-DD HH:mm:ss'),
                        datestart: moment(date_start).format('YYYY-MM-DD'),
                        timestart: moment(date_start).format('HH:mm:ss'),
                        end: moment(date_start).format('YYYY-MM-DD HH:mm:ss'),
                        dateend: moment(date_start).format('YYYY-MM-DD'),
                        timeend: moment(date_start).format('HH:mm:ss')
                    }
                ]
            }

            console.log('dateCount : ' + dateCount);
            // console.log('dateArray : ' + JSON.stringify(dateArray));
            return {
                error: false,
                data: {
                    dateCount,
                    dateArray
                },
                message: middleware
            }
        }


    }

    async splitDateMiddleware(date_start: string, date_end: string) {
        if (!date_start)
            return this.errMessageUtilsTh.errStartDateNotFormat;
        else if (!this.formarDataUtils.IsDateTimeFormat(date_start))
            return this.errMessageUtilsTh.errStartDateNotFormat;
        else if (!date_end)
            return this.errMessageUtilsTh.errStopDateNotFound;
        else if (!this.formarDataUtils.IsDateTimeFormat(date_end))
            return this.errMessageUtilsTh.errStopDateNotFormat;
        else if (moment(date_start) > moment(date_end))
            return this.errMessageUtilsTh.errStartDateOverStopDate;
        else return null;
    }

    async calculateIntervallAll(dateArray: any) {
        let intervalArrayPromise = await dateArray.map(async (item) => {
            const result = await this.calDiffInterVal(item.start, item.end)
            return result.data
        })
        const intervalArray = await Promise.all(intervalArrayPromise);

        console.log(intervalArray);
    }

    async

    async calDiffInterVal(date_start: string, date_end: string) {
        const middleware = await this.splitDateMiddleware(date_start, date_end);
        if (middleware) {
            console.log('middleware date cal interval : ' + middleware);
            return {
                error: true,
                data: null,
                message: middleware
            }
        } else {
            const start = moment(date_start).format('HH:mm:ss')
            const end = moment(date_end).format('HH:mm:ss')
            let sql = `select ($1::interval - $2::interval)::text as timediff
            ;`
            const query = {
                text: sql
                , values: [end, start]
            }
            const res = await this.dbconnecttion.getPgData(query);
            if (res.error)
                return {
                    error: true,
                    data: null,
                    message: res.error
                }
            else
                return {
                    error: true,
                    data: res.result[0],
                    message: null
                }
        }

    }
}
