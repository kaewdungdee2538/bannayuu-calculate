import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        private readonly errMessageUrilTh: ErrMessageUtilsTH,
        private readonly formatDataUtils: FormatDataUtils,
    ){}
    use(req: Request, res: Response, next: () => void) {

        const messageLogin = this.checkLogin(req.body)
        if (messageLogin) {
            console.log('Middleware check Login value  : ' + messageLogin)
            res.send({
                response: {
                    error: messageLogin
                    , result: null
                    , message: messageLogin
                    , statusCode: 200
                }
            });
        } else
            next();
    }

    checkLogin(body: any) {
        if(!body.username)
            return this.errMessageUrilTh.errUsernameNotFound
        else if(this.formatDataUtils.HaveSpecialFormat(body.username))
            return this.errMessageUrilTh.errUsernameProhibitSpecial
        else if(!body.password)
            return this.errMessageUrilTh.errPasswordNotFound
        else if(this.formatDataUtils.HaveSpecialFormat(body.password))
            return this.errMessageUrilTh.errPasswordProhibitSpecial
        return null;
    }
};