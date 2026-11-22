import React, { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, MessageSquare, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DestinationStory, StorySlide } from '../../lib/travelerFeedData';
import { UILanguage } from '../../types';

interface TravelerStoryModalProps {
  story: DestinationStory | null;
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  onSelectNextStory?: () => void;
  onSelectPrevStory?: () => void;
  onSelectAgency?: (agencyId: string) => void;
}

export const TravelerStoryModal: React.FC<TravelerStoryModalProps> = ({
  story,
  isOpen,
  onClose,
  uiLang,
  onSelectNextStory,
  onSelectPrevStory,
  onSelectAgency,
}) => {
  const isAr = uiLang === 'ar';
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const SLIDE_DURATION_MS = 5000;
  const UPDATE_INTERVAL_MS = 50;

  useEffect(() => {
    setCurrentSlideIdx(0);
    setProgress(0);
  }, [story?.id]);

  useEffect(() => {
    if (!isOpen || !story) return;

    if (isPaused) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        const increment = (UPDATE_INTERVAL_MS / SLIDE_DURATION_MS) * 100;
        if (prev + increment >= 100) {
          // Go to next slide
          if (story && currentSlideIdx < story.slides.length - 1) {
            setCurrentSlideIdx((c) => c + 1);
            return 0;
          } else {
            // End of this story: move to next story if available or close
            if (onSelectNextStory) {
              onSelectNextStory();
            } else {
              onClose();
            }
            return 0;
          }
        }
        return prev + increment;
      });
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, story, currentSlideIdx, isPaused, onSelectNextStory, onClose]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlideIdx, story]);

  if (!isOpen || !story) return null;

  const currentSlide: StorySlide | undefined = story.slides[currentSlideIdx];
  if (!currentSlide) return null;

  const handleNext = () => {
    if (currentSlideIdx < story.slides.length - 1) {
      setCurrentSlideIdx(currentSlideIdx + 1);
      setProgress(0);
    } else if (onSelectNextStory) {
      onSelectNextStory();
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlideIdx > 0) {
      setCurrentSlideIdx(currentSlideIdx - 1);
      setProgress(0);
    } else if (onSelectPrevStory) {
      onSelectPrevStory();
      setProgress(0);
    }
  };

  const handleWhatsAppInquiry = () => {
    const rawNumber = (currentSlide.whatsappNumber || '+201000000000').replace(/[^0-9]/g, '');
    const title = isAr ? currentSlide.titleAr : currentSlide.titleEn;
    const message = isAr
      ? `مرحباً، شاهدت قصة "${title}" على منصة ريحال وأود الاستفسار عن الأسعار وتفاصيل الحجز.`
      : `Hello, I saw your story "${title}" on RIHAL and would love to inquire about availability and pricing.`;
    window.open(`https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none touch-none animate-fadeIn">
      {/* Background Dim Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Story Container (9:16 vertical ratio) */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md h-[92vh] max-h-[820px] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl flex flex-col justify-between border border-white/10"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Active Slide Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentSlide.id}
            src={currentSlide.imageUrl}
            alt={isAr ? currentSlide.titleAr : currentSlide.titleEn}
            initial={{ opacity: 0.8, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Gradient Overlays for readable text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/70 pointer-events-none" />

        {/* Top Header & Progress Segments */}
        <div className="relative z-10 p-4 space-y-3">
          {/* Segmented Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {story.slides.map((s, idx) => (
              <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{
                    width:
                      idx < currentSlideIdx
                        ? '100%'
                        : idx === currentSlideIdx
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Agency Header Row */}
          <div className="flex items-center justify-between text-white" dir={isAr ? 'rtl' : 'ltr'}>
            <div 
              onClick={() => {
                if (onSelectAgency) {
                  onClose();
                  onSelectAgency(story.agencyId);
                }
              }}
              className={`flex items-center gap-2.5 min-w-0 ${onSelectAgency ? 'cursor-pointer hover:opacity-90' : ''}`}
            >
              <div className="w-9 h-9 rounded-full ring-2 ring-orange-500 overflow-hidden shrink-0 bg-black/40">
                <img
                  src={story.agencyAvatar}
                  alt={story.agencyNameEn}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm truncate">
                    {isAr ? story.agencyNameAr : story.agencyNameEn}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <span className="text-[10px] text-white/70 block truncate">
                  {isAr ? story.destinationAr : story.destinationEn}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white/90 transition cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs flex items-center justify-center text-white/90 transition cursor-pointer"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tap Hotspots: Left 35% (Prev), Right 65% (Next) */}
        <div className="absolute inset-0 flex z-10">
          <div 
            className="w-1/3 h-full cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }} 
            title="Previous" 
          />
          <div 
            className="w-2/3 h-full cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }} 
            title="Next" 
          />
        </div>

        {/* Bottom Slide Content & Direct Inquiry CTA */}
        <div className="relative z-20 p-5 space-y-3" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="space-y-1">
            {currentSlide.packagePriceUsd && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-500 text-white shadow-xs">
                <span>{isAr ? 'يبدأ من' : 'From'}</span>
                <span>${currentSlide.packagePriceUsd.toLocaleString()}</span>
              </span>
            )}
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md">
              {isAr ? currentSlide.titleAr : currentSlide.titleEn}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 line-clamp-2 leading-relaxed drop-shadow-sm">
              {isAr ? currentSlide.subtitleAr : currentSlide.subtitleEn}
            </p>
          </div>

          {/* WhatsApp Direct Action Button */}
          <button
            type="button"
            onClick={handleWhatsAppInquiry}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isAr ? 'تواصل مع المنظم عبر واتساب' : 'Inquire Directly via WhatsApp'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
