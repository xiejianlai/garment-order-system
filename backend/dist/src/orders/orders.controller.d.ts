import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto, UpdateTaStageDto } from './dto/create-order.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    create(dto: CreateOrderDto, user: JwtPayload): Promise<{
        id: number;
        companyId: number;
        orderNo: any;
        customerName: any;
        customerId: number;
        styleNo: any;
        styleName: any;
        season: any;
        category: any;
        totalQty: any;
        deliveryDate: any;
        factoryName: any;
        coordinatorId: number | null;
        coordinatorName: any;
        merchandiserId: number | null;
        merchandiserName: any;
        orderStatus: any;
        createdAt: any;
    }>;
    findAll(user: JwtPayload, page?: number, limit?: number, status?: string): Promise<{
        list: {
            id: number;
            companyId: number;
            orderNo: any;
            customerName: any;
            customerId: number;
            styleNo: any;
            styleName: any;
            season: any;
            category: any;
            totalQty: any;
            deliveryDate: any;
            factoryName: any;
            coordinatorId: number | null;
            coordinatorName: any;
            merchandiserId: number | null;
            merchandiserName: any;
            orderStatus: any;
            createdAt: any;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getOptions(user: JwtPayload): Promise<{
        customers: {
            id: number;
            code: string;
            name: string;
        }[];
        factories: {
            id: number;
            code: string;
            name: string;
            type: string;
        }[];
        coordinators: {
            id: number;
            name: string;
        }[];
        merchandisers: {
            id: number;
            name: string;
        }[];
    }>;
    findOne(id: string, user: JwtPayload): Promise<{
        garmentImageUrl: any;
        coordinatorRegistered: boolean;
        merchandiserRegistered: boolean;
        colorSizes: any;
        fabrics: any;
        trims: any;
        taStages: any;
        logs: any;
        id: number;
        companyId: number;
        orderNo: any;
        customerName: any;
        customerId: number;
        styleNo: any;
        styleName: any;
        season: any;
        category: any;
        totalQty: any;
        deliveryDate: any;
        factoryName: any;
        coordinatorId: number | null;
        coordinatorName: any;
        merchandiserId: number | null;
        merchandiserName: any;
        orderStatus: any;
        createdAt: any;
    }>;
    update(id: string, dto: UpdateOrderDto, user: JwtPayload): Promise<{
        updated: boolean;
        changes: string[];
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto, user: JwtPayload): Promise<{
        updated: boolean;
    }>;
    updateTaStage(id: string, stageCode: string, dto: UpdateTaStageDto, user: JwtPayload): Promise<{
        updated: boolean;
        changes: string[];
    }>;
}
