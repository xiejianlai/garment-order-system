import { TaStagesService } from './ta-stages.service';
export declare class TaStagesController {
    private taStagesService;
    constructor(taStagesService: TaStagesService);
    health(): {
        status: string;
    };
}
