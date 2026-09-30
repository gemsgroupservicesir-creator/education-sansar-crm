import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Search, Download, Eye, RefreshCw, Phone, Mail, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { Student } from '../types';
import { useNotifications } from '../context/NotificationContext';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents({ search });
      setStudents(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Enrolled Students
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
              {students.length} Confirmed
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formally enrolled students converted from admission confirmed leads. Complete CRM history preserved.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/export/students"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Students CSV</span>
          </a>
          <button
            onClick={fetchStudents}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStudents()}
            placeholder="Search by student ID, name, phone, university..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading enrolled student records...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No enrolled students found. Leads automatically appear here when status hits "Admission Confirmed".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student ID</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">Enrolled University &amp; Program</th>
                  <th className="py-3 px-4 font-semibold">Admission Date</th>
                  <th className="py-3 px-4 font-semibold">Fee Paid</th>
                  <th className="py-3 px-4 font-semibold">Counselor</th>
                  <th className="py-3 px-4 font-semibold text-right">View History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {s.student_id}
                      {s.is_demo === 1 && (
                        <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-sans">
                          DEMO
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.student_name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{s.city}, {s.country}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div>{s.phone}</div>
                      <div className="text-[10px] text-slate-400">{s.email}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="font-semibold text-slate-900 truncate" title={s.university}>
                        {s.university}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={s.course}>
                        {s.course}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {s.admission_date}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        ₹{s.fee_paid.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {s.counselor_name || 'Assigned Staff'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/leads/${s.lead_id}`)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        title="View Full Historical Profile"
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
