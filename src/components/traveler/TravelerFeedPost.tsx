import React, { useState, useRef } from 'react';
import { 
  Heart, Bookmark, MessageSquare, Share2, MoreHorizontal, 
  MapPin, ShieldCheck, ChevronLeft, ChevronRight, Check, Sparkles, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TravelerFeedPost as FeedPostType } from '../../lib/travelerFeedData';
import { UILanguage } from '../../types';

interface TravelerFeedPostProps {
  post: FeedPostType;
  uiLang: UILanguage;
  isSaved?: boolean;
  isLiked?: boolean;
  onToggleLike?: (postId: string) => void;
  onToggleSave?: (postId: string) => void;
  onOpenAgencyProfile?: (agencyId: string) => void;
  onOpenInquiry?: (agency: any) => void;
}

export const TravelerFeedPost: React.FC<TravelerFeedPostProps> = ({
  post,
  uiLang,
  isSaved = false,
  isLiked: isLikedProp = false,
  onToggleLike,
  onToggleSave,
  onOpenAgencyProfile,
  onOpenInquiry,
}) => {
  const isAr = uiLang === 'ar';
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLikedInternal, setIsLikedInternal] = useState(isLikedProp);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isExpandedCaption, setIsExpandedCaption] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const isLiked = isLikedProp || isLikedInternal;
  const lastTapRef = useRef<number>(0);

  // Instagram Double-Tap to Like Handler
  const handlePhotoDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Trigger Double Tap
      setShowHeartPop(true);
      if (!isLiked) {
        setIsLikedInternal(true);
        setLikesCount((prev) => prev + 1);
        if (onToggleLike) onToggleLike(post.id);
      }
      setTimeout(() => setShowHeartPop(false), 800);
    }
    lastTapRef.current = now;
  };

  const handleLikeToggle = () => {
    if (isLiked) {
      setIsLikedInternal(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
      if (onToggleLike) onToggleLike(post.id);
    } else {
      setIsLikedInternal(true);
      setLikesCount((prev) => prev + 1);
      setShowHeartPop(true);
      if (onToggleLike) onToggleLike(post.id);
      setTimeout(() => setShowHeartPop(false), 800);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: isAr ? post.titleAr : post.titleEn,
        text: isAr ? post.captionAr : post.captionEn,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleWhatsAppDM = () => {
    const rawNumber = (post.whatsappNumber || '+201000000000').replace(/[^0-9]/g, '');
    const title = isAr ? post.titleAr : post.titleEn;
    const msg = isAr
      ? `مرحباً ${post.agencyArabicName}، أود الاستفسار عن برنامج "${title}" المعروض على منصة ريحال بقيمة $${post.priceUsd.toLocaleString()}.`
      : `Hello ${post.agencyName}, I'm interested in the "${title}" package ($${post.priceUsd.toLocaleString()}) I discovered on RIHAL.`;
    window.open(`https://wa.me/${rawNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <article 
      className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs overflow-hidden max-w-xl mx-auto transition-all"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. POST HEADER (Instagram Creator Profile style) */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onOpenAgencyProfile?.(post.agencyId)}
            className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C] shrink-0 cursor-pointer group"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white p-[1px]">
              <img
                src={post.agencyAvatar}
                alt={post.agencyName}
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition"
              />
            </div>
          </button>

          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onOpenAgencyProfile?.(post.agencyId)}
              className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#44200F] hover:text-[#795037] transition truncate text-start cursor-pointer"
            >
              <span className="truncate">{isAr ? post.agencyArabicName : post.agencyName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </button>
            <div className="flex items-center gap-1 text-[11px] text-[#795037] truncate mt-0.5">
              <MapPin className="w-3 h-3 shrink-0 text-[#C4A177]" />
              <span className="truncate">{isAr ? post.locationAr : post.locationEn}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenAgencyProfile?.(post.agencyId)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-orange-50 text-[#44200F] border border-[#EDE0CC] hover:border-orange-300 transition shrink-0 cursor-pointer"
        >
          {isAr ? 'الملف' : 'Profile'}
        </button>
      </div>

      {/* 2. MEDIA CAROUSEL WITH DOUBLE-TAP HEART ANIMATION */}
      <div 
        className="relative aspect-4/3 sm:aspect-1/1 bg-black overflow-hidden cursor-pointer select-none"
        onClick={handlePhotoDoubleTap}
      >
        <img
          src={post.images[activeImageIdx]}
          alt={isAr ? post.titleAr : post.titleEn}
          className="w-full h-full object-cover transition-opacity duration-200"
          loading="lazy"
        />

        {/* Floating Heart Pop Animation on Double-Tap */}
        <AnimatePresence>
          {showHeartPop && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0.9] }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        {post.images.length > 1 && (
          <>
            {activeImageIdx > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx((prev) => prev - 1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition z-10 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {activeImageIdx < post.images.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx((prev) => prev + 1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition z-10 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Dots Pagination */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
              {post.images.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeImageIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Price & Duration Badge (Floating top-right) */}
        <div className="absolute top-3 end-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-black shadow-md border border-white/20 pointer-events-none flex items-center gap-1.5">
          <span className="font-mono text-amber-300 font-black">${post.priceUsd.toLocaleString()}</span>
          <span className="text-white/40">·</span>
          <span className="text-white/90 font-bold">{post.durationDays} {isAr ? 'أيام' : 'Days'}</span>
        </div>
      </div>

      {/* 3. ACTION BAR (Like, WhatsApp DM, Share, Bookmark) */}
      <div className="p-3.5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Like Heart Button */}
            <button
              type="button"
              onClick={handleLikeToggle}
              className="p-1.5 -m-1.5 text-slate-700 hover:text-rose-600 transition cursor-pointer active:scale-75"
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart className={`w-6 h-6 transition-colors ${
                isLiked ? 'text-rose-600 fill-rose-600' : 'text-[#44200F]'
              }`} />
            </button>

            {/* WhatsApp DM Button */}
            <button
              type="button"
              onClick={handleWhatsAppDM}
              className="p-1.5 -m-1.5 text-[#44200F] hover:text-emerald-600 transition cursor-pointer active:scale-75"
              title={isAr ? 'مراسلة عبر واتساب' : 'Inquire on WhatsApp'}
            >
              <Send className="w-5 h-5" />
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 -m-1.5 text-[#44200F] hover:text-[#795037] transition cursor-pointer active:scale-75"
              title={isAr ? 'مشاركة' : 'Share'}
            >
              {shareCopied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Bookmark / Save to Wishlist Button */}
          <button
            type="button"
            onClick={() => onToggleSave?.(post.id)}
            className="p-1.5 -m-1.5 text-slate-700 hover:text-orange-600 transition cursor-pointer active:scale-75"
            title={isSaved ? (isAr ? 'إزالة من المحفوظات' : 'Saved') : (isAr ? 'حفظ في المفضلة' : 'Save')}
          >
            <Bookmark className={`w-6 h-6 transition-colors ${
              isSaved ? 'text-orange-600 fill-orange-600' : 'text-[#44200F]'
            }`} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="mt-2.5 font-extrabold text-xs text-[#44200F]">
          {likesCount.toLocaleString()} {isAr ? 'إعجاب' : 'likes'}
        </div>

        {/* Post Title & Caption */}
        <div className="mt-1 text-xs text-slate-800 leading-relaxed">
          <span 
            onClick={() => onOpenAgencyProfile?.(post.agencyId)}
            className="font-black text-[#44200F] cursor-pointer hover:underline me-1.5"
          >
            {isAr ? post.agencyArabicName : post.agencyName}
          </span>
          <span className="font-bold text-slate-900 block sm:inline sm:me-1.5">
            {isAr ? post.titleAr : post.titleEn}
          </span>
          <span className="text-[#795037]">
            {isExpandedCaption
              ? (isAr ? post.captionAr : post.captionEn)
              : (isAr ? post.captionAr.slice(0, 110) : post.captionEn.slice(0, 110)) + '...'}
          </span>
          <button
            type="button"
            onClick={() => setIsExpandedCaption(!isExpandedCaption)}
            className="text-[11px] text-slate-500 font-bold hover:underline ms-1 cursor-pointer"
          >
            {isExpandedCaption ? (isAr ? 'أقل' : 'less') : (isAr ? 'المزيد' : 'more')}
          </button>
        </div>

        {/* Travel Hashtags */}
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-[#C4A177] font-medium">
          {post.tags.map((tag) => (
            <span key={tag} className="hover:underline cursor-pointer">
              {tag}
            </span>
          ))}
        </div>

        {/* Inclusions Highlights */}
        <div className="mt-2.5 pt-2.5 border-t border-[#EDE0CC]/60 flex flex-wrap items-center gap-1.5 text-xs text-[#795037]">
          {(isAr ? post.highlightsAr : post.highlightsEn).map((h, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FAF7F2] to-white px-2.5 py-1 rounded-lg border border-[#EDE0CC] text-[11px] font-bold text-[#44200F] shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#C4A177] shrink-0" />
              <span>{h}</span>
            </span>
          ))}
        </div>

        {/* Primary WhatsApp Direct CTA Strip */}
        <div className="mt-3 pt-2.5 border-t border-[#EDE0CC]/60 flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono text-slate-400">
            {isAr ? post.postedTimeAgoAr : post.postedTimeAgoEn}
          </span>

          <button
            type="button"
            onClick={handleWhatsAppDM}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isAr ? 'واتساب مباشر للمنظم' : 'WhatsApp Tour Desk'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
