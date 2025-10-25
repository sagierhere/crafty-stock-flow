import { api } from '@/lib/api';
import { Roles } from '@/constants/roles';

export interface CreateUserRequest {
  userName: string;
  email: string;
  password: string;
  fullName: string;
  role: typeof Roles.InventoryManager | typeof Roles.Cashier;
}

export interface UserSummary {
  id: string;
  userName: string;
  email: string;
  fullName?: string;
  roles: string[];
}

export interface UserActivity {
  id: string;
  activityType: string;
  description: string;
  occurredAtUtc: string;
}

export interface UserDetail extends UserSummary {
  isLockedOut: boolean;
  lockoutEndUtc?: string | null;
  phoneNumber?: string | null;
  recentActivities: UserActivity[];
}

export interface UpdateUserRequest {
  email: string;
  fullName?: string | null;
  role: typeof Roles.InventoryManager | typeof Roles.Cashier;
}

function validateRole(role: string) {
  if (role !== Roles.InventoryManager && role !== Roles.Cashier) {
    throw new Error('Only InventoryManager and Cashier roles are supported.');
  }
}

export const userManagementService = {
  async createUser(payload: CreateUserRequest) {
    validateRole(payload.role);
    return api.post<UserSummary>('/admin/users', payload);
  },

  getManagers() {
    return api.get<UserSummary[]>('/admin/users/managers');
  },

  getCashiers() {
    return api.get<UserSummary[]>('/admin/users/cashiers');
  },

  getUserDetails(userId: string) {
    return api.get<UserDetail>(`/admin/users/${userId}`);
  },

  async updateUser(userId: string, payload: UpdateUserRequest) {
    validateRole(payload.role);
    return api.put<UserSummary>(`/admin/users/${userId}`, payload);
  },

  async setUserLockout(userId: string, lockout: boolean) {
    return api.put<void>(`/admin/users/${userId}/lockout`, { lockout });
  },

  async deleteUser(userId: string) {
    return api.delete<void>(`/admin/users/${userId}`);
  },
};
