import { GeoPoint } from './geoCoordinates';

export interface DistanceMatrixLeg {
  fromName: string;
  toName: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  distanceMeters: number;
  distanceKm: number;
  distanceText: string;
  durationSeconds: number;
  durationMinutes: number;
  durationText: string;
  status: string;
  source?: 'google_routes_api' | 'google_maps_service' | 'google_maps_api' | 'geodesic_road_estimate';
}

export interface DistanceMatrixResult {
  legs: DistanceMatrixLeg[];
  totalDistanceKm: number;
  totalDistanceMeters: number;
  formattedTotalDistance: string;
  totalDurationMinutes: number;
  totalDurationSeconds: number;
  formattedTotalDuration: string;
  source: 'google_routes_api' | 'google_maps_service' | 'google_maps_api' | 'hybrid' | 'geodesic_road_estimate';
  mode: 'driving' | 'walking' | 'transit';
  calculatedAt: string;
}

/**
 * Calculates travel distance and duration between consecutive tour locations using:
 * 1. Client-side google.maps.DistanceMatrixService (if window.google.maps is available)
 * 2. Or the backend /api/google-maps/distance-matrix proxy endpoint
 * 3. Fallback to calibrated road routing factor
 */
export async function calculateConsecutiveTourDistanceMatrix(
  locations: GeoPoint[],
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): Promise<DistanceMatrixResult> {
  if (!locations || locations.length < 2) {
    return {
      legs: [],
      totalDistanceKm: 0,
      totalDistanceMeters: 0,
      formattedTotalDistance: '0 km',
      totalDurationMinutes: 0,
      totalDurationSeconds: 0,
      formattedTotalDuration: '0 min',
      source: 'geodesic_road_estimate',
      mode,
      calculatedAt: new Date().toISOString(),
    };
  }

  // Strategy 1: Call modern Google Routes API proxy endpoint
  try {
    const res = await fetch('/api/google-maps/distance-matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: locations.map(loc => ({
          lat: loc.lat,
          lng: loc.lng,
          name: loc.name,
        })),
        mode,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.legs)) {
        return data as DistanceMatrixResult;
      }
    }
  } catch {
    // Fallback to local calculation
  }


  // Strategy 2: Calibrated local road distance calculation
  const fallbackLegs: DistanceMatrixLeg[] = [];
  let totalKm = 0;
  let totalMin = 0;

  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i];
    const to = locations[i + 1];

    const R = 6371;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLon = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = Math.round(R * c * 1.25 * 10) / 10;
    const distMeters = Math.round(distKm * 1000);

    const speed = mode === 'walking' ? 4.5 : mode === 'transit' ? 40 : 55;
    const durMin = Math.max(8, Math.round((distKm / speed) * 60));
    const durSec = durMin * 60;
    const h = Math.floor(durMin / 60);
    const m = durMin % 60;

    fallbackLegs.push({
      fromName: from.name,
      toName: to.name,
      fromCoords: { lat: from.lat, lng: from.lng },
      toCoords: { lat: to.lat, lng: to.lng },
      distanceMeters: distMeters,
      distanceKm: distKm,
      distanceText: `${distKm} km`,
      durationSeconds: durSec,
      durationMinutes: durMin,
      durationText: h > 0 ? `${h} hr ${m} min` : `${m} mins`,
      status: 'OK',
      source: 'geodesic_road_estimate',
    });

    totalKm += distKm;
    totalMin += durMin;
  }

  const roundedTotalKm = Math.round(totalKm * 10) / 10;
  const totH = Math.floor(totalMin / 60);
  const totM = totalMin % 60;

  return {
    legs: fallbackLegs,
    totalDistanceKm: roundedTotalKm,
    totalDistanceMeters: Math.round(roundedTotalKm * 1000),
    formattedTotalDistance: `${roundedTotalKm} km`,
    totalDurationMinutes: totalMin,
    totalDurationSeconds: totalMin * 60,
    formattedTotalDuration: totH > 0 ? `${totH} hr ${totM} min` : `${totM} min`,
    source: 'geodesic_road_estimate',
    mode,
    calculatedAt: new Date().toISOString(),
  };
}
