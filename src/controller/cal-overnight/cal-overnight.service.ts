import { Injectable } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import * as moment from 'moment';

@Injectable()
export class CalOvernightService {
    constructor(private readonly errMessageUtilsTh: ErrMessageUtilsTH,
        private readonly dbconnecttion: dbConnection,
    ) { }

    async calculateOverNight(calConfigObj: any) {
        let day_runnung = 1;
        const calOverNightPromise = calConfigObj.map(async item => {
            if (await this.checkOverNight(item)) {
                const newOverNight = this.calNewTimeForOverNight(item, calConfigObj.length, day_runnung);
                day_runnung++;
                return newOverNight;
            } else {
                day_runnung++;
                return { 
                    ...item, 
                    calculate_object: {
                        newtimestart: this.overnight_stop_global ? this.overnight_stop_global : item.timestart,//วันข้ามคืนก่อนหน้า
                        newtimeend: item.timeend,
                        overnight_fine_amount: 0
                    }
    
                }
            }
        })
        const calOverNight = await Promise.all(calOverNightPromise)
        return calOverNight;
    }

    async checkOverNight(calConfigObj: any) {
        const timeEndOvernight = moment(calConfigObj.cpm_object.cpm_overnight_start,'HH;mm:ss')
        const timeEnd = moment(calConfigObj.timeend,'HH:mm:ss');
        
        if (calConfigObj.cpm_object.cpm_overnight_status.toUpperCase() === 'Y' && timeEndOvernight <= timeEnd)
            return true;
        return false;
    }

    overnight_stop_global: string = null;

    calNewTimeForOverNight(calConfigObj: any, dayCount: number, dayRunnung: number) {
        let newOverNight = null;
        //-----ถ้าข้ามคืนเกิน 1 วัน
        if (dayCount > 1 && dayCount === dayRunnung) {
            let newOverNightEnd;
            if (calConfigObj.timeend < this.overnight_stop_global)
                newOverNightEnd = this.overnight_stop_global
            else
                newOverNightEnd = calConfigObj.timeend
            //----------------
            newOverNight = {
                ...calConfigObj,
                calculate_object: {
                    newtimestart: this.overnight_stop_global,//วันข้ามคืนก่อนหน้า
                    newtimeend: newOverNightEnd,
                    overnight_fine_amount: calConfigObj.cpm_object.cpm_fine_amount
                }
            }

        } else if (dayRunnung > 1) {
            newOverNight = {
                ...calConfigObj,
                calculate_object: {
                    newtimestart: this.overnight_stop_global,//วันข้ามคืนก่อนหน้า
                    newtimeend: calConfigObj.cpm_object.cpm_overnight_start,
                    overnight_fine_amount: calConfigObj.cpm_object.cpm_fine_amount
                }
            }
        } else if (dayCount === 1) {
            newOverNight = {
                ...calConfigObj,
                calculate_object: {
                    newtimestart: calConfigObj.timestart,
                    newtimeend: calConfigObj.timeend,
                    overnight_fine_amount: calConfigObj.cpm_object.cpm_fine_amount
                }
            }
        } else {
            newOverNight = {
                ...calConfigObj,
                calculate_object: {
                    newtimestart: calConfigObj.timestart,
                    newtimeend: calConfigObj.cpm_object.cpm_overnight_start,
                    overnight_fine_amount: calConfigObj.cpm_object.cpm_fine_amount
                }
            }
        }
        //-----เก็บเวลาข้ามคืนไว้เพื่อใช้ในวันถัดไป
        this.overnight_stop_global = calConfigObj.cpm_object.cpm_overnight_stop;
        return newOverNight;
    }
}
