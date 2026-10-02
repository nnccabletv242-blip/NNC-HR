import React, { useState } from 'react';
import { Payroll, Employee } from '../types';
import { 
  CreditCard, 
  FileText, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Download, 
  ChevronRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { batchGeneratePayroll, savePayroll } from '../services/api';

interface PayrollViewProps {
  payrolls: Payroll[];
  employees: Employee[];
  currentUser: Employee;
  onRefreshPayrolls: () => void;
  onSelectPayslip: (payroll: Payroll) => void;
  isTwoFactorVerified: boolean;
  onTriggerTwoFactorModal: () => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  payrolls,
  employees,
  currentUser,
  onRefreshPayrolls,
  onSelectPayslip,
  isTwoFactorVerified,
  onTriggerTwoFactorModal
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isAdminOrHR = currentUser.role === 'admin' || currentUser.role === 'hr_manager';

  // Filter payrolls by selected month
  const monthPayrolls = payrolls.filter((p) => {
    if (p.monthYear !== selectedMonth) return false;
    // Regular employees can only view their own payslip
    if (!isAdminOrHR && p.employeeId !== currentUser.id) return false;
    return true;
  });

  const totalNet = monthPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalSS = monthPayrolls.reduce((sum, p) => sum + p.socialSecurity, 0);
  const totalTax = monthPayrolls.reduce((sum, p) => sum + p.withholdingTax, 0);

  const handleRunBatchPayroll = async () => {
    if (!isTwoFactorVerified) {
      onTriggerTwoFactorModal();
      return;
    }

    setIsProcessing(true);
    try {
      await batchGeneratePayroll(selectedMonth, employees);
      setIsProcessing(false);
      setSuccessMsg(`ประมวลผลคำนวณเงินเดือนงวด ${selectedMonth} อัตโนมัติเรียบร้อยแล้ว พร้อมส่งสรุปเข้า Line`);
      onRefreshPayrolls();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleMarkAsPaid = async (payroll: Payroll) => {
    try {
      const updated: Payroll = {
        ...payroll,
        paymentStatus: 'paid',
        paymentDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
      };
      await savePayroll(updated);
      setSuccessMsg(`อัปเดตสถานะการจ่ายเงินเดือนของ ${payroll.employeeName} เป็น จ่ายแล้ว (Paid)`);
      onRefreshPayrolls();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAll = async () => {
    if (!isTwoFactorVerified) {
      onTriggerTwoFactorModal();
      return;
    }
    try {
      for (const p of monthPayrolls) {
        if (p.paymentStatus === 'draft') {
          await savePayroll({
            ...p,
            paymentStatus: 'approved',
            updatedAt: new Date().toISOString()
          });
        }
      }
      setSuccessMsg(`อนุมัติการจ่ายเงินเดือนทั้งหมด ${monthPayrolls.length} รายการเรียบร้อยแล้ว`);
      onRefreshPayrolls();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            ระบบจ่ายเงินเดือนอัตโนมัติและสลิปเงินเดือน (Automated Payroll)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            คำนวณเงินเดือนสุทธิ, ภาษี ภ.ง.ด.1, ประกันสังคม 5%, ค่าล่วงเวลา และออกสลิปเงินเดือนแบบอิเล็กทรอนิกส์
          </p>
        </div>

        {/* 2FA Security status */}
        <div className="flex items-center gap-2">
          {isTwoFactorVerified ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2FA ได้รับการยืนยันแล้ว</span>
            </div>
          ) : (
            <button
              onClick={onTriggerTwoFactorModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Lock className="w-4 h-4 text-amber-600" />
              <span>กดยืนยัน 2FA เพื่อจัดการการเงิน</span>
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

      {/* Month Selector & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">รอบเดือนการจ่ายเงิน:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-800 outline-none focus:border-indigo-600"
          >
            <option value="2026-10">ตุลาคม 2026 (2026-10) - งวดปัจจุบัน</option>
            <option value="2026-09">กันยายน 2026 (2026-09)</option>
            <option value="2026-08">สิงหาคม 2026 (2026-08)</option>
          </select>
        </div>

        {isAdminOrHR && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleApproveAll}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              อนุมัติทั้งหมด (Approve All)
            </button>
            <button
              onClick={handleRunBatchPayroll}
              disabled={isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isProcessing ? 'กำลังคำนวณ...' : 'คำนวณเงินเดือนอัตโนมัติ (Batch Run)'}
            </button>
          </div>
        )}
      </div>

      {/* KPI Overview for this Payroll Run */}
      {isAdminOrHR && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md border border-indigo-900/50">
            <span className="text-[11px] text-indigo-300 font-semibold block uppercase tracking-wider">
              ยอดจ่ายเงินเดือนสุทธิรวม (Total Net Pay)
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1 block">
              ฿{totalNet.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-300 mt-1 block">
              รวมพนักงานทั้งหมด {monthPayrolls.length} ท่าน
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
              หักเงินสมทบประกันสังคมรวม (5%)
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              ฿{totalSS.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              นำส่งสำนักงานประกันสังคม (สปส.)
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
              ภาษีเงินได้หัก ณ ที่จ่ายรวม (ภ.ง.ด.1)
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              ฿{totalTax.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              นำส่งกรมสรรพากรภายในวันที่ 7
            </span>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {monthPayrolls.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <CreditCard className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            ยังไม่มีข้อมูลเงินเดือนในงวดเดือน {selectedMonth}
            {isAdminOrHR && (
              <div className="mt-3">
                <button
                  onClick={handleRunBatchPayroll}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm"
                >
                  กดที่นี่เพื่อคำนวณเงินเดือนงวด {selectedMonth} ทันที
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">พนักงาน</th>
                  <th className="py-3.5 px-4">เงินเดือนประจำ</th>
                  <th className="py-3.5 px-4">ค่าล่วงเวลา / เบี้ยเลี้ยง</th>
                  <th className="py-3.5 px-4">ประกันสังคม</th>
                  <th className="py-3.5 px-4">ภาษี ภ.ง.ด.1</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">เงินได้สุทธิ (Net Pay)</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">สลิปเงินเดือน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{payroll.employeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {payroll.employeeCode} • {payroll.department}
                      </div>
                    </td>

                    {/* Base Salary */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      ฿{payroll.baseSalary.toLocaleString()}
                    </td>

                    {/* OT / Allowances */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      +฿{(payroll.overtimePay + payroll.allowances + payroll.bonus).toLocaleString()}
                      {payroll.overtimeHours > 0 && (
                        <span className="text-[10px] text-slate-400 block font-sans">
                          (OT {payroll.overtimeHours} ชม.)
                        </span>
                      )}
                    </td>

                    {/* Social Security */}
                    <td className="py-3 px-4 font-mono text-rose-600">
                      -฿{payroll.socialSecurity.toLocaleString()}
                    </td>

                    {/* Tax */}
                    <td className="py-3 px-4 font-mono text-rose-600">
                      -฿{payroll.withholdingTax.toLocaleString()}
                    </td>

                    {/* Net Salary */}
                    <td className="py-3 px-4 font-mono font-black text-sm text-emerald-600">
                      ฿{payroll.netSalary.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {payroll.paymentStatus === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> โอนแล้ว
                        </span>
                      )}
                      {payroll.paymentStatus === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          อนุมัติแล้ว
                        </span>
                      )}
                      {payroll.paymentStatus === 'draft' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ฉบับร่าง
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPayslip(payroll)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          ดูสลิป
                        </button>

                        {isAdminOrHR && payroll.paymentStatus !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(payroll)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-[11px] transition-colors"
                            title="ทำเครื่องหมายว่าจ่ายแล้ว"
                          >
                            จ่ายแล้ว
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

    </div>
  );
};
