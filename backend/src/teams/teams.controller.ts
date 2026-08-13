import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';

@ApiTags('团队 Teams')
@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '团队列表（公司内，仅管理员）' })
  async list(@CurrentUser() user: JwtPayload) {
    return this.teamsService.listTeams(user.companyId);
  }

  @Post()
  @ApiOperation({ summary: '创建团队（管理员）' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(user.companyId, user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新团队（管理员）' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(user.companyId, user.userId, Number(teamId), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除团队（管理员，有成员时禁止删除）' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') teamId: string) {
    return this.teamsService.deleteTeam(user.companyId, user.userId, Number(teamId));
  }
}
