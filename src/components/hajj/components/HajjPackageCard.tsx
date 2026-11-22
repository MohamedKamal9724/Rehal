import React, { useState } from 'react';
import { 
  Building2, Train, Compass, Check, MapPin, 
  Clock, ShieldCheck, ArrowRight, ArrowLeft,
  Sparkles, CheckCircle2, ChevronRight, Users, 
  Send, ExternalLink, Moon, Star
} from 'lucide-react';
import { HajjUmrahPresetPackage, convertPresetToQuote } from '../../../lib/hajjUmrahData';
import { Workspace, UILanguage, Quote } from '../../../types';

interface HajjPackageCardProps {
  packageData: HajjUmrahPresetPackage;
  workspace: Workspace;
  uiLang: UILanguage;
  onProceedToQuote: (quote: Quote) => void;
}

export const HajjPackageCard: React.FC<HajjPackageCardProps> = ({
  packageData,
  workspace,
  uiLang,
  onProceedToQuote,
}) => {
  const isAr = uiLang === 'ar';
  const [occupancy, setOccupancy] = useState<'double' | 'triple' | 'quad'>('double');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [travelerName, setTravelerName] = useState('');
  const [paxCount, setPaxCount] = useState(2);

  const price = occupancy === 'double' 
    ? packageData.priceDoubleUsd 
    : occupancy === 'triple' 
    ? packageData.priceTripleUsd 
    : packageData.priceQuadUsd;

  const totalNights = packageData.nightsMakkah + packageData.nightsMadinah;
  const isVip = packageData.tier === '5_star_vip' || packageData.tier === 'deluxe_hajj';

  const handleCreateQuote = () => {
    const finalTravelerName = travelerName.trim() || (isAr ? 'فوج معتمرين كرام' : 'Honored Pilgrims Delegation');
    const quote = convertPresetToQuote(packageData, workspace, occupancy, paxCount, finalTravelerName);
    setIsModalOpen(false);
    onProceedToQuote(quote);
  };

  return (
    <div 
      className="bg-white rounded-3xl border border-[#E5D5B5] shadow-2xs hover:shadow-lg hover:border-[#B8860B] transition-all duration-300 flex flex-col justify-between overflow-hidden group"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div>
        {/* Light Hijazi Ivory & Gold / Emerald Header Banner */}
        <div className={`p-5 relative overflow-hidden border-b ${
          packageData.tier === 'deluxe_hajj'
            ? 'bg-gradient-to-br from-[#EFFAF5] via-[#F7FDF9] to-[#E2F5EC] text-[#064E3B] border-emerald-200'
            : isVip
            ? 'bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#F3E5C8] text-[#44200F] border-[#E2C893]'
            : 'bg-gradient-to-br from-[#FAF8F5] via-white to-[#F2EAE0] text-[#44200F] border-[#EDE0CC]'
        }`}>
          {/* Top accent bar */}
          <div className={`absolute top-0 inset-x-0 h-1 ${
            packageData.tier === 'deluxe_hajj' ? 'bg-emerald-600' : 'bg-[#B8860B]'
          }`} />

          {/* Top metadata row */}
          <div className="flex items-center justify-between text-xs mb-2.5">
            <div className="flex items-center gap-1.5 font-bold">
              <span className={`w-2 h-2 rounded-full ${
                packageData.tier === 'deluxe_hajj' ? 'bg-emerald-600' : 'bg-[#B8860B]'
              }`} />
              <span className="text-[#8C6218] text-[11px] tracking-wide font-bold">
                {isAr ? packageData.seasonNameAr : packageData.seasonName}
              </span>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-[#6E4B11] border border-[#DFC798] shadow-2xs">
              {totalNights} {isAr ? 'ليالٍ مباركة' : 'Nights'}
            </span>
          </div>

          {/* Package Title */}
          <h3 className="font-extrabold text-base sm:text-lg text-[#44200F] leading-snug line-clamp-2">
            {isAr ? packageData.arabicName : packageData.name}
          </h3>

          {/* Nights distribution */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-white/90 text-[#7C5310] border border-[#DFC798] flex items-center gap-1.5 font-bold shadow-2xs">
              <span className="text-[11px]">🕋</span>
              <span>{packageData.nightsMakkah} {isAr ? 'ليالٍ بمكة' : 'Makkah'}</span>
            </span>
            <span className="text-[#B8860B] font-bold">·</span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50/90 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-bold shadow-2xs">
              <span className="text-[11px]">🕌</span>
              <span>{packageData.nightsMadinah} {isAr ? 'ليالٍ بالمدينة' : 'Madinah'}</span>
            </span>
          </div>
        </div>

        {/* Hotels and Sacred Proximity Details */}
        <div className="p-5 space-y-3.5">
          {/* Makkah Hotel Card */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EDE0CC] space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#7C5310] flex items-center gap-1">
                <span>🕋</span>
                <span>{isAr ? 'فندق مكة المكرمة' : 'Makkah Hotel'}</span>
              </span>
              <div className="flex items-center text-amber-500">
                {Array.from({ length: packageData.makkahStars }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <div className="font-extrabold text-xs text-[#44200F]">
              {isAr ? packageData.makkahHotelAr : packageData.makkahHotel}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#795037] font-medium">
              <MapPin className="w-3 h-3 text-[#B8860B] shrink-0" />
              <span>{isAr ? packageData.makkahDistanceDescAr : packageData.makkahDistanceDescEn}</span>
            </div>
          </div>

          {/* Madinah Hotel Card */}
          <div className="bg-[#F5FBF8] p-3.5 rounded-2xl border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#065F46] flex items-center gap-1">
                <span>🕌</span>
                <span>{isAr ? 'فندق المدينة المنورة' : 'Madinah Hotel'}</span>
              </span>
              <div className="flex items-center text-amber-500">
                {Array.from({ length: packageData.madinahStars }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <div className="font-extrabold text-xs text-emerald-950">
              {isAr ? packageData.madinahHotelAr : packageData.madinahHotel}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#065F46] font-medium">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{isAr ? packageData.madinahDistanceDescAr : packageData.madinahDistanceDescEn}</span>
            </div>
          </div>

          {/* Transport details */}
          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EDE0CC] text-xs space-y-1">
            <div className="font-bold text-[#44200F] flex items-center gap-1 text-[11px]">
              <Train className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>{isAr ? 'منظومة التنقل بين الحرمين:' : 'Transportation:'}</span>
            </div>
            <p className="text-[11px] text-[#795037] leading-relaxed">
              {isAr ? packageData.transportTypeAr : packageData.transportTypeEn}
            </p>
          </div>

          {/* Highlights checklist */}
          <div className="space-y-1.5 pt-1">
            {(isAr ? packageData.highlightsAr : packageData.highlightsEn).slice(0, 3).map((hl, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{hl}</span>
              </div>
            ))}
          </div>

          {/* Room Occupancy Selector */}
          <div className="pt-2 border-t border-[#EDE0CC]">
            <div className="text-[11px] font-bold text-[#795037] mb-1.5">
              {isAr ? 'نوع الغرفة والتسكين:' : 'Room Occupancy:'}
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF6EE] border border-[#EDE0CC] rounded-xl text-xs font-bold text-[#795037]">
              <button
                type="button"
                onClick={() => setOccupancy('double')}
                className={`py-1.5 px-2 rounded-lg transition cursor-pointer text-center ${
                  occupancy === 'double' ? 'bg-[#8C6218] text-white shadow-2xs' : 'hover:bg-white text-[#44200F]'
                }`}
              >
                {isAr ? 'ثنائية (Double)' : 'Double'}
              </button>
              <button
                type="button"
                onClick={() => setOccupancy('triple')}
                className={`py-1.5 px-2 rounded-lg transition cursor-pointer text-center ${
                  occupancy === 'triple' ? 'bg-[#8C6218] text-white shadow-2xs' : 'hover:bg-white text-[#44200F]'
                }`}
              >
                {isAr ? 'ثلاثية (Triple)' : 'Triple'}
              </button>
              <button
                type="button"
                onClick={() => setOccupancy('quad')}
                className={`py-1.5 px-2 rounded-lg transition cursor-pointer text-center ${
                  occupancy === 'quad' ? 'bg-[#8C6218] text-white shadow-2xs' : 'hover:bg-white text-[#44200F]'
                }`}
              >
                {isAr ? 'رباعية (Quad)' : 'Quad'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Conversion Button */}
      <div className="p-5 bg-[#FAF8F5] border-t border-[#EDE0CC] flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-[#795037] uppercase font-bold tracking-wider">
            {isAr ? 'السعر للشخص' : 'Per Pilgrim'}
          </div>
          <div className="text-xl font-black text-[#44200F] font-mono">
            ${price}
            <span className="text-[11px] font-normal text-[#795037] ms-1 font-sans">
              ({Math.round(price * 3.75)} {isAr ? 'ريال' : 'SAR'})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#8C6218] to-[#B8860B] hover:from-[#734F10] hover:to-[#9A6F1A] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isAr ? 'تحويل لعرض سعر' : 'Create Quote'}</span>
        </button>
      </div>

      {/* Instant Quote Handoff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#DFC798] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE0CC]">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕋</span>
                <h4 className="font-extrabold text-sm text-[#44200F]">
                  {isAr ? 'إصدار عرض سعر لباقة العمرة' : 'Generate Pilgrimage Quote'}
                </h4>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#795037] leading-relaxed">
              {isAr
                ? `سيتم تحويل باقة "${packageData.arabicName}" فوراً إلى عرض سعر معتمد بإجمالي مدة ${totalNights} ليالٍ، مع حجز تذاكر قطار الحرمين ومياه زمزم.`
                : `Instant conversion of "${packageData.name}" into a customized proposal with Haramain train and hotel accommodations.`}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#44200F] mb-1">
                  {isAr ? 'اسم العميل أو الفوج السياحي:' : 'Lead Pilgrim / Group Name:'}
                </label>
                <input
                  type="text"
                  value={travelerName}
                  onChange={e => setTravelerName(e.target.value)}
                  placeholder={isAr ? 'مثال: وفد عائلة عبد الرحمن (٤ معتمرين)' : 'e.g. Al-Rahman Family Umrah Delegation'}
                  className="w-full text-xs font-bold px-3 py-2 border border-[#EDE0CC] rounded-xl focus:outline-hidden focus:border-[#B8860B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#44200F] mb-1">
                  {isAr ? 'عدد المعتمرين:' : 'Pilgrim Pax Count:'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={paxCount}
                  onChange={e => setPaxCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs font-bold px-3 py-2 border border-[#EDE0CC] rounded-xl focus:outline-hidden focus:border-[#B8860B]"
                />
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE0CC] text-xs space-y-1">
                <div className="flex justify-between text-[#795037]">
                  <span>{isAr ? 'نوع التسكين:' : 'Occupancy:'}</span>
                  <span className="font-bold text-[#44200F]">{occupancy.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-[#795037]">
                  <span>{isAr ? 'سعر الشخص التقريبي:' : 'Price per Person:'}</span>
                  <span className="font-bold text-[#44200F]">${price} USD</span>
                </div>
                <div className="flex justify-between text-[#44200F] font-extrabold pt-1 border-t border-[#EDE0CC]">
                  <span>{isAr ? 'إجمالي عرض السعر:' : 'Total Proposal Price:'}</span>
                  <span className="font-mono text-emerald-700">${price * paxCount} USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCreateQuote}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-[#8C6218] to-[#B8860B] hover:from-[#734F10] hover:to-[#9A6F1A] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'فتح عرض السعر المباشر' : 'Launch Proposal Viewer'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-4 text-xs font-bold text-[#795037] hover:text-[#44200F] cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
