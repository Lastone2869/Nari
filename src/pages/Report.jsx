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
    <div className="min-h-screen pt-24 pb-10 px-4 bg-gray-50/50 flex flex-col items-center">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-nari-navy mb-2 tracking-tight">File a Report</h1>
          <p className="text-gray-600 text-base">Quick, secure, and anonymous if you choose.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                i < step ? 'bg-nari-teal text-white' : i === step ? 'bg-nari-navy text-white' : 'bg-white border border-nari-navy/20 text-gray-500'
              }`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`ml-2 text-xs font-bold ${i === step ? 'text-nari-navy' : 'text-gray-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-nari-teal/50' : 'bg-nari-navy/10'}`} />}
            </div>
          ))}
        </div>

        <div className="zomato-card bg-white p-6 md:p-10">
          {/* Anonymous toggle */}
          <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-white border border-nari-navy/10 shadow-sm">
            <div className="flex items-center gap-2">
              <EyeOff size={16} className="text-gray-500" />
              <span className="text-sm text-nari-navy font-bold">Anonymous Report</span>
            </div>
            <button
              onClick={() => setAnonymous(!anonymous)}
              className={`relative w-12 h-6 rounded-full transition-colors shadow-inner border border-nari-navy/10 ${anonymous ? 'bg-nari-navy' : 'bg-gray-100'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${anonymous ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-nari-navy font-bold mb-4">What happened?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {CATEGORIES.map(({ id, label, emoji, color }) => (
                  <button
                    key={id}
                    id={`cat-${id}`}
                    onClick={() => setForm({ ...form, type: id })}
                    className={`flex flex-col items-center justify-center p-6 min-h-[140px] rounded-3xl border-2 transition-all hover:-translate-y-1 bg-white cursor-pointer ${
                      form.type === id ? color + ' -translate-y-1 border-4 shadow-md' : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="text-4xl mb-3">{emoji}</div>
                    <div className="text-sm font-bold text-center text-nari-navy">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Description */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label className="text-sm text-nari-navy font-bold mb-2 block">Describe the incident <span className="text-gray-500 font-normal">(keep it factual)</span></label>
                <textarea
                  id="report-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What happened? Who was involved? Any identifying details..."
                  rows={5}
                  className="nari-input resize-none w-full"
                />
              </div>
              <div className="p-3 rounded-xl bg-nari-amber/10 border border-nari-amber/30 text-nari-amber font-semibold text-xs flex gap-2 shadow-sm">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                Do not include your own personal information. Stick to facts only.
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-nari-navy font-bold">Where did it happen?</h2>
              <button
                id="detect-location-btn"
                onClick={detectLocation}
                disabled={locLoading}
                className="w-full py-4 rounded-xl bg-white border-2 border-dashed border-nari-navy/30 text-nari-navy font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <MapPin size={20} />
                {locLoading ? 'Detecting…' : form.lat ? 'Location Detected ✓' : 'Auto-Detect My Location'}
              </button>
              {form.lat && (
                <div className="p-3 rounded-xl bg-nari-teal/10 border border-nari-teal/30 text-nari-teal text-sm font-bold shadow-sm">
                  📍 {form.locationLabel}
                </div>
              )}
              <div>
                <label className="text-sm text-nari-navy font-bold mb-2 block">Or describe the location</label>
                <input
                  id="location-label"
                  type="text"
                  value={form.locationLabel}
                  onChange={(e) => setForm({ ...form, locationLabel: e.target.value })}
                  placeholder="e.g. Near Metro Station Gate 2, Sector 5"
                  className="nari-input w-full"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-nari-navy font-bold mb-4">Review & Submit</h2>
              {[
                { label: 'Category', value: CATEGORIES.find((c) => c.id === form.type)?.label || '—' },
                { label: 'Description', value: form.description || '—' },
                { label: 'Location', value: form.locationLabel || 'Not specified' },
                { label: 'Anonymous', value: anonymous ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 p-3 rounded-xl bg-white border border-nari-navy/10 shadow-sm">
                  <span className="text-gray-500 text-sm font-semibold w-28 flex-shrink-0">{label}</span>
                  <span className="text-nari-navy font-medium text-sm">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-10">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 px-6 py-4 rounded-xl bg-white border border-gray-200 text-nari-navy font-bold hover:bg-gray-50 transition-all text-lg">
                <ChevronLeft size={20} /> Back
              </button>
            )}
            <button
              id="report-next-btn"
              disabled={(step === 0 && !form.type) || loading}
              onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : submit()}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-nari-navy text-white font-bold hover:bg-[#132846] disabled:opacity-40 transition-all shadow-md text-lg"
            >
              {loading ? 'Submitting…' : step < STEPS.length - 1 ? (<>Next <ChevronRight size={20} /></>) : (<><CheckCircle size={20} /> Submit Report</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
