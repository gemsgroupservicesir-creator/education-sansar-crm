import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Users,
  Smartphone,
  Mail,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { BroadcastCampaign } from '../../types';

interface BroadcastApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: BroadcastCampaign | null;
  onSuccess: () => void;
  userName?: string;
}

export const BroadcastApprovalModal: React.FC<BroadcastApprovalModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onSuccess,
  userName = 'Super Admin'
}) => {
  const { addToast } = useNotifications();
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !campaign) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await api.approveBroadcastCampaign(campaign.id, userName);
      addToast(`Campaign "${campaign.name}" approved successfully!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Approval failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      addToast('Please provide a specific rejection reason for the counselor', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.rejectBroadcastCampaign(campaign.id, rejectionReason.trim(), userName);
      addToast(`Campaign "${campaign.name}" rejected with feedback.`, 'info');
      onSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Rejection failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Campaign Review &amp; Approval</h2>
              <p className="text-xs text-slate-500">Submitted by {campaign.submitted_by || campaign.created_by}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Campaign Overview Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{campaign.name}</span>
              <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-indigo-100 text-indigo-800">
                {campaign.channel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 font-medium">Target Deliverable:</span>{' '}
                <span className="font-bold text-slate-900">{campaign.total_targeted} Leads</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Timing:</span>{' '}
                <span className="font-bold text-slate-900">
                  {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : 'Immediate Dispatch'}
                </span>
              </div>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <div className="font-bold text-slate-800 uppercase text-[11px]">Message Content Preview</div>
            {campaign.subject && (
              <div className="p-2.5 rounded-xl bg-slate-100 font-bold text-slate-900">
                Subject: {campaign.subject}
              </div>
            )}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {campaign.content}
            </div>
          </div>

          {/* Rejection input area if rejecting */}
          {isRejecting && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in">
              <label className="font-bold text-rose-900 uppercase text-[11px]">
                Reason for Rejection <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain what needs adjustment (e.g. scholarship percentage mismatch, typos, update dates)..."
                className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div>
            {!isRejecting ? (
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-all"
              >
                Reject with Reason
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all"
              >
                Cancel Rejection
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRejecting ? (
              <button
                type="button"
                disabled={submitting}
                onClick={handleReject}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all shadow-sm"
              >
                Confirm Rejection
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleApprove}
                className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Campaign
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
