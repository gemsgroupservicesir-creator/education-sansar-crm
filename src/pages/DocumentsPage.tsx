import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, XCircle, Search, RefreshCw, Eye, ShieldCheck, X } from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { useNotifications } from '../context/NotificationContext';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [verifyModalDoc, setVerifyModalDoc] = useState<DocumentItem | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments({ status: statusFilter });
      setDocuments(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [statusFilter]);

  const handleVerify = async (docId: string, status: 'Verified' | 'Rejected') => {
    try {
      await api.verifyDocument(docId, {
        status,
        verification_notes: verifyNotes,
        verified_by: 'Admin Verifier'
      });
      showToast(`Document marked as ${status}`, 'success');
      setVerifyModalDoc(null);
      setVerifyNotes('');
      fetchDocs();
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
            <FileText className="w-5 h-5 text-blue-600" />
            Document Verification Repository
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
              {documents.length} Files
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student academic transcripts, citizenship, passports and offer letter validations
          </p>
        </div>

        <button
          onClick={fetchDocs}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 self-start"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
        {['', 'Uploaded', 'Verified', 'Rejected'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 border-b-2 transition-all ${
              statusFilter === st
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {st === '' ? 'All Documents' : st}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No documents found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Document Type</th>
                  <th className="py-3 px-4 font-semibold">File Name</th>
                  <th className="py-3 px-4 font-semibold">Uploaded By</th>
                  <th className="py-3 px-4 font-semibold">Upload Date</th>
                  <th className="py-3 px-4 font-semibold">Verification Status</th>
                  <th className="py-3 px-4 font-semibold">Verified By &amp; Notes</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.document_type}</td>

                    <td className="py-3.5 px-4 font-mono text-blue-600 hover:underline cursor-pointer">
                      {d.file_name}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">{d.uploaded_by}</td>

                    <td className="py-3.5 px-4 text-slate-500">{d.upload_date}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.verification_status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.verification_status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.verification_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {d.verification_notes ? (
                        <span>{d.verification_notes}</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setVerifyModalDoc(d)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold"
                        >
                          Verify / Review
                        </button>
                        <button
                          onClick={() => navigate(`/leads/${d.lead_id}`)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                          title="View Student"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Dialog */}
      {verifyModalDoc && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Verify Document</h3>
              <button onClick={() => setVerifyModalDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>Type: <strong className="text-slate-900">{verifyModalDoc.document_type}</strong></div>
              <div>File: <strong className="text-slate-900 font-mono">{verifyModalDoc.file_name}</strong></div>
              <div>Uploaded: {verifyModalDoc.upload_date} by {verifyModalDoc.uploaded_by}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Verification Remarks / Discrepancies
              </label>
              <textarea
                rows={3}
                value={verifyNotes}
                onChange={e => setVerifyNotes(e.target.value)}
                placeholder="e.g. Verified against NEB/CBSE portal. All marksheets authentic."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleVerify(verifyModalDoc.id, 'Rejected')}
                className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
              >
                Reject Document
              </button>
              <button
                onClick={() => handleVerify(verifyModalDoc.id, 'Verified')}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Approve &amp; Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
