import { Module } from '@nestjs/common';
import { TaStagesService } from './ta-stages.service';
import { TaStagesController } from './ta-stages.controller';

@Module({
  controllers: [TaStagesController],
  providers: [TaStagesService],
})
export class TaStagesModule {}
