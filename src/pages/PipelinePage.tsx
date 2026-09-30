import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Kanban as KanbanIcon,
  ChevronRight,
  Flame,
  Sun,
  Snowflake,
  Phone,
  MessageCircle,
  Eye,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { Lead, LeadStatus, LeadTemperature } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { CreateLeadModal } from '../components/common/CreateLeadModal';

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const columns: { status: LeadStatus; label: string; estValue: number }[] = [
    { status: 'New Lead', label: 'New Lead', estValue: 50000 },
    { status: 'Contacted', label: 'Contacted', estValue: 75000 },
    { status: 'Counseling Scheduled', label: 'Counseling Scheduled', estValue: 100000 },
    { status: 'Counseling Done', label: 'Counseling Done', estValue: 125000 },
    { status: 'Interested', label: 'Interested', estValue: 150000 },
    { status: 'Application Started', label: 'Application Started', estValue: 200000 },
    { status: 'Documents Pending', label: 'Documents Pending', estValue: 220000 },
    { status: 'Application Submitted', label: 'Application Submitted', estValue: 250000 },
    { status: 'Offer Received', label: 'Offer Received', estValue: 300000 },
    { status: 'Fee Pending', label: 'Fee Pending', estValue: 350000 },
    { status: 'Fee Paid', label: 'Fee Paid', estValue: 400000 },
    { status: 'Admission Confirmed', label: 'Admission Confirmed 🎉', estValue: 500000 },
    { status: 'Enrolled', label: 'Enrolled', estValue: 500000 },
    { status: 'Lost', label: 'Lost', estValue: 0 },
  ];

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.getLeads({ limit: 150 });
      setLeads(res.data);
    } catch (err: any) {
      showToast('Error loading pipeline: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const moveStage = async (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.lead_status === newStatus) return;

    // Optimistic UI update
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, lead_status: newStatus } : l))
    );

    try {
      await api.updateLead(leadId, { lead_status: newStatus });
      showToast(`Moved ${lead.student_name} to ${newStatus}`, 'success');
      fetchLeads();
    } catch (err: any) {
      showToast(err.message || 'Stage update failed', 'error');
      fetchLeads();
    }
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStatus: LeadStatus) => {
    if (draggedLeadId) {
      moveStage(draggedLeadId, targetStatus);
      setDraggedLeadId(null);
    }
  };

  const tempBadge = (t: LeadTemperature) => {
    if (t === 'HOT') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
          <Flame className="w-3 h-3" /> HOT
        </span>
      );
    }
    if (t === 'WARM') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
          <Sun className="w-3 h-3" /> WARM
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
        <Snowflake className="w-3 h-3" /> COLD
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <KanbanIcon className="w-5 h-5 text-blue-600" />
            Admission Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag cards between stages. Automatic activity logging, document triggers &amp; student conversion apply.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            title="Refresh pipeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto pb-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            Loading Admission Pipeline...
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max items-start">
            {columns.map(col => {
              const colLeads = leads.filter(l => l.lead_status === col.status);
              const totalColValue = colLeads.length * col.estValue;

              return (
                <div
                  key={col.status}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(col.status)}
                  className="kanban-col bg-slate-100/80 rounded-2xl p-3 flex flex-col max-h-full border border-slate-200/80 shadow-2xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80">
                    <div>
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <span className="truncate max-w-[170px]">{col.label}</span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {colLeads.length}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Est. ₹{(totalColValue / 100000).toFixed(1)}L
                      </div>
                    </div>
                  </div>

                  {/* Cards Scroll Area */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {colLeads.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400">
                        Drop leads here
                      </div>
                    ) : (
                      colLeads.map(lead => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => handleDragStart(lead.id)}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5 group"
                        >
                          {/* Card Top: Name & Temp */}
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                                {lead.student_name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {lead.lead_id} · {lead.city}
                              </div>
                            </div>
                            {tempBadge(lead.lead_temperature)}
                          </div>

                          {/* Academic / Preference */}
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <div className="font-semibold text-slate-800 truncate" title={lead.preferred_course}>
                              {lead.preferred_course}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate" title={lead.preferred_university}>
                              {lead.preferred_university}
                            </div>
                          </div>

                          {/* Counselor & Contact */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <div className="text-slate-500 truncate max-w-[110px]" title={lead.assigned_counselor_name}>
                              👤 {lead.assigned_counselor_name ? lead.assigned_counselor_name.split(' ')[0] : 'Unassigned'}
                            </div>

                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <a
                                href={`tel:${lead.phone}`}
                                title="Call"
                                className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                              <a
                                href={`https://wa.me/${lead.whatsapp_number.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp"
                                className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lead Create Modal */}
      <CreateLeadModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onLeadCreated={() => fetchLeads()}
      />
    </div>
  );
};
