import { api } from './api';

export interface Vendor {
  id: number;
  phone: string;
  name?: string;
  is_approved: boolean;
  created_at: string;
}

export interface User {
  id: number;
  phone: string;
  name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  vendor_id: number;
  status: string;
  total_amount: number;
  created_at: string;
}

export interface LedgerEntry {
  id: number;
  user_id: number;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

export const adminService = {
  // Vendor management
  getVendors: async (): Promise<Vendor[]> => {
    const response = await api.get('/admin/vendors');
    return response.data;
  },

  approveVendor: async (vendorId: number): Promise<{ message: string }> => {
    const response = await api.post(`/admin/vendors/${vendorId}/approve`);
    return response.data;
  },

  // User management
  toggleUser: async (userId: number): Promise<{ user_id: number; is_active: boolean }> => {
    const response = await api.post(`/admin/users/${userId}/toggle`);
    return response.data;
  },

  // Order overview
  getAllOrders: async (): Promise<Order[]> => {
    const response = await api.get('/admin/orders');
    return response.data;
  },

  // Ledger view
  getLedger: async (): Promise<LedgerEntry[]> => {
    const response = await api.get('/admin/ledger');
    return response.data;
  },
};
