export interface JwtPayload {
    userId: number;
    companyId: number;
    username: string;
    realName: string;
    role: string;
    customerId: number | null;
    platform: 'mp' | 'h5';
}
export declare const CurrentUser: (...dataOrPipes: (keyof JwtPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
