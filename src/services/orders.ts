import { api } from '@/lib/api';

export interface Order {
  id: string;
  customerId: string;
  createdAt: string;
  status: string;
  lines: OrderLine[];
}

export interface OrderLine {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  customerId: string;
  lines: OrderLine[];
}

export const ordersService = {
  getAll: (limit: number = 25) => api.get<Order[]>(`/Orders?limit=${limit}`),
  getById: (id: string) => api.get<Order>(`/Orders/${id}`),
  create: (data: CreateOrderRequest) => api.post('/Orders', data),
  cancel: (id: string) => api.post(`/Orders/${id}/cancel`, {}),
};
