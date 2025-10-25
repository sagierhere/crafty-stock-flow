import { api } from '@/lib/api';

export interface SupplyRecordRequest {
  supplierId: string;
  productId: string;
  quantityReceived: number;
  referenceNumber?: string;
  notes?: string;
}

export interface SupplyRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantityReceived: number;
  receivedDateUtc: string;
  referenceNumber: string;
  notes: string;
}

export const inventoryService = {
  recordSupply: (data: SupplyRecordRequest) =>
    api.post<SupplyRecord>('/Inventory/supply', {
      ...data,
      referenceNumber: data.referenceNumber ?? '',
      notes: data.notes ?? '',
    }),
  getHistory: (productId: string) => api.get<SupplyRecord[]>(`/Inventory/history/${productId}`),
};
