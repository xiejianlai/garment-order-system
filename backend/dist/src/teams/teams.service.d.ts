import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
export declare class TeamsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    listTeams(companyId: number): Promise<{
        id: number;
        name: string;
        remark: string | null;
        status: string;
        memberCount: number;
        members: {
            id: number;
            realName: string;
            role: string;
        }[];
        createdAt: string;
    }[]>;
    createTeam(companyId: number, adminId: number, dto: CreateTeamDto): Promise<{
        id: number;
        name: string;
        remark: string | null;
    }>;
    updateTeam(companyId: number, adminId: number, teamId: number, dto: UpdateTeamDto): Promise<{
        id: number;
        name: string;
        remark: string | null;
    }>;
    deleteTeam(companyId: number, adminId: number, teamId: number): Promise<{
        deleted: boolean;
        name: string;
    }>;
    private assertAdmin;
}
