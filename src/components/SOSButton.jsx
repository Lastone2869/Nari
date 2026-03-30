// src/components/SOSButton.jsx
import { Phone, X } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function SOSButton() {
  const [expanded, setExpanded] = useState(false);
  const [called, setCalled] = useState(false);
  const location = useLocation();

  const handleSOS = () => {
    setCalled(true);
    setTimeout(() => setCalled(false), 4000);
    // In production: window.location.href = 'tel:112';
  };

  if (location.pathname === '/' || location.pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {expanded && (
        <div className="glass-card rounded-2xl p-4 mb-1 animate-slide-up min-w-[200px]">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Emergency Contacts</p>
          <div className="space-y-2">
            {[
              { label: 'Police', num: '100' },
              { label: 'Women Helpline', num: '1091' },
              { label: 'Ambulance', num: '108' },
            ].map(({ label, num }) => (
              <a
                key={num}
                href={`tel:${num}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-nari-coral/10 border border-nari-navy/10 hover:border-nari-coral/30 transition-all group"
              >
                <span className="text-sm text-gray-600 group-hover:text-nari-navy">{label}</span>
                <span className="text-sm font-bold text-nari-coral">{num}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="w-10 h-10 rounded-full bg-white border border-nari-navy/10 flex items-center justify-center text-gray-500 hover:text-nari-navy transition-all"
          >
            <X size={16} />
          </button>
        )}
        <button
          onClick={() => (expanded ? handleSOS() : setExpanded(true))}
          className={`flex items-center gap-3 px-8 py-5 rounded-full font-bold text-white shadow-[0_4px_24px_rgba(220,38,38,0.4)] transition-all text-xl z-50 ${
            called
              ? 'bg-nari-teal scale-95 shadow-[0_4px_24px_rgba(79,209,197,0.4)]'
              : 'bg-red-600 hover:bg-red-700 animate-pulse hover:scale-105 active:scale-95'
          }`}
        >
          <Phone size={24} />
          {called ? 'Calling 112…' : 'SOS'}
        </button>
      </div>
    </div>
  );
}
