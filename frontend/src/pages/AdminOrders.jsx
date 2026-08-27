import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Spinner, StatusBadge, StatCard } from '../components/ui.jsx';

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders', token).then(({ orders }) => setOrders(orders)).finally(() => setLoading(false));
  }, [token]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    held: orders.filter(o => o.status === 'escrow_held').length,
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-ink">Orders</h1>
        <p className="text-muted text-sm">{orders.length} orders across the marketplace.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={stats.total} accent="gold" />
        <StatCard label="Pending" value={stats.pending} accent="warning" />
        <StatCard label="Completed" value={stats.completed} accent="green" />
        <StatCard label="Escrow held" value={stats.held} accent="emerald" />
      </div>

      <div className="glass-card rounded-[32px] overflow-hidden border border-white/10 bg-surface3/70 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-white/5">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Crop</th>
                <th className="px-5 py-3">Buyer</th>
                <th className="px-5 py-3">Farmer</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
                <th className="px-5 py-3 text-right">Commission</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-surface/40">
                  <td className="px-5 py-3 text-muted">#{o.id}</td>
                  <td className="px-5 py-3 text-ink font-medium">{o.crop_name}</td>
                  <td className="px-5 py-3 text-muted">{o.buyer_name}</td>
                  <td className="px-5 py-3 text-muted">{o.farmer_name}</td>
                  <td className="px-5 py-3 text-right font-mono text-ink">GHS {o.subtotal.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-mono text-gold-400">GHS {o.commission.toFixed(2)}</td>
                  <td className="px-5 py-3">
                    {o.payment_method ? (
                      <div>
                        <p className="text-xs text-emerald font-medium">{o.payment_method}</p>
                        {o.payment_reference && (
                          <p className="text-[10px] text-muted font-mono mt-0.5">{o.payment_reference}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
