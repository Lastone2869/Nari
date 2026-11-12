import { useState, useEffect } from 'react';
import { getAllReportsAdmin, updateReportStatus, deleteReportAdmin } from '../../firebase/firestore';
import { Trash2 } from 'lucide-react';
import { REPORT_STATUSES } from '../../lib/reportStatus';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsub = getAllReportsAdmin((data) => setReports(data));
    return unsub;
  }, []);

  const handleStatus = (id, status) =>
    updateReportStatus(id, status).catch((e) => { console.error(e); alert('Status update failed.'); });
  const handleDelete = (id) => {
    if (!window.confirm('Permanently delete this report? This cannot be undone.')) return;
    deleteReportAdmin(id).catch((e) => { console.error(e); alert('Delete failed.'); });
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
        <h2 className="text-xl font-bold text-nari-navy">Incident Reports Management</h2>
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-sm font-bold">
          <button 
            className={`px-4 py-2 ${filter === 'all' ? 'bg-nari-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`} 
            onClick={() => setFilter('all')}>All
          </button>
          <button 
            className={`px-4 py-2 border-l border-gray-200 ${filter === 'pending' ? 'bg-nari-amber text-white' : 'text-gray-500 hover:bg-gray-50'}`} 
            onClick={() => setFilter('pending')}>Pending
          </button>
          <button 
            className={`px-4 py-2 border-l border-gray-200 ${filter === 'verified' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`} 
            onClick={() => setFilter('verified')}>Verified
          </button>
          <button
            className={`px-4 py-2 border-l border-gray-200 ${filter === 'resolved' ? 'bg-nari-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setFilter('resolved')}>Resolved
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold border-b">Type & Description</th>
              <th className="p-4 font-bold border-b">Location</th>
              <th className="p-4 font-bold border-b">Date</th>
              <th className="p-4 font-bold border-b text-center">Status</th>
              <th className="p-4 font-bold border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-nari-navy capitalize">{r.type?.replace('_', ' ') || 'Unknown'}</div>
                  <div className="text-xs text-gray-500 max-w-xs truncate">{r.description || 'No description provided'}</div>
                </td>
                <td className="p-4 text-sm text-gray-600 font-medium">
                  {r.locationLabel || 'GPS Coordinates'}
                </td>
                <td className="p-4 text-sm text-gray-500">
                  {r.createdAt?.toDate?.().toLocaleDateString() ?? 'Just now'}
                </td>
                <td className="p-4 text-center">
                  <select
                    aria-label="Report status"
                    value={REPORT_STATUSES.includes(r.status) ? r.status : 'pending'}
                    onChange={(e) => handleStatus(r.id, e.target.value)}
                    className={`rounded-full border-0 px-3 py-1 text-xs font-bold uppercase ${
                      r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'resolved' || r.status === 'closed' ? 'bg-nari-navy/10 text-nari-navy' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {REPORT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(r.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Delete Report" aria-label="Delete report">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500 font-bold">No reports found matching criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
