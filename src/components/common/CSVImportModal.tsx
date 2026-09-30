import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, X, Download } from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const { showToast } = useNotifications();
  const [csvText, setCsvText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewReport, setPreviewReport] = useState<{
    total: number;
    validCount: number;
    duplicateCount: number;
    errorCount: number;
    results: any[];
  } | null>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const header = 'Name,Phone,Email,City,Course,University,Source\n';
    const sample = 'Suman Pokharel,+977 9801122998,suman.pokharel@gmail.com,Kathmandu,B.Tech Computer Science & Engineering,SRM Institute of Science and Technology,Meta Ads\n' +
      'Ananya Sen,+91 9811004455,ananya.sen@gmail.com,Delhi,BBA Corporate Aviation & Logistics,Jain University,Google\n';
    const blob = new Blob([header + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'education_sansar_leads_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV split considering quotes
      const values: string[] = [];
      let inQuote = false;
      let token = '';
      for (const char of lines[i]) {
        if (char === '"') inQuote = !inQuote;
        else if (char === ',' && !inQuote) {
          values.push(token.trim().replace(/^"|"$/g, ''));
          token = '';
        } else {
          token += char;
        }
      }
      values.push(token.trim().replace(/^"|"$/g, ''));

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setCsvText((event.target?.result as string) || '');
      };
      reader.readAsText(file);
    }
  };

  const analyzeLeads = async () => {
    const parsed = parseCsv(csvText);
    if (parsed.length === 0) {
      showToast('Please provide valid CSV rows with headers', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const report = await api.importLeads(parsed, true);
      setPreviewReport(report);
    } catch (err: any) {
      showToast(err.message || 'Validation failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const commitImport = async () => {
    const parsed = parseCsv(csvText);
    if (parsed.length === 0) return;

    setImporting(true);
    try {
      const res = await api.importLeads(parsed, false, 'CSV Bulk Import');
      showToast(`Import completed: ${res.createdCount} leads created, ${res.duplicateCount} duplicates prevented!`, 'success');
      onImportSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Leads from CSV</h2>
              <p className="text-xs text-slate-400">
                Bulk import with pre-validation and strong duplicate prevention
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-blue-400 hover:text-blue-300 font-semibold border border-blue-500/30 rounded-lg hover:bg-blue-950/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select CSV File or Paste Raw CSV Data
            </label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
            <textarea
              rows={5}
              value={csvText}
              onChange={e => {
                setCsvText(e.target.value);
                setPreviewReport(null);
              }}
              placeholder="Name,Phone,Email,City,Course,University,Source&#10;Prashant Karki,+977 9801122334,prashant@gmail.com,Kathmandu,B.Tech CSE,SRM University,Meta Ads"
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Analyze / Validate Button */}
          {!previewReport && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={analyzeLeads}
                disabled={analyzing || !csvText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{analyzing ? 'Validating & Checking Duplicates...' : 'Validate & Preview Import'}</span>
              </button>
            </div>
          )}

          {/* Validation & Duplicate Detection Preview */}
          {previewReport && (
            <div className="space-y-4 animate-in fade-in">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase">Valid Rows</div>
                  <div className="text-xl font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{previewReport.validCount}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-800 uppercase">Duplicates Detected</div>
                  <div className="text-xl font-bold text-amber-700 flex items-center gap-1.5 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>{previewReport.duplicateCount}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-[11px] font-bold text-rose-800 uppercase">Invalid Rows</div>
                  <div className="text-xl font-bold text-rose-700 flex items-center gap-1.5 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>{previewReport.errorCount}</span>
                  </div>
                </div>
              </div>

              {/* Preview Rows Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                  Preview ({previewReport.total} records detected)
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {previewReport.results.map((r, i) => (
                    <div
                      key={i}
                      className={`p-3 flex items-center justify-between ${
                        r.status === 'VALID'
                          ? 'bg-white'
                          : r.status === 'DUPLICATE'
                          ? 'bg-amber-50/50'
                          : 'bg-rose-50/50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{r.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{r.phone}</div>
                        {r.message && (
                          <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                            {r.message}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'VALID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'DUPLICATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Confirm Import Bar */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  ← Edit CSV
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={commitImport}
                    disabled={importing || previewReport.validCount === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {importing
                        ? 'Importing...'
                        : `Confirm & Import ${previewReport.validCount} Valid Leads`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
