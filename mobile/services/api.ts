import { supabase } from './supabase';
import type { Bucket, Deposit, SplitPlan, SplitPlanPreview, User } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Users
export async function getCurrentUser(): Promise<User> {
  return request<User>('/users/me');
}

export async function updateUser(data: Partial<User>): Promise<User> {
  return request<User>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Buckets
export async function getBuckets(): Promise<Bucket[]> {
  return request<Bucket[]>('/buckets');
}

export async function createBucket(data: {
  name: string;
  emoji?: string;
  color?: string;
  bucket_type: 'percentage' | 'fixed';
  allocation_value: number;
  target_amount?: number;
}): Promise<Bucket> {
  return request<Bucket>('/buckets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBucket(id: string, data: Partial<Bucket>): Promise<Bucket> {
  return request<Bucket>(`/buckets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteBucket(id: string): Promise<void> {
  return request<void>(`/buckets/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderBuckets(bucket_ids: string[]): Promise<Bucket[]> {
  return request<Bucket[]>('/buckets/reorder', {
    method: 'POST',
    body: JSON.stringify({ bucket_ids }),
  });
}

// Deposits
export async function getDeposits(limit = 50, offset = 0): Promise<Deposit[]> {
  return request<Deposit[]>(`/deposits?limit=${limit}&offset=${offset}`);
}

export async function getPendingDeposits(): Promise<Deposit[]> {
  return request<Deposit[]>('/deposits/pending');
}

export async function getDeposit(id: string): Promise<Deposit> {
  return request<Deposit>(`/deposits/${id}`);
}

// Split Plans
export async function previewSplitPlan(deposit_id: string): Promise<SplitPlanPreview> {
  return request<SplitPlanPreview>(`/split-plans/preview/${deposit_id}`);
}

export async function createSplitPlan(data: {
  deposit_id: string;
  total_amount: number;
  actions: { bucket_id: string; amount: number }[];
}): Promise<SplitPlan> {
  return request<SplitPlan>('/split-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSplitPlan(id: string): Promise<SplitPlan> {
  return request<SplitPlan>(`/split-plans/${id}`);
}

export async function approveSplitPlan(id: string): Promise<SplitPlan> {
  return request<SplitPlan>(`/split-plans/${id}/approve`, {
    method: 'POST',
  });
}
