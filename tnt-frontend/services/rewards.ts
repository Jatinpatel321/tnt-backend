import { api } from './api';

export interface RewardTransaction {
  id: number;
  reward_type: string;
  points: number;
  description: string;
  created_at: string;
}

export interface RewardRedemption {
  id: number;
  redemption_type: string;
  points_used: number;
  value: number;
  description: string;
  created_at: string;
}

export interface UserPoints {
  current_points: number;
  total_earned: number;
  total_redeemed: number;
  recent_transactions: RewardTransaction[];
  recent_redemptions: RewardRedemption[];
}

export interface RedemptionRule {
  id: number;
  redemption_type: string;
  min_points: number;
  max_discount_percentage?: number;
  max_discount_amount?: number;
}

export interface RedeemPointsRequest {
  redemption_type: 'discount_percentage' | 'discount_fixed' | 'free_item';
  points_used: number;
  value: number;
  order_id?: number;
}

export const rewardsService = {
  // Get user's current points and history
  getUserPoints: async (): Promise<UserPoints> => {
    const response = await api.get('/rewards/points');
    return response.data;
  },

  // Get available redemption options
  getAvailableRedemptions: async (): Promise<RedemptionRule[]> => {
    const response = await api.get('/rewards/redemptions');
    return response.data;
  },

  // Redeem points for discount/benefit
  redeemPoints: async (data: RedeemPointsRequest): Promise<{ message: string; redemption_id: number }> => {
    const response = await api.post('/rewards/redeem', data);
    return response.data;
  },

  // Initialize reward rules (admin only)
  initializeRules: async (): Promise<{ message: string }> => {
    const response = await api.post('/rewards/initialize-rules');
    return response.data;
  },
};
