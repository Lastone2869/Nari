import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import NariLogo from './NariLogo';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-nari-navy/10 bg-white/75 px-4 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <NariLogo size={42} />
              <div>
                <div className="font-display text-xl font-black tracking-[0.2em] text-nari-navy">NARI</div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-nari-navy/45">Safety OS</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-gray-600">
              A trust-first safety platform empowering women with real-time reporting, evidence integrity, and community-driven safety intelligence.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-nari-navy">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/report', label: 'File a Report' },
                { to: '/map', label: 'Safety Map' },
                { to: '/track', label: 'Track Report' },
                { to: '/evidence', label: 'Evidence Locker' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-600 transition-colors hover:text-nari-navy">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-nari-navy">Emergency</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Police', num: '100' },
                { label: 'Women Helpline', num: '1091' },
                { label: 'Ambulance', num: '108' },
                { label: 'National Emergency', num: '112' },
              ].map(({ label, num }) => (
                <li key={num} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600">{label}</span>
                  <a href={`tel:${num}`} className="rounded-full px-3 py-1 text-sm font-bold text-nari-coral transition-colors hover:text-[#e55353]">
                    {num}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-nari-navy/10 pt-6 text-center md:flex-row md:text-left">
          <p className="text-xs text-gray-600">&copy; {year} NARI Safety OS. All rights reserved.</p>
          <p className="flex items-center gap-1 text-xs text-gray-600">
            Made with <Heart size={11} className="text-nari-coral" /> for safer communities
          </p>
        </div>
      </div>
    </footer>
  );
}
