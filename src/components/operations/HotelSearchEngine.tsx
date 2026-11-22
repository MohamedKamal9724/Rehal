/// <reference types="@types/google.maps" />
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Hotel,
  Search,
  Calendar,
  MapPin,
  Star,
  ExternalLink,
  CheckCircle2,
  BedDouble,
  Sparkles,
  Utensils,
  Phone,
  Globe,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  X,
  Compass,
  Layers,
  Map as MapIcon,
  LayoutGrid,
  Columns,
  Navigation,
} from 'lucide-react';
import { UILanguage } from '../../types';
import {
  HOTEL_REGIONS,
  HotelRegionId,
  HotelPropertyCategory,
  MealPlanType,
  LiveHotelItem,
  searchAndPriceLiveHotels,
  fetchHotelInventory,
  fetchHotelImages,
} from '../../lib/liveHotelService';

const GOOGLE_MAPS_API_KEY = (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY as string) || '';

export interface HotelSearchEngineProps {
  uiLang: UILanguage;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onAssignHotelToRooming?: (
    hotel: LiveHotelItem,
    context: { checkIn: string; checkOut: string; mealPlan: MealPlanType }
  ) => void;
  onHotelsLoaded?: (hotels: LiveHotelItem[], syncedAt: string) => void;
  compactColumns?: boolean;
}

/**
 * Child component inside <GoogleMap> that automatically fits bounds to current search results
 * or pans smoothly when a specific hotel is focused by the tour operator.
 */
const HotelMapBoundsController: React.FC<{
  hotels: LiveHotelItem[];
  focusedHotel: LiveHotelItem | null;
  selectedRegion: HotelRegionId;
}> = ({ hotels, focusedHotel, selectedRegion }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (focusedHotel && focusedHotel.coordinates) {
      map.panTo(focusedHotel.coordinates);
      map.setZoom(15);
      return;
    }

    if (hotels.length === 1 && hotels[0].coordinates) {
      map.panTo(hotels[0].coordinates);
      map.setZoom(14);
      return;
    }

    if (hotels.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      let validCount = 0;
      hotels.forEach((h) => {
        if (h.coordinates && typeof h.coordinates.lat === 'number' && typeof h.coordinates.lng === 'number') {
          bounds.extend(h.coordinates);
          validCount++;
        }
      });
      if (validCount > 0) {
        map.fitBounds(bounds, 48);
      }
      return;
    }

    const regMeta = HOTEL_REGIONS.find((r) => r.id === selectedRegion);
    if (regMeta) {
      map.panTo(regMeta.center);
      map.setZoom(regMeta.zoom);
    }
  }, [map, hotels, focusedHotel, selectedRegion]);

  return null;
};

