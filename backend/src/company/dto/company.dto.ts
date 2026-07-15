import { IsString, IsNotEmpty, IsOptional, MinLength, IsEnum } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  realName: string;

  @IsString()
  @IsNotEmpty({ message: '登录账号不能为空' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6位' })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['admin', 'coordinator', 'merchandiser', 'customer'], { message: '角色必须是 admin/coordinator/merchandiser/customer' })
  role: string;
}

export class UpdateMemberDto {
  @IsString()
  @IsNotEmpty()
  realName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['admin', 'coordinator', 'merchandiser', 'customer'])
  role: string;

  @IsEnum(['active', 'disabled'])
  status: string;
}

export class QuickRegisterDto {
  @IsString()
  @IsNotEmpty()
  realName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['coordinator', 'merchandiser'])
  role: string;
}
