import React from 'react';
import { 
  Play, Pause, RotateCcw, FastForward, Route as RouteIcon, 
  Clock, MapPin, Hotel, Landmark, Calendar, Plus, Truck, Utensils
} from 'lucide-react';
import { RoadStopObject } from '../../lib/roadmapTypes';
import { UILanguage } from '../../types';

interface RoadTimelineBarProps {
  stops: RoadStopObject[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onAddDay: () => void;
  totalDays: number;
  uiLang: UILanguage;
  isSimulatingDrive: boolean;
  onToggleSimulate: () => void;
  onResetSimulate: () => void;
  driveSpeed: number;
  onChangeSpeed: (speed: number) => void;
  totalDistanceKm: number;
  totalDurationMinutes: number;
}

export const RoadTimelineBar: React.FC<RoadTimelineBarProps> = ({
  stops,
  selectedDay,
  onSelectDay,
  onAddDay,
  totalDays,
  uiLang,
  isSimulatingDrive,
  onToggleSimulate,
  onResetSimulate,
  driveSpeed,
  onChangeSpeed,
  totalDistanceKm,
  totalDurationMinutes,
}) => {
  const isAr = uiLang === 'ar';

  const hotelCount = stops.filter(s => s.category === 'hotel').length;
  const sightCount = stops.filter(s => s.category === 'sightseeing').length;
  const mealCount = stops.filter(s => s.category === 'meal').length;

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-3" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Controls: Day Tabs + Simulation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Day Stepper Tabs */}
        <div className="luxury-tab-bar flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap">
          <button
            type="button"
            onClick={() => onSelectDay(0)}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
              selectedDay === 0
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{isAr ? 'كل الأيام' : 'All Road'}</span>
            <span className="font-mono text-[10px] opacity-70">({stops.length})</span>
          </button>

          {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
            const dayStopCount = stops.filter(s => s.dayNumber === day).length;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedDay === day
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Day {day}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                  selectedDay === day ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {dayStopCount}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onAddDay}
            className="px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50 text-slate-500 hover:text-sky-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
            title={isAr ? 'إضافة يوم جديد للمسار' : 'Add another day'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? '+ يوم' : '+ Day'}</span>
          </button>
        </div>

        {/* Interactive Tour Drive Simulation Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={onToggleSimulate}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isSimulatingDrive
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-white text-slate-800 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {isSimulatingDrive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>{isAr ? 'إيقاف مؤقت' : 'Pause Drive'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                  <span>{isAr ? 'محاكاة رحلة الحافلة' : 'Simulate Drive'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onResetSimulate}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title={isAr ? 'إعادة ضبط المحاكاة' : 'Reset to Start'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onChangeSpeed(driveSpeed === 1 ? 2 : 1)}
              className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-0.5"
              title="Toggle speed"
            >
              <FastForward className="w-3 h-3 text-sky-600" />
              <span>{driveSpeed}x</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Indicators: Distance, Transit Time, Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2 border border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <RouteIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'إجمالي مسافة الطريق' : 'Total Road Distance'}
            </div>
            <div className="font-extrabold text-slate-900 font-mono truncate">
              {totalDistanceKm > 0 ? `${totalDistanceKm} km` : 'Calculating...'}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2 border border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'زمن القيادة والمسار' : 'Estimated Drive Time'}
            </div>
            <div className="font-extrabold text-slate-900 font-mono truncate">
              {totalDurationMinutes > 0 ? formatDuration(totalDurationMinutes) : 'Calculating...'}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2 border border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'المحطات المجدولة' : 'Scheduled Stops'}
            </div>
            <div className="font-extrabold text-slate-900 font-mono truncate">
              {stops.length} <span className="text-[11px] font-normal text-slate-500">{isAr ? 'محطة' : 'stops'}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between border border-slate-100 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-amber-700">
            <Hotel className="w-3.5 h-3.5" />
            <span className="font-bold">{hotelCount}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700">
            <Landmark className="w-3.5 h-3.5" />
            <span className="font-bold">{sightCount}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-700">
            <Utensils className="w-3.5 h-3.5" />
            <span className="font-bold">{mealCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
