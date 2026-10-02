import React, { useState } from 'react';
import { Employee, UserRole, Department } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  X,
  Eye
} from 'lucide-react';
import { saveEmployee, deleteEmployeeDoc } from '../services/api';

interface EmployeeViewProps {
  employees: Employee[];
  currentUser: Employee;
  onRefreshEmployees: () => void;
  onOpenPayslipForEmployee?: (employeeId: string) => void;
}

const DEPARTMENTS: Department[] = [
  'ผู้บริหาร (Executive)',
  'วิศวกรรมและเทคนิค (Engineering)',
  'ทรัพยากรบุคคล (Human Resources)',
  'การตลาดและขาย (Marketing & Sales)',
  'ปฏิบัติการและบริการลูกค้า (Operations)',
  'บัญชีและการเงิน (Finance & Accounting)'
];

export const EmployeeView: React.FC<EmployeeViewProps> = ({
  employees,
  currentUser,
  onRefreshEmployees,
  onOpenPayslipForEmployee
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isAdminOrHR = currentUser.role === 'admin' || currentUser.role === 'hr_manager';

  // Filtered list
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleOpenAddModal = () => {
    const nextNum = employees.length + 1;
    const code = `NNC-${String(nextNum).padStart(3, '0')}`;
    setEditingEmployee({
      id: `emp_nnc_${Date.now()}`,
      employeeCode: code,
      fullName: '',
      email: '',
      phone: '',
      department: 'วิศวกรรมและเทคนิค (Engineering)',
      position: '',
      role: 'employee',
      baseSalary: 30000,
      bankAccount: '',
      bankName: 'ธนาคารกสิกรไทย (KBANK)',
      startDate: new Date().toISOString().split('T')[0],
      status: 'probation',
      emergencyContact: '',
      emergencyPhone: '',
      annualLeaveBalance: 10,
      sickLeaveBalance: 30,
      businessLeaveBalance: 6,
      twoFactorEnabled: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee({ ...emp });
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.fullName || !editingEmployee.employeeCode) return;

    setIsSaving(true);
    try {
      const fullEmployee: Employee = {
        id: editingEmployee.id || `emp_${Date.now()}`,
        employeeCode: editingEmployee.employeeCode || 'NNC-000',
        fullName: editingEmployee.fullName || '',
        email: editingEmployee.email || '',
        phone: editingEmployee.phone || '',
        department: editingEmployee.department || 'วิศวกรรมและเทคนิค (Engineering)',
        position: editingEmployee.position || 'พนักงาน',
        role: editingEmployee.role || 'employee',
        baseSalary: Number(editingEmployee.baseSalary) || 0,
        bankAccount: editingEmployee.bankAccount || '',
        bankName: editingEmployee.bankName || 'ธนาคารกสิกรไทย',
        startDate: editingEmployee.startDate || new Date().toISOString().split('T')[0],
        status: editingEmployee.status || 'active',
        probationEndDate: editingEmployee.probationEndDate || '',
        emergencyContact: editingEmployee.emergencyContact || '',
        emergencyPhone: editingEmployee.emergencyPhone || '',
        annualLeaveBalance: Number(editingEmployee.annualLeaveBalance) || 10,
        sickLeaveBalance: Number(editingEmployee.sickLeaveBalance) || 30,
        businessLeaveBalance: Number(editingEmployee.businessLeaveBalance) || 6,
        avatarUrl: editingEmployee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        twoFactorEnabled: editingEmployee.twoFactorEnabled || false,
        twoFactorSecret: editingEmployee.twoFactorSecret || 'NNC-2FA-SEC-' + Math.floor(1000 + Math.random() * 9000),
        createdAt: editingEmployee.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveEmployee(fullEmployee);
      setIsSaving(false);
      setIsModalOpen(false);
      setEditingEmployee(null);
      setSuccessMsg('บันทึกข้อมูลพนักงานสำเร็จแล้ว');
      onRefreshEmployees();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลพนักงาน: ${name} ออกจากระบบ?`)) return;
    try {
      await deleteEmployeeDoc(id);
      onRefreshEmployees();
      setIsDetailDrawerOpen(false);
      setSuccessMsg(`ลบข้อมูลพนักงาน ${name} เรียบร้อยแล้ว`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['EmployeeCode', 'FullName', 'Email', 'Phone', 'Department', 'Position', 'Role', 'BaseSalary', 'Status', 'StartDate'];
    const rows = filteredEmployees.map(e => [
      e.employeeCode,
      `"${e.fullName}"`,
      e.email,
      e.phone,
      `"${e.department}"`,
      `"${e.position}"`,
      e.role,
      e.baseSalary,
      e.status,
      e.startDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nnc_employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            ฐานข้อมูลพนักงาน (Employee Database)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            จัดการประวัติพนักงาน สัญญาจ้าง เงินเดือน และสิทธิวันลาทั้งหมดในองค์กร ({employees.length} ท่าน)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก CSV
          </button>
          
          {isAdminOrHR && (
            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              เพิ่มพนักงานใหม่
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ, รหัสพนักงาน, ตำแหน่ง หรืออีเมล..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </div>

        {/* Department Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="all">ทุกแผนก / สายงาน</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
          >
            <option value="all">ทุกสถานะการทำงาน</option>
            <option value="active">พนักงานประจำ (Active)</option>
            <option value="probation">ทดลองงาน (Probation)</option>
            <option value="resigned">พ้นสภาพ / ลาออก (Resigned)</option>
          </select>
        </div>
      </div>

      {/* Employees Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">พนักงาน</th>
                  <th className="py-3.5 px-4">รหัส / ตำแหน่ง</th>
                  <th className="py-3.5 px-4">แผนก</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  {isAdminOrHR && <th className="py-3.5 px-4">เงินเดือนพื้นฐาน</th>}
                  <th className="py-3.5 px-4">สิทธิวันลาคงเหลือ</th>
                  <th className="py-3.5 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Employee Avatar & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => { setSelectedEmployee(emp); setIsDetailDrawerOpen(true); }}>
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Code & Position */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {emp.employeeCode}
                      </span>
                      <p className="text-slate-600 mt-0.5">{emp.position}</p>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {emp.department}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {emp.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ประจำ (Active)
                        </span>
                      )}
                      {emp.status === 'probation' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ทดลองงาน (Probation)
                        </span>
                      )}
                      {emp.status === 'resigned' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          ลาออก (Resigned)
                        </span>
                      )}
                    </td>

                    {/* Salary */}
                    {isAdminOrHR && (
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        ฿{emp.baseSalary.toLocaleString()}
                      </td>
                    )}

                    {/* Leave balances */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span title="พักร้อน" className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          พักผ่อน: {emp.annualLeaveBalance ?? 10}ว.
                        </span>
                        <span title="ป่วย" className="text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                          ป่วย: {emp.sickLeaveBalance ?? 30}ว.
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsDetailDrawerOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="ดูข้อมูลละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isAdminOrHR && (
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(emp.id, emp.fullName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="ลบพนักงาน"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                {editingEmployee.id?.startsWith('emp_nnc_') && !editingEmployee.createdAt
                  ? 'เพิ่มพนักงานใหม่ (New Employee Registration)'
                  : `แก้ไขข้อมูลพนักงาน: ${editingEmployee.fullName || ''}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Employee Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสพนักงาน (Employee Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.employeeCode || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, employeeCode: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 font-mono outline-none"
                    placeholder="เช่น NNC-007"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.fullName || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, fullName: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                    placeholder="ชื่อ นามสกุล"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมลองค์กร / Gmail *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingEmployee.email || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                    placeholder="name@nnc.co.th"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.phone || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                    placeholder="081-xxx-xxxx"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    แผนก / สายงาน *
                  </label>
                  <select
                    value={editingEmployee.department || 'วิศวกรรมและเทคนิค (Engineering)'}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ตำแหน่ง (Position) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.position || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                    placeholder="เช่น Network Engineer"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    บทบาทในระบบ (System Role)
                  </label>
                  <select
                    value={editingEmployee.role || 'employee'}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value as UserRole })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                  >
                    <option value="employee">พนักงานทั่วไป (Employee)</option>
                    <option value="hr_manager">ผู้จัดการฝ่ายบุคคล (HR Manager)</option>
                    <option value="admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานะการทำงาน (Employment Status)
                  </label>
                  <select
                    value={editingEmployee.status || 'active'}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value as any })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                  >
                    <option value="active">พนักงานประจำ (Active)</option>
                    <option value="probation">อยู่ระหว่างทดลองงาน (Probation)</option>
                    <option value="resigned">พ้นสภาพ / ลาออก (Resigned)</option>
                  </select>
                </div>

                {/* Base Salary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เงินเดือนพื้นฐาน (Base Salary THB) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={editingEmployee.baseSalary ?? 30000}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, baseSalary: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 font-mono outline-none"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วันเริ่มงาน (Start Date)
                  </label>
                  <input
                    type="date"
                    value={editingEmployee.startDate || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, startDate: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                  />
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เลขที่บัญชีธนาคาร
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.bankAccount || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, bankAccount: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 font-mono outline-none"
                    placeholder="xxx-x-xxxxx-x"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ธนาคาร
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.bankName || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, bankName: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                    placeholder="เช่น ธนาคารกสิกรไทย (KBANK)"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    บุคคลติดต่อฉุกเฉิน
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.emergencyContact || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, emergencyContact: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                    placeholder="ชื่อและควาสัมพันธ์"
                  />
                </div>

                {/* Emergency Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรฉุกเฉิน
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.emergencyPhone || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, emergencyPhone: e.target.value })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                    placeholder="08x-xxx-xxxx"
                  />
                </div>

                {/* Annual Leave balance */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สิทธิลาพักร้อนประจำปี (วัน)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingEmployee.annualLeaveBalance ?? 10}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, annualLeaveBalance: Number(e.target.value) })}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                  />
                </div>

                {/* 2FA Toggle */}
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="twoFactorCheckbox"
                    checked={editingEmployee.twoFactorEnabled || false}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, twoFactorEnabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <label htmlFor="twoFactorCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                    เปิดใช้งาน 2FA บังคับสำหรับบัญชีนี้
                  </label>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail Drawer */}
      {isDetailDrawerOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-y-auto">
            
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white relative">
              <button 
                onClick={() => setIsDetailDrawerOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <img
                  src={selectedEmployee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-md"
                />
                <div>
                  <h3 className="text-lg font-bold">{selectedEmployee.fullName}</h3>
                  <p className="text-xs text-indigo-300 font-mono">{selectedEmployee.employeeCode} • {selectedEmployee.position}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedEmployee.department}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1 text-xs">
              
              {/* Status and 2FA pill */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedEmployee.role === 'admin' ? 'Super Admin' : selectedEmployee.role === 'hr_manager' ? 'HR Manager' : 'Employee'}
                </span>
                {selectedEmployee.twoFactorEnabled ? (
                  <span className="px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 2FA Active
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                    2FA Disabled
                  </span>
                )}
              </div>

              {/* General Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  ข้อมูลการติดต่อและการทำงาน
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">อีเมล:</span>
                    <span className="font-medium">{selectedEmployee.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">เบอร์โทรศัพท์:</span>
                    <span className="font-medium">{selectedEmployee.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">วันเริ่มงาน:</span>
                    <span className="font-medium">{selectedEmployee.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">สถานะ:</span>
                    <span className="font-bold text-indigo-700 uppercase">{selectedEmployee.status}</span>
                  </div>
                </div>
              </div>

              {/* Financial & Bank Account */}
              {isAdminOrHR && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    ข้อมูลเงินเดือนและบัญชีรับโอน (Confidential)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">เงินเดือนพื้นฐาน:</span>
                      <span className="font-bold font-mono text-base text-slate-900">
                        ฿{selectedEmployee.baseSalary.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ธนาคาร:</span>
                      <span className="font-medium">{selectedEmployee.bankName}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">เลขที่บัญชี:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedEmployee.bankAccount || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave Quota Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  สิทธิการลาคงเหลือประจำปี 2026
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="block text-[10px] text-emerald-800">ลาพักผ่อน</span>
                    <span className="text-lg font-bold font-mono text-emerald-700">
                      {selectedEmployee.annualLeaveBalance ?? 10}
                    </span>
                    <span className="text-[10px] text-emerald-600 block">วัน</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="block text-[10px] text-blue-800">ลาป่วย</span>
                    <span className="text-lg font-bold font-mono text-blue-700">
                      {selectedEmployee.sickLeaveBalance ?? 30}
                    </span>
                    <span className="text-[10px] text-blue-600 block">วัน</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="block text-[10px] text-amber-800">ลากิจธุระ</span>
                    <span className="text-lg font-bold font-mono text-amber-700">
                      {selectedEmployee.businessLeaveBalance ?? 6}
                    </span>
                    <span className="text-[10px] text-amber-600 block">วัน</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b pb-1">
                  ผู้ติดต่อกรณีฉุกเฉิน
                </h4>
                <p className="text-slate-700">
                  <strong>ผู้ติดต่อ:</strong> {selectedEmployee.emergencyContact || 'ไม่ระบุ'} • 
                  <strong> เบอร์โทร:</strong> {selectedEmployee.emergencyPhone || '-'}
                </p>
              </div>

              {/* Action buttons inside drawer */}
              {isAdminOrHR && (
                <div className="pt-4 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => {
                      setIsDetailDrawerOpen(false);
                      handleOpenEditModal(selectedEmployee);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    แก้ไขข้อมูล
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
