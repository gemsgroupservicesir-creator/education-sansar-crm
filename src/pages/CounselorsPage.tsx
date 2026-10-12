import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Award,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Edit2,
  KeyRound,
  Trash2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  Percent
} from 'lucide-react';
import { api } from '../services/api';
import { Counselor } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const CounselorsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { currentRole } = useAuth();
  const isAdmin = currentRole === 'Super Admin' || currentRole === 'Admin';

  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Target counselor for edit/password/delete
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpec, setFormSpec] = useState('Nepal & India');
  const [formCapacity, setFormCapacity] = useState('100');
  const [formPassword, setFormPassword] = useState('counselor123');
  const [formCities, setFormCities] = useState('Kathmandu, Janakpur');
  const [formStatus, setFormStatus] = useState('Active');

  // Password Reset state
  const [newPassword, setNewPassword] = useState('');

  // Delete Reassignment state
  const [reassignTargetId, setReassignTargetId] = useState('');

  const fetchCounselors = async () => {
    setLoading(true);
    try {
      const data = await api.getCounselors();
      setCounselors(data);
    } catch (err: any) {
      addToast(err.message || 'Error loading counselors', 'error');
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
      addToast(`Counselor ${cName} is now ${currentStatus === 1 ? 'Inactive' : 'Active'}`, 'success');
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormSpec('Nepal & India');
    setFormCapacity('100');
    setFormPassword('counselor123');
    setFormCities('Kathmandu, Birgunj');
    setAddModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPhone) return;
    try {
      const citiesArray = formCities.split(',').map((c) => c.trim()).filter(Boolean);
      await api.createCounselor({
        name: formName,
        email: formEmail,
        phone: formPhone,
        specialization_country: formSpec,
        assigned_cities: citiesArray,
        max_capacity: parseInt(formCapacity, 10) || 100,
        password: formPassword || 'counselor123',
      });
      addToast(`Counselor ${formName} added with login credentials!`, 'success');
      setAddModalOpen(false);
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message || 'Failed to add counselor', 'error');
    }
  };

  const handleOpenEditModal = (c: Counselor) => {
    setSelectedCounselor(c);
    setFormName(c.name);
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setFormSpec(c.specialization_country || 'Nepal & India');
    setFormCapacity(String(c.max_capacity || 100));
    setFormStatus(c.is_active === 1 ? 'Active' : 'Inactive');
    try {
      const cities = JSON.parse(c.assigned_cities || '[]');
      setFormCities(cities.join(', '));
    } catch {
      setFormCities('');
    }
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselor) return;
    try {
      const citiesArray = formCities.split(',').map((c) => c.trim()).filter(Boolean);
      await api.updateCounselor(selectedCounselor.id, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        specialization_country: formSpec,
        assigned_cities: citiesArray,
        max_capacity: parseInt(formCapacity, 10) || 100,
        is_active: formStatus === 'Active' ? 1 : 0,
        status: formStatus,
      });
      addToast(`Counselor ${formName} updated successfully`, 'success');
      setEditModalOpen(false);
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message || 'Failed to update counselor', 'error');
    }
  };

  const handleOpenResetPwdModal = (c: Counselor) => {
    setSelectedCounselor(c);
    setNewPassword('');
    setResetPwdModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselor || !newPassword) return;
    try {
      await api.resetCounselorPassword(selectedCounselor.id, newPassword, 'Admin');
      addToast(`Login password updated for ${selectedCounselor.name}!`, 'success');
      setResetPwdModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to reset password', 'error');
    }
  };

  const handleOpenDeleteModal = (c: Counselor) => {
    setSelectedCounselor(c);
    const otherCounselor = counselors.find((other) => other.id !== c.id && other.is_active === 1);
    setReassignTargetId(otherCounselor?.id || '');
    setDeleteModalOpen(true);
  };

  const handleDeleteCounselor = async () => {
    if (!selectedCounselor) return;
    try {
      await api.deleteCounselor(selectedCounselor.id, reassignTargetId || undefined, 'Admin');
      addToast(`Counselor ${selectedCounselor.name} deleted successfully`, 'success');
      setDeleteModalOpen(false);
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete counselor', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Admissions Staff Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Counselor Management &amp; Assignment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Configure counselor team accounts, reset access credentials, toggle active workload distribution, and oversee individual conversion performance.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Counselor</span>
          </button>
        )}
      </div>

      {/* Counselor Cards Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading counselor team...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {counselors.map((c) => {
            let cities: string[] = [];
            try {
              cities = JSON.parse(c.assigned_cities || '[]');
            } catch (e) {}

            const isActive = c.is_active === 1;

            return (
              <div
                key={c.id}
                className={`p-5 rounded-2xl bg-white border transition-all space-y-4 shadow-xs flex flex-col justify-between ${
                  isActive
                    ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    : 'border-slate-200/60 bg-slate-50/70 opacity-85'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-900/20">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">{c.name}</h3>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.email}</div>
                      </div>
                    </div>

                    {/* Status Badge & Toggle */}
                    <button
                      onClick={() => handleToggleActive(c.id, c.is_active, c.name)}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                          : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title={isActive ? 'Click to deactivate from auto lead distribution' : 'Click to activate counselor'}
                    >
                      {isActive ? (
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

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Focus: <strong className="text-slate-800">{c.specialization_country || 'General'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Assigned Cities Tags */}
                  {cities.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Assigned Territory
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cities.map((city, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium"
                          >
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Indicators */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Leads</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {c.current_active_leads || 0} / {c.max_capacity}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Admissions</div>
                      <div className="font-bold text-emerald-700 mt-0.5">{c.total_admissions || 0}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Conversion</div>
                      <div className="font-bold text-blue-700 mt-0.5">{c.conversion_rate || 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Admin Actions Footer */}
                {isAdmin && (
                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Account Controls:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenResetPwdModal(c)}
                        className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="Reset counselor password"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Password</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="Edit counselor details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete counselor account"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Add Counselor Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Add New Counselor
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Suman Sharma"
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Login ID)</label>
              <input
                required
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="counselor@educationsansar.com"
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+977 9801..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
                <input
                  required
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Cities (Comma-separated)</label>
              <input
                type="text"
                value={formCities}
                onChange={(e) => setFormCities(e.target.value)}
                placeholder="e.g. Kathmandu, Pokhara, Birgunj"
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Specialization</label>
                <input
                  type="text"
                  value={formSpec}
                  onChange={(e) => setFormSpec(e.target.value)}
                  placeholder="Nepal & North India"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Capacity</label>
                <input
                  type="number"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Save Counselor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Edit Counselor Modal */}
      {editModalOpen && selectedCounselor && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Counselor Profile
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                required
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  required
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Cities</label>
              <input
                type="text"
                value={formCities}
                onChange={(e) => setFormCities(e.target.value)}
                placeholder="Comma separated"
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={formSpec}
                  onChange={(e) => setFormSpec(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Workload Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="Active">Active (Accepting Leads)</option>
                  <option value="Inactive">Inactive (Paused)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Reset Password Modal */}
      {resetPwdModalOpen && selectedCounselor && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form
            onSubmit={handleResetPassword}
            className="w-full max-w-sm bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setResetPwdModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter a new login password for counselor <strong>{selectedCounselor.name}</strong> ({selectedCounselor.email}):
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                required
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 4 characters"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetPwdModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Delete Counselor with Reassignment Modal */}
      {deleteModalOpen && selectedCounselor && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Counselor Account</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete {selectedCounselor.name}?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p>
                <strong>Lead Reassignment Policy:</strong> This counselor currently has{' '}
                <strong>{(selectedCounselor as any).total_leads_count || (selectedCounselor as any).current_active_leads || 0} leads</strong>.
              </p>
              <p>
                To avoid orphaned student leads, choose a counselor to inherit all assigned leads:
              </p>

              <div>
                <label className="block font-semibold text-amber-950 mb-1">Reassign leads to:</label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-white"
                >
                  <option value="">-- Select Target Counselor --</option>
                  {counselors
                    .filter((c) => c.id !== selectedCounselor.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCounselor}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Reassign &amp; Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
