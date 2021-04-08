import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CalculateModule } from './controller/calculate/calculate.module';
import { SplitDateModule } from './controller/split-date/split-date.module';
import { loggerMiddleware } from './middleware/logger/logger.middleware';

@Module({
  imports: [
    AuthModule,
    SplitDateModule,
    CalculateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(loggerMiddleware,)
      .forRoutes('*');
  }
}
