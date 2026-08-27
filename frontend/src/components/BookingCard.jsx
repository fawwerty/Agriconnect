import React from 'react';
import { Button, StatusBadge } from '../components/ui.jsx';
import MapPreview from './MapPreview.jsx';

export default function BookingCard({ booking, onStatusChange }) {
  const { id, order_id, pickup_location, dropoff_location, status, driver_name, vehicle_type } = booking;

  const handleClick = (newStatus) => {
    if (newStatus !== status) {
      onStatusChange(id, newStatus);
    }
  };

  return (
    <div className="glass-card rounded-[32px] p-6 flex flex-col justify-between border border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald mb-1">Order #{order_id}</p>
            <h3 className="text-lg font-semibold text-white font-display">{driver_name || 'Unassigned'} ({vehicle_type || 'N/A'})</h3>
          </div>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-muted mb-4">From: {pickup_location}<br/>To: {dropoff_location}</p>
        <MapPreview pickupLocation={pickup_location} dropoffLocation={dropoff_location} />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mt-4">
        <Button variant="secondary" onClick={() => handleClick('in_transit')} disabled={status !== 'assigned'}>In Transit</Button>
        <Button variant="primary" onClick={() => handleClick('delivered')} disabled={status !== 'in_transit'}>Delivered</Button>
      </div>
    </div>
  );
}
