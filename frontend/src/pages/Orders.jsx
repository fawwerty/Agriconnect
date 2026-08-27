import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { EmptyState, Spinner, StatusBadge, Button, StatCard } from '../components/ui.jsx';
import { Package, Clock, CheckCircle2, XCircle, TrendingUp, Filter } from 'lucide-react';

const FARMER_ACTIONS = {
  pending: [{ action: 'accept', label: 'Accept', variant: 'primary' }, { action: 'reject', label: 'Decline', variant: 'danger' }],
  paid: [{ action: 'fulfill', label: 'Mark ready / delivered', variant: 'primary' }],
  escrow_held: [{ action: 'fulfill', label: 'Mark ready / delivered', variant: 'primary' }],
};
const BUYER_ACTIONS = {
  accepted: [{ action: 'pay', label: 'Pay into escrow', variant: 'gold' }, { action: 'cancel', label: 'Cancel', variant: 'danger' }],
  pending: [{ action: 'cancel', label: 'Cancel', variant: 'danger' }],
  fulfilled: [{ action: 'complete', label: 'Confirm receipt', variant: 'primary' }],
  delivered: [{ action: 'complete', label: 'Confirm receipt', variant: 'primary' }],
};

const STATUS_FILTER_OPTIONS = ['all', 'pending', 'accepted', 'paid', 'delivered', 'completed', 'cancelled'];

export default function Orders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  function load() {
    setLoading(true);
    api.get('/orders/mine', token).then(({ orders }) => setOrders(orders)).finally(() => setLoading(false));
  }
  useEffect(load, [token]);

  async function doAction(orderId, action, extraBody = {}) {
    setBusyId(orderId);
    try {
      await api.post(`/orders/${orderId}/${action}`, extraBody, token);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const actionMap = user.role === 'farmer' ? FARMER_ACTIONS : BUYER_ACTIONS;
  
  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  
  const stats = {
    total: orders.length,
    pending: orders.filter(o => ['pending', 'pending_payment'].includes(o.status)).length,
    active: orders.filter(o => ['accepted', 'paid', 'preparing', 'delivered'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => ['paid', 'completed', 'delivered'].includes(o.status)).reduce((s, o) => s + o.subtotal, 0),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald">Order Management</p>
        <h1 className="font-display text-4xl text-ink">{user.role === 'farmer' ? 'Orders on My Produce' : 'My Orders'}</h1>
        <p className="text-muted text-sm max-w-xl">Track the full order lifecycle — from placement through payment, fulfillment, and delivery confirmation.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" subtitle={user.role === 'buyer' ? 'Browse the marketplace to place your first order.' : 'Orders on your listings will show up here.'}
          action={user.role === 'buyer' && <Button as={Link} to="/marketplace">Browse marketplace</Button>} />
      ) : (
        <div className="space-y-8">
          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Orders" value={stats.total} accent="gold" />
            <StatCard label="Awaiting Action" value={stats.pending} accent="warning" />
            <StatCard label="Active" value={stats.active} accent="green" />
            <StatCard label={user.role === 'farmer' ? 'Revenue' : 'Spent'} value={`GHS ${stats.revenue.toFixed(0)}`} accent="green" />
          </div>
          
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-muted mr-1" />
            {STATUS_FILTER_OPTIONS.map(s => (
              <button 
                key={s} 
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition border ${
                  statusFilter === s 
                    ? 'bg-emerald text-black border-emerald' 
                    : 'bg-white/5 text-muted border-white/10 hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Order List */}
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((o, i) => {
                const actions = actionMap[o.status] || [];
                return (
                  <motion.div 
                    key={o.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card rounded-[28px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-white/10"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-[200px] flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-2xl bg-emerald/10 flex items-center justify-center text-emerald shrink-0">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-display text-lg text-ink">{o.crop_name} <span className="text-muted text-sm font-sans">#{o.order_number || o.id}</span></p>
                            <p className="text-xs text-muted">{user.role === 'farmer' ? `Buyer: ${o.buyer_name}` : `Farmer: ${o.farmer_name}`} • {o.region}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-emerald font-display">GHS {o.total.toFixed(2)}</p>
                          <p className="text-xs text-muted">{new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>

                    {actions.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-3">
                        {actions.map(a => (
                          <Button key={a.action} variant={a.variant} disabled={busyId === o.id} onClick={() => doAction(o.id, a.action)}>
                            {a.label}
                          </Button>
                        ))}
                        <Button as={Link} to={`/orders/${o.id}`} variant="secondary">View details →</Button>
                      </div>
                    )}
                    
                    {actions.length === 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <Button as={Link} to={`/orders/${o.id}`} variant="secondary">View details →</Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filtered.length === 0 && (
              <div className="glass-card rounded-[28px] p-12 text-center">
                <p className="text-muted">No orders matching this filter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
