import { Module } from '@nestjs/common';
import { TrimsService } from './trims.service';
import { TrimsController } from './trims.controller';

@Module({
  controllers: [TrimsController],
  providers: [TrimsService],
})
export class TrimsModule {}
