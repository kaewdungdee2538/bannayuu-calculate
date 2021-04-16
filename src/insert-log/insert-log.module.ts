import { Module } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { InsertLogController } from './insert-log.controller';
import { InsertLogService } from './insert-log.service';

@Module({
  controllers: [InsertLogController],
  providers: [InsertLogService, dbConnection, FormatDataUtils, ErrMessageUtilsTH]
})
export class InsertLogModule {}
