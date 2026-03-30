import { useState, useEffect } from 'react';
import { subscribeToLiveAlertsAdmin, resolveLiveAlert } from '../../firebase/firestore';
import { AlertTriangle, MapPin, Clock, CheckCircle2, Loader2 } from 'lucide-react';

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [resolving, setResolving] = useState({}); // { [id]: 'confirm' | 'loading' }

  useEffect(() => {
    const unsub = subscribeToLiveAlertsAdmin((data) => setAlerts(data));
    return unsub;
  }, []);

  const requestResolve = (id) => {
    setResolving(prev => ({ ...prev, [id]: 'confirm' }));
  };

  const cancelResolve = (id) => {
    setResolving(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const confirmResolve = async (id) => {
    setResolving(prev => ({ ...prev, [id]: 'loading' }));
    try {
      await resolveLiveAlert(id);
      // Alert will disappear from the list automatically via the realtime subscription
    } catch (e) {
      console.error('Resolve failed', e);
      cancelResolve(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-red-100">
        <div>
          <h2 className="text-2xl font-black text-red-600 flex items-center gap-3">
            <AlertTriangle className="animate-pulse" /> Live SOS Monitoring ({alerts.length})
          </h2>
          <p className="text-gray-500 font-medium mt-1">Real-time emergency telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {alerts.map(a => {
          const state = resolving[a.id];
          return (
            <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border-2 border-red-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">User ID: {a.userId?.slice(0, 8)}...</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                    <Clock size={14} className="text-red-500" />
                    Started: {new Date(a.startedAt?.toDate?.() || Date.now()).toLocaleTimeString()}
                  </div>
                </div>

                {/* Resolve button — 3-state: idle → confirm → loading */}
                {!state && (
                  <button
                    onClick={() => requestResolve(a.id)}
                    className="px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-700 transition shadow-sm text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Resolve Alert
                  </button>
                )}
                {state === 'confirm' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600">Are you sure?</span>
                    <button
                      onClick={() => confirmResolve(a.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-xs transition"
                    >
                      Yes, Resolve
                    </button>
                    <button
                      onClick={() => cancelResolve(a.id)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {state === 'loading' && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-bold">
                    <Loader2 size={16} className="animate-spin" /> Resolving...
                  </div>
                )}
              </div>

              <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                <div className="flex items-center gap-2 mb-2 font-black text-red-700">
                  <MapPin size={16} className="animate-bounce" /> Current Coordinates
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 font-bold uppercase">Latitude</div>
                    <div className="font-mono font-bold text-gray-900">{a.currentLocation?.lat?.toFixed(6) ?? 'N/A'}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500 font-bold uppercase">Longitude</div>
                    <div className="font-mono font-bold text-gray-900">{a.currentLocation?.lng?.toFixed(6) ?? 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                <span>Location Pings: {a.locationHistory?.length || 1}</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${a.currentLocation?.lat},${a.currentLocation?.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Open in Maps
                </a>
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="xl:col-span-2 bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-emerald-500 opacity-50" />
            </div>
            <h3 className="text-xl font-black text-emerald-700 mb-2">No Active Emergencies</h3>
            <p className="text-emerald-600 font-medium">All systems are quiet. The community is safe.</p>
          </div>
        )}
      </div>
    </div>
  );
}
