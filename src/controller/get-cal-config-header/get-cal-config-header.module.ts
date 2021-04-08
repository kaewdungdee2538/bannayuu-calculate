import { Module } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { LoadSettingLocalUtils } from 'src/utils/load_setting_local.utils';
import { CalOvernightService } from '../cal-overnight/cal-overnight.service';
import { GetCalConfigHeaderController } from './get-cal-config-header.controller';
import { GetCalConfigHeaderService } from './get-cal-config-header.service';

@Module({
  controllers: [GetCalConfigHeaderController],
  providers: [
    GetCalConfigHeaderService,
    dbConnection,
    FormatDataUtils,
    ErrMessageUtilsTH,
    CalOvernightService,
    LoadSettingLocalUtils,
  ]
})
export class GetCalConfigHeaderModule { }
