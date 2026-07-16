export declare class ColorSizeItemDto {
    color: string;
    colorCode?: string;
    size: string;
    quantity: number;
    rowColor?: string;
    sizeGroup?: string;
}
export declare class CreateOrderDto {
    orderNo: string;
    customerName: string;
    styleNo: string;
    styleName?: string;
    season?: string;
    category?: string;
    garmentImageUrl?: string;
    colorSizes: ColorSizeItemDto[];
    deliveryDate: string;
    factoryName?: string;
    coordinatorName?: string;
    coordinatorId?: number;
    merchandiserName?: string;
    merchandiserId?: number;
    remark?: string;
}
export declare class UpdateOrderDto {
    orderNo?: string;
    customerName?: string;
    styleNo?: string;
    styleName?: string;
    season?: string;
    category?: string;
    garmentImageUrl?: string;
    factoryName?: string;
    coordinatorName?: string;
    coordinatorId?: number;
    merchandiserName?: string;
    merchandiserId?: number;
    deliveryDate?: string;
    colorSizes?: ColorSizeItemDto[];
}
export declare class UpdateOrderStatusDto {
    orderStatus: string;
}
export declare class UpdateTaStageDto {
    status: string;
    completionPct?: number;
    plannedDate?: string;
    startDate?: string;
    actualDate?: string;
    remark?: string;
}
