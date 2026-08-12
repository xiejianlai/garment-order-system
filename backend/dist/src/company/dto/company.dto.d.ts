export declare class AddMemberDto {
    realName: string;
    username: string;
    password: string;
    phone?: string;
    role: string;
    teamId?: number;
}
export declare class UpdateMemberDto {
    realName: string;
    username: string;
    password?: string;
    phone?: string;
    role: string;
    status: string;
    teamId?: number;
}
export declare class QuickRegisterDto {
    realName: string;
    username: string;
    password: string;
    phone?: string;
    role: string;
    teamId?: number;
}
export declare class ExtendTrialDto {
    days: number;
}
