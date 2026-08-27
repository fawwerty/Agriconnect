import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Spinner, StatusBadge, Button } from '../components/ui.jsx';
import { CheckCircle, Smartphone, Building2, Banknote, CreditCard, Star, MessageSquare, Truck, ShieldCheck } from 'lucide-react';

// Ghanaian payment channels
const PAYMENT_METHODS = [
  {
    id: 'MTN MoMo',
    label: 'MTN Mobile Money',
    desc: 'Pay via MTN MoMo wallet (*170#)',
    color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    accent: 'text-yellow-400',
    badge: '🟡',
    phonePlaceholder: '024 XXXX XXXX',
    icon: <Smartphone size={20} />,
  },
  {
    id: 'Telecel Cash',
    label: 'Telecel Cash',
    desc: 'Formerly Vodafone Cash (*110#)',
    color: 'from-red-500/20 to-red-600/10 border-red-500/30',
    accent: 'text-red-400',
    badge: '🔴',
    phonePlaceholder: '020 XXXX XXXX',
    icon: <Smartphone size={20} />,
  },
  {
    id: 'AirtelTigo Money',
    label: 'AirtelTigo Money',
    desc: 'Pay with AT Money wallet',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    accent: 'text-blue-400',
    badge: '🔵',
    phonePlaceholder: '027 XXXX XXXX',
    icon: <Smartphone size={20} />,
  },
  {
    id: 'GhIPSS Instant Pay',
    label: 'GhIPSS Instant Pay',
    desc: 'Interbank bank account transfer',
    color: 'from-green-500/20 to-green-600/10 border-green-500/30',
    accent: 'text-green-400',
    badge: '🟢',
    phonePlaceholder: 'Bank account / Proxy ID',
    icon: <Building2 size={20} />,
  },
  {
    id: 'Card',
    label: 'Debit / Credit Card',
    desc: 'Visa, Mastercard & Gh-Link',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    accent: 'text-purple-400',
    badge: '💳',
    phonePlaceholder: 'Cardholder Phone number',
    icon: <CreditCard size={20} />,
  },
  {
    id: 'Cash on Delivery',
    label: 'Cash on Delivery',
    desc: 'Direct payment to carrier at delivery',
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    accent: 'text-amber-400',
    badge: '💵',
    phonePlaceholder: null,
    icon: <Banknote size={20} />,
  },
];

