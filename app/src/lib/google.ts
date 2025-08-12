import axios from 'axios';
import { LatLng } from '@/types';

const GOOGLE_API_BASE = 'https://maps.googleapis.com/maps/api/place';

function getKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY is not set');
  return key;
}

export async function nearbySearchRestaurants(location: LatLng, keyword?: string) {
  const key = getKey();
  const params = new URLSearchParams({
    key,
    location: `${location.lat},${location.lng}`,
    radius: '3000',
    type: 'restaurant',
  });
  if (keyword) params.set('keyword', keyword);

  const { data } = await axios.get(`${GOOGLE_API_BASE}/nearbysearch/json?${params.toString()}`);
  return data as any;
}

export async function textSearchRestaurants(query: string, location: LatLng) {
  const key = getKey();
  const params = new URLSearchParams({
    key,
    query,
    type: 'restaurant',
    location: `${location.lat},${location.lng}`,
    radius: '5000',
  });
  const { data } = await axios.get(`${GOOGLE_API_BASE}/textsearch/json?${params.toString()}`);
  return data as any;
}

export async function placeDetails(placeId: string) {
  const key = getKey();
  const params = new URLSearchParams({
    key,
    place_id: placeId,
    fields: [
      'place_id',
      'name',
      'rating',
      'user_ratings_total',
      'opening_hours',
      'price_level',
      'geometry',
      'photos',
      'website',
      'formatted_address',
      'url',
      'reviews',
    ].join(','),
  });
  const { data } = await axios.get(`${GOOGLE_API_BASE}/details/json?${params.toString()}`);
  return data as any;
}

export function buildPlacePhotoUrl(photoReference: string, maxWidth = 800) {
  const key = getKey();
  const params = new URLSearchParams({
    key,
    maxwidth: String(maxWidth),
    photo_reference: photoReference,
  });
  return `${GOOGLE_API_BASE}/photo?${params.toString()}`;
}