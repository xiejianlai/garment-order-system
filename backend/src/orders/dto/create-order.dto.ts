import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ColorSizeItemDto {
  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsOptional()
  colorCode?: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  rowColor?: string;

  @IsString()
  @IsOptional()
  sizeGroup?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: '订单号不能为空' })
  orderNo: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: '款号不能为空' })
  styleNo: string;

  @IsString()
  @IsOptional()
  styleName?: string;

  @IsString()
  @IsOptional()
  season?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  garmentImageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorSizeItemDto)
  colorSizes: ColorSizeItemDto[];

  @IsDateString()
  deliveryDate: string;

  @IsString()
  @IsOptional()
  factoryName?: string;

  // 自由输入理单名字 + 可选关联已注册用户ID
  @IsString()
  @IsOptional()
  coordinatorName?: string;

  @IsInt()
  @IsOptional()
  coordinatorId?: number;

  // 自由输入跟单名字 + 可选关联已注册用户ID
  @IsString()
  @IsOptional()
  merchandiserName?: string;

  @IsInt()
  @IsOptional()
  merchandiserId?: number;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  orderNo?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  styleNo?: string;

  @IsString()
  @IsOptional()
  styleName?: string;

  @IsString()
  @IsOptional()
  season?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  garmentImageUrl?: string;

  @IsString()
  @IsOptional()
  factoryName?: string;

  @IsString()
  @IsOptional()
  coordinatorName?: string;

  @IsInt()
  @IsOptional()
  coordinatorId?: number;

  @IsString()
  @IsOptional()
  merchandiserName?: string;

  @IsInt()
  @IsOptional()
  merchandiserId?: number;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorSizeItemDto)
  @IsOptional()
  colorSizes?: ColorSizeItemDto[];
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  orderStatus: string;
}

export class UpdateTaStageDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsInt()
  @IsOptional()
  completionPct?: number;

  @IsDateString()
  @IsOptional()
  plannedDate?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  actualDate?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
