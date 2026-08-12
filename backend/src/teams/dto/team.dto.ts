import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty({ message: '团队名称不能为空' })
  @MaxLength(50, { message: '团队名称最多50字' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: '备注最多200字' })
  remark?: string;
}

export class UpdateTeamDto {
  @IsString()
  @IsNotEmpty({ message: '团队名称不能为空' })
  @MaxLength(50, { message: '团队名称最多50字' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: '备注最多200字' })
  remark?: string;
}
