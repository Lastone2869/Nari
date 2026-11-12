// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, FileText, Lock, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { logout } from '../firebase/auth';
import { getUserReports } from '../firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    // Load user profile
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => { if (snap.exists()) setProfile({ name: snap.data().name || '', phone: snap.data().phone || '' }); })
      .catch((e) => console.error('Profile load failed', e));
    // Load reports
    return getUserReports(user.uid, setReports);
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      // merge: the profile doc may not exist if registration was interrupted
      await setDoc(doc(db, 'users', user.uid), { name: profile.name.trim(), phone: profile.phone.trim() }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Profile save failed', e);
      setError('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const isAnon = user.isAnonymous;

  return (
    <div className="min-h-screen px-4 pb-16 pt-28">
      <div className="max-w-3xl mx-auto">
        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-nari-navy sm:text-4xl">My profile</h1>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Left: Avatar + stats */}
          <div className="space-y-4">
            <div className="nari-card rounded-2xl p-6 text-center shadow-sm">
              <div className="w-20 h-20 rounded-full bg-nari-navy flex items-center justify-center mx-auto mb-4 shadow-md">
                <User size={32} className="text-white" />
              </div>
              <div className="text-nari-navy font-bold text-lg">{isAnon ? 'Anonymous User' : (profile.name || user.displayName || 'User')}</div>
              <div className="text-gray-600 font-medium text-sm mt-0.5">{isAnon ? 'Anonymous Session' : user.email}</div>
              {isAnon && (
                <div className="mt-3 text-xs px-3 py-1.5 rounded-xl bg-nari-amber/10 border border-nari-amber/30 text-nari-amber-deep font-semibold">
                  Anonymous account — data lost on sign out
                </div>
              )}
            </div>

            <div className="nari-card rounded-2xl p-5 shadow-sm">
              <h2 className="text-nari-navy font-bold mb-3">Your activity</h2>
              <div className="space-y-3">
                {[
                  { label: 'Reports Filed', value: reports.length, icon: FileText, color: 'text-nari-navy' },
                  { label: 'Resolved', value: reports.filter((r) => r.status === 'resolved').length, icon: CheckCircle, color: 'text-nari-teal-deep' },
                  { label: 'Pending', value: reports.filter((r) => r.status === 'pending').length, icon: AlertCircle, color: 'text-nari-amber-deep' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                      <Icon size={14} className={color} />{label}
                    </div>
                    <span className="text-nari-navy font-bold text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              id="profile-logout-btn"
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl border border-red-200 bg-white text-red-700 font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={14} />Sign Out
            </button>
          </div>

          {/* Right: Edit profile + reports */}
          <div className="md:col-span-2 space-y-5">
            {!isAnon && (
              <div className="nari-card rounded-2xl p-6 shadow-sm">
                <h2 className="text-nari-navy font-bold mb-4 flex items-center gap-2">
                  <User size={15} className="text-nari-navy" />
                  Edit Profile
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="profile-name" className="text-xs text-gray-500 font-bold mb-1 block">Name</label>
                    <input
                      id="profile-name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="nari-input bg-white border-nari-navy/20 text-nari-navy shadow-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-email" className="text-xs text-gray-500 font-bold mb-1 block">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="profile-email" type="email" value={user.email || ''} readOnly className="nari-input bg-gray-50 border-nari-navy/10 text-gray-600 pl-9 cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="profile-phone" className="text-xs text-gray-500 font-bold mb-1 block">Phone</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="profile-phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="nari-input bg-white border-nari-navy/20 text-nari-navy pl-9 shadow-sm"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>
                  <button
                    id="profile-save-btn"
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-nari-navy text-white font-bold hover:bg-[#132846] hover:shadow-md disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    {saved ? <><CheckCircle size={15} />Saved!</> : saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
                </div>
              </div>
            )}

            {/* My reports */}
            <div className="nari-card rounded-2xl p-6 shadow-sm">
              <h2 className="text-nari-navy font-bold mb-4 flex items-center gap-2">
                <FileText size={15} className="text-nari-navy" />
                My Reports
              </h2>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-semibold text-sm">No reports yet.</p>
                  <Link to="/report" className="text-nari-teal-deep font-bold text-sm hover:underline transition-all inline-block mt-2">File your first report</Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {reports.map((r) => (
                    <Link
                      key={r.id}
                      to={'/track/' + r.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-nari-navy/10 hover:border-nari-navy/30 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <Lock size={13} className="text-nari-navy flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-nari-navy font-bold text-sm capitalize">{r.type?.replace('_', ' ')}</div>
                        <div className="text-gray-600 font-medium text-xs truncate">{r.locationLabel || '—'}</div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'resolved' ? 'badge-resolved' : 'badge-pending'}`}>{r.status}</span>
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
