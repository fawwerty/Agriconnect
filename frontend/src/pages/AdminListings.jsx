import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Spinner, StatusBadge, StatCard } from '../components/ui.jsx';

export default function AdminListings() {
  const { token } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/listings', token).then(({ listings }) => setListings(listings)).finally(() => setLoading(false));
  }, [token]);

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    pending: listings.filter(l => l.status === 'pending').length,
    sold: listings.filter(l => l.status === 'sold').length,
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-ink">Listings</h1>
        <p className="text-muted text-sm">{listings.length} active produce listings across farmers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total listings" value={stats.total} accent="gold" />
        <StatCard label="Active" value={stats.active} accent="green" />
        <StatCard label="Pending" value={stats.pending} accent="warning" />
        <StatCard label="Sold" value={stats.sold} accent="muted" />
      </div>

      <div className="glass-card rounded-[32px] overflow-hidden border border-white/10 bg-surface3/70 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-white/5">
                <th className="px-5 py-3">Crop</th>
                <th className="px-5 py-3">Farmer</th>
                <th className="px-5 py-3">Region</th>
                <th className="px-5 py-3 text-right">Qty</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-surface/40">
                  <td className="px-5 py-3 text-ink font-medium">{l.crop_name}</td>
                  <td className="px-5 py-3 text-muted">{l.farmer_name}</td>
                  <td className="px-5 py-3 text-muted">{l.region}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">{l.quantity} {l.unit}</td>
                  <td className="px-5 py-3 text-right font-mono text-gold-400">GHS {l.price_per_unit.toFixed(2)}</td>
                  <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
