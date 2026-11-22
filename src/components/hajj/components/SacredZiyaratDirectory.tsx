import React, { useState } from 'react';
import { 
  MapPin, Clock, Compass, ShieldCheck, Search, Filter, 
  ExternalLink, Sparkles, Footprints, Info, BookOpen, Map as MapIcon, Grid
} from 'lucide-react';
import { UILanguage } from '../../../types';
import { SACRED_ZIYARAT_SITES } from '../../../lib/hajjUmrahData';
import { ZiyaratInteractiveMap, ZiyaratLocationSite } from './ZiyaratInteractiveMap';
import { SectionHelpTrigger } from '../../common/SectionHelpTrigger';

interface SacredZiyaratDirectoryProps {
  uiLang: UILanguage;
  onSelectSiteForItinerary?: (site: ZiyaratLocationSite) => void;
}

export const SacredZiyaratDirectory: React.FC<SacredZiyaratDirectoryProps> = ({ 
  uiLang,
  onSelectSiteForItinerary
}) => {
  const isAr = uiLang === 'ar';
  const [selectedCity, setSelectedCity] = useState<'all' | 'Makkah' | 'Madinah'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'cards' | 'both'>('both');

  const filteredSites = SACRED_ZIYARAT_SITES.filter(site => {
    const matchesCity = selectedCity === 'all' || site.city === selectedCity;
    const matchesSearch = searchQuery.trim() === '' || 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.arabicName.includes(searchQuery) ||
      site.significance.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.arabicSignificance.includes(searchQuery);
    return matchesCity && matchesSearch;
  });

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Intro Header - Light Hijazi Ivory & Emerald */}
      <div className="bg-gradient-to-br from-[#FAF8F5] via-[#FFFDF9] to-[#F3ECE1] border border-[#E5D5B5] rounded-3xl p-6 sm:p-7 relative overflow-hidden text-[#44200F] shadow-2xs">
        {/* Subtle decorative Islamic arch geometric SVG */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.08] pointer-events-none">
          <svg viewBox="0 0 200 200" fill="none" stroke="#8C6218" strokeWidth="3">
            <path d="M100 10 C 60 40 40 80 40 130 L 40 200 L 160 200 L 160 130 C 160 80 140 40 100 10 Z" />
          </svg>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center justify-between sm:justify-start gap-2 text-xs font-bold text-[#8C6218] mb-1.5">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#B8860B]" />
                  <span>{isAr ? 'دليل الزيارات الشرعية والمعالم التاريخية' : 'Spiritual Ziyarat & Historical Landmarks'}</span>
                </div>
                <SectionHelpTrigger
                  sectionKey="hajj_ziyarat_map"
                  uiLang={uiLang}
                  variant="gold"
                  size="sm"
                  pinned={true}
                  label={isAr ? 'دليل المزارات' : 'Ziyarat Guide'}
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#44200F] tracking-tight">
                {isAr ? 'مزارات مكة المكرمة والمدينة المنورة' : 'Sacred Sites of Makkah & Madinah'}
              </h2>
              <p className="text-xs sm:text-sm text-[#795037] max-w-2xl mt-1 leading-relaxed">
                {isAr 
                  ? 'دليل موثق وشامل لشركات السياحة والمرشدين الدينيين لتنظيم الجولات الإيمانية، شاملاً المسافات الدقيقة من الحرمين الشريفين وآداب الزيارة والوقت المستغرق.'
                  : 'Curated pilgrimage directory for travel operators and spiritual guides with precise distances from the Two Holy Mosques, etiquette guidelines, and visiting durations.'}
              </p>
            </div>

            {/* City Selector Buttons */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl self-start sm:self-auto border border-[#E5D5B5] shadow-2xs">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCity === 'all'
                    ? 'bg-[#8C6218] text-white shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F]'
                }`}
              >
                {isAr ? 'كافة المعالم' : 'All Sites'}
              </button>
              <button
                onClick={() => setSelectedCity('Makkah')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  selectedCity === 'Makkah'
                    ? 'bg-[#FDF4E0] text-[#7C5310] shadow-2xs border border-[#B8860B]'
                    : 'text-[#795037] hover:text-[#44200F]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#B8860B]"></span>
                {isAr ? 'مكة المكرمة' : 'Makkah'}
              </button>
              <button
                onClick={() => setSelectedCity('Madinah')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  selectedCity === 'Madinah'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-[#065F46] hover:bg-emerald-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {isAr ? 'المدينة المنورة' : 'Madinah'}
              </button>
            </div>
          </div>

          {/* Search bar and View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="relative max-w-md w-full">
              <Search className={`w-4 h-4 text-[#B8860B] absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث عن معلم، مسجد، أو غار...' : 'Search sacred site, mosque, cave...'}
                className={`w-full py-2 bg-white border border-[#DFC798] rounded-xl text-xs text-[#44200F] placeholder-[#9C7A54] focus:outline-none focus:ring-1 focus:ring-[#B8860B] ${
                  isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#E5D5B5] self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('both')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'both'
                    ? 'bg-[#8C6218] text-white shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'الخريطة والبطاقات' : 'Map & Cards'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-[#FDF4E0] text-[#7C5310] border border-[#B8860B] shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>{isAr ? 'الخريطة التفاعلية' : 'Interactive Map'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#FDF4E0] text-[#7C5310] border border-[#B8860B] shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F]'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>{isAr ? 'دليل البطاقات' : 'Cards Catalog'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: INTERACTIVE 'ZIYARAT LOCATIONS' GOOGLE MAP WITH HOTEL DISTANCES
         ========================================================================= */}
      {(viewMode === 'map' || viewMode === 'both') && (
        <ZiyaratInteractiveMap
          uiLang={uiLang}
          defaultCity={selectedCity === 'all' ? 'Makkah' : selectedCity}
          onSelectSiteForItinerary={onSelectSiteForItinerary}
        />
      )}

      {/* =========================================================================
          SECTION 2: GRID OF SACRED SITES CATALOG CARDS
         ========================================================================= */}
      {(viewMode === 'cards' || viewMode === 'both') && (
        <div className="space-y-4">
          {viewMode === 'both' && (
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-2 pt-2">
              <h3 className="text-sm font-bold text-[#44200F] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#B8860B]" />
                <span>{isAr ? 'الدليل التفصيلي والآداب الشرعية للمزارات' : 'Detailed Sites Etiquette & Merit Catalog'}</span>
              </h3>
              <span className="text-xs text-[#795037]">
                {isAr ? `عرض ${filteredSites.length} معلماً مقدساً` : `Showing ${filteredSites.length} sacred landmarks`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSites.map((site) => {
          const isMakkah = site.city === 'Makkah';

          return (
            <div 
              key={site.id} 
              className="bg-white rounded-3xl border border-[#EDE0CC] shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
            >
              {/* Light Islamic Arch Style Top Header */}
              <div className={`p-5 border-b relative ${
                isMakkah 
                  ? 'bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF9] to-[#F3E5C8] text-[#44200F] border-[#E2C893]' 
                  : 'bg-gradient-to-br from-[#EFFAF5] via-[#F7FDF9] to-[#E2F5EC] text-[#064E3B] border-emerald-200'
              }`}>
                {/* Arch accent line */}
                <div className={`absolute top-0 inset-x-0 h-1 ${isMakkah ? 'bg-[#B8860B]' : 'bg-emerald-600'}`}></div>

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isMakkah 
                          ? 'bg-white/90 text-[#7C5310] border border-[#DFC798]' 
                          : 'bg-white/90 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isMakkah 
                          ? (isAr ? '🕋 مكة المكرمة' : '🕋 Holy Makkah') 
                          : (isAr ? '🕌 طيبة الطيبة — المدينة' : '🕌 Madinah Al-Munawwarah')}
                      </span>
                      <span className="text-[11px] font-bold opacity-80">
                        {site.categoryAr}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black tracking-tight mt-1">
                      {isAr ? site.arabicName : site.name}
                    </h3>
                    <p className="text-xs opacity-75 font-sans">
                      {isAr ? site.name : site.arabicName}
                    </p>
                  </div>

                  {/* Distance badge */}
                  <div className={`text-right shrink-0 px-2.5 py-1.5 rounded-xl border bg-white/90 shadow-2xs ${
                    isMakkah 
                      ? 'border-[#DFC798] text-[#7C5310]' 
                      : 'border-emerald-200 text-emerald-800'
                  }`}>
                    <span className="text-xs font-mono font-bold block">{site.distanceHaramKm}</span>
                    <span className="text-[9px] opacity-80 block">{isAr ? 'عن الحرم' : 'from Haram'}</span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Significance Box */}
                  <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EDE0CC] space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#795037]">
                      <Sparkles className="w-3.5 h-3.5 text-[#C4A177]" />
                      <span>{isAr ? 'المكانة والأثر النبوي الشريف:' : 'Significance & Spiritual Merit:'}</span>
                    </div>
                    <p className="text-xs text-[#44200F] leading-relaxed">
                      {isAr ? site.arabicSignificance : site.significance}
                    </p>
                  </div>

                  {/* Distance detailed note */}
                  <div className="flex items-start gap-2 text-xs text-[#795037]">
                    <MapPin className="w-4 h-4 text-[#C4A177] shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      {isAr ? site.distanceHaramDescAr : `${site.distanceHaramKm} from the Sacred Mosque`}
                    </span>
                  </div>

                  {/* Etiquette and Visiting Protocol */}
                  <div className="flex items-start gap-2 text-xs text-[#44200F] bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50">
                    <BookOpen className="w-4 h-4 text-[#795037] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[11px] text-[#795037]">
                        {isAr ? 'آداب الزيارة والضوابط:' : 'Visiting Etiquette:'}
                      </span>
                      <span className="text-[11px] leading-relaxed">
                        {site.dressCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="pt-3 border-t border-[#EDE0CC] flex items-center justify-between text-xs text-[#795037]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>{isAr ? 'المدة المقترحة للجولة:' : 'Duration:'} <strong className="text-[#44200F]">{site.visitDuration}</strong></span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isAr ? 'مسار سياحي معتمد' : 'Verified Route'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
          </div>
        </div>
      )}
    </div>
  );
};
