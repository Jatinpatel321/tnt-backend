import { api } from './api';

export interface Signal {
  type: 'rush_hour_warning' | 'slot_suggestion' | 'reorder_prompt';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  action?: string;
  data?: any;
}

export interface SignalsResponse {
  signals: Signal[];
}

export const signalsService = {
  // Get all signals for the current user
  getSignals: async (): Promise<SignalsResponse> => {
    const response = await api.get('/signals/');
    return response.data;
  },

  // Check rush hour warnings
  getRushHourSignals: async (): Promise<SignalsResponse> => {
    const response = await api.get('/signals/rush-hour');
    return response.data;
  },

  // Get slot suggestions
  getSlotSuggestions: async (): Promise<SignalsResponse> => {
    const response = await api.get('/signals/slot-suggestions');
    return response.data;
  },

  // Get reorder prompts
  getReorderPrompts: async (): Promise<SignalsResponse> => {
    const response = await api.get('/signals/reorder-prompts');
    return response.data;
  },
};
