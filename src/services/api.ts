import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee, LeaveRequest, Payroll, Attendance, SystemSettings, NotificationLog } from '../types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVES, 
  INITIAL_PAYROLLS, 
  INITIAL_ATTENDANCES, 
  INITIAL_SETTINGS 
} from '../lib/seedData';

const STORAGE_KEYS = {
  EMPLOYEES: 'nnc_hrms_employees',
  LEAVES: 'nnc_hrms_leaves',
  PAYROLLS: 'nnc_hrms_payrolls',
  ATTENDANCES: 'nnc_hrms_attendances',
  SETTINGS: 'nnc_hrms_settings',
  NOTIFICATIONS: 'nnc_hrms_notifications'
};

// Safe local storage helpers for Offline / Fallback
export function getLocalCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function setLocalCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Local cache error:', e);
  }
}

// ----------------- DATA SEEDING & INITIALIZATION -----------------
export async function initializeDatabaseIfEmpty(): Promise<void> {
  const path = 'employees';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      console.log('Seeding initial HRMS data to Firestore...');
      // Seed employees
      for (const emp of INITIAL_EMPLOYEES) {
        await setDoc(doc(db, 'employees', emp.id), emp);
      }
      // Seed leaves
      for (const leave of INITIAL_LEAVES) {
        await setDoc(doc(db, 'leaves', leave.id), leave);
      }
      // Seed payrolls
      for (const pay of INITIAL_PAYROLLS) {
        await setDoc(doc(db, 'payrolls', pay.id), pay);
      }
      // Seed attendances
      for (const att of INITIAL_ATTENDANCES) {
        await setDoc(doc(db, 'attendances', att.id), att);
      }
      // Seed settings
      await setDoc(doc(db, 'settings', 'company_settings'), INITIAL_SETTINGS);
      console.log('Database seeded successfully!');
    }
  } catch (err) {
    console.warn('Firestore initial check error, falling back to local cache or continuing:', err);
  }
}

// ----------------- EMPLOYEES API -----------------
export async function fetchEmployees(): Promise<Employee[]> {
  const path = 'employees';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      // Return initial local and seed in background
      const local = getLocalCache<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
      return local;
    }
    const list: Employee[] = [];
    snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Employee));
    setLocalCache(STORAGE_KEYS.EMPLOYEES, list);
    return list;
  } catch (err) {
    console.warn('Fetch employees using cache:', err);
    return getLocalCache<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }
}

