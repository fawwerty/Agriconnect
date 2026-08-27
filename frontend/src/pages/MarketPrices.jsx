import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../api.js';
import { Spinner, StatCard } from '../components/ui.jsx';

const LINE_COLORS = ['#E8B355', '#5FAE6E', '#B9613C', '#7EC8E3'];

export default function MarketPrices() {
  const [crops, setCrops] = useState([]);
  const [regions, setRegions] = useState([]);
  const [crop, setCrop] = useState('');
  const [region, setRegion] = useState('');
  const [trend, setTrend] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/market-prices/crops'), api.get('/market-prices/regions'), api.get('/market-prices/latest')])
      .then(([c, r, l]) => {
        setCrops(c.crops);
        setRegions(r.regions);
        setCrop(c.crops[0] || '');
        setLatest(l.prices);
      }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!crop) return;
    const params = new URLSearchParams({ crop, days: '30' });
    if (region) params.set('region', region);
    api.get(`/market-prices/trend?${params}`).then(({ trend }) => setTrend(trend));
  }, [crop, region]);

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  const regionsToShow = region ? [region] : [...new Set(trend.map(t => t.region))].slice(0, 4);
  const dates = [...new Set(trend.map(t => t.date))].sort();
  const chartData = dates.map(date => {
    const row = { date: date.slice(5) };
    for (const r of regionsToShow) {
      const point = trend.find(t => t.date === date && t.region === r);
      if (point) row[r] = point.price_per_unit;
    }
    return row;
  });

  const grouped = latest.reduce((acc, item) => {
    acc[item.crop_name] = acc[item.crop_name] || [];
    acc[item.crop_name].push(item);
    return acc;
  }, {});

  const totalRegions = regionsToShow.length;
  const primaryCrop = crop || 'Crop market';

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-ink">Market Prices</h1>
        <p className="text-muted text-sm">Daily prices by crop and region, tracked over the last 30 days.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Selected crop" value={primaryCrop} accent="gold" />
        <StatCard label="Regions shown" value={totalRegions} accent="emerald" />
        <StatCard label="Tracked crops" value={crops.length} accent="blue-accent" />
        <StatCard label="Current quotes" value={latest.length} accent="muted" />
      </div>

      <div className="glass-card rounded-[32px] border border-white/10 bg-surface3/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-muted mb-2">Price trend</p>
            <h2 className="text-2xl font-semibold text-white">{crop ? `${crop} price curve` : 'Regional price curve'}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={crop} onChange={e => setCrop(e.target.value)}
              className="rounded-2xl border border-white/10 bg-canvas px-4 py-2 text-sm text-ink focus:border-gold-500/50 focus:outline-none">
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="rounded-2xl border border-white/10 bg-canvas px-4 py-2 text-sm text-ink focus:border-gold-500/50 focus:outline-none">
              <option value="">All regions (top 4)</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#9FB3A4" fontSize={12} />
              <YAxis stroke="#9FB3A4" fontSize={12} tickFormatter={v => `${v}`} />
              <Tooltip contentStyle={{ background: '#152A1D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: '#9FB3A4' }} formatter={v => [`GHS ${v}`, '']} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9FB3A4' }} />
              {regionsToShow.map((r, i) => (
                <Line key={r} type="monotone" dataKey={r} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-[32px] overflow-hidden border border-white/10 bg-surface3/70 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-display text-lg text-ink">Today's prices by crop</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-white/5">
                <th className="px-5 py-3">Crop</th>
                <th className="px-5 py-3">Regions tracked</th>
                <th className="px-5 py-3 text-right">Lowest</th>
                <th className="px-5 py-3 text-right">Highest</th>
                <th className="px-5 py-3 text-right">Average</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([cropName, rows]) => {
                const prices = rows.map(r => r.price_per_unit);
                const min = Math.min(...prices), max = Math.max(...prices);
                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                return (
                  <tr key={cropName} className="border-b border-white/5 hover:bg-surface/40">
                    <td className="px-5 py-3 text-ink font-medium">{cropName}</td>
                    <td className="px-5 py-3 text-muted">{rows.length}</td>
                    <td className="px-5 py-3 text-right font-mono text-ink">GHS {min.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-ink">GHS {max.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-gold-400">GHS {avg.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
