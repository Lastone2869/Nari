// src/pages/Home.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Shield, MapPin, Video, Mic, Route, AlertTriangle, Battery, Navigation, Phone, CheckCircle, XCircle, StopCircle, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startLiveAlert, updateLiveAlertLocation, resolveLiveAlert } from '../firebase/firestore';

export default function Home() {
  const [emergency, setEmergency] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Quick Action State ──────────────────────────────────────────────────────
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationUrl, setLocationUrl] = useState('');
  const [audioRecording, setAudioRecording] = useState(false);
  const [videoRecording, setVideoRecording] = useState(false);
  const [toast, setToast] = useState(null);

  const audioRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoStreamRef = useRef(null);
  const locationWatchRef = useRef(null);
  const locationAlertRef = useRef(null);
  const locationLastRef = useRef(0);

  const holdTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const alertIdRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const HOLD_DURATION = 3000;

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Share Live Location (real continuous tracking) ────────────────────────────────────
  const handleShareLocationToggle = async () => {
    // ── STOP ──
    if (locationSharing) {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
      if (locationAlertRef.current) {
        try { await resolveLiveAlert(locationAlertRef.current); } catch {}
        locationAlertRef.current = null;
      }
      setLocationSharing(false);
      setLocationUrl('');
      showToast('Live location sharing stopped', 'info');
      return;
    }

    // ── START ──
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }

    setLocationSharing(true);
    showToast('📍 Getting your location…', 'info');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        // 1. Create a live alert doc in Firestore to track the stream
        let alertId = null;
        if (user) {
          try {
            alertId = await startLiveAlert(user.uid, lat, lng);
            locationAlertRef.current = alertId;
          } catch (e) { console.error('Firestore tracking failed', e); }
        }

        // 2. Build the shareable link
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setLocationUrl(mapsUrl);

        // 3. Share it via native share or clipboard
        const shareText = `🚨 NARI LIVE LOCATION: Track me here → ${mapsUrl}`;
        if (navigator.share) {
          navigator.share({ title: 'My Live Location – NARI', text: shareText, url: mapsUrl }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareText);
          showToast('Live location link copied!', 'success');
        }

        // 4. Start watchPosition for continuous updates
        locationWatchRef.current = navigator.geolocation.watchPosition(
          async (updPos) => {
            const { latitude: ulat, longitude: ulng } = updPos.coords;
            const now = Date.now();
            if (now - locationLastRef.current < 10000) return; // throttle 10s
            locationLastRef.current = now;

            // Update the shareable link display
            setLocationUrl(`https://www.google.com/maps?q=${ulat},${ulng}`);

            // Push to Firestore
            if (alertId) {
              try { await updateLiveAlertLocation(alertId, ulat, ulng); } catch {}
            }
          },
          (err) => { console.error('Location watch error', err); },
          { enableHighAccuracy: true, maximumAge: 0 }
        );

        locationLastRef.current = Date.now();
        showToast('📍 Live tracking active!', 'success');
      },
      () => { showToast('Location access denied', 'error'); setLocationSharing(false); },
      { enableHighAccuracy: true }
    );
  };

  // ── Audio Recording ─────────────────────────────────────────────────────────
  const handleAudioToggle = async () => {
    if (audioRecording) {
      audioRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `nari_audio_${Date.now()}.webm`; a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(t => t.stop());
        setAudioRecording(false);
        showToast('Audio saved!', 'success');
      };
      recorder.start();
      audioRecorderRef.current = recorder;
      setAudioRecording(true);
      showToast('🔴 Audio recording started', 'info');
    } catch {
      showToast('Microphone access denied', 'error');
    }
  };

  // ── Video Recording ─────────────────────────────────────────────────────────
  const handleVideoToggle = async () => {
    if (videoRecording) {
      videoRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      videoChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `nari_video_${Date.now()}.webm`; a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(t => t.stop());
        setVideoRecording(false);
        showToast('Video saved!', 'success');
      };
      recorder.start();
      videoRecorderRef.current = recorder;
      setVideoRecording(true);
      showToast('🔴 Video recording started', 'info');
    } catch {
      showToast('Camera access denied', 'error');
    }
  };

  // ── Find Safe Routes ────────────────────────────────────────────────────────
  const handleSafeRoutes = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        window.open(`https://www.google.com/maps/search/police+station/@${lat},${lng},14z`, '_blank');
      },
      () => {
        navigate('/map');
      }
    );
  };

  useEffect(() => {
    return () => {
      if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
      videoStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleLocationUpdate = async (pos) => {
    if (!alertIdRef.current) return;
    const now = Date.now();
    // Throttle to 1 push every 10 seconds
    if (now - lastUpdateRef.current < 10000) return;
    
    lastUpdateRef.current = now;
    const { latitude, longitude } = pos.coords;
    try {
      await updateLiveAlertLocation(alertIdRef.current, latitude, longitude);
    } catch (e) {
      console.error("Failed to update live location", e);
    }
  };

  const startHold = () => {
    if (emergency) return;
    setHolding(true);
    let start = Date.now();
    
    progressIntervalRef.current = setInterval(() => {
      let elapsed = Date.now() - start;
      let p = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(p);
      if (p >= 100) clearInterval(progressIntervalRef.current);
    }, 16);

    holdTimerRef.current = setTimeout(async () => {
      setHolding(false);
      setHoldProgress(0);
      setEmergency(true);
      
      try {
        if (navigator.geolocation && user) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const aid = await startLiveAlert(user.uid, latitude, longitude);
            alertIdRef.current = aid;
            lastUpdateRef.current = Date.now();
            
            // Start watching location
            watchIdRef.current = navigator.geolocation.watchPosition(
              handleLocationUpdate,
              (err) => console.error("Tracking error:", err),
              { enableHighAccuracy: true, maximumAge: 0 }
            );
          });
        }
      } catch (err) {
        console.error("SOS Initiation failed", err);
      }
    }, HOLD_DURATION);
  };

  const endHold = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (!emergency) {
      setHolding(false);
      setHoldProgress(0);
    }
  };

  const stopEmergency = async () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (alertIdRef.current) {
      try {
        await resolveLiveAlert(alertIdRef.current);
      } catch (e) { console.error(e); }
    }
    alertIdRef.current = null;
    watchIdRef.current = null;
    setEmergency(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return (
    <>
    <div className="min-h-screen bg-gray-50/50 pb-24 flex justify-center">
      {/* Mobile-first constraint — centered on all screens */}
      <div className="w-full max-w-md flex flex-col pt-16 px-4">
        
        {/* 1. Top Status Section */}
        <div className="flex items-center justify-between mb-8 mt-4 bg-white rounded-full px-4 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${emergency ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className={`text-sm font-bold ${emergency ? 'text-red-600' : 'text-emerald-600'}`}>
              {emergency ? 'EMERGENCY ACTIVE' : 'You are Safe'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-400 text-xs font-bold">
            <span className="flex items-center gap-1"><Navigation size={12} className="text-nari-teal" /> ON</span>
            <span className="flex items-center gap-1"><Battery size={12} className="text-gray-600" /> 84%</span>
          </div>
        </div>

        {/* 2. Primary SOS Action */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] relative mb-6">
          <div 
            className="relative flex items-center justify-center cursor-pointer touch-none select-none z-10"
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
          >
            {/* Pulsing background rings */}
            <div className={`absolute inset-0 rounded-full ${emergency ? 'bg-red-500/20' : 'bg-red-500/10'} -m-8 animate-ping opacity-20`} style={{ animationDuration: '3s' }} />
            <div className={`absolute inset-0 rounded-full ${emergency ? 'bg-red-500/30' : 'bg-red-500/10'} -m-4 animate-ping opacity-40`} style={{ animationDuration: '2s' }} />
            
            {/* Progress Ring SVG */}
            <svg viewBox="0 0 200 200" className="absolute w-[220px] h-[220px] -rotate-90 pointer-events-none">
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
                className="transition-all duration-75 easelinear"
              />
            </svg>

            {/* Core Button */}
            <div className={`
              w-44 h-44 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300
              ${emergency ? 'bg-red-600 scale-95 shadow-[0_0_40px_rgba(220,38,38,0.8)]' : holding ? 'bg-red-600 scale-95 shadow-[0_0_30px_rgba(220,38,38,0.6)]' : 'bg-red-500 shadow-2xl hover:bg-red-600'}
            `}>
              <Shield size={48} className={`mb-1 ${holding && !emergency ? 'animate-bounce' : ''}`} />
              <div className="text-2xl font-black tracking-widest uppercase">SOS</div>
              {holding && !emergency && (
                <div className="absolute font-black text-6xl text-white/20 select-none pointer-events-none">
                  {Math.ceil(3 - (holdProgress / 100) * 3)}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center gap-3 w-full px-8">
            <div className="text-center bg-gray-100 rounded-full px-4 py-2 opacity-80 w-full mb-1">
              {emergency ? (
                <span className="text-red-600 font-bold text-sm tracking-wide">Live tracking & recording active.</span>
              ) : (
                <span className="text-gray-500 font-bold text-xs tracking-wider uppercase">Press &amp; Hold for 3 Seconds</span>
              )}
            </div>

            {emergency && (
              <button
                onClick={stopEmergency}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-900 text-white font-bold tracking-wide shadow-sm hover:bg-gray-800 active:scale-95 transition-all w-full justify-center"
              >
                <XCircle size={18} /> Disarm Emergency
              </button>
            )}
          </div>
        </div>

        {/* 3. Quick Action Panel */}
        <div className="grid grid-cols-2 gap-3 mb-6">

          {/* Share Live Location (Toggle) */}
          <button
            onClick={handleShareLocationToggle}
            className={`zomato-card p-4 flex flex-col gap-2 text-left active:scale-95 transition-all ${
              locationSharing ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${
              locationSharing ? 'bg-white/20 animate-pulse' : 'bg-blue-50 text-blue-600'
            }`}>
              {locationSharing ? <Share2 size={20} className="text-white" /> : <MapPin size={20} />}
            </div>
            <span className={`text-sm font-bold leading-tight ${locationSharing ? 'text-white' : 'text-nari-navy'}`}>
              {locationSharing ? '⏹ Stop Sharing' : 'Share Live\nLocation'}
            </span>
          </button>

          {/* Audio Recording */}
          <button
            onClick={handleAudioToggle}
            className={`zomato-card p-4 flex flex-col gap-2 text-left active:scale-95 transition-all ${audioRecording ? 'bg-red-500 text-white' : 'bg-white hover:bg-red-50'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${audioRecording ? 'bg-white/20 animate-pulse' : 'bg-red-50 text-red-600'}`}>
              {audioRecording ? <StopCircle size={20} className="text-white" /> : <Mic size={20} />}
            </div>
            <span className={`text-sm font-bold leading-tight ${audioRecording ? 'text-white' : 'text-nari-navy'}`}>
              {audioRecording ? '⏹ Stop Audio' : 'Start Audio\nRecording'}
            </span>
          </button>

          {/* Video Recording */}
          <button
            onClick={handleVideoToggle}
            className={`zomato-card p-4 flex flex-col gap-2 text-left active:scale-95 transition-all ${videoRecording ? 'bg-teal-500 text-white' : 'bg-white hover:bg-teal-50'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${videoRecording ? 'bg-white/20 animate-pulse' : 'bg-teal-50 text-teal-600'}`}>
              {videoRecording ? <StopCircle size={20} className="text-white" /> : <Video size={20} />}
            </div>
            <span className={`text-sm font-bold leading-tight ${videoRecording ? 'text-white' : 'text-nari-navy'}`}>
              {videoRecording ? '⏹ Stop Video' : 'Start Video\nRecording'}
            </span>
          </button>

          {/* Safe Routes */}
          <button
            onClick={handleSafeRoutes}
            className="zomato-card bg-white p-4 flex flex-col gap-2 text-left hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-1 text-emerald-600">
              <Route size={20} />
            </div>
            <span className="text-sm font-bold text-nari-navy leading-tight">Find Safe{`\n`}Routes</span>
          </button>
        </div>

        {/* Live location active indicator */}
        {locationSharing && locationUrl && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-0.5">Live Tracking Active</div>
              <a href={locationUrl} target="_blank" rel="noreferrer"
                className="text-xs text-blue-600 underline font-medium truncate block"
              >
                {locationUrl}
              </a>
            </div>
          </div>
        )}

        {/* 4. Mini Map Widget */}
        <div className="zomato-card bg-white p-1 mb-6 flex flex-col">
          <div className="relative w-full h-36 bg-gray-200 rounded-[1.2rem] overflow-hidden flex items-center justify-center border-4 border-white shadow-inner">
            <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=28.6139,77.2090&zoom=14&size=400x200&key=YOUR_API_KEY&style=feature:all|element:labels|visibility:off')] bg-cover bg-center" />
            <div className="z-10 bg-white/90 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-nari-navy flex items-center gap-1.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Live Location Tracking Active
            </div>
          </div>
        </div>

        {/* 5. Emergency Contacts */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">One-Tap Emergency</div>
          <div className="flex flex-col gap-2">
            {[
              { name: 'Police Control Room', number: '100', color: 'text-blue-600', bg: 'bg-blue-50' },
              { name: 'Women Helpline', number: '1091', color: 'text-pink-600', bg: 'bg-pink-50' },
              { name: 'Ambulance', number: '108', color: 'text-red-600', bg: 'bg-red-50' }
            ].map((contact) => (
              <a key={contact.name} href={`tel:${contact.number}`} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${contact.bg} ${contact.color}`}>
                    <Phone size={18} fill="currentColor" opacity={0.2} />
                  </div>
                  <span className="font-bold text-nari-navy text-sm">{contact.name}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 font-black text-gray-700 text-sm shadow-sm">{contact.number}</div>
              </a>
            ))}
          </div>
        </div>

        {/* 6. Stealth Triggers */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-200/50 mb-10">
          <AlertTriangle size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs font-medium text-gray-600">
            <span className="font-bold text-gray-800">Hardware SOS:</span> Press power button 3 times rapidly, or shake device to trigger stealth mode. (Audio/Video recording runs silently in the background).
          </div>
        </div>

      </div>
    </div>

    {/* Toast Notification */}
    {toast && (
      <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl text-white flex items-center gap-2 ${
        toast.type === 'success' ? 'bg-emerald-600' :
        toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
      }`}>
        {toast.type === 'success' ? <CheckCircle size={16} /> : toast.type === 'error' ? <XCircle size={16} /> : <AlertTriangle size={16} />}
        {toast.msg}
      </div>
    )}
  </>
  );
}
