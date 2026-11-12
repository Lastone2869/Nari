/* global google */
import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MapPin, Shield, AlertTriangle, Filter, Flame } from 'lucide-react';
import { getRecentReports, getSafeSpaces } from '../firebase/firestore';
import { safetyScore, SEVERE_TYPES } from '../lib/safetyScore';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// Advanced Markers need a real Map ID; Google's DEMO_MAP_ID works for development.
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

const CATEGORY_COLORS = {
  harassment: '#ef4444',
  theft: '#f59e0b',
  unsafe_area: '#f97316',
  stalking: '#a855f7',
  poor_lighting: '#eab308',
  other: '#6b7280',
};

const SPACE_LABELS = {
  police: 'Police',
  hospital: 'Hospital',
  safe_zone: 'Safe Zone',
};

// Density overlay built from core google.maps.Circle objects (Google deprecated the visualization library).
function DensityLayer({ reports }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const circles = reports
      .filter((r) => r.location?.lat != null && r.location?.lng != null)
      .map((r) => {
        const severe = SEVERE_TYPES.has(r.type);
        return new google.maps.Circle({
          map,
          center: r.location,
          radius: severe ? 350 : 200,
          fillColor: severe ? '#ef4444' : '#f59e0b',
          fillOpacity: 0.22,
          strokeWeight: 0,
          clickable: false,
        });
      });
    return () => circles.forEach((c) => c.setMap(null));
  }, [map, reports]);

  return null;
}

