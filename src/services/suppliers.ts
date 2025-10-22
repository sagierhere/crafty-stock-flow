import { api } from '@/lib/api';

export interface Supplier {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export interface UpsertSupplierRequest {
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export const suppliersService = {
  getAll: () => api.get<Supplier[]>('/Suppliers'),
  getById: (id: string) => api.get<Supplier>(`/Suppliers/${id}`),
  create: (data: UpsertSupplierRequest) => api.post('/Suppliers', data),
  update: (id: string, data: UpsertSupplierRequest) => api.put(`/Suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/Suppliers/${id}`),
};
