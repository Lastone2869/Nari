// src/pages/Report.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, FileText, Camera, AlertCircle, ChevronRight, ChevronLeft, CheckCircle, User, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addReport } from '../firebase/firestore';

const CATEGORIES = [
  { id: 'harassment', label: 'Harassment', emoji: '⚠️', color: 'border-red-500/50 bg-red-500/10 text-red-300' },
  { id: 'theft', label: 'Theft / Robbery', emoji: '🔓', color: 'border-amber-500/50 bg-amber-500/10 text-amber-300' },
  { id: 'unsafe_area', label: 'Unsafe Area', emoji: '🚫', color: 'border-orange-500/50 bg-orange-500/10 text-orange-300' },
  { id: 'stalking', label: 'Stalking', emoji: '👁️', color: 'border-purple-500/50 bg-purple-500/10 text-purple-300' },
  { id: 'poor_lighting', label: 'Poor Lighting', emoji: '💡', color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' },
  { id: 'other', label: 'Other', emoji: '📋', color: 'border-gray-500/50 bg-gray-500/10 text-gray-300' },
];

const STEPS = ['Category', 'Details', 'Location', 'Submit'];

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [form, setForm] = useState({
    type: '',
    description: '',
    lat: null,
    lng: null,
    locationLabel: '',
    mediaUrls: [],
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [reportId, setReportId] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  const detectLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({ ...form, lat: pos.coords.latitude, lng: pos.coords.longitude, locationLabel: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
        setLocLoading(false);
      },
      () => { setLocLoading(false); alert('Location access denied. Please enable it.'); }
    );
  };

  const submit = async () => {
    setLoading(true);
    try {
      const id = await addReport({
        userId: anonymous ? 'anonymous' : (user?.uid || 'anonymous'),
        type: form.type,
        description: form.description,
        location: { lat: form.lat || 0, lng: form.lng || 0 },
        locationLabel: form.locationLabel,
        mediaUrls: form.mediaUrls,
        anonymous,
      });
      setReportId(id);
      setDone(true);
    } catch (e) {
      alert('Error submitting report: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="max-w-md w-full text-center glass-card rounded-3xl p-10 animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Report Submitted!</h2>
          <p className="text-gray-400 mb-4">Your complaint has been securely logged.</p>
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Your Report ID</p>
            <p className="text-violet-300 font-mono text-sm font-bold">{reportId}</p>
            <p className="text-xs text-gray-600 mt-1">Save this to track your complaint</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/track/' + reportId)} className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors">
              Track Status
            </button>
            <button onClick={() => { setDone(false); setStep(0); setForm({ type: '', description: '', lat: null, lng: null, locationLabel: '', mediaUrls: [] }); }}
              className="flex-1 py-3 rounded-xl glass border border-white/10 text-gray-300 hover:bg-white/5 transition-colors">
              New Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 grid-bg">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">File a Report</h1>
          <p className="text-gray-500 text-sm">Quick, secure, and anonymous if you choose.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-violet-600 text-white' : 'bg-white/10 text-gray-500'
              }`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`ml-2 text-xs font-medium ${i === step ? 'text-violet-300' : 'text-gray-600'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-green-500/50' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-8">
          {/* Anonymous toggle */}
          <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <EyeOff size={16} className="text-gray-400" />
              <span className="text-sm text-gray-300 font-medium">Anonymous Report</span>
            </div>
            <button
              onClick={() => setAnonymous(!anonymous)}
              className={`relative w-12 h-6 rounded-full transition-colors ${anonymous ? 'bg-violet-600' : 'bg-white/20'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${anonymous ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-white font-semibold mb-4">What happened?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map(({ id, label, emoji, color }) => (
                  <button
                    key={id}
                    id={`cat-${id}`}
                    onClick={() => setForm({ ...form, type: id })}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                      form.type === id ? color + ' scale-[1.02]' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-2">{emoji}</div>
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Description */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label className="text-sm text-gray-400 font-medium mb-2 block">Describe the incident <span className="text-gray-600">(keep it factual)</span></label>
                <textarea
                  id="report-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What happened? Who was involved? Any identifying details..."
                  rows={5}
                  className="nari-input resize-none"
                />
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex gap-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                Do not include your own personal information. Stick to facts only.
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-white font-semibold">Where did it happen?</h2>
              <button
                id="detect-location-btn"
                onClick={detectLocation}
                disabled={locLoading}
                className="w-full py-3 rounded-xl glass border border-violet-600/30 text-violet-300 font-medium flex items-center justify-center gap-2 hover:bg-violet-600/10 transition-all disabled:opacity-50"
              >
                <MapPin size={16} />
                {locLoading ? 'Detecting…' : form.lat ? 'Location Detected ✓' : 'Auto-Detect My Location'}
              </button>
              {form.lat && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
                  📍 {form.locationLabel}
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Or describe the location</label>
                <input
                  id="location-label"
                  type="text"
                  value={form.locationLabel}
                  onChange={(e) => setForm({ ...form, locationLabel: e.target.value })}
                  placeholder="e.g. Near Metro Station Gate 2, Sector 5"
                  className="nari-input"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-white font-semibold mb-4">Review & Submit</h2>
              {[
                { label: 'Category', value: CATEGORIES.find((c) => c.id === form.type)?.label || '—' },
                { label: 'Description', value: form.description || '—' },
                { label: 'Location', value: form.locationLabel || 'Not specified' },
                { label: 'Anonymous', value: anonymous ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-gray-500 text-sm w-28 flex-shrink-0">{label}</span>
                  <span className="text-white text-sm">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-5 py-3 rounded-xl glass border border-white/10 text-gray-300 hover:bg-white/5 transition-all">
                <ChevronLeft size={16} /> Back
              </button>
            )}
            <button
              id="report-next-btn"
              disabled={(step === 0 && !form.type) || loading}
              onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : submit()}
              className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-40 transition-all"
            >
              {loading ? 'Submitting…' : step < STEPS.length - 1 ? (<>Next <ChevronRight size={16} /></>) : (<><CheckCircle size={16} /> Submit Report</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
