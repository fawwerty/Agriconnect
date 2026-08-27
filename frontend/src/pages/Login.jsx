import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Button } from '../components/ui.jsx';



export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.post('/auth/login', { email, password });
      login(token, user);
      const dest = user.role === 'farmer' ? '/farmer' : user.role === 'buyer' ? '/marketplace' : user.role === 'transport' ? '/transport' : '/admin';
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
          <p className="text-xs uppercase tracking-[0.32em] text-emerald">Secure access</p>
          <h1 className="text-5xl font-semibold tracking-tight text-white">Welcome back to AgriConnect.</h1>
          <p className="max-w-2xl text-base leading-8 text-muted">Sign in and continue managing listings, orders, transport and real-time market insights from one premium dashboard.</p>

        </div>

        <div className="glass-card rounded-[32px] border border-white/10 p-8 shadow-[0_36px_120px_rgba(0,0,0,0.16)]">
          <h2 className="text-3xl font-semibold text-white mb-5">Log in</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-[24px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="glass-input w-full rounded-[24px] px-4 py-4 text-white" placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Logging in…' : 'Log in'}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">New here? <Link to="/register" className="text-emerald hover:underline">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}
