import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Spinner, Button } from '../components/ui.jsx';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  function load() {
    setLoading(true);
    api.get('/admin/users', token).then(({ users }) => setUsers(users)).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function toggleVerified(u) {
    await api.patch(`/admin/users/${u.id}/verify`, { verified: !u.verified }, token);
    load();
  }

  const filtered = filter ? users.filter(u => u.role === filter) : users;
  const counts = {
    total: users.length,
    farmers: users.filter(u => u.role === 'farmer').length,
    buyers: users.filter(u => u.role === 'buyer').length,
    transport: users.filter(u => u.role === 'transport').length,
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <div className="glass-card rounded-[32px] p-8 border border-white/10 bg-surface3/70 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink">User management</h1>
            <p className="text-muted text-sm mt-1">{users.length} accounts active across the marketplace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['', 'farmer', 'buyer', 'transport', 'admin'].map(r => (
              <button key={r} onClick={() => setFilter(r)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === r ? 'border-gold-500/40 bg-gold-500/10 text-gold-300' : 'border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-ink'}`}>
                {r || 'All'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-surface/70 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-muted mb-3">Total accounts</p>
            <p className="text-2xl font-semibold text-white">{counts.total}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-surface/70 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-muted mb-3">Farmers</p>
            <p className="text-2xl font-semibold text-emerald">{counts.farmers}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-surface/70 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-muted mb-3">Buyers</p>
            <p className="text-2xl font-semibold text-blue-accent">{counts.buyers}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-surface/70 p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-muted mb-3">Transport</p>
            <p className="text-2xl font-semibold text-gold-400">{counts.transport}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[32px] overflow-hidden border border-white/10 bg-surface3/70 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-white/5">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Region</th>
                <th className="px-5 py-3">Verified</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-surface/40">
                  <td className="px-5 py-3 text-ink font-medium">{u.name}{u.business_name ? <span className="text-muted"> · {u.business_name}</span> : ''}</td>
                  <td className="px-5 py-3 text-muted">{u.email}</td>
                  <td className="px-5 py-3 text-muted capitalize">{u.role}</td>
                  <td className="px-5 py-3 text-muted">{u.region || '—'}</td>
                  <td className="px-5 py-3">
                    {u.verified ? <span className="text-emerald text-xs font-semibold">✓ Verified</span> : <span className="text-muted text-xs">Unverified</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" onClick={() => toggleVerified(u)}>{u.verified ? 'Unverify' : 'Verify'}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
