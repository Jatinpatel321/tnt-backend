import { api } from './api';
import { API_ENDPOINTS } from '../constants';

// Type definitions for auth responses
export interface SendOTPResponse {
  message: string;
}

export interface VerifyOTPResponse {
  access_token: string;
  token_type: string;
  is_new_user: boolean;
  role: 'student' | 'vendor' | 'admin';
}

// Authentication service using centralized API instance
export const authService = {
  /**
   * Send OTP to phone number
   * @param phone - Phone number string
   * @returns Promise<SendOTPResponse>
   */
  sendOTP: async (phone: string): Promise<SendOTPResponse> => {
    const response = await api.post<SendOTPResponse>(API_ENDPOINTS.AUTH.SEND_OTP, {
      phone,
    });
    return response.data;
  },

  /**
   * Verify OTP and return authentication data
   * @param phone - Phone number string
   * @param otp - OTP string
   * @returns Promise<VerifyOTPResponse>
   */
  verifyOTP: async (phone: string, otp: string): Promise<VerifyOTPResponse> => {
    const response = await api.post<VerifyOTPResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      phone,
      otp,
    });
    return response.data;
  },
};
