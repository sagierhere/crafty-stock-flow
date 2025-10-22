import { api } from '@/lib/api';

export interface SupplyRecordRequest {
  supplierId: string;
  productId: string;
  quantityReceived: number;
  referenceNumber: string;
  notes: string;
}

export interface InventoryHistory {
  id: string;
  productId: string;
  quantity: number;
  type: string;
  createdAt: string;
}

export const inventoryService = {
  recordSupply: (data: SupplyRecordRequest) => api.post('/Inventory/supply', data),
  getHistory: (productId: string) => api.get<InventoryHistory[]>(`/Inventory/history/${productId}`),
};
