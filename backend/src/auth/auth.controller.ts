import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, WxLoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('认证 Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '多公司登录（公司代码+用户名+密码）' })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginWithPassword(dto);
  }

  @Post('register')
  @ApiOperation({ summary: '注册新公司' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerCompany(dto);
  }

  @Post('wx-login')
  @ApiOperation({ summary: '微信小程序登录（公司代码+code换token）' })
  async wxLogin(@Body() dto: WxLoginDto) {
    return this.authService.loginWithWechat(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getCurrentUser(user.userId, user.companyId);
  }
}
