/// <reference types="@types/google.maps" />
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary 
} from '@vis.gl/react-google-maps';
import { 
  Hotel, MapPin, Navigation, Compass, Layers, Maximize2, 
  Clock, Route as RouteIcon, Car, Plane, Ship, Shield, Check, 
  ExternalLink, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';
import { GeoPoint, RouteLeg, TripRouteOverview, buildTripRouteOverview } from '../../lib/geoCoordinates';
import { DistanceMatrixResult } from '../../lib/distanceMatrix';
import { UILanguage } from '../../types';

// Retrieve Google Maps API key from Vite environment or provided secret
const GOOGLE_MAPS_API_KEY = 
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 
  '';

interface GoogleTripRouteMapProps {
  title?: string;
  waypoints: GeoPoint[];
  uiLang?: UILanguage;
  className?: string;
  height?: string | number;
  initialSelectedPoint?: GeoPoint | null;
  showLegsList?: boolean;
  showStatsBanner?: boolean;
  distanceMatrixResult?: DistanceMatrixResult | null;
  isCalculatingDistance?: boolean;
  onRecalculateDistance?: () => void;
}

// Inner component that handles interactive Google Maps routes & polyline drawing
const RoutePolylineRenderer: React.FC<{
  overview: TripRouteOverview;
  travelMode: 'DRIVING' | 'WALKING';
}> = ({ overview, travelMode }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || overview.waypoints.length < 2) return;

    // Clean up existing polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    // Attempt to compute modern route if routes library is loaded
    if (routesLib && (routesLib as any).Route?.computeRoutes) {
      const origin = overview.waypoints[0];
      const destination = overview.waypoints[overview.waypoints.length - 1];
      const intermediates = overview.waypoints.slice(1, -1).map(wp => ({
        location: { latLng: { lat: wp.lat, lng: wp.lng } },
      }));

      const request = {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        intermediates: intermediates.length > 0 ? intermediates : undefined,
        travelMode,
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
      };

      (routesLib as any).Route.computeRoutes(request)
        .then(({ routes }: { routes: any[] }) => {
          if (routes && routes.length > 0) {
            const primary = routes[0];
            const newPolylines = primary.createPolylines?.() || [];
            newPolylines.forEach((poly: google.maps.Polyline) => {
              poly.setOptions({
                strokeColor: '#0284c7', // Sky-600
                strokeWeight: 5,
                strokeOpacity: 0.85,
              });
              poly.setMap(map);
            });
            polylinesRef.current = newPolylines;

            if (primary.viewport) {
              map.fitBounds(primary.viewport);
            }
          }
        })
        .catch(() => {
          // Fallback to direct geodesic polyline on map
          drawDirectPolyline();
        });
    } else {
      drawDirectPolyline();
    }

    function drawDirectPolyline() {
      if (!map || typeof google === 'undefined' || !google.maps) return;
      const path = overview.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
      const directPoly = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#0284c7',
        strokeOpacity: 0.85,
        strokeWeight: 4,
      });
      directPoly.setMap(map);
      polylinesRef.current = [directPoly];

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      overview.waypoints.forEach(wp => bounds.extend({ lat: wp.lat, lng: wp.lng }));
      map.fitBounds(bounds, 50);
    }

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, overview, travelMode]);

  return null;
};

