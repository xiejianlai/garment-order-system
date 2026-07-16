export declare class LoginDto {
    companyCode: string;
    username: string;
    password: string;
}
export declare class RegisterDto {
    companyName: string;
    companyCode: string;
    adminRealName: string;
    adminUsername: string;
    adminPassword: string;
    phone?: string;
}
export declare class WxLoginDto {
    code: string;
    companyCode: string;
}
