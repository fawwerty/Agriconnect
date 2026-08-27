import React from 'react';

export function WovenDivider() {
  return <div className="woven-divider" />;
}

export function StatCard({ label, value, sub, accent = 'gold' }) {
  const accentClass = accent === 'gold' ? 'text-gold-400' : accent === 'green' ? 'text-emerald' : accent === 'muted' ? 'text-muted' : 'text-emerald';
  return (
    <div className="glass-card rounded-[28px] p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-muted mb-3">{label}</p>
      <p className={`font-display text-3xl font-semibold ${accentClass}`}>{value}</p>
      {sub && <p className="text-sm text-muted mt-3 leading-relaxed">{sub}</p>}
    </div>
  );
}

const STATUS_STYLES = {
  active: 'bg-emerald/15 text-emerald border-emerald/30',
  sold: 'bg-white/5 text-muted border-white/10',
  expired: 'bg-white/5 text-muted border-white/10',
  pending: 'bg-warning/15 text-warning border-warning/30',
  accepted: 'bg-emerald/15 text-emerald border-emerald/30',
  rejected: 'bg-error/15 text-error border-error/30',
  escrow_held: 'bg-warning/15 text-warning border-warning/30',
  fulfilled: 'bg-emerald/15 text-emerald border-emerald/30',
  completed: 'bg-emerald/20 text-emerald border-emerald/30',
  cancelled: 'bg-error/15 text-error border-error/30',
  requested: 'bg-warning/15 text-warning border-warning/30',
  assigned: 'bg-emerald/15 text-emerald border-emerald/30',
  in_transit: 'bg-warning/15 text-warning border-warning/30',
  delivered: 'bg-emerald/20 text-emerald border-emerald/30',
};

export function StatusBadge({ status }) {
  const s = (status || '').toLowerCase().replace('pending_payment', 'pending');
  const cls = STATUS_STYLES[s] || 'bg-white/5 text-muted border-white/10';
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${cls}`}>
      {s.replace('_', ' ')}
    </span>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-emerald ${className}`} />
  );
}

export function Button({ children, variant = 'primary', className = '', as: Component = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-emerald to-emerald-dark text-black shadow-[0_18px_70px_rgba(34,197,94,0.22)] hover:scale-[1.01]',
    secondary: 'bg-white/5 border border-white/10 text-ink hover:bg-white/10',
    ghost: 'bg-transparent border border-white/10 text-ink hover:bg-white/10',
    danger: 'bg-error text-white shadow-[0_14px_40px_rgba(239,68,68,0.22)] hover:brightness-110',
    gold: 'bg-gradient-to-r from-gold-400 to-gold-500 text-black shadow-[0_14px_40px_rgba(217,155,43,0.22)] hover:brightness-110',
  };
  return (
    <Component className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="glass-card rounded-[32px] p-12 text-center">
      <p className="font-display text-xl text-ink mb-3">{title}</p>
      {subtitle && <p className="text-sm text-muted mb-6">{subtitle}</p>}
      {action}
    </div>
  );
}
