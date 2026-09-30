import React, { useState, useEffect } from 'react';
import { Briefcase, UserPlus, Phone, Mail, MapPin, Award, CheckCircle2, XCircle, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';
import { Counselor } from '../types';
import { useNotifications } from '../context/NotificationContext';

export const CounselorsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New counselor form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [spec, setSpec] = useState('Nepal & India');
  const [capacity, setCapacity] = useState('100');

  const fetchCounselors = async () => {
    setLoading(true);
    try {
      const data = await api.getCounselors();
      setCounselors(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: number, cName: string) => {
    try {
      await api.toggleCounselorActive(id, 'Admin');
      showToast(`Counselor ${cName} is now ${currentStatus === 1 ? 'Inactive' : 'Active'}`, 'success');
      fetchCounselors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;
    try {
      await api.createCounselor({
        name,
        email,
        phone,
        specialization_country: spec,
        max_capacity: parseInt(capacity, 10) || 100
      });
      showToast(`Counselor ${name} added successfully!`, 'success');
      setModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      fetchCounselors();
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
            <Briefcase className="w-5 h-5 text-blue-600" />
            Counselor Team &amp; Assignment Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage counseling advisors, toggle active availability for auto-distribution, and track conversion rates
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Counselor</span>
        </button>
      </div>

      {/* Counselor Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading counselor team...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {counselors.map(c => {
            let cities: string[] = [];
            try {
              cities = JSON.parse(c.assigned_cities || '[]');
            } catch (e) {}

            return (
              <div
                key={c.id}
                className={`p-5 rounded-2xl bg-white border transition-all space-y-4 shadow-xs ${
                  c.is_active === 1
                    ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    : 'border-slate-200/60 bg-slate-50/60 opacity-80'
                }`}
              >
                {/* Header: Name, Active Toggle */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{c.name}</h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.email}</div>
                    </div>
                  </div>

                  {/* Active Toggle (Section 9 requirement) */}
                  <button
                    onClick={() => handleToggleActive(c.id, c.is_active, c.name)}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      c.is_active === 1
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                    }`}
                    title={c.is_active === 1 ? 'Click to deactivate (leads will not be assigned)' : 'Click to activate for lead distribution'}
                  >
                    {c.is_active === 1 ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Specialization: <strong className="text-slate-800">{c.specialization_country || 'General'}</strong></span>
                  </div>
                </div>

                {/* Assigned Cities Tags */}
                {cities.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Assigned Cities
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cities.map((city, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Stats */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Active</div>
                    <div className="font-bold text-slate-900 mt-0.5">{c.current_active_leads}/{c.max_capacity}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Admissions</div>
                    <div className="font-bold text-emerald-700 mt-0.5">{c.total_admissions}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Conversion</div>
                    <div className="font-bold text-blue-700 mt-0.5">{c.conversion_rate}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Counselor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form onSubmit={handleCreate} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New Counselor</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Counselor Name"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="counselor@educationsansar.com"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+977 9801... or +91 9811..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Specialization</label>
                <input
                  type="text"
                  value={spec}
                  onChange={e => setSpec(e.target.value)}
                  placeholder="Nepal & North India"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={e => setCapacity(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Save Counselor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
