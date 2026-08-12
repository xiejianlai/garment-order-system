import { JwtPayload } from '../common/decorators/current-user.decorator';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
export declare class TeamsController {
    private teamsService;
    constructor(teamsService: TeamsService);
    list(user: JwtPayload): Promise<{
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
    create(user: JwtPayload, dto: CreateTeamDto): Promise<{
        id: number;
        name: string;
        remark: string | null;
    }>;
    update(user: JwtPayload, teamId: string, dto: UpdateTeamDto): Promise<{
        id: number;
        name: string;
        remark: string | null;
    }>;
    remove(user: JwtPayload, teamId: string): Promise<{
        deleted: boolean;
        name: string;
    }>;
}
