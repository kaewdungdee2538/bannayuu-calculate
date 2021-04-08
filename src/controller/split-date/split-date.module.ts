import { Module } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { SplitDateController } from './split-date.controller';
import { SplitDateService } from './split-date.service';

@Module({
  controllers: [SplitDateController],
  providers: [SplitDateService, dbConnection, FormatDataUtils, ErrMessageUtilsTH]
})
export class SplitDateModule {}
