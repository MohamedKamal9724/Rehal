import React from 'react';
import { Heart, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';
import { TravelerFeedPostItem } from '../../lib/travelerFeedData';
import { UILanguage } from '../../types';

interface TravelerGridPostProps {
  post: TravelerFeedPostItem;
  uiLang: UILanguage;
  isLiked?: boolean;
  onSelect: (post: TravelerFeedPostItem) => void;
  onSelectAgency?: (agencyId: string) => void;
}

export const TravelerGridPost: React.FC<TravelerGridPostProps> = ({
  post,
  uiLang,
  isLiked = false,
  onSelect,
}) => {
  const isAr = uiLang === 'ar';
  const coverImage = (post.photos && post.photos[0]) || (post.images && post.images[0]) || 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80';
  const hasMultiplePhotos = Boolean((post.photos && post.photos.length > 1) || (post.images && post.images.length > 1));

  return (
    <div
      onClick={() => onSelect(post)}
      className="group relative aspect-square bg-slate-900 overflow-hidden rounded-2xl cursor-pointer select-none shadow-xs hover:shadow-md transition-all duration-300"
    >
      {/* Background Image */}
      <img
        src={coverImage}
        alt={isAr ? post.titleAr : post.titleEn}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Multiple Photos Icon Indicator in top right */}
      {hasMultiplePhotos && (
        <div className="absolute top-2.5 end-2.5 z-10 w-6 h-6 rounded-md bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
          <ImageIcon className="w-3.5 h-3.5 drop-shadow-xs" />
        </div>
      )}

      {/* Featured / Signature badge */}
      {post.isFeatured && (
        <div className="absolute top-2.5 start-2.5 z-10 px-2 py-0.5 rounded-full bg-[#44200F]/90 backdrop-blur-xs text-[#C4A177] text-[10px] font-bold border border-[#C4A177]/40 flex items-center gap-1 shadow-xs">
          <Sparkles className="w-2.5 h-2.5 text-[#C4A177]" />
          <span>{isAr ? 'مميز' : 'Featured'}</span>
        </div>
      )}

      {/* Persistent Price Tag on Mobile / Compact */}
      <div className="absolute bottom-2 start-2 z-10 md:hidden bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">
        ${post.priceUsd}
      </div>

      {/* Dark Overlay on Hover (Desktop & Mobile Tap) */}
      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 text-white">
        {/* Top Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-amber-200 truncate max-w-[140px]">
            {isAr ? (post.agencyNameAr || post.agencyArabicName) : (post.agencyNameEn || post.agencyName)}
          </span>
          <span className="bg-[#C4A177] text-[#44200F] text-[11px] font-extrabold px-2 py-0.5 rounded-md">
            ${post.priceUsd}
          </span>
        </div>

        {/* Center Stats (Instagram style: Likes & Duration) */}
        <div className="flex items-center justify-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'fill-white text-white'}`} />
            <span>{(post.likesCount + (isLiked ? 1 : 0)).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-white" />
            <span>{isAr ? (post.durationDaysAr || `${post.durationDays} أيام`) : (post.durationDaysEn || `${post.durationDays} Days`)}</span>
          </div>
        </div>

        {/* Bottom Title */}
        <div className="text-[11px] font-semibold text-slate-200 line-clamp-1 text-center">
          {isAr ? post.titleAr : post.titleEn}
        </div>
      </div>
    </div>
  );
};
