'use client';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Restaurant, LatLng } from '@/types';
import { useEffect, useMemo } from 'react';

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
}

function useRatingIcon(rating: number | null | undefined) {
  return useMemo(() => {
    const text = rating ? rating.toFixed(1) : '';
    const html = `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#000;color:#fff;font-size:12px;font-weight:700;border:2px solid #000;">${text}</div>`;
    return L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
  }, [rating]);
}

function RatingMarker({ position, rating, onClick }: { position: LatLng; rating: number | null | undefined; onClick?: () => void }) {
  const icon = useRatingIcon(rating);
  return <Marker position={[position.lat, position.lng]} icon={icon} eventHandlers={{ click: () => onClick && onClick() }} />;
}

export function RestaurantMap({
  center,
  userLocation,
  restaurants,
  onSelect,
  tileUrl,
}: {
  center: LatLng;
  userLocation?: LatLng | null;
  restaurants: Restaurant[];
  onSelect: (r: Restaurant) => void;
  tileUrl: string;
}) {
  return (
    <div className="w-full h-full">
      <MapContainer center={[center.lat, center.lng]} zoom={14} className="w-full h-full" scrollWheelZoom>
        <TileLayer url={tileUrl} />
        <Recenter center={center} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={L.icon({ iconUrl: 'data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMjE5NmZmIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iNiIgZmlsbD0iIzIxOTZmZiIvPjwvc3ZnPg==', iconSize: [24, 24], iconAnchor: [12, 12] })} />
        )}
        {restaurants.map((r) => (
          <RatingMarker key={r.placeId} position={r.location} rating={r.aiRating ?? r.googleRating ?? null} onClick={() => onSelect(r)} />
        ))}
      </MapContainer>
    </div>
  );
}