export const HotelSearchEngine: React.FC<HotelSearchEngineProps> = ({
  uiLang,
  initialCheckIn = '2026-11-20',
  initialCheckOut = '2026-11-24',
  onAssignHotelToRooming,
  onHotelsLoaded,
  compactColumns = false,
}) => {
  const isAr = uiLang === 'ar';

  const [selectedRegion, setSelectedRegion] = useState<HotelRegionId>('all');
  const [selectedCategory, setSelectedCategory] = useState<HotelPropertyCategory>('all');
  const [mealPlan, setMealPlan] = useState<MealPlanType>('BB');
  const [checkInDate, setCheckInDate] = useState<string>(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string>(initialCheckOut);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hotels, setHotels] = useState<LiveHotelItem[]>(() =>
    searchAndPriceLiveHotels({
      region: 'all',
      category: 'all',
      checkIn: initialCheckIn,
      checkOut: initialCheckOut,
      mealPlan: 'BB',
    })
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Explorer internal layout: 'map-sidebar' (Left Google Map Sidebar + Right Cards), 'cards-only', 'map-full'
  const [explorerViewMode, setExplorerViewMode] = useState<'map-sidebar' | 'cards-only' | 'map-full'>('map-sidebar');
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [selectedMapHotelId, setSelectedMapHotelId] = useState<string | null>(null);

  // Real-time async hotel image carousels fetched via mock API `fetchHotelImages(hotelId)`
  const [carouselImagesByHotel, setCarouselImagesByHotel] = useState<Record<string, string[]>>({});
  const [loadingImagesByHotel, setLoadingImagesByHotel] = useState<Record<string, boolean>>({});
  const [activePhotoIndexByHotel, setActivePhotoIndexByHotel] = useState<Record<string, number>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [lightboxHotel, setLightboxHotel] = useState<{ hotel: LiveHotelItem; index: number } | null>(null);

  useEffect(() => {
    if (initialCheckIn) setCheckInDate(initialCheckIn);
    if (initialCheckOut) setCheckOutDate(initialCheckOut);
  }, [initialCheckIn, initialCheckOut]);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchHotelInventory({
      region: selectedRegion,
      category: selectedCategory,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      mealPlan,
      query: searchQuery,
    });
    setHotels(result.hotels);
    setLastSyncedAt(result.syncedAt);
    setIsLoading(false);

    if (result.hotels.length > 0) {
      setSelectedMapHotelId((prev) =>
        prev && result.hotels.some((h) => h.id === prev) ? prev : result.hotels[0].id
      );
    } else {
      setSelectedMapHotelId(null);
    }

    if (onHotelsLoaded) {
      onHotelsLoaded(result.hotels, result.syncedAt);
    }
  }, [selectedRegion, selectedCategory, checkInDate, checkOutDate, mealPlan, searchQuery, onHotelsLoaded]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Fetch real-time image carousels for each hotel in the current search results using `fetchHotelImages`
  useEffect(() => {
    let cancelled = false;

    const loadCarouselsForVisibleHotels = async () => {
      const pendingHotels = hotels.filter((h) => !carouselImagesByHotel[h.id]);
      if (pendingHotels.length === 0) return;

      const loadingFlags: Record<string, boolean> = {};
      pendingHotels.forEach((h) => {
        loadingFlags[h.id] = true;
      });
      setLoadingImagesByHotel((prev) => ({ ...prev, ...loadingFlags }));

      const fetchedEntries = await Promise.all(
        pendingHotels.map(async (h) => {
          const imgs = await fetchHotelImages(h.id);
          return [h.id, imgs] as const;
        })
      );

      if (cancelled) return;

      setCarouselImagesByHotel((prev) => {
        const next = { ...prev };
        fetchedEntries.forEach(([id, imgs]) => {
          next[id] = imgs;
        });
        return next;
      });

      setLoadingImagesByHotel((prev) => {
        const next = { ...prev };
        pendingHotels.forEach((h) => {
          next[h.id] = false;
        });
        return next;
      });
    };

    loadCarouselsForVisibleHotels();

    return () => {
      cancelled = true;
    };
  }, [hotels, carouselImagesByHotel]);

  const focusedMapHotel = useMemo(
    () => hotels.find((h) => h.id === selectedMapHotelId) || null,
    [hotels, selectedMapHotelId]
  );

  const activeRegionMeta = useMemo(
    () => HOTEL_REGIONS.find((r) => r.id === selectedRegion) || HOTEL_REGIONS[0],
    [selectedRegion]
  );

  const cycleHotelPhoto = (hotelId: string, totalPhotos: number, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndexByHotel((prev) => {
      const current = prev[hotelId] || 0;
      const next = (current + delta + totalPhotos) % totalPhotos;
      return { ...prev, [hotelId]: next };
    });
  };

  const getHotelCarouselList = (hotel: LiveHotelItem): string[] => {
    const fetched = carouselImagesByHotel[hotel.id];
    if (fetched && fetched.length > 0) return fetched;
    if (hotel.galleryUrls && hotel.galleryUrls.length > 0) return hotel.galleryUrls;
    return [hotel.imageUrl];
  };

  return (
    <div
      className="bg-white rounded-3xl border border-[#EDE0CC] shadow-2xs p-4 sm:p-5 space-y-4"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ===================================================================== */}
      {/* 1. EXPLORER HEADER & VIEW MODE BAR                                    */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#EDE0CC]/90">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#795037]">
            <Building2 className="w-4 h-4 text-[#C4A177] shrink-0" />
            <span>
              {isAr
                ? 'مستكشف الفنادق والخرائط التفاعلية · الأسعار الحية والحجز المباشر'
                : 'Live Hotel Inventory, Google Maps Radar & Image Carousel Explorer'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#44200F] mt-0.5">
            {isAr
              ? 'خريطة مواقع الفنادق وألبومات الصور والأسعار المباشرة'
              : 'Interactive Hotel Map, Real-Time Photo Carousels & Direct Booking'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Sub-layout Switcher: Map Sidebar + Cards | Cards Only | Full Map */}
          <div className="inline-flex items-center bg-[#FAF7F2] p-0.5 rounded-xl border border-[#EDE0CC]">
            <button
              type="button"
              onClick={() => setExplorerViewMode('map-sidebar')}
              className={`h-8 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition cursor-pointer ${
                explorerViewMode === 'map-sidebar'
                  ? 'bg-[#44200F] text-white shadow-2xs'
                  : 'text-[#795037] hover:text-[#44200F]'
              }`}
              title={isAr ? 'خريطة جانبية + بطاقات الفنادق' : 'Map Sidebar + Hotel Cards'}
            >
              <Columns className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'خريطة + بطاقات' : 'Map + Cards'}</span>
            </button>

            <button
              type="button"
              onClick={() => setExplorerViewMode('cards-only')}
              className={`h-8 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition cursor-pointer ${
                explorerViewMode === 'cards-only'
                  ? 'bg-[#44200F] text-white shadow-2xs'
                  : 'text-[#795037] hover:text-[#44200F]'
              }`}
              title={isAr ? 'شبكة البطاقات فقط' : 'Hotel Cards Grid'}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'البطاقات' : 'Cards'}</span>
            </button>

            <button
              type="button"
              onClick={() => setExplorerViewMode('map-full')}
              className={`h-8 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition cursor-pointer ${
                explorerViewMode === 'map-full'
                  ? 'bg-[#44200F] text-white shadow-2xs'
                  : 'text-[#795037] hover:text-[#44200F]'
              }`}
              title={isAr ? 'توسيع خريطة Google' : 'Expanded Google Map'}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'الخريطة كاملة' : 'Full Map'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadInventory}
            className="h-9 px-3 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#EDE0CC]/60 text-[#44200F] border border-[#EDE0CC] inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
            title={isAr ? `آخر مزامنة: ${lastSyncedAt}` : `Last synced: ${lastSyncedAt}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin text-[#EA580C]' : 'text-[#795037]'}`} />
            <span>{isAr ? 'تحديث الأسعار' : 'Sync Rates'}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. SEARCH, CHECK-IN/OUT DATES & MEAL PLAN CONTROLS                    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-2.5">
        {/* Search Input */}
        <div className="sm:col-span-2 xl:col-span-4 h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#795037] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث باسم الفندق، المنطقة، الإطلالة...' : 'Search hotel name, district, view...'}
            className="w-full bg-transparent text-xs text-[#44200F] placeholder:text-[#795037]/60 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#795037] hover:text-[#44200F] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Check-in Date */}
        <div className="xl:col-span-3 h-9 px-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl flex items-center justify-between gap-1.5 text-xs">
          <span className="text-[#795037] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{isAr ? 'دخول:' : 'In:'}</span>
          </span>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="bg-transparent text-[#44200F] font-mono tabular-nums font-bold text-xs focus:outline-none"
          />
        </div>

        {/* Check-out Date */}
        <div className="xl:col-span-3 h-9 px-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl flex items-center justify-between gap-1.5 text-xs">
          <span className="text-[#795037] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{isAr ? 'خروج:' : 'Out:'}</span>
          </span>
          <input
            type="date"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            className="bg-transparent text-[#44200F] font-mono tabular-nums font-bold text-xs focus:outline-none"
          />
        </div>

        {/* Meal Plan Selector */}
        <div className="xl:col-span-2 h-9 px-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl flex items-center gap-1.5 text-xs">
          <Utensils className="w-3.5 h-3.5 text-[#795037] shrink-0" />
          <select
            value={mealPlan}
            onChange={(e) => setMealPlan(e.target.value as MealPlanType)}
            className="w-full bg-transparent text-[#44200F] font-bold text-xs focus:outline-none cursor-pointer"
          >
            <option value="BB">{isAr ? 'إفطار (BB)' : 'BB'}</option>
            <option value="HB">{isAr ? 'نصف إقامة (HB)' : 'HB'}</option>
            <option value="AI">{isAr ? 'شاملة (AI)' : 'All-Inc'}</option>
          </select>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. REGION & PROPERTY CATEGORY FILTER BAR                              */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {HOTEL_REGIONS.map((reg) => {
            const isActive = selectedRegion === reg.id;
            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => setSelectedRegion(reg.id)}
                className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition cursor-pointer ${
                  isActive
                    ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                    : 'bg-[#FAF7F2] hover:bg-[#EDE0CC]/60 text-[#795037] border border-[#EDE0CC]'
                }`}
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{isAr ? reg.labelAr : reg.labelEn}</span>
                <span
                  className={`font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/15 text-white' : 'bg-white text-[#44200F]'
                  }`}
                >
                  {reg.count}
                </span>
              </button>
            );
          })}
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as HotelPropertyCategory)}
          className="h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs font-bold text-[#44200F] focus:outline-none cursor-pointer shrink-0"
        >
          <option value="all">{isAr ? 'كل الفئات (5★ / كروز / بوتيك)' : 'All Property Types'}</option>
          <option value="5-Star Luxury">{isAr ? '٥ نجوم لوكشري' : '5-Star Luxury'}</option>
          <option value="5-Star Deluxe">{isAr ? '٥ نجوم ديلوكس للأفواج' : '5-Star Deluxe'}</option>
          <option value="Nile Cruise">{isAr ? 'بواخر نيلية فاخرة' : 'Nile Cruises'}</option>
          <option value="Boutique & Eco">{isAr ? 'بوتيك وبيئي' : 'Boutique & Eco'}</option>
        </select>
      </div>

      {/* ===================================================================== */}
      {/* 4. MAIN EXPLORER WORKSPACE: LEFT GOOGLE MAPS SIDEBAR + HOTEL CARDS    */}
      {/* ===================================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-96 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC] p-4 animate-pulse flex flex-col justify-between"
            >
              <div className="h-44 bg-[#EDE0CC]/60 rounded-xl" />
              <div className="space-y-2">
                <div className="h-4 bg-[#EDE0CC] rounded w-3/4" />
                <div className="h-3 bg-[#EDE0CC]/70 rounded w-1/2" />
              </div>
              <div className="h-20 bg-[#EDE0CC]/50 rounded-xl" />
              <div className="h-9 bg-[#EDE0CC] rounded-xl" />
            </div>
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-10 bg-[#FAF8F5] rounded-2xl border border-[#EDE0CC] p-6">
          <Hotel className="w-10 h-10 text-[#C4A177] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#44200F]">
            {isAr ? 'لم يتم العثور على فنادق مطابقة' : 'No matching hotels found'}
          </h3>
          <p className="text-xs text-[#795037] mt-1 mb-4">
            {isAr ? 'جرب تغيير المنطقة أو مسح كلمة البحث' : 'Try switching the region or clearing the search filter'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedRegion('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="h-9 px-4 rounded-xl bg-[#44200F] text-white text-xs font-bold cursor-pointer"
          >
            {isAr ? 'عرض جميع الفنادق' : 'Reset All Filters'}
          </button>
        </div>
      ) : (
        <div
          className={
            explorerViewMode === 'map-sidebar'
              ? 'grid grid-cols-1 xl:grid-cols-12 gap-4 items-start'
              : 'space-y-4'
          }
        >
          {/* ----------------------------------------------------------------- */}
          {/* LEFT SIDEBAR: INTERACTIVE GOOGLE MAPS VIEW                        */}
          {/* ----------------------------------------------------------------- */}
          {(explorerViewMode === 'map-sidebar' || explorerViewMode === 'map-full') && (
            <aside
              className={
                explorerViewMode === 'map-sidebar'
                  ? 'xl:col-span-5 xl:sticky xl:top-20 bg-[#FAF8F5] rounded-2xl border border-[#EDE0CC] overflow-hidden shadow-2xs flex flex-col'
                  : 'w-full bg-[#FAF8F5] rounded-2xl border border-[#EDE0CC] overflow-hidden shadow-2xs flex flex-col'
              }
            >
              {/* Map Sidebar Header */}
              <div className="p-3 bg-gradient-to-r from-[#44200F] via-[#592B15] to-[#311509] text-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white/10 text-[#C4A177] flex items-center justify-center shrink-0">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold text-white truncate">
                      {isAr ? 'خريطة الفنادق التفاعلية (Google Maps)' : 'Interactive Hotel Locations (Google Maps)'}
                    </h3>
                    <p className="text-[10px] text-[#EDE0CC] font-mono tabular-nums truncate">
                      {hotels.length} {isAr ? 'فندق على الخريطة' : 'plotted hotels'} ·{' '}
                      {isAr ? activeRegionMeta.labelAr : activeRegionMeta.labelEn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMapType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
                    className="h-7 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-[#EDE0CC] inline-flex items-center gap-1 transition cursor-pointer border border-white/15"
                    title={isAr ? 'تبديل نوع الخريطة (قمر صناعي / طرق)' : 'Toggle Satellite / Roadmap'}
                  >
                    <Layers className="w-3 h-3 text-[#C4A177]" />
                    <span>{mapType === 'roadmap' ? (isAr ? 'قمر صناعي' : 'Satellite') : isAr ? 'طرق' : 'Map'}</span>
                  </button>
                </div>
              </div>

              {/* Google Map Container with Explicit Height (CF2) */}
              <div
                className="relative w-full bg-[#EFECE6]"
                style={{ height: explorerViewMode === 'map-full' ? '520px' : '380px' }}
              >
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker']}>
                  <GoogleMap
                    defaultCenter={activeRegionMeta.center}
                    defaultZoom={activeRegionMeta.zoom}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    mapTypeId={mapType}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    className="w-full h-full"
                  >
                    <HotelMapBoundsController
                      hotels={hotels}
                      focusedHotel={focusedMapHotel}
                      selectedRegion={selectedRegion}
                    />

                    {hotels.map((hotel) => {
                      const dblRate =
                        hotel.roomOptions?.find((r) => r.code === 'DBL')?.liveNightlyUsd ||
                        hotel.baseRatesUsd.dbl;
                      const isSelected = selectedMapHotelId === hotel.id;

                      return (
                        <AdvancedMarker
                          key={hotel.id}
                          position={hotel.coordinates}
                          onClick={() => setSelectedMapHotelId(hotel.id)}
                          title={isAr ? hotel.nameAr : hotel.nameEn}
                          zIndex={isSelected ? 50 : 10}
                        >
                          <div
                            className={`px-2 py-1 rounded-xl font-mono tabular-nums text-[11px] font-extrabold shadow-md border transition-transform flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-[#EA580C] text-white border-white scale-115 ring-2 ring-[#EA580C]/40'
                                : 'bg-[#44200F] text-[#FAF8F5] border-[#C4A177] hover:scale-105'
                            }`}
                          >
                            <span>${dblRate}</span>
                            <span className="text-[9px] text-[#C4A177]">{hotel.stars}★</span>
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                    {focusedMapHotel && (
                      <InfoWindow
                        position={focusedMapHotel.coordinates}
                        onCloseClick={() => setSelectedMapHotelId(null)}
                        maxWidth={260}
                      >
                        <div className="p-1 text-xs space-y-2" dir={isAr ? 'rtl' : 'ltr'}>
                          <div className="relative h-24 w-full rounded-lg overflow-hidden bg-[#311509]">
                            <img
                              src={getHotelCarouselList(focusedMapHotel)[0]}
                              alt={isAr ? focusedMapHotel.nameAr : focusedMapHotel.nameEn}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[#C4A177] text-[10px] font-bold">
                              {focusedMapHotel.stars}★ · {focusedMapHotel.rating.toFixed(2)}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-[#44200F] text-xs leading-snug">
                              {isAr ? focusedMapHotel.nameAr : focusedMapHotel.nameEn}
                            </h4>
                            <p className="text-[10px] text-[#795037] mt-0.5">
                              {isAr ? focusedMapHotel.districtAr : focusedMapHotel.districtEn}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#EDE0CC]">
                            <div className="font-mono tabular-nums">
                              <span className="text-xs font-black text-[#44200F]">
                                $
                                {focusedMapHotel.roomOptions?.find((r) => r.code === 'DBL')?.liveNightlyUsd ||
                                  focusedMapHotel.baseRatesUsd.dbl}
                              </span>
                              <span className="text-[10px] text-[#795037]">/{isAr ? 'ليلة' : 'nt'}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <a
                                href={focusedMapHotel.directBookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-md bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] border border-[#C4A177] text-[10px] font-bold inline-flex items-center gap-0.5"
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-[#EA580C]" />
                                <span>{isAr ? 'حجز' : 'Book'}</span>
                              </a>
                              {onAssignHotelToRooming && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAssignHotelToRooming(focusedMapHotel, {
                                      checkIn: checkInDate,
                                      checkOut: checkOutDate,
                                      mealPlan,
                                    })
                                  }
                                  className="px-2 py-1 rounded-md bg-[#44200F] text-white text-[10px] font-bold cursor-pointer"
                                >
                                  {isAr ? 'إسناد' : 'Assign'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </APIProvider>
              </div>

              {/* Interactive Plotted Hotel Quick-Jump List under the Map */}
              <div className="p-3 bg-white border-t border-[#EDE0CC] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#795037]">
                  <span className="inline-flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>{isAr ? 'الفنادق المحددة على الخريطة:' : 'Hotels Plotted in Current View:'}</span>
                  </span>
                  <span className="font-mono tabular-nums text-[10px] text-[#44200F]">
                    {isAr ? 'اضغط للتركيز الجغرافي' : 'Click to pan map'}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                  {hotels.map((h) => {
                    const isFocused = selectedMapHotelId === h.id;
                    const dblPrice =
                      h.roomOptions?.find((r) => r.code === 'DBL')?.liveNightlyUsd || h.baseRatesUsd.dbl;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setSelectedMapHotelId(h.id)}
                        className={`w-full text-start p-2 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                          isFocused
                            ? 'bg-[#44200F] text-white border-[#44200F] shadow-2xs'
                            : 'bg-[#FAF8F5] hover:bg-[#FAF7F2] text-[#44200F] border-[#EDE0CC]'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isFocused ? 'bg-[#EA580C]' : 'bg-[#C4A177]'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {isAr ? h.nameAr : h.nameEn}
                            </div>
                            <div
                              className={`text-[10px] font-mono tabular-nums truncate ${
                                isFocused ? 'text-[#EDE0CC]' : 'text-[#795037]'
                              }`}
                            >
                              {isAr ? h.cityAr : h.cityEn} · {h.coordinates.lat.toFixed(3)}°N,{' '}
                              {h.coordinates.lng.toFixed(3)}°E
                            </div>
                          </div>
                        </div>

                        <div className="text-end shrink-0 font-mono tabular-nums">
                          <div className={`text-xs font-extrabold ${isFocused ? 'text-[#C4A177]' : 'text-[#44200F]'}`}>
                            ${dblPrice}
                          </div>
                          <div className={`text-[9px] ${isFocused ? 'text-white/80' : 'text-[#795037]'}`}>
                            DBL/{isAr ? 'ل' : 'nt'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT / MAIN PANE: HOTEL CARDS WITH REAL-TIME IMAGE CAROUSELS     */}
          {/* ----------------------------------------------------------------- */}
          {explorerViewMode !== 'map-full' && (
            <div
              className={
                explorerViewMode === 'map-sidebar'
                  ? `xl:col-span-7 grid grid-cols-1 ${
                      compactColumns ? 'md:grid-cols-1 2xl:grid-cols-2' : 'md:grid-cols-2'
                    } gap-4 items-stretch`
                  : `grid grid-cols-1 ${
                      compactColumns ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'
                    } gap-4 items-stretch`
              }
            >
              {hotels.map((hotel) => {
                const gallery = getHotelCarouselList(hotel);
                const isCarouselSyncing = Boolean(loadingImagesByHotel[hotel.id]);
                const activeIdx = (activePhotoIndexByHotel[hotel.id] || 0) % Math.max(1, gallery.length);
                const currentPhoto = gallery[activeIdx] || hotel.imageUrl;
                const imgKey = `${hotel.id}_${activeIdx}`;
                const imgFailed = Boolean(failedImages[imgKey]);
                const isHighlightedOnMap = selectedMapHotelId === hotel.id;

                const sglOption = hotel.roomOptions?.find((r) => r.code === 'SGL');
                const dblOption = hotel.roomOptions?.find((r) => r.code === 'DBL');
                const suiteOption = hotel.roomOptions?.find((r) => r.code === 'SUITE');
                const nights = hotel.nights || 4;

                return (
                  <article
                    key={hotel.id}
                    onClick={() => setSelectedMapHotelId(hotel.id)}
                    className={`h-full rounded-2xl border transition duration-200 overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isHighlightedOnMap
                        ? 'bg-white border-[#EA580C] ring-2 ring-[#EA580C]/20 shadow-md'
                        : 'bg-[#FAF8F5] hover:bg-white border-[#EDE0CC] hover:border-[#C4A177] shadow-2xs hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Interactive Real-Time Image Carousel Header */}
                      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-[#44200F] via-[#5c301a] to-[#2c1509] group">
                        {!imgFailed ? (
                          <img
                            src={currentPhoto}
                            alt={isAr ? hotel.nameAr : hotel.nameEn}
                            referrerPolicy="no-referrer"
                            onError={() => setFailedImages((prev) => ({ ...prev, [imgKey]: true }))}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#C4A177] p-4 text-center">
                            <Hotel className="w-10 h-10 mb-1.5 opacity-80" />
                            <span className="text-xs font-bold text-white/90 line-clamp-1">
                              {isAr ? hotel.nameAr : hotel.nameEn}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                        {/* Carousel Left / Right Controls */}
                        {gallery.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => cycleHotelPhoto(hotel.id, gallery.length, -1, e)}
                              className="absolute start-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 transition cursor-pointer border border-white/20 shadow-sm"
                              aria-label="Previous hotel photo"
                            >
                              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => cycleHotelPhoto(hotel.id, gallery.length, 1, e)}
                              className="absolute end-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center opacity-90 group-hover:opacity-100 transition cursor-pointer border border-white/20 shadow-sm"
                              aria-label="Next hotel photo"
                            >
                              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </>
                        )}

                        {/* Top Overlay: Star Category, Carousel Counter & Availability */}
                        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-black/65 backdrop-blur-xs text-[#C4A177] text-[11px] font-bold border border-white/15 whitespace-nowrap">
                            {hotel.stars}★ · {hotel.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxHotel({ hotel, index: activeIdx });
                              }}
                              className="px-2 py-0.5 rounded-lg bg-black/65 hover:bg-black/85 text-white text-[10px] font-mono tabular-nums inline-flex items-center gap-1 border border-white/15 cursor-pointer"
                              title={isAr ? 'فتح معرض صور الفندق بالحجم الكامل' : 'Open Fullscreen Hotel Carousel'}
                            >
                              <ImageIcon className={`w-3 h-3 text-[#C4A177] ${isCarouselSyncing ? 'animate-pulse' : ''}`} />
                              <span>
                                {activeIdx + 1}/{gallery.length}
                              </span>
                            </button>

                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-xs whitespace-nowrap font-mono tabular-nums ${
                                hotel.availabilityStatus === 'Available'
                                  ? 'bg-emerald-950/85 text-emerald-300 border border-emerald-500/40'
                                  : hotel.availabilityStatus === 'High Demand'
                                  ? 'bg-amber-950/85 text-amber-300 border border-amber-500/40'
                                  : 'bg-rose-950/85 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {hotel.availableRoomsTotal} {isAr ? 'غرفة متاحة' : 'avail'}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Image Overlay: Name, District & Interactive Carousel Thumbnails */}
                        <div className="absolute bottom-2.5 inset-x-3 text-white space-y-2">
                          <div className="flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 text-[11px] text-[#EDE0CC]">
                                <MapPin className="w-3 h-3 text-[#C4A177] shrink-0" />
                                <span className="truncate">{isAr ? hotel.districtAr : hotel.districtEn}</span>
                              </div>
                              <h3 className="font-extrabold text-sm text-white line-clamp-1">
                                {isAr ? hotel.nameAr : hotel.nameEn}
                              </h3>
                            </div>

                            {/* Locate on Map Pill */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMapHotelId(hotel.id);
                                if (explorerViewMode === 'cards-only') {
                                  setExplorerViewMode('map-sidebar');
                                }
                              }}
                              className="h-6 px-2 rounded-lg bg-black/65 hover:bg-[#EA580C] text-[10px] font-bold text-[#EDE0CC] hover:text-white inline-flex items-center gap-1 border border-white/15 shrink-0 transition cursor-pointer"
                              title={isAr ? 'إظهار موقع الفندق على خريطة Google' : 'Focus Hotel on Google Map'}
                            >
                              <Navigation className="w-2.5 h-2.5 text-[#C4A177]" />
                              <span>{isAr ? 'الخريطة' : 'Map'}</span>
                            </button>
                          </div>

                          {/* Interactive Carousel Thumbnail Strip */}
                          {gallery.length > 1 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              {gallery.map((thumbUrl, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActivePhotoIndexByHotel((prev) => ({ ...prev, [hotel.id]: idx }));
                                  }}
                                  className={`h-6 w-9 rounded-md overflow-hidden border transition-all cursor-pointer shrink-0 ${
                                    idx === activeIdx
                                      ? 'border-[#C4A177] ring-1 ring-[#C4A177] scale-105 opacity-100'
                                      : 'border-white/30 opacity-65 hover:opacity-100'
                                  }`}
                                  aria-label={`Select hotel image ${idx + 1}`}
                                >
                                  <img
                                    src={thumbUrl}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hotel Details & Live Pricing Matrix */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-[#795037]">
                          <div className="flex items-center gap-1 font-mono tabular-nums">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                            <span className="font-extrabold text-[#44200F]">{hotel.rating.toFixed(2)}</span>
                            <span>·</span>
                            <span>
                              {hotel.reviewCount.toLocaleString()} {isAr ? 'تقييم' : 'reviews'}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#795037] truncate max-w-[150px]">
                            {isAr ? hotel.seasonLabelAr : hotel.seasonLabelEn}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#795037] line-clamp-1">
                          {(isAr ? hotel.amenitiesAr : hotel.amenitiesEn).join(' · ')}
                        </p>

                        {/* Room Rates Table */}
                        <div className="bg-white rounded-xl border border-[#EDE0CC] divide-y divide-[#EDE0CC]/70 text-xs">
                          <div className="px-3 py-1.5 bg-[#FAF7F2] flex items-center justify-between text-[10px] font-bold text-[#795037]">
                            <span>{isAr ? `الغرفة (${mealPlan})` : `Room (${mealPlan})`}</span>
                            <span>
                              {isAr ? `الليلة / ${nights} ليالٍ` : `Night / ${nights} Nts`}
                            </span>
                          </div>

                          {dblOption && (
                            <div className="px-3 py-1.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <BedDouble className="w-3.5 h-3.5 text-[#44200F] shrink-0" />
                                <span className="font-bold text-[#44200F] truncate">
                                  {isAr ? 'مزدوجة (DBL)' : 'Double (DBL)'}
                                </span>
                              </div>
                              <div className="font-mono tabular-nums text-end shrink-0">
                                <span className="font-black text-[#44200F]">${dblOption.liveNightlyUsd}</span>
                                <span className="text-[10px] text-[#795037]">/{isAr ? 'ل' : 'nt'}</span>
                                <span className="ms-1 text-[11px] font-bold text-emerald-800">
                                  (${dblOption.totalStayUsd.toLocaleString()})
                                </span>
                              </div>
                            </div>
                          )}

                          {sglOption && (
                            <div className="px-3 py-1.5 flex items-center justify-between gap-2">
                              <span className="font-semibold text-[#795037] truncate">
                                {isAr ? 'مفردة (SGL)' : 'Single (SGL)'}
                              </span>
                              <div className="font-mono tabular-nums text-end shrink-0">
                                <span className="font-bold text-[#44200F]">${sglOption.liveNightlyUsd}</span>
                                <span className="text-[10px] text-[#795037]">/{isAr ? 'ل' : 'nt'}</span>
                                <span className="ms-1 text-[11px] text-[#795037]">
                                  (${sglOption.totalStayUsd.toLocaleString()})
                                </span>
                              </div>
                            </div>
                          )}

                          {suiteOption && (
                            <div className="px-3 py-1.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 min-w-0">
                                <Sparkles className="w-3 h-3 text-[#C4A177] shrink-0" />
                                <span className="font-semibold text-[#795037] truncate">
                                  {isAr ? 'جناح ملكي (Suite)' : 'Royal Suite'}
                                </span>
                              </div>
                              <div className="font-mono tabular-nums text-end shrink-0">
                                <span className="font-bold text-[#44200F]">${suiteOption.liveNightlyUsd}</span>
                                <span className="text-[10px] text-[#795037]">/{isAr ? 'ل' : 'nt'}</span>
                                <span className="ms-1 text-[11px] text-[#795037]">
                                  (${suiteOption.totalStayUsd.toLocaleString()})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div
                      className="p-3.5 pt-2 border-t border-[#EDE0CC]/60 space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={hotel.directBookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 px-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#44200F] border border-[#C4A177] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                          <span>{isAr ? 'رابط الحجز المباشر' : 'Direct Booking'}</span>
                        </a>

                        {onAssignHotelToRooming && (
                          <button
                            type="button"
                            onClick={() =>
                              onAssignHotelToRooming(hotel, {
                                checkIn: checkInDate,
                                checkOut: checkOutDate,
                                mealPlan,
                              })
                            }
                            className="h-9 px-2.5 rounded-xl bg-[#44200F] hover:bg-[#311509] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition cursor-pointer shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
                            <span>{isAr ? 'إسناد للتسكين' : 'Assign to List'}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#795037]">
                        <a
                          href={hotel.officialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-[#44200F] underline underline-offset-2"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          <span>{isAr ? 'الموقع الرسمي' : 'Official Site'}</span>
                        </a>
                        <span className="font-mono tabular-nums inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{hotel.phone}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. FULLSCREEN HOTEL IMAGE CAROUSEL LIGHTBOX MODAL                     */}
      {/* ===================================================================== */}
      {lightboxHotel && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxHotel(null)}
        >
          <div
            className="bg-[#FAF8F5] rounded-3xl max-w-2xl w-full overflow-hidden border border-[#C4A177]/40 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#44200F] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold">
                  {isAr ? lightboxHotel.hotel.nameAr : lightboxHotel.hotel.nameEn}
                </h3>
                <p className="text-[11px] text-[#EDE0CC]">
                  {isAr ? lightboxHotel.hotel.districtAr : lightboxHotel.hotel.districtEn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxHotel(null)}
                className="text-[#EDE0CC] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {(() => {
                const modalGallery = getHotelCarouselList(lightboxHotel.hotel);
                const total = modalGallery.length;
                const safeIdx = lightboxHotel.index % Math.max(1, total);
                return (
                  <>
                    <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-[#311509]">
                      <img
                        src={modalGallery[safeIdx]}
                        alt={isAr ? lightboxHotel.hotel.nameAr : lightboxHotel.hotel.nameEn}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {total > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxHotel({
                                ...lightboxHotel,
                                index: (safeIdx - 1 + total) % total,
                              })
                            }
                            className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
                          >
                            {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxHotel({
                                ...lightboxHotel,
                                index: (safeIdx + 1) % total,
                              })
                            }
                            className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
                          >
                            {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </button>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {modalGallery.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLightboxHotel({ ...lightboxHotel, index: idx })}
                          className={`h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                            safeIdx === idx ? 'border-[#44200F] scale-[1.02]' : 'border-transparent opacity-70'
                          }`}
                        >
                          <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelSearchEngine;
