import React, { useState, useEffect } from 'react';
import { 
  Quote, Workspace, ProposalLanguage, Currency 
} from '../types';
import { repository } from '../lib/storage';
import { PROPOSAL_LANGUAGES, DEFAULT_EXCHANGE_RATES } from '../lib/constants';
import { 
  Calendar, Users, MapPin, CheckCircle2, MessageCircle, 
  Printer, ArrowLeft, Shield, Check, Heart, Building2,
  Share2, Copy, ExternalLink, QrCode, FileText, CheckCircle,
  Phone, Mail, Compass, Award, Clock,
  Plane, Car, Ship, Utensils, Bed, Landmark, Sparkles, Navigation, Layers,
  FileSpreadsheet, Download, Sun, CloudSun, Wind, Thermometer,
  ChevronLeft, ChevronRight, Search, X
} from 'lucide-react';
import { exportQuoteToExcel, exportQuoteToLuxuryPDF } from '../lib/exportUtils';
import { fetchMultipleDestinationsWeather, DestinationWeather } from '../lib/weatherService';
import { ProposalUpsellsSection } from './proposal/ProposalUpsellsSection';
import { getSuggestedUpsellsForQuote, calculateUpsellTotal } from '../lib/upsellService';
import { OperationsDispatchModal } from './operations/OperationsDispatchModal';
import { TravelerMobileConcierge } from './concierge/TravelerMobileConcierge';
import { getTripFileForQuote } from '../lib/conciergeService';
import { AnimatedCounter } from './common/AnimatedCounter';
import { RihalLogo } from './common/RihalLogo';

import { motion, AnimatePresence } from 'motion/react';
import { 
  modalBackdropVariants, 
  modalDialogVariants, 
  executiveTransition 
} from '../lib/motion';

interface ProposalViewerProps {
  quote: Quote;
  workspace: Workspace;
  onBackToApp: () => void;
  /**
   * True if rendering in dedicated client mode (traveler link)
   */
  isClientView?: boolean;
  /**
   * Record this render as a CLIENT view (increments counters, may create a follow-up task).
   */
  trackView?: boolean;
  onQuoteUpdated?: (updated: Quote) => void;
  onConfirmTrip?: (quote: Quote) => void;
}

interface DayVisualHighlights {
  landmarks: string[];
  transport: { label: string; icon: 'flight' | 'van' | 'cruise' | 'train' | 'felucca' }[];
  meals: { code: 'B' | 'L' | 'D'; label: string }[];
  hasEgyptologist: boolean;
  overnightStay?: string;
}

function analyzeDayHighlights(day: any): DayVisualHighlights {
  const text = `${day.title || ''} ${day.description || ''} ${day.lines?.map((l: any) => l.serviceName).join(' ') || ''}`.toLowerCase();
  
  const landmarks: string[] = [];
  if (/pyramid|giza|sphinx|أهرامات/i.test(text)) landmarks.push('Giza Pyramids & Sphinx');
  if (/museum|nmec|gem|متحف/i.test(text)) landmarks.push('Grand Egyptian Museum / NMEC');
  if (/karnak|كرنك/i.test(text)) landmarks.push('Karnak Temple Complex');
  if (/luxor temple|معبد الأقصر/i.test(text)) landmarks.push('Luxor Temple by Night');
  if (/valley of the kings|ملوك/i.test(text)) landmarks.push('Valley of the Kings');
  if (/philae|فيلة/i.test(text)) landmarks.push('Philae Island Temple');
  if (/high dam|سد عالي/i.test(text)) landmarks.push('Aswan High Dam');
  if (/abu simbel|سمبل/i.test(text)) landmarks.push('Abu Simbel Sun Temples');
  if (/edfu|إدفو/i.test(text)) landmarks.push('Temple of Horus at Edfu');
  if (/kom ombo|كوم أمبو/i.test(text)) landmarks.push('Dual Temple of Kom Ombo');
  if (/khan el-khalili|خليلي/i.test(text)) landmarks.push('Khan el-Khalili Bazaar');
  if (/red sea|hurghada|coral|غردقة/i.test(text)) landmarks.push('Red Sea Coral Reefs');
  if (/alexandria|citadel|إسكندرية/i.test(text)) landmarks.push('Qaitbay Citadel & Library');

  const transport: { label: string; icon: 'flight' | 'van' | 'cruise' | 'train' | 'felucca' }[] = [];
  if (/flight|fly|airport|egyptair|طيران/i.test(text)) {
    transport.push({ label: 'Domestic Flight (EgyptAir)', icon: 'flight' });
  }
  if (/cruise|ابحار|كروز/i.test(text)) {
    transport.push({ label: '5★ Luxury Nile Cruise', icon: 'cruise' });
  } else if (/felucca|sail|فلوكة/i.test(text)) {
    transport.push({ label: 'Private Nile Felucca', icon: 'felucca' });
  }
  if (/transfer|chauffeur|van|mercedes|سيارة|توصيل/i.test(text)) {
    transport.push({ label: 'Private A/C Chauffeur', icon: 'van' });
  }
  if (/train|sleeper|قطار/i.test(text)) {
    transport.push({ label: 'Sleeper Train', icon: 'train' });
  }
  if (transport.length === 0) {
    transport.push({ label: 'Private VIP Transfer', icon: 'van' });
  }

  const meals: { code: 'B' | 'L' | 'D'; label: string }[] = [];
  if (/breakfast|فطار|إفطار/i.test(text) || (day.dayNumber && day.dayNumber > 1)) {
    meals.push({ code: 'B', label: 'Breakfast' });
  }
  if (/lunch|غداء|restaurant|مطعم/i.test(text)) {
    meals.push({ code: 'L', label: 'Lunch' });
  }
  if (/dinner|عشاء|gala/i.test(text) || /cruise/i.test(text)) {
    meals.push({ code: 'D', label: 'Dinner' });
  }

  const hasEgyptologist = /guide|egyptologist|مرشد/i.test(text) || landmarks.length > 0;

  let overnightStay: string | undefined;
  const hotelLine = day.lines?.find((l: any) => l.serviceType === 'Hotel' || /hotel|resort|lodge/i.test(l.serviceName));
  if (hotelLine) {
    overnightStay = hotelLine.serviceName;
  } else if (/cruise/i.test(text)) {
    overnightStay = 'Overnight: 5★ Deluxe Nile Cruise Ship';
  } else if (day.city) {
    overnightStay = `Overnight: 5★ Luxury Accommodations in ${day.city}`;
  }

  return { landmarks, transport, meals, hasEgyptologist, overnightStay };
}

