import { NextRequest } from 'next/server';
import { analyzeRequirement, scoreRestaurantsAgainstRequirement } from '@/lib/ai';
import { nearbySearchRestaurants, placeDetails, textSearchRestaurants } from '@/lib/google';
import { Restaurant, SearchRestaurantsRequest, SearchRestaurantsResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SearchRestaurantsRequest;
    const { query, location } = body;

    const analysis = await analyzeRequirement(query);

    const keyword = (analysis.extractedConstraints.keywords ?? []).slice(0, 5).join(' ');

    const [nearby, text] = await Promise.all([
      nearbySearchRestaurants(location, keyword || undefined),
      textSearchRestaurants(query, location),
    ]);

    const merged: Array<{ place_id: string }> = [];
    const seen = new Set<string>();
    for (const r of (nearby.results ?? [])) {
      if (!seen.has(r.place_id)) {
        seen.add(r.place_id);
        merged.push({ place_id: r.place_id });
      }
    }
    for (const r of (text.results ?? [])) {
      if (!seen.has(r.place_id)) {
        seen.add(r.place_id);
        merged.push({ place_id: r.place_id });
      }
    }

    const top = merged.slice(0, 20);

    const detailResults = await Promise.all(
      top.map(async ({ place_id }) => {
        const d = await placeDetails(place_id);
        return d?.result;
      }),
    );

    const candidates: Restaurant[] = detailResults
      .filter(Boolean)
      .map((r: any) => {
        const photos = Array.isArray(r.photos)
          ? r.photos.map((p: any) => ({ photoReference: p.photo_reference, width: p.width, height: p.height }))
          : [];
        const openingHours: string[] | null = r.opening_hours?.weekday_text ?? null;
        const reviews = Array.isArray(r.reviews)
          ? r.reviews.map((rv: any) => ({ authorName: rv.author_name, rating: rv.rating, text: rv.text, time: rv.relative_time_description, language: rv.language }))
          : [];
        const c: Restaurant = {
          placeId: r.place_id,
          name: r.name,
          location: { lat: r.geometry?.location?.lat ?? 0, lng: r.geometry?.location?.lng ?? 0 },
          address: r.formatted_address,
          website: r.website ?? null,
          openNow: r.opening_hours?.open_now ?? null,
          openingHours,
          priceLevel: r.price_level ?? null,
          googleRating: r.rating ?? null,
          googleUserRatingsTotal: r.user_ratings_total ?? null,
          photos,
          reviews,
          aiRating: null,
          subratings: null,
          adjectives: null,
        };
        return c;
      });

    const scored = await scoreRestaurantsAgainstRequirement(analysis, candidates);

    const payload: SearchRestaurantsResponse = {
      analysis,
      restaurants: scored,
    };

    return new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), { status: 500 });
  }
}