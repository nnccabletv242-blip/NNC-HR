import React from 'react';
import { Employee, LeaveRequest, Payroll, Attendance } from '../types';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  CreditCard, 
  ArrowUpRight, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  PlusCircle, 
  FileText,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';

interface DashboardViewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  payrolls: Payroll[];
  attendances: Attendance[];
  currentUser: Employee;
  onNavigateTab: (tab: string) => void;
  onOpenLeaveModal: () => void;
  onOpenClockIn: () => void;
  onSelectPayroll: (payroll: Payroll) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  leaves,
  payrolls,
  attendances,
  currentUser,
  onNavigateTab,
  onOpenLeaveModal,
  onOpenClockIn,
  onSelectPayroll
}) => {
  const activeEmployees = employees.filter(e => e.status !== 'resigned');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter(a => a.date === todayStr);
  const presentCount = todayAttendances.length;
  const attendanceRate = activeEmployees.length > 0 ? Math.round((presentCount / activeEmployees.length) * 100) : 0;
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const latestPayrollMonth = payrolls.length > 0 ? payrolls[0].monthYear : '2026-10';
  const latestPayrolls = payrolls.filter(p => p.monthYear === latestPayrollMonth);
  const totalPayrollExpense = latestPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

  // Probation alert (status === 'probation')
  const probationEmployees = employees.filter(e => e.status === 'probation');

  // Check if current user clocked in today
  const myTodayAttendance = todayAttendances.find(a => a.employeeId === currentUser.id);

  // Group by department
  const deptCount: { [key: string]: number } = {};
  activeEmployees.forEach(emp => {
    deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Welcome & Quick Action Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-indigo-200 mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              ระบบบริหารงานบุคคลอัจฉริยะ (Smart HRMS) • NNC CABLE TV
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              สวัสดี, {currentUser.fullName} 👋
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              ภาพรวมทรัพยากรบุคคล การลงเวลา และการประมวลผลเงินเดือน ประจำวันพฤหัสบดีที่ 1 ตุลาคม 2026
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenClockIn}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] ${
                myTodayAttendance
                  ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-400/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              {myTodayAttendance ? 'ลงเวลาวันนี้แล้ว' : 'ลงเวลาเข้างาน (Clock In)'}
            </button>

            <button
              onClick={onOpenLeaveModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/15 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              ยื่นคำขอลาใหม่
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => onNavigateTab('payroll')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all active:scale-[0.98] shadow-md"
              >
                <CreditCard className="w-4 h-4" />
                คำนวณเงินเดือน
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Headcount */}
        <div 
          onClick={() => onNavigateTab('employees')}
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              พนักงานทั้งหมด
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {activeEmployees.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">คน (Active)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2.5">
            <span>ทดลองงาน: <strong className="text-amber-600">{probationEmployees.length}</strong> คน</span>
            <span className="text-indigo-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              ดูรายชื่อ <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Attendance */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              เข้างานวันนี้ (Present)
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {presentCount}
            </span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {attendanceRate}% มาทำงาน
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2.5">
            <span>ตรงเวลา: {todayAttendances.filter(a => a.status === 'on_time').length} • สาย: {todayAttendances.filter(a => a.status === 'late').length}</span>
            <span className="text-emerald-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              ดูการลงเวลา <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Pending Leaves */}
        <div 
          onClick={() => onNavigateTab('leaves')}
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              คำขอรออนุมัติ (Pending)
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {pendingLeaves.length}
            </span>
            <span className="text-xs text-amber-700 font-medium">รายการ</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2.5">
            <span>{pendingLeaves.length > 0 ? 'รอฝ่ายบุคคลและหัวหน้างาน' : 'ไม่มีคำขอค้างตรวจ'}</span>
            <span className="text-amber-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              พิจารณาคำขอ <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Payroll Cost */}
        <div 
          onClick={() => onNavigateTab('payroll')}
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ยอดจ่ายเงินเดือนล่าสุด
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              ฿{totalPayrollExpense.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2.5">
            <span>งวด: <strong className="text-slate-700">{latestPayrollMonth}</strong></span>
            <span className="text-purple-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              ดูสลิปเงินเดือน <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

      </div>

      {/* Probation Alert Banner if any */}
      {probationEmployees.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-sm">แจ้งเตือน: มีพนักงานอยู่ในระยะทดลองงาน ({probationEmployees.length} ท่าน)</p>
              <p className="text-amber-700 mt-0.5">
                {probationEmployees.map(e => `${e.fullName} (${e.position})`).join(', ')} ใกล้ครบกำหนดประเมินผลผ่านโปร
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('employees')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors shadow-xs"
          >
            ตรวจสอบข้อมูลพนักงาน
          </button>
        </div>
      )}

      {/* Main Grid: Pending Approvals & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Pending Leaves & Recent Approvals */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                คำขออนุมัติการลาล่าสุด (Pending Leaves)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                คำขอที่พนักงานยื่นรอการพิจารณาจากหัวหน้างานและฝ่ายบุคคล
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('leaves')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              ดูทั้งหมด ({leaves.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-medium">ไม่มีคำขอลาที่ค้างการอนุมัติในขณะนี้</p>
                <p className="text-[11px] text-slate-400 mt-0.5">พนักงานทุกคนพร้อมปฏิบัติงานตามปกติ</p>
              </div>
            ) : (
              pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{leave.employeeName}</span>
                      <span className="text-[11px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {leave.employeeCode}
                      </span>
                      <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                        รอการอนุมัติ
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>ประเภท:</strong> {leave.leaveType === 'annual' ? 'ลาพักร้อน' : leave.leaveType === 'sick' ? 'ลาป่วย' : 'ลากิจ'} • 
                      <span className="text-indigo-600 font-medium ml-1">
                        {leave.startDate} ถึง {leave.endDate} ({leave.totalDays} วัน)
                      </span>
                    </p>
                    <p className="text-slate-500 italic text-[11px]">
                      "{leave.reason}"
                    </p>
                  </div>
                  
                  <button
                    onClick={() => onNavigateTab('leaves')}
                    className="self-end sm:self-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shrink-0 shadow-xs"
                  >
                    พิจารณาอนุมัติ
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Department Distribution & My Quick Status */}
        <div className="space-y-6">
          
          {/* Department Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-600" />
              โครงสร้างฝ่ายงาน (Departments)
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              สัดส่วนจำนวนพนักงานแต่ละสายงาน
            </p>

            <div className="space-y-3">
              {Object.entries(deptCount).map(([dept, count]) => {
                const percent = Math.round((count / activeEmployees.length) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[190px]">{dept}</span>
                      <span className="font-bold text-slate-900 font-mono">{count} คน ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current User Leave Quota Summary */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                สิทธิการลาของฉัน ({currentUser.fullName.split(' ')[0]})
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                <span className="block text-[11px] text-indigo-200">พักร้อนคงเหลือ</span>
                <span className="text-xl font-bold font-mono text-emerald-300">
                  {currentUser.annualLeaveBalance ?? 10}
                </span>
                <span className="text-[10px] text-slate-300 block">วัน</span>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                <span className="block text-[11px] text-indigo-200">ลาป่วยคงเหลือ</span>
                <span className="text-xl font-bold font-mono text-blue-300">
                  {currentUser.sickLeaveBalance ?? 30}
                </span>
                <span className="text-[10px] text-slate-300 block">วัน</span>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                <span className="block text-[11px] text-indigo-200">ลากิจคงเหลือ</span>
                <span className="text-xl font-bold font-mono text-amber-300">
                  {currentUser.businessLeaveBalance ?? 6}
                </span>
                <span className="text-[10px] text-slate-300 block">วัน</span>
              </div>
            </div>

            <button
              onClick={onOpenLeaveModal}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              ยื่นใบลาสำหรับตนเอง
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
