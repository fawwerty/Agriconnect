import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Truck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Button } from '../components/ui.jsx';

const REGIONS = ['Greater Accra', 'Ashanti', 'Eastern', 'Volta', 'Bono', 'Central', 'Western', 'Northern'];

export default function Register() {
  const [role, setRole] = useState('farmer');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', region: 'Ashanti', business_name: '', vehicle_type: 'Cargo Van' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.post('/auth/register', { ...form, role });
      login(token, user);
      const dest = role === 'farmer' ? '/farmer' : role === 'buyer' ? '/marketplace' : role === 'transport' ? '/transport' : '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-center px-6 py-10">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/10 text-emerald">🌾</span>
            Farmer-first registration
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-white">Create your AgriConnect profile.</h1>
          <p className="max-w-2xl text-base leading-8 text-muted">Choose your role and get access to premium trade workflows, escrow protection, and regional marketplace exposure.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => setRole('farmer')} className={`rounded-[24px] border px-5 py-4 text-left transition ${role === 'farmer' ? 'border-emerald bg-emerald/10 text-white' : 'border-white/10 text-muted hover:border-emerald/30'}`}>
              <div className="flex items-center gap-3 text-lg font-semibold"><User size={18} /> Farmer</div>
              <p className="mt-2 text-sm text-muted">Sell produce, manage listings, and access buyer demand.</p>
            </button>
            <button type="button" onClick={() => setRole('buyer')} className={`rounded-[24px] border px-5 py-4 text-left transition ${role === 'buyer' ? 'border-emerald bg-emerald/10 text-white' : 'border-white/10 text-muted hover:border-emerald/30'}`}>
              <div className="flex items-center gap-3 text-lg font-semibold"><ShoppingBag size={18} /> Buyer</div>
              <p className="mt-2 text-sm text-muted">Source quality crops, book transport, and pay securely.</p>
            </button>
            <button type="button" onClick={() => setRole('transport')} className={`rounded-[24px] border px-5 py-4 text-left transition ${role === 'transport' ? 'border-emerald bg-emerald/10 text-white' : 'border-white/10 text-muted hover:border-emerald/30'}`}>
              <div className="flex items-center gap-3 text-lg font-semibold"><Truck size={18} /> Transport & Logistics</div>
              <p className="mt-2 text-sm text-muted">Accept delivery requests, dispatch vehicles, and earn fees.</p>
            </button>
            <button type="button" onClick={() => setRole('admin')} className={`rounded-[24px] border px-5 py-4 text-left transition ${role === 'admin' ? 'border-emerald bg-emerald/10 text-white' : 'border-white/10 text-muted hover:border-emerald/30'}`}>
              <div className="flex items-center gap-3 text-lg font-semibold"><Users size={18} /> Other (Admin/Agent)</div>
              <p className="mt-2 text-sm text-muted">Platform management, support agents, and system moderators.</p>
            </button>
          </div>
        </div>

        <div className="glass-card rounded-[32px] border border-white/10 p-8 shadow-[0_36px_120px_rgba(0,0,0,0.16)]">
          <h2 className="text-3xl font-semibold text-white mb-5">Create your account</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-[24px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Full name</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Email</label>
              <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white" placeholder="••••••••" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white" placeholder="+233 24 000 0000" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Region</label>
                <select value={form.region} onChange={e => set('region', e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white">
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            {role === 'buyer' && (
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Business name (optional)</label>
                <input value={form.business_name} onChange={e => set('business_name', e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white" placeholder="Ebony Agro Trading" />
              </div>
            )}
            {role === 'transport' && (
              <div>
                <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Primary Vehicle Type</label>
                <select value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white">
                  <option value="Tricycle (Aboboyaa)">Tricycle (Aboboyaa)</option>
                  <option value="Pickup Truck">Pickup Truck</option>
                  <option value="Cargo Van">Cargo Van</option>
                  <option value="Heavy Truck (Kia)">Heavy Truck (Kia)</option>
                </select>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating account…' : `Sign up as ${role}`}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link to="/login" className="text-emerald hover:underline">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
