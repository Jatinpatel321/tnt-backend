import { api } from './api';

export interface OrderItem {
  menu_item_id: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  vendor_id: string;
  items: OrderItem[];
  slot_id: string;
  amount: number;
}

export interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  vendor_name: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  slot_id: string;
  slot_time: string;
  amount: number;
  status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
  estimated_ready_at?: string; // 🆕 ETA for order completion
  is_delayed?: boolean; // 🆕 Delay status
  delay_minutes?: number; // 🆕 Delay duration
}

export interface ReorderResponse {
  order_id: number;
  status: string;
  total_amount: number;
  estimated_ready_at: string;
  slot_time: string;
}

export interface OrderETA {
  order_id: number;
  status: string;
  estimated_ready_at: string;
  is_delayed: boolean;
  delay_minutes: number;
}

export const ordersService = {
  // Create new order
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Get user's orders
  getUserOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Get single order
  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Cancel order (if allowed)
  cancelOrder: async (orderId: string): Promise<Order> => {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // 🆕 Reorder from completed order
  reorderOrder: async (orderId: string): Promise<ReorderResponse> => {
    const response = await api.post(`/orders/${orderId}/reorder`);
    return response.data;
  },

  // 🆕 Get order ETA
  getOrderETA: async (orderId: string): Promise<OrderETA> => {
    const response = await api.get(`/orders/${orderId}/eta`);
    return response.data;
  }
};
