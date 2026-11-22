import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UILanguage } from '../../types';
import { FarisAvatarIcon } from '../common/FarisAvatarIcon';

interface AISupportFloatingTriggerProps {
  uiLang: UILanguage;
  onOpenSupport: () => void;
  isOpen: boolean;
  userRole?: 'traveler' | 'operator';
}

export const AISupportFloatingTrigger: React.FC<AISupportFloatingTriggerProps> = ({
  uiLang,
  onOpenSupport,
  isOpen,
  userRole = 'traveler',
}) => {
  const isAr = uiLang === 'ar';
  const [showGreetingTooltip, setShowGreetingTooltip] = useState(false);
  const [dynamicBottomPx, setDynamicBottomPx] = useState<number>(84);

  useEffect(() => {
    const updateClearance = () => {
      if (typeof window === 'undefined') return;
      const isMobile = window.innerWidth < 768;

      if (!isMobile) {
        setDynamicBottomPx(24);
        return;
      }

      const mobileNav =
        document.querySelector('nav[aria-label="Mobile Navigation"]') ||
        document.querySelector('nav.fixed.bottom-0');

      if (mobileNav) {
        const rect = mobileNav.getBoundingClientRect();
        const clearance = Math.max(84, Math.round(window.innerHeight - rect.top + 20));
        setDynamicBottomPx(clearance);
      } else {
        setDynamicBottomPx(24);
      }
    };

    updateClearance();
    window.addEventListener('resize', updateClearance);
    window.addEventListener('scroll', updateClearance, { passive: true });
    const observer = new MutationObserver(updateClearance);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updateClearance);
      window.removeEventListener('scroll', updateClearance);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreetingTooltip(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isOpen) return null;

  return (
    <div
      style={{ bottom: `${dynamicBottomPx}px` }}
      className="fixed end-4 sm:end-6 z-40 flex items-end gap-2.5 select-none pointer-events-none transition-[bottom] duration-200 ease-out"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Royal Concierge Greeting Card */}
      <AnimatePresence>
        {showGreetingTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto max-w-[260px] sm:max-w-xs bg-white text-[#1E1B18] rounded-2xl shadow-xl border border-[#EDE0CC] overflow-hidden"
          >
            <div className="px-3.5 py-2 bg-[#FAF7F2] text-[#2A1409] flex items-center justify-between border-b border-[#EDE0CC]">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span>{isAr ? 'فارس · مساعد رِحال' : 'Faris · RIHAL Concierge'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGreetingTooltip(false)}
                className="text-[#795037] hover:text-[#2A1409] p-1 rounded-md cursor-pointer transition"
                aria-label="Close tooltip"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 flex items-start gap-2.5">
              <FarisAvatarIcon size={32} className="w-8 h-8 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#2A1409] leading-relaxed font-medium">
                  {isAr
                    ? userRole === 'operator'
                      ? 'اسألني عن مواقع الأفواج، كشوف التسكين، أو حجوزات الفنادق.'
                      : 'شارك كود رحلتك أو اسأل عن برنامج اليوم والفنادق المعتمدة.'
                    : userRole === 'operator'
                      ? 'Ask about live group locations, rooming lists, or hotel bookings.'
                      : 'Unlock your trip passcode, daily schedule, or agency WhatsApp.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowGreetingTooltip(false);
                    onOpenSupport();
                  }}
                  className="mt-2.5 h-8 px-3 rounded-xl bg-[#44200F] hover:bg-[#5C2D16] text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>{isAr ? 'فتح المحادثة' : 'Open Chat'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean 2D Faris Floating Trigger */}
      <motion.button
        type="button"
        onClick={onOpenSupport}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="pointer-events-auto relative flex items-center gap-2.5 p-1.5 rounded-full bg-[#44200F] hover:bg-[#5C2D16] shadow-lg border border-[#C4A177]/60 transition-all cursor-pointer group shrink-0"
        title={isAr ? 'فارس · مساعد رِحال' : 'Faris · RIHAL Concierge'}
        aria-label="Chat with Faris"
      >
        <FarisAvatarIcon size={40} showStatusIndicator={true} className="w-10 h-10 shrink-0" />
        <div className="hidden sm:flex flex-col pe-3.5 ps-0.5 text-start">
          <span className="text-xs font-bold text-white leading-tight whitespace-nowrap">
            {isAr ? 'فارس' : 'Faris'}
          </span>
          <span className="text-[10px] font-medium text-[#EDE0CC] leading-tight whitespace-nowrap">
            {isAr ? 'اسأل عن رحلتك' : 'Ask Concierge'}
          </span>
        </div>
      </motion.button>
    </div>
  );
};
