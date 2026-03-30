import { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Shield, Hospital, AlertTriangle, Filter, Flame } from 'lucide-react';
import { getRecentReports, getSafeSpaces } from '../firebase/firestore';

const MAPS_API_KEY = 'AIzaSyAiYHDTpSc5Zv5X1vHCq-qejd2DWrKjvEs';

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

// Heatmap Layer Component
function HeatmapLayer({ reports }) {
  const map = useMap();
  const visualization = useMapsLibrary('visualization');

  const heatmap = useMemo(() => {
    if (!visualization) return null;
    return new google.maps.visualization.HeatmapLayer({
      radius: 35,
      opacity: 0.8,
      gradient: [
        'rgba(0, 0, 0, 0)',
        '#8b5cf6', // violet-500
        '#ec4899', // pink-500
        '#f59e0b', // amber-500
        '#f97316', // orange-500
        '#ef4444', // red-500
        '#b91c1c'  // red-700
      ]
    });
  }, [visualization]);

  useEffect(() => {
    if (!heatmap || !reports) return;
    
    heatmap.setData(
      reports
        .filter(r => r.location?.lat && r.location?.lng)
        .map(r => ({
          location: new google.maps.LatLng(r.location.lat, r.location.lng),
          weight: (r.type === 'harassment' || r.type === 'stalking') ? 3 : 1
        }))
    );
  }, [heatmap, reports]);

  useEffect(() => {
    if (!heatmap) return;
    heatmap.setMap(map);
    return () => heatmap.setMap(null);
  }, [heatmap, map]);

  return null;
}

function SafetyScore({ score }) {
  const color = score >= 70 ? '#4FD1C5' : score >= 40 ? '#FFB020' : '#FF6B6B';
  const label = score >= 70 ? 'SAFE' : score >= 40 ? 'MODERATE' : 'UNSAFE';
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-4 shadow-sm">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(26,54,93,0.06)" strokeWidth="3.5" />
          <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${score * 0.88} 88`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-nari-navy">{score}</span>
      </div>
      <div>
        <div className="text-nari-navy font-bold text-sm">Area Safety Score</div>
        <div className="text-xs font-bold mt-0.5 tracking-wider" style={{ color }}>{label}</div>
        <div className="text-gray-600 text-xs mt-1">Based on community reports</div>
      </div>
    </div>
  );
}

export default function SafetyMap() {
  const [reports, setReports] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ reports: true, safe_zones: true, police: true, hospitals: true });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [safetyScore] = useState(62);
  const defaultCenter = { lat: 28.6139, lng: 77.209 };

  useEffect(() => {
    const unsub = getRecentReports(setReports, 50);
    getSafeSpaces().then(setSpaces);
    return unsub;
  }, []);

  const toggleFilter = (k) => setFilters((f) => ({ ...f, [k]: !f[k] }));

  const filterBtns = [
    { key: 'reports', label: 'Incidents', color: 'text-nari-coral border-nari-coral/40 bg-nari-coral/10' },
    { key: 'safe_zones', label: 'Safe Zones', color: 'text-nari-teal border-nari-teal/40 bg-nari-teal/10' },
    { key: 'police', label: 'Police', color: 'text-blue-500 border-blue-500/40 bg-blue-500/10' },
    { key: 'hospitals', label: 'Hospitals', color: 'text-nari-amber border-nari-amber/40 bg-nari-amber/10' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-nari-navy mb-2 tracking-tight">Safety Map</h1>
            <p className="text-gray-600 text-base">Live incidents, safe spaces, and area safety scores.</p>
          </div>
          <SafetyScore score={safetyScore} />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              showHeatmap ? 'text-white border-nari-amber/40 bg-nari-amber shadow-sm' : 'border-nari-navy/10 bg-white text-gray-500 hover:bg-nari-navy/5 shadow-sm'
            }`}
          >
            <Flame size={12} className={showHeatmap ? "text-white" : "text-nari-amber"} />
            Heatmap Layer
          </button>
          <div className="w-px h-6 bg-nari-navy/10 mx-1 self-center hidden sm:block"></div>
          {filterBtns.map(({ key, label, color }) => (
            <button
              key={key}
              id={`filter-${key}`}
              onClick={() => toggleFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                filters[key] ? color : 'border-nari-navy/10 bg-white text-gray-500 shadow-sm'
              }`}
            >
              <Filter size={11} />
              {label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="mb-10 relative w-full h-[60vh] min-h-[500px] rounded-[2rem] border-[12px] border-white shadow-xl bg-gray-100 overflow-hidden">
          {MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY' ? (
            <div className="w-full h-full flex flex-col items-center justify-center glass-card rounded-2xl">
              <MapPin size={40} className="text-nari-teal mb-3 animate-float" />
              <p className="text-nari-navy font-bold mb-1">Google Maps</p>
              <p className="text-gray-600 text-sm text-center max-w-xs">
                Add your Google Maps API key in <code className="text-nari-teal font-mono">src/pages/SafetyMap.jsx</code> to enable the live map.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-md px-4">
                {[...reports.slice(0, 3)].map((r) => (
                  <div key={r.id} className="bg-white border border-nari-navy/10 rounded-xl p-3 shadow-sm">
                    <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: CATEGORY_COLORS[r.type] || '#6b7280' }} />
                    <div className="text-nari-navy text-xs font-bold capitalize">{r.type?.replace('_', ' ')}</div>
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
                colorScheme="LIGHT"
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

                {/* Heatmap Layer */}
                {showHeatmap && <HeatmapLayer reports={filters.reports ? reports : []} />}

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
                          <div className="font-bold text-nari-navy text-sm capitalize">{selected.data.type?.replace('_', ' ')}</div>
                          <div className="text-xs text-gray-600 mt-1">{selected.data.locationLabel}</div>
                          <div className="text-xs text-gray-500 mt-1">{selected.data.description?.slice(0, 60)}…</div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-nari-navy text-sm">{SPACE_ICONS[selected.data.type]} {selected.data.name}</div>
                          <div className="text-xs text-gray-600 mt-1 capitalize">{selected.data.type?.replace('_', ' ')}</div>
                          {selected.data.verified && <div className="text-xs text-nari-teal mt-1 font-bold">✓ Verified</div>}
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
          <h2 className="text-nari-navy font-black text-xl mb-4">Recent Incidents ({reports.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.slice(0, 6).map((r) => (
              <div key={r.id} className="zomato-card bg-white p-5 flex items-start gap-4">
                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[r.type] || '#6b7280' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-nari-navy text-sm font-bold capitalize">{r.type?.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold badge-${r.status === 'pending' ? 'pending' : 'verified'}`}>{r.status}</span>
                  </div>
                  <div className="text-gray-600 text-xs mt-0.5 truncate font-medium">{r.locationLabel || 'Location not specified'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
