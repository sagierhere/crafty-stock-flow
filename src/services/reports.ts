import { api } from '@/lib/api';
import type { Product } from '@/services/products';

export interface InventoryReportFilter {
  fromUtc?: string | null;
  toUtc?: string | null;
  productId?: string | null;
  supplierId?: string | null;
  customerId?: string | null;
}

export enum TransactionType {
  Sale = 1,
  Restock = 2,
  Adjustment = 3,
  Return = 4,
}

export interface TransactionSummary {
  transactionId: string;
  productName: string;
  type: TransactionType;
  quantity: number;
  totalAmount: number;
  occurredAtUtc: string;
}

export interface CustomerPurchaseSummary {
  customerId: string;
  customerName: string;
  totalSpent: number;
  ordersCount: number;
}

export interface InventoryReport {
  generatedAtUtc: string;
  lowStockProducts: Product[];
  recentTransactions: TransactionSummary[];
  topCustomers: CustomerPurchaseSummary[];
}

export const reportsService = {
  getInventoryReport: (filter: InventoryReportFilter) => api.post<InventoryReport>('/Reports/inventory', filter),
};
