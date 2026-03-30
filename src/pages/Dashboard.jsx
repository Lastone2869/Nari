// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, AlertTriangle, CheckCircle, TrendingUp, MapPin, Bell, ArrowRight, Clock } from 'lucide-react';
import { getRecentReports, getActiveAlerts } from '../firebase/firestore';

const timeAgo = (ts) => {
  if (!ts?.toDate) return 'just now';
  const diff = Date.now() - ts.toDate().getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return Math.floor(diff / 86400000) + 'd ago';
};

const CATEGORY_DOT = {
  harassment: 'bg-red-500',
  theft: 'bg-amber-500',
  unsafe_area: 'bg-orange-500',
  stalking: 'bg-purple-500',
  poor_lighting: 'bg-yellow-500',
  other: 'bg-gray-500',
};

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const u1 = getRecentReports(setReports, 20);
    const u2 = getActiveAlerts(setAlerts);
    return () => { u1(); u2(); };
  }, []);

  const resolved = reports.filter((r) => r.status === 'resolved').length;
  const pending = reports.filter((r) => r.status === 'pending').length;

  const stats = [
    { label: 'Total Reports', value: reports.length, icon: FileText, color: 'text-nari-navy', bg: 'bg-nari-navy/10 border-nari-navy/20' },
    { label: 'Active Alerts', value: alerts.length, icon: Bell, color: 'text-nari-coral', bg: 'bg-nari-coral/10 border-nari-coral/20' },
    { label: 'Pending Review', value: pending, icon: Clock, color: 'text-nari-amber', bg: 'bg-nari-amber/10 border-nari-amber/20' },
    { label: 'Resolved', value: resolved, icon: CheckCircle, color: 'text-nari-teal', bg: 'bg-nari-teal/10 border-nari-teal/20' },
  ];

  // Category breakdown
  const cats = {};
  reports.forEach((r) => { cats[r.type] = (cats[r.type] || 0) + 1; });
  const catArr = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen pt-24 pb-10 px-4 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-nari-navy mb-2 tracking-tight">Community Dashboard</h1>
            <p className="text-gray-600 text-base">Real-time safety intelligence across your community.</p>
          </div>
          <Link to="/report" id="dashboard-report-btn" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nari-navy text-white font-semibold hover:bg-[#132846] transition-colors self-start shadow-sm">
            <FileText size={15} />
            New Report
          </Link>
        </div>

        {/* Predictive alert banner */}
        {alerts.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-nari-coral/10 border border-nari-coral/20 flex items-start gap-3 animate-fade-in shadow-sm">
            <div className="w-8 h-8 rounded-full bg-nari-coral/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-nari-coral" />
            </div>
            <div className="flex-1">
              <div className="text-nari-coral font-bold text-sm mb-0.5">⚠️ Active Safety Alert</div>
              <div className="text-gray-600 text-xs">{alerts.length} active SOS alert{alerts.length > 1 ? 's' : ''} in your area. Please stay vigilant.</div>
            </div>
            <Link to="/map" className="text-nari-coral hover:text-[#e55353] text-xs font-bold flex items-center gap-1">
              View Map <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`zomato-card bg-white p-6 ${bg.replace('bg-','').replace('border-','')} border-0`}>
              <Icon size={24} className={`${color} mb-4 opacity-80`} />
              <div className="text-4xl font-black text-nari-navy mb-1">{value}</div>
              <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 zomato-card bg-white p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-nari-navy font-bold">Live Report Feed</h2>
              <div className="flex items-center gap-1.5 text-xs text-nari-teal font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-nari-teal animate-pulse" />
                Live
              </div>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {reports.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-gray-400" />
                  </div>
                  <p className="text-nari-navy font-bold text-lg mb-1">No reports yet</p>
                  <p className="text-gray-500 text-sm">Your community is peaceful. Be the first to report an incident.</p>
                </div>
              )}
              {reports.map((r) => (
                <div key={r.id} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-gray-100">
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${CATEGORY_DOT[r.type] || 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-nari-navy text-base font-bold capitalize">{r.type?.replace('_', ' ')}</span>
                      <span className="text-gray-500 text-xs flex-shrink-0 font-bold">{timeAgo(r.createdAt)}</span>
                    </div>
                    <div className="text-gray-600 text-xs mt-1 flex items-center gap-1 font-medium">
                      <MapPin size={12} />
                      {r.locationLabel || 'Unknown location'}
                    </div>
                    {r.description && (
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2 leading-relaxed">{r.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold flex-shrink-0 ${
                    r.status === 'resolved' ? 'badge-resolved' : r.status === 'verified' ? 'badge-verified' : 'badge-pending'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category breakdown */}
            <div className="zomato-card bg-white p-6">
              <h2 className="text-nari-navy font-bold mb-4 flex items-center gap-2 text-lg">
                <TrendingUp size={16} className="text-nari-teal" />
                Incident Types
              </h2>
              {catArr.length === 0 && <p className="text-gray-500 text-sm">No data yet.</p>}
              <div className="space-y-3">
                {catArr.map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1 font-semibold">
                      <span className="text-gray-600 capitalize">{cat.replace('_', ' ')}</span>
                      <span className="text-nari-navy">{count}</span>
                    </div>
                    <div className="h-1.5 bg-nari-navy/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-nari-navy to-nari-amber transition-all duration-700"
                        style={{ width: `${(count / reports.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="zomato-card bg-white p-6">
              <h2 className="text-nari-navy font-bold mb-4 text-lg">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { to: '/report', label: 'File New Report', icon: FileText },
                  { to: '/map', label: 'View Safety Map', icon: MapPin },
                  { to: '/evidence', label: 'Upload Evidence', icon: CheckCircle },
                  { to: '/track/0', label: 'Track Complaint', icon: Clock },
                ].map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-nari-navy/5 bg-white border border-nari-navy/5 shadow-sm group transition-colors">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 group-hover:text-nari-navy transition-colors">
                      <Icon size={14} className="text-nari-teal" />
                      {label}
                    </div>
                    <ArrowRight size={12} className="text-gray-400 group-hover:text-nari-navy transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Community stats */}
            <div className="zomato-card bg-white p-6 text-center">
              <Users size={28} className="text-nari-teal mx-auto mb-3" />
              <div className="text-2xl font-bold text-nari-navy">{reports.length * 3 + 47}</div>
              <div className="text-gray-500 text-xs font-semibold">Community Members Active</div>
              <div className="mt-3 h-1.5 bg-nari-navy/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-nari-teal rounded-full" />
              </div>
              <div className="text-xs text-nari-navy mt-1 font-semibold">Safety Network Strength</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
