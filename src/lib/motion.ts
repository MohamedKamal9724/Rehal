import type { Transition, Variants } from 'motion/react';

/**
 * RIHAL Executive Motion Design Tokens
 * Calibrated specifically for high-frequency B2B tour operators & DMCs:
 * - Ultra-responsive 150ms durations (no sluggish waiting)
 * - Understated cubic-bezier easing [0.16, 1, 0.3, 1]
 * - Subtle scale & micro-translation (no distracting spring bounces)
 * - Full reduced-motion accessibility awareness
 */

export const MOTION_DURATIONS = {
  instant: 0.08,
  micro: 0.12,
  executive: 0.15, // 150ms standard
  smooth: 0.2,
  deliberate: 0.28,
} as const;

export const MOTION_EASINGS = {
  // Ultra-crisp executive curve (fast initial acceleration, smooth settle)
  executive: [0.16, 1, 0.3, 1] as const,
  // Gentle decel for content reveals
  easeOut: [0, 0, 0.2, 1] as const,
  // Fast exit
  easeIn: [0.4, 0, 1, 1] as const,
} as const;

export const executiveTransition: Transition = {
  duration: MOTION_DURATIONS.executive,
  ease: MOTION_EASINGS.executive,
};

export const microTransition: Transition = {
  duration: MOTION_DURATIONS.micro,
  ease: MOTION_EASINGS.executive,
};

/**
 * Backdrop Variants for Modals & Drawers
 */
export const modalBackdropVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeIn,
    },
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(4px)',
    transition: {
      duration: MOTION_DURATIONS.executive,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeIn,
    },
  },
};

/**
 * Modal Dialog Box Variants (Subtle scale 0.985 + 8px y translation)
 */
export const modalDialogVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.985,
    y: 8,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeIn,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.executive,
      ease: MOTION_EASINGS.executive,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: 6,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeIn,
    },
  },
};

/**
 * Slide-over Drawer Variants (Operations Panel, Filters, Mobile Nav)
 */
export const slideOverDrawerVariants: Variants = {
  hidden: (isRtl: boolean = false) => ({
    opacity: 0,
    x: isRtl ? -280 : 280,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeIn,
    },
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: MOTION_DURATIONS.executive,
      ease: MOTION_EASINGS.executive,
    },
  },
  exit: (isRtl: boolean = false) => ({
    opacity: 0,
    x: isRtl ? -240 : 240,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeIn,
    },
  }),
};

/**
 * Tab Content Page Transitions
 */
export const pageTransitionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 5,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeIn,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.executive,
      ease: MOTION_EASINGS.executive,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: MOTION_DURATIONS.instant,
      ease: MOTION_EASINGS.easeIn,
    },
  },
};

/**
 * Staggered Container for Lists, Cards, and Timeline Days
 */
export const staggerListContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035, // 35ms stagger for crisp ripple
      delayChildren: 0.02,
    },
  },
};

/**
 * Staggered Item
 */
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.executive,
      ease: MOTION_EASINGS.executive,
    },
  },
};

/**
 * Interactive Button / Card Hover & Tap Props for Framer Motion
 */
export const executiveButtonMotion = {
  whileHover: {
    scale: 1.012,
    transition: { duration: MOTION_DURATIONS.instant, ease: MOTION_EASINGS.executive },
  },
  whileTap: {
    scale: 0.982,
    transition: { duration: MOTION_DURATIONS.instant, ease: MOTION_EASINGS.executive },
  },
};

export const executiveCardMotion = {
  whileHover: {
    y: -2,
    boxShadow: '0 8px 24px -6px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(197, 160, 89, 0.12)',
    transition: { duration: MOTION_DURATIONS.executive, ease: MOTION_EASINGS.executive },
  },
};

/**
 * Toast / Notification Alert Variants
 */
export const toastNotificationVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: MOTION_DURATIONS.executive,
      ease: MOTION_EASINGS.executive,
    },
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.96,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.easeIn,
    },
  },
};
