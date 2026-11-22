import React, { useState } from 'react';
import { 
  X, CheckCircle2, Star, MessageSquare, Send, Share2, 
  MapPin, Globe, Users, Sparkles, Check, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UILanguage } from '../../types';
import { TravelerFeedPostItem, TRAVELER_FEED_POSTS } from '../../lib/travelerFeedData';
import { findDirectoryAgencyById, getAllDirectoryAgencies } from '../../lib/agenciesData';
import { TravelerGridPost } from './TravelerGridPost';

interface TravelerAgencyProfileModalProps {
  agencyId: string;
  uiLang: UILanguage;
  onClose: () => void;
  onSelectPost: (post: TravelerFeedPostItem) => void;
  onOpenInquiry?: (agencyData: any) => void;
}

export const TravelerAgencyProfileModal: React.FC<TravelerAgencyProfileModalProps> = ({
  agencyId,
  uiLang,
  onClose,
  onSelectPost,
  onOpenInquiry,
}) => {
  const isAr = uiLang === 'ar';
  const [copiedLink, setCopiedLink] = useState(false);

  // Find agency from directory and posts
  const allAgencies = getAllDirectoryAgencies();
  const agency = findDirectoryAgencyById(agencyId) || allAgencies[0];
  const agencyPosts = TRAVELER_FEED_POSTS.filter(p => p.agencyId === agencyId);
  const postsToShow = agencyPosts.length > 0 ? agencyPosts : TRAVELER_FEED_POSTS.slice(0, 3);

  const cleanWhatsApp = agency.whatsappNumber.replace(/[^0-9]/g, '');
  const waMessage = encodeURIComponent(
    isAr 
      ? `مرحباً ${agency.arabicName}، رأيت بروفايلكم على ريحال وأود الاستفسار عن برامج الرحلات المتاحة.` 
      : `Hello ${agency.name}, I found your agency profile on RIHAL and would like to inquire about tour packages.`
  );
  const waUrl = `https://wa.me/${cleanWhatsApp || '201000000000'}?text=${waMessage}`;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Instagram Story Highlights for this agency
  const highlights = [
    { id: 'h1', titleAr: 'الكروز الفاخر', titleEn: 'Nile Cruise', img: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=300&q=80' },
    { id: 'h2', titleAr: 'الأهرامات VIP', titleEn: 'Pyramids VIP', img: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=300&q=80' },
    { id: 'h3', titleAr: 'البحر الأحمر', titleEn: 'Red Sea', img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=300&q=80' },
    { id: 'h4', titleAr: 'آراء المسافرين', titleEn: 'Reviews', img: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=300&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200"
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">
              @{agency.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}
            </span>
            <CheckCircle2 className="w-4 h-4 fill-sky-500 text-white" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Creator Profile Top Row */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Avatar with Instagram Gradient Ring */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5 bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C] shadow-md">
                <img
                  src={agency.logoUrl}
                  alt={agency.name}
                  className="w-full h-full rounded-full object-cover bg-white p-0.5"
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex-1 flex items-center justify-around text-center">
              <div>
                <div className="font-black text-lg sm:text-xl text-slate-900">{postsToShow.length + 8}</div>
                <div className="text-[11px] text-slate-500 font-medium">{isAr ? 'برامج وتجارب' : 'Posts'}</div>
              </div>
              <div>
                <div className="font-black text-lg sm:text-xl text-slate-900">{agency.reviewCount * 12}+</div>
                <div className="text-[11px] text-slate-500 font-medium">{isAr ? 'مسافر سعيد' : 'Travelers'}</div>
              </div>
              <div>
                <div className="font-black text-lg sm:text-xl text-amber-600 flex items-center justify-center gap-1">
                  <span>{agency.rating.toFixed(1)}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-[11px] text-slate-500 font-medium">({agency.reviewCount} {isAr ? 'تقييم' : 'reviews'})</div>
              </div>
            </div>
          </div>

          {/* Bio & Details */}
          <div className="space-y-2">
            <h2 className="font-extrabold text-slate-900 text-base leading-snug">
              {isAr ? agency.arabicName : agency.name}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAr ? 'منظم رحلات معتمد ونشط' : 'Verified Incoming Tour Operator'}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed pt-1">
              {isAr ? agency.descriptionAr : agency.description}
            </p>

            {/* Address & Languages */}
            <div className="pt-2 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#795037]" />
                <span>{isAr ? agency.addressAr : agency.address}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#795037]" />
                <span>{agency.supportedLanguages.join(' • ')}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: WhatsApp (Instagram DM style) + Request Quote + Share */}
          <div className="grid grid-cols-12 gap-2 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-6 sm:col-span-7 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isAr ? 'مراسلة عبر واتساب' : 'WhatsApp Message'}</span>
            </a>

            {onOpenInquiry ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInquiry(agency);
                }}
                className="col-span-4 sm:col-span-4 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#C4A177] font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'طلب عرض' : 'Get Quote'}</span>
              </button>
            ) : (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-4 sm:col-span-4 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#C4A177] font-bold text-xs shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'طلب عرض' : 'Get Quote'}</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="col-span-2 sm:col-span-1 flex items-center justify-center py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title={isAr ? 'مشاركة البروفايل' : 'Share Profile'}
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Highlights Circles (Instagram style) */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              {isAr ? 'أبرز البرامج والقصص' : 'Story Highlights'}
            </span>
            <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-none">
              {highlights.map(hl => (
                <div key={hl.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-slate-200 group-hover:bg-[#C4A177] transition">
                    <img
                      src={hl.img}
                      alt={hl.titleEn}
                      className="w-full h-full rounded-full object-cover p-0.5 bg-white"
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-700 max-w-[65px] text-center truncate">
                    {isAr ? hl.titleAr : hl.titleEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Posts Grid Header */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isAr ? 'البرامج والرحلات المصورة' : 'Featured Tour Packages'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {postsToShow.length} {isAr ? 'برامج' : 'tours'}
              </span>
            </div>

            {/* 3-Column Grid */}
            <div className="grid grid-cols-3 gap-2">
              {postsToShow.map(post => (
                <TravelerGridPost
                  key={post.id}
                  post={post}
                  uiLang={uiLang}
                  onSelect={(p) => {
                    onClose();
                    onSelectPost(p);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
