import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui.jsx';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="glass-card rounded-[32px] border border-white/10 bg-surface3/80 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
        <p className="text-xs uppercase tracking-[0.32em] text-emerald mb-3">Privacy policy</p>
        <h1 className="text-4xl font-semibold text-white mb-6">Protecting your data and trust.</h1>
        <p className="text-base leading-8 text-muted mb-6">We collect and store only the information needed to connect farmers, buyers, and transport partners safely. Your profile, order activity, and communication data are used to improve experience and keep every trade secure.</p>
        <div className="space-y-4 text-sm text-muted leading-7">
          <p><strong className="text-white">Data use:</strong> We use your account information, order history, and location data only to power listings, fulfillment, and payment flows.</p>
          <p><strong className="text-white">Data sharing:</strong> Your information is never sold to third parties. We may share details with transport partners only to fulfill orders.</p>
          <p><strong className="text-white">Security:</strong> Platform data is protected with encrypted transport and strict access controls.</p>
        </div>
        <div className="mt-10">
          <Button as={Link} to="/" variant="secondary">Back to home</Button>
        </div>
      </div>
    </div>
  );
}
