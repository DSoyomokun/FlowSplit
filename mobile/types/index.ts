export interface User {
  id: string;
  supabase_id: string;
  phone_number: string | null;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Bucket {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  bucket_type: 'percentage' | 'fixed';
  allocation_value: number;
  target_amount: number | null;
  current_balance: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  bank_account_id: string | null;
  amount: number;
  source: string | null;
  description: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  detected_at: string;
  processed_at: string | null;
  created_at: string;
}

export interface SplitAction {
  id: string;
  split_plan_id: string;
  bucket_id: string;
  amount: number;
  executed: boolean;
  executed_at: string | null;
}

export interface SplitPlan {
  id: string;
  deposit_id: string;
  total_amount: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'executing' | 'completed' | 'cancelled';
  approved_at: string | null;
  executed_at: string | null;
  created_at: string;
  updated_at: string;
  actions: SplitAction[];
}

export interface SplitPlanPreview {
  deposit_id: string;
  total_amount: number;
  actions: {
    bucket_id: string;
    amount: number;
  }[];
}

export interface ActionExecutionResult {
  action_id: string;
  bucket_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'manual_required';
  amount: number;
  error: string | null;
  external_url: string | null;
  transaction_id: string | null;
}

export interface SplitExecutionResponse {
  plan_id: string;
  status: string;
  total_amount: number;
  completed_amount: number;
  failed_amount: number;
  manual_amount: number;
  action_results: ActionExecutionResult[];
  completed_at: string | null;
}
