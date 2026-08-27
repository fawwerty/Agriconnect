import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Helper to convert location string "lat,lon" to [lat, lon] array
const parseLocation = (loc) => {
  if (!loc) return null;
  const parts = loc.split(',').map(p => parseFloat(p.trim()));
  return parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? parts : null;
};

export default function MapPreview({ pickupLocation, dropoffLocation }) {
  const start = parseLocation(pickupLocation);
  const end = parseLocation(dropoffLocation);

  if (!start || !end) {
    return <div className="text-sm text-muted">Location data unavailable</div>;
  }

  const positions = [start, end];

  return (
    <MapContainer center={start} zoom={12} style={{ height: '200px', width: '100%' }} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} boxZoom={false} keyboard={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={start} />
      <Marker position={end} />
      <Polyline positions={positions} pathOptions={{ color: 'emerald', weight: 3 }} />
    </MapContainer>
  );
}
