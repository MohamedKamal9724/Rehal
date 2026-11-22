import React, { useState } from 'react';
import { 
  Hotel, Landmark, Utensils, Camera, Truck, Plus, 
  Search, Sparkles, Filter, GripVertical, Check, Info
} from 'lucide-react';
import { RoadPalettePreset, RoadStopCategory, RoadStopObject } from '../../lib/roadmapTypes';
import { ROAD_PALETTE_PRESETS } from '../../lib/roadmapDefaults';
import { UILanguage } from '../../types';

interface RoadObjectPaletteProps {
  uiLang: UILanguage;
  onAddStop: (preset: RoadPalettePreset | Partial<RoadStopObject>) => void;
  selectedDay: number;
}

export const RoadObjectPalette: React.FC<RoadObjectPaletteProps> = ({
  uiLang,
  onAddStop,
  selectedDay,
}) => {
  const isAr = uiLang === 'ar';
  const [activeCategory, setActiveCategory] = useState<RoadStopCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom Stop Creator State
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<RoadStopCategory>('sightseeing');
  const [customCity, setCustomCity] = useState('Cairo');
  const [customTime, setCustomTime] = useState('11:00 AM');
  const [customDuration, setCustomDuration] = useState(60);
  const [customNotes, setCustomNotes] = useState('');

  const filteredPresets = ROAD_PALETTE_PRESETS.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameAr && item.nameAr.includes(searchQuery)) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: RoadStopCategory) => {
    switch (category) {
      case 'hotel': return Hotel;
      case 'sightseeing': return Landmark;
      case 'meal': return Utensils;
      case 'photo_stop': return Camera;
      case 'transfer': return Truck;
    }
  };

  const getCategoryColor = (category: RoadStopCategory) => {
    switch (category) {
      case 'hotel': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'sightseeing': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'meal': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'photo_stop': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'transfer': return 'text-sky-600 bg-sky-50 border-sky-200';
    }
  };

  const handleDragStart = (e: React.DragEvent, preset: RoadPalettePreset) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...preset,
      dayNumber: selectedDay,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCreateCustomStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddStop({
      id: `custom-stop-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      city: customCity,
      dayNumber: selectedDay,
      time: customTime,
      durationMinutes: Number(customDuration) || 60,
      notes: customNotes,
      coordinates: {
        lat: customCity.toLowerCase() === 'luxor' ? 25.6872 : customCity.toLowerCase() === 'aswan' ? 24.0889 : 30.0444,
        lng: customCity.toLowerCase() === 'luxor' ? 32.6396 : customCity.toLowerCase() === 'aswan' ? 32.8998 : 31.2357,
      },
      isCustom: true,
    });

    setCustomName('');
    setCustomNotes('');
    setShowCustomModal(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col h-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Palette Header */}
      <div className="p-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/30">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <GripVertical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                {isAr ? 'كتالوج المحطات التفاعلية' : 'Road Objects Palette'}
              </h3>
              <p className="text-[10px] text-slate-500">
                {isAr ? 'اسحب المحطة وأسقطها على الطريق' : 'Drag & drop onto highway or click +'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{isAr ? 'محطة مخصصة' : 'Custom Stop'}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث عن فندق، مزار، مطعم، وقفة تصوير...' : 'Search hotels, monuments, dining, photo stops...'}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden transition"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="luxury-tab-bar flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar text-[11px] flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`h-7.5 px-2.5 rounded-lg transition font-medium shrink-0 cursor-pointer whitespace-nowrap flex items-center justify-center ${
              activeCategory === 'all' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('hotel')}
            className={`h-7.5 px-2.5 rounded-lg transition font-medium shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'hotel' ? 'bg-amber-600 text-white font-bold' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Hotel className="w-3 h-3 shrink-0" />
            <span>{isAr ? 'فنادق' : 'Hotels'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('sightseeing')}
            className={`h-7.5 px-2.5 rounded-lg transition font-medium shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'sightseeing' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Landmark className="w-3 h-3 shrink-0" />
            <span>{isAr ? 'مزارات' : 'Sights'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('meal')}
            className={`h-7.5 px-2.5 rounded-lg transition font-medium shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'meal' ? 'bg-rose-600 text-white font-bold' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Utensils className="w-3 h-3 shrink-0" />
            <span>{isAr ? 'وجبات' : 'Meals'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('photo_stop')}
            className={`h-7.5 px-2.5 rounded-lg transition font-medium shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'photo_stop' ? 'bg-purple-600 text-white font-bold' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <Camera className="w-3 h-3 shrink-0" />
            <span>{isAr ? 'تصوير' : 'Photos'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('transfer')}
            className={`h-7.5 px-2.5 rounded-lg transition font-medium shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeCategory === 'transfer' ? 'bg-sky-600 text-white font-bold' : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            <Truck className="w-3 h-3 shrink-0" />
            <span>{isAr ? 'انتقال' : 'Transfers'}</span>
          </button>
        </div>
      </div>

      {/* Palette Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredPresets.map(preset => {
          const Icon = getCategoryIcon(preset.category);
          const colorClass = getCategoryColor(preset.category);

          return (
            <div
              key={preset.id}
              draggable
              onDragStart={e => handleDragStart(e, preset)}
              className="group p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-sky-300 hover:shadow-xs transition flex items-center justify-between gap-2.5 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-800 truncate leading-snug">
                    {isAr && preset.nameAr ? preset.nameAr : preset.name}
                  </h5>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{preset.city}</span>
                    <span>·</span>
                    <span>~{preset.defaultDurationMinutes} min</span>
                  </div>
                </div>
              </div>

              {/* Quick Add Button */}
              <button
                type="button"
                onClick={() => onAddStop(preset)}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-sky-600 hover:text-white text-slate-500 border border-slate-200 hover:border-sky-600 flex items-center justify-center shrink-0 transition cursor-pointer shadow-2xs"
                title={isAr ? 'إضافة إلى الطريق' : 'Add to road'}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {filteredPresets.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-xs">
            {isAr ? 'لا توجد محطات مطابقة لبحثك' : 'No matching tour stops found'}
          </div>
        )}
      </div>

      {/* Custom Stop Creation Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>{isAr ? 'إضافة محطة أو وقفة مخصصة' : 'Add Custom Road Stop'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomStop} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  {isAr ? 'اسم المحطة أو الفعالية' : 'Stop / Activity Name'}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Sunrise Hot Air Balloon Ride"
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value as RoadStopCategory)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden font-semibold"
                  >
                    <option value="sightseeing">{isAr ? 'مزار وسياحة' : 'Sightseeing'}</option>
                    <option value="hotel">{isAr ? 'فندق وإقامة' : 'Hotel'}</option>
                    <option value="meal">{isAr ? 'وجبة وتناول طعام' : 'Meal / Dining'}</option>
                    <option value="photo_stop">{isAr ? 'وقفة تصوير' : 'Photo Stop'}</option>
                    <option value="transfer">{isAr ? 'انتقال ومرور' : 'Transfer'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isAr ? 'المدينة' : 'City'}
                  </label>
                  <select
                    value={customCity}
                    onChange={e => setCustomCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden font-semibold"
                  >
                    <option value="Cairo">Cairo (القاهرة)</option>
                    <option value="Giza">Giza (الجيزة)</option>
                    <option value="Alexandria">Alexandria (الإسكندرية)</option>
                    <option value="Luxor">Luxor (الأقصر)</option>
                    <option value="Aswan">Aswan (أسوان)</option>
                    <option value="Hurghada">Hurghada (الغردقة)</option>
                    <option value="Sharm El Sheikh">Sharm El Sheikh (شرم الشيخ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isAr ? 'وقت الوصول المجدول' : 'Scheduled Time'}
                  </label>
                  <input
                    type="text"
                    value={customTime}
                    onChange={e => setCustomTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isAr ? 'المدة التقديرية (دقيقة)' : 'Duration (Minutes)'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1440"
                    value={customDuration}
                    onChange={e => setCustomDuration(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  {isAr ? 'ملاحظات وتوجيهات تشغيلية' : 'Notes / Instructions'}
                </label>
                <textarea
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  rows={2}
                  placeholder="Tickets, meeting spot, guide briefing..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إدراج في الطريق' : 'Add to Road'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
