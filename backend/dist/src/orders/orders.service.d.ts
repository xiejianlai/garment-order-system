import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto, UpdateTaStageDto } from './dto/create-order.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class OrdersService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createOrder(dto: CreateOrderDto, user: JwtPayload): Promise<{
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
    getOrderList(user: JwtPayload, status?: string, page?: number, limit?: number): Promise<{
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
    getOrderDetail(orderId: number, user: JwtPayload): Promise<{
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
    updateOrder(orderId: number, dto: UpdateOrderDto, user: JwtPayload): Promise<{
        updated: boolean;
        changes: string[];
    }>;
    updateOrderStatus(orderId: number, dto: UpdateOrderStatusDto, user: JwtPayload): Promise<{
        updated: boolean;
    }>;
    updateTaStage(orderId: number, stageCode: string, dto: UpdateTaStageDto, user: JwtPayload): Promise<{
        updated: boolean;
        changes: string[];
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
    private serializeOrder;
    private serializeOrderDetail;
}