export async function saveEmployee(employee: Employee): Promise<void> {
  const path = `employees/${employee.id}`;
  try {
    await setDoc(doc(db, 'employees', employee.id), employee, { merge: true });
    // Update local cache
    const current = getLocalCache<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    const updated = current.some(e => e.id === employee.id)
      ? current.map(e => e.id === employee.id ? employee : e)
      : [employee, ...current];
    setLocalCache(STORAGE_KEYS.EMPLOYEES, updated);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteEmployeeDoc(employeeId: string): Promise<void> {
  const path = `employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'employees', employeeId));
    const current = getLocalCache<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
    setLocalCache(STORAGE_KEYS.EMPLOYEES, current.filter(e => e.id !== employeeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ----------------- LEAVES API -----------------
export async function fetchLeaves(): Promise<LeaveRequest[]> {
  const path = 'leaves';
  try {
    const snap = await getDocs(collection(db, path));
    const list: LeaveRequest[] = [];
    snap.forEach((d) => list.push({ ...d.data(), id: d.id } as LeaveRequest));
    if (list.length === 0) {
      return getLocalCache<LeaveRequest[]>(STORAGE_KEYS.LEAVES, INITIAL_LEAVES);
    }
    setLocalCache(STORAGE_KEYS.LEAVES, list);
    return list;
  } catch (err) {
    return getLocalCache<LeaveRequest[]>(STORAGE_KEYS.LEAVES, INITIAL_LEAVES);
  }
}

export async function saveLeaveRequest(leave: LeaveRequest): Promise<void> {
  const path = `leaves/${leave.id}`;
  try {
    await setDoc(doc(db, 'leaves', leave.id), leave, { merge: true });
    const current = getLocalCache<LeaveRequest[]>(STORAGE_KEYS.LEAVES, INITIAL_LEAVES);
    const updated = current.some(l => l.id === leave.id)
      ? current.map(l => l.id === leave.id ? leave : l)
      : [leave, ...current];
    setLocalCache(STORAGE_KEYS.LEAVES, updated);

    // Trigger Line Notify simulation
    await sendLineNotification({
      id: 'notif_' + Date.now(),
      type: 'leave_requested',
      title: '📋 มีการยื่นขอลาใหม่ (Leave Request)',
      message: `พนักงาน: ${leave.employeeName} (${leave.employeeCode})\nแผนก: ${leave.department}\nประเภท: ${getLeaveTypeLabel(leave.leaveType)}\nช่วงวันที่: ${leave.startDate} ถึง ${leave.endDate} (${leave.totalDays} วัน)\nเหตุผล: ${leave.reason}`,
      timestamp: new Date().toISOString(),
      status: 'sent',
      recipient: 'HR & Management Line Group'
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateLeaveStatus(
  leaveId: string, 
  status: 'approved' | 'rejected', 
  approverId: string, 
  approverName: string, 
  approverComment: string
): Promise<void> {
  const path = `leaves/${leaveId}`;
  try {
    const updateData = {
      status,
      approverId,
      approverName,
      approverComment,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'leaves', leaveId), updateData);

    const current = getLocalCache<LeaveRequest[]>(STORAGE_KEYS.LEAVES, INITIAL_LEAVES);
    let targetLeave: LeaveRequest | undefined;
    const updated = current.map(l => {
      if (l.id === leaveId) {
        targetLeave = { ...l, ...updateData };
        return targetLeave;
      }
      return l;
    });
    setLocalCache(STORAGE_KEYS.LEAVES, updated);

    // If approved, deduct leave balance
    if (status === 'approved' && targetLeave) {
      await deductEmployeeLeaveBalance(targetLeave.employeeId, targetLeave.leaveType, targetLeave.totalDays);
    }

    // Trigger Line Notify
    if (targetLeave) {
      await sendLineNotification({
        id: 'notif_' + Date.now(),
        type: 'leave_status',
        title: status === 'approved' ? '✅ อนุมัติการลาเรียบร้อย' : '❌ ไม่อนุมัติการลา',
        message: `พนักงาน: ${targetLeave.employeeName} (${targetLeave.employeeCode})\nสถานะ: ${status === 'approved' ? 'อนุมัติ (Approved)' : 'ไม่อนุมัติ (Rejected)'}\nผู้อนุมัติ: ${approverName}\nความเห็น: ${approverComment || '-'}\nวันที่ลา: ${targetLeave.startDate} ถึง ${targetLeave.endDate}`,
        timestamp: new Date().toISOString(),
        status: 'sent',
        recipient: targetLeave.employeeName
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

async function deductEmployeeLeaveBalance(employeeId: string, leaveType: string, days: number): Promise<void> {
  try {
    const empSnap = await getDoc(doc(db, 'employees', employeeId));
    if (empSnap.exists()) {
      const empData = empSnap.data() as Employee;
      const updates: Partial<Employee> = {};
      if (leaveType === 'annual') {
        updates.annualLeaveBalance = Math.max(0, (empData.annualLeaveBalance || 0) - days);
      } else if (leaveType === 'sick') {
        updates.sickLeaveBalance = Math.max(0, (empData.sickLeaveBalance || 0) - days);
      } else if (leaveType === 'business') {
        updates.businessLeaveBalance = Math.max(0, (empData.businessLeaveBalance || 0) - days);
      }
      updates.updatedAt = new Date().toISOString();
      await updateDoc(doc(db, 'employees', employeeId), updates);
    }
  } catch (e) {
    console.warn('Deduct leave balance error:', e);
  }
}

// ----------------- PAYROLL API -----------------
export async function fetchPayrolls(): Promise<Payroll[]> {
  const path = 'payrolls';
  try {
    const snap = await getDocs(collection(db, path));
    const list: Payroll[] = [];
    snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Payroll));
    if (list.length === 0) {
      return getLocalCache<Payroll[]>(STORAGE_KEYS.PAYROLLS, INITIAL_PAYROLLS);
    }
    setLocalCache(STORAGE_KEYS.PAYROLLS, list);
    return list;
  } catch (err) {
    return getLocalCache<Payroll[]>(STORAGE_KEYS.PAYROLLS, INITIAL_PAYROLLS);
  }
}

export async function savePayroll(payroll: Payroll): Promise<void> {
  const path = `payrolls/${payroll.id}`;
  try {
    await setDoc(doc(db, 'payrolls', payroll.id), payroll, { merge: true });
    const current = getLocalCache<Payroll[]>(STORAGE_KEYS.PAYROLLS, INITIAL_PAYROLLS);
    const updated = current.some(p => p.id === payroll.id)
      ? current.map(p => p.id === payroll.id ? payroll : p)
      : [payroll, ...current];
    setLocalCache(STORAGE_KEYS.PAYROLLS, updated);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function batchGeneratePayroll(monthYear: string, employees: Employee[]): Promise<Payroll[]> {
  const newPayrolls: Payroll[] = [];
  const currentPayrolls = await fetchPayrolls();

  for (const emp of employees) {
    if (emp.status === 'resigned') continue;

    // Check if payroll already exists for this month
    const existing = currentPayrolls.find(p => p.employeeId === emp.id && p.monthYear === monthYear);
    if (existing) {
      newPayrolls.push(existing);
      continue;
    }

    // Standard Thai Payroll Calculation:
    // Base salary
    const base = emp.baseSalary;
    // Estimated regular OT or variable allowances
    const allowances = emp.department.includes('Executive') ? 15000 : emp.department.includes('Human Resources') ? 5000 : 2500;
    const otHours = emp.role === 'employee' ? Math.floor(Math.random() * 12) : 0;
    const hourlyRate = (base / 30) / 8;
    const overtimePay = Math.round(otHours * hourlyRate * 1.5);
    const bonus = 0;
    const totalEarnings = base + overtimePay + allowances + bonus;

    // Social Security (5% max 750 baht)
    const socialSecurity = Math.min(750, Math.round(base * 0.05));

    // Withholding Tax estimate (Personal Income Tax ภ.ง.ด.1)
    let withholdingTax = 0;
    const annualEst = (totalEarnings - socialSecurity) * 12;
    if (annualEst > 500000) {
      withholdingTax = Math.round((totalEarnings * 0.08));
    } else if (annualEst > 300000) {
      withholdingTax = Math.round((totalEarnings * 0.04));
    } else if (annualEst > 150000) {
      withholdingTax = Math.round((totalEarnings * 0.015));
    }

    const deductions = 0;
    const totalDeductions = socialSecurity + withholdingTax + deductions;
    const netSalary = totalEarnings - totalDeductions;

    const item: Payroll = {
      id: `pay_${monthYear.replace('-', '_')}_${emp.id}`,
      monthYear,
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      department: emp.department,
      position: emp.position,
      baseSalary: base,
      overtimeHours: otHours,
      overtimePay,
      allowances,
      bonus,
      totalEarnings,
      socialSecurity,
      withholdingTax,
      deductions,
      totalDeductions,
      netSalary,
      paymentStatus: 'draft',
      paymentMethod: `โอนผ่านระบบธนาคาร ${emp.bankName} เลขบัญชี ${emp.bankAccount}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await savePayroll(item);
    newPayrolls.push(item);
  }

  // Notify Line
  await sendLineNotification({
    id: 'notif_' + Date.now(),
    type: 'payroll_processed',
    title: '💰 สรุปการประมวลผลเงินเดือนรอบใหม่',
    message: `รอบเดือน: ${monthYear}\nจำนวนพนักงาน: ${newPayrolls.length} คน\nยอดจ่ายรวมทั้งสิ้น: ฿${newPayrolls.reduce((s, p) => s + p.netSalary, 0).toLocaleString()} บาท\nสถานะ: พร้อมตรวจสอบและอนุมัติการจ่าย`,
    timestamp: new Date().toISOString(),
    status: 'sent',
    recipient: 'HR Executive & Finance'
  });

  return newPayrolls;
}

// ----------------- ATTENDANCE API -----------------
export async function fetchAttendances(): Promise<Attendance[]> {
  const path = 'attendances';
  try {
    const snap = await getDocs(collection(db, path));
    const list: Attendance[] = [];
    snap.forEach((d) => list.push({ ...d.data(), id: d.id } as Attendance));
    if (list.length === 0) {
      return getLocalCache<Attendance[]>(STORAGE_KEYS.ATTENDANCES, INITIAL_ATTENDANCES);
    }
    setLocalCache(STORAGE_KEYS.ATTENDANCES, list);
    return list;
  } catch (err) {
    return getLocalCache<Attendance[]>(STORAGE_KEYS.ATTENDANCES, INITIAL_ATTENDANCES);
  }
}

export async function clockIn(employeeId: string, employeeName: string, locationStr?: string): Promise<Attendance> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss

  // Determine on_time or late (after 09:00:00)
  const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);
  const status: Attendance['status'] = isLate ? 'late' : 'on_time';

  const att: Attendance = {
    id: `att_${dateStr.replace(/-/g, '_')}_${employeeId}`,
    employeeId,
    employeeName,
    date: dateStr,
    clockInTime: timeStr,
    status,
    clockInLocation: locationStr || 'สำนักงานใหญ่ NNC Tower กรุงเทพฯ',
    notes: isLate ? 'เข้างานสาย' : 'เข้างานตรงเวลา',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const path = `attendances/${att.id}`;
  try {
    await setDoc(doc(db, 'attendances', att.id), att, { merge: true });
    const current = getLocalCache<Attendance[]>(STORAGE_KEYS.ATTENDANCES, INITIAL_ATTENDANCES);
    const updated = [att, ...current.filter(a => a.id !== att.id)];
    setLocalCache(STORAGE_KEYS.ATTENDANCES, updated);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }

  return att;
}

