import { api } from '@/lib/api';
import type { Product } from './products';
import type { UserActivity } from './userManagement';

export interface DashboardOrderSummary {
  id: string;
  customerName: string;
  orderedAtUtc: string;
  totalAmount: number;
}

export interface AdminDashboardSummary {
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  totalOrders: number;
  totalInventoryValue: number;
  recentOrders: DashboardOrderSummary[];
  recentUserActivities: UserActivity[];
  lowStockProducts: Product[];
}

export const dashboardService = {
  getAdminSummary: () => api.get<AdminDashboardSummary>('/admin/dashboard'),
};
