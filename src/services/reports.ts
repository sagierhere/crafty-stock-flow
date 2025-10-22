import { api } from '@/lib/api';

export interface InventoryReportFilter {
  fromUtc: string;
  toUtc: string;
  productId?: string;
  supplierId?: string;
  customerId?: string;
}

export const reportsService = {
  getInventoryReport: (filter: InventoryReportFilter) => api.post('/Reports/inventory', filter),
};
