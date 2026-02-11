import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  isVeg: boolean;
}

export interface CartState {
  vendorId: string | null;
  vendorName: string | null;
  items: CartItem[];
  selectedSlot: string | null;
  slotTime: string | null;
  totalAmount: number;
}

export interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setSlot: (slotId: string, slotTime: string) => void;
  clearCart: () => void;
  setVendor: (vendorId: string, vendorName: string) => void;
  getItemCount: () => number;
  getTotalAmount: () => number;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      vendorId: null,
      vendorName: null,
      items: [],
      selectedSlot: null,
      slotTime: null,
      totalAmount: 0,

      // Actions
      addItem: (item) => {
        const { items, vendorId } = get();

        // If cart has items from different vendor, clear cart first
        if (vendorId && vendorId !== item.id.split('-')[0]) {
          get().clearCart();
        }

        const existingItem = items.find(i => i.id === item.id);

        if (existingItem) {
          // Update quantity
          set(state => ({
            items: state.items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            totalAmount: state.totalAmount + item.price
          }));
        } else {
          // Add new item
          set(state => ({
            items: [...state.items, { ...item, quantity: 1 }],
            totalAmount: state.totalAmount + item.price,
            vendorId: item.id.split('-')[0], // Extract vendor ID from item ID
          }));
        }
      },

      removeItem: (itemId) => {
        const { items } = get();
        const item = items.find(i => i.id === itemId);

        if (item) {
          if (item.quantity > 1) {
            // Decrease quantity
            set(state => ({
              items: state.items.map(i =>
                i.id === itemId
                  ? { ...i, quantity: i.quantity - 1 }
                  : i
              ),
              totalAmount: state.totalAmount - item.price
            }));
          } else {
            // Remove item completely
            set(state => ({
              items: state.items.filter(i => i.id !== itemId),
              totalAmount: state.totalAmount - item.price
            }));
          }
        }
      },

      updateQuantity: (itemId, quantity) => {
        const { items } = get();
        const item = items.find(i => i.id === itemId);

        if (item && quantity > 0) {
          const quantityDiff = quantity - item.quantity;
          set(state => ({
            items: state.items.map(i =>
              i.id === itemId
                ? { ...i, quantity }
                : i
            ),
            totalAmount: state.totalAmount + (quantityDiff * item.price)
          }));
        } else if (item && quantity === 0) {
          get().removeItem(itemId);
        }
      },

      setSlot: (slotId, slotTime) => {
        set({ selectedSlot: slotId, slotTime });
      },

      clearCart: () => {
        set({
          vendorId: null,
          vendorName: null,
          items: [],
          selectedSlot: null,
          slotTime: null,
          totalAmount: 0
        });
      },

      setVendor: (vendorId, vendorName) => {
        // Only set if cart is empty or same vendor
        const { vendorId: currentVendorId, items } = get();
        if (items.length === 0 || currentVendorId === vendorId) {
          set({ vendorId, vendorName });
        }
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalAmount: () => {
        return get().totalAmount;
      }
    }),
    {
      name: 'cart-storage',
      // Only persist essential data, not computed values
      partialize: (state) => ({
        vendorId: state.vendorId,
        vendorName: state.vendorName,
        items: state.items,
        selectedSlot: state.selectedSlot,
        slotTime: state.slotTime,
        totalAmount: state.totalAmount
      })
    }
  )
);
