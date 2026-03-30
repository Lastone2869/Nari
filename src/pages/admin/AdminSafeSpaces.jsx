import { useState, useEffect } from 'react';
import { getSafeSpaces } from '../../firebase/firestore';
import { MapPin, ShieldCheck, ShieldAlert, Plus } from 'lucide-react';

export default function AdminSafeSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSafeSpaces().then(data => {
      setSpaces(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading secure locations...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-xl font-bold text-nari-navy flex items-center gap-2">
          <MapPin /> Safe Spaces Registry
        </h2>
        <button className="px-4 py-2 bg-nari-navy text-white text-sm font-bold rounded-lg hover:bg-[#132846] transition flex items-center gap-2 shadow-sm">
          <Plus size={16} /> Register New Location
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold border-b">Facility Name</th>
              <th className="p-4 font-bold border-b">Type</th>
              <th className="p-4 font-bold border-b">Coordinates</th>
              <th className="p-4 font-bold border-b text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {spaces.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-nari-navy">{s.name}</td>
                <td className="p-4 text-sm font-bold text-gray-600 uppercase tracking-widest">{s.type.replace('_', ' ')}</td>
                <td className="p-4 text-sm font-mono text-gray-500">
                  {s.location?.lat?.toFixed(4)}, {s.location?.lng?.toFixed(4)}
                </td>
                <td className="p-4 text-center flex justify-center">
                  {s.verified ? (
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-black">
                      <ShieldCheck size={14} /> VERIFIED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-black">
                      <ShieldAlert size={14} /> UNVERIFIED
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {spaces.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500 font-bold">No registered safe spaces.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
