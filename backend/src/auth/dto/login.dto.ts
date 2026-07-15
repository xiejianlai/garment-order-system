import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '公司代码不能为空' })
  companyCode: string;

  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6位' })
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: '公司名称不能为空' })
  companyName: string;

  @IsString()
  @IsNotEmpty({ message: '公司代码不能为空' })
  companyCode: string;

  @IsString()
  @IsNotEmpty({ message: '管理员姓名不能为空' })
  adminRealName: string;

  @IsString()
  @IsNotEmpty({ message: '管理员账号不能为空' })
  adminUsername: string;

  @IsString()
  @IsNotEmpty({ message: '管理员密码不能为空' })
  @MinLength(6, { message: '密码至少6位' })
  adminPassword: string;

  @IsString()
  phone?: string;
}

export class WxLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  companyCode: string;
}