export async function clockOut(attendanceId: string, locationStr?: string): Promise<void> {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  const path = `attendances/${attendanceId}`;
  try {
    const updateData = {
      clockOutTime: timeStr,
      clockOutLocation: locationStr || 'สำนักงานใหญ่ NNC Tower กรุงเทพฯ',
      updatedAt: now.toISOString()
    };
    await updateDoc(doc(db, 'attendances', attendanceId), updateData);
    const current = getLocalCache<Attendance[]>(STORAGE_KEYS.ATTENDANCES, INITIAL_ATTENDANCES);
    const updated = current.map(a => a.id === attendanceId ? { ...a, ...updateData } : a);
    setLocalCache(STORAGE_KEYS.ATTENDANCES, updated);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// ----------------- SETTINGS & LINE NOTIFY API -----------------
export async function fetchSettings(): Promise<SystemSettings> {
  const path = 'settings/company_settings';
  try {
    const snap = await getDoc(doc(db, 'settings', 'company_settings'));
    if (snap.exists()) {
      const data = snap.data() as SystemSettings;
      setLocalCache(STORAGE_KEYS.SETTINGS, data);
      return data;
    }
    return getLocalCache<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  } catch (err) {
    return getLocalCache<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
}

export async function saveSettings(settings: SystemSettings): Promise<void> {
  const path = 'settings/company_settings';
  try {
    await setDoc(doc(db, 'settings', 'company_settings'), settings, { merge: true });
    setLocalCache(STORAGE_KEYS.SETTINGS, settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function sendLineNotification(log: NotificationLog): Promise<void> {
  const logs = getLocalCache<NotificationLog[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  logs.unshift(log);
  if (logs.length > 50) logs.pop();
  setLocalCache(STORAGE_KEYS.NOTIFICATIONS, logs);

  // If user configured real Line token, we can also dispatch HTTP request or simulate cleanly
  console.log(`[LINE NOTIFY] [${log.title}] -> ${log.message}`);
}

export function getNotificationLogs(): NotificationLog[] {
  return getLocalCache<NotificationLog[]>(STORAGE_KEYS.NOTIFICATIONS, [
    {
      id: 'notif_001',
      type: 'leave_requested',
      title: '📋 มีการยื่นขอลาใหม่ (Leave Request)',
      message: 'พนักงาน: วรัญญา บุญส่งสุข (NNC-004)\nแผนก: การตลาดและขาย\nประเภท: ลาพักร้อนประจำปี\nวันที่: 2026-10-15 ถึง 2026-10-16 (2 วัน)',
      timestamp: '2026-10-01T09:30:00.000Z',
      status: 'sent',
      recipient: 'HR Group'
    },
    {
      id: 'notif_002',
      type: 'payroll_processed',
      title: '💰 สรุปการจ่ายเงินเดือนรอบ ก.ย. 2026',
      message: 'ประมวลผลเงินเดือนรอบ 2026-09 สำเร็จเรียบร้อย จำนวน 5 ท่าน ยอดรวม ฿348,125',
      timestamp: '2026-09-28T10:00:00.000Z',
      status: 'sent',
      recipient: 'Finance & HR'
    }
  ]);
}

// ----------------- HELPERS -----------------
export function getLeaveTypeLabel(type: string): string {
  switch (type) {
    case 'annual': return 'ลาพักร้อนประจำปี (Annual Leave)';
    case 'sick': return 'ลาป่วย (Sick Leave)';
    case 'business': return 'ลากิจธุระจำเป็น (Business Leave)';
    case 'maternity': return 'ลาคลอดบุตร (Maternity Leave)';
    case 'other': return 'ลาประเภทอื่นๆ (Other Leave)';
    default: return type;
  }
}

export function getLeaveStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return { text: 'อนุมัติแล้ว', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'rejected':
      return { text: 'ไม่อนุมัติ', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'pending':
    default:
      return { text: 'รอการอนุมัติ', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
}
