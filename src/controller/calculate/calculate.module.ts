import { HttpModule , MiddlewareConsumer, Module } from '@nestjs/common';
import { DefaultValueMiddleware } from 'src/middleware/default/default-value.middleware';
import { DateTimeMiddleware } from 'src/middleware/time/datetime.middleware';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { LoadSettingLocalUtils } from 'src/utils/load_setting_local.utils';
import { CalOvernightService } from '../cal-overnight/cal-overnight.service';
import { CalTimeDiffService } from '../cal-time-diff/cal-time-diff.service';
import { GetCalConfigHeaderService } from '../get-cal-config-header/get-cal-config-header.service';
import { GetCalConfigMasterService } from '../get-cal-config-master/get-cal-config-master.service';
import { SplitDateService } from '../split-date/split-date.service';
import { CalculateController } from './calculate.controller';
import { CalculateService } from './calculate.service';
import { GetCalConfigSubService } from '../get-cal-config-sub/get-cal-config-sub.service'
import { CalculateFinallyService } from '../calculate-finally/calculate-finally.service';
import { PromotionService } from '../promotion/promotion.service';
import { vsActionOutVerifyEstampMiddleware } from 'src/middleware/calculate/calculate.middleware';
import { EmployeeMiddleware } from 'src/middleware/employee/employee.middleware';
import { InsertLogService } from 'src/insert-log/insert-log.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports:[
    HttpModule 
  ],
  controllers: [CalculateController],
  providers: [
    CalculateService,
    dbConnection,
    FormatDataUtils,
    ErrMessageUtilsTH,
    SplitDateService,
    GetCalConfigMasterService,
    GetCalConfigHeaderService,
    GetCalConfigSubService,
    CalOvernightService,
    CalTimeDiffService,
    LoadSettingLocalUtils,
    CalculateFinallyService,
    PromotionService,
    InsertLogService,
  ]
})
export class CalculateModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DefaultValueMiddleware)
      .forRoutes('api/bannayuu/calculate/*');
    consumer
      .apply(DateTimeMiddleware, vsActionOutVerifyEstampMiddleware)
      .forRoutes('api/bannayuu/calculate/cal-all');
  }
}
