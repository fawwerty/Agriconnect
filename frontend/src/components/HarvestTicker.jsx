import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function HarvestTicker() {
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    api.get('/market-prices/latest').then(({ prices }) => setPrices(prices)).catch(() => {});
  }, []);

  if (prices.length === 0) return null;

  // De-dupe to one entry per crop (first region hit) for a clean ticker line, then repeat for seamless loop
  const seen = new Set();
  const unique = prices.filter(p => {
    if (seen.has(p.crop_name)) return false;
    seen.add(p.crop_name);
    return true;
  });
  const loopItems = [...unique, ...unique];

  return (
    <div className="border-y border-white/5 bg-surface/60 overflow-hidden">
      <div className="flex ticker-track w-max py-2.5">
        {loopItems.map((p, i) => (
          <div key={i} className="flex items-center gap-2 px-6 whitespace-nowrap text-sm font-mono border-r border-white/5">
            <span className="text-muted">{p.crop_name}</span>
            <span className="text-ink font-semibold">GHS {p.price_per_unit.toFixed(2)}</span>
            <span className="text-xs text-muted">/{p.unit}</span>
            <span className="text-forest-400">●</span>
          </div>
        ))}
      </div>
    </div>
  );
}
