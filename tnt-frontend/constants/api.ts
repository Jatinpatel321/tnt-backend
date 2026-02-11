// API Constants
// Backend API endpoints and configuration

export const API_BASE_URL = 'http://localhost:8000'; // Update for production

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
  },
  MENU: {
    GET_ITEMS: '/menu/items',
    GET_CATEGORIES: '/menu/categories',
  },
  ORDERS: {
    CREATE: '/orders',
    GET_USER_ORDERS: '/orders/user',
    GET_ORDER_DETAILS: '/orders/{id}',
  },
  STATIONERY: {
    UPLOAD_JOB: '/stationery/jobs',
    GET_JOBS: '/stationery/jobs',
    GET_JOB_STATUS: '/stationery/jobs/{id}',
  },
  PAYMENTS: {
    CREATE_ORDER: '/payments/create-order',
    VERIFY_PAYMENT: '/payments/verify',
  },
};
