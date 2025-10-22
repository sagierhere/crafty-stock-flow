import { api } from '@/lib/api';

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  loyaltyTier: string;
}

export interface UpsertCustomerRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  loyaltyTier: string;
}

export const customersService = {
  getAll: () => api.get<Customer[]>('/Customers'),
  getById: (id: string) => api.get<Customer>(`/Customers/${id}`),
  create: (data: UpsertCustomerRequest) => api.post('/Customers', data),
  update: (id: string, data: UpsertCustomerRequest) => api.put(`/Customers/${id}`, data),
  delete: (id: string) => api.delete(`/Customers/${id}`),
};
