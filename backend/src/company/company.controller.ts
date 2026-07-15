import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { CompanyService } from './company.service';
import { AddMemberDto, UpdateMemberDto, QuickRegisterDto } from './dto/company.dto';

@ApiTags('公司/团队 Company')
@Controller('company')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get('info')
  @ApiOperation({ summary: '获取公司信息+团队成员+待注册成员' })
  async getCompanyInfo(@CurrentUser() user: JwtPayload) {
    return this.companyService.getCompanyInfo(user.companyId);
  }

  @Post('members')
  @ApiOperation({ summary: '添加团队成员（管理员）' })
  async addMember(@CurrentUser() user: JwtPayload, @Body() dto: AddMemberDto) {
    return this.companyService.addMember(user.companyId, user.userId, dto);
  }

  @Post('members/quick-register')
  @ApiOperation({ summary: '快速注册待注册成员（管理员）' })
  async quickRegister(@CurrentUser() user: JwtPayload, @Body() dto: QuickRegisterDto) {
    return this.companyService.quickRegister(user.companyId, user.userId, dto);
  }

  @Put('members/:id')
  @ApiOperation({ summary: '更新成员信息（管理员）' })
  async updateMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.companyService.updateMember(user.companyId, user.userId, Number(memberId), dto);
  }

  @Delete('members/:id')
  @ApiOperation({ summary: '删除成员（管理员）' })
  async deleteMember(@CurrentUser() user: JwtPayload, @Param('id') memberId: string) {
    return this.companyService.deleteMember(user.companyId, user.userId, Number(memberId));
  }
}
