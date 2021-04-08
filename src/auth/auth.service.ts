import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { dbConnection } from 'src/pg.database/pg.database';
import { StatusException } from 'src/utils/callback.status';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';

@Injectable()
export class AuthService {
    constructor(
        private readonly errMessageUtilsTh: ErrMessageUtilsTH,
        private readonly jwtService: JwtService,
        private readonly dbconnecttion: dbConnection) { }

    async validateUser(user:any): Promise<any> {
        console.log(user.username + user.password)
        let sql = `select employee_id, employee_code,first_name_th,last_name_th,username,(passcode = crypt($2, passcode)) as password_status `
        sql += `,me.company_id`
        sql += ` FROM m_employee me `;
        sql += ` inner join m_employee_privilege mep on me.employee_privilege_id = mep.employee_privilege_id`;
        sql += ` WHERE me.username = $1 and me.delete_flag = 'N' and mep.delete_flag ='N' and mep.login_maintenance_status='Y'`;
        // sql += ` and me.company_id = $3`;
        sql += `;`
        const querys = {
            text: sql
            , values: [user.username, user.password]
        }
        const result = await this.dbconnecttion.getPgData(querys);
        return result;
    }
    async login(user: any) {
        const response = await this.validateUser(user);
        console.log(response);
        console.log(await response.result.length);
        if (await response.error) {
            throw new StatusException({
                error: this.errMessageUtilsTh.errLoginFail,
                result: null,
                message: this.errMessageUtilsTh.errLoginFail,
                statusCode: 200
            }, 200);
        } else if (await response.result.length === 0) {
            throw new StatusException({
                error: this.errMessageUtilsTh.errLoginUserOrPasswordNotValid,
                result: null,
                message: this.errMessageUtilsTh.errLoginUserOrPasswordNotValid,
                statusCode: 200
            }, 200);
        } else if (await response.result[0].password_status) {
            const payload = { employee: response.result[0] };
            console.log(payload);
            const access_token = this.jwtService.sign(
                payload, { expiresIn: '1d' })
            console.log('login : ' + JSON.stringify(payload) + 'access_token : ' + access_token);
            throw new StatusException({
                error: null,
                result: { 
                    access_token
                    , employee: response.result[0] },
                message: this.errMessageUtilsTh.messageSuccess,
                statusCode: 200
            }, 200);
        } else {
            throw new StatusException({
                error: this.errMessageUtilsTh.errLoginUserOrPasswordNotValid,
                result: null,
                message: this.errMessageUtilsTh.errLoginUserOrPasswordNotValid,
                statusCode: 200
            }, 200);
        }
    }
}
