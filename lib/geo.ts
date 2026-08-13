// Distance helpers: geocode a US ZIP and compute haversine miles.

import type { TrialLocation } from "./types";

export interface LatLon {
  lat: number;
  lon: number;
}

const EARTH_RADIUS_MILES = 3958.8;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in miles between two points. */
export function haversineMiles(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Given the patient origin and a trial's sites, return the nearest site and
 * its distance. Sites without geo coordinates are ignored. Returns nulls when
 * nothing is computable (no origin, or no site has coordinates).
 */
export function nearestSite(
  origin: LatLon | null,
  locations: TrialLocation[],
): { location: TrialLocation | null; distanceMiles: number | null } {
  if (!origin || !Array.isArray(locations) || locations.length === 0) {
    return { location: null, distanceMiles: null };
  }

  let best: TrialLocation | null = null;
  let bestDist = Infinity;
  for (const loc of locations) {
    if (typeof loc.lat !== "number" || typeof loc.lon !== "number") continue;
    const d = haversineMiles(origin, { lat: loc.lat, lon: loc.lon });
    if (d < bestDist) {
      bestDist = d;
      best = loc;
    }
  }

  if (!best) return { location: null, distanceMiles: null };
  return { location: best, distanceMiles: bestDist };
}

/**
 * Geocode a US ZIP to lat/lon using the free, no-auth zippopotam.us service.
 * Returns null on any failure so callers can degrade gracefully.
 */
export async function geocodeZip(zip: string): Promise<LatLon | null> {
  const clean = (zip || "").trim().slice(0, 5);
  if (!/^\d{5}$/.test(clean)) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${clean}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      places?: { latitude?: string; longitude?: string }[];
    };
    const place = data?.places?.[0];
    if (!place?.latitude || !place?.longitude) return null;
    const lat = parseFloat(place.latitude);
    const lon = parseFloat(place.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}
