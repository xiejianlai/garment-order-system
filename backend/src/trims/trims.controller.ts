import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrimsService, CreateTrimDto, UpdateTrimStatusDto } from './trims.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('辅料 Trims')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trims')
export class TrimsController {
  constructor(private trimsService: TrimsService) {}

  @Post(':orderId')
  @Roles('admin', 'merchandiser')
  @ApiOperation({ summary: '为订单添加辅料' })
  async addTrim(
    @Param('orderId') orderId: number,
    @Body() dto: CreateTrimDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.trimsService.addTrim(orderId, dto, user);
  }

  @Patch(':trimId/status')
  @Roles('admin', 'merchandiser')
  @ApiOperation({ summary: '更新辅料进度（自动判定齐套）' })
  async updateStatus(
    @Param('trimId') trimId: number,
    @Body() dto: UpdateTrimStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.trimsService.updateTrimStatus(trimId, dto, user);
  }

  @Get('check/:orderId')
  @ApiOperation({ summary: '一键查看辅料齐套状态' })
  async checkReady(@Param('orderId') orderId: number) {
    return this.trimsService.checkTrimsReady(orderId);
  }
}