export const ProposalViewer: React.FC<ProposalViewerProps> = ({
  quote: initialQuote,
  workspace,
  onBackToApp,
  isClientView = false,
  trackView = false,
  onQuoteUpdated,
  onConfirmTrip,
}) => {
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [selectedLang, setSelectedLang] = useState<ProposalLanguage>(quote.language || 'en');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(quote.targetCurrency || 'USD');
  const [theme, setTheme] = useState<'luxury' | 'classic' | 'modern'>(workspace.defaultProposalTheme || 'luxury');
  const [interestedSent, setInterestedSent] = useState(false);
  
  // Modals
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(quote.status === 'Accepted');
  const [linkCopied, setLinkCopied] = useState(false);
  const [conciergeLinkCopied, setConciergeLinkCopied] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'all' | string>('all');
  const [itinerarySearch, setItinerarySearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'proposal' | 'concierge'>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('view') === 'concierge' || p.get('tab') === 'concierge' ? 'concierge' : 'proposal';
    } catch {
      return 'proposal';
    }
  });

  // Client accept form
  const [clientName, setClientName] = useState(quote.travelerName || '');
  const [clientPhone, setClientPhone] = useState(quote.travelerPhone || '');
  const [clientEmail, setClientEmail] = useState(quote.travelerEmail || '');
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);
  const [weatherData, setWeatherData] = useState<Record<string, DestinationWeather>>({});
  const [loadingWeather, setLoadingWeather] = useState(false);

  const isRtl = selectedLang === 'ar';

  useEffect(() => {
    const rawCities = quote.days?.map(d => d.city).filter(Boolean) || [];
    const cities = Array.from(new Set(rawCities));
    if (cities.length === 0) {
      cities.push('Cairo', 'Giza', 'Luxor', 'Aswan');
    }

    let active = true;
    setLoadingWeather(true);
    fetchMultipleDestinationsWeather(cities)
      .then(data => {
        if (active) setWeatherData(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingWeather(false);
      });

    return () => {
      active = false;
    };
  }, [quote.id, quote.days]);

  // Operator preview is not a customer view. Real analytics belongs on the public backend.

  const [selectedUpsellIds, setSelectedUpsellIds] = useState<string[]>(quote.selectedUpsellIds || []);

  const availableUpsells = (quote.upsells && quote.upsells.length > 0)
    ? quote.upsells
    : getSuggestedUpsellsForQuote(quote);

  // Currency conversion calculation based on exact quote currency or quote.totalPriceEgp
  const convertPrice = (targetCurr: Currency): number => {
    const baseCurrency = (quote.displayCurrency || quote.targetCurrency || 'EGP') as Currency;
    if (targetCurr === baseCurrency && quote.totalPriceQuoteCurrency > 0) {
      return Math.round(quote.totalPriceQuoteCurrency);
    }
    const totalEgp = quote.totalPriceEgp || (quote.totalPriceQuoteCurrency * (quote.exchangeRateUsed || DEFAULT_EXCHANGE_RATES[baseCurrency]?.toEgp || 49.5));
    const egpPerUnit = DEFAULT_EXCHANGE_RATES[targetCurr]?.toEgp || 1.0;
    if (targetCurr === 'EGP') return Math.round(totalEgp);
    return Math.round(totalEgp / egpPerUnit);
  };

  const convertAmount = (amountInUsd: number, targetCurr: Currency): number => {
    if (targetCurr === 'USD') return amountInUsd;
    const egp = amountInUsd * (DEFAULT_EXCHANGE_RATES.USD?.toEgp || 49.5);
    const egpPerUnit = DEFAULT_EXCHANGE_RATES[targetCurr]?.toEgp || 1.0;
    if (targetCurr === 'EGP') return Math.round(egp);
    return Math.round(egp / egpPerUnit);
  };

  const getCurrencySymbol = (curr: Currency): string => {
    switch (curr) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'EGP': return 'EGP ';
      default: return '$';
    }
  };

  const baseDisplayPrice = convertPrice(displayCurrency);
  const adultsCount = quote.group?.adults || 2;
  const upsellsTotalUsd = calculateUpsellTotal(availableUpsells, selectedUpsellIds, adultsCount);
  const upsellsDisplayPrice = convertAmount(upsellsTotalUsd, displayCurrency);
  const currentDisplayPrice = baseDisplayPrice + upsellsDisplayPrice;
  const perPersonPrice = Math.round(currentDisplayPrice / Math.max(1, adultsCount));

  const selectedUpsellsList = availableUpsells.filter(u => selectedUpsellIds.includes(u.id));

  const handleToggleUpsell = (upsellId: string) => {
    const next = selectedUpsellIds.includes(upsellId)
      ? selectedUpsellIds.filter(id => id !== upsellId)
      : [...selectedUpsellIds, upsellId];
    
    setSelectedUpsellIds(next);

    const updatedQuote: Quote = {
      ...quote,
      upsells: availableUpsells,
      selectedUpsellIds: next,
      updatedAt: new Date().toISOString(),
    };
    setQuote(updatedQuote);
    repository.saveQuote(updatedQuote);
    onQuoteUpdated?.(updatedQuote);
  };

  // Client Shareable Link Construction
  const getShareableUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=client&quoteId=${encodeURIComponent(quote.id)}`;
  };

  const getConciergeUrl = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=concierge&quoteId=${encodeURIComponent(quote.id)}`;
  };

  const handleCopyLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleCopyConciergeLink = () => {
    const url = getConciergeUrl();
    navigator.clipboard.writeText(url);
    setConciergeLinkCopied(true);
    setTimeout(() => setConciergeLinkCopied(false), 2500);
  };

  // WhatsApp Intent URL
  const cleanPhone = (workspace.whatsappNumber || '').replace(/[^0-9]/g, '');
  const upsellCountText = selectedUpsellIds.length > 0 ? ` + ${selectedUpsellIds.length} VIP upgrades` : '';
  const whatsappBookingMessage = encodeURIComponent(
    `Hello ${workspace.name}! I am reviewing proposal ${quote.quoteNumber} for ${quote.travelerName} (${quote.durationDays} Days, ${quote.startDate}${upsellCountText}). Total: ${getCurrencySymbol(displayCurrency)}${currentDisplayPrice.toLocaleString()} ${displayCurrency}. I would like to proceed with the booking.`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappBookingMessage}`;

  // Operator WhatsApp link dispatch to client
  const operatorSendToTravelerMessage = encodeURIComponent(
    `Dear ${quote.travelerName},\n\nWe are delighted to present your bespoke Egypt itinerary proposal (${quote.quoteNumber}) from ${workspace.name}.\n\nYou can review your full day-by-day program, luxury accommodations, and pricing here:\n${getShareableUrl()}\n\nWarm regards,\n${workspace.name}`
  );
  const operatorWhatsAppShareUrl = `https://wa.me/${(quote.travelerPhone || '').replace(/[^0-9]/g, '')}?text=${operatorSendToTravelerMessage}`;

  const handleAcceptProposal = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAccept(true);
    setTimeout(() => {
      setIsSubmittingAccept(false);
      setAcceptedSuccess(true);
    }, 350);
  };

  if (viewMode === 'concierge') {
    return (
      <TravelerMobileConcierge
        quote={quote}
        workspace={workspace}
        tripFile={getTripFileForQuote(quote.id)}
        onBackToProposal={() => setViewMode('proposal')}
        onBackToApp={onBackToApp}
        isOperatorPreview={!isClientView}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#f5f5f5] text-[#1a1a1a] ${isRtl ? 'font-arabic' : 'font-sans'} print:bg-white`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER BARS (OPERATOR PREVIEW vs CLIENT VIEW) */}
      {/* ---------------------------------------------------- */}
      {!isClientView ? (
        /* Operator Navigation Bar */
        <div className="bg-[#44200F] text-[#FAF7F2] px-3.5 sm:px-5 py-2.5 sticky top-0 z-50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#795037]/30 print:hidden">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <button
              onClick={onBackToApp}
              className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 flex items-center gap-1.5 text-xs text-[#EDE0CC] hover:text-[#FAF7F2] font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
              <span>{isRtl ? 'العودة إلى رِحال' : 'Back to RIHAL'}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#EDE0CC] font-mono">{quote.quoteNumber}</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded whitespace-nowrap shrink-0 ${
                quote.status === 'Accepted' || acceptedSuccess ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                quote.status === 'Viewed' ? 'bg-[#EDE0CC] text-[#44200F] border border-[#C4A177]/40' :
                'bg-white/10 text-white border border-white/20'
              }`}>
                {acceptedSuccess ? 'Accepted' : quote.status}
              </span>
            </div>
          </div>

          <div className="luxury-tab-bar flex items-center gap-2 text-xs overflow-x-auto pb-0.5 sm:pb-0">
            {/* Language selector */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as any)}
              className="h-9 bg-[#321609] border border-[#EDE0CC]/30 text-[#FAF7F2] rounded-xl px-2.5 text-xs outline-hidden cursor-pointer shrink-0"
            >
              {PROPOSAL_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[#44200F] text-[#FAF7F2]">{l.flag} {l.name}</option>
              ))}
            </select>

            {/* Create / Confirm Trip Controlled Transition */}
            {onConfirmTrip && (
              <button
                onClick={() => {
                  onConfirmTrip(quote);
                  onBackToApp();
                }}
                title={isRtl ? 'تأكيد الحجز وإنشاء ملف الرحلة التشغيلي' : 'Confirm quote and create operational trip record'}
                className="btn-tactile h-9 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                <span>{isRtl ? 'تأكيد وإنشاء الرحلة' : 'Create / Confirm Trip'}</span>
              </button>
            )}

            {/* Share Link Button */}
            <button
              onClick={() => setShareModalOpen(true)}
              className="h-9 inline-flex items-center justify-center gap-1.5 bg-[#795037] hover:bg-[#5c3823] text-[#FAF7F2] px-3 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Share Link</span>
            </button>

            {/* 1-Click Supplier Vouchers & Operations Dispatch */}
            <button
              onClick={() => setDispatchModalOpen(true)}
              title="1-Click Supplier Vouchers & Operations Dispatch Generator"
              className="btn-tactile h-9 inline-flex items-center justify-center gap-1.5 bg-[#321609] hover:bg-[#200B04] text-white border border-[#C4A177]/40 px-3 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Shield className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
              <span>Vouchers &amp; Dispatch</span>
            </button>

            {/* Live Day Concierge & Tipping Guide Preview */}
            <button
              onClick={() => setViewMode('concierge')}
              title="Preview Traveler Live Day-of-Travel Mobile Concierge & Tipping Guide"
              className="btn-tactile h-9 inline-flex items-center justify-center gap-1.5 bg-[#C4A177] hover:bg-[#b38f64] active:bg-[#a07c52] text-[#44200F] px-3 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>Live Concierge &amp; Tips</span>
            </button>

            {/* Download Luxury PDF */}
            <button
              onClick={() => exportQuoteToLuxuryPDF(quote, workspace)}
              title="Download official luxury PDF proposal"
              className="btn-tactile h-9 inline-flex items-center justify-center gap-1.5 bg-[#C4A177] hover:bg-[#b38f64] active:bg-[#a07c52] text-[#44200F] px-3 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#44200F] shrink-0" />
              <span>Download PDF</span>
            </button>

            {/* Download Master Operator Excel Cost Sheet */}
            <button
              onClick={() => exportQuoteToExcel(quote, workspace)}
              title="Download complete cost breakdown and profit formulas in Microsoft Excel format"
              className="btn-tactile h-9 inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Download Excel (.xls)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Dedicated Client Public Header */
        <div className="bg-[#44200F] text-[#FAF7F2] px-3.5 sm:px-5 py-2.5 sticky top-0 z-50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-[#795037]/30 print:hidden">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#C4A177] border border-white/20 shrink-0">
                <Compass className="w-4 h-4 text-[#C4A177]" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm tracking-tight text-[#FAF7F2] truncate">{workspace.name}</div>
                <div className="text-[10px] text-[#EDE0CC] truncate">Official Itinerary &amp; Travel Proposal</div>
              </div>
            </div>

            {/* Mobile Primary Accept Action */}
            <button
              onClick={() => setAcceptModalOpen(true)}
              className={`md:hidden h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer whitespace-nowrap shrink-0 ${
                quote.status === 'Accepted' || acceptedSuccess
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-[#795037] hover:bg-[#5c3823] text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{quote.status === 'Accepted' || acceptedSuccess ? 'Accepted' : 'Accept & Book'}</span>
            </button>
          </div>

          <div className="luxury-tab-bar flex items-center gap-2 text-xs overflow-x-auto pb-0.5 md:pb-0">
            {/* View Mode: Proposal vs Concierge */}
            <div className="flex items-center gap-1 bg-[#321609] border border-white/15 rounded-xl p-1 shrink-0 h-9">
              <span className="h-7 px-2.5 rounded-lg text-[11px] font-bold bg-[#FAF7F2] text-[#44200F] shadow-2xs inline-flex items-center gap-1 whitespace-nowrap">
                <FileText className="w-3 h-3 shrink-0" />
                <span>Proposal</span>
              </span>
              <button
                onClick={() => setViewMode('concierge')}
                className="h-7 px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 text-[#EDE0CC] hover:text-[#FAF7F2] whitespace-nowrap"
              >
                <Compass className="w-3 h-3 text-[#C4A177] shrink-0" />
                <span>Concierge &amp; Tips</span>
              </button>
            </div>

            {/* Currency selector */}
            <div className="flex items-center gap-1 bg-[#321609] border border-white/15 rounded-xl p-1 shrink-0 h-9">
              {(['USD', 'EUR', 'GBP', 'EGP'] as Currency[]).map(c => (
                <button
                  key={c}
                  onClick={() => setDisplayCurrency(c)}
                  className={`h-7 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                    displayCurrency === c ? 'bg-[#795037] text-white shadow-2xs' : 'text-[#EDE0CC] hover:text-[#FAF7F2]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Language switcher */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as any)}
              className="h-9 bg-[#321609] border border-[#EDE0CC]/30 text-[#FAF7F2] rounded-xl px-2.5 text-xs outline-hidden cursor-pointer shrink-0"
            >
              {PROPOSAL_LANGUAGES.map(l => (
                <option key={l.code} value={l.code} className="bg-[#44200F] text-[#FAF7F2]">{l.flag} {l.name}</option>
              ))}
            </select>

            {/* Download Client PDF Button */}
            <button
              onClick={() => exportQuoteToLuxuryPDF(quote, workspace)}
              title="Download or Print Luxury Proposal as PDF"
              className="h-9 inline-flex items-center justify-center gap-1.5 bg-[#C4A177] hover:bg-[#b38f64] text-[#44200F] px-3 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#44200F] shrink-0" />
              <span>Download PDF</span>
            </button>

            {/* Desktop Accept Itinerary Primary Action */}
            <button
              onClick={() => setAcceptModalOpen(true)}
              className={`hidden md:inline-flex h-9 items-center justify-center gap-1.5 px-3.5 rounded-xl font-bold text-xs transition shadow-sm cursor-pointer whitespace-nowrap shrink-0 ${
                quote.status === 'Accepted' || acceptedSuccess
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-[#795037] hover:bg-[#5c3823] text-white'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{quote.status === 'Accepted' || acceptedSuccess ? 'Proposal Accepted' : 'Accept & Book'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. PRINT EXCLUSIVE FORMAL LETTERHEAD HEADER */}
      {/* ---------------------------------------------------- */}
      <div className="hidden print:block p-8 border-b-2 border-slate-900 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <RihalLogo variant="wordmark" size="md" />
            <div>
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-wider">{workspace.name}</h1>
              <p className="text-xs text-slate-600 mt-0.5">Inbound Destination Management & Luxury Travel Operations</p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <div>Operations Desk: {workspace.contactEmail || 'operations@rihal.eg'} {workspace.contactPhone ? `| Tel: ${workspace.contactPhone}` : ''}</div>
                <div>Support: 24/7 Concierge & Operations Dispatch</div>
              </div>
            </div>
          </div>
          <div className="text-end">
            <div className="text-xs uppercase font-bold text-slate-500">Official Itinerary Proposal</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{quote.quoteNumber}</div>
            <div className="text-xs text-slate-600 mt-1">Issue Date: {quote.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]}</div>
            <div className="text-xs font-semibold text-red-700 mt-0.5">Valid Until: {quote.validUntil}</div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. TRAVELER HERO HEADER (LUXURY PRESENTATION) */}
      {/* ---------------------------------------------------- */}
      <header className="relative py-12 sm:py-16 px-4 sm:px-8 border-b overflow-hidden print:border-b-0 print:py-6 bg-[#44200F] text-[#FAF7F2] border-[#795037]/30">
        <div className="max-w-4xl mx-auto relative z-10 space-y-4 text-center sm:text-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#C4A177]">
                {workspace.name}
              </span>
              <span className="text-white/40">·</span>
              <span className="text-xs text-white/80 font-mono">Ref #{quote.quoteNumber}</span>
            </div>
            <div className="text-xs text-white/80 self-center sm:self-auto font-medium">
              Valid until {quote.validUntil}
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white pt-1 leading-tight">
            {isRtl ? `رحلة استثنائية في مصر مُصممة لـ ${quote.travelerName}` : `Private Egypt Journey Curated for ${quote.travelerName}`}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-xs text-white pt-2">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/15">
              <Calendar className="w-4 h-4 text-[#C4A177] shrink-0" />
              <span>{quote.startDate} ({quote.durationDays} Days / {Math.max(1, quote.durationDays - 1)} Nights)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/15">
              <Users className="w-4 h-4 text-[#C4A177] shrink-0" />
              <span>{quote.group?.adults || 2} Adults {quote.group?.children?.length ? `, ${quote.group.children.length} Children` : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/15">
              <MapPin className="w-4 h-4 text-[#C4A177] shrink-0" />
              <span>Cairo, Giza, Luxor, Aswan &amp; Nile Valley</span>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 4. MAIN PROPOSAL BODY */}
      {/* ---------------------------------------------------- */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 print:px-0 print:py-4">
        {/* Acceptance Confirmation Banner if already accepted */}
        {(quote.status === 'Accepted' || acceptedSuccess) && (
          <div className="bg-[#e8f5e9] border border-emerald-200 rounded-xl p-5 flex items-center gap-4 text-[#008009] shadow-xs print:hidden">
            <div className="w-10 h-10 rounded-full bg-[#008009] text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-slate-900">Proposal Confirmed &amp; Accepted!</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Thank you! Your itinerary selection is registered with our reservations desk. Your personal tour specialist is preparing your hotel and cruise confirmations.
              </div>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#008009] text-white px-3.5 py-2 rounded-lg font-bold text-xs hover:bg-[#006607] transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Desk</span>
            </a>
          </div>
        )}

        {/* Intro Card */}
        <section className="bg-white rounded-xl p-6 sm:p-7 border border-[#e7e7e7] shadow-2xs space-y-4 print:shadow-none print:border-slate-300">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#44200F]">
              {isRtl ? 'مرحباً بكم في أرض الحضارات' : 'Welcome to the Land of the Pharaohs'}
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-[#008009] bg-[#e8f5e9] px-2.5 py-1 rounded-full font-bold border border-emerald-200 print:hidden">
              <Award className="w-3.5 h-3.5" />
              <span>Certified Egypt Specialist DMC</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isRtl
              ? `يسعدنا في ${workspace.name} تقديم هذا البرنامج المصمم خصيصاً لكم. يشمل البرنامج إقامة فاخرة، ومرشدين سياحيين مصريين مرخصين، وتنقلات خاصة بسيارات حديثة مكيفة لضمان أقصى درجات الراحة والخصوصية.`
              : `${workspace.name} is delighted to present your bespoke Egyptian itinerary. Designed exclusively for your party, this proposal combines curated accommodations, private expert Egyptologist guides, and VIP transportation across Egypt.`}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 print:hidden">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#008009] hover:bg-[#006607] text-white px-4 py-3 rounded-lg font-bold text-xs transition shadow-2xs w-full sm:w-auto min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isRtl ? 'تواصل مع خبير الرحلات عبر واتساب' : 'Chat with Tour Specialist on WhatsApp'}</span>
            </a>

            <button
              onClick={() => setAcceptModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#006ce4] hover:bg-[#0057b8] active:bg-[#003b95] text-white px-4 py-3 rounded-lg font-bold text-xs transition shadow-2xs w-full sm:w-auto min-h-[44px] cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isRtl ? 'تأكيد وحجز البرنامج' : 'Confirm & Request Booking'}</span>
            </button>

            <button
              onClick={() => setInterestedSent(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#f8f9fa] hover:bg-[#f0f6ff] text-slate-800 px-4 py-3 rounded-lg font-medium text-xs transition border border-[#e7e7e7] w-full sm:w-auto min-h-[44px] cursor-pointer"
            >
              <Heart className={`w-3.5 h-3.5 ${interestedSent ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{interestedSent ? 'Interest Registered!' : "Save to Favorites"}</span>
            </button>
          </div>
        </section>

        {/* Live Egyptian Destination Weather Concierge */}
        {Object.keys(weatherData).length > 0 && (
          <section className="bg-white rounded-xl p-5 border border-[#e7e7e7] shadow-2xs space-y-3.5 print:break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e7e7] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC]">
                  <Sun className="w-4 h-4 text-[#795037]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#44200F] tracking-tight flex items-center gap-2">
                    <span>{isRtl ? 'حالة الطقس المباشرة في وجهات الرحلة' : 'Live Destination Climate & Weather Concierge'}</span>
                    <span className="text-[10px] font-bold text-[#008009] bg-[#e8f5e9] px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Open-Meteo
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isRtl
                      ? 'متابعة مباشرة لدرجات الحرارة وأجواء المعالم الأثرية لضمان تجربة سفر استثنائية'
                      : 'Real-time climate conditions and curated Egyptologist advice for your itinerary destinations'}
                  </p>
                </div>
              </div>
            </div>

            {/* Weather City Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
              {Object.values(weatherData).map((w) => (
                <div
                  key={w.city}
                  className="bg-white rounded-xl p-3.5 border border-[#e7e7e7] shadow-2xs hover:border-[#006ce4]/60 transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#006ce4]" />
                      <span>{isRtl ? w.arabicName : w.city}</span>
                    </span>
                    <span className="text-lg">{w.icon}</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-black text-slate-900 tabular-nums">
                      {w.temperatureC}°C
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {isRtl ? w.conditionAr : w.condition}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-[#e7e7e7] pt-1.5 mb-2">
                    <span>High: {w.maxTempC}°C • Low: {w.minTempC}°C</span>
                    <span>Wind: {w.windSpeedKmh} km/h</span>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-[#f8f9fa] p-2 rounded-lg border border-[#e7e7e7] leading-snug">
                    💡 {isRtl ? w.travelRecommendationAr : w.travelRecommendation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Day-by-Day Visual Itinerary Timeline */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e7e7] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006ce4]"></span>
                <h2 className="text-lg font-bold text-[#003580] tracking-tight">
                  {isRtl ? 'الجدول الزمني للرحلة (يومًا بيوم)' : 'Your Day-by-Day Itinerary Timeline'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl
                  ? 'برنامج متكامل ومصمم بعناية فائقة مع كبار خبراء الآثار المصرية وسيارات حديثة مكيفة'
                  : 'Bespoke daily milestones featuring licensed Egyptologists, private A/C transfers & handpicked highlights'}
              </p>
            </div>

            {/* Search Bar & Destination Filter Row */}
            <div className="space-y-3 pt-2 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={itinerarySearch}
                    onChange={(e) => setItinerarySearch(e.target.value)}
                    placeholder={isRtl ? 'ابحث في البرنامج (مثل: الأهرامات، نايل كروز، الأقصر)...' : 'Search itinerary (e.g. Pyramids, Nile Cruise, Luxor, Museum)...'}
                    className="w-full text-xs bg-[#f8f9fa] hover:bg-white focus:bg-white text-slate-900 placeholder-slate-400 rounded-lg pl-8 pr-8 py-2 border border-[#e7e7e7] focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition outline-hidden shadow-2xs"
                  />
                  {itinerarySearch && (
                    <button
                      onClick={() => setItinerarySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      title="Clear Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Day Stepper Jump Arrows */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
                  <span className="text-[11px] text-slate-500 font-medium hidden md:inline">Jump to Day:</span>
                  <div className="flex items-center gap-1 bg-[#f8f9fa] p-1 rounded-lg border border-[#e7e7e7]">
                    {quote.days?.map((d) => (
                      <button
                        key={d.dayNumber}
                        onClick={() => {
                          const el = document.getElementById(`proposal-day-${d.dayNumber}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-slate-700 hover:text-[#FAF7F2] hover:bg-[#44200F] transition cursor-pointer"
                        title={`Jump to Day ${d.dayNumber}`}
                      >
                        {d.dayNumber}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Destination filter chips */}
              {quote.days && quote.days.length > 0 && (
                <div className="luxury-tab-bar flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setTimelineFilter('all')}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0 ${
                      timelineFilter === 'all'
                        ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs'
                        : 'bg-white text-slate-700 border border-[#EDE0CC] hover:text-[#44200F] hover:border-[#795037]/40'
                    }`}
                  >
                    All Days ({quote.days.length})
                  </button>
                  {Array.from(new Set(quote.days.map(d => d.city).filter(Boolean))).map(city => (
                    <button
                      key={city}
                      onClick={() => setTimelineFilter(city)}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                        timelineFilter === city
                          ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs'
                          : 'bg-white text-slate-700 border border-[#EDE0CC] hover:text-[#44200F] hover:border-[#795037]/40'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-[#795037] shrink-0" />
                      <span>{city}</span>
                    </button>
                  ))}
                  {itinerarySearch && (
                    <span className="h-8 inline-flex items-center text-[11px] font-semibold text-[#44200F] bg-[#FAF7F2] px-2.5 rounded-lg border border-[#EDE0CC] ms-auto whitespace-nowrap shrink-0">
                      Filter: "{itinerarySearch}"
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visual Timeline Spine */}
          <div className="relative border-s-2 border-[#006ce4]/30 ms-4 sm:ms-6 ps-6 sm:ps-8 space-y-8">
            {quote.days
              ?.filter(day => {
                const matchesCity = timelineFilter === 'all' || day.city === timelineFilter;
                if (!matchesCity) return false;
                if (!itinerarySearch.trim()) return true;
                const q = itinerarySearch.toLowerCase().trim();
                const text = `${day.title} ${day.description} ${day.city} ${day.lines?.map((l: any) => l.serviceName).join(' ')}`.toLowerCase();
                return text.includes(q);
              })
              .map(day => {
                const highlights = analyzeDayHighlights(day);
                return (
                  <div 
                    key={day.dayNumber}
                    id={`proposal-day-${day.dayNumber}`}
                    className="relative group transition-all print:break-inside-avoid"
                  >
                    {/* Timeline Node Medallion */}
                    <div className="absolute -start-[37px] sm:-start-[45px] top-3.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#44200F] text-[#FAF7F2] font-extrabold text-xs flex items-center justify-center shadow-md border-2 border-white ring-2 ring-[#C4A177]/40 z-10">
                      <span>{day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}</span>
                    </div>

                    {/* Day Card */}
                    <div className="bg-white rounded-xl border border-[#EDE0CC] shadow-xs overflow-hidden transition-all duration-200 hover:border-[#C4A177]/60 hover:shadow-md">
                      
                      {/* Day Header */}
                      <div className="p-4 sm:p-5 bg-[#FAF7F2] border-b border-[#EDE0CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#44200F] bg-white px-2.5 py-0.5 rounded-sm border border-[#EDE0CC]">
                              Day {day.dayNumber}
                            </span>
                            {day.city && (
                              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#795037]" />
                                <span>{day.city}</span>
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-base text-slate-900 tracking-tight">
                            {day.title}
                          </h3>
                        </div>

                        {/* Meal & Guide Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                          {highlights.hasEgyptologist && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#008009] bg-[#e8f5e9] px-2 py-1 rounded-md border border-emerald-200">
                              <Award className="w-3 h-3 text-[#008009]" />
                              <span>Private Egyptologist</span>
                            </span>
                          )}
                          {highlights.meals.length > 0 && (
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-[#EDE0CC] text-[11px] font-semibold text-slate-700">
                              <Utensils className="w-3 h-3 text-[#795037]" />
                              <span>Meals: {highlights.meals.map(m => m.code).join(' · ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Day Content */}
                      <div className="p-5 sm:p-6 space-y-4">
                        
                        {/* Landmark & Transport Badges Strip */}
                        {(highlights.landmarks.length > 0 || highlights.transport.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {highlights.transport.map((t, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-800 bg-[#FAF7F2] px-2.5 py-1 rounded-md border border-[#EDE0CC]"
                              >
                                {t.icon === 'flight' ? <Plane className="w-3 h-3 text-[#795037]" /> :
                                 t.icon === 'cruise' ? <Ship className="w-3 h-3 text-[#44200F]" /> :
                                 t.icon === 'felucca' ? <Compass className="w-3 h-3 text-[#C4A177]" /> :
                                 <Car className="w-3 h-3 text-slate-600" />}
                                <span>{t.label}</span>
                              </span>
                            ))}

                            {highlights.landmarks.map((landmark, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#44200F] bg-[#FAF7F2] px-2.5 py-1 rounded-md border border-[#EDE0CC]"
                              >
                                <Landmark className="w-3 h-3 text-[#795037]" />
                                <span>{landmark}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                          {day.description}
                        </p>

                        {/* Included Services Breakdown */}
                        {day.lines && day.lines.length > 0 && (
                          <div className="pt-3 border-t border-[#EDE0CC] space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#008009]" />
                              <span>{isRtl ? 'الخدمات المضمنة في هذا اليوم:' : 'Included Daily Features & Logistics:'}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {day.lines.map(line => (
                                <div 
                                  key={line.id} 
                                  className="flex items-center gap-2 text-xs text-slate-800 bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE0CC]"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#795037] shrink-0" />
                                  <span className="truncate font-medium">{line.serviceName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Overnight Accommodation Callout */}
                        {highlights.overnightStay && (
                          <div className="pt-2 flex items-center gap-2 text-xs text-[#44200F] bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE0CC]">
                            <Bed className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                            <span className="font-semibold text-[#44200F]">{highlights.overnightStay}</span>
                          </div>
                        )}

                      </div>

                      {/* Day Card Footer with Next & Previous Day Navigation Arrows */}
                      <div className="p-3 bg-[#FAF7F2] border-t border-[#EDE0CC] flex items-center justify-between text-xs print:hidden">
                        {day.dayNumber > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const prevEl = document.getElementById(`proposal-day-${day.dayNumber - 1}`);
                              prevEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="text-[#44200F] hover:text-[#795037] font-bold flex items-center gap-1 transition cursor-pointer p-1"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 text-[#795037]" />
                            <span>Day {day.dayNumber - 1}</span>
                          </button>
                        ) : <div />}

                        <span className="text-[10px] text-slate-400 font-medium">
                          Day {day.dayNumber} of {quote.days.length}
                        </span>

                        {day.dayNumber < quote.days.length ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextEl = document.getElementById(`proposal-day-${day.dayNumber + 1}`);
                              nextEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="text-[#44200F] hover:text-[#795037] font-bold flex items-center gap-1 transition cursor-pointer p-1"
                          >
                            <span>Day {day.dayNumber + 1}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#795037]" />
                          </button>
                        ) : <div />}
                      </div>

                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* CURATED VIP UPSELLS & JOURNEY ENHANCEMENTS */}
        {/* ---------------------------------------------------- */}
        <ProposalUpsellsSection
          upsells={availableUpsells}
          selectedUpsellIds={selectedUpsellIds}
          onToggleUpsell={handleToggleUpsell}
          currency={displayCurrency}
          adultsCount={adultsCount}
          basePrice={baseDisplayPrice}
          isRtl={isRtl}
          onOpenAcceptModal={() => setAcceptModalOpen(true)}
        />

        {/* Pricing & Terms Section */}
        <section className="bg-white rounded-xl p-6 sm:p-7 border border-[#e7e7e7] shadow-2xs space-y-5 print:shadow-none print:border-slate-300 print:break-inside-avoid">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#44200F]">
              {isRtl ? 'ملخص الاستثمار والأسعار' : 'Trip Investment Summary'}
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              Display Currency: <strong>{displayCurrency}</strong>
            </div>
          </div>

          <div className="bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {isRtl ? 'السعر الإجمالي للرحلة بالكامل' : 'Total Private Package Investment'}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#44200F] tabular-nums mt-1.5 flex items-baseline gap-1">
                <span>{getCurrencySymbol(displayCurrency)}</span>
                <AnimatedCounter value={currentDisplayPrice} />
                <span className="text-sm font-semibold text-slate-600 ml-1">{displayCurrency}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                <span>
                  {isRtl
                    ? `بمعدل تقريبي ${displayCurrency} `
                    : `Approx. ${displayCurrency} `}
                </span>
                <AnimatedCounter value={perPersonPrice} />
                <span>{isRtl ? ' للفرد البالغ' : ` per paying adult (${adultsCount} travelers)`}</span>
              </div>
              {selectedUpsellsList.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-600 font-medium">
                  <span className="bg-white/90 px-2 py-0.5 rounded border border-[#e7e7e7] shadow-2xs">
                    Base Package: <strong>{getCurrencySymbol(displayCurrency)}<AnimatedCounter value={baseDisplayPrice} /></strong>
                  </span>
                  <span>+</span>
                  <span className="bg-[#e8f5e9] text-[#008009] px-2 py-0.5 rounded border border-emerald-200 font-bold shadow-2xs">
                    {selectedUpsellsList.length} Upgrade{selectedUpsellsList.length !== 1 ? 's' : ''}: <strong>+{getCurrencySymbol(displayCurrency)}<AnimatedCounter value={upsellsDisplayPrice} /></strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 print:hidden">
              <button
                onClick={() => setAcceptModalOpen(true)}
                className="bg-[#795037] hover:bg-[#5c3823] active:bg-[#44200F] text-white px-5 py-3 rounded-lg font-bold text-xs transition text-center shadow-xs cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{quote.status === 'Accepted' || acceptedSuccess ? 'Booking Confirmed' : 'Accept Proposal'}</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#008009] hover:bg-[#006607] text-white px-4 py-3 rounded-lg font-bold text-xs transition text-center shadow-xs min-h-[44px] flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>

          {/* Included vs Excluded Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#e7e7e7] text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-[#008009]" />
                <span>Package Inclusions</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 text-xs">
                <li>• All luxury accommodations as specified with daily breakfast</li>
                <li>• Nile Cruise stateroom on full board basis including shore excursions</li>
                <li>• Licensed English/multilingual Egyptologist guide during all visits</li>
                <li>• Private air-conditioned VIP transportation &amp; airport transfers</li>
                <li>• Official entrance fees to listed monuments &amp; temples</li>
                <li>• Meet, assist, and airport luggage porterage</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#e7e7e7] text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Shield className="w-4 h-4 text-slate-600" />
                <span>Exclusions &amp; Notes</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 text-xs">
                <li>• International airfare to/from Egypt</li>
                <li>• Egypt entry visa (approx. $25 upon arrival or e-visa)</li>
                <li>• Personal expenses, laundry, and beverage charges outside meals</li>
                <li>• Optional gratuities for guides, drivers, and cruise staff</li>
                <li>• Travel insurance (highly recommended)</li>
              </ul>
            </div>
          </div>

          {/* Direct Payment Instructions */}
          <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#e7e7e7] text-xs text-slate-700 space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              <span>{isRtl ? 'تعليمات الدفع المباشر للشركة المنظمة' : 'Direct DMC Payment Guidelines'}</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              {workspace.paymentInstructionsText || 'Direct Bank Wire Transfer (USD/EUR) to official Egyptian bank account or authorized arrival settlement.'}
            </p>
          </div>

          {/* Luxury Downloads & Client / Operator Documents Bar */}
          <div className="p-5 rounded-xl bg-white border border-[#EDE0CC] shadow-2xs print:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#44200F] flex items-center justify-center font-bold border border-[#EDE0CC]">
                  <Download className="w-4 h-4 text-[#795037]" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Official Export Documents &amp; Financial Sheets</h4>
                  <p className="text-[11px] text-slate-500">Download high-resolution branded documents for client presentation and operational tracking</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => exportQuoteToLuxuryPDF(quote, workspace)}
                className="card-lift btn-tactile flex items-center justify-between p-3 bg-[#FAF7F2] hover:bg-[#EDE0CC]/40 border border-[#EDE0CC] rounded-md transition shadow-2xs group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#C4A177]/20 rounded-md text-[#44200F] group-hover:bg-[#C4A177]/30 transition-transform duration-150 group-hover:scale-105">
                    <FileText className="w-4 h-4 text-[#795037]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#44200F]">Luxury Client Proposal (PDF)</div>
                    <div className="text-[10px] text-[#795037]">Standardized A4 with daily timeline &amp; stamp</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#C4A177] opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition" />
              </button>

              <button
                onClick={() => exportQuoteToExcel(quote, workspace)}
                className="card-lift btn-tactile flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition shadow-2xs group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 rounded-md text-[#008009] group-hover:bg-emerald-200 transition-transform duration-150 group-hover:scale-105">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1a1a1a]">Operator Master Cost Sheet (Excel)</div>
                    <div className="text-[10px] text-[#595959]">Formulas, markup %, EGP/USD &amp; margins</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#008009] opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition" />
              </button>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* 5. PRINT EXCLUSIVE FORMAL SIGN-OFF & STAMP SECTION */}
        {/* ---------------------------------------------------- */}
        <div className="hidden print:block pt-8 space-y-6 break-inside-avoid">
          <div className="border-t-2 border-slate-300 pt-6 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-8">
              <div>
                <div className="font-bold uppercase tracking-wider text-slate-900">For the Client / Traveler:</div>
                <div className="text-slate-600 mt-1">Confirmed & Accepted by {quote.travelerName}</div>
              </div>
              <div className="space-y-4">
                <div className="border-b border-slate-400 pb-1 text-slate-400">Signature:</div>
                <div className="border-b border-slate-400 pb-1 text-slate-400">Date:</div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="font-bold uppercase tracking-wider text-slate-900">For {workspace.name}:</div>
                <div className="text-slate-600 mt-1">Authorized DMC Representative & Official Stamp</div>
              </div>
              <div className="space-y-4">
                <div className="border-b border-slate-400 pb-1 text-slate-400">Signature:</div>
                <div className="border-b border-slate-400 pb-1 text-slate-400">Date:</div>
              </div>
            </div>
          </div>
          <div className="text-center text-[10px] text-slate-400 pt-4">
            Generated via RIHAL · Luxury Travel &amp; DMC Operations System • Proposal Ref: {quote.quoteNumber}
          </div>
        </div>
      </main>

      {/* ---------------------------------------------------- */}
      {/* 6. CLIENT MOBILE STICKY BOOKING BAR */}
      {/* ---------------------------------------------------- */}
      {isClientView && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#EDE0CC] p-3 sm:hidden z-40 flex items-center justify-between gap-3 shadow-lg print:hidden">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Package</div>
            <div className="text-base font-extrabold text-[#44200F] tabular-nums flex items-baseline gap-0.5">
              <span>{getCurrencySymbol(displayCurrency)}</span>
              <AnimatedCounter value={currentDisplayPrice} />
              <span className="text-xs font-normal text-slate-500 ml-1">{displayCurrency}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#008009] text-white p-2.5 rounded-lg flex items-center justify-center min-w-[42px] min-h-[42px]"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <button
              onClick={() => setAcceptModalOpen(true)}
              className="bg-[#795037] hover:bg-[#5c3823] text-white px-4 py-2.5 rounded-lg font-bold text-xs shadow-xs min-h-[42px]"
            >
              {quote.status === 'Accepted' || acceptedSuccess ? 'Accepted' : 'Accept & Book'}
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. FOOTER */}
      {/* ---------------------------------------------------- */}
      <footer className="bg-[#44200F] text-[#FAF7F2] py-10 px-4 text-center text-xs text-white/70 border-t border-[#795037]/30 print:hidden">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="font-bold text-[#FAF7F2] text-sm">{workspace.name}</div>
          <div className="text-[#EDE0CC]">Contact: {workspace.contactEmail} • WhatsApp: {workspace.whatsappNumber}</div>
          <div className="text-[11px] text-[#EDE0CC]/70 pt-2">
            RIHAL · Luxury Travel &amp; DMC Proposal Platform • All rights reserved
          </div>
        </div>
      </footer>

      {/* ---------------------------------------------------- */}
      {/* 8. SHARE CLIENT LINK MODAL (OPERATOR ONLY) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {shareModalOpen && (
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={executiveTransition}
            onClick={() => setShareModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs print:hidden"
          >
            <motion.div
              variants={modalDialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={executiveTransition}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e7e7e7] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#44200F] flex items-center justify-center border border-[#EDE0CC]">
                    <Share2 className="w-4 h-4 text-[#795037]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#44200F] text-sm">Share Proposal with Client</h3>
                    <p className="text-[11px] text-slate-500">Proposal #{quote.quoteNumber} for {quote.travelerName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-md"
                >
                  ✕
                </button>
              </div>

              {/* Direct Link Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Client Presentation Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareableUrl()}
                    className="flex-1 bg-[#FAF7F2] border border-[#EDE0CC] rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all outline-hidden focus:border-[#795037]"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-[#795037] hover:bg-[#5c3823] text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                  >
                    {linkCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Clients opening this link view the interactive itinerary directly without logging into RIHAL.
                </p>
              </div>

              {/* Day-of-Travel Live Concierge & Tipping Guide Link Box */}
              <div className="space-y-1.5 pt-2 border-t border-[#EDE0CC]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#44200F] flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>Traveler Live Concierge &amp; Tipping Guide Link</span>
                  </label>
                  <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">Mobile Day-of-Travel</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getConciergeUrl()}
                    className="flex-1 bg-[#FAF7F2] border border-[#EDE0CC] rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all outline-hidden focus:border-[#795037]"
                  />
                  <button
                    onClick={handleCopyConciergeLink}
                    className="bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                  >
                    {conciergeLinkCopied ? <Check className="w-3.5 h-3.5 text-[#C4A177]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{conciergeLinkCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Send this link to guests upon arrival for instant access to their driver, guide, hotel taxi card, and tipping calculator.
                </p>
              </div>

              {/* Interactive B2B2C Guest & Live Status Portal Link */}
              <div className="space-y-1.5 pt-2 border-t border-[#EDE0CC]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#44200F] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>Interactive B2B2C Guest Portal Link</span>
                  </label>
                  <span className="text-[10px] bg-[#EDE0CC] text-[#44200F] px-1.5 py-0.2 rounded font-bold border border-[#C4A177]/40">Demo Portal Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?portal=${encodeURIComponent(quote.publicToken || quote.quoteNumber || quote.id)}`}
                    className="flex-1 bg-[#FAF7F2] border border-[#EDE0CC] rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all outline-hidden focus:border-[#795037]"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?portal=${encodeURIComponent(quote.publicToken || quote.quoteNumber || quote.id)}`);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="bg-[#44200F] hover:bg-[#321609] text-[#C4A177] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Demo preview link showing itinerary status, day-by-day logistics, printable vouchers, and simulated bank-wire instructions (no live payment gateway).
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={operatorWhatsAppShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#008009] hover:bg-[#006607] text-white p-3 rounded-xl text-xs font-bold transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </a>

                <a
                  href={getShareableUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#FAF7F2] hover:bg-[#EDE0CC]/40 text-[#44200F] p-3 rounded-xl text-xs font-bold border border-[#EDE0CC] transition"
                >
                  <ExternalLink className="w-4 h-4 text-[#795037]" />
                  <span>Preview Client View</span>
                </a>
              </div>

              {/* QR Code Presentation Box */}
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EDE0CC] flex items-center gap-4">
                <div className="w-16 h-16 bg-white p-1 rounded-lg border border-[#EDE0CC] flex items-center justify-center shrink-0 shadow-2xs">
                  <QrCode className="w-12 h-12 text-[#44200F]" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">QR Code for In-Person or Trade Show Pitch</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Have the traveler or B2B buyer scan this QR code directly from their mobile camera during meetings or fairs.
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 px-4 py-2"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* 9. ACCEPT PROPOSAL MODAL (FOR CLIENT & TRAVELER) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {acceptModalOpen && (
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={executiveTransition}
            onClick={() => setAcceptModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs print:hidden"
          >
            <motion.div
              variants={modalDialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={executiveTransition}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#e7e7e7] space-y-5"
            >
              {!acceptedSuccess ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#e7e7e7] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#e8f5e9] text-[#008009] flex items-center justify-center border border-emerald-200">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#003580] text-sm">Accept &amp; Request Booking</h3>
                        <p className="text-[11px] text-slate-500">Proposal #{quote.quoteNumber} • {quote.durationDays} Days</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAcceptModalOpen(false)}
                      className="text-slate-400 hover:text-slate-700 text-sm p-1 rounded-md"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAcceptProposal} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Full Name / Lead Traveler *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. David Jenkins"
                        className="w-full bg-white border border-[#e7e7e7] rounded-lg px-3 py-2 text-xs focus:border-[#006ce4] focus:ring-1 focus:ring-[#006ce4] outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Phone / WhatsApp *</label>
                        <input
                          type="text"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="+44 7700 900342"
                          className="w-full bg-white border border-[#e7e7e7] rounded-lg px-3 py-2 text-xs focus:border-[#006ce4] focus:ring-1 focus:ring-[#006ce4] outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Email Address</label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="david@travelagency.com"
                          className="w-full bg-white border border-[#e7e7e7] rounded-lg px-3 py-2 text-xs focus:border-[#006ce4] focus:ring-1 focus:ring-[#006ce4] outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Special Notes, Room Preferences or Dietary</label>
                      <textarea
                        rows={2}
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        placeholder="e.g. Prefer king-size bed overlooking Nile; vegetarian meal request on cruise."
                        className="w-full bg-white border border-[#e7e7e7] rounded-lg px-3 py-2 text-xs focus:border-[#006ce4] focus:ring-1 focus:ring-[#006ce4] outline-hidden resize-none"
                      />
                    </div>

                    {/* Selected Enhancements Breakdown in Modal */}
                    {selectedUpsellsList.length > 0 && (
                      <div className="p-3 bg-[#f0f6ff] border border-[#006ce4]/30 rounded-xl space-y-2 text-xs">
                        <div className="font-bold text-[#003580] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#006ce4]" />
                            <span>Selected VIP Enhancements ({selectedUpsellsList.length}):</span>
                          </span>
                          <span className="text-[#008009] font-black">+{getCurrencySymbol(displayCurrency)}{upsellsDisplayPrice.toLocaleString()} {displayCurrency}</span>
                        </div>
                        <div className="space-y-1 divide-y divide-[#006ce4]/10">
                          {selectedUpsellsList.map(u => {
                            const itemCost = u.priceBasis === 'per_person' ? u.price * adultsCount : u.price;
                            const converted = convertAmount(itemCost, displayCurrency);
                            return (
                              <div key={u.id} className="pt-1 flex items-center justify-between text-[11px] text-slate-700">
                                <span className="truncate pr-2 font-medium">• {u.title} ({u.city})</span>
                                <span className="shrink-0 font-bold tabular-nums">+{getCurrencySymbol(displayCurrency)}{converted.toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="pt-1.5 border-t border-[#006ce4]/20 flex items-center justify-between text-xs font-black text-[#003580]">
                          <span>Total Investment to Confirm:</span>
                          <span className="text-sm">{getCurrencySymbol(displayCurrency)}{currentDisplayPrice.toLocaleString()} {displayCurrency}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-[#44200F] space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-[#795037]" />
                        <span>Demo Booking Request Only</span>
                      </div>
                      <p>
                        Demo Mode: Confirming here logs a simulated acceptance inside your local preview session for {workspace.name}. No live booking, payment charge, or backend order is submitted.
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setAcceptModalOpen(false)}
                        className="px-4 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingAccept}
                        className="bg-[#006ce4] hover:bg-[#0057b8] active:bg-[#003b95] text-white px-5 py-2.5 rounded-lg font-bold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingAccept ? 'Logging Demo Request...' : 'Log Demo Request'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* Acceptance Success View */
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 bg-[#e8f5e9] text-[#008009] rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#44200F] text-base">Demo Booking Request Logged</h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                      Demo Mode only — recorded locally for <strong>{clientName || quote.travelerName}</strong> on #{quote.quoteNumber}. No real reservation or payment was processed.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#f8f9fa] border border-[#e7e7e7] rounded-xl text-xs text-start space-y-1.5 font-mono text-slate-700">
                    <div>Reference: <strong className="text-[#003580]">{quote.quoteNumber}</strong></div>
                    <div>Traveler: <strong>{clientName || quote.travelerName}</strong></div>
                    <div>Total Package: <strong>{getCurrencySymbol(displayCurrency)}{currentDisplayPrice.toLocaleString()} {displayCurrency}</strong></div>
                    {selectedUpsellsList.length > 0 && (
                      <div className="pt-2 text-[11px] font-sans text-slate-600 border-t border-slate-200 mt-1">
                        <span className="font-bold text-[#008009] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#008009]" />
                          Includes {selectedUpsellsList.length} VIP Enhancement{selectedUpsellsList.length !== 1 ? 's' : ''}:
                        </span>
                        <ul className="mt-1 space-y-1 text-[11px]">
                          {selectedUpsellsList.map(u => (
                            <li key={u.id} className="flex items-center justify-between">
                              <span>• {u.title} ({u.city})</span>
                              <span className="font-bold text-[#003580]">{u.badge || 'VIP'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#008009] hover:bg-[#006607] text-white px-5 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Notify via WhatsApp</span>
                    </a>
                    <button
                      onClick={() => setAcceptModalOpen(false)}
                      className="bg-[#003580] text-white px-5 py-2.5 rounded-lg font-bold text-xs hover:bg-[#00224f] transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <OperationsDispatchModal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        quote={quote}
        workspace={workspace}
        uiLang={selectedLang === 'ar' ? 'ar' : 'en'}
      />
    </div>
  );
};
