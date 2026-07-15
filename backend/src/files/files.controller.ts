import {
  Controller,
  Post,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class UploadFileDto {
  @ApiProperty({ description: '文件类型' })
  @IsString()
  @IsNotEmpty()
  fileType: string;
}

/**
 * 文件上传控制器
 *
 * 双端上传差异说明:
 * - 小程序: uni.uploadFile() → multipart/form-data
 * - H5: <input type="file"> → multipart/form-data
 * - 两者格式一致，后端统一用 @UseInterceptors(FileInterceptor) 处理
 *
 * 生产环境应接入腾讯云COS直传:
 * 1. 前端调用 /files/cos-token 获取临时上传凭证
 * 2. 前端直接上传到COS，拿到 fileUrl
 * 3. 前端调用 /files/record 注册文件记录
 */
@ApiTags('文件 Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('files')
export class FilesController {
  constructor(private prisma: PrismaService) {}

  @Post(':orderId/upload')
  @Roles('admin', 'merchandiser')
  @ApiOperation({ summary: '上传订单文件（小程序/H5统一接口）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('orderId') orderId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new Error('文件不能为空');
    }

    // 生产环境: 上传到腾讯云COS，这里用临时URL模拟
    const fileUrl = `/uploads/${Date.now()}-${file.originalname}`;

    const record = await this.prisma.orderFile.create({
      data: {
        orderId: BigInt(orderId),
        fileName: file.originalname,
        fileUrl,
        fileType: dto.fileType,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: BigInt(user.userId),
      },
    });

    await this.prisma.operationLog.create({
      data: {
        orderId: BigInt(orderId),
        userId: BigInt(user.userId),
        userName: user.realName,
        userRole: user.role,
        module: 'file',
        action: 'create',
        targetId: record.id,
        changeSummary: `上传文件[${file.originalname}]（类型: ${dto.fileType}）`,
      },
    });

    return {
      id: Number(record.id),
      fileName: record.fileName,
      fileUrl: record.fileUrl,
      fileType: record.fileType,
    };
  }
}
