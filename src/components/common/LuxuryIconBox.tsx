import React from 'react';

export type LuxuryIconBoxVariant =
  | 'primary'
  | 'espresso'
  | 'gold'
  | 'sand'
  | 'emerald'
  | 'amber'
  | 'sky'
  | 'blue'
  | 'rose'
  | 'purple';

export type LuxuryIconBoxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LuxuryIconBoxProps {
  children: React.ReactNode;
  variant?: LuxuryIconBoxVariant;
  size?: LuxuryIconBoxSize;
  className?: string;
  title?: string;
  'aria-hidden'?: boolean;
}

const SIZE_CLASSES: Record<LuxuryIconBoxSize, string> = {
  xs: 'luxury-icon-box-xs',
  sm: 'luxury-icon-box-sm',
  md: 'luxury-icon-box-md',
  lg: 'luxury-icon-box-lg',
  xl: 'luxury-icon-box-xl',
};

const VARIANT_CLASSES: Record<LuxuryIconBoxVariant, string> = {
  primary: 'luxury-icon-box-primary',
  espresso: 'luxury-icon-box-espresso',
  gold: 'luxury-icon-box-gold',
  sand: 'luxury-icon-box-sand',
  emerald: 'luxury-icon-box-emerald',
  amber: 'luxury-icon-box-amber',
  sky: 'luxury-icon-box-sky',
  blue: 'luxury-icon-box-blue',
  rose: 'luxury-icon-box-rose',
  purple: 'luxury-icon-box-purple',
};

/**
 * Standardized Luxury Icon Container Component (RIHAL Brand Aligned)
 * Features consistent corner rounding, subtle layered shadows, and high-contrast luxury Egyptian palettes.
 */
export const LuxuryIconBox: React.FC<LuxuryIconBoxProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  className = '',
  title,
  'aria-hidden': ariaHidden,
}) => {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.gold;

  return (
    <div
      className={`luxury-icon-box ${sizeClass} ${variantClass} ${className}`.trim()}
      title={title}
      aria-hidden={ariaHidden}
    >
      {children}
    </div>
  );
};
