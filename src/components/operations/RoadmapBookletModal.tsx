import React, { useState } from 'react';
import { 
  Printer, Download, X, Eye, FileText, Check, 
  Sparkles, Truck, Users, Calendar, MapPin, Shield
} from 'lucide-react';
import { RoadmapTrip } from '../../lib/roadmapTypes';
import { Workspace, UILanguage } from '../../types';
import { printRoadmapBooklet, BookletPrintOptions } from '../../lib/roadmapBookletPdf';

interface RoadmapBookletModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: RoadmapTrip;
  workspace: Workspace;
  uiLang: UILanguage;
}

export const RoadmapBookletModal: React.FC<RoadmapBookletModalProps> = ({
  isOpen,
  onClose,
  trip,
  workspace,
  uiLang,
}) => {
  if (!isOpen) return null;

  const isAr = uiLang === 'ar';
  const theme = 'archival';
  const [includeContacts, setIncludeContacts] = useState(true);
  const [includeTipping, setIncludeTipping] = useState(true);
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [docLanguage, setDocLanguage] = useState<UILanguage>(uiLang);

  const daysCount = [...new Set(trip.stops.map(s => s.dayNumber))].length;
  const estimatedPages = Math.ceil(daysCount / 2) + 2;

  const handleGenerate = () => {
    printRoadmapBooklet(trip, workspace, {
      theme,
      includeContacts,
      includeTipping,
      includeQrCode,
      language: docLanguage,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#44200F]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-[#EDE0CC] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Top Strip */}
        <div className="p-4 sm:p-5 bg-[#44200F] text-[#FAF7F2] flex items-center justify-between border-b border-[#795037]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-[#C4A177] border border-[#C4A177]/30 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-[#FAF7F2]">
                  {isAr ? 'تصدير كتيب مسار الرحلة A4 / PDF' : 'Export Traveler Tour Booklet & Road Map PDF'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C4A177] text-[#44200F] font-mono">
                  A4 PRINT
                </span>
              </div>
              <p className="text-xs text-[#EDE0CC] mt-0.5">
                {trip.travelerGroupName} · {trip.paxCount} {isAr ? 'مسافر' : 'Pax'} · {trip.durationDays} {isAr ? 'أيام' : 'Days'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#EDE0CC] hover:text-[#FAF7F2] hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Document Preview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>{isAr ? 'مواصفات الملف المطبوع:' : 'Print Document Specifications:'}</span>
              </div>
              <p className="text-xs text-slate-500">
                {isAr
                  ? `غلاف فاخر + مخطط الطريق السريع الفيكتوري + برنامج الرحلة اليومي (${trip.stops.length} محطة) + دليل الطوارئ والبقشيش.`
                  : `Executive Cover + Vector Highway Schematic + Day-by-day Itinerary (${trip.stops.length} stops) + Practical Guide.`}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs font-mono font-bold text-slate-900">{estimatedPages}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">{isAr ? 'صفحات A4' : 'A4 Pages'}</div>
              </div>
              <div className="text-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs font-mono font-bold text-sky-600">{trip.stops.length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">{isAr ? 'محطة' : 'Stops'}</div>
              </div>
            </div>
          </div>

          {/* Standard Single PDF Design Format */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C4A177]" />
              <div>
                <div className="text-xs font-bold text-[#44200F]">
                  {isAr ? 'النسق الموحد المعتمد لمنصة رِحال' : 'Official RIHAL Standard Travel Format'}
                </div>
                <div className="text-[11px] text-[#795037]">
                  {isAr ? 'تصميم كلاسيكي راقٍ بهوية رِحال المعتمدة وشعار الشركة الرسمي.' : 'Classic luxury presentation with official RIHAL typography, verified seal, and QR tracking.'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-[#EDE0CC] text-[#44200F]">
              Standard
            </span>
          </div>

          {/* Included Sections Toggles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {isAr ? 'الأقسام المرفقة في الكتيب' : 'Included Booklet Modules'}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeContacts}
                  onChange={e => setIncludeContacts(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {isAr ? 'إدراج بيانات المرشد السياحي المرافق وبيانات السائق والمركبة' : 'Include Egyptologist Guide & Chauffeur Fleet details'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTipping}
                  onChange={e => setIncludeTipping(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {isAr ? 'إدراج دليل البقشيش والآداب الثقافية المعتادة في مصر' : 'Include Egyptian tipping etiquette & cultural customs guide'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeQrCode}
                  onChange={e => setIncludeQrCode(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {isAr ? 'إدراج رابط البوابة الحية للسائح (للمتابعة عبر الموبايل)' : 'Include Live Traveler Mobile Concierge Portal link'}
                </span>
              </label>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-150">
            <span className="text-xs font-bold text-slate-700">
              {isAr ? 'لغة المستند المطبوع:' : 'Document Output Language:'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDocLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  docLanguage === 'en'
                    ? 'bg-[#44200F] text-[#FAF7F2]'
                    : 'bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC]'
                }`}
              >
                English (LTR)
              </button>
              <button
                type="button"
                onClick={() => setDocLanguage('ar')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  docLanguage === 'ar'
                    ? 'bg-[#44200F] text-[#FAF7F2]'
                    : 'bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC]'
                }`}
              >
                العربية (RTL)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#EDE0CC] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#EDE0CC] hover:bg-white text-[#795037] text-xs font-bold transition cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-[#44200F] hover:bg-[#321609] active:bg-[#200B04] text-[#FAF7F2] text-xs font-black flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C4A177]" />
            <span>{isAr ? 'طباعة / حفظ الكتيب كـ PDF' : 'Print / Save Tour Booklet (PDF)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
