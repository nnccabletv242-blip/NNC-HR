import React from 'react';
import { Payroll } from '../types';
import { Printer, Download, X, Building2, CheckCircle2 } from 'lucide-react';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: Payroll | null;
}

// Convert number to Thai Baht text
function thaiBahtText(num: number): string {
  if (isNaN(num)) return '';
  const thaiNums = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thaiUnits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  const [intPart, decPart] = num.toFixed(2).split('.');
  let intNum = parseInt(intPart, 10);
  if (intNum === 0) return 'ศูนย์บาทถ้วน';

  let text = '';
  let unitIndex = 0;
  
  const digits = intNum.toString().split('').reverse();
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i], 10);
    const pos = i % 6;
    if (i > 0 && pos === 0) {
      text = 'ล้าน' + text;
    }
    if (digit !== 0) {
      if (pos === 1 && digit === 1) {
        text = 'สิบ' + text;
      } else if (pos === 1 && digit === 2) {
        text = 'ยี่สิบ' + text;
      } else if (pos === 0 && digit === 1 && digits.length > 1 && digits[1] !== '0') {
        text = 'เอ็ด' + text;
      } else {
        text = thaiNums[digit] + thaiUnits[pos] + text;
      }
    }
  }

  text += 'บาท';
  const decNum = parseInt(decPart, 10);
  if (decNum === 0) {
    text += 'ถ้วน';
  } else {
    // decimal part
    const d0 = parseInt(decPart[0], 10);
    const d1 = parseInt(decPart[1], 10);
    if (d0 > 0) {
      if (d0 === 1) text += 'สิบ';
      else if (d0 === 2) text += 'ยี่สิบ';
      else text += thaiNums[d0] + 'สิบ';
    }
    if (d1 > 0) {
      if (d1 === 1 && d0 > 0) text += 'เอ็ด';
      else text += thaiNums[d1];
    }
    text += 'สตางค์';
  }
  return text;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, onClose, payroll }) => {
  if (!isOpen || !payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none my-6">
        
        {/* Modal Actions (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-sm">ใบแจ้งเงินเดือนอิเล็กทรอนิกส์ (E-Payslip)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              พิมพ์สลิป (Print / PDF)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className="p-6 sm:p-10 font-sans text-slate-800 bg-white">
          {/* Company Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded">NNC</span>
                  บริษัท เอ็นเอ็นซี เคเบิลทีวี แอนด์ เน็ตเวิร์ค จำกัด
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  142/88 อาคารเอ็นเอ็นซี ทาวเวอร์ ถนนสุขุมวิท กรุงเทพฯ 10110 | เลขประจำตัวผู้เสียภาษี: 0105558091242
                </p>
              </div>
              <div className="text-right sm:self-center">
                <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase text-slate-700 tracking-wider">
                  ใบแจ้งยอดเงินเดือน / PAYSLIP
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ประจำงวดเดือน: <span className="font-bold text-slate-800">{payroll.monthYear}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6">
            <div>
              <span className="text-slate-400 block text-[11px]">รหัสพนักงาน (ID):</span>
              <span className="font-bold text-slate-900 font-mono">{payroll.employeeCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ชื่อ-นามสกุล:</span>
              <span className="font-bold text-slate-900">{payroll.employeeName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">แผนก (Department):</span>
              <span className="font-medium text-slate-800">{payroll.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ตำแหน่ง (Position):</span>
              <span className="font-medium text-slate-800">{payroll.position}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px]">วิธีการชำระเงิน:</span>
              <span className="font-medium text-slate-800">{payroll.paymentMethod || 'โอนผ่านบัญชีธนาคาร'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">วันที่จ่าย:</span>
              <span className="font-medium text-slate-800">{payroll.paymentDate || 'สิ้นเดือน'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">สถานะการจ่าย:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {payroll.paymentStatus === 'paid' ? 'โอนเงินแล้ว (PAID)' : 'อนุมัติเรียบร้อย'}
              </span>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Earnings */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2 flex justify-between items-center">
                <span className="font-bold text-xs text-indigo-950 uppercase tracking-wide">รายได้ (Earnings)</span>
                <span className="font-semibold text-xs text-indigo-900">จำนวนเงิน (บาท)</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>เงินเดือนประจำ (Base Salary)</span>
                  <span className="font-mono font-medium">{payroll.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>ค่าล่วงเวลา ({payroll.overtimeHours} ชม.)</span>
                  <span className="font-mono font-medium">{payroll.overtimePay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>เบี้ยเลี้ยง / ค่าครองชีพ / ค่าตำแหน่ง</span>
                  <span className="font-mono font-medium">{payroll.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>โบนัส / เงินรางวัลพิเศษ</span>
                  <span className="font-mono font-medium">{payroll.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold text-slate-900">
                  <span>รวมรายได้ทั้งสิ้น (Total Earnings)</span>
                  <span className="font-mono text-indigo-700">{payroll.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-rose-50/70 border-b border-rose-100 px-4 py-2 flex justify-between items-center">
                <span className="font-bold text-xs text-rose-950 uppercase tracking-wide">รายการหัก (Deductions)</span>
                <span className="font-semibold text-xs text-rose-900">จำนวนเงิน (บาท)</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>ประกันสังคม 5% (เพดาน 750 บ.)</span>
                  <span className="font-mono font-medium">{payroll.socialSecurity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>ภาษีเงินได้หัก ณ ที่จ่าย (ภ.ง.ด.1)</span>
                  <span className="font-mono font-medium">{payroll.withholdingTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>หักขาด/ลา/มาสาย/อื่นๆ</span>
                  <span className="font-mono font-medium">{payroll.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center font-bold text-slate-900">
                  <span>รวมรายการหักทั้งสิ้น (Total Deductions)</span>
                  <span className="font-mono text-rose-700">{payroll.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
            <div>
              <span className="text-xs text-indigo-300 font-medium block">เงินได้สุทธิ (Net Payable Amount)</span>
              <span className="text-xs text-slate-300 italic">
                ({thaiBahtText(payroll.netSalary)})
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                ฿{payroll.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Signatures & Security Stamp */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
            <div className="text-center pt-8">
              <div className="w-36 border-b border-slate-400 mx-auto mb-1"></div>
              <p className="font-medium text-slate-700">ฝ่ายบุคคลและบัญชี (HR & Payroll)</p>
              <p className="text-[10px] text-slate-400">ผู้จัดทำและตรวจทานข้อมูล</p>
            </div>
            <div className="text-center pt-8">
              <div className="w-36 border-b border-slate-400 mx-auto mb-1"></div>
              <p className="font-medium text-slate-700">{payroll.employeeName}</p>
              <p className="text-[10px] text-slate-400">ผู้รับเงิน / พนักงาน</p>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-3">
            เอกสารนี้สร้างขึ้นโดยระบบอัตโนมัติ NNC HR System (Cloud Firestore Sync & 2FA Protected) ข้อมูลนี้เป็นความลับเฉพาะบุคคล
          </div>
        </div>
      </div>
    </div>
  );
};