export default function OrderDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupCoords, setPickupCoords] = useState({ latitude: '', longitude: '' });
  const bottomRef = useRef(null);

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStep, setPayStep] = useState(1); // 1=choose, 2=enter phone, 3=processing, 4=receipt
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [payError, setPayError] = useState('');

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  function load() {
    Promise.all([
      api.get(`/orders/${id}`, token),
      api.get(`/messages/order/${id}`, token),
      api.get(`/transport/order/${id}`, token),
    ]).then(([o, m, b]) => {
      setOrder(o.order);
      setMessages(m.messages);
      setBookings(b.bookings);
    }).finally(() => setLoading(false));
  }

  useEffect(load, [id, token]);
  useEffect(() => {
    if (order?.farmer_id && user?.role === 'buyer') {
      api.get('/farmers/profile', token).catch(() => null).then((res) => {
        if (res?.profile) {
          setPickup(res.profile.pickup_address || res.profile.farm_location || '');
          setPickupCoords({ latitude: res.profile.latitude ?? '', longitude: res.profile.longitude ?? '' });
        }
      });
    }
  }, [order, token, user]);
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/messages/order/${id}`, token).then(({ messages }) => setMessages(messages)).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [id, token]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const body = draft;
    setDraft('');
    const { message } = await api.post(`/messages/order/${id}`, { body }, token);
    setMessages(m => [...m, message]);
  }

  async function bookTransport(e) {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    const locationValue = pickupCoords.latitude || pickupCoords.longitude ? `${pickup} (${pickupCoords.latitude || ''}, ${pickupCoords.longitude || ''})` : pickup;
    await api.post('/transport', { order_id: Number(id), pickup_location: locationValue, dropoff_location: dropoff }, token);
    setShowTransportForm(false);
    setPickup(''); setDropoff('');
    setPickupCoords({ latitude: '', longitude: '' });
    const { bookings } = await api.get(`/transport/order/${id}`, token);
    setBookings(bookings);
  }

  // ─── Payment modal handlers ───────────────────────────────────────────
  function openPayModal() {
    setPayStep(1);
    setSelectedMethod(null);
    setPhoneNumber('');
    setTxnRef('');
    setPayError('');
    setShowPayModal(true);
  }

  function selectMethod(method) {
    setSelectedMethod(method);
    setPayStep(2);
  }

  async function submitPayment(e) {
    e.preventDefault();
    setPayError('');
    const needsPhone = selectedMethod?.id !== 'Cash on Delivery';
    if (needsPhone && !phoneNumber.trim()) {
      setPayError('Please enter your mobile or account number.');
      return;
    }
    setPayStep(3); // processing spinner

    try {
      // 1. Initialize through payment routes
      const initRes = await api.post('/payments/initialize', {
        order_id: Number(id),
        payment_method: selectedMethod.id,
        phone: phoneNumber
      }, token);

      // 2. Direct verify payment
      const verifyRes = await api.post('/payments/verify', {
        reference: initRes.reference,
        order_id: Number(id)
      }, token);

      setTxnRef(initRes.reference || `AGC-GH-${new Date().getFullYear()}-DEMO`);
      setPayStep(4); // success receipt
      load();
    } catch (err) {
      setPayError(err.message || 'Payment processing failed. Please try again.');
      setPayStep(2);
    }
  }

  // ─── Review modal handlers ────────────────────────────────────────────
  async function submitReview(e) {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');
    try {
      await api.post('/reviews', {
        order_id: Number(id),
        rating: Number(rating),
        comment
      }, token);
      setReviewSubmitted(true);
      setTimeout(() => setShowReviewModal(false), 2000);
    } catch (err) {
      setReviewError(err.message || 'Failed to submit rating.');
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (!order) return null;

  const isBuyer = user.role === 'buyer' && order.buyer_id === user.id;
  const isFarmer = user.role === 'farmer' && order.farmer_id === user.id;
  const normalizedStatus = (order.status || order.order_status || '').toLowerCase().replace('pending_payment', 'pending');

  // Counter-offer modal & handlers
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  async function sendOffer(e) {
    e.preventDefault();
    setOfferLoading(true);
    try {
      await api.post(`/messages/order/${id}/offer`, {
        offer_price: Number(offerPrice),
        offer_quantity: order.quantity,
        note: offerNote
      }, token);
      setShowOfferModal(false);
      setOfferPrice('');
      setOfferNote('');
      load();
    } catch (err) {
      alert(err.message || 'Failed to submit counter-offer.');
    } finally {
      setOfferLoading(false);
    }
  }

  async function respondOffer(messageId, action) {
    try {
      await api.post(`/messages/offer/${messageId}/respond`, { action }, token);
      load();
    } catch (err) {
      alert(err.message || 'Failed to update offer status.');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to={isFarmer ? '/farmer/orders' : '/buyer/orders'} className="text-sm text-muted hover:text-white transition">← Back to orders</Link>
          <h1 className="font-display text-3xl font-semibold text-white mt-3">{order.crop_name}</h1>
          <p className="text-muted text-sm mt-1">Order #{order.order_number || order.id} · {order.quantity} {order.unit} · GHS {order.unit_price.toFixed(2)}/{order.unit}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {normalizedStatus === 'completed' && (
            <Button variant="secondary" onClick={() => setShowReviewModal(true)} className="text-xs">
              <Star size={14} className="text-gold-400 fill-gold-400" /> Rate & Review
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation & Negotiation */}
          <div className="glass-card rounded-[32px] p-6 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-lg text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald" /> Direct Order Messaging & Negotiation
              </h2>
              {['pending', 'accepted'].includes(normalizedStatus) && (
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="text-xs font-bold text-gold-400 bg-gold-400/10 border border-gold-400/20 px-3 py-1.5 rounded-full hover:bg-gold-400/20 transition"
                >
                  🤝 Propose Counter-Offer
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1 mb-4">
              {messages.length === 0 && <p className="text-sm text-muted">No messages yet. Say hello or propose a counter-offer to negotiate price.</p>}
              {messages.map(m => {
                const mine = m.sender_id === user.id;
                const isOffer = !!m.offer_price;

                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-3xl px-4 py-3.5 text-sm ${
                      isOffer 
                        ? 'bg-gold-400/10 border border-gold-400/30 text-white' 
                        : mine 
                        ? 'bg-emerald/20 text-white border border-emerald/30' 
                        : 'bg-white/5 text-white border border-white/10'
                    }`}>
                      <div className="flex justify-between items-center gap-4 mb-1">
                        <p className="text-[10px] uppercase tracking-wide text-muted font-bold">{mine ? 'You' : m.sender_name}</p>
                        {isOffer && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            m.offer_status === 'ACCEPTED' ? 'bg-emerald/20 text-emerald' :
                            m.offer_status === 'REJECTED' ? 'bg-error/20 text-error' :
                            'bg-gold-400/20 text-gold-400'
                          }`}>
                            {m.offer_status || 'Pending Offer'}
                          </span>
                        )}
                      </div>

                      <p className="leading-relaxed">{m.body}</p>

                      {/* Offer Action Buttons if pending & received from other party */}
                      {isOffer && m.offer_status === 'PENDING' && !mine && ['pending', 'accepted'].includes(normalizedStatus) && (
                        <div className="mt-3 pt-2 border-t border-white/10 flex gap-2">
                          <button
                            onClick={() => respondOffer(m.id, 'accept')}
                            className="bg-emerald text-black text-xs font-bold px-3 py-1.5 rounded-xl hover:brightness-110 transition"
                          >
                            ✓ Accept GHS {m.offer_price.toFixed(2)}
                          </button>
                          <button
                            onClick={() => respondOffer(m.id, 'reject')}
                            className="bg-white/10 text-muted hover:text-error text-xs font-semibold px-3 py-1.5 rounded-xl transition"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
              <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message or inquiry…"
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-emerald focus:outline-none" />
              <Button type="submit">Send</Button>
            </form>
          </div>

          {/* Counter Offer Modal */}
          {showOfferModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
              <div className="glass-card w-full max-w-md rounded-[32px] border border-white/10 p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white font-display mb-1">Propose Counter-Offer</h2>
                <p className="text-xs text-muted mb-6">Current Subtotal: GHS {order.subtotal.toFixed(2)}</p>

                <form onSubmit={sendOffer} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted mb-1">Proposed Total Price (GHS)</label>
                    <input
                      required
                      type="number"
                      step="any"
                      min="1"
                      placeholder="e.g. 450.00"
                      value={offerPrice}
                      onChange={e => setOfferPrice(e.target.value)}
                      className="glass-input w-full rounded-2xl px-4 py-3 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted mb-1">Note / Terms</label>
                    <textarea
                      rows={2}
                      placeholder="Reason for offer (e.g. buying regularly, cash ready)..."
                      value={offerNote}
                      onChange={e => setOfferNote(e.target.value)}
                      className="glass-input w-full rounded-2xl p-3 text-sm text-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={offerLoading || !offerPrice} className="flex-1">
                      {offerLoading ? 'Sending…' : 'Submit Counter-Offer'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowOfferModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Transport */}
          <div className="glass-card rounded-[32px] p-6 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-white flex items-center gap-2">
                <Truck size={18} className="text-emerald" /> Transport & Logistics
              </h2>
              {bookings.length === 0 && ['accepted', 'paid', 'escrow_held', 'preparing'].includes(normalizedStatus) && (
                <Button variant="gold" onClick={() => setShowTransportForm(s => !s)}>Book Dispatch</Button>
              )}
            </div>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted">No transport booked yet. Dispatch partners can be requested once order is confirmed.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="rounded-2xl border border-white/10 p-4 bg-white/5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{b.pickup_location} → {b.dropoff_location}</p>
                      <p className="text-xs text-muted mt-1">{b.driver_name ? `Driver: ${b.driver_name} (${b.driver_phone || 'Assigned'}) · ${b.vehicle_type || 'Truck'}` : 'Awaiting driver assignment'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gold-400">GHS {b.fee ? Number(b.fee).toFixed(2) : '25.00'}</p>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showTransportForm && (
              <form onSubmit={bookTransport} className="mt-4 grid gap-3 sm:grid-cols-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                <input required placeholder="Pickup location (Farm / Town)" value={pickup} onChange={e => setPickup(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald focus:outline-none sm:col-span-2" />
                <input placeholder="Pickup latitude" value={pickupCoords.latitude} onChange={e => setPickupCoords(c => ({ ...c, latitude: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald focus:outline-none" />
                <input placeholder="Pickup longitude" value={pickupCoords.longitude} onChange={e => setPickupCoords(c => ({ ...c, longitude: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald focus:outline-none" />
                <input required placeholder="Dropoff location (Warehouse / GPS)" value={dropoff} onChange={e => setDropoff(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald focus:outline-none sm:col-span-2" />
                <Button type="submit" className="sm:col-span-2">Request Carrier Dispatch</Button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Payment breakdown */}
          <div className="glass-card rounded-[32px] p-6 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald" /> Settlement Breakdown
            </h2>
            <dl className="space-y-3 text-sm">
              <Row label="Subtotal" value={`GHS ${order.subtotal.toFixed(2)}`} />
              <Row label="Platform Escrow Fee (4%)" value={`GHS ${(order.commission || order.subtotal * 0.04).toFixed(2)}`} />
              <Row label="Delivery Fee" value={`GHS ${(order.delivery_fee || 0).toFixed(2)}`} />
              <Row label="Buyer Total" value={`GHS ${(order.total || order.total_to_buyer).toFixed(2)}`} bold />
              <Row label="Farmer Payout" value={`GHS ${(order.subtotal || order.payout_to_farmer).toFixed(2)}`} bold />
            </dl>

            {/* Payment method & reference */}
            {order.payment_method && (
              <div className="mt-4 rounded-2xl border border-emerald/20 bg-emerald/10 p-3.5 text-xs space-y-1">
                <p className="text-muted uppercase tracking-wider text-[10px]">Settled via</p>
                <p className="text-emerald font-semibold">{order.payment_method}</p>
                {order.payment_reference && (
                  <p className="text-white font-mono text-[11px] break-all">{order.payment_reference}</p>
                )}
              </div>
            )}

            {/* Pay button for buyer when order is pending or accepted */}
            {isBuyer && ['accepted', 'pending'].includes(normalizedStatus) && (
              <button
                onClick={openPayModal}
                id="btn-pay-now"
                className="mt-5 w-full rounded-2xl bg-emerald px-4 py-3.5 text-sm font-bold text-black hover:bg-emerald/90 shadow-[0_10px_30px_rgba(34,197,94,0.3)] transition"
              >
                💳 Pay & Secure in Escrow
              </button>
            )}
          </div>

          {/* Parties Info */}
          <div className="glass-card rounded-[32px] p-6 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.22)] space-y-3">
            <h2 className="font-display text-lg text-white mb-2">Trade Parties</h2>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Farmer:</span>
              <span className="text-white font-semibold">{order.farmer_name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted">Buyer:</span>
              <span className="text-white font-semibold">{order.buyer_name}</span>
            </div>
          </div>

          {/* Farmer action buttons */}
          {isFarmer && (
            <div className="glass-card rounded-[32px] p-6 border border-white/10 space-y-3">
              <h2 className="font-display text-lg text-white mb-2">Farmer Actions</h2>
              {normalizedStatus === 'pending' && (
                <>
                  <ActionBtn orderId={id} action="accept" label="✅ Accept Order" token={token} onDone={load} />
                  <ActionBtn orderId={id} action="reject" label="❌ Decline Order" token={token} onDone={load} variant="danger" />
                </>
              )}
              {['paid', 'escrow_held', 'preparing'].includes(normalizedStatus) && (
                <ActionBtn orderId={id} action="fulfill" label="📦 Mark Ready / Dispatched" token={token} onDone={load} />
              )}
            </div>
          )}

          {/* Buyer action buttons */}
          {isBuyer && (
            <div className="glass-card rounded-[32px] p-6 border border-white/10 space-y-3">
              <h2 className="font-display text-lg text-white mb-2">Buyer Actions</h2>
              {['pending', 'accepted'].includes(normalizedStatus) && (
                <ActionBtn orderId={id} action="cancel" label="🚫 Cancel Order" token={token} onDone={load} variant="danger" />
              )}
              {['fulfilled', 'delivered'].includes(normalizedStatus) && (
                <ActionBtn orderId={id} action="complete" label="✅ Confirm Delivery & Release Escrow" token={token} onDone={load} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Ghanaian Payment Modal ─────────────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-[32px] border border-white/10 p-8 shadow-[0_40px_140px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto">

            {/* Step 1 – Choose payment method */}
            {payStep === 1 && (
              <>
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald mb-2">Secure Escrow Checkout</p>
                  <h2 className="text-2xl font-semibold text-white font-display">Choose payment channel</h2>
                  <p className="text-sm text-muted mt-1">Funds are secured in AgriConnect Escrow and only released when you confirm produce receipt.</p>
                </div>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => selectMethod(m)}
                      className={`w-full text-left rounded-2xl border bg-gradient-to-r ${m.color} px-5 py-4 transition hover:scale-[1.01] active:scale-[0.99]`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{m.badge}</span>
                        <div>
                          <p className={`font-semibold ${m.accent}`}>{m.label}</p>
                          <p className="text-xs text-muted mt-0.5">{m.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowPayModal(false)} className="mt-5 w-full text-sm text-muted hover:text-white text-center">Cancel</button>
              </>
            )}

            {/* Step 2 – Enter account / phone */}
            {payStep === 2 && selectedMethod && (
              <>
                <button onClick={() => setPayStep(1)} className="text-xs text-muted hover:text-white mb-4">← Back to channels</button>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{selectedMethod.badge}</span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-emerald">Selected Channel</p>
                      <p className="text-xl font-semibold text-white">{selectedMethod.label}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted space-y-2">
                    <div className="flex justify-between"><span>Amount to Escrow</span><span className="text-white font-semibold">GHS {(order.total || order.total_to_buyer).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>For</span><span className="text-white">{order.quantity} {order.unit} {order.crop_name}</span></div>
                  </div>
                </div>
                <form onSubmit={submitPayment} className="space-y-4">
                  {payError && <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{payError}</div>}
                  {selectedMethod.id !== 'Cash on Delivery' ? (
                    <div>
                      <label className="block text-xs uppercase tracking-[0.3em] text-muted mb-2">
                        {selectedMethod.id === 'GhIPSS Instant Pay' ? 'Bank Account / Proxy ID' : selectedMethod.id === 'Card' ? 'Cardholder Phone' : 'Mobile Money Number'}
                      </label>
                      <input
                        required
                        type={selectedMethod.id === 'GhIPSS Instant Pay' ? 'text' : 'tel'}
                        placeholder={selectedMethod.phonePlaceholder}
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="glass-input w-full rounded-2xl px-4 py-3.5 text-white"
                      />
                      <p className="mt-2 text-xs text-muted">You will receive an instant push prompt on your device to enter PIN.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 text-sm text-amber-300">
                      <p className="font-semibold mb-1">💵 Cash on Delivery Escrow</p>
                      <p className="text-muted text-xs">You will inspect produce upon arrival and pay <span className="text-white font-semibold">GHS {(order.total || order.total_to_buyer).toFixed(2)}</span> in cash to the carrier.</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-emerald px-4 py-3.5 text-sm font-bold text-black hover:bg-emerald/90 transition shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
                  >
                    {selectedMethod.id === 'Cash on Delivery' ? 'Confirm Cash on Delivery' : `Authorize ${selectedMethod.label} Payment`}
                  </button>
                </form>
              </>
            )}

            {/* Step 3 – Processing */}
            {payStep === 3 && (
              <div className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">Authorizing Mobile Money prompt…</p>
                  <p className="text-muted text-sm mt-2">Connecting with {selectedMethod?.label} gateway</p>
                </div>
              </div>
            )}

            {/* Step 4 – Receipt */}
            {payStep === 4 && (
              <div className="text-center space-y-5">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald/20 text-emerald mx-auto shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                  <CheckCircle size={36} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white font-display">Escrow Secured!</h2>
                  <p className="text-muted text-sm mt-1">Funds are now held safely in AgriConnect Escrow.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-left space-y-3">
                  <ReceiptRow label="Transaction Reference" value={txnRef} mono />
                  <ReceiptRow label="Channel" value={selectedMethod?.label} />
                  <ReceiptRow label="Amount Held" value={`GHS ${(order.total || order.total_to_buyer).toFixed(2)}`} />
                  <ReceiptRow label="Status" value="Escrow Held ✅" />
                </div>
                <p className="text-xs text-muted">The farmer has been instructed to prepare dispatch. Escrow automatically releases once you verify delivery.</p>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="w-full rounded-2xl bg-emerald px-4 py-3.5 text-sm font-bold text-black hover:bg-emerald/90 transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Review / Rating Modal ─────────────────────────────────────────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-[32px] border border-white/10 p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white font-display mb-2">Rate your trade experience</h2>
            <p className="text-sm text-muted mb-6">Leave honest feedback to build trusted Ghanaian agricultural commerce.</p>

            {reviewSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle size={40} className="text-emerald mx-auto" />
                <p className="text-white font-semibold">Review recorded successfully!</p>
              </div>
            ) : (
              <form onSubmit={submitReview} className="space-y-5">
                {reviewError && <div className="rounded-xl bg-error/10 border border-error/20 p-3 text-xs text-error">{reviewError}</div>}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-2">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-125 transition"
                      >
                        <Star size={28} className={star <= rating ? 'text-gold-400 fill-gold-400' : 'text-white/20'} />
                      </button>
                    ))}
                    <span className="ml-3 text-sm font-bold text-gold-400">{rating} / 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted mb-2">Comments (Optional)</label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Freshness, delivery timeliness, communication..."
                    className="glass-input w-full rounded-2xl p-3 text-sm text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={reviewLoading} className="flex-1">
                    {reviewLoading ? 'Submitting…' : 'Submit Review'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={bold ? 'text-white font-semibold font-mono' : 'text-muted font-mono'}>{value}</dd>
    </div>
  );
}

function ReceiptRow({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className={`text-white font-semibold ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function ActionBtn({ orderId, action, label, token, onDone, variant = 'primary' }) {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    try { 
      await api.post(`/orders/${orderId}/${action}`, {}, token); 
      onDone(); 
    }
    catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }
  const base = 'w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition';
  const styles = variant === 'danger'
    ? `${base} border border-error/30 bg-error/10 text-error hover:bg-error/20`
    : `${base} bg-emerald text-black hover:bg-emerald/90`;
  return (
    <button onClick={handle} disabled={loading} className={styles}>
      {loading ? 'Please wait…' : label}
    </button>
  );
}
