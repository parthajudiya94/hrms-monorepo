import api from './api';

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  max_days: number;
  is_paid: boolean;
  requires_approval: boolean;
}

export interface LeaveBalance {
  id: number;
  leave_type_id: number;
  leave_type_name: string;
  year: number;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  max_days: number;
}

export interface Leave {
  id: number;
  user_id: number;
  leave_type_id: number;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_by: number;
  approved_by?: number;
  rejected_by?: number;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  created_at?: string;
}

export const getLeaveTypes = async (): Promise<{ leaveTypes: LeaveType[] }> => {
  const response = await api.get<{ leaveTypes: LeaveType[] }>('/leaves/types');
  return response.data;
};

export const getLeaveBalance = async (year?: number): Promise<{ balances: LeaveBalance[] }> => {
  const params = year ? { year } : {};
  const response = await api.get<{ balances: LeaveBalance[] }>('/leaves/balance', { params });
  return response.data;
};

export const applyLeave = async (
  leaveTypeId: number,
  startDate: string,
  endDate: string,
  reason?: string
): Promise<{ message: string; leaveId: number }> => {
  const response = await api.post<{ message: string; leaveId: number }>('/leaves/apply', {
    leaveTypeId,
    startDate,
    endDate,
    reason,
  });
  return response.data;
};

export const getMyLeaves = async (): Promise<{ leaves: Leave[] }> => {
  const response = await api.get<{ leaves: Leave[] }>('/leaves/my-leaves');
  return response.data;
};

export const getAllLeaves = async (status?: string): Promise<{ leaves: Leave[] }> => {
  const params = status ? { status } : {};
  const response = await api.get<{ leaves: Leave[] }>('/leaves/all', { params });
  return response.data;
};

export const approveLeave = async (leaveId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/leaves/${leaveId}/approve`);
  return response.data;
};

export const rejectLeave = async (leaveId: number, rejectionReason?: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/leaves/${leaveId}/reject`, {
    rejectionReason,
  });
  return response.data;
};

export const cancelLeave = async (leaveId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/leaves/${leaveId}/cancel`);
  return response.data;
};

export const getLeaveReport = async (
  startDate?: string,
  endDate?: string,
  userId?: number
): Promise<{ leaves: Leave[]; summary: any }> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (userId) params.userId = userId;

  const response = await api.get<{ leaves: Leave[]; summary: any }>('/leaves/report', { params });
  return response.data;
};

