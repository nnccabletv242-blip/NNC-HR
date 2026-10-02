import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  LeaveRequest, 
  Payroll, 
  Attendance, 
  SystemSettings, 
  NotificationLog 
} from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVES, 
  INITIAL_PAYROLLS, 
  INITIAL_ATTENDANCES, 
  INITIAL_SETTINGS 
} from './lib/seedData';
import { 
  testConnection, 
  auth, 
  googleProvider 
} from './lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  initializeDatabaseIfEmpty, 
  fetchEmployees, 
  fetchLeaves, 
  fetchPayrolls, 
  fetchAttendances, 
  fetchSettings, 
  getNotificationLogs,
  clockIn 
} from './services/api';

import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { EmployeeView } from './components/EmployeeView';
import { LeaveView } from './components/LeaveView';
import { PayrollView } from './components/PayrollView';
import { AttendanceView } from './components/AttendanceView';
import { SettingsView } from './components/SettingsView';
import { PayslipModal } from './components/PayslipModal';
import { TwoFactorModal } from './components/TwoFactorModal';
import { LineNotifyDrawer } from './components/LineNotifyDrawer';
import { Loader2, LogIn } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // App Data States
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(INITIAL_LEAVES);
  const [payrolls, setPayrolls] = useState<Payroll[]>(INITIAL_PAYROLLS);
  const [attendances, setAttendances] = useState<Attendance[]>(INITIAL_ATTENDANCES);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  // Auth & User States
  // Default to Super Admin nnc.cabletv242@gmail.com
  const [currentUser, setCurrentUser] = useState<Employee>(INITIAL_EMPLOYEES[0]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Security & Modals
  const [isTwoFactorVerified, setIsTwoFactorVerified] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);
  const [isLineDrawerOpen, setIsLineDrawerOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Load data on start
  const reloadData = async () => {
    try {
      const [empList, leaveList, payList, attList, sett] = await Promise.all([
        fetchEmployees(),
        fetchLeaves(),
        fetchPayrolls(),
        fetchAttendances(),
        fetchSettings()
      ]);
      setEmployees(empList);
      setLeaves(leaveList);
      setPayrolls(payList);
      setAttendances(attList);
      setSettings(sett);
      setNotificationLogs(getNotificationLogs());
    } catch (e) {
      console.warn('Error loading HRMS data:', e);
    }
  };

  useEffect(() => {
    async function init() {
      await testConnection();
      await initializeDatabaseIfEmpty();
      await reloadData();
      setLoading(false);
    }
    init();

    // Listen to Firebase auth
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setFirebaseUser(usr);
      if (usr && usr.email) {
        // Check if employee matches the email
        const matched = employees.find(e => e.email.toLowerCase() === usr.email?.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
        } else if (usr.email === 'nnc.cabletv242@gmail.com') {
          setCurrentUser(INITIAL_EMPLOYEES[0]);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        const matched = employees.find(e => e.email.toLowerCase() === result.user.email?.toLowerCase());
        if (matched) {
          setCurrentUser(matched);
        } else if (result.user.email === 'nnc.cabletv242@gmail.com') {
          setCurrentUser(INITIAL_EMPLOYEES[0]);
        }
      }
    } catch (err) {
      console.warn('Google sign-in popup closed or fallback:', err);
    }
  };

  const handleSwitchUser = (emp: Employee) => {
    setCurrentUser(emp);
    // If the employee doesn't have 2FA enabled, keep verified, else let them test 2FA
    if (!emp.twoFactorEnabled) {
      setIsTwoFactorVerified(true);
    } else {
      setIsTwoFactorVerified(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-500/20 mb-4 animate-bounce">
          NNC
        </div>
        <div className="flex items-center gap-2 text-indigo-300 font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>กำลังเชื่อมต่อฐานข้อมูล NNC HR (Cloud Firestore)...</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Project: NNC HR • Real-time Sync & 2FA Engine
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Top Banner for Google Auth / Account sync */}
      <div className="bg-slate-900 text-white px-4 py-1.5 text-[11px] flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-slate-300">
            ระบบ HRMS องค์กร: {settings.companyName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {firebaseUser ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-300 hidden sm:inline">เข้าสู่ระบบด้วย Gmail:</span>
              <span className="font-bold text-indigo-300 font-mono">{firebaseUser.email}</span>
              <button 
                onClick={() => signOut(auth)}
                className="text-slate-400 hover:text-white underline text-[10px]"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-1 font-semibold text-indigo-300 hover:text-white transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบด้วย Gmail (@gmail.com)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentUser={currentUser}
        allEmployees={employees}
        onSwitchUser={handleSwitchUser}
        onOpenLineDrawer={() => setIsLineDrawerOpen(true)}
        unreadCount={notificationLogs.length}
        isTwoFactorVerified={isTwoFactorVerified}
        onTriggerTwoFactorModal={() => setIsTwoFactorModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 lg:pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            employees={employees}
            leaves={leaves}
            payrolls={payrolls}
            attendances={attendances}
            currentUser={currentUser}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
            onOpenClockIn={() => setCurrentTab('attendance')}
            onSelectPayroll={(p) => setSelectedPayslip(p)}
          />
        )}

        {currentTab === 'employees' && (
          <EmployeeView
            employees={employees}
            currentUser={currentUser}
            onRefreshEmployees={reloadData}
            onOpenPayslipForEmployee={(empId) => {
              const matched = payrolls.find(p => p.employeeId === empId);
              if (matched) setSelectedPayslip(matched);
            }}
          />
        )}

        {currentTab === 'leaves' && (
          <LeaveView
            leaves={leaves}
            employees={employees}
            currentUser={currentUser}
            onRefreshLeaves={reloadData}
            isOpenRequestModal={isLeaveModalOpen}
            onCloseRequestModal={() => setIsLeaveModalOpen(false)}
          />
        )}

        {currentTab === 'payroll' && (
          <PayrollView
            payrolls={payrolls}
            employees={employees}
            currentUser={currentUser}
            onRefreshPayrolls={reloadData}
            onSelectPayslip={(p) => setSelectedPayslip(p)}
            isTwoFactorVerified={isTwoFactorVerified}
            onTriggerTwoFactorModal={() => setIsTwoFactorModalOpen(true)}
          />
        )}

        {currentTab === 'attendance' && (
          <AttendanceView
            attendances={attendances}
            employees={employees}
            currentUser={currentUser}
            onRefreshAttendances={reloadData}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            currentUser={currentUser}
            onRefreshSettings={reloadData}
            onTriggerTwoFactorModal={() => setIsTwoFactorModalOpen(true)}
            isTwoFactorVerified={isTwoFactorVerified}
          />
        )}
      </main>

      {/* Global Modals & Drawers */}
      <TwoFactorModal
        isOpen={isTwoFactorModalOpen}
        onClose={() => setIsTwoFactorModalOpen(false)}
        onSuccess={() => {
          setIsTwoFactorVerified(true);
          setIsTwoFactorModalOpen(false);
        }}
        userEmail={currentUser.email}
      />

      <PayslipModal
        isOpen={selectedPayslip !== null}
        onClose={() => setSelectedPayslip(null)}
        payroll={selectedPayslip}
      />

      <LineNotifyDrawer
        isOpen={isLineDrawerOpen}
        onClose={() => setIsLineDrawerOpen(false)}
        logs={notificationLogs}
        onRefreshLogs={() => setNotificationLogs(getNotificationLogs())}
        lineToken={settings.lineToken}
      />

    </div>
  );
}
