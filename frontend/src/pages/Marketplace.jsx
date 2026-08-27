import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Star, MapPin, ShieldCheck, Heart, ShoppingCart, SlidersHorizontal, ArrowUpDown, Clock, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Button, EmptyState, Spinner } from '../components/ui.jsx';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Tubers', 'Livestock', 'Seeds', 'Other'];
const REGIONS = ['All', 'Greater Accra', 'Ashanti', 'Eastern', 'Volta', 'Bono', 'Central', 'Western', 'Northern'];

const IMAGES = {
  Tomato: '/produce-tomato.svg',
  Pepper: '/produce-pepper.svg',
  Onion: '/produce-onion.svg',
  Cabbage: '/produce-cabbage.svg',
  Okro: '/produce-okro.svg',
  Maize: '/produce-maize.svg',
  Cassava: '/produce-cassava.svg',
  Pineapple: '/produce-pineapple.svg',
  Plantain: '/produce-plantain.svg',
  Ginger: '/produce-ginger.svg',
  SweetPotato: '/produce-sweetpotato.svg',
  Eggplant: '/produce-eggplant.svg',
};

// Simple skeleton for loading state
function SkeletonCard() {
  return (
    <div className="glass-card rounded-[32px] overflow-hidden border border-white/5 animate-pulse">
      <div className="h-56 bg-white/5" />
      <div className="p-6 flex flex-col gap-4">
        <div className="h-6 w-3/4 bg-white/5 rounded-md" />
        <div className="h-4 w-1/2 bg-white/5 rounded-md" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-8 w-1/3 bg-white/5 rounded-md" />
          <div className="h-10 w-24 bg-white/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Search & Filters state
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [region, setRegion] = useState('All');
  const [organic, setOrganic] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest'); // newest, price_asc, price_desc, rating
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [toast, setToast] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function toggleFavorite(id, e) {
    e.stopPropagation();
    const newFavs = new Set(favorites);
    if (newFavs.has(id)) newFavs.delete(id);
    else newFavs.add(id);
    setFavorites(newFavs);
    if (!newFavs.has(id)) showToast('Removed from favorites', 'info');
    else showToast('Added to favorites', 'success');
  }

  function handleAddToCart(listing, e) {
    if (e) e.stopPropagation();
    if (!token) return navigate(`/login?redirect=/marketplace`);
    addToCart(listing, 1);
    showToast(`Added ${listing.crop_name} to cart.`, 'success');
  }

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category && category !== 'All') params.set('category', category);
    if (region && region !== 'All') params.set('region', region);
    if (organic) params.set('organic', 'true');
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort) params.set('sort', sort);
    
    api.get(`/listings?${params}`, token)
      .then(({ listings }) => setListings(listings))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => {
        setLoading(false);
        setInitialLoad(false);
      });
  }

  // Debounced load
  useEffect(() => {
    const t = setTimeout(load, 500);
    return () => clearTimeout(t);
  }, [q, category, region, organic, minPrice, maxPrice, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} 
            animate={{ opacity: 1, y: 0, x: '-50%' }} 
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md border ${
              toast.type === 'error' ? 'bg-error/20 border-error/30 text-error' : 
              toast.type === 'info' ? 'bg-white/10 border-white/20 text-white' : 
              'bg-emerald/20 border-emerald/30 text-emerald'
            }`}
          >
            {toast.type === 'success' && <Check size={16} />}
            <span className="text-sm font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald mb-3">The Marketplace</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl mb-4 font-display">
            Premium produce, direct from farms.
          </h1>
          <p className="text-lg leading-relaxed text-muted">
            Discover fresh harvests across Ghana with full traceability, secure escrow, and verified quality.
          </p>
        </div>
        
        {/* Mobile Filter Toggle */}
        <div className="md:hidden">
          <Button variant="secondary" className="w-full justify-center" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <AnimatePresence>
          {(showFilters || window.innerWidth >= 1024) && (
            <motion.aside 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:w-72 shrink-0 flex flex-col gap-6"
            >
              <div className="glass-card rounded-[28px] p-6 border-white/5 sticky top-24">
                
                {/* Search */}
                <div className="mb-6">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 block">Search</label>
                  <div className="glass-input flex items-center gap-3 rounded-2xl px-4 py-3">
                    <Search size={16} className="text-muted" />
                    <input 
                      value={q} 
                      onChange={e => setQ(e.target.value)} 
                      placeholder="Crop, farm, location..." 
                      className="flex-1 bg-transparent border-none text-sm text-white outline-none w-full" 
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 block flex items-center gap-2">
                    <ArrowUpDown size={14}/> Sort By
                  </label>
                  <select 
                    value={sort} 
                    onChange={e => setSort(e.target.value)} 
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-white appearance-none"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                <div className="h-px bg-white/10 my-6" />

                {/* Categories */}
                <div className="mb-6">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button 
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition duration-300 border ${
                          category === c 
                            ? 'bg-emerald text-black border-emerald shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                            : 'bg-white/5 text-muted border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Region */}
                <div className="mb-6">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 block">Region</label>
                  <select 
                    value={region} 
                    onChange={e => setRegion(e.target.value)} 
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-white appearance-none"
                  >
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 block">Price Range (GHS)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white text-center" 
                    />
                    <span className="text-muted">-</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white text-center" 
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-10 h-6 rounded-full transition-colors duration-300 relative ${organic ? 'bg-emerald' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${organic ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-emerald transition-colors">Organic Only</span>
                    <input type="checkbox" className="hidden" checked={organic} onChange={e => setOrganic(e.target.checked)} />
                  </label>
                </div>

              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <main className="flex-1">
          {/* Results Summary */}
          {!initialLoad && (
            <div className="flex items-center justify-between mb-6 text-sm text-muted">
              <span>Showing <strong className="text-white">{listings.length}</strong> listings</span>
              {loading && <Spinner className="w-4 h-4" />}
            </div>
          )}

          {initialLoad ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState 
              title="No produce found" 
              subtitle="We couldn't find any listings matching your specific criteria. Try broadening your filters." 
              action={<Button variant="ghost" onClick={() => { setQ(''); setCategory('All'); setRegion('All'); setOrganic(false); setMinPrice(''); setMaxPrice(''); }}>Clear all filters</Button>}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {listings.map((l, i) => (
                  <motion.div 
                    key={l.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }} 
                    className="glass-card flex flex-col rounded-[32px] overflow-hidden border border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.2)] group cursor-pointer"
                    onClick={() => setQuickView(l)}
                  >
                    {/* Image Box */}
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                      <img 
                        src={l.image_url || IMAGES[l.crop_name] || '/produce-fallback.svg'} 
                        alt={l.crop_name} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                          {l.organic === 1 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/20 border border-emerald/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald backdrop-blur-md">
                              <ShieldCheck size={12} /> Organic
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                            {l.category}
                          </span>
                        </div>
                        
                        <button 
                          onClick={(e) => toggleFavorite(l.id, e)}
                          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 transition hover:bg-white/20 hover:scale-110"
                        >
                          <Heart size={16} className={favorites.has(l.id) ? 'fill-error text-error' : ''} />
                        </button>
                      </div>

                      {/* Bottom Image Info */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-white drop-shadow-md font-display">{l.crop_name}</h2>
                          <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
                            <MapPin size={12} className="text-emerald" /> {l.farmer_region}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Box */}
                    <div className="p-6 flex flex-col flex-1 gap-4">
                      
                      {/* Farmer info */}
                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald to-emerald-dark flex items-center justify-center text-black font-bold text-xs uppercase">
                            {l.farmer_name.charAt(0)}
                          </div>
                          <span className="truncate max-w-[120px]">{l.farmer_name}</span>
                          {l.farmer_verified === 1 && <ShieldCheck size={14} className="text-emerald shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1 text-gold-400 text-xs font-semibold">
                          <Star size={12} className="fill-gold-400" />
                          {l.farmer_rating > 0 ? l.farmer_rating.toFixed(1) : 'New'}
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="glass-input rounded-2xl p-3 flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-widest text-muted">Available</span>
                          <span className="text-sm font-semibold text-white">{l.available_quantity} <span className="text-muted text-xs">{l.unit}</span></span>
                        </div>
                        <div className="glass-input rounded-2xl p-3 flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-widest text-muted">Harvested</span>
                          <span className="text-sm font-semibold text-white flex items-center gap-1">
                            <Clock size={12} className="text-emerald"/> 
                            {l.harvest_date ? new Date(l.harvest_date).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Fresh'}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Price & Action */}
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted mb-0.5">Price</p>
                          <p className="text-2xl font-bold text-emerald font-display flex items-baseline gap-1">
                            <span className="text-sm font-medium">GHS</span>
                            {l.price_per_unit.toFixed(2)}
                            <span className="text-xs font-medium text-muted">/{l.unit}</span>
                          </p>
                        </div>
                        
                        <Button 
                          onClick={(e) => handleAddToCart(l, e)} 
                          className="rounded-2xl w-12 h-12 p-0 flex items-center justify-center hover:scale-110 shadow-[0_10px_30px_rgba(34,197,94,0.3)]"
                        >
                          <ShoppingCart size={18} />
                        </Button>
                      </div>
                      
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setQuickView(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Image Side */}
              <div className="md:w-1/2 relative bg-white/5 h-64 md:h-auto">
                <img 
                  src={quickView.image_url || IMAGES[quickView.crop_name] || '/produce-fallback.svg'} 
                  alt={quickView.crop_name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/60" />
                <button 
                  onClick={() => setQuickView(null)}
                  className="absolute top-4 right-4 md:hidden w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md"
                >
                  <X size={16} />
                </button>
                {quickView.organic === 1 && (
                  <div className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-full bg-emerald/20 border border-emerald/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald backdrop-blur-md">
                    <ShieldCheck size={16} /> Certified Organic
                  </div>
                )}
              </div>
              
              {/* Info Side */}
              <div className="md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
                <div className="flex justify-between items-start hidden md:flex mb-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald">{quickView.category}</span>
                  <button onClick={() => setQuickView(null)} className="text-muted hover:text-white transition">
                    <X size={24} />
                  </button>
                </div>
                
                <h2 className="text-4xl font-bold text-white font-display mb-2">{quickView.crop_name}</h2>
                <div className="flex items-center gap-3 text-sm text-muted mb-6">
                  <div className="flex items-center gap-1"><MapPin size={14} className="text-emerald"/> {quickView.farmer_region}</div>
                  <span>•</span>
                  <div className="flex items-center gap-1">Listed {new Date(quickView.created_at).toLocaleDateString()}</div>
                </div>

                <p className="text-muted leading-relaxed mb-8">
                  {quickView.description || `Fresh, high-quality ${quickView.crop_name.toLowerCase()} sourced directly from ${quickView.farmer_name}'s farm in the ${quickView.farmer_region} region. Perfect for wholesale distribution or retail.`}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="glass-input rounded-3xl p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-1">Farmer</p>
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      {quickView.farmer_name}
                      {quickView.farmer_verified === 1 && <ShieldCheck size={14} className="text-emerald" />}
                    </p>
                  </div>
                  <div className="glass-input rounded-3xl p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-1">Available Stock</p>
                    <p className="text-sm font-semibold text-white">{quickView.available_quantity} {quickView.unit}</p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted mb-1">Unit Price</p>
                    <p className="text-4xl font-bold text-emerald font-display flex items-baseline gap-1">
                      <span className="text-lg font-medium">GHS</span>
                      {quickView.price_per_unit.toFixed(2)}
                      <span className="text-sm font-medium text-muted">/{quickView.unit}</span>
                    </p>
                  </div>
                  <Button 
                    onClick={(e) => handleAddToCart(quickView, e)}
                    className="w-full sm:w-auto px-8 py-4 rounded-full text-base flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(34,197,94,0.3)] hover:scale-105"
                  >
                    <ShoppingCart size={20} />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
