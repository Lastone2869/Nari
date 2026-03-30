// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, MapPin, ShieldCheck, Clock, ArrowRight,
  UploadCloud, AlertTriangle, CheckCircle2, Hourglass,
  Activity, Lock, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserReports } from '../firebase/firestore';

const timeAgo = (ts) => {
  if (!ts?.toDate) return 'just now';
  const diff = Date.now() - ts.toDate().getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
};

const TYPE_COLOR = {
  harassment:   { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  stalking:     { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  theft:        { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  unsafe_area:  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  poor_lighting:{ bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  other:        { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-500' },
};

const STATUS_STYLE = {
  pending:  { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',  icon: Hourglass,     label: 'Pending' },
  verified: { bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-700',   icon: CheckCircle2,  label: 'Verified' },
  resolved: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: ShieldCheck, label: 'Resolved' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const unsub = getUserReports(user.uid, (data) => {
      setReports(data);
      setLoading(false);
    });
    return unsub;
  }, [user, navigate]);

  const pending  = reports.filter(r => r.status === 'pending').length;
  const verified = reports.filter(r => r.status === 'verified').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  const QUICK_ACTIONS = [
    { to: '/report',   label: 'File a New Report',   icon: Plus,        color: 'bg-red-600 text-white hover:bg-red-700' },
    { to: '/map',      label: 'View Safety Map',      icon: MapPin,      color: 'bg-nari-navy text-white hover:opacity-90' },
    { to: '/evidence', label: 'My Evidence Locker',   icon: Lock,        color: 'bg-emerald-600 text-white hover:bg-emerald-700' },
    { to: '/',         label: 'Back to Home & SOS',   icon: Activity,    color: 'bg-gray-900 text-white hover:bg-gray-800' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50/50">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-nari-navy tracking-tight">My Safety Hub</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">
              All your reports and activity in one place.
            </p>
          </div>
          <Link
            to="/report"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-sm"
          >
            <Plus size={16} /> New Report
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Submitted',  value: reports.length, icon: FileText,    color: 'text-nari-navy', bg: 'bg-nari-navy/8' },
            { label: 'Pending',    value: pending,         icon: Hourglass,   color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Resolved',   value: resolved,        icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div className="text-2xl font-black text-nari-navy">{loading ? '—' : value}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm ${color}`}
            >
              <Icon size={18} />
              {label}
              <ArrowRight size={14} className="ml-auto opacity-70" />
            </Link>
          ))}
        </div>

        {/* My Reports */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-black text-nari-navy flex items-center gap-2">
              <Activity size={16} className="text-nari-teal" /> My Reports
            </h2>
            {reports.length > 0 && (
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {reports.length} total
              </span>
            )}
          </div>

          {loading && (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-nari-navy border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 font-medium text-sm">Loading your reports…</p>
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-gray-400" />
              </div>
              <p className="text-nari-navy font-black text-lg mb-1">No reports yet</p>
              <p className="text-gray-500 text-sm mb-5">Your submitted reports will appear here.</p>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition"
              >
                <Plus size={15} /> File Your First Report
              </Link>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="divide-y divide-gray-100">
              {reports.map((r) => {
                const typeStyle   = TYPE_COLOR[r.type]   || TYPE_COLOR.other;
                const statusStyle = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
                const StatusIcon  = statusStyle.icon;
                return (
                  <div key={r.id} className="px-6 py-4 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Color dot */}
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${typeStyle.dot}`} />

                      <div className="flex-1 min-w-0">
                        {/* Type + time */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text} capitalize`}>
                            {r.type?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-400 font-medium flex-shrink-0 flex items-center gap-1">
                            <Clock size={11} /> {timeAgo(r.createdAt)}
                          </span>
                        </div>

                        {/* Location */}
                        {r.locationLabel && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mb-1.5">
                            <MapPin size={11} /> {r.locationLabel}
                          </div>
                        )}

                        {/* Description */}
                        {r.description && (
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{r.description}</p>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold flex-shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
                        <StatusIcon size={12} />
                        {statusStyle.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Evidence & upload CTA */}
        <div className="bg-nari-navy rounded-3xl p-6 flex items-center gap-5 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <UploadCloud size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-black text-base mb-0.5">Evidence Locker</div>
            <div className="text-white/60 text-xs font-medium">
              Securely upload photos, audio, or video to support your reports.
            </div>
          </div>
          <Link
            to="/evidence"
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white text-nari-navy font-black text-sm rounded-xl hover:bg-gray-100 transition"
          >
            Open <ArrowRight size={13} />
          </Link>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-800">
            <span className="font-black">Tip:</span> If your report status shows "Pending" for more than 48 hours, contact your local police station directly. Your reference number is the report ID.
          </p>
        </div>

      </div>
    </div>
  );
}
