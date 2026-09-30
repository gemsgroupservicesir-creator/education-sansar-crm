import React, { useState } from 'react';
import {
  Menu,
  Search,
  Plus,
  Bell,
  User as UserIcon,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
  onOpenCreateLead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenSearch,
  onOpenCreateLead
}) => {
  const { user, currentRole, switchRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const availableRoles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Counselor',
    'Telecaller',
    'Marketing Manager',
    'Management'
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Global Search trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Trigger) */}
        <div
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer border border-transparent hover:border-slate-300 transition-all"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="flex-1 truncate">
            Search student, phone, email, lead ID, university...
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Demo Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Demo System (Pre-loaded)</span>
        </div>

        {/* Quick Add Lead Button */}
        <button
          onClick={onOpenCreateLead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Lead</span>
        </button>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-all"
            title="Switch demo persona to test RBAC permissions"
          >
            <span className="text-[11px] text-slate-500 hidden sm:inline">Role:</span>
            <span className="font-semibold text-blue-700">{currentRole}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Switch Role Persona
              </div>
              {availableRoles.map(r => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                    currentRole === r ? 'font-bold text-blue-600 bg-blue-50/60' : 'text-slate-700'
                  }`}
                >
                  <span>{r}</span>
                  {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xs text-slate-900">Notifications</h3>
                  <p className="text-[11px] text-slate-500">{unreadCount} unread updates</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                        n.is_read === 0 ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {n.type === 'FOLLOWUP_OVERDUE' ? (
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          ) : n.type === 'ADMISSION_CONFIRMED' ? (
                            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-xs">{n.title}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                            {n.message}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">{n.created_at}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
              {user?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
              {user?.email || 'admin@educationsansar.com'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
