import React, { useRef } from 'react';
import { 
  Compass, MapPin, Plane, Car, Ship, Calendar, 
  Plus, Clock, Hotel, UserCheck, ArrowRight, Sparkles,
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { QuoteDay, Currency } from '../../types';

interface VisualItineraryTimelineProps {
  days: QuoteDay[];
  selectedDayIndex?: number;
  onSelectDay?: (index: number) => void;
  onAddDay?: () => void;
  isHighlighted?: boolean;
  currency?: Currency;
}

export const VisualItineraryTimeline: React.FC<VisualItineraryTimelineProps> = ({
  days,
  selectedDayIndex,
  onSelectDay,
  onAddDay,
  isHighlighted = false,
  currency = 'USD',
}) => {
  // Helper to determine city color badges matching Egyptian luxury palette
  const getCityBadgeStyle = (city?: string) => {
    const c = (city || '').toLowerCase();
    if (c.includes('cairo') || c.includes('giza')) {
      return {
        bg: 'bg-[#FAF3E0]',
        text: 'text-[#99772B]',
        border: 'border-[#EADBB8]',
        label: 'Cairo & Giza',
      };
    }
    if (c.includes('luxor')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        label: 'Luxor Antiquities',
      };
    }
    if (c.includes('aswan')) {
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-800',
        border: 'border-sky-200',
        label: 'Aswan & Nubia',
      };
    }
    if (c.includes('cruise') || c.includes('nile')) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        label: 'Nile Cruise Sailing',
      };
    }
    if (c.includes('hurghada') || c.includes('sharm') || c.includes('red sea')) {
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-800',
        border: 'border-teal-200',
        label: 'Red Sea Riviera',
      };
    }
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      label: city || 'Egypt',
    };
  };

  // Helper to infer transit connector between consecutive days
  const getTransitConnector = (currCity?: string, nextCity?: string) => {
    if (!nextCity || currCity === nextCity) return null;
    const c1 = (currCity || '').toLowerCase();
    const c2 = (nextCity || '').toLowerCase();

    if ((c1.includes('cairo') && c2.includes('luxor')) || (c1.includes('aswan') && c2.includes('cairo'))) {
      return { icon: Plane, label: 'Domestic Flight' };
    }
    if ((c1.includes('luxor') && c2.includes('aswan')) || (c1.includes('aswan') && c2.includes('luxor'))) {
      return { icon: Ship, label: 'Nile Cruise Convoy' };
    }
    return { icon: Car, label: 'Private VIP Chauffeur' };
  };

  const totalServices = days.reduce((sum, d) => sum + (d.lines?.length || 0), 0);
  const totalDays = days.length;
  const stripRef = useRef<HTMLDivElement>(null);

  const scrollTimeline = (direction: 'left' | 'right') => {
    if (stripRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      stripRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all duration-300 shadow-xs ${
        isHighlighted
          ? 'border-[#C4A177] ring-2 ring-[#C4A177]/40 shadow-md bg-[#FAF7F2]'
          : 'border-[#EDE0CC]'
      }`}
    >
      {/* Timeline Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#EDE0CC]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#44200F] text-[#C4A177] flex items-center justify-center font-bold text-xs shadow-2xs">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#44200F] tracking-tight">Interactive Visual Itinerary Timeline</span>
              {isHighlighted && (
                <span className="text-[10px] font-bold text-[#44200F] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#C4A177]">
                  Spotlight Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#795037]">
              {totalDays} Days · {totalServices} Contracted Services Attached · Geographic Route Sequencing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {/* Back & Next Navigation Arrows */}
          <div className="flex items-center gap-1 bg-[#FAF7F2] p-0.5 rounded-lg border border-[#EDE0CC]">
            <button
              type="button"
              onClick={() => scrollTimeline('left')}
              aria-label="Scroll timeline left"
              title="Previous days in timeline"
              className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-[#44200F] hover:bg-[#FAF7F2] hover:text-[#795037] border border-[#EDE0CC] shadow-2xs transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTimeline('right')}
              aria-label="Scroll timeline right"
              title="Next days in timeline"
              className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-[#44200F] hover:bg-[#FAF7F2] hover:text-[#795037] border border-[#EDE0CC] shadow-2xs transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {onAddDay && (
            <button
              type="button"
              onClick={onAddDay}
              className="px-2.5 py-1 text-[11px] font-bold text-[#44200F] bg-[#FAF7F2] hover:bg-[#EDE0CC] border border-[#EDE0CC] rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3 text-[#44200F]" />
              <span>Add Day Node</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Timeline Strip */}
      <div className="mt-4">
        <div ref={stripRef} className="overflow-x-auto no-scrollbar scroll-smooth px-1">
          <div className="flex items-stretch gap-3 min-w-max pb-2">
          {days.map((day, idx) => {
            const cityBadge = getCityBadgeStyle(day.city);
            const isSelected = selectedDayIndex === idx;
            const hasLines = (day.lines?.length || 0) > 0;
            const nextDay = days[idx + 1];
            const transit = getTransitConnector(day.city, nextDay?.city);

            return (
              <React.Fragment key={day.dayNumber || idx}>
                {/* Day Card Node */}
                <div
                  onClick={() => onSelectDay && onSelectDay(idx)}
                  className={`w-52 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between shrink-0 group ${
                    isSelected
                      ? 'border-[#44200F] bg-[#FAF7F2] shadow-xs ring-2 ring-[#C4A177]/40 scale-[1.01]'
                      : 'border-[#EDE0CC] bg-white hover:border-[#C4A177] hover:bg-[#FAF7F2]/60 hover:-translate-y-0.5 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Top Row: Day Number & City Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#44200F] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-[#44200F] text-[#C4A177] flex items-center justify-center text-[10px] font-bold shadow-2xs">
                          D{day.dayNumber}
                        </span>
                        <span>Day {day.dayNumber}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cityBadge.bg} ${cityBadge.text} ${cityBadge.border}`}>
                        {day.city || 'Cairo'}
                      </span>
                    </div>

                    {/* Day Title */}
                    <div className="text-xs font-bold text-[#44200F] line-clamp-2 leading-tight group-hover:text-[#795037] transition-colors">
                      {day.title || `Day ${day.dayNumber} Schedule`}
                    </div>
                  </div>

                  {/* Bottom Metadata & Service Badges */}
                  <div className="mt-3 pt-2 border-t border-[#EDE0CC] flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-[#795037]">
                      <Clock className="w-3 h-3 text-[#795037]" />
                      <span>{day.lines?.length || 0} service{day.lines?.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="font-mono font-bold text-[#44200F] tabular-nums">
                      ${(day.lines?.reduce((acc, l) => acc + (l.totalPriceQuoteCurrency || 0), 0) || 0).toLocaleString()} {currency}
                    </div>
                  </div>
                </div>

                {/* City Transit Connector (if changing destination) */}
                {transit && (
                  <div className="flex flex-col items-center justify-center px-1 shrink-0 self-center">
                    <div className="w-7 h-7 rounded-full bg-white border border-[#EDE0CC] flex items-center justify-center text-[#44200F] shadow-xs transition-transform duration-150 hover:scale-110">
                      <transit.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-bold text-[#795037] mt-1 whitespace-nowrap">
                      {transit.label}
                    </span>
                    <div className="w-8 border-t-2 border-dashed border-[#EDE0CC] mt-1" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
};
