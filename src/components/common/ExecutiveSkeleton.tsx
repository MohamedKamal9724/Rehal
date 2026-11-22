import React from 'react';
import { Compass, Database, TrendingUp, Layers, Sparkles } from 'lucide-react';

export interface ExecutiveSkeletonProps {
  variant?: 'dashboard' | 'rate-library' | 'table' | 'cards' | 'custom';
  rows?: number;
  cardsCount?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Base Shimmer Box Primitive matching Egyptian Luxury DMC Palette
 */
export const SkeletonBox: React.FC<{
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}> = ({ className = 'h-4 w-full', rounded = 'lg' }) => {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      aria-hidden="true"
      className={`executive-shimmer-sweep border border-[#E8DEC8]/60 ${roundedClasses} ${className}`}
    />
  );
};

/**
 * Dashboard Layout Skeleton
 * Replaces loading spinners for high-level operations, KPI counters & pipelines
 */
export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 animate-executive-entry ${className}`} role="status" aria-label="Loading dashboard operations">
      {/* 1. Executive Operations Header */}
      <div className="bg-[#FAF8F5] border border-[#E5DECF] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <SkeletonBox className="h-6 w-52" rounded="lg" />
            <SkeletonBox className="h-5 w-20" rounded="sm" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-3.5 w-32" rounded="sm" />
            <span className="text-[#C5A059]">•</span>
            <SkeletonBox className="h-3.5 w-28" rounded="sm" />
            <span className="text-[#C5A059]">•</span>
            <SkeletonBox className="h-3.5 w-24" rounded="sm" />
          </div>
        </div>

        {/* Action Button Placeholders */}
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBox className="h-8 w-28" rounded="xl" />
          <SkeletonBox className="h-8 w-32" rounded="xl" />
          <SkeletonBox className="h-8 w-36" rounded="xl" />
        </div>
      </div>

      {/* 2. 4-Column KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Time-to-Quote', icon: true },
          { label: 'Active Inquiries', icon: true },
          { label: 'Proposal Value', icon: true },
          { label: 'Gross Margin Floor', icon: true },
        ].map((_, idx) => (
          <div
            key={idx}
            className="bg-[#FAF8F5] p-4.5 rounded-2xl border border-[#E5DECF] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-3 w-24" rounded="sm" />
              <div className="w-6 h-6 rounded-lg bg-[#F5EFE6] border border-[#EADBB8]/70" />
            </div>
            <SkeletonBox className="h-7 w-28" rounded="md" />
            <div className="flex items-center gap-2 pt-1 border-t border-[#F0ECE1]">
              <SkeletonBox className="h-2.5 w-16" rounded="sm" />
              <SkeletonBox className="h-2.5 w-20" rounded="sm" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Two-Column Operational Split (Pipeline + Recent Proposals) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Inquiry Pipeline Table */}
        <div className="lg:col-span-2 bg-[#FAF8F5] rounded-2xl border border-[#E5DECF] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#EAE3D5] flex items-center justify-between bg-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-4.5 w-36" rounded="md" />
                <SkeletonBox className="h-4 w-12" rounded="sm" />
              </div>
              <SkeletonBox className="h-3 w-48" rounded="sm" />
            </div>
            <SkeletonBox className="h-7 w-24" rounded="lg" />
          </div>

          <div className="p-4 sm:p-5 space-y-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-[#EAE3D5] bg-white flex items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SkeletonBox className="h-4 w-36" rounded="md" />
                    <SkeletonBox className="h-3.5 w-16" rounded="sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-3 w-24" rounded="sm" />
                    <SkeletonBox className="h-3 w-28" rounded="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <SkeletonBox className="h-5 w-20" rounded="md" />
                  <SkeletonBox className="h-7 w-16" rounded="lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1 Col): Proposal Telemetry Feed */}
        <div className="bg-[#FAF8F5] rounded-2xl border border-[#E5DECF] shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-[#EAE3D5] bg-white space-y-1">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-4.5 w-32" rounded="md" />
              <div className="w-2 h-2 rounded-full bg-[#C5A059]/40" />
            </div>
            <SkeletonBox className="h-3 w-44" rounded="sm" />
          </div>

          <div className="p-4 sm:p-5 space-y-3 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-[#EAE3D5] bg-white space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F5EFE6] to-[#EAE3D5] border border-[#EADBB8]" />
                    <SkeletonBox className="h-3.5 w-24" rounded="sm" />
                  </div>
                  <SkeletonBox className="h-3 w-14" rounded="sm" />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#F5F2EA]">
                  <SkeletonBox className="h-3 w-20" rounded="sm" />
                  <SkeletonBox className="h-4 w-16" rounded="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/**
 * Rate Library Table & Filter Skeleton
 * Matches Egyptian DMC tariffs, supplier categories, and contract margins
 */
export const RateLibrarySkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 6,
  className = '',
}) => {
  return (
    <div className={`space-y-5 animate-executive-entry ${className}`} role="status" aria-label="Loading contracted rate library">
      
      {/* 1. Header Toolbar */}
      <div className="bg-[#FAF8F5] border border-[#E5DECF] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <SkeletonBox className="h-6 w-48" rounded="lg" />
            <SkeletonBox className="h-5 w-24" rounded="sm" />
          </div>
          <SkeletonBox className="h-3.5 w-64" rounded="sm" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBox className="h-8 w-24" rounded="xl" />
          <SkeletonBox className="h-8 w-28" rounded="xl" />
          <SkeletonBox className="h-8 w-36" rounded="xl" />
        </div>
      </div>

      {/* 2. Filter & Navigation Strip */}
      <div className="bg-white border border-[#E5DECF] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <SkeletonBox className="h-8 w-full" rounded="lg" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-8 w-28" rounded="lg" />
          <SkeletonBox className="h-8 w-28" rounded="lg" />
          <SkeletonBox className="h-8 w-24" rounded="lg" />
        </div>
      </div>

      {/* 3. Contract Rates Table Strip */}
      <div className="bg-white border border-[#E5DECF] rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header Strip */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3.5 bg-[#FAF8F5] border-b border-[#EAE3D5] text-xs">
          <div className="col-span-3">
            <SkeletonBox className="h-3 w-28" rounded="sm" />
          </div>
          <div className="col-span-2">
            <SkeletonBox className="h-3 w-20" rounded="sm" />
          </div>
          <div className="col-span-2">
            <SkeletonBox className="h-3 w-24" rounded="sm" />
          </div>
          <div className="col-span-2">
            <SkeletonBox className="h-3 w-20" rounded="sm" />
          </div>
          <div className="col-span-2 text-end">
            <SkeletonBox className="h-3 w-16 ms-auto" rounded="sm" />
          </div>
          <div className="col-span-1 text-end">
            <SkeletonBox className="h-3 w-8 ms-auto" rounded="sm" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#F5F2EA]">
          {Array.from({ length: rows }).map((_, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-[#FAF8F5]/50 transition-colors"
            >
              {/* Supplier & City */}
              <div className="col-span-3 space-y-1">
                <SkeletonBox className="h-4 w-40" rounded="md" />
                <div className="flex items-center gap-1.5">
                  <SkeletonBox className="h-3 w-16" rounded="sm" />
                  <span className="text-[#C5A059] text-[10px]">•</span>
                  <SkeletonBox className="h-3 w-20" rounded="sm" />
                </div>
              </div>

              {/* Service / Room Type */}
              <div className="col-span-2 space-y-1">
                <SkeletonBox className="h-3.5 w-28" rounded="md" />
                <SkeletonBox className="h-2.5 w-16" rounded="sm" />
              </div>

              {/* Season & Validity */}
              <div className="col-span-2 space-y-1">
                <SkeletonBox className="h-3.5 w-24" rounded="md" />
                <SkeletonBox className="h-2.5 w-20" rounded="sm" />
              </div>

              {/* Currency & Basis */}
              <div className="col-span-2 space-y-1">
                <SkeletonBox className="h-3.5 w-20" rounded="md" />
                <SkeletonBox className="h-2.5 w-14" rounded="sm" />
              </div>

              {/* Net Cost & Floor Margin */}
              <div className="col-span-2 text-end space-y-1">
                <SkeletonBox className="h-4 w-20 ms-auto" rounded="md" />
                <SkeletonBox className="h-2.5 w-12 ms-auto" rounded="sm" />
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 flex justify-end">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E5DECF]" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

/**
 * Generic Table Skeleton
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-[#E5DECF] rounded-2xl shadow-xs overflow-hidden ${className}`}>
      <div className="p-4 bg-[#FAF8F5] border-b border-[#EAE3D5] flex justify-between gap-4">
        <SkeletonBox className="h-4 w-32" rounded="md" />
        <SkeletonBox className="h-4 w-20" rounded="md" />
      </div>
      <div className="divide-y divide-[#F5F2EA] p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center justify-between gap-4 pt-2">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <SkeletonBox key={cIdx} className="h-3.5 flex-1" rounded="md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Universal Executive Skeleton Component
 */
export const ExecutiveSkeleton: React.FC<ExecutiveSkeletonProps> & {
  Box: typeof SkeletonBox;
  Dashboard: typeof DashboardSkeleton;
  RateLibrary: typeof RateLibrarySkeleton;
  Table: typeof TableSkeleton;
} = ({
  variant = 'dashboard',
  rows = 6,
  cardsCount = 4,
  className = '',
  children,
}) => {
  if (children) {
    return <div className={className}>{children}</div>;
  }

  switch (variant) {
    case 'dashboard':
      return <DashboardSkeleton className={className} />;
    case 'rate-library':
      return <RateLibrarySkeleton rows={rows} className={className} />;
    case 'table':
      return <TableSkeleton rows={rows} className={className} />;
    default:
      return <DashboardSkeleton className={className} />;
  }
};

ExecutiveSkeleton.Box = SkeletonBox;
ExecutiveSkeleton.Dashboard = DashboardSkeleton;
ExecutiveSkeleton.RateLibrary = RateLibrarySkeleton;
ExecutiveSkeleton.Table = TableSkeleton;
