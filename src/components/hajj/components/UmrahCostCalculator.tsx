import React, { useState, useId } from 'react';
import { 
  Building2, Train, Calculator, Check, MapPin, 
  Sparkles, DollarSign, Users, Calendar, ArrowRight,
  ShieldCheck, RefreshCw, Send, Star, HelpCircle
} from 'lucide-react';
import { 
  MAKKAH_HOTEL_TIERS, 
  MADINAH_HOTEL_TIERS, 
  calculateUmrahPackageCost,
  UmrahCalculationParams 
} from '../../../lib/hajjUmrahData';
import { Workspace, UILanguage, Quote } from '../../../types';
import { SectionHelpTrigger } from '../../common/SectionHelpTrigger';

interface UmrahCostCalculatorProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onProceedToQuote: (quote: Quote) => void;
}

export const UmrahCostCalculator: React.FC<UmrahCostCalculatorProps> = ({
  workspace,
  uiLang,
  onProceedToQuote,
}) => {
  const isAr = uiLang === 'ar';
  const makkahSelectId = useId();
  const madinahSelectId = useId();
  const transportSelectId = useId();

  const [makkahTierId, setMakkahTierId] = useState(MAKKAH_HOTEL_TIERS[0].id);
  const [makkahNights, setMakkahNights] = useState(5);
  const [madinahTierId, setMadinahTierId] = useState(MADINAH_HOTEL_TIERS[0].id);
  const [madinahNights, setMadinahNights] = useState(4);
  const [roomType, setRoomType] = useState<'double' | 'triple' | 'quad'>('double');
  const [transportType, setTransportType] = useState<'haramain_first' | 'haramain_economy' | 'vip_gmc' | 'bus_coach'>('haramain_first');
  const [includeZamzam, setIncludeZamzam] = useState(true);
  const [includeZiyarat, setIncludeZiyarat] = useState(true);
  const [groupPaxCount, setGroupPaxCount] = useState(4);
  const [customLeadName, setCustomLeadName] = useState('');

  const params: UmrahCalculationParams = {
    makkahTierId,
    makkahNights,
    madinahTierId,
    madinahNights,
    roomType,
    transportType,
    includeZamzam,
    includeZiyarat,
    groupPaxCount,
  };

  const result = calculateUmrahPackageCost(params);
  const selectedMakkah = MAKKAH_HOTEL_TIERS.find(t => t.id === makkahTierId) || MAKKAH_HOTEL_TIERS[0];
  const selectedMadinah = MADINAH_HOTEL_TIERS.find(t => t.id === madinahTierId) || MADINAH_HOTEL_TIERS[0];

  const handleLaunchQuoteFromCustom = () => {
    const travelerName = customLeadName.trim() || (isAr ? 'عرض عمرة مخصص' : 'Custom Umrah Package');
    const quoteNumber = `UMR-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalDays = makkahNights + madinahNights + 1;

    const customQuote: Quote = {
      id: `custom-umrah-${Date.now()}`,
      workspaceId: workspace.id,
      quoteNumber,
      travelerName,
      travelerEmail: 'custom@pilgrim-desk.com',
      travelerPhone: '+20 100 000 0000',
      version: 1,
      startDate: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      durationDays: totalDays,
      targetCurrency: 'USD',
      status: 'Draft',
      group: {
        adults: groupPaxCount,
        children: [],
        infants: 0,
      },
      days: [
        {
          dayNumber: 1,
          title: `Arrival Makkah & Check-in at ${selectedMakkah.nameEn}`,
          description: `VIP meet & assist at airport. Stay ${makkahNights} nights in Makkah. Walking distance to Haram: ${selectedMakkah.distanceDescEn}.`,
          city: 'Makkah',
          hotel: selectedMakkah.nameEn,
          hotelMealPlan: 'Bed & Breakfast',
          lines: [
            {
              id: 'svc-custom-makkah',
              dayNumber: 1,
              supplierType: 'Hotel',
              serviceName: `${selectedMakkah.nameEn} (${makkahNights} Nights - ${roomType.toUpperCase()})`,
              city: 'Makkah',
              quantity: Math.ceil(groupPaxCount / (roomType === 'double' ? 2 : roomType === 'triple' ? 3 : 4)),
              occupancyBasis: roomType === 'double' ? 'double' : roomType === 'triple' ? 'triple' : 'per_person',
              unitCost: result.breakdown.makkahHotelCostPerPerson,
              costCurrency: 'USD',
              markupPercent: 15,
              markupFixed: 0,
              unitPrice: Math.round(result.breakdown.makkahHotelCostPerPerson * 1.15),
              totalCostEgp: Math.round(result.breakdown.makkahHotelCostPerPerson * 50.5),
              totalPriceEgp: Math.round(result.breakdown.makkahHotelCostPerPerson * 1.15 * 50.5),
              totalPriceQuoteCurrency: Math.round(result.breakdown.makkahHotelCostPerPerson * 1.15),
              status: 'OK',
              costCalculationNotes: 'Dynamic Tier Calculation',
            }
          ]
        },
        {
          dayNumber: makkahNights + 1,
          title: `Transfer to Madinah via ${transportType.toUpperCase()} & Stay at ${selectedMadinah.nameEn}`,
          description: `Depart to Madinah. Stay ${madinahNights} nights near the Prophet’s Mosque (${selectedMadinah.distanceDescEn}).`,
          city: 'Madinah',
          hotel: selectedMadinah.nameEn,
          hotelMealPlan: 'Bed & Breakfast',
          lines: [
            {
              id: 'svc-custom-madinah',
              dayNumber: makkahNights + 1,
              supplierType: 'Hotel',
              serviceName: `${selectedMadinah.nameEn} (${madinahNights} Nights - ${roomType.toUpperCase()})`,
              city: 'Madinah',
              quantity: Math.ceil(groupPaxCount / (roomType === 'double' ? 2 : roomType === 'triple' ? 3 : 4)),
              occupancyBasis: roomType === 'double' ? 'double' : roomType === 'triple' ? 'triple' : 'per_person',
              unitCost: result.breakdown.madinahHotelCostPerPerson,
              costCurrency: 'USD',
              markupPercent: 15,
              markupFixed: 0,
              unitPrice: Math.round(result.breakdown.madinahHotelCostPerPerson * 1.15),
              totalCostEgp: Math.round(result.breakdown.madinahHotelCostPerPerson * 50.5),
              totalPriceEgp: Math.round(result.breakdown.madinahHotelCostPerPerson * 1.15 * 50.5),
              totalPriceQuoteCurrency: Math.round(result.breakdown.madinahHotelCostPerPerson * 1.15),
              status: 'OK',
              costCalculationNotes: 'Dynamic Tier Calculation',
            }
          ]
        }
      ],
      displayCurrency: 'USD',
      exchangeRateUsed: 50.5,
      totalCostEgp: Math.round(result.totalGroupPriceEgp * 0.85),
      totalPriceEgp: result.totalGroupPriceEgp,
      marginPercent: 15,
      totalPriceQuoteCurrency: result.totalGroupPriceUsd,
      totals: {
        totalCost: Math.round(result.totalGroupPriceUsd * 0.85),
        totalSell: result.totalGroupPriceUsd,
        marginAmount: Math.round(result.totalGroupPriceUsd * 0.15),
        marginPct: 15,
        perPersonSell: result.pricePerPersonUsd,
      },
      validUntil: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      assignedAgentId: 'agent-hajj-calculator',
      assignedAgentName: 'RIHAL Umrah Calculator',
      publicToken: quoteNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 1,
      language: 'ar',
    };

    onProceedToQuote(customQuote);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner - Light Hijazi Ivory & Gold */}
      <div className="bg-gradient-to-br from-[#FAF8F5] via-[#FFFDF9] to-[#F3ECE1] rounded-3xl p-6 text-[#44200F] shadow-2xs border border-[#E5D5B5] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-[#8C6218] font-bold">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#B8860B]" />
              <span>{isAr ? 'حاسبة تسعير برامج العمرة المخصصة' : 'Interactive Dynamic Umrah Cost Calculator'}</span>
            </div>
            <SectionHelpTrigger
              sectionKey="hajj_calculator"
              uiLang={uiLang}
              variant="gold"
              size="sm"
              pinned={true}
              label={isAr ? 'دليل الحاسبة' : 'Calculator Guide'}
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#44200F]">
            {isAr ? 'تخصيص وحساب تكلفة العمرة الفورية' : 'Build & Price Custom Umrah Programs'}
          </h2>
          <p className="text-xs text-[#795037] max-w-xl leading-relaxed">
            {isAr 
              ? 'اختر مستوى فنادق مكة والمدينة، عدد الليالي، نوع التسكين، وقطار الحرمين لحساب التسعير الفوري للشخص والمجموعة.'
              : 'Configure Makkah & Madinah hotel proximity, nights, occupancy, and Haramain bullet train to compute real-time quotes.'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFC798] text-center shrink-0 relative z-10 shadow-xs">
          <div className="text-[10px] text-[#8C6218] uppercase font-bold tracking-wider">
            {isAr ? 'السعر للشخص' : 'Price per Pilgrim'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#44200F] font-mono">
            ${result.pricePerPersonUsd}
          </div>
          <div className="text-[11px] text-[#795037] font-mono">
            {result.pricePerPersonSar} SAR · {result.pricePerPersonEgp.toLocaleString()} EGP
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Makkah Hotel & Nights Card */}
          <div className="bg-white rounded-3xl border border-[#EDE0CC] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE0CC]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🕋</span>
                <div>
                  <h3 className="font-extrabold text-sm text-[#44200F]">
                    {isAr ? 'فنادق وإقامة مكة المكرمة' : 'Makkah Al-Mukarramah Accommodation'}
                  </h3>
                  <p className="text-[11px] text-[#795037]">
                    {isAr ? 'اختر تصنيف الفندق ومسافة القرب من المسجد الحرام' : 'Select hotel tier and proximity to Holy Kaaba'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#8C6218] bg-[#FDF4E0] px-2.5 py-1 rounded-lg border border-[#DFC798]">{makkahNights} {isAr ? 'ليالٍ' : 'Nights'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor={makkahSelectId} className="block text-xs font-bold text-[#44200F] mb-1.5">
                  {isAr ? 'تصنيف وموقع فندق مكة:' : 'Makkah Hotel Proximity Tier:'}
                </label>
                <select
                  id={makkahSelectId}
                  value={makkahTierId}
                  onChange={e => setMakkahTierId(e.target.value)}
                  className="w-full text-xs font-bold bg-[#FAF8F5] border border-[#EDE0CC] rounded-xl px-3.5 py-2.5 text-[#44200F] focus:outline-hidden focus:border-[#B8860B]"
                >
                  {MAKKAH_HOTEL_TIERS.map(t => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.nameAr : t.nameEn} (${t.pricePerNightUsd}/night)
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-[#795037] mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#B8860B]" />
                  <span>{isAr ? selectedMakkah.distanceDescAr : selectedMakkah.distanceDescEn}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#44200F] mb-1">
                  <span>{isAr ? 'عدد ليالي مكة المكرمة:' : 'Makkah Nights Count:'}</span>
                  <span className="font-mono text-[#8C6218] font-extrabold">{makkahNights} {isAr ? 'ليالٍ' : 'Nights'}</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={makkahNights}
                  onChange={e => setMakkahNights(parseInt(e.target.value))}
                  className="w-full accent-[#B8860B] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#795037] font-mono">
                  <span>3 Nights</span>
                  <span>7 Nights (Standard)</span>
                  <span>14 Nights</span>
                  <span>20 Nights</span>
                </div>
              </div>
            </div>
          </div>

          {/* Madinah Hotel & Nights Card */}
          <div className="bg-white rounded-3xl border border-[#EDE0CC] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE0CC]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🕌</span>
                <div>
                  <h3 className="font-extrabold text-sm text-[#065F46]">
                    {isAr ? 'فنادق وإقامة المدينة المنورة' : 'Madinah Al-Munawwarah Accommodation'}
                  </h3>
                  <p className="text-[11px] text-[#795037]">
                    {isAr ? 'القرب من المسجد النبوي الشريف والروضة المباركة' : 'Proximity to the Prophet’s Mosque'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">{madinahNights} {isAr ? 'ليالٍ' : 'Nights'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor={madinahSelectId} className="block text-xs font-bold text-[#44200F] mb-1.5">
                  {isAr ? 'تصنيف فندق المدينة:' : 'Madinah Hotel Tier:'}
                </label>
                <select
                  id={madinahSelectId}
                  value={madinahTierId}
                  onChange={e => setMadinahTierId(e.target.value)}
                  className="w-full text-xs font-bold bg-[#F5FBF8] border border-emerald-200 rounded-xl px-3.5 py-2.5 text-emerald-950 focus:outline-hidden focus:border-emerald-600"
                >
                  {MADINAH_HOTEL_TIERS.map(t => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.nameAr : t.nameEn} (${t.pricePerNightUsd}/night)
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-[#065F46] mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{isAr ? selectedMadinah.distanceDescAr : selectedMadinah.distanceDescEn}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#44200F] mb-1">
                  <span>{isAr ? 'عدد ليالي المدينة المنورة:' : 'Madinah Nights Count:'}</span>
                  <span className="font-mono text-[#065F46] font-extrabold">{madinahNights} {isAr ? 'ليالٍ' : 'Nights'}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  value={madinahNights}
                  onChange={e => setMadinahNights(parseInt(e.target.value))}
                  className="w-full accent-[#065F46] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#795037] font-mono">
                  <span>2 Nights</span>
                  <span>4 Nights (Standard)</span>
                  <span>8 Nights</span>
                  <span>15 Nights</span>
                </div>
              </div>
            </div>
          </div>

          {/* Occupancy & Logistics Configuration */}
          <div className="bg-white rounded-3xl border border-[#EDE0CC] p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-[#44200F] pb-2 border-b border-[#EDE0CC]">
              {isAr ? 'نوع التسكين، النقل، والخدمات المضافة' : 'Room Occupancy, Transit & Add-ons'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Room Occupancy */}
              <div>
                <div className="block text-xs font-bold text-[#44200F] mb-1.5">
                  {isAr ? 'توزيع الغرف (التسكين):' : 'Room Occupancy Type:'}
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAF6EE] border border-[#EDE0CC] rounded-xl text-xs font-bold text-[#795037]">
                  <button
                    type="button"
                    onClick={() => setRoomType('double')}
                    className={`py-2 px-2 rounded-lg transition cursor-pointer text-center ${
                      roomType === 'double' ? 'bg-[#8C6218] text-white shadow-2xs' : 'hover:bg-white text-[#44200F]'
                    }`}
                  >
                    {isAr ? 'ثنائية (DBL)' : 'Double'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomType('triple')}
                    className={`py-2 px-2 rounded-lg transition cursor-pointer text-center ${
                      roomType === 'triple' ? 'bg-[#8C6218] text-white shadow-2xs' : 'hover:bg-white text-[#44200F]'
                    }`}
                  >
                    {isAr ? 'ثلاثية (TRP)' : 'Triple'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomType('quad')}
                    className={`py-2 px-2 rounded-lg transition cursor-pointer text-center ${
                      roomType === 'quad' ? 'bg-[#8C6218] text-white shadow-2xs' : 'hover:bg-white text-[#44200F]'
                    }`}
                  >
                    {isAr ? 'رباعية (QUAD)' : 'Quad'}
                  </button>
                </div>
              </div>

              {/* Transportation */}
              <div>
                <label htmlFor={transportSelectId} className="block text-xs font-bold text-[#44200F] mb-1.5">
                  {isAr ? 'وسيلة التنقل بين مكة والمدينة:' : 'Intercity High-Speed Transit:'}
                </label>
                <select
                  id={transportSelectId}
                  value={transportType}
                  onChange={e => setTransportType(e.target.value as any)}
                  className="w-full text-xs font-bold bg-[#FAF8F5] border border-[#EDE0CC] rounded-xl px-3 py-2 text-[#44200F] focus:outline-hidden focus:border-[#B8860B]"
                >
                  <option value="haramain_first">{isAr ? 'قطار الحرمين السريع (درجة أولى VIP)' : 'Haramain Train (1st Class)'}</option>
                  <option value="haramain_economy">{isAr ? 'قطار الحرمين السريع (درجة الضيافة)' : 'Haramain Train (Economy)'}</option>
                  <option value="vip_gmc">{isAr ? 'سيارة GMC عائلية خاصة وسائق' : 'Private GMC Chauffeur'}</option>
                  <option value="bus_coach">{isAr ? 'حافلة سياحية مكيفة حديثة' : 'Modern Tour Coach Bus'}</option>
                </select>
              </div>

              {/* Number of Pax */}
              <div>
                <label className="block text-xs font-bold text-[#44200F] mb-1.5">
                  {isAr ? 'عدد أفراد الفوج / المسافرين:' : 'Total Pilgrims Count:'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={groupPaxCount}
                  onChange={e => setGroupPaxCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs font-bold px-3 py-2 bg-[#FAF8F5] border border-[#EDE0CC] rounded-xl text-[#44200F]"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#44200F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeZamzam}
                    onChange={e => setIncludeZamzam(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>{isAr ? 'شحن عبوة زمزم معتمدة ٥ لتر لكل معتمر' : 'Include 5L Sealed Zamzam box'}</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-[#44200F] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeZiyarat}
                    onChange={e => setIncludeZiyarat(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>{isAr ? 'شامل جولات المزارات بمكة والمدينة' : 'Include Makkah & Madinah Ziyarat'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Cost Summary & Quote Handoff */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#DFC798] shadow-sm p-6 space-y-5 sticky top-4">
            <div className="pb-3 border-b border-[#EDE0CC]">
              <div className="text-[10px] text-[#8C6218] uppercase font-bold tracking-wider">
                {isAr ? 'تفصيل التكلفة التقديرية' : 'Estimated Cost Breakdown'}
              </div>
              <h4 className="font-extrabold text-base text-[#44200F] mt-0.5">
                {isAr ? 'بيان تسعير الباقة للشخص' : 'Per Pilgrim Cost Sheet'}
              </h4>
            </div>

            {/* Itemized list */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#FAF3E3]">
                <span className="text-[#795037]">{isAr ? `إقامة مكة (${makkahNights} ليالٍ):` : `Makkah (${makkahNights} nights):`}</span>
                <span className="font-mono font-bold text-[#44200F]">${result.breakdown.makkahHotelCostPerPerson}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#FAF3E3]">
                <span className="text-[#795037]">{isAr ? `إقامة المدينة (${madinahNights} ليالٍ):` : `Madinah (${madinahNights} nights):`}</span>
                <span className="font-mono font-bold text-[#44200F]">${result.breakdown.madinahHotelCostPerPerson}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#FAF3E3]">
                <span className="text-[#795037]">{isAr ? 'النقل وقطار الحرمين:' : 'Rail & Transfers:'}</span>
                <span className="font-mono font-bold text-[#44200F]">${result.breakdown.transportCostPerPerson}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#FAF3E3]">
                <span className="text-[#795037]">{isAr ? 'التأشيرة الإلكترونية والتأمين:' : 'Visa & Medical Insurance:'}</span>
                <span className="font-mono font-bold text-[#44200F]">${result.breakdown.visaInsurancePerPerson}</span>
              </div>

              {includeZamzam && (
                <div className="flex justify-between py-1 border-b border-[#FAF3E3] text-emerald-800">
                  <span>{isAr ? 'مياه زمزم المعتمدة:' : 'Zamzam Sealed Pack:'}</span>
                  <span className="font-mono font-bold">${result.breakdown.zamzamCostPerPerson}</span>
                </div>
              )}

              {includeZiyarat && (
                <div className="flex justify-between py-1 border-b border-[#FAF3E3] text-emerald-800">
                  <span>{isAr ? 'جولات المزارات الشريفة:' : 'Sacred Ziyarat Tours:'}</span>
                  <span className="font-mono font-bold">${result.breakdown.ziyaratCostPerPerson}</span>
                </div>
              )}
            </div>

            {/* Total Section */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5D5B5] space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#795037]">{isAr ? 'السعر للشخص:' : 'Per Person:'}</span>
                <span className="font-mono text-xl font-black text-[#44200F]">
                  ${result.pricePerPersonUsd}
                </span>
              </div>
              <div className="text-[11px] text-[#795037] font-mono text-end">
                ≈ {result.pricePerPersonSar} SAR · {result.pricePerPersonEgp.toLocaleString()} EGP
              </div>

              <div className="pt-2 border-t border-[#EDE0CC] flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#44200F]">
                  {isAr ? `إجمالي الفوج (${groupPaxCount} معتمرين):` : `Group (${groupPaxCount} Pax):`}
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-700">
                  ${result.totalGroupPriceUsd}
                </span>
              </div>
            </div>

            {/* Traveler Name & Launch Quote */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold text-[#44200F]">
                {isAr ? 'اسم العميل أو الفوج لإصدار العرض:' : 'Client or Group Name for Quote:'}
              </label>
              <input
                type="text"
                value={customLeadName}
                onChange={e => setCustomLeadName(e.target.value)}
                placeholder={isAr ? 'مثال: معتمرو شركة الأمل (٤ أشخاص)' : 'e.g. Al-Amal VIP Umrah Delegation'}
                className="w-full text-xs font-bold px-3 py-2 border border-[#EDE0CC] rounded-xl focus:outline-hidden focus:border-[#B8860B]"
              />

              <button
                type="button"
                onClick={handleLaunchQuoteFromCustom}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#8C6218] to-[#B8860B] hover:from-[#734F10] hover:to-[#9A6F1A] text-white font-bold text-xs rounded-2xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'توليد وفتح عرض السعر المخصص' : 'Generate & Launch Custom Quote'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
