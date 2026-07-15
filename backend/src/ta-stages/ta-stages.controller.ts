import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TaStagesService } from './ta-stages.service';

@ApiTags('T&A 进度')
@Controller('ta-stages')
export class TaStagesController {
  constructor(private taStagesService: TaStagesService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
