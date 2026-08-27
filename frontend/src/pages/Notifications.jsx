import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { Spinner, Button, EmptyState } from '../components/ui.jsx';

export default function Notifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get('/notifications', token)
      .then(({ notifications }) => setNotifications(notifications))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function markAllRead() {
    if (!token) return;
    setMarking(true);
    try {
      await api.post('/notifications/read-all', {}, token);
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="dashboard-page-bg mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-emerald mb-3">Notifications</p>
          <h1 className="text-4xl font-semibold text-white">Platform activity and alerts</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Review your latest order updates, market alerts, and platform messages in one place.</p>
        </div>
        <Button variant="gold" disabled={marking} onClick={markAllRead}>
          {marking ? 'Marking…' : 'Mark all read'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications yet" subtitle="You’ll see updates here as orders move through escrow and transport is booked." />
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div key={notification.id} className={`glass-card rounded-[32px] border border-white/10 p-6 ${notification.read ? 'opacity-80' : 'ring-1 ring-emerald/20'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{notification.message}</p>
                  <p className="mt-2 text-xs text-muted">{new Date(notification.created_at).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em] ${notification.read ? 'bg-white/5 text-muted' : 'bg-emerald/15 text-emerald'}`}>
                  {notification.read ? 'Read' : 'New'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
