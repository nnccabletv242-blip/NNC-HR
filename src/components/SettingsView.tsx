import React, { useState } from 'react';
import { SystemSettings, Employee } from '../types';
import { 
  Settings, 
  MessageSquare, 
  ShieldCheck, 
  Building2, 
  Database, 
  CheckCircle2, 
  Save, 
  Send, 
  Key, 
  QrCode, 
  Copy, 
  RefreshCw 
} from 'lucide-react';
import { saveSettings, sendLineNotification } from '../services/api';

interface SettingsViewProps {
  settings: SystemSettings;
  currentUser: Employee;
  onRefreshSettings: () => void;
  onTriggerTwoFactorModal: () => void;
  isTwoFactorVerified: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onRefreshSettings,
  onTriggerTwoFactorModal,
  isTwoFactorVerified
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [testLineMsg, setTestLineMsg] = useState('');
  const [isTestingLine, setIsTestingLine] = useState(false);
  const [lineTestFeedback, setLineTestFeedback] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเปลี่ยนการตั้งค่าระบบได้');
      return;
    }

    setIsSaving(true);
    try {
      await saveSettings({
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setIsSaving(false);
      setSuccessMsg('บันทึกการตั้งค่าระบบและ Line Notify สำเร็จแล้ว!');
      onRefreshSettings();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleSendLineTest = async () => {
    if (!formData.lineToken) {
      setLineTestFeedback('กรุณาระบุ Line Notify Token ก่อนทดสอบส่ง');
      return;
    }
    setIsTestingLine(true);
    try {
      await sendLineNotification({
        id: 'test_' + Date.now(),
        type: 'system_alert',
        title: '🔔 ทดสอบการเชื่อมต่อ Line Notify สำเร็จ',
        message: testLineMsg || `ทดสอบแจ้งเตือนจากระบบ NNC HR โดย ${currentUser.fullName}\nเวลา: ${new Date().toLocaleTimeString('th-TH')}`,
        timestamp: new Date().toISOString(),
        status: 'sent',
        recipient: 'LINE Notify Group'
      });
      setIsTestingLine(false);
      setLineTestFeedback('ส่งข้อความทดสอบเข้า Line สำเร็จเรียบร้อยแล้ว!');
      setTimeout(() => setLineTestFeedback(''), 4000);
    } catch (err) {
      console.error(err);
      setIsTestingLine(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText('NNC-2FA-SEC-9921-HRMS');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          การตั้งค่าระบบ & การเชื่อมต่อ (System Settings)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          กำหนดค่า Line Notify, ระบบความปลอดภัย Two-Factor Authentication (2FA), ข้อมูลองค์กร และการซิงค์ข้อมูล Cloud Firestore
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Line Notify Integration */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">การเชื่อมต่อ Line Notify (Line Notification Hub)</h3>
                <p className="text-xs text-slate-400">ส่งแจ้งเตือนอัตโนมัติเมื่อมีการยื่นใบลา, การอนุมัติ และสรุปการจ่ายเงินเดือน</p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.lineNotifyEnabled}
                onChange={(e) => setFormData({ ...formData, lineNotifyEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Line Notify Access Token
              </label>
              <input
                type="text"
                value={formData.lineToken}
                onChange={(e) => setFormData({ ...formData, lineToken: e.target.value })}
                placeholder="กรอก Line Notify Personal Access Token หรือ Group Token"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-emerald-500 font-mono outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                สร้าง Token ได้ฟรีจาก <a href="https://notify-bot.line.me" target="_blank" rel="noreferrer" className="text-emerald-600 underline">notify-bot.line.me</a> แล้วนำมาวางที่นี่
              </p>
            </div>

            {/* Test Send Box */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <span className="font-bold text-xs text-emerald-900 block">
                ทดสอบส่งการแจ้งเตือนเข้า Line Notify
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testLineMsg}
                  onChange={(e) => setTestLineMsg(e.target.value)}
                  placeholder="พิมพ์ข้อความทดสอบ เช่น ทดสอบระบบแจ้งเตือน NNC HR..."
                  className="flex-1 p-2 text-xs bg-white border border-emerald-300 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSendLineTest}
                  disabled={isTestingLine}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isTestingLine ? 'ส่ง...' : 'ทดสอบส่ง'}
                </button>
              </div>
              {lineTestFeedback && (
                <p className="text-xs text-emerald-700 font-medium">{lineTestFeedback}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Two-Factor Authentication (2FA) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">ระบบยืนยันตัวตนสองชั้น (Two-Factor Authentication / 2FA)</h3>
              <p className="text-xs text-slate-400">เพิ่มความปลอดภัยสูงสุดในการดูสลิปเงินเดือนและคำนวณเงินเดือนผู้บริหาร</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block">สถานะการยืนยันตัวตน 2FA ปัจจุบัน</span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  isTwoFactorVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isTwoFactorVerified ? '✓ 2FA ได้รับการยืนยันแล้วในเซสชันนี้' : '⚠ ยังไม่ได้ยืนยันตัวตน 2FA'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                เมื่อต้องการอนุมัติจ่ายเงินเดือน หรือเข้าดูข้อมูลการเงินเชิงลึก ระบบจะเรียกขอรหัส 6 หลักเสมอ
              </p>
              <button
                type="button"
                onClick={onTriggerTwoFactorModal}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                เปิดหน้าต่างป้อนรหัส 2FA
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">คีย์สำรองสำหรับ Google Authenticator (TOTP)</span>
              <div className="flex items-center gap-2">
                <code className="p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono font-bold flex-1 truncate">
                  NNC-2FA-SEC-9921-HRMS
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-600 transition-colors"
                  title="คัดลอกคีย์"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiedKey && <span className="text-[11px] text-emerald-600 font-medium">คัดลอกคีย์เรียบร้อยแล้ว!</span>}
              <p className="text-[11px] text-slate-400">
                นำคีย์นี้ไปเพิ่มใน Google Authenticator หรือ Microsoft Authenticator บนโทรศัพท์มือถือของคุณ
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Company Profile & Rates */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">ข้อมูลองค์กรและพารามิเตอร์การคำนวณเงินเดือน</h3>
              <p className="text-xs text-slate-400">หัวเอกสารสลิปเงินเดือนและอัตราหักประกันสังคมตามกฎหมายไทย</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อองค์กร / บริษัท *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เลขประจำตัวผู้เสียภาษีอากร *
              </label>
              <input
                type="text"
                required
                value={formData.companyTaxId}
                onChange={(e) => setFormData({ ...formData, companyTaxId: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:border-indigo-600 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ที่ตั้งสำนักงานใหญ่
              </label>
              <input
                type="text"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                อัตราเงินสมทบประกันสังคม (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.socialSecurityRate * 100}
                onChange={(e) => setFormData({ ...formData, socialSecurityRate: Number(e.target.value) / 100 })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เพดานเงินสมทบประกันสังคมสูงสุด (บาท)
              </label>
              <input
                type="number"
                value={formData.maxSocialSecurityAmount}
                onChange={(e) => setFormData({ ...formData, maxSocialSecurityAmount: Number(e.target.value) })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:border-indigo-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Cloud Infrastructure Info */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
          <div className="flex items-center gap-2.5 mb-3">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm">การเชื่อมต่อฐานข้อมูล Firebase Cloud Firestore</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-indigo-300 block">Database Project</span>
              <span className="font-mono font-bold text-white">NNC HR (gen-lang-client-0565829551)</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-indigo-300 block">Firestore Database ID</span>
              <span className="font-mono font-bold text-white truncate block">ai-studio-4e2e6ced-1f46-4a65-91cd-ad64f6734ea5</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-indigo-300 block">Authentication Method</span>
              <span className="font-mono font-bold text-white">Google OAuth & Gmail (@gmail.com)</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าทั้งหมด'}
            </button>
          </div>
        )}

      </form>
    </div>
  );
};
