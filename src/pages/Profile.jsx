// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Shield, FileText, Lock, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { getUserReports } from '../firebase/firestore';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load user profile
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) setProfile({ name: snap.data().name || '', phone: snap.data().phone || '' });
    });
    // Load reports
    return getUserReports(user.uid, setReports);
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await updateDoc(doc(db, 'users', user.uid), { name: profile.name, phone: profile.phone });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center px-4 pt-20">
    <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
      <Shield size={28} className="text-violet-400 mx-auto mb-3" />
      <p className="text-white font-semibold mb-3">Please sign in to view your profile</p>
      <Link to="/login" className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors">Sign In</Link>
    </div>
  </div>;

  const isAnon = user.isAnonymous;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 grid-bg">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-8">My Profile</h1>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Left: Avatar + stats */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mx-auto mb-4 glow-violet">
                <User size={32} className="text-white" />
              </div>
              <div className="text-white font-semibold text-lg">{isAnon ? 'Anonymous User' : (profile.name || user.displayName || 'User')}</div>
              <div className="text-gray-500 text-sm mt-0.5">{isAnon ? 'Anonymous Session' : user.email}</div>
              {isAnon && (
                <div className="mt-3 text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Anonymous account — data lost on sign out
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-white font-medium mb-3 text-sm">Your Activity</h3>
              <div className="space-y-3">
                {[
                  { label: 'Reports Filed', value: reports.length, icon: FileText, color: 'text-violet-400' },
                  { label: 'Resolved', value: reports.filter((r) => r.status === 'resolved').length, icon: CheckCircle, color: 'text-green-400' },
                  { label: 'Pending', value: reports.filter((r) => r.status === 'pending').length, icon: AlertCircle, color: 'text-amber-400' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Icon size={13} className={color} />{label}
                    </div>
                    <span className="text-white font-semibold text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              id="profile-logout-btn"
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={14} />Sign Out
            </button>
          </div>

          {/* Right: Edit profile + reports */}
          <div className="md:col-span-2 space-y-5">
            {!isAnon && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <User size={15} className="text-violet-400" />
                  Edit Profile
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Name</label>
                    <input
                      id="profile-name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="nari-input"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input type="email" value={user.email || ''} readOnly className="nari-input pl-9 opacity-50 cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Phone</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        id="profile-phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="nari-input pl-9"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>
                  <button
                    id="profile-save-btn"
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {saved ? <><CheckCircle size={15} />Saved!</> : saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* My reports */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FileText size={15} className="text-violet-400" />
                My Reports
              </h2>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={24} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No reports yet.</p>
                  <Link to="/report" className="text-violet-400 text-sm hover:text-violet-300 transition-colors">File your first report →</Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {reports.map((r) => (
                    <Link
                      key={r.id}
                      to={'/track/' + r.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-600/20 hover:bg-violet-600/5 transition-all"
                    >
                      <Lock size={13} className="text-violet-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm capitalize">{r.type?.replace('_', ' ')}</div>
                        <div className="text-gray-500 text-xs truncate">{r.locationLabel || '—'}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'resolved' ? 'badge-resolved' : 'badge-pending'}`}>{r.status}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
