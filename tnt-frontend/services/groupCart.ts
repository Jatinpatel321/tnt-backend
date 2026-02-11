import api from './api';

export interface Group {
  id: number;
  name: string;
  owner_id: number;
  status: string;
  created_at: string;
  members: GroupMember[];
  cart_items: GroupCartItem[];
  slot_lock?: GroupSlotLock;
}

export interface GroupMember {
  id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user: {
    id: number;
    phone: string;
    name?: string;
  };
}

export interface GroupCartItem {
  id: number;
  menu_item_id: number;
  owner_id: number;
  quantity: number;
  price_at_time: number;
  menu_item: {
    id: number;
    name: string;
    price: number;
    vendor_id: number;
  };
  owner: {
    id: number;
    phone: string;
    name?: string;
  };
}

export interface GroupSlotLock {
  id: number;
  slot_id: number;
  locked_until: string;
}

export interface PaymentSplit {
  id: number;
  user_id: number;
  split_type: 'equal' | 'amount' | 'percentage';
  amount?: number;
  percentage?: number;
}

export const groupCartService = {
  // Create a new group
  createGroup: async (name: string): Promise<Group> => {
    const response = await api.post('/groups/', { name });
    return response.data;
  },

  // Get group details
  getGroup: async (groupId: number): Promise<Group> => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  // Get user's groups
  getMyGroups: async (): Promise<Group[]> => {
    const response = await api.get('/groups/my-groups');
    return response.data;
  },

  // Invite a member
  inviteMember: async (groupId: number, phone: string): Promise<{ member_id: number }> => {
    const response = await api.post(`/groups/${groupId}/invite`, { phone });
    return response.data;
  },

  // Add item to cart
  addCartItem: async (groupId: number, menuItemId: number, quantity: number): Promise<{ cart_item_id: number }> => {
    const response = await api.post(`/groups/${groupId}/cart`, { menu_item_id: menuItemId, quantity });
    return response.data;
  },

  // Remove item from cart
  removeCartItem: async (groupId: number, itemId: number): Promise<void> => {
    await api.delete(`/groups/${groupId}/cart/${itemId}`);
  },

  // Lock a slot
  lockSlot: async (groupId: number, slotId: number, durationMinutes: number = 30): Promise<{ lock_id: number }> => {
    const response = await api.post(`/groups/${groupId}/slot/lock`, { slot_id: slotId, duration_minutes: durationMinutes });
    return response.data;
  },

  // Place group order
  placeGroupOrder: async (groupId: number): Promise<any> => {
    const response = await api.post(`/groups/${groupId}/order`);
    return response.data;
  },

  // Get payment splits
  getPaymentSplits: async (groupId: number): Promise<PaymentSplit[]> => {
    const response = await api.get(`/groups/${groupId}/payment-splits`);
    return response.data;
  },

  // Set payment split
  setPaymentSplit: async (
    groupId: number,
    splitType: 'equal' | 'amount' | 'percentage',
    amount?: number,
    percentage?: number
  ): Promise<{ split_id: number }> => {
    const response = await api.post(`/groups/${groupId}/payment-split`, {
      split_type: splitType,
      amount,
      percentage,
    });
    return response.data;
  },
};
