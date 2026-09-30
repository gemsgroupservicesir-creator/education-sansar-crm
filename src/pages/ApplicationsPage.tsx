import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { api } from '../services/api';
import { Application, ApplicationStatus } from '../types';
import { useNotifications } from '../context/NotificationContext';

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [counselors, setCounselors] = useState<any[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getApplications({
        search,
        status,
        counselorId: selectedCounselor,
      });
      setApplications(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCounselors().then(setCounselors).catch(() => {});
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [status, selectedCounselor]);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await api.updateApplication(appId, { application_status: newStatus });
      showToast(`Application status updated to ${newStatus}`, 'success');
      fetchApplications();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handlePaymentToggle = async (appId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      await api.updateApplication(appId, { payment_status: newStatus });
      showToast(`Payment marked as ${newStatus}`, 'success');
      fetchApplications();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            University Applications
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
              {applications.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track multi-university student filings, application deadlines &amp; provisional offer letters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export/applications"
            download
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Export Applications
          </a>
          <button
            onClick={fetchApplications}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchApplications()}
            placeholder="Search student or application number..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All Application Statuses</option>
            <option value="Application Started">Application Started</option>
            <option value="Documents Pending">Documents Pending</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Offer Received">Offer Received</option>
            <option value="Fee Pending">Fee Pending</option>
            <option value="Fee Paid">Fee Paid</option>
            <option value="Admission Confirmed">Admission Confirmed</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={selectedCounselor}
            onChange={e => setSelectedCounselor(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All Counselors</option>
            {counselors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {(search || status || selectedCounselor) && (
            <button
              onClick={() => {
                setSearch('');
                setStatus('');
                setSelectedCounselor('');
              }}
              className="px-2 py-1 text-xs text-rose-600 font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No applications match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">App ID</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">University &amp; Course</th>
                  <th className="py-3 px-4 font-semibold">Filed Date</th>
                  <th className="py-3 px-4 font-semibold">Fee &amp; Payment</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Counselor</th>
                  <th className="py-3 px-4 font-semibold text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {app.application_id}
                      {app.application_number && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: {app.application_number}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{app.student_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{app.student_phone}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="font-semibold text-slate-900 truncate" title={app.university_name}>
                        {app.university_name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={app.course_name}>
                        {app.course_name}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      <div>{app.application_date}</div>
                      {app.deadline && (
                        <div className="text-[10px] text-amber-700 font-semibold">
                          Deadline: {app.deadline}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">₹{app.application_fee}</div>
                      <button
                        onClick={() => handlePaymentToggle(app.id, app.payment_status)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          app.payment_status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {app.payment_status}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={app.application_status}
                        onChange={e => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Application Started">Application Started</option>
                        <option value="Documents Pending">Documents Pending</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Offer Received">Offer Received</option>
                        <option value="Fee Pending">Fee Pending</option>
                        <option value="Fee Paid">Fee Paid</option>
                        <option value="Admission Confirmed">Admission Confirmed 🎉</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {app.counselor_name || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/leads/${app.lead_id}`)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        title="View Student Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
