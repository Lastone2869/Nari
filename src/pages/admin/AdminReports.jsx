import { useState, useEffect } from 'react';
import { getAllReportsAdmin, updateReportStatus, deleteReportAdmin } from '../../firebase/firestore';
import { CheckCircle, XCircle, Trash2, Search } from 'lucide-react';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsub = getAllReportsAdmin((data) => setReports(data));
    return unsub;
  }, []);

  const handleVerify = async (id) => updateReportStatus(id, 'verified');
  const handleReject = async (id) => deleteReportAdmin(id);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
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
                  <div className="font-bold text-nari-navy capitalize">{r.type.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500 max-w-xs truncate">{r.description || 'No description provided'}</div>
                </td>
                <td className="p-4 text-sm text-gray-600 font-medium">
                  {r.locationLabel || 'GPS Coordinates'}
                </td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(r.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    r.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-right flex items-center justify-end gap-2">
                  {r.status === 'pending' && (
                    <button onClick={() => handleVerify(r.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition" title="Verify Report">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => handleReject(r.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="Delete/Reject Report">
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
