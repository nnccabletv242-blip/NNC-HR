import React, { useState } from 'react';
import { NotificationLog } from '../types';
import { Bell, Send, CheckCircle2, AlertCircle, Clock, Trash2, X, MessageSquare, ExternalLink } from 'lucide-react';
import { sendLineNotification } from '../services/api';

interface LineNotifyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NotificationLog[];
  onRefreshLogs: () => void;
  lineToken: string;
}

export const LineNotifyDrawer: React.FC<LineNotifyDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onRefreshLogs,
  lineToken
}) => {
  const [testMessage, setTestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMessage.trim()) return;

    setIsSending(true);
    setFeedback(null);

    const newLog: NotificationLog = {
      id: 'notif_manual_' + Date.now(),
      type: 'system_alert',
      title: '📢 ข้อความทดสอบ Line Notify จากระบบ NNC HR',
      message: testMessage,
      timestamp: new Date().toISOString(),
      status: 'sent',
      recipient: 'กลุ่มแจ้งเตือนพนักงาน (LINE Group)'
    };

    await sendLineNotification(newLog);
    setIsSending(false);
    setTestMessage('');
    setFeedback('ส่งข้อความแจ้งเตือนผ่าน Line สำเร็จแล้ว!');
    onRefreshLogs();
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <MessageSquare className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5">
                Line Notify Center
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              </h3>
              <p className="text-xs text-emerald-100/90">
                ระบบส่งการแจ้งเตือนอัตโนมัติถึงผู้บริหารและพนักงาน
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            เชื่อมต่อ Line Notify API สำเร็จ
          </span>
          <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">
            Token: {lineToken ? lineToken.slice(0, 8) + '...' : 'ACTIVE'}
          </span>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ประวัติการส่งแจ้งเตือน ({logs.length})
            </h4>
            <span className="text-[11px] text-slate-400">อัปเดตเรียลไทม์</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              ยังไม่มีประวัติการส่งแจ้งเตือน
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {log.title}
                  </span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/60 font-sans">
                  {log.message}
                </p>
                {log.recipient && (
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>ผู้รับ: <strong className="text-slate-600">{log.recipient}</strong></span>
                    <span className="text-emerald-600 font-medium">ส่งแล้ว (Delivered)</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Test Send Area */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            ทดสอบยิงข้อความ Line Notify ทันที
          </h4>

          {feedback && (
            <div className="mb-2 p-2 bg-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          <form onSubmit={handleSendTest} className="space-y-2">
            <textarea
              rows={2}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="พิมพ์ข้อความทดสอบแจ้งเตือน เช่น แจ้งเตือนประชุมด่วนฝ่ายบุคคล..."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none resize-none"
            />
            <button
              type="submit"
              disabled={isSending || !testMessage.trim()}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white font-medium text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? 'กำลังส่งแจ้งเตือน...' : 'ส่งแจ้งเตือนทดสอบเข้า Line'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
