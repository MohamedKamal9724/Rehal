import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, MapPin, Clock, Calendar, 
  Users, Plane, Check, MessageSquare, Send, ShieldCheck, 
  Compass, ArrowRight, ArrowLeft, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { AgencyTrip } from '../../lib/agencyTripsData';

interface AgencyTripDetailModalProps {
  trip: AgencyTrip;
  isOpen: boolean;
  isAr: boolean;
  agencyName: string;
  agencyWhatsApp: string;
  onClose: () => void;
  onRequestQuote: (trip: AgencyTrip) => void;
}

export const AgencyTripDetailModal: React.FC<AgencyTripDetailModalProps> = ({
  trip,
  isOpen,
  isAr,
  agencyName,
  agencyWhatsApp,
  onClose,
  onRequestQuote,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Reset photo index when trip changes
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [trip.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activePhotoIndex]);

  if (!isOpen) return null;

  const currentPhoto = trip.photos[activePhotoIndex] || trip.photos[0];

  const handleNextPhoto = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActivePhotoIndex((prev) => (prev + 1) % trip.photos.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrevPhoto = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActivePhotoIndex((prev) => (prev - 1 + trip.photos.length) % trip.photos.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handleSelectThumbnail = (index: number) => {
    if (index === activePhotoIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActivePhotoIndex(index);
      setIsTransitioning(false);
    }, 150);
  };

  // WhatsApp link tailored specifically to this trip
  const cleanPhone = agencyWhatsApp.replace(/\D/g, '');
  const waMsg = encodeURIComponent(
    isAr
      ? `مرحباً، أود الاستفسار عن تفاصيل رحلة (${trip.titleAr}) المنشورة في بروفايل الشركة عبر منصة رِحال.`
      : `Hello, I would like to inquire about (${trip.titleEn}) via RIHAL Travel Portal.`
  );
  const waUrl = `https://wa.me/${cleanPhone || '201000000000'}?text=${waMsg}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-[#EDE0CC] shadow-2xl flex flex-col my-auto"
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Close Button */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-[#EDE0CC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C4A177] shrink-0" />
            <span className="text-xs font-semibold text-[#795037] truncate">
              {agencyName} · {isAr ? trip.categoryLabelAr : trip.categoryLabelEn}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#FAF7F2] text-[#44200F] hover:bg-[#EDE0CC] transition cursor-pointer shrink-0"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. INTERACTIVE IMAGE SLIDER & GALLERY WITH SMOOTH TRANSITIONS */}
        <div className="bg-[#44200F] relative">
          {/* Pure Clean Media Box - Zero Overlaid Text or Badges */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden flex items-center justify-center">
            {currentPhoto && (
              <img
                key={currentPhoto.url}
                src={currentPhoto.url}
                alt={isAr ? currentPhoto.captionAr : currentPhoto.captionEn}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isTransitioning ? 'opacity-40 scale-102' : 'opacity-100 scale-100'
                }`}
              />
            )}

            {/* Slider Navigation Arrows */}
            {trip.photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition shadow-lg cursor-pointer z-10"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md flex items-center justify-center transition shadow-lg cursor-pointer z-10"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Clean Dedicated Photo Details Bar Below Image (Zero Overlays) */}
          <div className="px-4 py-3 bg-[#321609] border-t border-[#44200F] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-[#44200F] text-[#C4A177] font-mono font-bold text-[11px] border border-[#C4A177]/30 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{activePhotoIndex + 1} / {trip.photos.length}</span>
              </span>

              {currentPhoto?.location && (
                <span className="text-[#EDE0CC] font-medium flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[#C4A177]" />
                  <span>{currentPhoto.location}</span>
                </span>
              )}
            </div>

            {currentPhoto && (
              <p className="text-white/90 text-xs font-medium leading-relaxed sm:text-right">
                {isAr ? currentPhoto.captionAr : currentPhoto.captionEn}
              </p>
            )}
          </div>

          {/* Thumbnail Strip with Active Gold Ring Indicator */}
          {trip.photos.length > 1 && (
            <div className="p-3 bg-[#321609] border-t border-[#44200F] flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
              {trip.photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectThumbnail(idx)}
                  className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 transition-all duration-200 cursor-pointer ${
                    activePhotoIndex === idx
                      ? 'ring-2 ring-[#C4A177] scale-105 opacity-100 shadow-md'
                      : 'opacity-50 hover:opacity-85'
                  }`}
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. ESSENTIAL TRIP DETAILS BODY - CLEAN, SPACIOUS, ZERO OVERLAP */}
        <div className="p-5 sm:p-8 space-y-6 bg-white">
          
          {/* Main Title, Duration, Price Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EDE0CC]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] text-xs font-bold">
                  {isAr ? trip.durationAr : trip.durationEn}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-700" />
                  <span>{isAr ? trip.groupCapacityAr : trip.groupCapacity}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#44200F] leading-snug">
                {isAr ? trip.titleAr : trip.titleEn}
              </h2>
            </div>

            <div className="text-left md:text-right shrink-0 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EDE0CC]">
              <span className="text-[10px] text-[#795037] block font-semibold uppercase tracking-wider">
                {isAr ? 'السعر التقديري المعتمد' : 'Official Package Rate'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#44200F] font-mono">${trip.priceUsd}</span>
                <span className="text-xs text-[#795037]">{isAr ? '/ مسافر' : '/ pax'}</span>
              </div>
            </div>
          </div>

          {/* 3. ARRIVAL & DEPARTURE SCHEDULE HIGHLIGHT CARDS (مواعيد وصول الناس ومغادرتهم) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#795037] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'مواعيد الاستقبال والمغادرة الرسمية للرحلة' : 'Official Arrival & Departure Schedule'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* ARRIVAL CARD (موعد الوصول) */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Plane className="w-4 h-4 rotate-45" />
                    </span>
                    <span className="text-xs font-extrabold text-emerald-950">
                      {isAr ? 'موعد وصول المسافرين' : 'Travelers Arrival Schedule'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono text-xs font-bold border border-emerald-300/60">
                    {isAr ? trip.arrival.timeAr : trip.arrival.time}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-emerald-900/90">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <span className="font-semibold">{isAr ? trip.arrival.locationAr : trip.arrival.locationEn}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed ps-5">
                    {isAr ? trip.arrival.protocolAr : trip.arrival.protocolEn}
                  </p>
                </div>
              </div>

              {/* DEPARTURE CARD (موعد المغادرة) */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#44200F] text-[#C4A177] flex items-center justify-center shrink-0 shadow-xs">
                      <Plane className="w-4 h-4 -rotate-45" />
                    </span>
                    <span className="text-xs font-extrabold text-[#44200F]">
                      {isAr ? 'موعد مغادرة وتوديع الفوج' : 'Departure & Farewell Schedule'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#EDE0CC] text-[#44200F] font-mono text-xs font-bold border border-[#C4A177]/40">
                    {isAr ? trip.departure.timeAr : trip.departure.time}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#795037]">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C4A177] shrink-0 mt-0.5" />
                    <span className="font-semibold text-[#44200F]">
                      {isAr ? trip.departure.locationAr : trip.departure.locationEn}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed ps-5">
                    {isAr ? trip.departure.protocolAr : trip.departure.protocolEn}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* 4. GEOGRAPHIC ROUTE & DESTINATIONS (مكان الرحلة) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#795037] uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'المكان وخط السير الجغرافي' : 'Route & Destinations'}</span>
            </h3>

            <div className="flex items-center gap-2 flex-wrap p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC]">
              {(isAr ? trip.destinationsAr : trip.destinations).map((dest, i, arr) => (
                <React.Fragment key={dest}>
                  <span className="px-3 py-1 bg-white text-[#44200F] border border-[#EDE0CC] rounded-xl text-xs font-bold shadow-2xs">
                    {dest}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-[#C4A177] text-xs font-bold">
                      {isAr ? '←' : '→'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 5. SUMMARY & HIGHLIGHTS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#795037] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'نبذة عن البرنامج وأبرز المعالم' : 'Trip Summary & Highlights'}</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {isAr ? trip.summaryAr : trip.summaryEn}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {(isAr ? trip.highlightsAr : trip.highlightsEn).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC]/70 text-xs text-slate-800">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. ACTION BUTTONS (طلب عرض سعر ومحادثة واتساب) */}
          <div className="pt-4 border-t border-[#EDE0CC] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isAr ? 'استفسار عبر واتساب عن هذه الرحلة' : 'Ask on WhatsApp about this Trip'}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestQuote(trip);
              }}
              className="py-3 px-4 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isAr ? 'طلب عرض سعر رسمي مخصص' : 'Request Official Custom Quote'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
