// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { Shield, MapPin, FileText, LayoutDashboard, Lock, AlertTriangle, Users, TrendingUp, CheckCircle, ArrowRight, Star, Zap } from 'lucide-react';

const features = [
  { icon: FileText, title: 'Low-Friction Reporting', desc: 'File a complaint in under 60 seconds with auto location detection and predefined categories.', color: 'violet', link: '/report' },
  { icon: MapPin, title: 'Real-Time Safety Map', desc: 'See live heatmaps of incidents, nearby safe spaces, and safety scores for every area.', color: 'pink', link: '/map' },
  { icon: Lock, title: 'Evidence Locker', desc: 'Upload evidence with SHA-256 blockchain hashing. Tamper-proof, legally credible records.', color: 'teal', link: '/evidence' },
  { icon: LayoutDashboard, title: 'Smart Dashboard', desc: 'Real-time community feed, predictive alerts, and safety trend analysis.', color: 'blue', link: '/dashboard' },
  { icon: AlertTriangle, title: 'Predictive Alerts', desc: 'AI-powered risk detection warns you before incidents happen based on historical patterns.', color: 'amber', link: '/map' },
  { icon: Users, title: 'Anonymous Reporting', desc: 'Report incidents without revealing your identity. Your privacy is our priority.', color: 'green', link: '/report' },
];

const colorMap = {
  violet: 'from-violet-600/20 to-violet-600/5 border-violet-600/30 text-violet-400',
  pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 text-pink-400',
  teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30 text-teal-400',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
};

const stats = [
  { label: 'Reports Filed', value: '12,400+', icon: FileText },
  { label: 'Incidents Resolved', value: '89%', icon: CheckCircle },
  { label: 'Safe Spaces Mapped', value: '3,200+', icon: MapPin },
  { label: 'Active Communities', value: '580+', icon: Users },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg pt-16">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-700/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/15 border border-violet-600/30 text-violet-300 text-sm font-medium mb-8">
            <Zap size={13} />
            Trust-First Safety Platform
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">Safety is a</span>
            <br />
            <span className="gradient-text">Right, Not a Privilege</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            NARI empowers women with instant safety reporting, real-time alerts, tamper-proof evidence storage, and community-driven safety intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/report"
              id="hero-report-btn"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 text-white font-semibold text-base hover:bg-violet-700 transition-all hover:scale-105 active:scale-95 glow-violet shadow-2xl"
            >
              <FileText size={18} />
              File a Report
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/map"
              id="hero-map-btn"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl glass border border-white/10 text-white font-semibold text-base hover:bg-white/5 transition-all"
            >
              <MapPin size={18} />
              View Safety Map
            </Link>
          </div>

          {/* Trust badge */}
          <div className="mt-12 flex items-center justify-center gap-6 text-gray-600 text-sm">
            {['End-to-End Encrypted', 'Anonymous Option', 'Blockchain Evidence'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-green-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass-card rounded-2xl p-5 text-center">
              <Icon size={20} className="text-violet-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Stay Safe
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              A complete safety ecosystem designed for real-world emergencies and community-driven protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color, link }) => (
              <Link
                key={title}
                to={link}
                className={`group relative rounded-2xl p-6 border bg-gradient-to-br hover:scale-[1.02] transition-all duration-300 cursor-pointer ${colorMap[color]}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color].split(' ')[0]} flex items-center justify-center mb-4`}>
                  <Icon size={20} className={colorMap[color].split(' ').slice(-1)[0]} />
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                <ArrowRight size={14} className="absolute bottom-4 right-4 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Rating strip */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
          {[
            { score: 85, label: 'Safe Zone', color: '#22c55e', border: 'border-green-500/30', bg: 'bg-green-500/10', area: 'City Center' },
            { score: 55, label: 'Moderate Risk', color: '#f59e0b', border: 'border-amber-500/30', bg: 'bg-amber-500/10', area: 'Northern Sector' },
            { score: 28, label: 'High Risk', color: '#ef4444', border: 'border-red-500/30', bg: 'bg-red-500/10', area: 'Industrial Zone' },
          ].map(({ score, label, color, border, bg, area }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-5 flex items-center gap-4`}>
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
                    strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{score}</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm mb-0.5">{area}</div>
                <div className="text-xs font-medium mb-1" style={{ color }}>{label}</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={10} className={i <= Math.round(score / 20) ? 'text-amber-400' : 'text-gray-700'} fill={i <= Math.round(score / 20) ? '#fbbf24' : 'none'} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-12">
          <div className="text-4xl mb-4">🛡️</div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">Join the Safety Network</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Be part of a community committed to making every space safer for women.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login" id="cta-signup-btn" className="px-8 py-3.5 rounded-2xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-all hover:scale-105">
              Get Started Free
            </Link>
            <Link to="/report" id="cta-anon-btn" className="px-8 py-3.5 rounded-2xl glass border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-all">
              Report Anonymously
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
