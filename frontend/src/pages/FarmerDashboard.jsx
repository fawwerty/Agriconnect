import React, { useEffect, useState } from 'react';
import { Plus, ShieldCheck, TrendingUp, Wallet, ArrowDownToLine, CloudSun, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Button, EmptyState, Spinner, StatusBadge, StatCard } from '../components/ui.jsx';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Tubers', 'Livestock', 'Seeds', 'Other'];
const REGIONS = ['Greater Accra', 'Ashanti', 'Eastern', 'Volta', 'Bono', 'Central', 'Western', 'Northern'];
const UNITS = ['kg', 'bag', 'crate', 'ton', 'basket', 'tuber'];
const emptyForm = { crop_name: '', category: 'Vegetables', quantity: '', unit: 'kg', price_per_unit: '', negotiable: false, organic: false, harvest_date: '', region: 'Ashanti', description: '' };

export default function FarmerDashboard() {
  const { token, user } = useAuth();
  const [listings, setListings] = useState([]);
  const [wallet, setWallet] = useState({ available_balance: 0, pending_escrow: 0, transactions: [] });
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState({ latitude: '', longitude: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Cashout Form
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutChannel, setCashoutChannel] = useState('MTN Mobile Money');
  const [cashoutAccount, setCashoutAccount] = useState('');
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [cashoutSuccess, setCashoutSuccess] = useState('');

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/listings/mine', token),
      api.get('/wallet', token).catch(() => ({ available_balance: 0, pending_escrow: 0, transactions: [] })),
      api.get('/advisories', token).catch(() => ({ advisories: [] })),
      api.get('/farmers/profile', token).catch(() => null)
    ]).then(([listRes, walletRes, advRes, profileRes]) => {
      setListings(listRes.listings || []);
      setWallet(walletRes);
      setAdvisories(advRes.advisories || []);
      if (profileRes?.profile) {
        setPickupLocation(profileRes.profile.pickup_address || '');
        setPickupCoords({ latitude: profileRes.profile.latitude ?? '', longitude: profileRes.profile.longitude ?? '' });
      }
    }).finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  function openNew() { setEditing(null); setForm(emptyForm); setSelectedImage(null); setImagePreview(''); setShowForm(true); }
  function openEdit(l) {
    setEditing(l);
    setForm({ ...l, negotiable: !!l.negotiable, organic: !!l.organic });
    setSelectedImage(null);
    setImagePreview(l.image_url || '');
    setPickupLocation(l.location || pickupLocation || '');
    setShowForm(true);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    setSelectedImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (selectedImage || !editing || pickupLocation) {
        const formData = new FormData();
        Object.entries({
          ...form,
          pickup_location: pickupLocation || form.region,
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          quantity: Number(form.quantity),
          price_per_unit: Number(form.price_per_unit),
          organic: Boolean(form.organic)
        }).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            formData.append(key, value);
          }
        });
        if (selectedImage) formData.append('icon', selectedImage);
        if (editing) await api.upload(`/listings/${editing.id}`, formData, token, 'PATCH');
        else await api.upload('/listings', formData, token);
      } else {
        const payload = { ...form, quantity: Number(form.quantity), price_per_unit: Number(form.price_per_unit), pickup_location: pickupLocation || form.region };
        await api.patch(`/listings/${editing.id}`, payload, token);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this listing?')) return;
    await api.del(`/listings/${id}`, token);
    load();
  }

  async function handleCashout(e) {
    e.preventDefault();
    setCashoutLoading(true);
    try {
      const res = await api.post('/wallet/cashout', {
        amount: Number(cashoutAmount),
        channel: cashoutChannel,
        destination_account: cashoutAccount
      }, token);

      setCashoutSuccess(`GHS ${res.net_amount.toFixed(2)} dispatched to ${cashoutAccount} via ${cashoutChannel}. Ref: ${res.reference}`);
      setCashoutAmount('');
      setCashoutAccount('');
      setTimeout(() => {
        setCashoutSuccess('');
        setShowCashoutModal(false);
        load();
      }, 3000);
    } catch (err) {
      alert(err.message || 'Cashout failed.');
    } finally {
      setCashoutLoading(false);
    }
  }

  const activeCount = listings.filter(l => (l.status || '').toLowerCase() === 'active').length;
  const soldCount = listings.filter(l => (l.status || '').toLowerCase() === 'sold').length;
  const totalValue = listings.filter(l => (l.status || '').toLowerCase() === 'active').reduce((s, l) => s + l.quantity * l.price_per_unit, 0);

  return (
    <div className="dashboard-page-bg relative mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-emerald mb-2">Farmer Enterprise Hub</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white font-display">
            Harvest & Wallet Command Center
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">
            Manage your crop inventory, withdraw trade revenues to Mobile Money, and monitor agronomy weather advisories.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowCashoutModal(true)} variant="gold" className="gap-2">
            <ArrowDownToLine size={18} /> MoMo Cashout
          </Button>
          <Button onClick={openNew} className="gap-2">
            <Plus size={18} /> Add Harvest Listing
          </Button>
        </div>
      </div>

      {/* Wallet & Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-[28px] p-6 border border-emerald/20 bg-emerald/10 shadow-[0_10px_40px_rgba(34,197,94,0.15)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-widest text-emerald font-bold">Available Wallet</p>
            <Wallet size={18} className="text-emerald" />
          </div>
          <p className="text-3xl font-bold text-white font-display">GHS {wallet.available_balance ? wallet.available_balance.toFixed(2) : '0.00'}</p>
          <p className="text-xs text-muted mt-2">Ready for instant cashout</p>
        </div>

        <StatCard label="Pending in Escrow" value={`GHS ${wallet.pending_escrow ? wallet.pending_escrow.toFixed(2) : '0.00'}`} accent="gold" />
        <StatCard label="Active Crops" value={activeCount} accent="green" />
        <StatCard label="Stock Valuation" value={`GHS ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} accent="gold" />
      </div>

      {/* MOFA & Weather Advisories Feed */}
      {advisories.length > 0 && (
        <div className="glass-card rounded-[32px] p-6 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <h2 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
            <CloudSun size={20} className="text-gold-400" /> Ministry of Agriculture & Meteorological Advisories
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {advisories.slice(0, 2).map(adv => (
              <div key={adv.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex gap-3.5">
                <AlertTriangle size={20} className={adv.severity === 'urgent' ? 'text-error shrink-0 mt-0.5' : 'text-gold-400 shrink-0 mt-0.5'} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white uppercase">{adv.title}</span>
                    <span className="text-[10px] text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">{adv.region}</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{adv.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listings Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-display">My Published Listings</h2>
          <span className="text-xs text-muted">{listings.length} total crops</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : listings.length === 0 ? (
          <EmptyState 
            title="No listings yet" 
            subtitle="Add your first harvest produce listing to start selling to verified Ghanaian buyers." 
            action={<Button onClick={openNew}>Add First Harvest</Button>} 
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map(l => (
              <div key={l.id} className="glass-card rounded-[32px] p-6 flex flex-col justify-between border border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald mb-1">{l.category}</p>
                      <h3 className="text-2xl font-semibold text-white font-display">{l.crop_name}</h3>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="text-xs text-muted mb-4">{l.region} · {l.quantity} {l.unit} available</p>
                  
                  <div className="rounded-2xl bg-white/5 p-4 mb-6">
                    <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Unit Price</p>
                    <p className="text-3xl font-bold text-emerald font-display">GHS {l.price_per_unit.toFixed(2)}<span className="text-xs text-muted">/{l.unit}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <Button variant="secondary" onClick={() => openEdit(l)}>Edit</Button>
                  <Button variant="danger" onClick={() => handleDelete(l.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cashout Modal */}
      {showCashoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-[32px] border border-white/10 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white font-display mb-1 flex items-center gap-2">
              <Wallet className="text-emerald" /> MoMo Cashout
            </h2>
            <p className="text-xs text-muted mb-6">Available to withdraw: <strong className="text-white">GHS {wallet.available_balance.toFixed(2)}</strong></p>

            {cashoutSuccess ? (
              <div className="p-4 bg-emerald/10 border border-emerald text-emerald rounded-2xl text-center text-sm font-semibold space-y-2">
                <CheckCircle size={32} className="mx-auto" />
                <p>{cashoutSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleCashout} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Cashout Amount (GHS)</label>
                  <input
                    required
                    type="number"
                    min="10"
                    max={wallet.available_balance}
                    step="any"
                    placeholder="Min GHS 10.00"
                    value={cashoutAmount}
                    onChange={e => setCashoutAmount(e.target.value)}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Payout Channel</label>
                  <select
                    value={cashoutChannel}
                    onChange={e => setCashoutChannel(e.target.value)}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money (*170#)</option>
                    <option value="Telecel Cash">Telecel Cash (*110#)</option>
                    <option value="AirtelTigo Money">AirtelTigo Money</option>
                    <option value="GhIPSS Instant Bank Pay">GhIPSS Direct Bank Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Phone / Account Number</label>
                  <input
                    required
                    placeholder="e.g. 0244 123 456"
                    value={cashoutAccount}
                    onChange={e => setCashoutAccount(e.target.value)}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                  />
                </div>

                {cashoutAmount > 0 && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Telco Processing Fee (1%):</span>
                      <span className="text-white">GHS {Math.min(10, cashoutAmount * 0.01).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald">
                      <span>Net Cashout to Wallet:</span>
                      <span>GHS {(cashoutAmount - Math.min(10, cashoutAmount * 0.01)).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={cashoutLoading || !cashoutAmount} className="flex-1">
                    {cashoutLoading ? 'Authorizing Payout…' : 'Withdraw Funds'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowCashoutModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl rounded-[32px] p-8 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-emerald mb-1">{editing ? 'Edit listing' : 'New harvest'}</p>
                <h2 className="text-3xl font-semibold text-white font-display">{editing ? 'Update produce details' : 'Publish a new harvest listing'}</h2>
              </div>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Produce Name</label>
                  <input required value={form.crop_name} onChange={e => setForm(f => ({ ...f, crop_name: e.target.value }))} className="glass-input w-full rounded-2xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="glass-input w-full rounded-2xl px-4 py-3 text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Quantity</label>
                  <input required type="number" min="1" step="any" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="glass-input w-full rounded-2xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="glass-input w-full rounded-2xl px-4 py-3 text-white">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Price per unit (GHS)</label>
                  <input required type="number" min="0.1" step="any" value={form.price_per_unit} onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))} className="glass-input w-full rounded-2xl px-4 py-3 text-white" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Region</label>
                  <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="glass-input w-full rounded-2xl px-4 py-3 text-white">
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Harvest Date</label>
                  <input type="date" value={form.harvest_date || ''} onChange={e => setForm(f => ({ ...f, harvest_date: e.target.value }))} className="glass-input w-full rounded-2xl px-4 py-3 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted mb-1">Description</label>
                <textarea rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="glass-input w-full rounded-2xl px-4 py-3 text-white" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Pickup location</label>
                  <input value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} placeholder="Farm gate / nearest town" className="glass-input w-full rounded-2xl px-4 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-1">Coordinates (optional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={pickupCoords.latitude} onChange={e => setPickupCoords(c => ({ ...c, latitude: e.target.value }))} placeholder="Lat" className="glass-input w-full rounded-2xl px-3 py-3 text-white" />
                    <input value={pickupCoords.longitude} onChange={e => setPickupCoords(c => ({ ...c, longitude: e.target.value }))} placeholder="Lng" className="glass-input w-full rounded-2xl px-3 py-3 text-white" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="block text-xs uppercase tracking-widest text-muted mb-2">Product Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-emerald file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-900" />
                {(imagePreview || editing?.image_url) && (
                  <img
                    src={imagePreview || (editing.image_url.startsWith('/uploads') ? `http://localhost:4000${editing.image_url}` : editing.image_url)}
                    alt="Product preview"
                    className="mt-3 h-32 w-full rounded-2xl object-cover border border-white/10"
                  />
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white cursor-pointer">
                  <input type="checkbox" checked={form.negotiable} onChange={e => setForm(f => ({ ...f, negotiable: e.target.checked }))} className="accent-emerald" />
                  Price Negotiable
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white cursor-pointer">
                  <input type="checkbox" checked={form.organic} onChange={e => setForm(f => ({ ...f, organic: e.target.checked }))} className="accent-emerald" />
                  Certified Organic
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Publishing…' : editing ? 'Save changes' : 'Publish Listing'}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
