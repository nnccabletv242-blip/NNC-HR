import React, { useState, useEffect } from 'react';
import { Attendance, Employee } from '../types';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Navigation, 
  UserCheck, 
  History, 
  ChevronRight 
} from 'lucide-react';
import { clockIn, clockOut } from '../services/api';

interface AttendanceViewProps {
  attendances: Attendance[];
  employees: Employee[];
  currentUser: Employee;
  onRefreshAttendances: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendances,
  employees,
  currentUser,
  onRefreshAttendances
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userLocation, setUserLocation] = useState<string>('NNC Tower HQ (13.7367° N, 100.5231° E)');
  const [isLocating, setIsLocating] = useState(false);
  const [isClocking, setIsClocking] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Live clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Try fetching actual geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          setUserLocation(`พิกัดจริง: ${lat}° N, ${lng}° E (เสาหลัก NNC HQ)`);
        },
        () => {
          setUserLocation('NNC Tower HQ (13.7367° N, 100.5231° E)');
        }
      );
    }
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayRecord = attendances.find(a => a.employeeId === currentUser.id && a.date === todayStr);

  const handleClockInAction = async () => {
    setIsClocking(true);
    try {
      await clockIn(currentUser.id, currentUser.fullName, userLocation);
      setIsClocking(false);
      setSuccessMsg('บันทึกเวลาเข้างานสำเร็จเรียบร้อยแล้ว!');
      onRefreshAttendances();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setIsClocking(false);
    }
  };

  const handleClockOutAction = async () => {
    if (!myTodayRecord) return;
    setIsClocking(true);
    try {
      await clockOut(myTodayRecord.id, userLocation);
      setIsClocking(false);
      setSuccessMsg('บันทึกเวลาเลิกงาน (Clock Out) สำเร็จแล้ว! เดินทางกลับโดยสวัสดิภาพครับ');
      onRefreshAttendances();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setIsClocking(false);
    }
  };

  // Filter records by selected date
  const filteredRecords = attendances.filter(a => a.date === selectedDate);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            ระบบลงเวลาเข้า-ออกงาน (Time & Attendance)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            เช็คอินด้วยพิกัด GPS อัตโนมัติ ตรวจสอบการมาสาย โอที และประวัติการทำงานแบบเรียลไทม์
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">ดูประวัติวันที่:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 outline-none"
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Clock In / Out Smart Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Terminal Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-semibold text-indigo-200 border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                NNC Time Clock Active
              </span>
              <span className="text-xs text-slate-300">
                {currentTime.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Big Live Digital Clock */}
            <div className="my-6 text-center">
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-emerald-400 drop-shadow-sm">
                {currentTime.toLocaleTimeString('th-TH')}
              </div>
              <p className="text-xs text-indigo-200 mt-2">
                เวลาเข้างานมาตรฐาน: 08:30 - 09:00 น. | เลิกงาน: 17:30 น.
              </p>
            </div>

            {/* GPS Location & Radius status */}
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-indigo-100 flex items-center gap-2.5 mb-6">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="block font-semibold text-white">จุดลงเวลา (Location Geofence)</span>
                <span className="text-[11px] text-indigo-200 truncate block">{userLocation}</span>
              </div>
            </div>
          </div>

          {/* Action Button Section */}
          <div className="space-y-3">
            {!myTodayRecord ? (
              <button
                onClick={handleClockInAction}
                disabled={isClocking}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Clock className="w-5 h-5" />
                {isClocking ? 'กำลังบันทึกเวลา...' : 'ลงเวลาเข้างาน (CLOCK IN)'}
              </button>
            ) : !myTodayRecord.clockOutTime ? (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs">
                  <span className="text-emerald-300 font-semibold block">
                    คุณลงเวลาเข้างานแล้วเมื่อ {myTodayRecord.clockInTime} น.
                  </span>
                  <span className="text-[10px] text-slate-300">
                    สถานะ: {myTodayRecord.status === 'on_time' ? 'ตรงเวลา' : 'มาสาย'}
                  </span>
                </div>
                <button
                  onClick={handleClockOutAction}
                  disabled={isClocking}
                  className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Clock className="w-5 h-5" />
                  {isClocking ? 'กำลังบันทึกเวลา...' : 'ลงเวลาเลิกงาน (CLOCK OUT)'}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-white/10 rounded-2xl text-center text-xs border border-white/20">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-1" />
                <span className="font-bold text-emerald-300 block text-sm">
                  คุณลงเวลาครบทั้งเข้าและออกงานแล้วในวันนี้
                </span>
                <span className="text-[11px] text-slate-300">
                  เข้า: {myTodayRecord.clockInTime} น. | ออก: {myTodayRecord.clockOutTime} น.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Attendance Records for selected date */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  รายชื่อพนักงานที่ลงเวลาประจำวัน ({filteredRecords.length} คน)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  วันที่: {selectedDate}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ยังไม่มีการลงเวลาในวันที่ {selectedDate}
                </div>
              ) : (
                filteredRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition-all flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">{rec.employeeName}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {rec.clockInLocation || 'สำนักงานใหญ่ NNC'}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-800">
                        เข้า: {rec.clockInTime} น.
                        {rec.clockOutTime && <span className="text-slate-500 ml-1.5">| ออก: {rec.clockOutTime} น.</span>}
                      </div>
                      <div className="mt-0.5">
                        {rec.status === 'on_time' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ตรงเวลา
                          </span>
                        )}
                        {rec.status === 'late' && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            มาสาย
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>ตรงเวลา: {filteredRecords.filter(r => r.status === 'on_time').length}</span>
            <span>มาสาย: {filteredRecords.filter(r => r.status === 'late').length}</span>
            <span>รวมทั้งหมด: {filteredRecords.length} รายการ</span>
          </div>

        </div>

      </div>

    </div>
  );
};
