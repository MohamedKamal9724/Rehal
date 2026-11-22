import React from 'react';

interface FarisAvatarIconProps {
  className?: string;
  size?: number;
  showStatusIndicator?: boolean;
}

interface MessageBotDuotoneIconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
  primaryColor?: string;
  secondaryColor?: string;
  secondaryOpacity?: number;
}

/**
 * Duotone-solid message-bot icon inspired by FontAwesome `message-bot`:
 * - Secondary duotone layer: rounded speech bubble with bottom-left tail
 * - Primary solid layer: top antenna + stem, side ear nodes, twin bot eyes
 */
export const MessageBotDuotoneIcon: React.FC<MessageBotDuotoneIconProps> = ({
  className = 'w-4 h-4',
  style,
  size,
  primaryColor = 'currentColor',
  secondaryColor = 'currentColor',
  secondaryOpacity = 0.35,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Secondary Duotone Layer: Speech Bubble + Tail */}
      <path
        d="M20 18H44C49.5228 18 54 22.4772 54 28V39C54 44.5228 49.5228 49 44 49H28.5L16.2 57.2C15.1 57.93 13.7 57.02 14.1 55.75L16.8 48.2C12.75 46.85 10 43.25 10 39V28C10 22.4772 14.4772 18 20 18Z"
        fill={secondaryColor}
        fillOpacity={secondaryOpacity}
      />

      {/* Primary Solid Layer: Antenna Tip & Stem */}
      <circle cx="32" cy="8.5" r="3.75" fill={primaryColor} />
      <rect x="30" y="11" width="4" height="7" rx="2" fill={primaryColor} />

      {/* Primary Solid Layer: Left & Right Ear Nodes */}
      <rect x="4" y="27.5" width="4.5" height="12" rx="2.25" fill={primaryColor} />
      <rect x="55.5" y="27.5" width="4.5" height="12" rx="2.25" fill={primaryColor} />

      {/* Primary Solid Layer: Twin Circular Bot Eyes */}
      <circle cx="24.5" cy="33.5" r="3.75" fill={primaryColor} />
      <circle cx="39.5" cy="33.5" r="3.75" fill={primaryColor} />
    </svg>
  );
};

/**
 * Faris (فارس) Assistant Icon Badge
 * Renders the duotone-solid message-bot emblem inside a crisp champagne/espresso circular medallion
 * that stays legible across 16px nav buttons, 32px chat bubbles, and 40px floating triggers.
 */
export const FarisAvatarIcon: React.FC<FarisAvatarIconProps> = ({
  className = 'w-10 h-10',
  size = 40,
  showStatusIndicator = false,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
        aria-hidden="true"
      >
        {/* Clean Champagne/Cream Circular Medallion */}
        <circle cx="32" cy="32" r="30" fill="#FAF7F2" stroke="#C4A177" strokeWidth="2.5" />

        {/* Centered Duotone-Solid Message-Bot Symbol */}
        <g transform="translate(11, 11) scale(0.65625)">
          <path
            d="M20 18H44C49.5228 18 54 22.4772 54 28V39C54 44.5228 49.5228 49 44 49H28.5L16.2 57.2C15.1 57.93 13.7 57.02 14.1 55.75L16.8 48.2C12.75 46.85 10 43.25 10 39V28C10 22.4772 14.4772 18 20 18Z"
            fill="#C4A177"
            fillOpacity="0.55"
          />
          <circle cx="32" cy="8.5" r="3.75" fill="#44200F" />
          <rect x="30" y="11" width="4" height="7" rx="2" fill="#44200F" />
          <rect x="4" y="27.5" width="4.5" height="12" rx="2.25" fill="#44200F" />
          <rect x="55.5" y="27.5" width="4.5" height="12" rx="2.25" fill="#44200F" />
          <circle cx="24.5" cy="33.5" r="3.75" fill="#44200F" />
          <circle cx="39.5" cy="33.5" r="3.75" fill="#44200F" />
        </g>
      </svg>

      {/* Online Status Dot */}
      {showStatusIndicator && (
        <span
          className="absolute -top-0.5 -end-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-2xs"
          title="Active"
        />
      )}
    </div>
  );
};
