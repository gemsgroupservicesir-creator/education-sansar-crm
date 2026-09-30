import React, { useState } from 'react';
import { 
  Bell, CheckCircle, Clock, AlertTriangle, FileText, 
  UserCheck, DollarSign, Award, ExternalLink, CheckCheck 
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.is_read === 0;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LEAD_ASSIGNED':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      case 'FOLLOWUP_DUE':
      case 'FOLLOWUP_OVERDUE':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'DOCUMENT_PENDING':
      case 'DOCUMENT_VERIFIED':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'APPLICATION_SUBMITTED':
      case 'OFFER_LETTER':
        return <Award className="w-5 h-5 text-indigo-600" />;
      case 'FEE_PAYMENT':
      case 'ADMISSION_CONFIRMED':
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (notif.is_read === 0) {
      await markAsRead(notif.id);
    }
    if (notif.lead_id) {
      navigate(`/leads/${notif.lead_id}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
              <p className="text-sm text-gray-500">
                Real-time updates on student lead assignments, follow-ups, and admissions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-3.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
              filter === 'unread'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-b-xl border border-gray-200 border-t-0 shadow-sm divide-y divide-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No {filter === 'unread' ? 'unread ' : ''}notifications at this time.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 flex items-start gap-4 transition cursor-pointer hover:bg-gray-50 ${
                n.is_read === 0 ? 'bg-blue-50/40' : 'bg-white'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-gray-100 shrink-0 mt-0.5">
                {getNotificationIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-semibold truncate ${n.is_read === 0 ? 'text-blue-900 font-bold' : 'text-gray-900'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {new Date(n.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>

                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  {n.lead_id && (
                    <span className="text-blue-600 font-medium flex items-center gap-1 hover:underline">
                      <ExternalLink className="w-3 h-3" /> View Student Lead
                    </span>
                  )}
                  {n.is_read === 0 && (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600" title="Unread"></span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
