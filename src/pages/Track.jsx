// src/pages/Track.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Clock, AlertTriangle, Eye, ArrowUpRight, Shield, FileSearch } from 'lucide-react';
import { getReport } from '../firebase/firestore';

const FLOW = [
  { key: 'pending',   label: 'Submitted',    desc: 'Your report has been received.',              icon: FileSearch,    color: 'text-nari-navy',   ring: 'ring-nari-navy/40',   bg: 'bg-nari-navy/15' },
  { key: 'verified',  label: 'Verified',     desc: 'Our team has verified the incident.',         icon: Shield,        color: 'text-nari-teal', ring: 'ring-nari-teal/40', bg: 'bg-nari-teal/15' },
  { key: 'reviewing', label: 'Under Review', desc: 'Authorities are reviewing your report.',      icon: Eye,           color: 'text-nari-amber',  ring: 'ring-nari-amber/40',  bg: 'bg-nari-amber/15' },
  { key: 'escalated', label: 'Escalated',    desc: 'Case forwarded to higher authority.',         icon: ArrowUpRight,  color: 'text-[#f97316]', ring: 'ring-[#f97316]/40', bg: 'bg-[#f97316]/15' },
  { key: 'resolved',  label: 'Resolved',     desc: 'Action has been taken on your report.',      icon: CheckCircle,   color: 'text-[#4ade80]',  ring: 'ring-[#4ade80]/40',  bg: 'bg-[#4ade80]/15' },
  { key: 'closed',    label: 'Closed',       desc: 'This complaint has been officially closed.',  icon: Clock,         color: 'text-gray-500',   ring: 'ring-gray-400/40',   bg: 'bg-gray-200' },
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
        <h1 className="font-display text-3xl font-bold text-nari-navy mb-1">Track Complaint</h1>
        <p className="text-gray-600 text-sm mb-8">Enter your Report ID to see real-time status.</p>

        {/* Search */}
        <div className="flex gap-3 mb-8 shadow-sm">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              id="track-input"
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReport(inputId)}
              placeholder="Enter Report ID (e.g. abc123xyz)"
              className="nari-input pl-9 bg-white border border-nari-navy/20 text-nari-navy"
            />
          </div>
          <button
            id="track-search-btn"
            onClick={() => fetchReport(inputId)}
            disabled={!inputId.trim() || loading}
            className="px-5 py-2.5 rounded-xl bg-nari-navy text-white font-semibold hover:bg-[#132846] disabled:opacity-40 transition-all flex items-center gap-2 shadow-md"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={15} />}
            Track
          </button>
        </div>

        {notFound && (
          <div className="glass-card rounded-2xl p-6 text-center border-nari-amber/20 bg-nari-amber/5">
            <AlertTriangle size={32} className="text-nari-amber mx-auto mb-3" />
            <p className="text-nari-navy font-bold">Report Not Found</p>
            <p className="text-gray-600 text-sm mt-1">Check your Report ID and try again.</p>
          </div>
        )}

        {report && (
          <div className="space-y-5 animate-slide-up">
            {/* Summary card */}
            <div className="glass-card rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Report ID</div>
                  <div className="font-mono text-sm text-nari-navy font-bold">{report.id}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold badge-${report.status === 'pending' ? 'pending' : report.status === 'resolved' ? 'resolved' : 'verified'}`}>
                  {report.status?.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white border border-nari-navy/10 shadow-sm rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1 font-semibold">Category</div>
                  <div className="text-nari-navy font-bold capitalize">{report.type?.replace('_', ' ')}</div>
                </div>
                <div className="bg-white border border-nari-navy/10 shadow-sm rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1 font-semibold">Location</div>
                  <div className="text-nari-navy font-medium truncate">{report.locationLabel || 'Not specified'}</div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-nari-navy font-bold mb-1.5">
                  <span>Progress</span><span>{progressPct}%</span>
                </div>
                <div className="h-2 bg-nari-navy/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-nari-teal rounded-full transition-all duration-700"
                    style={{ width: progressPct + '%' }}
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card rounded-2xl p-5 shadow-sm">
              <h3 className="text-nari-navy font-bold mb-5">Status Timeline</h3>
              <div className="space-y-0">
                {FLOW.map(({ key, label, desc, icon: Icon, color, ring, bg }, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ring-2 transition-all shadow-sm ${
                          done ? `${bg} ${ring} ${color}` : 'bg-gray-100 ring-[#e2e8f0] text-gray-400'
                        } ${active ? 'scale-110 shadow-md ring-offset-2' : ''}`}>
                          <Icon size={16} />
                        </div>
                        {i < FLOW.length - 1 && (
                          <div className={`w-0.5 flex-1 my-1 ${i < currentStep ? 'bg-nari-navy/30' : 'bg-gray-200'}`} style={{ minHeight: '28px' }} />
                        )}
                      </div>
                      <div className={`pb-6 ${i === FLOW.length - 1 ? 'pb-0' : ''}`}>
                        <div className={`font-bold text-sm ${done ? 'text-nari-navy' : 'text-gray-400'}`}>{label}</div>
                        <div className={`text-xs mt-0.5 ${done ? 'text-gray-600' : 'text-gray-400'}`}>{desc}</div>
                        {active && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-nari-navy/10 text-nari-navy border border-nari-navy/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-nari-teal animate-pulse" />
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
