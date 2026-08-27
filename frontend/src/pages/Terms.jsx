import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui.jsx';

export default function Terms() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="glass-card rounded-[32px] border border-white/10 bg-surface3/80 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
        <p className="text-xs uppercase tracking-[0.32em] text-emerald mb-3">Terms of service</p>
        <h1 className="text-4xl font-semibold text-white mb-6">Professional terms for AgriConnect users.</h1>
        <p className="text-base leading-8 text-muted mb-6">By using the platform, buyers, farmers, and partners agree to comply with our order, payment, and transport rules. This helps ensure fair pricing, reliable delivery, and a trustworthy marketplace.</p>
        <div className="space-y-4 text-sm text-muted leading-7">
          <p><strong className="text-white">Order commitments:</strong> Orders are binding once accepted by the seller. Payment is held in escrow until delivery confirmation.</p>
          <p><strong className="text-white">Account behavior:</strong> Users must provide accurate crop, pricing, and delivery information.</p>
          <p><strong className="text-white">Support:</strong> Disputes and delivery issues are handled through our support channel.</p>
        </div>
        <div className="mt-10">
          <Button as={Link} to="/" variant="secondary">Back to home</Button>
        </div>
      </div>
    </div>
  );
}
