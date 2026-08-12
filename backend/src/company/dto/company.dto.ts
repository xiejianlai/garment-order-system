import { IsString, IsNotEmpty, IsOptional, MinLength, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  teamId?: number;
}

export class UpdateMemberDto {
  @IsString()
  @IsNotEmpty()
  realName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['admin', 'coordinator', 'merchandiser', 'customer'])
  role: string;

  @IsEnum(['active', 'disabled'])
  status: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  teamId?: number;
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

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  teamId?: number;
}

export class ExtendTrialDto {
  @IsInt()
  @IsNotEmpty({ message: '续期天数不能为空' })
  @Min(1, { message: '续期天数至少1天' })
  @Type(() => Number)
  days: number;
}
