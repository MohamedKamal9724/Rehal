import React, { useState } from 'react';
import { 
  Hotel, Landmark, Utensils, Camera, Truck, Trash2, 
  Clock, MapPin, Edit3, ChevronUp, ChevronDown, Check, X,
  Navigation, Info
} from 'lucide-react';
import { RoadStopObject, RoadStopCategory } from '../../lib/roadmapTypes';
import { UILanguage } from '../../types';

interface RoadStopMilestoneCardProps {
  stop: RoadStopObject;
  index: number;
  totalStops: number;
  uiLang: UILanguage;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<RoadStopObject>) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  distanceToNext?: {
    distanceKm: number;
    durationMinutes: number;
    distanceText?: string;
    durationText?: string;
  };
  isSelected?: boolean;
  onSelect?: () => void;
}

export const RoadStopMilestoneCard: React.FC<RoadStopMilestoneCardProps> = ({
  stop,
  index,
  totalStops,
  uiLang,
  onRemove,
  onUpdate,
  onMoveUp,
  onMoveDown,
  distanceToNext,
  isSelected,
  onSelect,
}) => {
  const isAr = uiLang === 'ar';
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(stop.name);
  const [editTime, setEditTime] = useState(stop.time || '10:00 AM');
  const [editDuration, setEditDuration] = useState(stop.durationMinutes || 60);
  const [editNotes, setEditNotes] = useState(stop.notes || '');

  const getCategoryTheme = (cat: RoadStopCategory) => {
    switch (cat) {
      case 'hotel':
        return {
          bg: 'bg-amber-500/10 border-amber-300 text-amber-800',
          dot: 'bg-amber-500 ring-amber-200',
          badge: isAr ? 'فندق وإقامة' : 'Hotel Stay',
          icon: Hotel,
          color: '#d97706',
        };
      case 'sightseeing':
        return {
          bg: 'bg-emerald-500/10 border-emerald-300 text-emerald-800',
          dot: 'bg-emerald-500 ring-emerald-200',
          badge: isAr ? 'مزار أثري' : 'Sightseeing',
          icon: Landmark,
          color: '#059669',
        };
      case 'meal':
        return {
          bg: 'bg-rose-500/10 border-rose-300 text-rose-800',
          dot: 'bg-rose-500 ring-rose-200',
          badge: isAr ? 'وجبة وتناول طعام' : 'Meal Break',
          icon: Utensils,
          color: '#e11d48',
        };
      case 'photo_stop':
        return {
          bg: 'bg-purple-500/10 border-purple-300 text-purple-800',
          dot: 'bg-purple-500 ring-purple-200',
          badge: isAr ? 'وقفة تصوير' : 'Photo Stop',
          icon: Camera,
          color: '#9333ea',
        };
      case 'transfer':
      default:
        return {
          bg: 'bg-sky-500/10 border-sky-300 text-sky-800',
          dot: 'bg-sky-500 ring-sky-200',
          badge: isAr ? 'انتقال ومرور' : 'Transfer',
          icon: Truck,
          color: '#0284c7',
        };
    }
  };

  const theme = getCategoryTheme(stop.category);
  const IconComponent = theme.icon;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(stop.id, {
      name: editName,
      time: editTime,
      durationMinutes: Number(editDuration) || 60,
      notes: editNotes,
    });
    setIsEditing(false);
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer ${
        isSelected 
          ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-sky-100' 
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header Bar */}
      <div className="p-3.5 pb-2.5 flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Milestone Category Glyph */}
          <div className="shrink-0 mt-0.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${theme.bg}`}>
              <IconComponent className="w-4 h-4" style={{ color: theme.color }} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
              <span className="w-4 h-4 rounded-full bg-[#44200F] text-[#FAF7F2] font-mono font-bold text-[9px] inline-flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="font-semibold text-slate-700">{theme.badge}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {stop.time || '10:00 AM'}
              </span>
              <span>·</span>
              <span>{stop.city}</span>
            </div>

            <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 truncate leading-snug">
              {isAr && stop.nameAr ? stop.nameAr : stop.name}
            </h4>
          </div>
        </div>

        {/* Quick Card Controls (Up, Down, Edit, Remove) */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          {onMoveUp && index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title={isAr ? 'تقديم المحطة' : 'Move Up'}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onMoveDown && index < totalStops - 1 && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title={isAr ? 'تأخير المحطة' : 'Move Down'}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
            title={isAr ? 'تعديل المحطة' : 'Edit Stop'}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onRemove(stop.id)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title={isAr ? 'إزالة من الطريق' : 'Remove from road'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Content or Inline Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="p-3 bg-slate-50 border-t border-slate-100 space-y-2 rounded-b-2xl" onClick={e => e.stopPropagation()}>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">
              {isAr ? 'اسم المحطة / المزار' : 'Stop / Landmark Name'}
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-sky-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                {isAr ? 'توقيت الوصول' : 'Arrival Time'}
              </label>
              <input
                type="text"
                value={editTime}
                onChange={e => setEditTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                {isAr ? 'المدة بالدقائق' : 'Duration (mins)'}
              </label>
              <input
                type="number"
                min="10"
                max="1440"
                value={editDuration}
                onChange={e => setEditDuration(Number(e.target.value))}
                className="w-full text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">
              {isAr ? 'ملاحظات المرشد / السائق' : 'Guide / Driver Operational Notes'}
            </label>
            <input
              type="text"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder={isAr ? 'تنبيهات خاصة، استقبال، تصاريح...' : 'Luggage assistance, permits, meeting point...'}
              className="w-full text-xs px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 text-xs rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 text-xs rounded-md bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>{isAr ? 'حفظ' : 'Save'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="px-3.5 pb-3">
          {stop.notes && (
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {isAr && stop.notesAr ? stop.notesAr : stop.notes}
            </p>
          )}

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>Day {stop.dayNumber}</span>
              {stop.durationMinutes && (
                <>
                  <span>·</span>
                  <span>~{stop.durationMinutes} min stay</span>
                </>
              )}
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.coordinates.lat},${stop.coordinates.lng}`)}`}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-0.5"
            >
              <Navigation className="w-2.5 h-2.5" />
              <span>{isAr ? 'الموقع' : 'GPS'}</span>
            </a>
          </div>
        </div>
      )}

      {/* Transit Road Leg connector banner to the next stop */}
      {distanceToNext && (
        <div className="bg-sky-50/70 border-t border-sky-100/80 px-3 py-1.5 rounded-b-2xl flex items-center justify-between text-[11px] text-sky-900 font-mono">
          <div className="flex items-center gap-1.5 font-sans font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            <span>{isAr ? 'المسافة للمحطة التالية:' : 'Transit to next stop:'}</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-sky-700">
            <span>{distanceToNext.distanceText || `${distanceToNext.distanceKm} km`}</span>
            <span>·</span>
            <span className="text-slate-500 font-sans font-normal">~{distanceToNext.durationText || `${distanceToNext.durationMinutes} mins`}</span>
          </div>
        </div>
      )}
    </div>
  );
};
