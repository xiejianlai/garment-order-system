import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
declare class UploadFileDto {
    fileType: string;
}
export declare class FilesController {
    private prisma;
    constructor(prisma: PrismaService);
    uploadFile(orderId: number, file: Express.Multer.File, dto: UploadFileDto, user: JwtPayload): Promise<{
        id: number;
        fileName: string;
        fileUrl: string;
        fileType: string;
    }>;
}
export {};
