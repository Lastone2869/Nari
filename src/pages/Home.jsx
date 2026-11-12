import { useState, useRef, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Video,
  Mic,
  Route,
  AlertTriangle,
  Navigation,
  Phone,
  CheckCircle,
  XCircle,
  StopCircle,
  Share2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ensureSignedIn } from '../firebase/auth';
import { startLiveAlert, updateLiveAlertLocation, resolveLiveAlert } from '../firebase/firestore';
import { sosSession } from '../lib/sosSession';

const HOLD_DURATION = 3000;
const PING_INTERVAL = 10000;

// Gets the current position, opens a live alert in Firestore (signing in anonymously if needed)
// and keeps updating it every PING_INTERVAL. Resolves with { stop } once the alert exists.
const startTracking = (onPosition) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const user = await ensureSignedIn();
          const alertId = await startLiveAlert(user.uid, lat, lng);
          onPosition?.(lat, lng);
          let last = Date.now();
          const watchId = navigator.geolocation.watchPosition(
            ({ coords: { latitude, longitude } }) => {
              if (Date.now() - last < PING_INTERVAL) return;
              last = Date.now();
              onPosition?.(latitude, longitude);
              updateLiveAlertLocation(alertId, latitude, longitude).catch((e) => console.error('Location update failed', e));
            },
            (err) => console.error('Location watch error', err),
            { enableHighAccuracy: true, maximumAge: 0 }
          );
          resolve({
            stop: () => {
              navigator.geolocation.clearWatch(watchId);
              return resolveLiveAlert(alertId).catch((e) => console.error('Resolve failed', e));
            },
          });
        } catch (e) {
          reject(e);
        }
      },
      () => reject(new Error('Location access denied')),
      { enableHighAccuracy: true }
    );
  });

const LABELS = { audio: 'Audio', video: 'Video' };

