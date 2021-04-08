import { Module } from '@nestjs/common';
import { dbConnection } from 'src/pg.database/pg.database';
import { ErrMessageUtilsTH } from 'src/utils/err_message_th.utils';
import { FormatDataUtils } from 'src/utils/format_data.utils';
import { CalculateFinallyController } from './calculate-finally.controller';
import { CalculateFinallyService } from './calculate-finally.service';

@Module({
  controllers: [CalculateFinallyController],
  providers: [CalculateFinallyService, dbConnection, FormatDataUtils, ErrMessageUtilsTH]
})
export class CalculateFinallyModule {
}
