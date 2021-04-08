import { Controller, Post,Request, UseGuards } from '@nestjs/common';
import { StatusException } from 'src/utils/callback.status';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/bannayuu/calculate/auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Request() req) {
      return this.authService.login(req.body);
    }

    @UseGuards(JwtAuthGuard)
    @Post('post')
    async post(@Request() req) {
        console.log(req.user);
        throw new StatusException({
            error: null,
            result: req.user.employee,
            message: 'Success.',
            statusCode: 200
          }, 200);
    }
}
