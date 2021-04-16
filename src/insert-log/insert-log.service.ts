import { Injectable } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
@Injectable()
export class InsertLogService {
    constructor(
        private readonly dbconnecttion: dbConnection,
    ) { }

    async insertCalculate(body:any,calculateFinallyObj:any){
        const company_id = body.company_id;
        const visitor_record_id = body.visitor_record_id;
        const employee_id = body.employee_id;
        const cartype_id = body.cartype_id;
        const start_date = body.start_date;
        const end_date = body.end_date;
        const calSummary = JSON.stringify(calculateFinallyObj.summary_data);
        const calDaily = JSON.stringify(calculateFinallyObj.daily_data);
        let sql = `insert into t_calculate_parking_log (
        tcpl_code,visitor_record_id,cartype_id
        ,parking_time_in,parking_time_out
        ,tcpl_detail_data,tcpl_sum_data
        ,create_by,create_date
        ,company_id)
        values(
            fun_generate_uuid('TCPL'||trim(to_char(${company_id},'000')),6)
            ,$1,$2
            ,$3,$4
            ,$5,$6
            ,$7,current_timestamp
            ,$8
            );`
        const query = {
            text:sql,
            values:[
                visitor_record_id,cartype_id
                ,start_date,end_date
                ,calDaily,calSummary
                ,employee_id
                ,company_id
            ]
        }
        const res = await this.dbconnecttion.savePgData([query]);
        if (res.error) {
            console.log('Insert Calculate Log fail : '+res.error)
            return res.error
        } else {
            console.log('Insert Calculate Log Success')
            return null;
        }
    }
}
