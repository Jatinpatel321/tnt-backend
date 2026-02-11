import { create } from 'zustand';
import { Group, GroupMember, GroupCartItem, PaymentSplit } from '../services/groupCart';

interface GroupCartState {
  groups: Group[];
  currentGroup: Group | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<Group>;
  setCurrentGroup: (group: Group | null) => void;
  fetchGroupDetails: (groupId: number) => Promise<void>;
  inviteMember: (groupId: number, phone: string) => Promise<void>;
  addCartItem: (groupId: number, menuItemId: number, quantity: number) => Promise<void>;
  removeCartItem: (groupId: number, itemId: number) => Promise<void>;
  lockSlot: (groupId: number, slotId: number, durationMinutes?: number) => Promise<void>;
  setPaymentSplit: (groupId: number, splitType: 'equal' | 'amount' | 'percentage', amount?: number, percentage?: number) => Promise<void>;
  placeGroupOrder: (groupId: number) => Promise<any>;
  clearError: () => void;
}

export const useGroupCartStore = create<GroupCartState>((set, get) => ({
  groups: [],
  currentGroup: null,
  loading: false,
  error: null,

  fetchGroups: async () => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      const groups = await groupCartService.getMyGroups();
      set({ groups, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch groups', loading: false });
    }
  },

  createGroup: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      const group = await groupCartService.createGroup(name);
      const { groups } = get();
      set({ groups: [...groups, group], loading: false });
      return group;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create group', loading: false });
      throw error;
    }
  },

  setCurrentGroup: (group) => set({ currentGroup: group }),

  fetchGroupDetails: async (groupId: number) => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      const group = await groupCartService.getGroup(groupId);
      set({ currentGroup: group, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch group details', loading: false });
    }
  },

  inviteMember: async (groupId: number, phone: string) => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      await groupCartService.inviteMember(groupId, phone);
      // Refresh group details
      await get().fetchGroupDetails(groupId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to invite member', loading: false });
    }
  },

  addCartItem: async (groupId: number, menuItemId: number, quantity: number) => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      await groupCartService.addCartItem(groupId, menuItemId, quantity);
      // Refresh group details
      await get().fetchGroupDetails(groupId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to add item to cart', loading: false });
    }
  },

  removeCartItem: async (groupId: number, itemId: number) => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      await groupCartService.removeCartItem(groupId, itemId);
      // Refresh group details
      await get().fetchGroupDetails(groupId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to remove item from cart', loading: false });
    }
  },

  lockSlot: async (groupId: number, slotId: number, durationMinutes = 30) => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      await groupCartService.lockSlot(groupId, slotId, durationMinutes);
      // Refresh group details
      await get().fetchGroupDetails(groupId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to lock slot', loading: false });
    }
  },

  setPaymentSplit: async (groupId: number, splitType: 'equal' | 'amount' | 'percentage', amount?: number, percentage?: number) => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      await groupCartService.setPaymentSplit(groupId, splitType, amount, percentage);
      // Refresh group details
      await get().fetchGroupDetails(groupId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to set payment split', loading: false });
    }
  },

  placeGroupOrder: async (groupId: number) => {
    set({ loading: true, error: null });
    try {
      const { groupCartService } = await import('../services/groupCart');
      const result = await groupCartService.placeGroupOrder(groupId);
      set({ loading: false });
      return result;
    } catch (error: any) {
      set({ error: error.message || 'Failed to place group order', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
