import { useState, useRef, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Video,
  Mic,
  Route,
  AlertTriangle,
  Phone,
  CheckCircle,
  XCircle,
  StopCircle,
  Share2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ensureSignedIn } from '../firebase/auth';
import { startLiveAlert, updateLiveAlertLocation, resolveLiveAlert } from '../firebase/firestore';
import { sosSession } from '../lib/sosSession';
import { saveFile, SAVE_PLACE } from '../lib/saveFile';

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

const CONTACTS = [
  { name: 'Police control room', number: '100' },
  { name: 'Women helpline', number: '1091' },
  { name: 'Ambulance', number: '108' },
];

// One quick action. Toggles pass `active`; a filled tile means "this is running now".
function ActionTile({ icon: Icon, activeIcon: ActiveIcon = Icon, title, hint, active, tone = 'navy', ...props }) {
  const on = tone === 'red' ? 'border-red-600 bg-red-600 text-white' : 'border-nari-navy bg-nari-navy text-white';
  return (
    <button
      type="button"
      aria-pressed={active}
      {...props}
      className={`flex min-h-[132px] flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors active:scale-[0.98] ${
        active ? on : 'border-nari-navy/10 bg-white text-nari-navy hover:border-nari-navy/35'
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-nari-navy/[0.06]'}`}>
        {active ? <ActiveIcon size={20} /> : <Icon size={20} />}
      </span>
      <span className="text-[15px] font-bold leading-tight">{title}</span>
      <span className={`text-[13px] leading-5 ${active ? 'text-white/85' : 'text-gray-600'}`}>{hint}</span>
    </button>
  );
}

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
        showToast(`${LABELS[kind]} saved to ${SAVE_PLACE}`, 'success');
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
        saveFile(new Blob(chunks, { type: `${kind}/webm` }), `nari_${kind}_${Date.now()}.webm`).catch((e) => {
          console.error('Saving the recording failed', e);
          alert('The recording could not be saved.'); // evidence was lost, so this must not be silent
        });
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
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          <section
            className={`nari-card flex flex-col items-center justify-center px-6 py-10 text-center transition-colors lg:py-14 ${
              emergency ? 'border-red-300 bg-red-50' : ''
            }`}
          >
            <h1 className="text-3xl font-extrabold tracking-tight text-nari-navy sm:text-[2.6rem] sm:leading-[1.1]">
              {emergency ? 'Your alert is live' : 'Need help now?'}
            </h1>
            <p className="mt-3 max-w-sm text-[15px] leading-6 text-gray-600">
              {emergency
                ? 'Responders can see where you are. Your location keeps updating until you disarm, even if you open other pages.'
                : 'Press and hold SOS for 3 seconds. Your live location goes to NARI responders until you disarm.'}
            </p>

            <button
              type="button"
              aria-label="Press and hold for 3 seconds to start an SOS alert"
              aria-pressed={emergency}
              className="relative mt-10 flex cursor-pointer touch-none select-none items-center justify-center rounded-full"
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              onContextMenu={(e) => e.preventDefault()}
              onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } }}
              onKeyUp={endHold}
            >
              {emergency && (
                <span className="absolute inset-0 -m-3 rounded-full bg-red-500/25 animate-ping" style={{ animationDuration: '2s' }} />
              )}

              <svg viewBox="0 0 200 200" className="pointer-events-none absolute h-[228px] w-[228px] -rotate-90" aria-hidden="true">
                <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(220, 38, 38, 0.12)" strokeWidth="6" />
                <circle
                  cx="100"
                  cy="100"
                  r="95"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="597"
                  strokeDashoffset={597 - (597 * holdProgress) / 100}
                  className="transition-all duration-75 ease-linear"
                />
              </svg>

              <span
                className={`relative flex h-44 w-44 flex-col items-center justify-center rounded-full bg-red-600 text-white shadow-[0_18px_40px_rgba(220,38,38,0.35)] transition-transform duration-200 ${
                  holding || emergency ? 'scale-95' : 'hover:scale-[1.02]'
                }`}
              >
                <Shield size={44} className="mb-1" aria-hidden="true" />
                <span className="font-display text-3xl font-extrabold tracking-wide">SOS</span>
                {holding && !emergency && (
                  <span className="pointer-events-none absolute text-7xl font-black text-white/25">
                    {Math.ceil(3 - (holdProgress / 100) * 3)}
                  </span>
                )}
              </span>
            </button>

            <p
              aria-live="polite"
              className={`mt-10 text-sm font-semibold ${emergency ? 'text-red-700' : 'text-gray-600'}`}
            >
              {emergency ? 'Live location alert active.' : 'Press and hold for 3 seconds'}
            </p>

            {emergency && (
              <button
                onClick={stopEmergency}
                className="mt-4 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-nari-ink px-6 py-3 font-bold text-white transition-colors hover:bg-nari-navy active:scale-[0.98]"
              >
                <XCircle size={18} />
                Disarm emergency
              </button>
            )}
          </section>

          <div className="flex flex-col gap-8">
            <section aria-labelledby="quick-actions">
              <h2 id="quick-actions" className="mb-3 text-xl font-bold text-nari-navy">Quick actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <ActionTile
                  icon={MapPin}
                  activeIcon={Share2}
                  active={locationSharing}
                  onClick={handleShareLocationToggle}
                  title={locationSharing ? 'Stop sharing' : 'Share live location'}
                  hint={locationSharing ? 'Tap to stop the location stream.' : 'Send a map link to people you trust.'}
                />
                <ActionTile
                  icon={Mic}
                  activeIcon={StopCircle}
                  tone="red"
                  active={audioRecording}
                  onClick={() => toggleRecording('audio', setAudioRecording)}
                  title={audioRecording ? 'Stop audio' : 'Record audio'}
                  hint={audioRecording ? 'Recording. Tap to stop and save.' : `Saves to ${SAVE_PLACE} when you stop.`}
                />
                <ActionTile
                  icon={Video}
                  activeIcon={StopCircle}
                  tone="red"
                  active={videoRecording}
                  onClick={() => toggleRecording('video', setVideoRecording)}
                  title={videoRecording ? 'Stop video' : 'Record video'}
                  hint={videoRecording ? 'Recording. Tap to stop and save.' : 'Camera and microphone together.'}
                />
                <ActionTile
                  icon={Route}
                  onClick={handleSafeRoutes}
                  title="Find help nearby"
                  hint="Opens police stations near you in Maps."
                />
              </div>

              {locationSharing && locationUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-nari-navy/15 bg-white px-4 py-3">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-nari-teal animate-pulse" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-nari-navy">Sharing your location</div>
                    <a href={locationUrl} target="_blank" rel="noreferrer" className="block truncate text-[13px] font-medium text-nari-navy underline">
                      {locationUrl}
                    </a>
                  </div>
                </div>
              )}
            </section>

            <section aria-labelledby="call-directly">
              <h2 id="call-directly" className="mb-3 text-xl font-bold text-nari-navy">Call directly</h2>
              <ul className="nari-card divide-y divide-nari-navy/10 overflow-hidden">
                {CONTACTS.map(({ name, number }) => (
                  <li key={number}>
                    <a href={`tel:${number}`} className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-nari-navy/[0.03]">
                      <span className="flex items-center gap-3 text-[15px] font-semibold text-nari-navy">
                        <Phone size={17} className="text-nari-coral-deep" aria-hidden="true" />
                        {name}
                      </span>
                      <span className="font-display text-lg font-bold tabular-nums text-nari-navy">{number}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <Link
              to="/map"
              className="flex items-center gap-3 rounded-2xl bg-nari-navy px-5 py-4 text-white transition-colors hover:bg-nari-ink"
            >
              <MapPin size={20} className="flex-shrink-0 text-nari-teal" aria-hidden="true" />
              <span>
                <span className="block text-[15px] font-bold">Open the safety map</span>
                <span className="block text-[13px] text-white/75">Recent incidents, police stations, hospitals and safe zones.</span>
              </span>
            </Link>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-[13px] leading-5 text-gray-600">
          Recording and live alerts keep running while you switch pages, but stop if you close NARI.
        </p>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-xl ${
            toast.type === 'success' ? 'bg-emerald-700' : toast.type === 'error' ? 'bg-red-600' : 'bg-nari-ink'
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
