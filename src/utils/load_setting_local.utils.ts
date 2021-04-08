import { Injectable } from "@nestjs/common";
import { dbConnection } from "src/pg.database/pg.database";


@Injectable()
export class LoadSettingLocalUtils {
    constructor(
        private readonly dbconnecttion: dbConnection
    ) { }
    mycompany_id = process.env.MYCOMPANY_ID
    async loadAllSetting(){

    }
    async getBookingMode(company_id:string){
        const sql =`select setup_data->'booking_verify' as booking_verify
        from m_setup 
        where company_id = $1
        and ref_setup_id = 1:`
        const query = {
            text:sql
            ,values:[company_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if(res.error){
            console.log(res.error)
            return null
        }else if(res.result.length===0){
            console.log('Load Setting booking_in_mode not found')
        }else return res.result[0].setting_local_value
    }

    async getBookingOutEstampMode(company_id:string){
        const sql =`select setup_data->'booking_estamp_verify' as booking_verify
        from m_setup 
        where company_id = $1
        and ref_setup_id = 3;`
        const query = {
            text:sql
            ,values:[this.mycompany_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if(res.error){
            console.log(res.error)
            return null
        }else if(res.result.length===0){
            console.log('Load Setting booking_estamp_mode not found')
        }else return res.result[0].setting_local_value
    }

    async getCalculateSplitDiscountMinuteConfig(company_id:string){
        const sql =`select setup_data->'except_time_split_from_day' as except_time_split_from_day
        from m_setup 
        where company_id = $1
        and ref_setup_id = 8;`
        const query = {
            text:sql
            ,values:[company_id]
        }
        const res = await this.dbconnecttion.getPgData(query);
        if(res.error){
            console.log(res.error)
            return null
        }else if(res.result.length===0){
            console.log('Load Setting except_time_split_from_day not found')
        }else return res.result[0].except_time_split_from_day
    }
}