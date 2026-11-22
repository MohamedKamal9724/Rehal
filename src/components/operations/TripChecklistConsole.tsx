import React, { useState } from 'react';
import { 
  ClipboardCheck, CheckCircle2, Clock, ShieldCheck, 
  Plane, Hotel, Truck, Users, MessageSquare, AlertCircle,
  RotateCcw, Sparkles
} from 'lucide-react';
import { TripFile, TripChecklistItem } from '../../lib/tripStore';
import { UILanguage } from '../../types';

interface TripChecklistConsoleProps {
  trip: TripFile;
  uiLang: UILanguage;
  onUpdateChecklist: (checklist: TripChecklistItem[]) => void;
}

interface ChecklistCategory {
  id: string;
  title: string;
  titleAr: string;
  icon: any;
  items: string[];
}

const CATEGORIES: ChecklistCategory[] = [
  {
    id: 'flights',
    title: 'Arrival Logistics & Airport Welcome',
    titleAr: 'الوصول والاستقبال بالمطار',
    icon: Plane,
    items: [
      'Passenger names and nationalities collected for all travelers',
      'Visa / entry requirements checked with the traveler',
      'Arrival flight details received and airport meet & assist booked',
    ],
  },
  {
    id: 'accommodations',
    title: 'Hotels, Cruises & Rooming Allocation',
    titleAr: 'الفنادق، الكبائن وتوزيع الغرف',
    icon: Hotel,
    items: [
      'All hotel bookings confirmed and rooming list sent to hotels',
      'Nile cruise cabins allocated and embarkation time confirmed',
      'Domestic flight tickets issued and names match passports',
    ],
  },
  {
    id: 'ground',
    title: 'Chauffeur Fleet, Guides & Monument Permits',
    titleAr: 'الأسطول، المرشدون وتصاريح المزارات',
    icon: Truck,
    items: [
      'Vehicle and driver assigned for every transfer and touring day',
      'Licensed Egyptologist guide assigned (language matches traveler)',
      'Entrance tickets / timed-entry slots arranged where needed',
      'Meals, dietary needs and special requests passed to suppliers',
    ],
  },
  {
    id: 'final_reconfirm',
    title: '48-Hour Field Reconfirmation & Briefings',
    titleAr: 'إعادة التأكيد قبل 48 ساعة والإحاطة الميدانية',
    icon: ShieldCheck,
    items: [
      'Vouchers sent to suppliers and traveler',
      'Guide and driver briefed with manifest and emergency contacts',
      'Traveler welcome message and WhatsApp contact shared',
      'All services reconfirmed 48 hours before arrival',
      'Departure transfer reconfirmed',
      'Post-trip feedback requested',
    ],
  },
];

export const TripChecklistConsole: React.FC<TripChecklistConsoleProps> = ({
  trip,
  uiLang,
  onUpdateChecklist,
}) => {
  const isAr = uiLang === 'ar';
  const checklist = trip.checklist;

  const total = checklist.length;
  const doneCount = checklist.filter(c => c.done).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const toggleItem = (id: string, current: boolean) => {
    const next = checklist.map(c => c.id === id ? { ...c, done: !current } : c);
    onUpdateChecklist(next);
  };

  const handleMarkAllDone = () => {
    onUpdateChecklist(checklist.map(c => ({ ...c, done: true })));
  };

  const handleResetAll = () => {
    onUpdateChecklist(checklist.map(c => ({ ...c, done: false })));
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Audit Progress Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 font-mono ${
              pct === 100 
                ? 'bg-emerald-100 text-emerald-800 ring-4 ring-emerald-50' 
                : 'bg-sky-100 text-sky-800 ring-4 ring-sky-50'
            }`}>
              {pct}%
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'التدقيق التشغيلي قبل وصول الفوج' : 'Pre-Arrival Operational Audit Checklist'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  pct === 100 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                    : 'bg-amber-50 text-amber-700 border border-amber-300'
                }`}>
                  {pct === 100 
                    ? (isAr ? 'جاهزية 100% للتشغيل' : '100% Ready for Ops') 
                    : `${doneCount}/${total} ${isAr ? 'بنود مكتملة' : 'completed'}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'بروتوكول السلامة والامتثال المعتمد للشركات السياحية: التأكد من مطابقة الأسماء، جاهزية المرشد والسائق، وتأكيد الحجوزات قبل 48 ساعة.'
                  : 'Industry-standard 14-point DMC compliance protocol ensuring all ground suppliers, guides, vehicles, and vouchers are 100% verified.'}
              </p>
            </div>
          </div>

          {/* Quick Bulk Actions */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleMarkAllDone}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تأكيد كل البنود' : 'Mark All Done'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition cursor-pointer"
              title="Reset checklist"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${
              pct === 100 
                ? 'bg-emerald-500' 
                : 'bg-gradient-to-r from-sky-500 to-sky-600'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Categorized Checklist Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          // Find items in trip.checklist matching this category
          const categoryChecklistItems = checklist.filter(c => 
            cat.items.some(label => c.label.toLowerCase() === label.toLowerCase() || label.toLowerCase().includes(c.label.toLowerCase()))
          );

          // If no exact match (legacy checklist), use mapped items or all matching
          const displayItems = categoryChecklistItems.length > 0
            ? categoryChecklistItems
            : cat.items.map((lbl, idx) => {
                const found = checklist.find(c => c.label === lbl);
                return found || { id: `item-${cat.id}-${idx}`, label: lbl, done: false };
              });

          const catDone = displayItems.filter(i => i.done).length;
          const catTotal = displayItems.length;

          return (
            <div 
              key={cat.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-sky-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      {isAr ? cat.titleAr : cat.title}
                    </h4>
                  </div>
                </div>

                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {catDone}/{catTotal}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {displayItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 p-2 rounded-xl transition cursor-pointer ${
                      item.done ? 'bg-slate-50/80 text-slate-400' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleItem(item.id, item.done)}
                      className="mt-0.5 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                    />
                    <span className={`text-xs font-medium leading-relaxed select-none ${
                      item.done ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
