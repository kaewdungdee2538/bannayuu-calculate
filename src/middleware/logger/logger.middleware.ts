import { Injectable ,NestMiddleware} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class loggerMiddleware implements NestMiddleware {
    use(req:Request , res : Response, next : () => void){
        const request = {
            _url:`${req.protocol}://${req.get("host")+req.originalUrl}`,
            _method:req.method,
            _request:req.body,
            _date:Date().toString()
        }
        console.log('<========================================================>');
        console.log(request);
        next();
    }
};