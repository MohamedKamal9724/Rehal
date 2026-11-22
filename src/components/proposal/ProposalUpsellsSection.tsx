import React, { useState } from 'react';
import { 
  Sparkles, Check, Plus, Sun, Plane, Landmark, 
  Ship, Utensils, Compass, Award, Tag, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { ProposalUpsell, Currency } from '../../types';
import { DEFAULT_EXCHANGE_RATES } from '../../lib/constants';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface ProposalUpsellsSectionProps {
  upsells: ProposalUpsell[];
  selectedUpsellIds: string[];
  onToggleUpsell: (upsellId: string) => void;
  currency: Currency;
  adultsCount: number;
  basePrice: number;
  isRtl?: boolean;
  onOpenAcceptModal?: () => void;
}

export const ProposalUpsellsSection: React.FC<ProposalUpsellsSectionProps> = ({
  upsells,
  selectedUpsellIds,
  onToggleUpsell,
  currency,
  adultsCount = 2,
  basePrice,
  isRtl = false,
  onOpenAcceptModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const selectedSet = new Set(selectedUpsellIds);

  const convertPrice = (usdAmount: number): number => {
    if (currency === 'USD') return usdAmount;
    const egp = usdAmount * (DEFAULT_EXCHANGE_RATES.USD?.toEgp || 49.5);
    const targetRate = DEFAULT_EXCHANGE_RATES[currency]?.toEgp || 1.0;
    if (currency === 'EGP') return Math.round(egp);
    return Math.round(egp / targetRate);
  };

  const getCurrencySymbol = (curr: Currency): string => {
    switch (curr) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'EGP': return 'EGP ';
      default: return '$';
    }
  };

  const symbol = getCurrencySymbol(currency);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Excursion': return Sun;
      case 'VIP Service': return Award;
      case 'Upgrade': return Ship;
      case 'Dining': return Utensils;
      default: return Sparkles;
    }
  };

  const categories = ['all', ...Array.from(new Set(upsells.map(u => u.category)))];

  const filteredUpsells = activeCategory === 'all'
    ? upsells
    : upsells.filter(u => u.category === activeCategory);

  // Calculate selected total in target currency
  const upsellsTotal = upsells.reduce((sum, u) => {
    if (selectedSet.has(u.id)) {
      const converted = convertPrice(u.price);
      const amount = u.priceBasis === 'per_person' ? converted * adultsCount : converted;
      return sum + amount;
    }
    return sum;
  }, 0);

  const grandTotal = basePrice + upsellsTotal;
  const selectedCount = selectedSet.size;

  return (
    <section className="bg-white rounded-md border border-[#e7e7e7] shadow-xs p-5 sm:p-7 space-y-6 print:break-inside-avoid">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7e7e7]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-[#003580] text-[#ffb700] flex items-center justify-center font-bold text-xs shadow-2xs">
              <Sparkles className="w-4 h-4 fill-[#ffb700]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#003580] tracking-tight">
              {isRtl ? 'تجارب كبار الزوار والترقيات الاختيارية' : 'Curated VIP Experiences & Journey Enhancements'}
            </h2>
            <span className="text-[10px] font-bold text-[#008009] bg-[#e8f5e9] px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
              {isRtl ? 'اختياري' : 'Optional Add-ons'}
            </span>
          </div>
          <p className="text-xs text-[#595959] leading-relaxed">
            {isRtl
              ? 'خصص رحلتك الخاصة باختيار هذه الأنشطة المميزة المصممة حصرياً لضيوفنا مع مرشدين وخدمات كبار الزوار'
              : 'Enhance your private Egypt journey with handpicked luxury highlights. Click to add or remove any experience with live price calculation.'}
          </p>
        </div>

        {/* Dynamic Investment Ticker Pill */}
        <div className="bg-[#f0f6ff] border border-[#006ce4]/30 rounded-md p-3 text-end shrink-0 sm:min-w-[200px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#003580] block">
            {isRtl ? 'إجمالي الاستثمار مع الترقيات' : 'Trip Total with Upgrades'}
          </span>
          <div className="text-xl font-black text-[#003580] tabular-nums tracking-tight flex items-baseline justify-end gap-1">
            <span>{symbol}</span>
            <AnimatedCounter value={grandTotal} />
            <span className="text-xs font-bold text-[#006ce4] ml-1">{currency}</span>
          </div>
          <div className="text-[11px] text-[#595959] mt-0.5 font-medium">
            {selectedCount > 0 ? (
              <span className="text-[#008009] font-bold inline-flex items-center gap-1 justify-end">
                <span>+{selectedCount} upgrade{selectedCount !== 1 ? 's' : ''} (+{symbol}</span>
                <AnimatedCounter value={upsellsTotal} />
                <span> {currency})</span>
              </span>
            ) : (
              <span>Base private itinerary only</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn-tactile px-3 py-1 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#003580] text-white shadow-xs'
                : 'bg-[#f8f9fa] text-[#595959] hover:text-[#1a1a1a] hover:bg-[#e7e7e7] border border-[#e7e7e7]'
            }`}
          >
            {cat === 'all' ? (isRtl ? 'جميع الترقيات' : 'All Upgrades') : cat}
          </button>
        ))}
      </div>

      {/* Upsell Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUpsells.map(upsell => {
          const isSelected = selectedSet.has(upsell.id);
          const Icon = getCategoryIcon(upsell.category);
          const itemUnitPrice = convertPrice(upsell.price);
          const computedCost = upsell.priceBasis === 'per_person' ? itemUnitPrice * adultsCount : itemUnitPrice;

          return (
            <div
              key={upsell.id}
              onClick={() => onToggleUpsell(upsell.id)}
              className={`card-lift p-4 rounded-md border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                isSelected
                  ? 'border-[#008009] bg-[#e8f5e9]/40 shadow-xs ring-2 ring-[#008009]/20'
                  : 'border-[#e7e7e7] bg-white hover:border-[#006ce4]/60 hover:bg-[#f8fafd]'
              }`}
            >
              <div>
                {/* Top Row: City Badge, Category, and Luxury Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#003580] bg-[#f0f6ff] px-2 py-0.5 rounded border border-[#006ce4]/20 flex items-center gap-1">
                      <Icon className="w-3 h-3 text-[#006ce4]" />
                      <span>{upsell.city}</span>
                    </span>
                    <span className="text-[10px] font-medium text-[#595959]">
                      {upsell.category}
                    </span>
                  </div>

                  {upsell.badge && (
                    <span className="text-[10px] font-bold text-[#00224f] bg-[#ffb700] px-2 py-0.5 rounded shadow-2xs border border-[#e6a600]">
                      {upsell.badge}
                    </span>
                  )}
                </div>

                {/* Title & Arabic */}
                <h3 className="font-bold text-sm text-[#1a1a1a] tracking-tight group-hover:text-[#006ce4] transition-colors">
                  {upsell.title}
                </h3>
                {upsell.arabicTitle && (
                  <p className="text-[11px] font-arabic text-[#595959] mt-0.5">
                    {upsell.arabicTitle}
                  </p>
                )}

                {/* Description */}
                <p className="text-xs text-[#595959] leading-relaxed mt-2 line-clamp-2">
                  {upsell.description}
                </p>
              </div>

              {/* Bottom Price & Toggle Action */}
              <div className="mt-4 pt-3 border-t border-[#e7e7e7] flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-[#1a1a1a] tabular-nums">
                      +{symbol}{itemUnitPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-[#003580]">
                      {currency}
                    </span>
                    <span className="text-[10px] text-[#595959] font-medium ms-0.5">
                      {upsell.priceBasis === 'per_person' ? '/ person' : '/ party'}
                    </span>
                  </div>
                  {upsell.priceBasis === 'per_person' && adultsCount > 1 && (
                    <span className="text-[10px] text-[#595959] block tabular-nums">
                      ({symbol}{computedCost.toLocaleString()} total for {adultsCount} adults)
                    </span>
                  )}
                </div>

                {/* Toggle Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleUpsell(upsell.id);
                  }}
                  className={`btn-tactile px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#008009] text-white shadow-xs'
                      : 'bg-[#006ce4] hover:bg-[#0057b8] text-white'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'تمت الإضافة ✓' : 'Added to Trip'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إضافة للرحلة' : 'Add to Trip'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer Strip if items selected */}
      {selectedCount > 0 && (
        <div className="p-4 bg-[#f8f9fa] border border-[#006ce4]/30 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#008009] shrink-0" />
            <div>
              <span className="text-xs font-bold text-[#1a1a1a]">
                {selectedCount} VIP enhancement{selectedCount !== 1 ? 's' : ''} customized for your party
              </span>
              <p className="text-[11px] text-[#595959]">
                These will be reserved and confirmed with our licensed operations team upon booking.
              </p>
            </div>
          </div>

          {onOpenAcceptModal && (
            <button
              onClick={onOpenAcceptModal}
              className="btn-tactile px-4 py-2 bg-[#006ce4] hover:bg-[#0057b8] text-white rounded-md text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{isRtl ? 'حجز البرنامج والترقيات' : 'Confirm & Book With Upgrades'}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};
