'use client';

import Image from 'next/image';
import { Restaurant } from '@/types';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

export function RestaurantModal({ restaurant, onClose }: { restaurant: Restaurant | null; onClose: () => void }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = restaurant?.photos ?? [];
  const current = photos[photoIdx];
  const photoUrl = current ? `/api/google-photo?ref=${encodeURIComponent(current.photoReference)}&w=800` : null;

  if (!restaurant) return null;

  const openNowText = restaurant.openNow == null ? '—' : restaurant.openNow ? 'Open now' : 'Closed';
  const priceText = restaurant.subratings?.price ? `$${Math.round(restaurant.subratings.price)}` : restaurant.priceLevel != null ? '$'.repeat(Math.max(1, restaurant.priceLevel)) : '—';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 w-full max-w-3xl max-h-[90vh] overflow-auto rounded shadow" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
          <div className="text-lg font-semibold">{restaurant.name}</div>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="text-sm">AI Rating: <span className="font-semibold">{restaurant.aiRating?.toFixed(1) ?? '—'}</span> · Google Reviews: <span className="font-semibold">{restaurant.googleUserRatingsTotal ?? '—'}</span> · {openNowText} · Price: <span className="font-semibold">{priceText}</span></div>

          <div className="flex gap-3 text-sm">
            {restaurant.website && <a className="underline" href={restaurant.website} target="_blank" rel="noreferrer">Website</a>}
            <a className="underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${restaurant.placeId}`} target="_blank" rel="noreferrer">Location</a>
            <a className="underline" href={`https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' menu')}`} target="_blank" rel="noreferrer">Menus</a>
            <a className="underline" href={`https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' reservation')}`} target="_blank" rel="noreferrer">Reserve</a>
          </div>

          {photoUrl && (
            <div className="relative w-full h-64 bg-neutral-100 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt={restaurant.name} className="object-cover w-full h-full" />
            </div>
          )}
          {photos.length > 1 && (
            <div className="flex items-center justify-between text-xs">
              <button className="underline" onClick={() => setPhotoIdx((p) => (p - 1 + photos.length) % photos.length)}>Prev</button>
              <div>{photoIdx + 1} / {photos.length}</div>
              <button className="underline" onClick={() => setPhotoIdx((p) => (p + 1) % photos.length)}>Next</button>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <AdjectiveSummary title="Environment" items={restaurant.adjectives?.environment ?? []} />
            <AdjectiveSummary title="Food" items={restaurant.adjectives?.food ?? []} />
            <AdjectiveSummary title="Service" items={restaurant.adjectives?.service ?? []} />
          </div>

          <div className="text-sm">
            <div className="font-semibold mb-1">What You Should be Aware</div>
            <div>{generateAwarenessText(restaurant)}</div>
          </div>

          <div className="text-sm">
            <div className="font-semibold mb-1">Must-Try Dish</div>
            <div>{suggestMustTry(restaurant)}</div>
          </div>

          <div className="text-sm">
            <div className="font-semibold mb-1">Open Hours</div>
            <div className="whitespace-pre-wrap">{restaurant.openingHours?.join('\n') ?? '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjectiveSummary({ title, items }: { title: string; items: Array<{ adjective: string; count: number }> }) {
  if (!items?.length) return (
    <div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-neutral-500">No sufficient data</div>
    </div>
  );
  const parts = items.slice(0, 4).map((i) => `${i.count} people say "${i.adjective}"`);
  return (
    <div>
      <div className="font-semibold mb-1">{title}</div>
      <div>{parts.join(', ')}.</div>
    </div>
  );
}

function generateAwarenessText(r: Restaurant) {
  const hints: string[] = [];
  if (r.openNow === false) hints.push('May be closed at the moment; check hours before visiting.');
  if ((r.priceLevel ?? 0) >= 4) hints.push('Expect higher prices; plan your budget accordingly.');
  if ((r.googleUserRatingsTotal ?? 0) < 20) hints.push('Limited number of reviews; consider recent comments.');
  if (!hints.length) hints.push('Consider peak times and availability; reservations may help.');
  return hints.join(' ');
}

function suggestMustTry(r: Restaurant) {
  const name = r.name.toLowerCase();
  if (name.includes('pizza')) return 'Neapolitan-style margherita';
  if (name.includes('sushi')) return 'Omakase nigiri set';
  if (name.includes('bbq')) return 'Smoked brisket';
  if (name.includes('taco')) return 'Al pastor tacos';
  return 'Chef-recommended signature dish';
}