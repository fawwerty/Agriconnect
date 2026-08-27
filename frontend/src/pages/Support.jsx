import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui.jsx';

export default function Support() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="glass-card rounded-[32px] border border-white/10 bg-surface3/80 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
        <p className="text-xs uppercase tracking-[0.32em] text-emerald mb-3">Support center</p>
        <h1 className="text-4xl font-semibold text-white mb-6">Need help with your order?</h1>
        <p className="text-base leading-8 text-muted mb-6">Reach us for account support, delivery questions, or listing help. Our team is standing by to help you complete transactions with confidence.</p>
        <div className="space-y-4 text-sm text-muted leading-7">
          <p><strong className="text-white">Email:</strong> support@agriconnect.gh</p>
          <p><strong className="text-white">Phone:</strong> +233 24 123 4567</p>
          <p><strong className="text-white">Office hours:</strong> Mon–Fri, 8:00 AM – 5:00 PM GMT</p>
        </div>
        <div className="mt-10">
          <Button as={Link} to="/" variant="secondary">Back to home</Button>
        </div>
      </div>
    </div>
  );
}
