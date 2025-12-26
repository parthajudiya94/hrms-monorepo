export interface Tenant {
  id: number;
  name: string;
  domain: string;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  is_system_role: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: number;
  tenant_id: number;
  role_id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TimeTracking {
  id: number;
  user_id: number;
  tenant_id: number;
  date: Date;
  clock_in_time?: Date;
  clock_out_time?: Date;
  break_in_time?: Date;
  break_out_time?: Date;
  total_work_hours: number;
  total_break_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: number;
  tenantId: number;
  roleId: number;
  email: string;
}

export interface LeaveType {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  max_days: number;
  is_paid: boolean;
  requires_approval: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LeaveBalance {
  id: number;
  user_id: number;
  tenant_id: number;
  leave_type_id: number;
  year: number;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  created_at: Date;
  updated_at: Date;
}

export interface Leave {
  id: number;
  user_id: number;
  tenant_id: number;
  leave_type_id: number;
  start_date: Date;
  end_date: Date;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_by: number;
  approved_by?: number;
  rejected_by?: number;
  approved_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: Date;
  updated_at: Date;
}

