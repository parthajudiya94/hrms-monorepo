export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  roleName: string;
  tenantId: number;
  isActive?: boolean;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  isSystemRole: boolean;
}

export interface TimeTrackingStatus {
  clockedIn: boolean;
  clockedOut: boolean;
  onBreak: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  breakInTime: string | null;
  breakOutTime: string | null;
  totalWorkHours: number;
  totalBreakHours: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