export const GoogleTripRouteMap: React.FC<GoogleTripRouteMapProps> = ({
  title,
  waypoints,
  uiLang = 'en',
  className = '',
  height = 420,
  initialSelectedPoint = null,
  showLegsList = true,
  showStatsBanner = true,
  distanceMatrixResult = null,
  isCalculatingDistance = false,
  onRecalculateDistance,
}) => {
  const isAr = uiLang === 'ar';
  const [selectedPoint, setSelectedPoint] = useState<GeoPoint | null>(initialSelectedPoint);
  const [activeFilter, setActiveFilter] = useState<'all' | 'hotel' | 'sightseeing' | 'transit'>('all');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');
  const [mapType, setMapType] = useState<string>('roadmap');
  const [useFallbackSvg, setUseFallbackSvg] = useState(false);

  // Compute overview data
  const overview = useMemo(() => buildTripRouteOverview(waypoints), [waypoints]);

  // Filtered waypoints
  const filteredWaypoints = useMemo(() => {
    if (activeFilter === 'all') return overview.waypoints;
    if (activeFilter === 'hotel') return overview.waypoints.filter(w => w.type === 'hotel');
    if (activeFilter === 'sightseeing') return overview.waypoints.filter(w => w.type === 'sightseeing');
    return overview.waypoints.filter(w => w.type === 'airport' || w.type === 'transfer' || w.type === 'cruise');
  }, [overview.waypoints, activeFilter]);

  const hotelCount = overview.waypoints.filter(w => w.type === 'hotel').length;
  const sightCount = overview.waypoints.filter(w => w.type === 'sightseeing').length;

  const formatDistance = (km: number) => {
    if (distanceUnit === 'miles') {
      const miles = Math.round(km * 0.621371 * 10) / 10;
      return `${miles} ${isAr ? 'ميل' : 'mi'}`;
    }
    return `${km} ${isAr ? 'كم' : 'km'}`;
  };

  const formatDuration = (min: number) => {
    const hours = Math.floor(min / 60);
    const m = min % 60;
    if (hours > 0) {
      return isAr ? `${hours} س ${m > 0 ? `${m} د` : ''}` : `${hours}h ${m > 0 ? `${m}m` : ''}`;
    }
    return isAr ? `${m} دقيقة` : `${m} mins`;
  };

  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Header & Filter Controls */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{title || (isAr ? 'مسار الرحلة الحي ومواقع الفنادق (Google Maps)' : 'Live GPS Route & Hotel Radar (Google Maps)')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                {isAr ? 'تفاعلي GPS' : 'Live GPS'}
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              {isAr 
                ? `${overview.waypoints.length} محطات • ${hotelCount} فنادق • ${sightCount} مزارات سياحية`
                : `${overview.waypoints.length} waypoints • ${hotelCount} hotels • ${sightCount} sights`}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({overview.waypoints.length})
            </button>
            <button
              onClick={() => setActiveFilter('hotel')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                activeFilter === 'hotel' ? 'bg-white text-amber-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hotel className="w-3 h-3 text-amber-600" />
              <span>{isAr ? 'فنادق' : 'Hotels'} ({hotelCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('sightseeing')}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                activeFilter === 'sightseeing' ? 'bg-white text-emerald-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{isAr ? 'مزارات' : 'Sights'} ({sightCount})</span>
            </button>
          </div>

          {/* Unit Toggle */}
          <button
            onClick={() => setDistanceUnit(u => u === 'km' ? 'miles' : 'km')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Toggle distance unit"
          >
            {distanceUnit.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      {showStatsBanner && overview.waypoints.length > 0 && (
        <div className="bg-sky-50/70 border-b border-sky-100 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-sky-900 gap-2">
          <div className="flex items-center gap-4 flex-wrap font-medium">
            <span className="flex items-center gap-1.5">
              <RouteIcon className="w-3.5 h-3.5 text-sky-600" />
              <strong className="font-bold">{isAr ? 'إجمالي مسافة الرحلة:' : 'Total Distance:'}</strong>{' '}
              <span className="font-mono font-bold text-sky-700">
                {formatDistance(distanceMatrixResult?.totalDistanceKm ?? overview.totalDistanceKm)}
              </span>
              {distanceMatrixResult && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Matrix
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <strong className="font-bold">{isAr ? 'وقت الانتقال التقديري:' : 'Est. Transit Time:'}</strong>{' '}
              <span className="font-mono font-bold text-sky-700">
                {formatDuration(distanceMatrixResult?.totalDurationMinutes ?? overview.totalDurationMinutes)}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRecalculateDistance && (
              <button
                type="button"
                onClick={onRecalculateDistance}
                disabled={isCalculatingDistance}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white border border-sky-200 text-sky-800 hover:bg-sky-100/70 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isCalculatingDistance ? 'animate-spin text-sky-600' : ''}`} />
                <span>{isAr ? 'تحديث المسافات' : 'Update Matrix'}</span>
              </button>
            )}

            <div className="text-[11px] text-sky-700/80 font-medium flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span>
                {distanceMatrixResult?.source === 'google_routes_api'
                  ? (isAr ? 'Google Routes API موثق' : 'Google Routes API Verified')
                  : (isAr ? 'حساب المسار الجغرافي مدعوم بـ Google Routes Engine' : 'Google Routes Engine')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div className="relative w-full" style={{ height }}>
        {!useFallbackSvg ? (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker', 'routes', 'geometry']}>
            <Map
              defaultCenter={overview.center}
              defaultZoom={overview.zoom}
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapTypeId={mapType}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              className="w-full h-full"
            >
              {/* Route Polyline */}
              <RoutePolylineRenderer overview={overview} travelMode="DRIVING" />

              {/* Waypoint Markers */}
              {filteredWaypoints.map((wp, idx) => {
                const isHotel = wp.type === 'hotel';
                const isSight = wp.type === 'sightseeing';
                const isAirport = wp.type === 'airport';

                // Choose colors
                const pinBg = isHotel ? '#d97706' : isSight ? '#059669' : '#0284c7';
                const pinGlyph = isHotel ? '🏨' : isSight ? '🏛️' : '✈️';

                return (
                  <AdvancedMarker
                    key={`${wp.name}-${idx}`}
                    position={{ lat: wp.lat, lng: wp.lng }}
                    onClick={() => setSelectedPoint(wp)}
                    title={isAr && wp.nameAr ? wp.nameAr : wp.name}
                  >
                    <Pin 
                      background={pinBg} 
                      borderColor="#ffffff" 
                      glyphColor="#ffffff"
                      glyph={pinGlyph}
                      scale={selectedPoint?.name === wp.name ? 1.25 : 1.05}
                    />
                  </AdvancedMarker>
                );
              })}

              {/* Interactive Info Window */}
              {selectedPoint && (
                <InfoWindow
                  position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
                  onCloseClick={() => setSelectedPoint(null)}
                >
                  <div className="p-1 max-w-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        selectedPoint.type === 'hotel' 
                          ? 'bg-amber-100 text-amber-800' 
                          : selectedPoint.type === 'sightseeing' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {selectedPoint.type.toUpperCase()}
                      </span>
                      {selectedPoint.rating && (
                        <span className="text-[10px] font-bold text-amber-600">
                          ★ {selectedPoint.rating}
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 leading-snug">
                      {isAr && selectedPoint.nameAr ? selectedPoint.nameAr : selectedPoint.name}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {selectedPoint.city} • {selectedPoint.address || 'Egypt Location'}
                    </p>
                    {(selectedPoint.description || selectedPoint.descriptionAr) && (
                      <p className="text-[10px] text-slate-600 mt-1 italic">
                        {isAr && selectedPoint.descriptionAr ? selectedPoint.descriptionAr : selectedPoint.description}
                      </p>
                    )}
                    <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${selectedPoint.lat},${selectedPoint.lng}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                      >
                        <span>{isAr ? 'فتح في خرائط Google' : 'Open in Google Maps'}</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : (
          /* SVG Route Fallback when offline or key unavailable */
          <div className="w-full h-full bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
            <Compass className="w-10 h-10 text-sky-500 mb-2 animate-pulse" />
            <p className="text-sm font-bold text-slate-800">
              {isAr ? 'مخطط المسار الجغرافي التفاعلي' : 'Interactive Geospatial Route Diagram'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              {isAr 
                ? 'يتم عرض المسار والمحطات بدقة عبر الرادار الجغرافي الداخلي'
                : 'Displaying high-precision waypoints and calculated distances'}
            </p>
          </div>
        )}

        {/* Floating Map Controls & Legends */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 bg-white/95 backdrop-blur-xs rounded-xl p-1.5 shadow-sm border border-slate-200 text-xs">
          <button
            onClick={() => setMapType((t: string) => t === 'roadmap' ? 'satellite' : 'roadmap')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 flex items-center gap-1 transition"
            title="Toggle Map Satellite View"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-[10px] font-bold capitalize">{mapType}</span>
          </button>
        </div>
      </div>

      {/* Leg-by-Leg Route Transit Breakdown List */}
      {showLegsList && overview.legs.length > 0 && (
        <div className="p-4 bg-slate-50/50 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <RouteIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>{isAr ? 'جدول المسافات ومراحل الانتقال بين المحطات:' : 'Leg-by-Leg Transit & Distance Breakdown:'}</span>
            </h5>
            <span className="text-[11px] text-slate-500 font-medium">
              {overview.legs.length} {isAr ? 'مراحل' : 'legs'}
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {overview.legs.map((leg, idx) => {
              const LegIcon = leg.mode === 'flight' ? Plane : leg.mode === 'cruise' ? Ship : Car;
              const matrixLeg = distanceMatrixResult?.legs?.[idx];
              const legDistanceKm = matrixLeg ? matrixLeg.distanceKm : leg.distanceKm;
              const legDurationMin = matrixLeg ? matrixLeg.durationMinutes : leg.estimatedMinutes;

              return (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-between text-xs hover:border-sky-300 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-sky-100">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                        <span className="text-slate-700">{leg.from.name}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-900 font-bold">{leg.to.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <LegIcon className="w-3 h-3 text-sky-500" />
                          <span className="capitalize">{leg.mode}</span>
                        </span>
                        <span>•</span>
                        <span>{leg.from.city} to {leg.to.city}</span>
                        {matrixLeg && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-700 rounded font-semibold border border-emerald-100">
                            Distance Matrix
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono font-bold text-slate-700 text-xs">
                    <div>{formatDistance(legDistanceKm)}</div>
                    <div className="text-[10px] text-slate-400 font-normal">~{formatDuration(legDurationMin)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
