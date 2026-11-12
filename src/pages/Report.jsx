import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Eye,
  EyeOff,
  FileText,
  Lightbulb,
  MapPin,
  Shield,
} from 'lucide-react';
import { ensureSignedIn } from '../firebase/auth';
import { addReport } from '../firebase/firestore';

const MAX_DESCRIPTION = 2000; // mirrored in firestore.rules

const CATEGORIES = [
  {
    id: 'harassment',
    label: 'Harassment',
    icon: AlertTriangle,
    activeClass: 'border-red-200 bg-red-50',
    iconClass: 'bg-red-100 text-red-600',
  },
  {
    id: 'theft',
    label: 'Theft / Robbery',
    icon: Shield,
    activeClass: 'border-amber-200 bg-amber-50',
    iconClass: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'unsafe_area',
    label: 'Unsafe Area',
    icon: MapPin,
    activeClass: 'border-orange-200 bg-orange-50',
    iconClass: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'stalking',
    label: 'Stalking',
    icon: Eye,
    activeClass: 'border-fuchsia-200 bg-fuchsia-50',
    iconClass: 'bg-fuchsia-100 text-fuchsia-600',
  },
  {
    id: 'poor_lighting',
    label: 'Poor Lighting',
    icon: Lightbulb,
    activeClass: 'border-yellow-200 bg-yellow-50',
    iconClass: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'other',
    label: 'Other',
    icon: FileText,
    activeClass: 'border-slate-200 bg-slate-50',
    iconClass: 'bg-slate-100 text-slate-600',
  },
];

const STEPS = ['Category', 'Details', 'Location', 'Submit'];

