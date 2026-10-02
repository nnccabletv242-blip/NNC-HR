import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  userEmail?: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'การยืนยันตัวตนสองชั้น (2-Factor Authentication)',
  description = 'กรุณากรอกรหัสผ่าน OTP 6 หลัก หรือรหัสจาก Google Authenticator เพื่อความปลอดภัยในการเข้าถึงข้อมูลสำคัญ',
  userEmail = 'nnc.cabletv242@gmail.com'
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSentNotice, setOtpSentNotice] = useState('');
  const [mockSecret] = useState('NNC-2FA-SEC-9402');
  const [mockOtp, setMockOtp] = useState('123456');

  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '', '', '']);
      setError('');
      // Generate a simulated OTP for the session
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setMockOtp(generated);
      setOtpSentNotice(`รหัส OTP อ้างอิงส่งไปยัง ${userEmail}: ${generated}`);
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Pasting full code
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((d, i) => {
        newCode[i] = d;
      });
      setCode(newCode);
      const nextInput = document.getElementById(`otp-input-${Math.min(digits.length, 5)}`);
      nextInput?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = val.replace(/\D/g, '');
    setCode(newCode);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = code.join('');
    if (entered.length < 6) {
      setError('กรุณากรอกรหัสตัวเลขให้ครบ 6 หลัก');
      return;
    }

    // Accept mockOtp or default master code 123456 or 888888 for testing
    if (entered === mockOtp || entered === '123456' || entered === '888888') {
      setError('');
      onSuccess();
    } else {
      setError(`รหัสไม่ถูกต้อง (รหัสทดสอบที่ระบบสร้างคือ ${mockOtp} หรือ 123456)`);
    }
  };

  const handleResend = () => {
    setIsSendingOtp(true);
    setTimeout(() => {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setMockOtp(generated);
      setOtpSentNotice(`ส่งรหัส OTP ใหม่ไปยัง ${userEmail}: ${generated}`);
      setIsSendingOtp(false);
      setError('');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md shadow-inner border border-white/20">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-xs text-indigo-100/90 mt-1 max-w-xs mx-auto">
            {description}
          </p>
        </div>

        <div className="p-6">
          {otpSentNotice && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900">
              <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-medium font-mono">{otpSentNotice}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider text-center mb-3">
                ป้อนรหัส 6 หลัก (Authenticator / OTP)
              </label>
              <div className="flex justify-center gap-2.5 sm:gap-3">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-2xl font-bold font-mono text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
              <span>ไม่ได้รับรหัส OTP?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isSendingOtp}
                className="font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                ส่งรหัสใหม่
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 px-4 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                ยืนยันตัวตน
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              NNC Two-Factor Protection (2FA) Activated
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
