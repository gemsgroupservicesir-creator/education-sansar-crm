import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, UserCheck, ArrowRight, GitMerge, PlusCircle, X } from 'lucide-react';
import { Lead } from '../../types';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  duplicates: Lead[];
  reasons: string[];
  onClose: () => void;
  onCreateAnyway: () => void;
  onMergeLead?: (existingLeadId: string) => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  duplicates,
  reasons,
  onClose,
  onCreateAnyway,
  onMergeLead
}) => {
  const navigate = useNavigate();

  if (!isOpen || duplicates.length === 0) return null;

  const existing = duplicates[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-900">Possible duplicate lead found</h2>
              <p className="text-xs text-amber-700">A lead with identical contact information already exists.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-amber-500 hover:text-amber-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Match Reasons */}
          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1">
              Match Reasons
            </div>
            <ul className="text-xs text-amber-900 space-y-0.5 list-disc list-inside">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Existing Lead Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>{existing.student_name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">
                  {existing.lead_id}
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                {existing.lead_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Phone:</span> {existing.phone}
              </div>
              <div>
                <span className="text-slate-400">WhatsApp:</span> {existing.whatsapp_number}
              </div>
              <div>
                <span className="text-slate-400">Email:</span> {existing.email || 'N/A'}
              </div>
              <div>
                <span className="text-slate-400">City:</span> {existing.city}, {existing.country}
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Interested in:</span> {existing.preferred_course} at {existing.preferred_university}
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Assigned Counselor:</span>{' '}
                <span className="font-medium text-slate-900">
                  {existing.assigned_counselor_name || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Warning notice */}
          <p className="text-[11px] text-slate-500 italic">
            To maintain clean data and prevent conflicting counselor outreach, review the existing student profile before creating a new duplicate.
          </p>

          {/* Action Buttons: Section 8 requirements */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                onClose();
                navigate(`/leads/${existing.id}`);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              <span>View Existing Lead</span>
            </button>

            <button
              onClick={() => {
                if (onMergeLead) onMergeLead(existing.id);
                else {
                  onClose();
                  navigate(`/leads/${existing.id}`);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300"
            >
              <GitMerge className="w-4 h-4" />
              <span>Merge Lead</span>
            </button>

            <button
              onClick={onCreateAnyway}
              className="px-3.5 py-2.5 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-semibold border border-rose-200"
            >
              <span>Create Anyway</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
