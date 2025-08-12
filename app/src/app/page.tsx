"use client";

import { useEffect, useMemo, useState } from 'react';
import { ChatBox } from '@/components/ChatBox';
import { FilterBar, Filters } from '@/components/FilterBar';
import { RestaurantMap } from '@/components/Map';
import { LatLng, Restaurant, SearchRestaurantsResponse } from '@/types';

export default function Home() {
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [center, setCenter] = useState<LatLng>({ lat: 37.7749, lng: -122.4194 });
  const [reasoning, setReasoning] = useState<string | undefined>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [filters, setFilters] = useState<Filters>({ environment: 1, foodQuality: 1, service: 1, priceMax: 200, googleRating: 1, aiRating: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(coords);
          setCenter(coords);
        },
        () => {
          // ignore errors; keep default center
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
      );
    }
  }, []);

  async function handleSubmit(query: string) {
    if (!userLoc) return;
    setLoading(true);
    try {
      const res = await fetch('/api/restaurants', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, location: userLoc }) });
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as SearchRestaurantsResponse;
      setReasoning(data.analysis.reasoningSummary);
      setRestaurants(data.restaurants);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const env = r.subratings?.environment ?? 5;
      const food = r.subratings?.foodQuality ?? 5;
      const serv = r.subratings?.service ?? 5;
      const price = r.subratings?.price ?? (r.priceLevel ? r.priceLevel * 15 : 0);
      const gr = r.googleRating ?? 0;
      const ai = r.aiRating ?? 0;
      return (
        env >= filters.environment &&
        food >= filters.foodQuality &&
        serv >= filters.service &&
        price <= filters.priceMax &&
        gr >= filters.googleRating &&
        ai >= filters.aiRating
      );
    });
  }, [restaurants, filters]);

  const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4">
        <ChatBox onSubmit={handleSubmit} reasoning={reasoning} />
      </div>
      <FilterBar filters={filters} setFilters={setFilters} />
      <div className="flex-1">
        <RestaurantMap center={center} userLocation={userLoc} restaurants={filtered} onSelect={setSelected} tileUrl={tileUrl} />
      </div>
      {selected && (
        // Lazy import in real app; inline simple modal
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-neutral-900 w-full max-w-3xl max-h-[90vh] overflow-auto rounded shadow" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
              <button onClick={() => setSelected(null)} aria-label="Back" className="text-sm">←</button>
              <div className="text-lg font-semibold">{selected.name}</div>
              <div />
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="text-sm">AI Rating: <span className="font-semibold">{selected.aiRating?.toFixed(1) ?? '—'}</span> · Google Reviews: <span className="font-semibold">{selected.googleUserRatingsTotal ?? '—'}</span> · {selected.openNow == null ? '—' : selected.openNow ? 'Open now' : 'Closed'} · Price: <span className="font-semibold">{selected.subratings?.price ? `$${Math.round(selected.subratings.price)}` : selected.priceLevel != null ? '$'.repeat(Math.max(1, selected.priceLevel)) : '—'}</span></div>
              <div className="flex gap-3 text-sm">
                {selected.website && <a className="underline" href={selected.website} target="_blank" rel="noreferrer">Website</a>}
                <a className="underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name)}&query_place_id=${selected.placeId}`} target="_blank" rel="noreferrer">Location</a>
                <a className="underline" href={`https://www.google.com/search?q=${encodeURIComponent(selected.name + ' menu')}`} target="_blank" rel="noreferrer">Menus</a>
                <a className="underline" href={`https://www.google.com/search?q=${encodeURIComponent(selected.name + ' reservation')}`} target="_blank" rel="noreferrer">Reserve</a>
              </div>
              {/* photos */}
              {selected.photos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/google-photo?ref=${encodeURIComponent(selected.photos[0].photoReference)}&w=800`} alt={selected.name} className="object-cover w-full h-64 rounded" />
              )}
              {/* adjective summaries */}
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-semibold mb-1">Environment</div>
                  <div>{(selected.adjectives?.environment ?? []).slice(0,4).map((i) => `${i.count} people say "${i.adjective}"`).join(', ') || '—'}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Food</div>
                  <div>{(selected.adjectives?.food ?? []).slice(0,4).map((i) => `${i.count} people say "${i.adjective}"`).join(', ') || '—'}</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Service</div>
                  <div>{(selected.adjectives?.service ?? []).slice(0,4).map((i) => `${i.count} people say "${i.adjective}"`).join(', ') || '—'}</div>
                </div>
              </div>
              {/* awareness */}
              <div className="text-sm">
                <div className="font-semibold mb-1">What You Should be Aware</div>
                <div>{generateAwarenessText(selected)}</div>
              </div>
              {/* must-try */}
              <div className="text-sm">
                <div className="font-semibold mb-1">Must-Try Dish</div>
                <div>{suggestMustTry(selected)}</div>
              </div>
              {/* open hours */}
              <div className="text-sm">
                <div className="font-semibold mb-1">Open Hours</div>
                <div className="whitespace-pre-wrap">{selected.openingHours?.join('\n') ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded shadow text-sm">Analyzing nearby restaurants…</div>
      )}
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
