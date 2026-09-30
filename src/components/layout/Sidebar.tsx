import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Kanban,
  CalendarClock,
  GraduationCap,
  Award,
  Building2,
  BookOpen,
  Briefcase,
  Megaphone,
  BarChart3,
  FileText,
  Bell,
  Sliders,
  Settings as SettingsIcon,
  ChevronRight,
  ShieldCheck,
  MapPin,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentRole } = useAuth();
  const { unreadCount } = useNotifications();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'My Leads', path: '/my-leads', icon: UserCheck, roles: ['Super Admin', 'Admin', 'Counselor', 'Telecaller'] },
    { name: 'Admission Pipeline', path: '/pipeline', icon: Kanban },
    { name: 'Follow-ups', path: '/followups', icon: CalendarClock },
    { name: 'Applications', path: '/applications', icon: GraduationCap },
    { name: 'Students', path: '/students', icon: Award },
    { name: 'Universities', path: '/universities', icon: Building2 },
    { name: 'Courses', path: '/courses', icon: BookOpen },
    { name: 'Counselors', path: '/counselors', icon: Briefcase, roles: ['Super Admin', 'Admin', 'Management'] },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone, roles: ['Super Admin', 'Admin', 'Marketing Manager', 'Management'] },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Integrations', path: '/integrations', icon: Sliders, roles: ['Super Admin'] },
    { name: 'Settings', path: '/settings', icon: SettingsIcon, roles: ['Super Admin', 'Admin'] },
  ];

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(currentRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-900/30 text-white font-bold text-lg">
              ES
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                Education Sansar
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/20">
                  CRM
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                Sector 94, Noida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Market Indicator */}
        <div className="px-5 py-2.5 bg-blue-950/40 border-b border-blue-900/30 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Target Regions:</span>
          <span className="font-semibold text-blue-300 flex items-center gap-1">
            🇳🇵 Nepal &amp; 🇮🇳 India
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & active role */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-white truncate">Active Role</div>
              <div className="text-[11px] text-blue-400 font-semibold truncate">{currentRole}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
