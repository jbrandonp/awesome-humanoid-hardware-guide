export interface InventoryAlertEvent {
    itemId: string;
    itemName: string;
    estimatedDepletionDate: Date;
    confidenceScore: number;
}
export interface DailyConsumption {
    date: string;
    quantity: number;
}
export interface TrainingWorkerData {
    itemId: string;
    itemName: string;
    currentStock: number;
    criticalThreshold: number;
    consumptionHistory: DailyConsumption[];
}
export interface PredictionResult {
    itemId: string;
    predictedConsumption30Days: number;
    mse: number;
    success: boolean;
    error?: string;
}
//# sourceMappingURL=inventory-predictor.interfaces.d.ts.map