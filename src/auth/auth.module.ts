import { MiddlewareConsumer, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { AuthController } from './auth.controller';
import { AuthMiddleware } from './auth.middleware';
import { AuthService } from './auth.service';
import { jwtConstants } from './constant';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports:[ JwtModule.register({
    secret: jwtConstants.secret,
    // signOptions: { expiresIn: '1s' },
  }),dbConnection],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy,dbConnection,ErrMessageUtilsTH,FormatDataUtils],
  exports:[AuthService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware,)
      .forRoutes('webbannayuu/api/auth/*');
  }
}
