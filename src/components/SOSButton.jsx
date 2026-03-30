// src/components/SOSButton.jsx
import { Phone, X } from 'lucide-react';
import { useState } from 'react';

export default function SOSButton() {
  const [expanded, setExpanded] = useState(false);
  const [called, setCalled] = useState(false);

  const handleSOS = () => {
    setCalled(true);
    setTimeout(() => setCalled(false), 4000);
    // In production: window.location.href = 'tel:112';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {expanded && (
        <div className="glass-card rounded-2xl p-4 mb-1 animate-slide-up min-w-[200px]">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Emergency Contacts</p>
          <div className="space-y-2">
            {[
              { label: 'Police', num: '100' },
              { label: 'Women Helpline', num: '1091' },
              { label: 'Ambulance', num: '108' },
            ].map(({ label, num }) => (
              <a
                key={num}
                href={`tel:${num}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all group"
              >
                <span className="text-sm text-gray-300 group-hover:text-white">{label}</span>
                <span className="text-sm font-bold text-red-400">{num}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        )}
        <button
          onClick={() => (expanded ? handleSOS() : setExpanded(true))}
          className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white shadow-2xl transition-all glow-red ${
            called
              ? 'bg-green-500 scale-95'
              : 'bg-red-500 hover:bg-red-600 animate-pulse-glow hover:scale-105 active:scale-95'
          }`}
        >
          <Phone size={18} />
          {called ? 'Calling 112…' : 'SOS'}
        </button>
      </div>
    </div>
  );
}
