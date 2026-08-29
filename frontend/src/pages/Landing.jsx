import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, Sparkles, Leaf, Globe, Smartphone } from 'lucide-react';
import HarvestTicker from '../components/HarvestTicker.jsx';
import { WovenDivider, Button } from '../components/ui.jsx';


const FEATURES = [
  {
    title: 'Direct farm gate access',
    body: 'Verified Ghanaian farmers list fresh produce, buyers source quality goods without middlemen, and every order is traceable.',
    icon: <Leaf size={24} className="text-emerald" />,
  },
  {
    title: 'Escrow-grade trust',
    body: 'Buyer funds stay secure until delivery is confirmed, giving both farmers and buyers the confidence to trade at scale.',
    icon: <ShieldCheck size={24} className="text-gold-400" />,
  },
  {
    title: 'Live price intelligence',
    body: 'Market data, trends and crop forecasts surface the best deal for every harvest in real time across all Ghanaian regions.',
    icon: <Globe size={24} className="text-blue-accent" />,
  },
  {
    title: 'Smart logistics',
    body: 'Order transport directly inside the platform — pickup, delivery and tracking synchronized with your sale.',
    icon: <Truck size={24} className="text-emerald" />,
  },
  {
    title: 'Local Mobile Money payments',
    body: 'Pay securely with MTN MoMo, Telecel Cash, AirtelTigo Money, GhIPSS Instant Pay, or Cash on Delivery — no international payment methods required.',
    icon: <Smartphone size={24} className="text-yellow-400" />,
  },
];


const STEPS = [
  { n: '01', title: 'List your harvest', body: 'Capture crop, quantity, price, region and organic status in a premium listing.' },
  { n: '02', title: 'Buy directly', body: 'Buyers browse curated produce cards, reserve stock, and pay via MTN MoMo, Telecel Cash, AirtelTigo Money, GhIPSS or Cash on Delivery.' },
  { n: '03', title: 'Move it fast', body: 'Transport gets booked from the same order, with verified carriers and status updates.' },
  { n: '04', title: 'Release payment', body: 'Delivery confirmed, Mobile Money escrow released instantly — fair settlement for every harvest.' },
];


const heroImages = [
  'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1600&q=80',
];


export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImages[0]} alt="Aerial view of Ghana farmland" loading="lazy" className="h-full w-full object-cover opacity-90" />
          <div className="hero-overlay" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-6 py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-white mb-3">
              Premium agriculture commerce for Ghana
            </p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Connecting Ghana’s farmers to better markets.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Helping farmers sell smarter, earn more, and reach buyers directly through technology. Explore a marketplace built for trust, speed, and sustainable growth.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button as={Link} to="/register" className="btn-float" variant="primary">
                Start selling
              </Button>
              <Button as={Link} to="/marketplace" className="btn-float" variant="secondary">
                Browse marketplace
              </Button>
            </div>
          </motion.div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity }} className="floating-card rounded-[32px] border-white/10 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-muted mb-3">From the field</p>
              <p className="text-2xl font-semibold">GHS 4.2M+</p>
              <p className="mt-3 text-sm text-muted leading-6">Volume of produce traded through the platform this season.</p>
            </motion.div>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 0.3 }} className="floating-card rounded-[32px] border-white/10 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-muted mb-3">Trusted marketplace</p>
              <p className="text-2xl font-semibold">1,200+ farmers</p>
              <p className="mt-3 text-sm text-muted leading-6">Verified agricultural businesses across Ghana’s leading regions.</p>
            </motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 0.5 }} className="floating-card rounded-[32px] border-white/10 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-muted mb-3">Local payments</p>
              <p className="text-2xl font-semibold">MoMo · GhIPSS</p>
              <p className="mt-3 text-sm text-muted leading-6">MTN MoMo, Telecel Cash, AirtelTigo & GhIPSS escrow built in.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <HarvestTicker />

      <section className="relative w-full overflow-hidden border-t border-white/5 py-24 px-6">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80" alt="Fresh harvest" loading="lazy" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-xs uppercase tracking-[0.32em] text-white mb-3">Platform highlights</p>
            <h2 className="section-heading text-3xl font-semibold text-white sm:text-4xl">A premium marketplace built for modern agriculture</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {FEATURES.map(feature => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="glass-card rounded-[32px] p-6 bg-black/40 backdrop-blur-md">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10 text-emerald shadow-[0_16px_40px_rgba(34,197,94,0.15)]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-sm leading-7 text-white/70">{feature.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full overflow-hidden border-t border-white/5 py-24 px-6">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=1600&q=80" alt="Agriculture technology" loading="lazy" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/70" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white mb-3">How it works</p>
              <h2 className="section-heading text-3xl font-semibold text-white sm:text-4xl">From planting to payout, every step is designed for clarity.</h2>
              <p className="mt-5 text-base leading-8 text-white/80 max-w-2xl">The AgriConnect workflow brings listing, ordering, transport booking, payments and performance insights into one premium experience.</p>
            </div>
            <div className="grid gap-4">
              {STEPS.map(step => (
                <motion.div key={step.n} className="glass-card rounded-[32px] p-6 bg-black/40 backdrop-blur-md" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald text-black font-semibold">{step.n}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm text-white/70 leading-7">{step.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full px-6 py-32 text-center overflow-hidden border-t border-white/5">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80" alt="Farmer in field" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/60" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.32em] text-white mb-3">Marketplace ready</p>
          <h2 className="section-heading text-3xl font-semibold text-white sm:text-4xl">Launch your first listing in minutes.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/80">Whether you are a farmer, buyer or transporter, the interface keeps every action easy and elegant.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button as={Link} to="/register" variant="primary" className="btn-float">Get started</Button>
            <Button as={Link} to="/login" variant="secondary" className="btn-float">Sign in</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/80">
        <WovenDivider />
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between text-sm text-muted">
          <div>
            <p className="font-semibold text-white">AgriConnect Ghana</p>
            <p className="mt-2 text-muted">A premium marketplace prototype for Ghanaian agriculture.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="text-muted hover:text-white">Privacy</Link>
            <Link to="/terms" className="text-muted hover:text-white">Terms</Link>
            <Link to="/support" className="text-muted hover:text-white">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
