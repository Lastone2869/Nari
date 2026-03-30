// src/components/Footer.jsx
import { Shield, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-nari-navy/10 mt-20 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-nari-navy to-nari-amber flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <span className="font-display text-lg font-bold gradient-text">NARI</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              A trust-first safety platform empowering women with real-time reporting, evidence integrity, and community-driven safety intelligence.
            </p>
          </div>
          <div>
            <h4 className="text-nari-navy font-semibold mb-3 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              {[
                { to: '/report', label: 'File a Report' },
                { to: '/map', label: 'Safety Map' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/evidence', label: 'Evidence Locker' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-600 hover:text-nari-teal text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-nari-navy font-semibold mb-3 text-sm uppercase tracking-wider">Emergency</h4>
            <ul className="space-y-2">
              {[
                { label: 'Police', num: '100' },
                { label: 'Women Helpline', num: '1091' },
                { label: 'Ambulance', num: '108' },
                { label: 'National Emergency', num: '112' },
              ].map(({ label, num }) => (
                <li key={num} className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">{label}</span>
                  <a href={`tel:${num}`} className="text-nari-coral font-bold text-sm hover:text-[#e55353] transition-colors">
                    {num}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-nari-navy/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-xs">
            © 2025 NARI Safety OS. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs flex items-center gap-1">
            Made with <Heart size={11} className="text-nari-coral" /> for safer communities
          </p>
        </div>
      </div>
    </footer>
  );
}
