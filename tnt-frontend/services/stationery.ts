import { api } from './api';

export interface StationeryService {
  id: number;
  name: string;
  price_per_unit: number;
  unit: string;
}

export interface StationeryJob {
  id: number;
  service_name: string;
  vendor_name: string;
  quantity: number;
  amount: number | null;
  status: 'submitted' | 'in_progress' | 'ready' | 'collected';
  created_at: string;
  file_url: string;
  is_paid: boolean;
}

export interface JobDetails {
  id: number;
  service: {
    name: string;
    price_per_unit: number;
    unit: string;
  };
  vendor: {
    name: string;
    phone: string;
  };
  quantity: number;
  amount: number | null;
  status: string;
  created_at: string;
  file_url: string;
  is_paid: boolean;
}

export interface CreateJobRequest {
  service_id: number;
  quantity: number;
  file: File;
}

export const stationeryService = {
  // Get services for a vendor
  getVendorServices: async (vendorId: number): Promise<StationeryService[]> => {
    const response = await api.get(`/stationery/vendors/${vendorId}/services`);
    return response.data;
  },

  // Get user's jobs
  getUserJobs: async (): Promise<StationeryJob[]> => {
    const response = await api.get('/stationery/jobs');
    return response.data;
  },

  // Get job details
  getJobDetails: async (jobId: number): Promise<JobDetails> => {
    const response = await api.get(`/stationery/jobs/${jobId}`);
    return response.data;
  },

  // Create a new job
  createJob: async (data: CreateJobRequest): Promise<any> => {
    const formData = new FormData();
    formData.append('service_id', data.service_id.toString());
    formData.append('quantity', data.quantity.toString());
    formData.append('file', data.file);

    const response = await api.post('/stationery/jobs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update job status (for vendors)
  updateJobStatus: async (jobId: number, status: string): Promise<any> => {
    const response = await api.post(`/stationery/jobs/${jobId}/status`, { status });
    return response.data;
  },
};
