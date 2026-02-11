import { api } from './api';

export interface Vendor {
  id: number;
  name: string;
  description?: string;
  vendor_type: 'food' | 'stationery';
  is_approved: boolean;
  phone: string;
  university_id?: string;
  created_at: string;
  // Additional fields for food vendors
  logo_url?: string;
  banner_url?: string;
  is_open?: boolean;
}

export interface MenuItem {
  id: string;
  vendor_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_veg: boolean;
  created_at: string;
}

export interface Slot {
  id: string;
  vendor_id: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_orders: number;
  current_orders: number;
  // 🆕 Slot Intelligence fields
  faculty_priority?: boolean;
  congestion_metric?: number; // 0.0-1.0
  combined_slot_id?: string;
}

export const vendorsService = {
  // Get all vendors by type
  getVendors: async (type: 'food' | 'stationery' = 'food'): Promise<Vendor[]> => {
    const response = await api.get(`/vendors?type=${type}`);
    return response.data;
  },

  // Get vendor menu
  getVendorMenu: async (vendorId: string): Promise<MenuItem[]> => {
    const response = await api.get(`/vendors/${vendorId}/menu`);
    return response.data;
  },

  // Get vendor slots
  getVendorSlots: async (vendorId: string): Promise<Slot[]> => {
    const response = await api.get(`/vendors/${vendorId}/slots`);
    return response.data;
  },

  // Get single vendor details
  getVendor: async (vendorId: string): Promise<Vendor> => {
    const response = await api.get(`/vendors/${vendorId}`);
    return response.data;
  }
};
