import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Spinner, StatCard, WovenDivider } from '../components/ui.jsx';
import { ShieldCheck, Users, Activity } from 'lucide-react';

const PIE_COLORS = ['#E8B355', '#3F8E4F', '#B9613C', '#5FAE6E', '#D99B2B', '#7EC8E3'];

export default function AdminOverview() {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);
  const [byCrop, setByCrop] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/overview', token),
      api.get('/admin/orders-timeseries', token),
      api.get('/admin/revenue-by-crop', token),
    ]).then(([o, s, c]) => {
      setOverview(o);
      setSeries(s.series);
      setByCrop(c.rows);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading || !overview) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="dashboard-page-bg relative mx-auto max-w-7xl px-6 py-10 space-y-10">
      <div className="rounded-[32px] border border-white/10 bg-surface3/80 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.32em] text-white mb-3">Admin console</p>
          <h1 className="text-4xl font-semibold text-white">A premium command center for AgriConnect leaders.</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted">Review top-level health, manage listings, and monitor platform flows from one polished dashboard.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-card rounded-[28px] p-6">
            <div className="flex items-center gap-3 text-emerald mb-4"><ShieldCheck size={20} /> Trust</div>
            <p className="text-3xl font-semibold text-white">{overview.platformTrust || '99.8%'}</p>
            <p className="mt-3 text-sm text-muted">Verified transactions and secure escrow flow.</p>
          </div>
          <div className="glass-card rounded-[28px] p-6">
            <div className="flex items-center gap-3 text-gold-400 mb-4"><Activity size={20} /> Volume</div>
            <p className="text-3xl font-semibold text-white">{overview.totalListings ?? 0}</p>
            <p className="mt-3 text-sm text-muted">Active listings and buyer demand.</p>
          </div>
          <div className="glass-card rounded-[28px] p-6">
            <div className="flex items-center gap-3 text-blue-accent mb-4"><Users size={20} /> Participants</div>
            <p className="text-3xl font-semibold text-white">{overview.totalUsers}</p>
            <p className="mt-3 text-sm text-muted">Growth across farmers, buyers, and transport partners.</p>
          </div>
        </div>
      </div>

      <WovenDivider />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="glass-card rounded-[32px] border border-white/10 bg-surface3/80 p-6 xl:col-span-2 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <h2 className="text-2xl font-semibold text-white mb-4">Market pulse</h2>
          <p className="text-sm text-muted leading-7">A snapshot of buyer activity, seller supply, and projected revenue trends.</p>
          <div className="mt-6 grid gap-4">
            <StatCard label="Gross merchandise value" value={`GHS ${overview.gmv.toLocaleString()}`} accent="gold" />
            <StatCard label="Commission revenue" value={`GHS ${overview.commissionRevenue.toLocaleString()}`} accent="gold" />
          </div>
        </div>

        <div className="glass-card rounded-[32px] border border-white/10 bg-surface3/80 p-6 xl:col-span-3 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <h2 className="text-2xl font-semibold text-white mb-4">Orders over time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#9FB3A4" fontSize={11} tickFormatter={day => day.slice(5)} />
                <YAxis stroke="#9FB3A4" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#152A1D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#9FB3A4' }} />
                <Line type="monotone" dataKey="orders" stroke="#E8B355" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-[32px] border border-white/10 bg-surface3/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <h2 className="text-2xl font-semibold text-white mb-4">Revenue share</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCrop} dataKey="revenue" nameKey="crop" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {byCrop.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#152A1D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13 }} formatter={value => `GHS ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-[32px] border border-white/10 bg-surface3/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <h2 className="text-2xl font-semibold text-white mb-4">Orders by crop</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCrop} margin={{ right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="crop" stroke="#9FB3A4" fontSize={12} />
                <YAxis stroke="#9FB3A4" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#152A1D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="orders" fill="#3F8E4F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
