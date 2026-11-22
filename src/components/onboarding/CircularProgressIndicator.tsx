import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

export interface CircularProgressIndicatorProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  isArabic?: boolean;
  completedTasks?: number;
  totalTasks?: number;
  showTaskCount?: boolean;
  className?: string;
  sublabel?: string;
}

export const CircularProgressIndicator: React.FC<CircularProgressIndicatorProps> = ({
  percentage,
  size = 'md',
  isArabic = true,
  completedTasks,
  totalTasks,
  showTaskCount = true,
  className = '',
  sublabel,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));

  // Dimension settings
  const config = {
    sm: { diameter: 58, stroke: 5, fontSize: 'text-sm', labelSize: 'text-[9px]' },
    md: { diameter: 92, stroke: 7, fontSize: 'text-xl', labelSize: 'text-[11px]' },
    lg: { diameter: 124, stroke: 9, fontSize: 'text-3xl', labelSize: 'text-xs' },
  }[size];

  const radius = (config.diameter - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const isComplete = clamped === 100;

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {/* SVG Circular Ring */}
      <div 
        className="relative flex items-center justify-center shrink-0"
        style={{ width: config.diameter, height: config.diameter }}
      >
        <svg 
          width={config.diameter} 
          height={config.diameter} 
          className="-rotate-90 transform"
        >
          {/* Background Track */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            stroke="#EDE0CC"
            strokeWidth={config.stroke}
            fill="transparent"
            className="opacity-70"
          />

          {/* Animated Foreground Progress */}
          <motion.circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            stroke={isComplete ? '#10B981' : '#C4A177'}
            strokeWidth={config.stroke}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className={`font-black font-mono tracking-tight text-[#44200F] ${config.fontSize} tabular-nums leading-none`}>
            {clamped}%
          </span>
          {size !== 'sm' && (
            <span className="text-[9px] font-bold text-[#795037] mt-0.5 tracking-wider uppercase">
              {isComplete ? (isArabic ? 'مكتمل' : 'Complete') : (isArabic ? 'إنجاز' : 'Done')}
            </span>
          )}
        </div>
      </div>

      {/* Detail Text & Task Counter */}
      {showTaskCount && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            {isComplete ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isArabic ? 'جاهز للانطلاق والتسجيل' : 'Ready to Launch'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#795037] bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#EDE0CC]">
                <Sparkles className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{sublabel || (isArabic ? 'بناء بيئة العمل' : 'Workspace Setup')}</span>
              </span>
            )}
          </div>

          {completedTasks !== undefined && totalTasks !== undefined && (
            <p className="text-[11px] font-medium text-[#795037] tabular-nums leading-tight">
              {isArabic 
                ? `تم إكمال ${completedTasks} من أصل ${totalTasks} مهمة`
                : `${completedTasks} of ${totalTasks} tasks completed`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
