import { Module } from '@nestjs/common';
import { LoadSettingLocalUtils } from 'src/utils/load_setting_local.utils';
import { CalTimeDiffController } from './cal-time-diff.controller';
import { CalTimeDiffService } from './cal-time-diff.service';

@Module({
  controllers: [CalTimeDiffController],
  providers: [CalTimeDiffService,LoadSettingLocalUtils]
})
export class CalTimeDiffModule {}
