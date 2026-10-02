export type UserRole = 'admin' | 'hr_manager' | 'employee';

export type Department = 
  | 'ผู้บริหาร (Executive)' 
  | 'วิศวกรรมและเทคนิค (Engineering)' 
  | 'ทรัพยากรบุคคล (Human Resources)' 
  | 'การตลาดและขาย (Marketing & Sales)' 
  | 'ปฏิบัติการและบริการลูกค้า (Operations)' 
  | 'บัญชีและการเงิน (Finance & Accounting)';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: UserRole;
  baseSalary: number;
  bankAccount: string;
  bankName: string;
  startDate: string; // YYYY-MM-DD
  status: 'active' | 'probation' | 'resigned';
  probationEndDate?: string;
  emergencyContact: string;
  emergencyPhone: string;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  businessLeaveBalance: number;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'annual' | 'sick' | 'business' | 'maternity' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentUrl?: string;
  status: LeaveStatus;
  approverId?: string;
  approverName?: string;
  approverComment?: string;
  lineNotified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  id: string;
  monthYear: string; // e.g. "2026-10"
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  position: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  allowances: number;
  bonus: number;
  totalEarnings: number;
  socialSecurity: number; // 5% capped at 750 THB
  withholdingTax: number;
  deductions: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'draft' | 'approved' | 'paid';
  paymentDate?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // HH:mm:ss
  clockOutTime?: string; // HH:mm:ss
  status: 'on_time' | 'late' | 'leave' | 'absent' | 'overtime';
  clockInLocation?: string;
  clockOutLocation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  lineToken: string;
  lineNotifyEnabled: boolean;
  socialSecurityRate: number; // default 0.05
  maxSocialSecurityAmount: number; // default 750
  officeLatitude: number;
  officeLongitude: number;
  allowedDistanceMeters: number;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  type: 'leave_requested' | 'leave_status' | 'payroll_processed' | 'system_alert';
  title: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'simulated';
  recipient?: string;
}
