// src/pages/Track.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Clock, AlertTriangle, Eye, ArrowUpRight, Shield, FileSearch } from 'lucide-react';
import { getReport } from '../firebase/firestore';

const FLOW = [
  { key: 'pending',   label: 'Submitted',    desc: 'Your report has been received.',              icon: FileSearch,    color: 'text-blue-400',   ring: 'ring-blue-500/40',   bg: 'bg-blue-500/15' },
  { key: 'verified',  label: 'Verified',     desc: 'Our team has verified the incident.',         icon: Shield,        color: 'text-violet-400', ring: 'ring-violet-500/40', bg: 'bg-violet-500/15' },
  { key: 'reviewing', label: 'Under Review', desc: 'Authorities are reviewing your report.',      icon: Eye,           color: 'text-amber-400',  ring: 'ring-amber-500/40',  bg: 'bg-amber-500/15' },
  { key: 'escalated', label: 'Escalated',    desc: 'Case forwarded to higher authority.',         icon: ArrowUpRight,  color: 'text-orange-400', ring: 'ring-orange-500/40', bg: 'bg-orange-500/15' },
  { key: 'resolved',  label: 'Resolved',     desc: 'Action has been taken on your report.',      icon: CheckCircle,   color: 'text-green-400',  ring: 'ring-green-500/40',  bg: 'bg-green-500/15' },
  { key: 'closed',    label: 'Closed',       desc: 'This complaint has been officially closed.',  icon: Clock,         color: 'text-gray-400',   ring: 'ring-gray-500/40',   bg: 'bg-gray-500/15' },
];

export default function Track() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [inputId, setInputId] = useState(routeId || '');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(!!routeId);
  const [notFound, setNotFound] = useState(false);

  const fetchReport = async (rid) => {
    setLoading(true);
    setNotFound(false);
    const data = await getReport(rid.trim());
    if (data) { setReport(data); navigate('/track/' + rid.trim(), { replace: true }); }
    else setNotFound(true);
    setLoading(false);
  };

  useEffect(() => { if (routeId) fetchReport(routeId); }, [routeId]);

  const currentStep = FLOW.findIndex((f) => f.key === report?.status);
  const progressPct = currentStep >= 0 ? (((currentStep + 1) / FLOW.length) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 grid-bg">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Track Complaint</h1>
        <p className="text-gray-500 text-sm mb-8">Enter your Report ID to see real-time status.</p>

        {/* Search */}
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              id="track-input"
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReport(inputId)}
              placeholder="Enter Report ID (e.g. abc123xyz)"
              className="nari-input pl-9"
            />
          </div>
          <button
            id="track-search-btn"
            onClick={() => fetchReport(inputId)}
            disabled={!inputId.trim() || loading}
            className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-40 transition-all flex items-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={15} />}
            Track
          </button>
        </div>

        {notFound && (
          <div className="glass-card rounded-2xl p-6 text-center">
            <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Report Not Found</p>
            <p className="text-gray-500 text-sm mt-1">Check your Report ID and try again.</p>
          </div>
        )}

        {report && (
          <div className="space-y-5 animate-slide-up">
            {/* Summary card */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Report ID</div>
                  <div className="font-mono text-sm text-violet-300 font-bold">{report.id}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold badge-${report.status === 'pending' ? 'pending' : report.status === 'resolved' ? 'resolved' : 'verified'}`}>
                  {report.status?.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Category</div>
                  <div className="text-white capitalize">{report.type?.replace('_', ' ')}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Location</div>
                  <div className="text-white truncate">{report.locationLabel || 'Not specified'}</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progress</span><span>{progressPct}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-pink-500 rounded-full transition-all duration-700"
                    style={{ width: progressPct + '%' }}
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-5">Status Timeline</h3>
              <div className="space-y-0">
                {FLOW.map(({ key, label, desc, icon: Icon, color, ring, bg }, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ring-2 transition-all ${
                          done ? `${bg} ${ring} ${color}` : 'bg-white/5 ring-white/10 text-gray-600'
                        } ${active ? 'scale-110' : ''}`}>
                          <Icon size={16} />
                        </div>
                        {i < FLOW.length - 1 && (
                          <div className={`w-0.5 flex-1 my-1 ${i < currentStep ? 'bg-violet-600/50' : 'bg-white/10'}`} style={{ minHeight: '28px' }} />
                        )}
                      </div>
                      <div className={`pb-6 ${i === FLOW.length - 1 ? 'pb-0' : ''}`}>
                        <div className={`font-medium text-sm ${done ? 'text-white' : 'text-gray-600'}`}>{label}</div>
                        <div className={`text-xs mt-0.5 ${done ? 'text-gray-400' : 'text-gray-700'}`}>{desc}</div>
                        {active && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-violet-600/20 text-violet-300 border border-violet-600/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            In Progress
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
