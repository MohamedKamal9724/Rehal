import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { 
  modalBackdropVariants, 
  modalDialogVariants, 
  executiveTransition,
  microTransition
} from '../../lib/motion';

export interface ExecutiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
  maxHeightClass?: string;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  headerTheme?: 'luxury-dark' | 'clean-sand' | 'none';
  bodyClassName?: string;
  footer?: React.ReactNode;
}

export const ExecutiveModal: React.FC<ExecutiveModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  headerRight,
  children,
  maxWidthClass = 'max-w-3xl',
  maxHeightClass = 'max-h-[92vh]',
  closeOnBackdrop = true,
  showCloseButton = true,
  headerTheme = 'luxury-dark',
  bodyClassName = 'p-5 sm:p-6',
  footer,
}) => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="executive-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleBackdropClick}
          variants={shouldReduceMotion ? undefined : modalBackdropVariants}
          initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
          animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
          exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
          transition={shouldReduceMotion ? microTransition : executiveTransition}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
        >
          <motion.div
            key="executive-modal-panel"
            ref={modalRef}
            variants={shouldReduceMotion ? undefined : modalDialogVariants}
            initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
            animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
            exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
            transition={shouldReduceMotion ? microTransition : executiveTransition}
            className={`bg-[#FAF8F5] text-slate-900 border border-[#E5DECF] rounded-2xl shadow-2xl w-full ${maxWidthClass} ${maxHeightClass} flex flex-col overflow-hidden will-change-transform`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Rendering */}
            {headerTheme !== 'none' && (title || icon || showCloseButton) && (
              <div
                className={`px-5 sm:px-6 py-4 flex items-center justify-between border-b ${
                  headerTheme === 'luxury-dark'
                    ? 'bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 text-slate-900 border-amber-200/70'
                    : 'bg-white text-slate-900 border-[#E5DECF]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {icon && (
                    <div
                      className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center shadow-xs ${
                        headerTheme === 'luxury-dark'
                          ? 'bg-gradient-to-br from-[#D4AF37] to-[#B38E3F] text-white shadow-xs'
                          : 'bg-[#C5A059]/15 text-[#99772B] border border-[#C5A059]/30'
                      }`}
                    >
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeof title === 'string' ? (
                        <h2 className="text-base font-bold tracking-tight truncate text-slate-900">{title}</h2>
                      ) : (
                        title
                      )}
                      {badge}
                    </div>
                    {subtitle && (
                      <p
                        className="text-xs mt-0.5 truncate text-slate-600"
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {headerRight}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close modal"
                      className="p-1.5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Modal Body */}
            <div className={`overflow-y-auto flex-1 ${bodyClassName}`}>
              {children}
            </div>

            {/* Optional Modal Footer */}
            {footer && (
              <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-[#E5DECF] flex items-center justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