export default function Home() {
  const [emergency, setEmergency] = useState(() => Boolean(sosSession.sosTracker));
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const navigate = useNavigate();

  const [locationSharing, setLocationSharing] = useState(() => Boolean(sosSession.shareTracker));
  const [locationUrl, setLocationUrl] = useState(() => sosSession.shareUrl);
  const [audioRecording, setAudioRecording] = useState(() => Boolean(sosSession.audioRecorder));
  const [videoRecording, setVideoRecording] = useState(() => Boolean(sosSession.videoRecorder));
  const [toast, setToast] = useState(null);

  const holdTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  // Timers belong to this page; trackers and recorders live in sosSession and keep running.
  useEffect(() => () => {
    clearTimeout(holdTimerRef.current);
    clearInterval(progressIntervalRef.current);
    clearTimeout(toastTimerRef.current);
  }, []);

  const handleShareLocationToggle = async () => {
    if (sosSession.shareTracker) {
      const tracker = sosSession.shareTracker;
      sosSession.shareTracker = null;
      sosSession.shareUrl = '';
      await tracker.stop();
      setLocationSharing(false);
      setLocationUrl('');
      showToast('Live location sharing stopped', 'info');
      return;
    }
    if (locationSharing) return; // start already in progress

    setLocationSharing(true);
    showToast('Getting your location...', 'info');
    try {
      let shared = false;
      sosSession.shareTracker = await startTracking((lat, lng) => {
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        sosSession.shareUrl = mapsUrl;
        setLocationUrl(mapsUrl);
        if (shared) return;
        shared = true;
        const shareText = `NARI live location: Track me here -> ${mapsUrl}`;
        if (navigator.share) {
          navigator.share({ title: 'My Live Location - NARI', text: shareText, url: mapsUrl }).catch(() => {
            /* user dismissed the share sheet; the link stays visible on screen */
          });
        } else {
          navigator.clipboard?.writeText(shareText).then(() => showToast('Live location link copied!', 'success')).catch(() => {});
        }
      });
      showToast('Live tracking active!', 'success');
    } catch (e) {
      setLocationSharing(false);
      showToast(e.message, 'error');
    }
  };

  const toggleRecording = async (kind, setRecording) => {
    const key = `${kind}Recorder`;
    const running = sosSession[key];
    if (running) {
      running.addEventListener('stop', () => {
        setRecording(false);
        showToast(`${LABELS[kind]} saved to your downloads`, 'success');
      }, { once: true });
      running.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(kind === 'audio' ? { audio: true } : { video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunks, { type: `${kind}/webm` }));
        const a = Object.assign(document.createElement('a'), { href: url, download: `nari_${kind}_${Date.now()}.webm` });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000); // let the download start before freeing the blob
        stream.getTracks().forEach((t) => t.stop());
        sosSession[key] = null;
      };
      recorder.start();
      sosSession[key] = recorder;
      setRecording(true);
      showToast(`${LABELS[kind]} recording started`, 'info');
    } catch (e) {
      showToast(
        e.name === 'NotAllowedError'
          ? `${kind === 'audio' ? 'Microphone' : 'Camera'} access denied`
          : 'Recording is not supported on this device',
        'error'
      );
    }
  };

  const handleSafeRoutes = () => {
    if (!navigator.geolocation) return navigate('/map');
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        window.open(`https://www.google.com/maps/search/police+station/@${lat},${lng},14z`, '_blank', 'noopener');
      },
      () => navigate('/map')
    );
  };

  const endHold = () => {
    clearTimeout(holdTimerRef.current);
    clearInterval(progressIntervalRef.current);
    setHolding(false);
    setHoldProgress(0);
  };

  const triggerSOS = async () => {
    endHold();
    setEmergency(true);
    try {
      sosSession.sosTracker = await startTracking();
      showToast('Live alert active. Responders can see your location.', 'success');
    } catch (e) {
      setEmergency(false);
      showToast(`Could not start live alert: ${e.message}`, 'error');
    }
  };

  const startHold = () => {
    if (emergency || holding) return;
    setHolding(true);
    const start = Date.now();
    progressIntervalRef.current = setInterval(
      () => setHoldProgress(Math.min(((Date.now() - start) / HOLD_DURATION) * 100, 100)),
      50
    );
    holdTimerRef.current = setTimeout(triggerSOS, HOLD_DURATION);
  };

  const stopEmergency = async () => {
    const tracker = sosSession.sosTracker;
    sosSession.sosTracker = null;
    await tracker?.stop();
    setEmergency(false);
    showToast('Emergency disarmed', 'info');
  };

  return (
    <>
      <div className="flex min-h-screen justify-center bg-gradient-to-b from-white via-[#fbfdff] to-[#f2f7fb] px-4 pb-28 pt-24">
        <div className="flex w-full max-w-[31rem] flex-col gap-5">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_24px_60px_rgba(15,39,67,0.08)] backdrop-blur-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-nari-coral/75">Emergency Console</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-nari-navy">Stay ready, stay connected.</h1>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  One-touch emergency response, fast evidence capture, and location sharing in a single calm interface.
                </p>
              </div>
              <div className="rounded-2xl bg-nari-navy/5 px-3 py-2 text-right">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-nari-navy/45">Status</div>
                <div className={`mt-1 text-sm font-black ${emergency ? 'text-red-600' : 'text-emerald-600'}`}>
                  {emergency ? 'Alert mode' : 'Protected'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-3 shadow-sm">
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${emergency ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className={`text-sm font-bold ${emergency ? 'text-red-600' : 'text-emerald-600'}`}>
                  {emergency ? 'EMERGENCY ACTIVE' : 'You are Safe'}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-500">
                <Navigation size={12} className="text-nari-teal" />
                GPS Ready
              </div>
              <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-500">
                <Shield size={12} className="text-nari-navy" />
                Quick Actions Live
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[380px] flex-col items-center justify-center rounded-[2rem] border border-white/70 bg-white/90 px-6 py-8 shadow-[0_20px_50px_rgba(15,39,67,0.08)]">
            <button
              type="button"
              aria-label="Press and hold for 3 seconds to start an SOS alert"
              aria-pressed={emergency}
              className="relative z-10 flex cursor-pointer touch-none select-none items-center justify-center rounded-full"
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } }}
              onKeyUp={endHold}
            >
              <span
                className={`absolute inset-0 -m-8 rounded-full ${emergency ? 'bg-red-500/20' : 'bg-red-500/10'} animate-ping opacity-20`}
                style={{ animationDuration: '3s' }}
              />
              <span
                className={`absolute inset-0 -m-4 rounded-full ${emergency ? 'bg-red-500/30' : 'bg-red-500/10'} animate-ping opacity-40`}
                style={{ animationDuration: '2s' }}
              />

              <svg viewBox="0 0 200 200" className="pointer-events-none absolute h-[220px] w-[220px] -rotate-90" aria-hidden="true">
                <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(220, 38, 38, 0.1)" strokeWidth="8" />
                <circle
                  cx="100"
                  cy="100"
                  r="95"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="597"
                  strokeDashoffset={597 - (597 * holdProgress) / 100}
                  className="transition-all duration-75 ease-linear"
                />
              </svg>

              <span
                className={`flex h-44 w-44 flex-col items-center justify-center rounded-full text-white transition-all duration-300 ${
                  emergency
                    ? 'scale-95 bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.8)]'
                    : holding
                      ? 'scale-95 bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)]'
                      : 'bg-red-500 shadow-2xl hover:bg-red-600'
                }`}
              >
                <Shield size={48} className={`mb-1 ${holding && !emergency ? 'animate-bounce' : ''}`} />
                <span className="text-2xl font-black uppercase tracking-widest">SOS</span>
                {holding && !emergency && (
                  <span className="pointer-events-none absolute select-none text-6xl font-black text-white/20">
                    {Math.ceil(3 - (holdProgress / 100) * 3)}
                  </span>
                )}
              </span>
            </button>

            <div className="mt-8 flex w-full flex-col items-center gap-3">
              <div className="w-full rounded-full bg-gray-100 px-4 py-2 text-center opacity-90" aria-live="polite">
                {emergency ? (
                  <span className="text-sm font-bold tracking-wide text-red-600">Live location alert active.</span>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Press and hold for 3 seconds</span>
                )}
              </div>
              <p className="max-w-xs text-center text-sm leading-5 text-gray-500">
                Holding the SOS button starts a live alert that shares your location with responders. It keeps running while you use other pages.
              </p>

              {emergency && (
                <button
                  onClick={stopEmergency}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3 font-bold tracking-wide text-white shadow-sm transition-all hover:bg-gray-800 active:scale-95"
                >
                  <XCircle size={18} />
                  Disarm Emergency
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareLocationToggle}
              aria-pressed={locationSharing}
              className={`zomato-card flex min-h-[152px] flex-col gap-3 p-4 text-left transition-all active:scale-95 ${
                locationSharing ? 'bg-blue-600 text-white shadow-[0_18px_40px_rgba(37,99,235,0.22)]' : 'bg-white hover:bg-blue-50'
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${locationSharing ? 'bg-white/20 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                {locationSharing ? <Share2 size={20} className="text-white" /> : <MapPin size={20} />}
              </div>
              <span className={`text-sm font-bold leading-snug whitespace-pre-line ${locationSharing ? 'text-white' : 'text-nari-navy'}`}>
                {locationSharing ? 'Stop Sharing' : 'Share Live\nLocation'}
              </span>
              <span className={`mt-auto text-xs leading-5 ${locationSharing ? 'text-blue-100' : 'text-gray-500'}`}>
                {locationSharing ? 'Tap again to stop the live location stream.' : 'Send a fast trackable map link to trusted contacts.'}
              </span>
            </button>

            <button
              onClick={() => toggleRecording('audio', setAudioRecording)}
              aria-pressed={audioRecording}
              className={`zomato-card flex min-h-[152px] flex-col gap-3 p-4 text-left transition-all active:scale-95 ${
                audioRecording ? 'bg-red-500 text-white shadow-[0_18px_40px_rgba(239,68,68,0.2)]' : 'bg-white hover:bg-red-50'
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${audioRecording ? 'bg-white/20 animate-pulse' : 'bg-red-50 text-red-600'}`}>
                {audioRecording ? <StopCircle size={20} className="text-white" /> : <Mic size={20} />}
              </div>
              <span className={`text-sm font-bold leading-snug whitespace-pre-line ${audioRecording ? 'text-white' : 'text-nari-navy'}`}>
                {audioRecording ? 'Stop Audio' : 'Start Audio\nRecording'}
              </span>
              <span className={`mt-auto text-xs leading-5 ${audioRecording ? 'text-red-50' : 'text-gray-500'}`}>
                Capture audio evidence in the background and save it locally on stop.
              </span>
            </button>

            <button
              onClick={() => toggleRecording('video', setVideoRecording)}
              aria-pressed={videoRecording}
              className={`zomato-card flex min-h-[152px] flex-col gap-3 p-4 text-left transition-all active:scale-95 ${
                videoRecording ? 'bg-teal-500 text-white shadow-[0_18px_40px_rgba(20,184,166,0.2)]' : 'bg-white hover:bg-teal-50'
              }`}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${videoRecording ? 'bg-white/20 animate-pulse' : 'bg-teal-50 text-teal-600'}`}>
                {videoRecording ? <StopCircle size={20} className="text-white" /> : <Video size={20} />}
              </div>
              <span className={`text-sm font-bold leading-snug whitespace-pre-line ${videoRecording ? 'text-white' : 'text-nari-navy'}`}>
                {videoRecording ? 'Stop Video' : 'Start Video\nRecording'}
              </span>
              <span className={`mt-auto text-xs leading-5 ${videoRecording ? 'text-teal-50' : 'text-gray-500'}`}>
                Record video with audio for fast evidence capture during an incident.
              </span>
            </button>

            <button
              onClick={handleSafeRoutes}
              className="zomato-card flex min-h-[152px] flex-col gap-3 bg-white p-4 text-left transition-all hover:bg-emerald-50 active:scale-95"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Route size={20} />
              </div>
              <span className="text-sm font-bold leading-snug whitespace-pre-line text-nari-navy">Find Safe{`\n`}Routes</span>
              <span className="mt-auto text-xs leading-5 text-gray-500">
                Open nearby police and help points based on your current location.
              </span>
            </button>
          </div>

          {locationSharing && locationUrl && (
            <div className="flex items-center gap-3 rounded-[1.75rem] border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500 animate-pulse" />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 text-xs font-black uppercase tracking-widest text-blue-700">Live Tracking Active</div>
                <a href={locationUrl} target="_blank" rel="noreferrer" className="block truncate text-xs font-medium text-blue-600 underline">
                  {locationUrl}
                </a>
              </div>
            </div>
          )}

          <div className="zomato-card overflow-hidden bg-white p-0">
            <div className="relative overflow-hidden rounded-[1.8rem] bg-[radial-gradient(circle_at_top_right,_rgba(79,209,197,0.22),_transparent_38%),linear-gradient(135deg,_#1A365D_0%,_#25538C_55%,_#4FD1C5_130%)] px-5 py-5 text-white">
              <div className="absolute -right-10 top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 h-20 w-full bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />
              <div className="relative z-10">
                <div className="text-[11px] font-black uppercase tracking-[0.26em] text-white/70">Safety Snapshot</div>
                <div className="mt-2 text-xl font-black tracking-tight">Nearby support at a glance</div>
                <p className="mt-2 max-w-xs text-sm leading-6 text-white/80">
                  Use the map page for detailed routes, incident clusters, and verified safe spaces around you.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Police stations', 'Hospitals', 'Safe zones'].map((item) => (
                    <span key={item} className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">One-Tap Emergency</div>
            <div className="flex flex-col gap-2">
              {[
                { name: 'Police Control Room', number: '100', color: 'text-blue-600', bg: 'bg-blue-50' },
                { name: 'Women Helpline', number: '1091', color: 'text-pink-600', bg: 'bg-pink-50' },
                { name: 'Ambulance', number: '108', color: 'text-red-600', bg: 'bg-red-50' },
              ].map((contact) => (
                <a
                  key={contact.name}
                  href={`tel:${contact.number}`}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-3 transition-colors active:scale-[0.98] hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${contact.bg} ${contact.color}`}>
                      <Phone size={18} fill="currentColor" opacity={0.2} />
                    </div>
                    <span className="text-sm font-bold text-nari-navy">{contact.name}</span>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-black text-gray-700 shadow-sm">
                    {contact.number}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="mb-2 flex items-start gap-3 rounded-2xl bg-gray-100 p-4">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
            <div className="text-xs font-medium text-gray-600">
              <span className="font-bold text-gray-800">Tip:</span> Add NARI to your home screen for one-tap access. Recording and live alerts keep running while you switch pages, but stop if the browser tab is closed.
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-28 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl ${
            toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={16} />
          ) : toast.type === 'error' ? (
            <XCircle size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
          {toast.msg}
        </div>
      )}
    </>
  );
}
