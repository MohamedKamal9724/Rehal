import React from 'react';
import { X, Bookmark, Trash2, MessageSquare, ArrowRight, ArrowLeft, Heart, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UILanguage } from '../../types';
import { TravelerFeedPostItem, TRAVELER_FEED_POSTS } from '../../lib/travelerFeedData';

interface TravelerWishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  wishlistIds: string[];
  onToggleWishlist: (postId: string) => void;
  onSelectPost: (post: TravelerFeedPostItem) => void;
}

export const TravelerWishlistDrawer: React.FC<TravelerWishlistDrawerProps> = ({
  isOpen,
  onClose,
  uiLang,
  wishlistIds,
  onToggleWishlist,
  onSelectPost,
}) => {
  const isAr = uiLang === 'ar';
  const savedPosts = TRAVELER_FEED_POSTS.filter(post => wishlistIds.includes(post.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 end-0 max-w-full flex">
            <motion.div
              initial={{ x: isAr ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-s border-slate-200"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Bookmark className="w-4 h-4 fill-rose-600 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {isAr ? 'قائمة الأمنيات والمحفوظات' : 'Saved Wishlist'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {savedPosts.length} {isAr ? 'برامج ووجهات محفوظة' : 'saved tour packages'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {savedPosts.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {isAr ? 'لم تحفظ أي برامج بعد' : 'No Saved Packages Yet'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {isAr 
                        ? 'انقر على أيقونة الحفظ أو انقر نقراً مزدوجاً على صور الرحلات في الخلاصة لحفظها ومقارنتها والتواصل مع شركاتها.'
                        : 'Tap the bookmark icon or double-tap on feed photos to save your dream packages for quick direct booking.'}
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 px-4 py-2 bg-[#44200F] text-[#C4A177] rounded-xl text-xs font-bold transition hover:bg-[#321609] inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Compass className="w-4 h-4" />
                      <span>{isAr ? 'استكشف الخلاصة الآن' : 'Explore Feed Now'}</span>
                    </button>
                  </div>
                ) : (
                  savedPosts.map((post) => {
                    const cleanWhatsApp = post.whatsappNumber.replace(/[^0-9]/g, '');
                    const agencyNameAr = post.agencyNameAr || post.agencyArabicName || 'شركة سياحة';
                    const agencyNameEn = post.agencyNameEn || post.agencyName || 'Tour Operator';
                    const postImg = (post.photos && post.photos[0]) || (post.images && post.images[0]) || 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=400&q=80';
                    const durationStr = isAr 
                      ? (post.durationDaysAr || `${post.durationDays} أيام`) 
                      : (post.durationDaysEn || `${post.durationDays} Days`);

                    const waText = encodeURIComponent(
                      isAr 
                        ? `مرحباً ${agencyNameAr}، رأيت برنامج (${post.titleAr}) المحفوظ بقائمتي على ريحال وأود الاستفسار عن المواعيد والأسعار.`
                        : `Hello ${agencyNameEn}, I saved your package "${post.titleEn}" on RIHAL and would like to check availability and book.`
                    );
                    const waUrl = `https://wa.me/${cleanWhatsApp || '201000000000'}?text=${waText}`;

                    return (
                      <div
                        key={post.id}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-[#C4A177] transition space-y-2 group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={postImg}
                            alt={isAr ? post.titleAr : post.titleEn}
                            className="w-18 h-18 rounded-xl object-cover shrink-0 cursor-pointer"
                            onClick={() => {
                              onClose();
                              onSelectPost(post);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-[#795037] truncate block">
                              {isAr ? agencyNameAr : agencyNameEn}
                            </span>
                            <h4 
                              onClick={() => {
                                onClose();
                                onSelectPost(post);
                              }}
                              className="font-bold text-xs text-slate-900 truncate hover:text-[#44200F] cursor-pointer"
                            >
                              {isAr ? post.titleAr : post.titleEn}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-extrabold text-sm text-[#44200F]">
                                ${post.priceUsd}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                • {durationStr}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onToggleWishlist(post.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title={isAr ? 'حذف من المحفوظات' : 'Remove'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Direct WhatsApp CTA */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{isAr ? 'حجز واستفسار عبر واتساب' : 'Inquire & Book via WhatsApp'}</span>
                        </a>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {savedPosts.length > 0 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 shrink-0 flex items-center justify-between">
                  <span>{isAr ? 'يتم حفظ العناصر على جهازك' : 'Saved locally on your device'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      savedPosts.forEach(p => onToggleWishlist(p.id));
                    }}
                    className="text-rose-600 hover:text-rose-800 font-bold transition cursor-pointer text-xs"
                  >
                    {isAr ? 'مسح الكل' : 'Clear All'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