function SafetyScore({ score }) {
  const color = score >= 70 ? '#4FD1C5' : score >= 40 ? '#FFB020' : '#FF6B6B';
  // darker tone of the same hue so the label passes AA contrast on white
  const textColor = score >= 70 ? '#0C857B' : score >= 40 ? '#8A5A00' : '#B91C1C';
  const label = score >= 70 ? 'SAFE' : score >= 40 ? 'MODERATE' : 'UNSAFE';

  return (
    <div className="nari-card flex items-center gap-4 rounded-2xl p-4 shadow-sm">
      <div className="relative h-16 w-16 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(26,54,93,0.06)" strokeWidth="3.5" />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${score * 0.88} 88`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-nari-navy">{score}</span>
      </div>
      <div>
        <div className="text-sm font-bold text-nari-navy">Area Safety Score</div>
        <div className="mt-0.5 text-xs font-bold tracking-wider" style={{ color: textColor }}>
          {label}
        </div>
        <div className="mt-1 text-xs text-gray-600">Based on community reports</div>
      </div>
    </div>
  );
}

export default function SafetyMap() {
  const [reports, setReports] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [selected, setSelected] = useState(null);
  // keys match the `type` stored on safe_spaces docs so one lookup filters them
  const [filters, setFilters] = useState({ reports: true, safe_zone: true, police: true, hospital: true });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const score = safetyScore(reports);
  const defaultCenter = { lat: 28.6139, lng: 77.209 };

  useEffect(() => {
    const unsub = getRecentReports(setReports, 50);
    getSafeSpaces().then(setSpaces).catch((e) => console.error('Safe spaces failed', e));
    return unsub;
  }, []);

  const toggleFilter = (k) => setFilters((f) => ({ ...f, [k]: !f[k] }));

  const filterBtns = [
    { key: 'reports', label: 'Incidents', color: 'text-red-800 border-nari-coral/40 bg-nari-coral/10' },
    { key: 'safe_zone', label: 'Safe Zones', color: 'text-nari-teal-deep border-nari-teal/40 bg-nari-teal/10' },
    { key: 'police', label: 'Police', color: 'text-blue-700 border-blue-500/40 bg-blue-500/10' },
    { key: 'hospital', label: 'Hospitals', color: 'text-nari-amber-deep border-nari-amber/40 bg-nari-amber/10' },
  ];

  return (
    <div className="min-h-screen px-4 pb-16 pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-nari-navy sm:text-4xl">Safety map</h1>
            <p className="text-base text-gray-600">Live incidents, safe spaces, and area safety scores.</p>
          </div>
          <SafetyScore score={score} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            aria-pressed={showHeatmap}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              showHeatmap
                ? 'border-nari-amber/40 bg-nari-amber text-white shadow-sm'
                : 'border-nari-navy/10 bg-white text-gray-500 shadow-sm hover:bg-nari-navy/5'
            }`}
          >
            <Flame size={12} className={showHeatmap ? 'text-white' : 'text-nari-amber'} />
            Heatmap Layer
          </button>
          <div className="mx-1 hidden h-6 w-px self-center bg-nari-navy/10 sm:block" />
          {filterBtns.map(({ key, label, color }) => (
            <button
              key={key}
              id={`filter-${key}`}
              aria-pressed={filters[key]}
              onClick={() => toggleFilter(key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                filters[key] ? color : 'border-nari-navy/10 bg-white text-gray-500 shadow-sm'
              }`}
            >
              <Filter size={11} />
              {label}
            </button>
          ))}
        </div>

        <div className="relative mb-10 h-[60vh] min-h-[420px] w-full overflow-hidden rounded-[1.25rem] border border-nari-navy/10 bg-white">
          {!MAPS_API_KEY ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <MapPin size={40} className="mb-3 animate-float text-nari-teal-deep" />
              <p className="mb-1 font-bold text-nari-navy">Google Maps</p>
              <p className="max-w-xs text-center text-sm text-gray-600">
                Add your Google Maps API key in <code className="font-mono text-[#0C857B]">VITE_GOOGLE_MAPS_API_KEY</code> to enable the live map.
              </p>
              <div className="mt-4 grid w-full max-w-md grid-cols-3 gap-3 px-4">
                {[...reports.slice(0, 3)].map((r) => (
                  <div key={r.id} className="rounded-xl border border-nari-navy/10 bg-white p-3 shadow-sm">
                    <div className="mb-2 h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[r.type] || '#6b7280' }} />
                    <div className="text-xs font-bold capitalize text-nari-navy">{r.type?.replace('_', ' ')}</div>
                    <div className="text-xs text-gray-600">{r.locationLabel || 'Unknown'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <APIProvider apiKey={MAPS_API_KEY}>
              <Map
                defaultCenter={defaultCenter}
                defaultZoom={13}
                mapId={MAP_ID}
                style={{ width: '100%', height: '100%' }}
                gestureHandling="greedy"
                disableDefaultUI={false}
                colorScheme="LIGHT"
              >
                {filters.reports &&
                  reports
                    .filter((r) => r.location?.lat != null)
                    .map((r) => (
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

                {showHeatmap && <DensityLayer reports={filters.reports ? reports : []} />}

                {spaces
                  .filter((s) => filters[s.type] && s.location?.lat != null)
                  .map((s) => (
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
                    position={{ lat: selected.data.location.lat, lng: selected.data.location.lng }}
                    onCloseClick={() => setSelected(null)}
                  >
                    <div className="min-w-[160px] p-2">
                      {selected.type === 'report' ? (
                        <>
                          <div className="text-sm font-bold capitalize text-nari-navy">{selected.data.type?.replace('_', ' ')}</div>
                          <div className="mt-1 text-xs text-gray-600">{selected.data.locationLabel}</div>
                          <div className="mt-1 text-xs text-gray-500">{selected.data.description?.slice(0, 60)}{selected.data.description?.length > 60 ? '…' : ''}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-bold text-nari-navy">
                            {SPACE_LABELS[selected.data.type]} {selected.data.name}
                          </div>
                          <div className="mt-1 text-xs capitalize text-gray-600">{selected.data.type?.replace('_', ' ')}</div>
                          {selected.data.verified && <div className="mt-1 text-xs font-bold text-nari-teal-deep">Verified</div>}
                        </>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-black text-nari-navy">Recent Incidents ({reports.length})</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {reports.slice(0, 6).map((r) => (
              <div key={r.id} className="nari-card flex items-start gap-4 bg-white p-5">
                <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[r.type] || '#6b7280' }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold capitalize text-nari-navy">{r.type?.replace('_', ' ')}</span>
                    <span className={`badge-${r.status === 'pending' ? 'pending' : 'verified'} rounded-full px-2 py-0.5 text-xs font-bold`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs font-medium text-gray-600">{r.locationLabel || 'Location not specified'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
