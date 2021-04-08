import { ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatusException } from 'src/utils/callback.status';
import * as jwt from 'jsonwebtoken';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
// }
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        // Add your custom authentication logic here
        // for example, call super.logIn(request) to establish a session.
        return super.canActivate(context);
    }

    handleRequest(err, user, info: Error) {
        // You can throw an exception based on either "info" or "err" arguments
        this.checkToken(user.exp);
        if (info instanceof jwt.TokenExpiredError){
            console.log('token expired');
        }   
        if (err || !user) {
            console.log(`Authentication Unauthorized ${user}`);
            throw err || new StatusException({
                error: 'Session หมดอายุ',
                result: null,
                message: 'Session หมดอายุ',
                statusCode: 401
            }, 200)
        }
        
        return user;
    }

    checkToken(exp) {
        console.log(exp * 1000)
        console.log(Date.now())
        if (Date.now() <= exp * 1000) {
          console.log(true, 'token is not expired')
        } else { 
          console.log(false, 'token is expired') 
        }
      }
}
