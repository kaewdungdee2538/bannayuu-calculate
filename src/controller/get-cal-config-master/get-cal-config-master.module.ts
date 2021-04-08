import { Module } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { GetCalConfigMasterController } from './get-cal-config-master.controller';
import { GetCalConfigMasterService } from './get-cal-config-master.service';

@Module({
  controllers: [GetCalConfigMasterController],
  providers: [
    GetCalConfigMasterService,
    dbConnection,
    FormatDataUtils,
    ErrMessageUtilsTH,
  ]
})
export class GetCalConfigModule { }
