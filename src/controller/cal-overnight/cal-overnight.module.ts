import { Module } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { CalOvernightController } from './cal-overnight.controller';
import { CalOvernightService } from './cal-overnight.service';

@Module({
  controllers: [CalOvernightController],
  providers: [
    CalOvernightService, 
    dbConnection, 
    FormatDataUtils, 
    ErrMessageUtilsTH,]
})
export class CalOvernightModule {}
