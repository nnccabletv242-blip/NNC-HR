import React, { useState } from 'react';
import { LeaveRequest, Employee, LeaveType, LeaveStatus } from '../types';
import { 
  CalendarClock, 
  Plus, 
  Check, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  FileText, 
  User, 
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { saveLeaveRequest, updateLeaveStatus, getLeaveTypeLabel, getLeaveStatusBadge } from '../services/api';

interface LeaveViewProps {
  leaves: LeaveRequest[];
  employees: Employee[];
  currentUser: Employee;
  onRefreshLeaves: () => void;
  isOpenRequestModal?: boolean;
  onCloseRequestModal?: () => void;
}

export const LeaveView: React.FC<LeaveViewProps> = ({
  leaves,
  employees,
  currentUser,
  onRefreshLeaves,
  isOpenRequestModal = false,
  onCloseRequestModal
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'my_leaves' | 'calendar'>('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(isOpenRequestModal);
  const [filterType, setFilterType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    leave: LeaveRequest | null;
    action: 'approved' | 'rejected';
  }>({ isOpen: false, leave: null, action: 'approved' });
  const [approverComment, setApproverComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'annual' as LeaveType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: '',
    documentUrl: ''
  });

  const isAdminOrHR = currentUser.role === 'admin' || currentUser.role === 'hr_manager';

  // Calculate days between dates
  const handleDateChange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setLeaveForm(prev => ({ ...prev, startDate: start, endDate: end, totalDays: diffDays }));
    } else {
      setLeaveForm(prev => ({ ...prev, startDate: start, endDate: end }));
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) return;

    setIsSubmitting(true);
    try {
      const newLeave: LeaveRequest = {
        id: `leave_${Date.now()}`,
        employeeId: currentUser.id,
        employeeName: currentUser.fullName,
        employeeCode: currentUser.employeeCode,
        department: currentUser.department,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        totalDays: Number(leaveForm.totalDays) || 1,
        reason: leaveForm.reason,
        documentUrl: leaveForm.documentUrl,
        status: 'pending',
        lineNotified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveLeaveRequest(newLeave);
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
      if (onCloseRequestModal) onCloseRequestModal();
      setLeaveForm({
        leaveType: 'annual',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalDays: 1,
        reason: '',
        documentUrl: ''
      });
      setSuccessMsg('ยื่นคำขอลาเรียบร้อยแล้ว! ระบบได้ส่งการแจ้งเตือนไปยังกลุ่ม Line ของฝ่ายบุคคลเรียบร้อยแล้ว');
      onRefreshLeaves();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!actionModal.leave) return;
    setIsSubmitting(true);
    try {
      await updateLeaveStatus(
        actionModal.leave.id,
        actionModal.action,
        currentUser.id,
        currentUser.fullName,
        approverComment
      );
      setIsSubmitting(false);
      setActionModal({ isOpen: false, leave: null, action: 'approved' });
      setApproverComment('');
      setSuccessMsg(`ทำรายการ${actionModal.action === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}เรียบร้อย และแจ้งเตือนผ่าน Line สำเร็จ`);
      onRefreshLeaves();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  // Filter leaves
  const filteredLeaves = leaves.filter((l) => {
    if (activeTab === 'pending' && l.status !== 'pending') return false;
    if (activeTab === 'my_leaves' && l.employeeId !== currentUser.id) return false;
    if (filterType !== 'all' && l.leaveType !== filterType) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-indigo-600" />
            ระบบการลาอัจฉริยะ (Smart Leave Management)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ยื่นคำขอลาออนไลน์ ตรวจสอบสิทธิคงเหลือ อนุมัติคำขอ พร้อมแจ้งเตือนผ่าน Line อัตโนมัติ
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          ยื่นคำขอลาใหม่
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            รายการทั้งหมด ({leaves.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            รออนุมัติ ({leaves.filter(l => l.status === 'pending').length})
            {leaves.filter(l => l.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my_leaves')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'my_leaves' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            การลาของฉัน ({leaves.filter(l => l.employeeId === currentUser.id).length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
          >
            <option value="all">ทุกประเภทการลา</option>
            <option value="annual">ลาพักร้อน</option>
            <option value="sick">ลาป่วย</option>
            <option value="business">ลากิจ</option>
          </select>
        </div>
      </div>

      {/* Leave List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <CalendarClock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            ไม่พบรายการคำขอลาในหมวดนี้
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">พนักงานผู้ขอลา</th>
                  <th className="py-3.5 px-4">ประเภทการลา</th>
                  <th className="py-3.5 px-4">ช่วงเวลาที่ลา</th>
                  <th className="py-3.5 px-4">จำนวนวัน</th>
                  <th className="py-3.5 px-4">เหตุผลการลา</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  {isAdminOrHR && <th className="py-3.5 px-4 text-right">การอนุมัติ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map((leave) => {
                  const badge = getLeaveStatusBadge(leave.status);
                  const isPending = leave.status === 'pending';

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{leave.employeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {leave.employeeCode} • {leave.department}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">
                          {getLeaveTypeLabel(leave.leaveType)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {leave.startDate} ถึง {leave.endDate}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-indigo-700">
                        {leave.totalDays} วัน
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {leave.reason}
                        {leave.approverComment && (
                          <p className="text-[10px] text-slate-400 mt-0.5 italic">
                            (ความเห็น: {leave.approverComment})
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </td>

                      {/* Approver Actions */}
                      {isAdminOrHR && (
                        <td className="py-3 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setActionModal({ isOpen: true, leave, action: 'approved' })}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3 h-3" />
                                อนุมัติ
                              </button>
                              <button
                                onClick={() => setActionModal({ isOpen: true, leave, action: 'rejected' })}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium text-[11px] transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                ไม่อนุมัติ
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              โดย: {leave.approverName || 'ฝ่ายบุคคล'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Leave Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-400" />
                ยื่นคำขอลาออนไลน์ (Leave Application)
              </h3>
              <button
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  if (onCloseRequestModal) onCloseRequestModal();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              
              {/* Applicant Info */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">ผู้ยื่นคำขอ:</span>
                  <span className="font-bold text-slate-900">{currentUser.fullName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">พักร้อนคงเหลือ:</span>
                  <span className="font-bold font-mono text-emerald-700">{currentUser.annualLeaveBalance ?? 10} วัน</span>
                </div>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ประเภทการลา (Leave Type) *
                </label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
                >
                  <option value="annual">ลาพักร้อนประจำปี (Annual Leave)</option>
                  <option value="sick">ลาป่วย (Sick Leave)</option>
                  <option value="business">ลากิจจำเป็น (Business Leave)</option>
                  <option value="maternity">ลาคลอดบุตร (Maternity Leave)</option>
                  <option value="other">ลาอื่นๆ (Other)</option>
                </select>
              </div>

              {/* Date Ranges */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ตั้งแต่วันที่ *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => handleDateChange(e.target.value, leaveForm.endDate)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ถึงวันที่ *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => handleDateChange(leaveForm.startDate, e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Total days */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  จำนวนวันลาทั้งสิ้น (Total Days)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={leaveForm.totalDays}
                  onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: Number(e.target.value) })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none font-mono font-bold"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เหตุผลและความจำเป็นในการลา *
                </label>
                <textarea
                  rows={3}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="ระบุเหตุผล เช่น พักผ่อนประจำปี หรือ มีนัดพบแพทย์..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งคำขออนุมัติการลา'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Approver Action Modal */}
      {actionModal.isOpen && actionModal.leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {actionModal.action === 'approved' ? 'ยืนยันการอนุมัติการลา' : 'ปฏิเสธคำขอการลา'}
            </h3>
            
            <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
              <p><strong>พนักงาน:</strong> {actionModal.leave.employeeName} ({actionModal.leave.employeeCode})</p>
              <p><strong>ประเภท:</strong> {getLeaveTypeLabel(actionModal.leave.leaveType)}</p>
              <p><strong>ช่วงวันที่:</strong> {actionModal.leave.startDate} ถึง {actionModal.leave.endDate} ({actionModal.leave.totalDays} วัน)</p>
              <p className="italic text-slate-600">"{actionModal.leave.reason}"</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ความเห็นจากผู้อนุมัติ (จะแจ้งไปยังพนักงานและ Line):
              </label>
              <input
                type="text"
                value={approverComment}
                onChange={(e) => setApproverComment(e.target.value)}
                placeholder="เช่น อนุมัติตามระเบียบบริษัท หรือ ขอให้จัดหาคนแทน..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModal({ isOpen: false, leave: null, action: 'approved' })}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
                  actionModal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการทำรายการ'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
