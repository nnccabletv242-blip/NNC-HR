import React, { useState, useEffect } from 'react';
import { Employee, UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  CreditCard, 
  Clock, 
  Settings, 
  Bell, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  ChevronDown, 
  LogOut, 
  Menu, 
  X,
  UserCheck,
  Building
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: Employee;
  allEmployees: Employee[];
  onSwitchUser: (employee: Employee) => void;
  onOpenLineDrawer: () => void;
  unreadCount?: number;
  isTwoFactorVerified: boolean;
  onTriggerTwoFactorModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  allEmployees,
  onSwitchUser,
  onOpenLineDrawer,
  unreadCount = 2,
  isTwoFactorVerified,
  onTriggerTwoFactorModal
}) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'employees', label: 'ฐานข้อมูลพนักงาน', icon: Users },
    { id: 'leaves', label: 'ระบบการลา', icon: CalendarClock },
    { id: 'payroll', label: 'เงินเดือน & สลิป', icon: CreditCard },
    { id: 'attendance', label: 'ลงเวลาเข้า-ออก', icon: Clock },
    { id: 'settings', label: 'ตั้งค่า & Line', icon: Settings }
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200">Super Admin</span>;
      case 'hr_manager':
        return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">HR Manager</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">พนักงาน</span>;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => onSelectTab('dashboard')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                  NNC
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">NNC HR</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full border border-emerald-300">
                      Cloud Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    Human Resource Management System
                  </p>
                </div>
              </div>

              {/* Online/Offline Status */}
              <div className="hidden md:flex items-center pl-3 border-l border-slate-200 text-xs">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>ออนไลน์ (Firestore Sync)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>ออฟไลน์ (แคชในตัว)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right: Actions, 2FA, Line Notify, User profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* 2FA Security Badge */}
              <button
                onClick={onTriggerTwoFactorModal}
                title={isTwoFactorVerified ? '2FA ยืนยันตัวตนแล้ว' : 'คลิกเพื่อยืนยัน 2FA'}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  isTwoFactorVerified 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isTwoFactorVerified ? '2FA Active' : 'ยืนยัน 2FA'}</span>
              </button>

              {/* Line Notify Button */}
              <button
                onClick={onOpenLineDrawer}
                className="relative p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-200"
                title="ศูนย์แจ้งเตือน Line Notify"
              >
                <Bell className="w-5 h-5 text-emerald-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Switcher / Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-lg object-cover border border-indigo-200"
                  />
                  <div className="text-left hidden md:block pr-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                      {currentUser.fullName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {getRoleBadge(currentUser.role)}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        บัญชีที่กำลังใช้งาน
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {currentUser.fullName}
                      </p>
                      <p className="text-xs text-indigo-600 truncate font-mono">
                        {currentUser.email}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {currentUser.department} - {currentUser.position}
                      </p>
                    </div>

                    <div className="px-3 py-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-indigo-500" />
                        สลับบทบาททดสอบ (Quick Switch)
                      </p>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {allEmployees.map((emp) => (
                          <button
                            key={emp.id}
                            onClick={() => {
                              onSwitchUser(emp);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                              currentUser.id === emp.id
                                ? 'bg-indigo-50 text-indigo-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <img
                                src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                alt=""
                                className="w-6 h-6 rounded-md object-cover"
                              />
                              <div className="truncate">
                                <span className="block truncate">{emp.fullName}</span>
                                <span className="text-[10px] text-slate-400 block truncate">{emp.position}</span>
                              </div>
                            </div>
                            {getRoleBadge(emp.role)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 px-3">
                      <button
                        onClick={() => {
                          onSelectTab('settings');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        การตั้งค่าระบบ & สิทธิการใช้งาน
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Burger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (App-like feel for smart devices) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
