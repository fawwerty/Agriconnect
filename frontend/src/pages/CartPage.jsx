import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Trash2, ShoppingCart, MapPin, Truck, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button, EmptyState, Spinner } from '../components/ui.jsx';

const PAYMENT_METHODS = ['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money', 'GhIPSS Instant Pay', 'Card', 'Cash on Delivery'];
const LOGISTICS_COST_PER_ITEM = 15; // Mock fixed cost per unique item type for MVP

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('cart'); // cart, checkout, success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Checkout Form State
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');

  const logisticsTotal = cart.length * LOGISTICS_COST_PER_ITEM;
  const platformFee = cartTotal * 0.04;
  const finalTotal = cartTotal + logisticsTotal + platformFee;

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <EmptyState 
          title="Your cart is empty" 
          subtitle="Looks like you haven't added any produce to your cart yet."
          action={<Button onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>}
        />
      </div>
    );
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In a real app with multi-vendor carts, we would create one order per farmer.
      // For this MVP, we map each cart item to a single order call (since the backend accepts listing_id).
      // Wait, we updated orders.js to accept `items` or `listing_id`? 
      // Actually, my Phase 2 update to orders.js still expects a single `listing_id`!
      // To support the cart without heavily refactoring the backend again, we will loop and post an order per item.
      
      const promises = cart.map(item => 
        api.post('/orders', {
          listing_id: item.product.id,
          quantity: item.quantity,
          payment_method: paymentMethod, // we would trigger /:id/pay next
        }, token)
      );
      
      const orders = await Promise.all(promises);
      
      // If payment is not COD, we automatically trigger the 'pay' transition for MVP simplicity
      if (paymentMethod !== 'Cash on Delivery') {
        await Promise.all(orders.map(o => 
          api.post(`/orders/${o.order.id}/pay`, { payment_method: paymentMethod }, token)
        ));
      }

      clearCart();
      setStep('success');
    } catch (err) {
      setError(err.message || 'Failed to complete checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white mb-3">Checkout</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white font-display mb-8">
          {step === 'cart' ? 'Your Cart' : step === 'checkout' ? 'Secure Checkout' : 'Order Confirmed'}
        </h1>

        {/* Steps Tracker */}
        {step !== 'success' && (
          <div className="flex items-center gap-4 text-sm font-medium mb-12">
            <span className={step === 'cart' ? 'text-emerald' : 'text-white'}>1. Review Cart</span>
            <ChevronRight size={16} className="text-muted" />
            <span className={step === 'checkout' ? 'text-emerald' : 'text-muted'}>2. Delivery & Payment</span>
          </div>
        )}
      </div>

      {step === 'cart' && (
        <div className="grid lg:grid-cols-[1fr_400px] gap-10">
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.product.id} className="glass-card rounded-[24px] p-4 flex gap-6 items-center">
                <div className="w-24 h-24 rounded-2xl bg-white/5 overflow-hidden shrink-0">
                  <img src={'/produce-fallback.svg'} alt={item.product.crop_name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1 font-display">{item.product.crop_name}</h3>
                  <p className="text-sm text-muted mb-3">Farmer: {item.product.farmer_name} • {item.product.farmer_region}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-emerald font-semibold">GHS {item.product.price_per_unit.toFixed(2)} <span className="text-xs text-muted">/{item.product.unit}</span></p>
                    <div className="flex items-center gap-3 glass-input rounded-full px-2 py-1">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-white hover:text-emerald">-</button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-white hover:text-emerald">+</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} className="p-3 text-muted hover:text-error transition rounded-full hover:bg-error/10">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="glass-card rounded-[32px] p-8 h-fit sticky top-24">
            <h3 className="text-xl font-bold text-white mb-6 font-display">Order Summary</h3>
            <div className="space-y-4 text-sm text-muted mb-6">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items)</span>
                <span className="text-white font-medium">GHS {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee (4%)</span>
                <span className="text-white font-medium">GHS {platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-warning">
                <span>Logistics Estimate</span>
                <span className="font-medium">Calculated next step</span>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10 flex justify-between mb-8">
              <span className="text-white font-bold">Total (excl. logistics)</span>
              <span className="text-2xl font-bold text-emerald font-display">GHS {(cartTotal + platformFee).toFixed(2)}</span>
            </div>
            <Button onClick={() => setStep('checkout')} className="w-full h-14 text-base shadow-[0_10px_40px_rgba(34,197,94,0.3)]">
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}

      {step === 'checkout' && (
        <form onSubmit={handleCheckout} className="grid lg:grid-cols-[1fr_400px] gap-10">
          <div className="space-y-8">
            {error && <div className="rounded-2xl bg-error/10 border border-error/20 p-4 text-error text-sm font-medium">{error}</div>}
            
            <div className="glass-card rounded-[32px] p-8">
              <h3 className="text-xl font-bold text-white mb-6 font-display flex items-center gap-3">
                <MapPin className="text-emerald" /> Delivery Details
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted block mb-2">Delivery Address / GPS Address</label>
                  <input required value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="e.g. GA-123-4567, East Legon" className="glass-input w-full rounded-2xl px-4 py-3.5 text-white" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted block mb-2">Phone Number</label>
                  <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="054 XXX XXXX" className="glass-input w-full rounded-2xl px-4 py-3.5 text-white" />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-8">
              <h3 className="text-xl font-bold text-white mb-6 font-display flex items-center gap-3">
                <CreditCard className="text-emerald" /> Payment Method
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map(m => (
                  <label key={m} className={`flex items-center p-4 rounded-2xl border cursor-pointer transition ${paymentMethod === m ? 'bg-emerald/10 border-emerald shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                    <input type="radio" name="paymentMethod" value={m} checked={paymentMethod === m} onChange={e => setPaymentMethod(e.target.value)} className="hidden" />
                    <div className="flex-1">
                      <p className={`font-semibold ${paymentMethod === m ? 'text-emerald' : 'text-white'}`}>{m}</p>
                    </div>
                    {paymentMethod === m && <div className="w-3 h-3 rounded-full bg-emerald" />}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[32px] p-8 h-fit sticky top-24">
            <h3 className="text-xl font-bold text-white mb-6 font-display">Final Summary</h3>
            <div className="space-y-4 text-sm text-muted mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-medium">GHS {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee (4%)</span>
                <span className="text-white font-medium">GHS {platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-warning">
                <span className="flex items-center gap-1"><Truck size={14} /> Logistics (Est)</span>
                <span className="font-medium">GHS {logisticsTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10 flex justify-between mb-8">
              <span className="text-white font-bold text-lg">Total</span>
              <span className="text-3xl font-bold text-emerald font-display">GHS {finalTotal.toFixed(2)}</span>
            </div>
            <Button type="submit" disabled={!paymentMethod || loading} className="w-full h-14 text-base shadow-[0_10px_40px_rgba(34,197,94,0.3)]">
              {loading ? <Spinner className="w-5 h-5" /> : `Pay GHS ${finalTotal.toFixed(2)}`}
            </Button>
            <button type="button" onClick={() => setStep('cart')} className="w-full mt-4 text-sm text-muted hover:text-white transition">
              Back to Cart
            </button>
          </div>
        </form>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
          <div className="w-24 h-24 rounded-full bg-emerald/20 flex items-center justify-center text-emerald mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-4xl font-bold text-white font-display mb-4">Payment Successful!</h2>
          <p className="text-muted leading-relaxed mb-8">
            Your order has been placed and secured in escrow. The farmers have been notified and transport is being arranged to your location.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/buyer/orders')}>Track Orders</Button>
            <Button variant="ghost" onClick={() => navigate('/marketplace')}>Continue Shopping</Button>
          </div>
        </div>
      )}
    </div>
  );
}
