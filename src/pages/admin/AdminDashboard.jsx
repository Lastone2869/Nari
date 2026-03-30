import { useEffect, useState } from 'react';
import { getAllUsersAdmin, getAllReportsAdmin, subscribeToLiveAlertsAdmin } from '../../firebase/firestore';
import { Users, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ users: 0, reports: 0, verifiedReports: 0, activeAlerts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs = [];
    
    unsubs.push(getAllUsersAdmin((users) => {
      setCounts(prev => ({ ...prev, users: users.length }));
    }));

    unsubs.push(getAllReportsAdmin((reports) => {
      setCounts(prev => ({ 
        ...prev, 
        reports: reports.length,
        verifiedReports: reports.filter(r => r.status === 'verified').length 
      }));
    }));

    unsubs.push(subscribeToLiveAlertsAdmin((alerts) => {
      setCounts(prev => ({ ...prev, activeAlerts: alerts.length }));
      setLoading(false); // Assume done when alerts load
    }));

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const statCards = [
    { title: 'Total Users', value: counts.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Reports', value: counts.reports, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Verified Incidents', value: counts.verifiedReports, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Live SOS Alerts', value: counts.activeAlerts, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', pulse: true },
  ];

  if (loading) return <div className="text-gray-500 font-bold p-8">Loading Telemetry...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-nari-navy">Platform Overview</h2>
        {counts.activeAlerts > 0 && (
          <div className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-full flex items-center gap-2 animate-pulse shadow-sm">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            {counts.activeAlerts} ACTIVE SOS
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} ${stat.pulse && stat.value > 0 ? 'animate-pulse' : ''}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-3xl font-black text-gray-900">{stat.value}</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature placeholder for charts */}
      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64 flex flex-col justify-center items-center text-gray-400">
          <div className="text-lg font-bold">Activity Heatmap</div>
          <p className="text-sm">ChartJS / Recharts integration pending</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64 flex flex-col justify-center items-center text-gray-400">
          <div className="text-lg font-bold">Registration Trends</div>
          <p className="text-sm">ChartJS / Recharts integration pending</p>
        </div>
      </div>
    </div>
  );
}
