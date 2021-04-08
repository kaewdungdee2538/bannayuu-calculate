import { Module } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { GetCalConfigSubController } from './get-cal-config-sub.controller';
import { GetCalConfigSubService } from './get-cal-config-sub.service';

@Module({
  controllers: [GetCalConfigSubController],
  providers: [GetCalConfigSubService, dbConnection, FormatDataUtils, ErrMessageUtilsTH]
})
export class GetCalConfigSubModule {}
