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
  Landmark,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { currentRole, logout } = useAuth();
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
    { name: 'University Fees', path: '/university-fees', icon: Landmark },
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

      {/* Sidebar Panel: Static on lg+ (in-flow, no overlap), Fixed on mobile drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 lg:static lg:translate-x-0 shrink-0 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-900/30 text-white font-bold text-lg shrink-0">
              ES
            </div>
            {!isCollapsed && (
              <div className="min-w-0 animate-in fade-in duration-200">
                <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5 truncate">
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
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse / Expand Toggle Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title={isCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
                aria-label="Toggle sidebar width"
              >
                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Target Market Indicator */}
        <div className={`py-2.5 bg-blue-950/40 border-b border-blue-900/30 flex items-center text-[11px] shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {!isCollapsed ? (
            <>
              <span className="text-slate-400 font-medium">Target Regions:</span>
              <span className="font-semibold text-blue-300 flex items-center gap-1">
                🇳🇵 Nepal &amp; 🇮🇳 India
              </span>
            </>
          ) : (
            <span className="text-base" title="Target: Nepal & India">
              🇳🇵🇮🇳
            </span>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {filteredNav.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center rounded-lg text-xs font-medium transition-all group relative ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse shrink-0">
                    {item.badge}
                  </span>
                )}

                {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                )}

                {!isCollapsed && (item.badge === undefined || item.badge === 0) && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & active role */}
        <div className={`border-t border-slate-800/80 bg-slate-950/50 shrink-0 ${isCollapsed ? 'p-2.5' : 'p-3.5'}`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}>
            <div className="flex items-center gap-2.5 min-w-0" title={`Active Role: ${currentRole}`}>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-blue-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white truncate">Active Role</div>
                  <div className="text-[11px] text-blue-400 font-semibold truncate">{currentRole}</div>
                </div>
              )}
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