export default function Report() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [form, setForm] = useState({
    type: '',
    description: '',
    lat: null,
    lng: null,
    locationLabel: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [reportId, setReportId] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return alert('Location is not supported on this device.');
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          locationLabel: f.locationLabel || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        }));
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
        alert('Location access denied. Please enable it.');
      }
    );
  };

  const submit = async () => {
    setLoading(true);
    try {
      const user = await ensureSignedIn(); // rules need a signed-in author even for anonymous reports
      const id = await addReport({
        type: form.type,
        description: form.description.trim(),
        location: form.lat === null ? null : { lat: form.lat, lng: form.lng },
        locationLabel: form.locationLabel.trim(),
        anonymous,
      }, anonymous ? null : user.uid);
      setReportId(id);
      setDone(true);
    } catch (e) {
      alert(`Error submitting report: ${e.message}`); // shortcut: native dialog, matches detectLocation
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="glass-card animate-slide-up w-full max-w-md rounded-[2rem] p-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-200 bg-green-50">
            <CheckCircle size={36} className="text-green-600" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold text-nari-navy">Report Submitted</h2>
          <p className="mb-4 text-gray-600">Your report has been securely logged.</p>
          <div className="mb-6 rounded-2xl bg-gray-50 p-4">
            <p className="mb-1 text-xs text-gray-500">Your Report ID</p>
            <p className="font-mono text-sm font-bold text-nari-navy">{reportId}</p>
            <p className="mt-1 text-xs text-gray-600">Use this to track your report later.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/track/${reportId}`)} className="flex-1 rounded-xl bg-nari-navy py-3 font-semibold text-white transition-colors hover:bg-[#132846]">
              Track Status
            </button>
            <button
              onClick={() => {
                setDone(false);
                setStep(0);
                setForm({ type: '', description: '', lat: null, lng: null, locationLabel: '' });
              }}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-gray-700 transition-colors hover:bg-gray-50"
            >
              New Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 px-4 pb-10 pt-24 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-black tracking-tight text-nari-navy">File a Report</h1>
          <p className="text-base text-gray-600">Quick, secure, and anonymous if you choose.</p>
        </div>

        <div className="mb-8 flex items-start gap-2 sm:items-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-all ${
                  i < step
                    ? 'bg-nari-teal text-white'
                    : i === step
                      ? 'bg-nari-navy text-white'
                      : 'border border-nari-navy/20 bg-white text-gray-500'
                }`}
              >
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`ml-2 hidden text-xs font-bold sm:block ${i === step ? 'text-nari-navy' : 'text-gray-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`mx-3 h-px flex-1 ${i < step ? 'bg-nari-teal/50' : 'bg-nari-navy/10'}`} />}
            </div>
          ))}
        </div>

        <div className="zomato-card bg-white p-6 md:p-10">
          <div className="mb-6 flex items-center justify-between rounded-xl border border-nari-navy/10 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <EyeOff size={16} className="text-gray-500" />
              <span className="text-sm font-bold text-nari-navy">Anonymous Report</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={anonymous}
              aria-label="Submit anonymously"
              onClick={() => setAnonymous(!anonymous)}
              className={`relative h-6 w-12 rounded-full border border-nari-navy/10 shadow-inner transition-colors ${anonymous ? 'bg-nari-navy' : 'bg-gray-100'}`}
            >
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${anonymous ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="mb-4 font-bold text-nari-navy">What happened?</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {CATEGORIES.map(({ id, label, icon: Icon, activeClass, iconClass }) => (
                  <button
                    key={id}
                    id={`cat-${id}`}
                    onClick={() => setForm({ ...form, type: id })}
                    className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 bg-white p-6 transition-all hover:-translate-y-1 ${
                      form.type === id ? `${activeClass} -translate-y-1 shadow-md` : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${iconClass}`}>
                      <Icon size={26} strokeWidth={2.2} />
                    </div>
                    <div className="text-center text-sm font-bold text-nari-navy">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-nari-navy">
                  Describe the incident <span className="font-normal text-gray-500">(keep it factual)</span>
                </label>
                <textarea
                  id="report-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What happened? Who was involved? Any identifying details..."
                  rows={5}
                  maxLength={MAX_DESCRIPTION}
                  className="nari-input w-full resize-none"
                />
                <div className="mt-1 text-right text-xs text-gray-400">{form.description.length}/{MAX_DESCRIPTION}</div>
              </div>
              <div className="flex gap-2 rounded-xl border border-nari-amber/30 bg-nari-amber/10 p-3 text-xs font-semibold text-[#A56600] shadow-sm">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                Do not include your own personal information. Stick to facts only.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <h2 className="font-bold text-nari-navy">Where did it happen?</h2>
              <button
                id="detect-location-btn"
                onClick={detectLocation}
                disabled={locLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-nari-navy/30 bg-white py-4 font-bold text-nari-navy transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                <MapPin size={20} />
                {locLoading ? 'Detecting...' : form.lat !== null ? 'Location Detected' : 'Auto-Detect My Location'}
              </button>
              {form.lat !== null && (
                <div className="rounded-xl border border-nari-teal/30 bg-nari-teal/10 p-3 text-sm font-bold text-nari-teal shadow-sm">
                  {form.locationLabel}
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-bold text-nari-navy">Or describe the location</label>
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

          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <h2 className="mb-4 font-bold text-nari-navy">Review and Submit</h2>
              {[
                { label: 'Category', value: CATEGORIES.find((c) => c.id === form.type)?.label || 'Not selected' },
                { label: 'Description', value: form.description || 'Not provided' },
                { label: 'Location', value: form.locationLabel || 'Not specified' },
                { label: 'Anonymous', value: anonymous ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 rounded-xl border border-nari-navy/10 bg-white p-3 shadow-sm">
                  <span className="w-28 flex-shrink-0 text-sm font-semibold text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-nari-navy">{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex gap-4">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-6 py-4 text-lg font-bold text-nari-navy transition-all hover:bg-gray-50"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}
            <button
              id="report-next-btn"
              disabled={(step === 0 && !form.type) || (step === 1 && !form.description.trim()) || loading}
              onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : submit())}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-nari-navy py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-[#132846] disabled:opacity-40"
            >
              {loading ? 'Submitting...' : step < STEPS.length - 1 ? <>Next <ChevronRight size={20} /></> : <><CheckCircle size={20} /> Submit Report</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
