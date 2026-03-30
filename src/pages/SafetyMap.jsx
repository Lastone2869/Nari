// src/pages/SafetyMap.jsx
import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Shield, Hospital, AlertTriangle, Filter } from 'lucide-react';
import { getRecentReports, getSafeSpaces } from '../firebase/firestore';

const MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your actual key

const CATEGORY_COLORS = {
  harassment: '#ef4444',
  theft: '#f59e0b',
  unsafe_area: '#f97316',
  stalking: '#a855f7',
  poor_lighting: '#eab308',
  other: '#6b7280',
};

const SPACE_ICONS = {
  police: '🚔',
  hospital: '🏥',
  safe_zone: '🛡️',
};

function SafetyScore({ score }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'SAFE' : score >= 40 ? 'MODERATE' : 'UNSAFE';
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${score * 0.88} 88`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{score}</span>
      </div>
      <div>
        <div className="text-white font-semibold text-sm">Area Safety Score</div>
        <div className="text-xs font-bold mt-0.5" style={{ color }}>{label}</div>
        <div className="text-gray-500 text-xs mt-1">Based on community reports</div>
      </div>
    </div>
  );
}

export default function SafetyMap() {
  const [reports, setReports] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ reports: true, safe_zones: true, police: true, hospitals: true });
  const [safetyScore] = useState(62);
  const defaultCenter = { lat: 28.6139, lng: 77.209 };

  useEffect(() => {
    const unsub = getRecentReports(setReports, 50);
    getSafeSpaces().then(setSpaces);
    return unsub;
  }, []);

  const toggleFilter = (k) => setFilters((f) => ({ ...f, [k]: !f[k] }));

  const filterBtns = [
    { key: 'reports', label: 'Incidents', color: 'text-red-400 border-red-500/40 bg-red-500/10' },
    { key: 'safe_zones', label: 'Safe Zones', color: 'text-green-400 border-green-500/40 bg-green-500/10' },
    { key: 'police', label: 'Police', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
    { key: 'hospitals', label: 'Hospitals', color: 'text-pink-400 border-pink-500/40 bg-pink-500/10' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white mb-1">Safety Map</h1>
            <p className="text-gray-500 text-sm">Live incidents, safe spaces, and area safety scores.</p>
          </div>
          <SafetyScore score={safetyScore} />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterBtns.map(({ key, label, color }) => (
            <button
              key={key}
              id={`filter-${key}`}
              onClick={() => toggleFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                filters[key] ? color : 'border-white/10 bg-white/5 text-gray-600'
              }`}
            >
              <Filter size={11} />
              {label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="map-container mb-6 relative">
          {MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY' ? (
            <div className="w-full h-full flex flex-col items-center justify-center glass-card rounded-2xl">
              <MapPin size={40} className="text-violet-400 mb-3 animate-float" />
              <p className="text-white font-semibold mb-1">Google Maps</p>
              <p className="text-gray-500 text-sm text-center max-w-xs">
                Add your Google Maps API key in <code className="text-violet-300">src/pages/SafetyMap.jsx</code> to enable the live map.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-md px-4">
                {[...reports.slice(0, 3)].map((r) => (
                  <div key={r.id} className="bg-white/5 rounded-xl p-3">
                    <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: CATEGORY_COLORS[r.type] || '#6b7280' }} />
                    <div className="text-white text-xs font-medium capitalize">{r.type?.replace('_', ' ')}</div>
                    <div className="text-gray-600 text-xs">{r.locationLabel || 'Unknown'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <APIProvider apiKey={MAPS_API_KEY}>
              <Map
                defaultCenter={defaultCenter}
                defaultZoom={13}
                mapId="nari-safety-map"
                style={{ width: '100%', height: '100%' }}
                gestureHandling="greedy"
                disableDefaultUI={false}
                colorScheme="DARK"
              >
                {/* Incident markers */}
                {filters.reports && reports.filter((r) => r.location?.lat).map((r) => (
                  <AdvancedMarker
                    key={r.id}
                    position={{ lat: r.location.lat, lng: r.location.lng }}
                    onClick={() => setSelected({ type: 'report', data: r })}
                  >
                    <Pin background={CATEGORY_COLORS[r.type] || '#6b7280'} borderColor="white" glyphColor="white" scale={0.9}>
                      <AlertTriangle size={10} />
                    </Pin>
                  </AdvancedMarker>
                ))}

                {/* Safe space markers */}
                {spaces.filter((s) => filters[s.type] || (s.type === 'safe_zone' && filters.safe_zones)).map((s) => (
                  <AdvancedMarker
                    key={s.id}
                    position={{ lat: s.location.lat, lng: s.location.lng }}
                    onClick={() => setSelected({ type: 'space', data: s })}
                  >
                    <Pin background={s.type === 'police' ? '#3b82f6' : s.type === 'hospital' ? '#ec4899' : '#22c55e'} borderColor="white" glyphColor="white" scale={1.0}>
                      <Shield size={10} />
                    </Pin>
                  </AdvancedMarker>
                ))}

                {/* Info window */}
                {selected && (
                  <InfoWindow
                    position={selected.type === 'report'
                      ? { lat: selected.data.location.lat, lng: selected.data.location.lng }
                      : { lat: selected.data.location.lat, lng: selected.data.location.lng }}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div className="p-2 min-w-[160px]">
                      {selected.type === 'report' ? (
                        <>
                          <div className="font-semibold text-sm capitalize">{selected.data.type?.replace('_', ' ')}</div>
                          <div className="text-xs text-gray-600 mt-1">{selected.data.locationLabel}</div>
                          <div className="text-xs text-gray-500 mt-1">{selected.data.description?.slice(0, 60)}…</div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-sm">{SPACE_ICONS[selected.data.type]} {selected.data.name}</div>
                          <div className="text-xs text-gray-600 mt-1 capitalize">{selected.data.type?.replace('_', ' ')}</div>
                          {selected.data.verified && <div className="text-xs text-green-600 mt-1">✓ Verified</div>}
                        </>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          )}
        </div>

        {/* Recent incidents list */}
        <div>
          <h2 className="text-white font-semibold mb-3">Recent Incidents ({reports.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reports.slice(0, 6).map((r) => (
              <div key={r.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[r.type] || '#6b7280' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white text-sm font-medium capitalize">{r.type?.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full badge-${r.status === 'pending' ? 'pending' : 'verified'}`}>{r.status}</span>
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5 truncate">{r.locationLabel || 'Location not specified'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
