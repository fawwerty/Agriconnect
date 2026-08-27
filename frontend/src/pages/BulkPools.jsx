import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Sparkles, TrendingDown, Clock, ShieldCheck, Plus, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Button, Spinner, EmptyState, StatCard } from '../components/ui.jsx';

export default function BulkPools() {
  const { token, user } = useAuth();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState(null);
  const [pledgeQty, setPledgeQty] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MTN MoMo');
  const [phone, setPhone] = useState('');
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New pool form
  const [newPool, setNewPool] = useState({
    crop_name: '',
    category: 'Grains',
    region: 'Ashanti',
    target_quantity: '',
    unit: 'bag',
    original_price: '',
    pool_price: '',
    description: '',
    days_valid: '14'
  });

  function load() {
    setLoading(true);
    api.get('/bulk-pools', token)
      .then(({ pools }) => setPools(pools))
      .catch(() => setPools([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  function showToastMsg(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!token) {
      alert('Please log in to join bulk pools.');
      return;
    }
    setJoining(true);
    try {
      const res = await api.post(`/bulk-pools/${selectedPool.id}/join`, {
        quantity: Number(pledgeQty),
        payment_method: paymentMethod,
        phone
      }, token);

      showToastMsg(`🎉 Successfully pledged ${pledgeQty} ${selectedPool.unit} of ${selectedPool.crop_name}!`);
      setSelectedPool(null);
      setPledgeQty('');
      load();
    } catch (err) {
      alert(err.message || 'Failed to join pool.');
    } finally {
      setJoining(false);
    }
  }

  async function handleCreatePool(e) {
    e.preventDefault();
    try {
      await api.post('/bulk-pools', newPool, token);
      setShowCreateModal(false);
      showToastMsg('🎉 New bulk buying pool published!');
      load();
    } catch (err) {
      alert(err.message || 'Failed to create bulk pool.');
    }
  }

  const totalPools = pools.length;
  const totalVolume = pools.reduce((s, p) => s + p.current_quantity, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-10">
      
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald/20 border border-emerald text-emerald px-6 py-3 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-2 text-sm font-semibold"
          >
            <CheckCircle size={18} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald mb-3">Cooperative Commerce</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white font-display">
            Bulk Buying & Harvest Pools
          </h1>
          <p className="mt-3 text-muted text-base max-w-2xl">
            Team up with restaurants, market aggregators, and cooperatives to buy wholesale farm harvests at deep volume discounts.
          </p>
        </div>

        {user && (user.role === 'farmer' || user.role === 'admin') && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 shrink-0">
            <Plus size={18} /> Launch Group Pool
          </Button>
        )}
      </div>

      {/* Highlights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Pools" value={totalPools} accent="gold" />
        <StatCard label="Total Pledged" value={`${totalVolume.toFixed(0)} units`} accent="green" />
        <StatCard label="Avg. Savings" value="15% – 25%" accent="gold" />
        <StatCard label="Settlement" value="Escrow Secured" accent="green" />
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : pools.length === 0 ? (
        <EmptyState 
          title="No active bulk pools" 
          subtitle="Check back soon or launch a collective harvest pooling target as a verified producer." 
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pools.map(p => {
            const pct = Math.min(100, Math.round((p.current_quantity / p.target_quantity) * 100));
            const savingsPct = Math.round(((p.original_price - p.pool_price) / p.original_price) * 100);

            return (
              <motion.div 
                key={p.id}
                whileHover={{ y: -6 }}
                className="glass-card rounded-[32px] p-6 border border-white/10 flex flex-col justify-between shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span className="text-xs uppercase font-bold tracking-widest text-emerald bg-emerald/10 border border-emerald/20 px-3 py-1 rounded-full">
                      {p.category} • {p.region}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gold-400 bg-gold-400/10 border border-gold-400/20 px-2.5 py-1 rounded-full">
                      <TrendingDown size={12} /> Save {savingsPct}%
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white font-display mb-1">{p.crop_name}</h2>
                  <p className="text-xs text-muted mb-4">Farmer: {p.farmer_name || 'Verified Cooperative'} • Closes {p.deadline}</p>

                  <p className="text-sm text-muted mb-6 line-clamp-2">{p.description || `Collective bulk order pool for ${p.crop_name}. Join with other buyers to trigger the discounted farm gate price.`}</p>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-white font-semibold">{p.current_quantity} of {p.target_quantity} {p.unit}</span>
                      <span className="text-emerald font-bold">{pct}% Filled</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald to-gold-400 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Price & Action */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-muted tracking-wider block">Group Price</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-emerald font-display">GHS {p.pool_price.toFixed(2)}</span>
                      <span className="text-xs text-muted line-through">GHS {p.original_price.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button onClick={() => setSelectedPool(p)} className="rounded-2xl px-5 text-xs font-bold">
                    Join Pool
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Join Pool Modal */}
      {selectedPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-[32px] border border-white/10 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white font-display mb-1">Pledge to {selectedPool.crop_name}</h2>
            <p className="text-sm text-muted mb-6">Lock in wholesale price of GHS {selectedPool.pool_price.toFixed(2)}/{selectedPool.unit}</p>

            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">Quantity ({selectedPool.unit})</label>
                <input
                  required
                  type="number"
                  min="1"
                  max={selectedPool.target_quantity - selectedPool.current_quantity}
                  value={pledgeQty}
                  onChange={e => setPledgeQty(e.target.value)}
                  placeholder={`Max: ${selectedPool.target_quantity - selectedPool.current_quantity} ${selectedPool.unit}`}
                  className="glass-input w-full rounded-2xl px-4 py-3.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="glass-input w-full rounded-2xl px-4 py-3.5 text-white"
                >
                  <option value="MTN MoMo">MTN Mobile Money (*170#)</option>
                  <option value="Telecel Cash">Telecel Cash (*110#)</option>
                  <option value="AirtelTigo Money">AirtelTigo Money</option>
                  <option value="GhIPSS Instant Pay">GhIPSS Instant Pay</option>
                  <option value="Cash on Delivery">Cash on Delivery Escrow</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">Mobile Wallet Number</label>
                <input
                  type="tel"
                  placeholder="024 XXX XXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="glass-input w-full rounded-2xl px-4 py-3.5 text-white"
                />
              </div>

              {pledgeQty > 0 && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Total Pledge:</span>
                    <span className="text-white font-bold">GHS {(pledgeQty * selectedPool.pool_price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald">
                    <span>You save:</span>
                    <span>GHS {(pledgeQty * (selectedPool.original_price - selectedPool.pool_price)).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={joining || !pledgeQty} className="flex-1">
                  {joining ? 'Securing pledge…' : 'Confirm & Join Pool'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSelectedPool(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-[32px] border border-white/10 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white font-display mb-1">Launch Bulk Buying Pool</h2>
            <p className="text-sm text-muted mb-6">List a wholesale consignment for collective buyer pooling.</p>

            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-1">Produce Name</label>
                <input
                  required
                  placeholder="e.g. Yellow Maize Grain"
                  value={newPool.crop_name}
                  onChange={e => setNewPool({ ...newPool, crop_name: e.target.value })}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Target Quantity</label>
                  <input
                    required
                    type="number"
                    placeholder="100"
                    value={newPool.target_quantity}
                    onChange={e => setNewPool({ ...newPool, target_quantity: e.target.value })}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Unit</label>
                  <input
                    required
                    placeholder="bag, crate, ton"
                    value={newPool.unit}
                    onChange={e => setNewPool({ ...newPool, unit: e.target.value })}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Standard Price (GHS)</label>
                  <input
                    required
                    type="number"
                    placeholder="250.00"
                    value={newPool.original_price}
                    onChange={e => setNewPool({ ...newPool, original_price: e.target.value })}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Discount Pool Price</label>
                  <input
                    required
                    type="number"
                    placeholder="210.00"
                    value={newPool.pool_price}
                    onChange={e => setNewPool({ ...newPool, pool_price: e.target.value })}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-1">Region</label>
                <select
                  value={newPool.region}
                  onChange={e => setNewPool({ ...newPool, region: e.target.value })}
                  className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                >
                  <option value="Ashanti">Ashanti</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Bono">Bono</option>
                  <option value="Northern">Northern</option>
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Volta">Volta</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Publish Group Pool</Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
