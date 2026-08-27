import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import BookingCard from '../components/BookingCard.jsx';
import { EmptyState, Spinner } from '../components/ui.jsx';

export default function TransportDashboard() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({ region: '', base_location: '' });
  const [editingProfile, setEditingProfile] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/transport/my', token)
      .then(res => setBookings(res.bookings || []))
      .catch(err => console.error('Failed to load transport bookings', err))
      .finally(() => setLoading(false));

    api.get('/auth/me', token)
      .then(res => {
        if (res.profile) {
          setProfile({ region: res.profile.region || '', base_location: res.profile.base_location || '' });
        }
      })
      .catch(console.error);
  };

  useEffect(load, [token]);

  const handleStatusUpdate = (id, status) => {
    api.patch(`/transport/${id}`, { status }, token)
      .then(() => {
        setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
      })
      .catch(err => alert('Failed to update status: ' + err.message));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/transport/profile', profile, token);
      setEditingProfile(false);
      alert('Profile updated');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="dashboard-page-bg mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white font-display">Transport Dashboard</h1>
        <button onClick={() => setEditingProfile(!editingProfile)} className="text-sm text-emerald border border-emerald px-4 py-2 rounded-full hover:bg-emerald/10">
          {editingProfile ? 'Cancel' : 'Edit Operating Areas'}
        </button>
      </div>

      {editingProfile && (
        <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">Operating Locations</h2>
          <form onSubmit={handleProfileUpdate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Region</label>
              <input value={profile.region} onChange={e => setProfile({ ...profile, region: e.target.value })} className="glass-input w-full rounded-xl px-4 py-3 text-white" placeholder="e.g. Ashanti" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Base Location / City</label>
              <input value={profile.base_location} onChange={e => setProfile({ ...profile, base_location: e.target.value })} className="glass-input w-full rounded-xl px-4 py-3 text-white" placeholder="e.g. Kumasi Central" />
            </div>
            <button type="submit" className="bg-emerald text-white px-6 py-3 rounded-xl font-bold">Save</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings" subtitle="You have no assigned transport bookings at the moment." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map(b => (
            <BookingCard key={b.id} booking={b} onStatusChange={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
