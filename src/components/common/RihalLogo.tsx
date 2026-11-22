import React from 'react';
import { RIHAL_WORDMARK_PNG_PATH } from '../../assets/rihalLogoBase64';

export interface RihalLogoProps {
  variant?: 'wordmark' | 'horizontal' | 'mark' | 'compact' | 'print';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isArabic?: boolean;
  lightMode?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  clickable?: boolean;
  title?: string;
}

export const RihalLogo: React.FC<RihalLogoProps> = ({
  variant = 'wordmark',
  size = 'md',
  className = '',
  isArabic = false,
  lightMode = false,
  onClick,
  clickable = Boolean(onClick),
  title,
}) => {
  // Height definitions for scaling the 3:1 luxury wordmark
  const heightClasses = {
    sm: 'h-7 md:h-8',
    md: 'h-9 md:h-11',
    lg: 'h-12 md:h-14',
    xl: 'h-16 md:h-20',
  };

  // Mark container sizes
  const markHeightClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    xl: 'h-14 w-14',
  };

  const defaultTitle = title || (isArabic ? 'ريحال | العودة إلى الصفحة الرئيسية' : 'RIHAL | Return to main page');

  const isInteractive = Boolean(onClick || clickable);
  const interactiveClasses = isInteractive
    ? 'cursor-pointer select-none transition-transform duration-150 hover:opacity-90 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#C4A177]/60 rounded-xl p-0.5'
    : '';

  // Only the emblem (left portion of the uploaded luxury logo)
  if (variant === 'mark') {
    const content = (
      <img
        src={RIHAL_WORDMARK_PNG_PATH}
        alt="ريحال | RIHAL"
        className="h-full w-auto max-w-none object-cover object-left"
        loading="eager"
      />
    );

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          title={defaultTitle}
          aria-label={defaultTitle}
          className={`inline-flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs border border-amber-200/60 shrink-0 ${markHeightClasses[size]} ${interactiveClasses} ${className}`}
        >
          {content}
        </button>
      );
    }

    return (
      <div 
        className={`inline-flex items-center justify-center overflow-hidden rounded-xl bg-white shadow-xs border border-amber-200/60 shrink-0 ${markHeightClasses[size]} ${className}`}
        title="ريحال | RIHAL"
      >
        {content}
      </div>
    );
  }

  // Compact variant (used in top navigation bars and sidebars)
  if (variant === 'compact') {
    const imgEl = (
      <img
        src={RIHAL_WORDMARK_PNG_PATH}
        alt="ريحال | RIHAL"
        className={`${heightClasses[size]} w-auto object-contain shrink-0`}
        loading="eager"
      />
    );

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          title={defaultTitle}
          aria-label={defaultTitle}
          className={`inline-flex items-center gap-2 text-start ${interactiveClasses} ${className}`}
        >
          {imgEl}
        </button>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {imgEl}
      </div>
    );
  }

  // Print-optimized variant
  if (variant === 'print') {
    return (
      <div className={`inline-block ${className}`}>
        <img
          src={RIHAL_WORDMARK_PNG_PATH}
          alt="ريحال | RIHAL Luxury Wordmark"
          className="h-14 w-auto object-contain max-w-[280px]"
        />
      </div>
    );
  }

  // Full Luxury Wordmark image directly using the user's uploaded asset
  const fullImg = (
    <img
      src={RIHAL_WORDMARK_PNG_PATH}
      alt="ريحال | RIHAL"
      className={`${heightClasses[size]} w-auto object-contain transition-transform`}
      loading="eager"
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={defaultTitle}
        aria-label={defaultTitle}
        className={`inline-flex items-center text-start ${interactiveClasses} ${className}`}
      >
        {fullImg}
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {fullImg}
    </div>
  );
};
