import { scopedOperatorStorage } from '../../lib/sessionScope';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Quote, Workspace, Currency, UILanguage 
} from '../../types';
import { TripFile } from '../../lib/tripStore';
import { 
  ConciergeDayDetails, 
  getConciergeDayDetails, 
  resolveActiveDayNumber,
  formatEmergencyWhatsAppMessage 
} from '../../lib/conciergeService';
import { 
  EGYPTIAN_TIPPING_RULES, 
  TippingRoleCategory, 
  calculateTippingRecommendation,
  getDailyWalletPreparationGuide 
} from '../../lib/tippingGuide';
import { 
  Calendar, Clock, MapPin, Phone, MessageSquare, Car, 
  GraduationCap, Ship, PlaneTakeoff, Luggage, DoorOpen, 
  Utensils, Shield, Sun, CloudSun, AlertTriangle, 
  CheckCircle2, Copy, Check, ExternalLink, ArrowLeft, 
  Sparkles, DollarSign, Wallet, FileText, ChevronRight, ChevronLeft, Search,
  HeartHandshake, Info, Compass, HelpCircle, Maximize2, X,
  Wifi, WifiOff, Smartphone, Download, Share
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalBackdropVariants, modalDialogVariants, executiveTransition } from '../../lib/motion';

interface TravelerMobileConciergeProps {
  quote: Quote;
  workspace: Workspace;
  tripFile?: TripFile | null;
  onBackToProposal?: () => void;
  onBackToApp?: () => void;
  isOperatorPreview?: boolean;
}

export const TravelerMobileConcierge: React.FC<TravelerMobileConciergeProps> = ({
  quote,
  workspace,
  tripFile = null,
  onBackToProposal,
  onBackToApp,
  isOperatorPreview = false,
}) => {
  // Navigation & Active Day State
  const initialDay = useMemo(() => resolveActiveDayNumber(quote), [quote]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(initialDay);
  const [activeTab, setActiveTab] = useState<'today' | 'contacts' | 'passes' | 'tipping' | 'driver' | 'currency' | 'taxi' | 'sos'>('today');
  const totalDays = quote.durationDays || quote.days?.length || 1;
  const [conciergeSearchQuery, setConciergeSearchQuery] = useState<string>('');

  // Live search across all itinerary days and activities
  const itinerarySearchMatches = useMemo(() => {
    if (!conciergeSearchQuery.trim()) return [];
    const q = conciergeSearchQuery.toLowerCase().trim();
    const results: { dayNumber: number; title: string; city: string; matchedText: string }[] = [];

    (quote.days || []).forEach(d => {
      const dayText = `${d.title} ${d.description} ${d.city} ${d.lines?.map(l => `${l.serviceName} ${l.supplierName || ''}`).join(' ')}`.toLowerCase();
      if (dayText.includes(q)) {
        let matchedText = d.title;
        const matchingLine = d.lines?.find(l => `${l.serviceName} ${l.supplierName || ''}`.toLowerCase().includes(q));
        if (matchingLine) {
          matchedText = matchingLine.serviceName;
        } else if (d.city?.toLowerCase().includes(q)) {
          matchedText = `City: ${d.city}`;
        }
        results.push({
          dayNumber: d.dayNumber,
          title: d.title,
          city: d.city || '',
          matchedText,
        });
      }
    });

    return results;
  }, [conciergeSearchQuery, quote.days]);

  // Tipping Calculator State
  const [tipCurrency, setTipCurrency] = useState<Currency>(quote.targetCurrency || 'USD');
  const [tipGroupSize, setTipGroupSize] = useState<number>(quote.group?.adults || 2);
  const [tipServiceLevel, setTipServiceLevel] = useState<'standard' | 'exceptional' | 'above_and_beyond'>('exceptional');
  const [selectedTipRoleId, setSelectedTipRoleId] = useState<TippingRoleCategory>('guide');

  // Fullscreen Driver Mode Modal
  const [fullscreenTaxiCardOpen, setFullscreenTaxiCardOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Currency Converter State
  const [convertAmount, setConvertAmount] = useState<number>(50);
  const [convertFrom, setConvertFrom] = useState<'USD' | 'EUR' | 'GBP' | 'EGP'>('USD');

  // Resolve today's operational information
  const dayDetails: ConciergeDayDetails = useMemo(() => {
    return getConciergeDayDetails(quote, tripFile, selectedDayNumber, workspace);
  }, [quote, tripFile, selectedDayNumber, workspace]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Offline Caching & Home Screen PWA Install State
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [isCached, setIsCached] = useState<boolean>(true);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  });
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('daleel_concierge_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [manualCacheSaved, setManualCacheSaved] = useState<boolean>(false);

  const isIos = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  // Listen to connectivity changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Capture PWA beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Automatically save full itinerary and offline pack into localStorage
  useEffect(() => {
    try {
      const cachePayload = {
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        travelerName: quote.travelerName,
        durationDays: quote.durationDays,
        days: quote.days,
        cachedAt: new Date().toISOString(),
      };
      scopedOperatorStorage.setItem(`daleel_offline_concierge_${quote.id}`, JSON.stringify(cachePayload));
      scopedOperatorStorage.setItem('daleel_offline_last_active_quote', quote.id);
      setIsCached(true);
      setCachedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Could not cache concierge offline:', err);
    }
  }, [quote]);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const result = await installPromptEvent.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem('daleel_concierge_banner_dismissed', 'true');
    } catch {}
  };

  const handleForceCacheRefresh = () => {
    try {
      const cachePayload = {
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        travelerName: quote.travelerName,
        durationDays: quote.durationDays,
        days: quote.days,
        cachedAt: new Date().toISOString(),
      };
      scopedOperatorStorage.setItem(`daleel_offline_concierge_${quote.id}`, JSON.stringify(cachePayload));
      setManualCacheSaved(true);
      setCachedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setTimeout(() => setManualCacheSaved(false), 2500);
    } catch {}
  };

  // Tipping calculated result
  const calculatedTip = useMemo(() => {
    return calculateTippingRecommendation({
      roleId: selectedTipRoleId,
      groupSize: tipGroupSize,
      serviceQuality: tipServiceLevel,
      daysCount: 1,
      targetCurrency: tipCurrency,
    });
  }, [selectedTipRoleId, tipGroupSize, tipServiceLevel, tipCurrency]);

  const walletPrep = useMemo(() => {
    const hasGuide = !!dayDetails.guide;
    const hasDriver = !!dayDetails.driver;
    const hasCruise = dayDetails.tonightStay?.type === 'cruise';
    return getDailyWalletPreparationGuide(hasGuide, hasDriver, hasCruise);
  }, [dayDetails]);

  // Currency converter calculations
  const egpPerUsd = 49.5;
  const egpPerEur = 53.8;
  const egpPerGbp = 64.2;

  const convertedResult = useMemo(() => {
    if (convertFrom === 'EGP') {
      return {
        egp: convertAmount,
        usd: Math.round((convertAmount / egpPerUsd) * 10) / 10,
        eur: Math.round((convertAmount / egpPerEur) * 10) / 10,
        gbp: Math.round((convertAmount / egpPerGbp) * 10) / 10,
      };
    } else if (convertFrom === 'USD') {
      const egp = Math.round(convertAmount * egpPerUsd);
      return { egp, usd: convertAmount, eur: Math.round(convertAmount * 0.92), gbp: Math.round(convertAmount * 0.77) };
    } else if (convertFrom === 'EUR') {
      const egp = Math.round(convertAmount * egpPerEur);
      return { egp, usd: Math.round(convertAmount * 1.09), eur: convertAmount, gbp: Math.round(convertAmount * 0.84) };
    } else {
      const egp = Math.round(convertAmount * egpPerGbp);
      return { egp, usd: Math.round(convertAmount * 1.30), eur: Math.round(convertAmount * 1.19), gbp: convertAmount };
    }
  }, [convertAmount, convertFrom]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans pb-24 select-none">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP APP BAR & MODE INDICATOR */}
      {/* ------------------------------------------------------------------ */}
      <header className="bg-[#003580] text-white sticky top-0 z-40 shadow-sm border-b border-[#00224f]">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {onBackToApp && isOperatorPreview ? (
              <button
                onClick={onBackToApp}
                className="text-white/80 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : onBackToProposal ? (
              <button
                onClick={onBackToProposal}
                className="text-white/80 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Proposal</span>
              </button>
            ) : null}

            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#ffb700] border border-white/20">
              <Compass className="w-4 h-4" />
            </div>

            <div>
              <div className="font-extrabold text-xs tracking-tight text-white flex items-center gap-1.5">
                <span>{workspace.name || 'RIHAL'} Mobile Concierge</span>
                <span className="text-[9px] bg-[#008009] text-white font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">Live</span>
              </div>
              <div className="text-[10px] text-white/70 truncate max-w-[210px] flex items-center gap-1.5">
                <span>{quote.travelerName}</span>
                <span className="text-white/40">·</span>
                {isOffline ? (
                  <span className="inline-flex items-center gap-1 text-[9px] text-[#ffb700] font-bold">
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>Offline</span>
                  </span>
                ) : (
                  <button
                    onClick={handleForceCacheRefresh}
                    className="inline-flex items-center gap-1 text-[9px] text-emerald-300 hover:text-emerald-200 transition cursor-pointer"
                    title={`Offline pack active. Cached at ${cachedAt || 'now'}. Click to re-sync.`}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{manualCacheSaved ? 'Saved!' : 'Offline Ready'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToProposal && (
              <button
                onClick={onBackToProposal}
                className="btn-tactile bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer border border-white/20"
              >
                <FileText className="w-3 h-3 text-[#ffb700]" />
                <span>Proposal</span>
              </button>
            )}

            <a
              href={dayDetails.dutyManager.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile bg-[#008009] hover:bg-[#006607] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs transition flex items-center gap-1 cursor-pointer"
              title="WhatsApp 24/7 Concierge Hotline"
            >
              <MessageSquare className="w-3 h-3" />
              <span>SOS</span>
            </a>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DAY NAVIGATOR & BACK/NEXT ARROWS */}
        {/* ------------------------------------------------------------------ */}
        <div className="max-w-2xl mx-auto px-4 pb-2 flex items-center gap-1.5">
          <button
            onClick={() => setSelectedDayNumber(prev => Math.max(1, prev - 1))}
            disabled={selectedDayNumber <= 1}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shrink-0 transition cursor-pointer"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1.5 py-0.5">
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDayNumber === dayNum;
              const isActualToday = initialDay === dayNum;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayNumber(dayNum)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[#ffb700] text-[#00224f] shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  <span>Day {dayNum}</span>
                  {isActualToday && (
                    <span className={`text-[9px] px-1 py-0.1 rounded font-black ${
                      isSelected ? 'bg-[#00224f] text-[#ffb700]' : 'bg-[#008009] text-white'
                    }`}>
                      TODAY
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedDayNumber(prev => Math.min(totalDays, prev + 1))}
            disabled={selectedDayNumber >= totalDays}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center shrink-0 transition cursor-pointer"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* CONCIERGE SEARCH BAR */}
        {/* ------------------------------------------------------------------ */}
        <div className="max-w-2xl mx-auto px-4 pb-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
            <input
              type="text"
              value={conciergeSearchQuery}
              onChange={(e) => setConciergeSearchQuery(e.target.value)}
              placeholder="Search itinerary, guide, driver, taxi cards, monuments, tips..."
              className="w-full text-xs bg-white/10 hover:bg-white/15 focus:bg-white focus:text-[#1a1a1a] focus:placeholder-slate-400 text-white placeholder-white/60 rounded-lg pl-8 pr-8 py-1.5 transition outline-hidden border border-white/15 focus:border-[#ffb700] focus:ring-2 focus:ring-[#ffb700]/30 shadow-2xs"
            />
            {conciergeSearchQuery && (
              <button
                onClick={() => setConciergeSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:text-slate-700 p-0.5 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MAIN CONTAINER & ACTIVE TAB CONTENT */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Live Search Results Card */}
        {conciergeSearchQuery.trim() && (
          <div className="bg-white rounded-xl border border-[#006ce4]/30 p-4 shadow-sm space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#003580] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#006ce4]" />
                <span>Search results for "{conciergeSearchQuery}"</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-[#f0f6ff] px-2 py-0.5 rounded-full border border-[#006ce4]/20">
                {itinerarySearchMatches.length} match{itinerarySearchMatches.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {itinerarySearchMatches.length > 0 ? (
              <div className="space-y-1.5">
                {itinerarySearchMatches.map(res => (
                  <button
                    key={`${res.dayNumber}-${res.matchedText}`}
                    onClick={() => {
                      setSelectedDayNumber(res.dayNumber);
                      setActiveTab('today');
                      setConciergeSearchQuery('');
                    }}
                    className="w-full p-2.5 rounded-lg bg-[#f8fafd] hover:bg-[#f0f6ff] border border-[#e7e7e7] hover:border-[#006ce4]/40 text-left transition flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#003580] text-white px-1.5 py-0.2 rounded">
                          Day {res.dayNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#006ce4]">
                          {res.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Matched: <span className="font-semibold text-[#003580]">{res.matchedText}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#006ce4] shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2 text-center">
                No matching tour activities found for "{conciergeSearchQuery}". Try searching "Pyramids", "Cruise", "Guide", "Driver", or "Airport".
              </div>
            )}
          </div>
        )}

        {/* Offline Connectivity Alert */}
        {isOffline && (
          <div className="bg-[#fff9e6] border border-[#ffb700] rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-[#593d00] shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ffb700]/20 flex items-center justify-center shrink-0 text-[#855700]">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Offline Mode Active</div>
                <div className="text-[11px] text-[#735100] mt-0.5 leading-tight">
                  Cell signal lost in Egyptian desert / subterranean tomb. All daily tours, guide numbers &amp; Arabic taxi cards remain accessible.
                </div>
              </div>
            </div>
            <span className="text-[10px] bg-[#008009] text-white px-2 py-0.5 rounded font-bold uppercase shrink-0">
              Cached
            </span>
          </div>
        )}

        {/* Smart Home Screen / PWA Install Banner */}
        {!isInstalled && !bannerDismissed && (
          <div className="bg-gradient-to-r from-[#003580] to-[#00224f] text-white rounded-xl p-3.5 sm:p-4 shadow-xs border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#ffb700] border border-white/20 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-xs sm:text-sm text-white">Save Concierge for Offline Egypt Travel</h4>
                  <span className="text-[9px] font-bold bg-[#008009] text-white px-1.5 py-0.2 rounded uppercase">
                    Zero Roaming Needed
                  </span>
                </div>
                <p className="text-[11px] text-white/80 mt-0.5 leading-relaxed">
                  Install to your home screen for instant offline access inside the Great Pyramid, subterranean tombs in Luxor, and remote desert stretches.
                </p>
                {isIos && (
                  <div className="text-[10px] text-[#ffb700] font-semibold mt-1 flex items-center gap-1">
                    <span>iPhone / iPad: Tap Share</span>
                    <Share className="w-3 h-3 inline text-white" />
                    <span>then select "Add to Home Screen" ➕</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {installPromptEvent && (
                <button
                  onClick={handleInstallClick}
                  className="btn-tactile bg-[#ffb700] hover:bg-[#e5a500] active:bg-[#cc9300] text-[#00224f] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}
              <button
                onClick={handleDismissBanner}
                className="text-white/60 hover:text-white p-1 rounded transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: TODAY'S SCHEDULE & GROUND TEAM */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'today' && (
          <div className="space-y-4">
            {/* Day Hero Banner */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#006ce4] bg-[#f0f6ff] px-2 py-0.5 rounded-full border border-[#006ce4]/20">
                      {dayDetails.city}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {dayDetails.formattedDate}
                    </span>
                  </div>
                  <h1 className="text-base font-extrabold text-[#003580] mt-1 tracking-tight">
                    {dayDetails.title}
                  </h1>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-medium">Lobby Pickup</div>
                  <div className="text-sm font-black text-[#008009] flex items-center justify-end gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#008009]" />
                    <span>{dayDetails.pickupTime}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                {dayDetails.description}
              </p>

              {/* Weather pill */}
              {dayDetails.weatherAlert && (
                <div className="bg-[#f0f6ff] border border-[#006ce4]/20 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#003580]">
                    <Sun className="w-4 h-4 text-[#ffb700]" />
                    <span className="font-bold">{dayDetails.weatherAlert.tempC}°C • {dayDetails.weatherAlert.condition}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">
                    UV: <strong className="text-amber-600">{dayDetails.weatherAlert.uvIndex}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Ground Contacts: Driver & Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Private Driver Card */}
              {dayDetails.driver && (
                <div className="bg-white rounded-xl border border-[#e7e7e7] p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Car className="w-3 h-3 text-[#006ce4]" />
                      <span>Your Private Chauffeur</span>
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-[#008009] font-bold px-1.5 py-0.2 rounded">
                      On Duty
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-sm text-slate-900">{dayDetails.driver.name}</div>
                    <div className="text-xs text-slate-500">{dayDetails.driver.vehicleModel}</div>
                    <div className="text-xs font-mono font-semibold text-[#003580] bg-slate-50 px-2 py-0.5 rounded mt-1 border border-slate-200 inline-block">
                      Plate: {dayDetails.driver.licensePlate}
                    </div>
                  </div>

                  <div className="pt-1.5 flex items-center gap-2">
                    <a
                      href={dayDetails.driver.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-tactile flex-1 bg-[#008009] hover:bg-[#006607] text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={dayDetails.driver.callUrl}
                      className="btn-tactile px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Tour Guide Card */}
              {dayDetails.guide && (
                <div className="bg-white rounded-xl border border-[#e7e7e7] p-3.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-[#ffb700]" />
                      <span>Your Egyptologist</span>
                    </span>
                    <span className="text-[10px] bg-blue-50 text-[#006ce4] font-bold px-1.5 py-0.2 rounded">
                      Syndicate
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-sm text-slate-900">{dayDetails.guide.name}</div>
                    <div className="text-xs text-slate-500">{dayDetails.guide.title}</div>
                    <div className="text-xs font-medium text-slate-600 mt-1">
                      Language: <span className="font-bold text-[#003580]">{dayDetails.guide.languages}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 flex items-center gap-2">
                    <a
                      href={dayDetails.guide.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-tactile flex-1 bg-[#006ce4] hover:bg-[#0057b8] text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={dayDetails.guide.callUrl}
                      className="btn-tactile px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Monument Passes & Skip-The-Line Status */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#003580] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#ffb700]" />
                  <span>Monument Passes &amp; Fast-Track Tickets</span>
                </h3>
                <span className="text-[10px] text-[#008009] font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  All Pre-Arranged
                </span>
              </div>

              <div className="space-y-2">
                {dayDetails.monumentPasses.map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-[#f8f9fa] text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#008009]" />
                        {p.name}
                      </span>
                      {p.skipTheLine && (
                        <span className="text-[10px] text-[#006ce4] font-bold">Skip-the-line</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5 leading-relaxed">
                      {p.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Site Etiquette & What to Bring */}
            <div className="bg-[#fff9e6] rounded-xl border border-[#ffb700]/30 p-3.5 text-xs text-[#00224f] space-y-2">
              <div className="font-bold text-xs flex items-center gap-1.5 text-[#003580]">
                <Info className="w-4 h-4 text-[#ffb700]" />
                <span>Today's Packing &amp; Etiquette Advice</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside">
                {dayDetails.etiquetteTips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>

            {/* Tonight's Hotel & Taxi Quick Action */}
            {dayDetails.tonightStay && (
              <div className="bg-white rounded-xl border border-[#e7e7e7] p-3.5 shadow-2xs flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Tonight's Accommodation</div>
                  <div className="font-bold text-xs text-slate-900">{dayDetails.tonightStay.name}</div>
                  <div className="text-[11px] text-slate-500">{dayDetails.tonightStay.city}</div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('taxi');
                  }}
                  className="btn-tactile bg-[#006ce4] hover:bg-[#0057b8] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shrink-0 transition"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Show Taxi Card</span>
                </button>
              </div>
            )}

            {/* Day-of-Travel Prev / Next Navigation Footer Cards */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              {selectedDayNumber > 1 ? (
                <button
                  type="button"
                  onClick={() => setSelectedDayNumber(prev => prev - 1)}
                  className="btn-tactile flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 active:bg-slate-100 border border-[#e7e7e7] rounded-xl text-xs font-bold text-[#003580] transition flex items-center gap-2 shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-[#006ce4] shrink-0" />
                  <div className="text-left min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Previous Day</span>
                    <span className="truncate block">Day {selectedDayNumber - 1}</span>
                  </div>
                </button>
              ) : (
                <div className="flex-1" />
              )}

              <div className="text-center text-[11px] font-bold text-slate-500 px-1 shrink-0">
                Day {selectedDayNumber} of {totalDays}
              </div>

              {selectedDayNumber < totalDays ? (
                <button
                  type="button"
                  onClick={() => setSelectedDayNumber(prev => prev + 1)}
                  className="btn-tactile flex-1 py-2.5 px-3 bg-[#003580] hover:bg-[#00224f] active:bg-[#001736] text-white rounded-xl text-xs font-bold transition flex items-center justify-end gap-2 shadow-xs cursor-pointer"
                >
                  <div className="text-right min-w-0">
                    <span className="text-[10px] text-blue-200 font-semibold uppercase block">Next Day</span>
                    <span className="truncate block">Day {selectedDayNumber + 1}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#ffb700] shrink-0" />
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: TIPPING GUIDE & CALCULATOR */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'tipping' && (
          <div className="space-y-4">
            {/* Tipping Calculator Card */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-[#003580] tracking-tight flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-[#ffb700]" />
                  <span>Egyptian Tipping Calculator (Baksheesh)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Clear, customary gratuity guidelines for your private Egypt tour without guessing or awkward moments.
                </p>
              </div>

              {/* Controls: Currency & Group Size */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Currency
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    {(['USD', 'EUR', 'EGP'] as Currency[]).map(c => (
                      <button
                        key={c}
                        onClick={() => setTipCurrency(c)}
                        className={`text-xs font-bold py-1 rounded transition cursor-pointer ${
                          tipCurrency === c ? 'bg-[#003580] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Group Size
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    {[
                      { label: 'Solo', pax: 1 },
                      { label: '2 Pax', pax: 2 },
                      { label: '4+ Pax', pax: 4 },
                    ].map(g => (
                      <button
                        key={g.label}
                        onClick={() => setTipGroupSize(g.pax)}
                        className={`text-xs font-bold py-1 rounded transition cursor-pointer ${
                          tipGroupSize === g.pax ? 'bg-[#006ce4] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Role Selector Pills */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Select Service to Calculate
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EGYPTIAN_TIPPING_RULES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedTipRoleId(r.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        selectedTipRoleId === r.id
                          ? 'bg-[#003580] text-white shadow-xs'
                          : 'bg-[#f0f6ff] text-[#003580] hover:bg-[#e1eeff] border border-[#006ce4]/20'
                      }`}
                    >
                      <span>{r.title.split(' ')[0]} {r.title.split(' ')[1] || ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Recommendation Result Box */}
              <div className="bg-gradient-to-r from-[#003580] to-[#00224f] text-white rounded-xl p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#ffb700] uppercase tracking-wider">
                    Recommended Gratuity
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/80">
                    {calculatedTip.frequencyLabel}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">
                    {tipCurrency === 'USD' ? `$${calculatedTip.amountUsd} USD` :
                     tipCurrency === 'EUR' ? `€${calculatedTip.amountTargetCurrency} EUR` :
                     `${calculatedTip.amountEgp.toLocaleString()} EGP`}
                  </span>
                  {tipCurrency !== 'EGP' && (
                    <span className="text-xs text-white/70">
                      (approx. {calculatedTip.amountEgp.toLocaleString()} EGP)
                    </span>
                  )}
                </div>

                <div className="p-2.5 bg-white/10 rounded-lg text-xs leading-relaxed text-white/90">
                  <div className="font-bold text-[#ffb700] mb-0.5">When to Hand It:</div>
                  {calculatedTip.role.whenToTip}
                </div>

                <div className="text-[11px] text-white/70">
                  {calculatedTip.role.explanation}
                </div>
              </div>
            </div>

            {/* Daily Banknote Wallet Prep */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#003580] uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#008009]" />
                  <span>Wallet Cash Prep for Today</span>
                </h3>
                <span className="text-xs font-extrabold text-[#008009] tabular-nums">
                  ~{walletPrep.estimatedDayTotalEgp.toLocaleString()} EGP Total
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {walletPrep.denominations.map((d, i) => (
                  <div key={i} className="p-2 rounded-lg border border-slate-100 bg-[#f8f9fa] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-6 rounded bg-[#008009] text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                        {d.note}
                      </span>
                      <span className="text-[11px] text-slate-600 truncate max-w-[170px]">{d.purpose}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">{d.count}x bills</span>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 leading-relaxed">
                <strong>Golden Rule:</strong> {walletPrep.goldenRule}
              </div>
            </div>

            {/* General Egyptian Tipping Customs FAQ */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-[#003580] uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-[#006ce4]" />
                <span>Egyptian Tipping Etiquette Checklist</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#008009] shrink-0 mt-0.5" />
                  <span><strong>Discreet delivery:</strong> Fold notes gently and pass them with a warm handshake using your right hand.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#008009] shrink-0 mt-0.5" />
                  <span><strong>No foreign coins:</strong> Egyptian banks and locals cannot exchange foreign coins (e.g. 1€ or 2€ coins). Foreign paper currency ($20, $50) or Egyptian Pounds are preferred.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#008009] shrink-0 mt-0.5" />
                  <span><strong>Cruise envelopes:</strong> Do not tip dining staff or housekeeping individually every day on Nile cruises. The reception envelope at check-out is distributed to all 50+ crew.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#008009] shrink-0 mt-0.5" />
                  <span><strong>Voluntary:</strong> Tipping is a cultural expression of gratitude for attentive service, never mandatory if service fell short.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: HOTEL & DRIVER TAXI CARD */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'taxi' && dayDetails.tonightStay && (
          <div className="space-y-4">
            {/* The Famous "Show Taxi Driver" Card */}
            <div className="bg-white rounded-xl border-2 border-[#006ce4] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#006ce4] uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Driver Arabic Destination Card</span>
                </div>

                <button
                  onClick={() => setFullscreenTaxiCardOpen(true)}
                  className="btn-tactile text-xs bg-[#f0f6ff] text-[#003580] hover:bg-[#e1eeff] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-[#006ce4]/30 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen Driver Mode</span>
                </button>
              </div>

              {/* Big High-Contrast Arabic Box */}
              <div className="bg-[#f8f9fa] border-2 border-slate-900 rounded-xl p-5 text-center space-y-3" dir="rtl">
                <div className="text-xs font-bold text-slate-500 font-sans">
                  من فضلك وصّلني إلى:
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-950 font-arabic leading-tight">
                  {dayDetails.tonightStay.taxiCard.arabicName}
                </div>
                <div className="text-sm font-bold text-slate-700 font-arabic border-t border-slate-200 pt-2">
                  {dayDetails.tonightStay.taxiCard.fullArabicAddress}
                </div>
                <div className="text-xs text-slate-500 font-arabic">
                  {dayDetails.tonightStay.taxiCard.driverInstructionsArabic}
                </div>
              </div>

              {/* English Details */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="font-bold text-slate-900 text-sm">
                  {dayDetails.tonightStay.taxiCard.englishName}
                </div>
                <div className="text-slate-500">
                  Pronounced: <em className="text-[#003580] font-semibold">{dayDetails.tonightStay.taxiCard.phoneticPronunciation}</em>
                </div>
                <div className="text-slate-600">
                  City / District: <strong>{dayDetails.tonightStay.taxiCard.district}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={dayDetails.tonightStay.taxiCard.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile flex-1 bg-[#006ce4] hover:bg-[#0057b8] text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>

                <button
                  onClick={() => copyToClipboard(dayDetails.tonightStay?.taxiCard.fullArabicAddress || '', 'address')}
                  className="btn-tactile px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedText === 'address' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#008009]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Arabic Address</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Handy Arabic Phrases for Taxi / Walking */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-[#003580] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#ffb700]" />
                <span>Helpful Egyptian Arabic Phrases</span>
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  { english: 'Please take me to this hotel', arabic: 'وديني الفندق ده من فضلك', phonetic: 'Waddeeni el-funduq da min fadlak' },
                  { english: 'Please turn on the A/C', arabic: 'شغّل التكييف من فضلك', phonetic: 'Shagh-ghal el-takyif min fadlak' },
                  { english: 'Keep the change, thank you', arabic: 'خلي الباقي، شكراً', phonetic: 'Khalli el-baa-i, shukran' },
                  { english: 'Where is the restroom?', arabic: 'فين الحمام من فضلك؟', phonetic: 'Fein el-hammaam min fadlak?' },
                ].map((ph, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-[#f8f9fa] flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{ph.english}</div>
                      <div className="text-[11px] text-[#003580] font-medium">{ph.phonetic}</div>
                    </div>
                    <div className="font-arabic font-bold text-sm text-slate-800 text-right" dir="rtl">
                      {ph.arabic}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: CURRENCY & SMALL BILLS */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'currency' && (
          <div className="space-y-4">
            {/* Quick Live Converter */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#003580] tracking-tight flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#008009]" />
                  <span>Live Egyptian Pound (EGP) Converter</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">1 USD ≈ 49.50 EGP</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#006ce4]/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Currency
                  </label>
                  <select
                    value={convertFrom}
                    onChange={(e) => setConvertFrom(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#006ce4]/30"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EGP">EGP (Egyptian Pounds)</option>
                  </select>
                </div>
              </div>

              {/* Conversion Output Display */}
              <div className="bg-[#f0f6ff] border border-[#006ce4]/20 rounded-xl p-3.5 text-center space-y-1">
                <div className="text-xs text-slate-500 font-medium">Converted Value in Egyptian Pounds</div>
                <div className="text-3xl font-extrabold text-[#003580] tabular-nums">
                  {convertedResult.egp.toLocaleString()} <span className="text-sm font-bold text-[#006ce4]">EGP</span>
                </div>
                <div className="text-xs text-slate-500 pt-1">
                  ≈ ${convertedResult.usd} USD • €{convertedResult.eur} EUR • £{convertedResult.gbp} GBP
                </div>
              </div>
            </div>

            {/* Banknote Denominations Cheat Sheet */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-[#003580] uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#ffb700]" />
                <span>Egyptian Banknote Cheat Sheet</span>
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  { note: '200 EGP', color: 'bg-emerald-700', bestFor: 'Largest bill in circulation. Best for hotel tipping envelopes, major dining, or souvenir shops. Never use for taxis or small water bottles.' },
                  { note: '100 EGP', color: 'bg-purple-800', bestFor: 'Excellent for felucca tips, camel rides at Giza, or casual lunch bills.' },
                  { note: '50 EGP', color: 'bg-amber-700', bestFor: 'The most versatile bill! Ideal for hotel porters, drivers daily tip contribution, and cafe drinks.' },
                  { note: '20 EGP', color: 'bg-teal-700', bestFor: 'Crucial for archaeological site restrooms, temple guards, and buying cold bottled water.' },
                  { note: '10 EGP', color: 'bg-orange-800', bestFor: 'Smallest practical paper bill. Handy pocket change for street services.' },
                ].map((n, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-[#f8f9fa] flex items-start gap-3">
                    <span className={`w-14 h-8 rounded ${n.color} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                      {n.note}
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">
                      {n.bestFor}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash vs Card Advice */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-2 text-xs text-slate-700 leading-relaxed">
              <div className="font-bold text-[#003580] text-xs flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#006ce4]" />
                <span>Where to Use Cards vs. Cash in Egypt</span>
              </div>
              <p>
                <strong>Credit / Debit Cards:</strong> Accepted at government archaeological ticket offices (Ministry of Tourism monument gates now operate on 100% cashless card payments), luxury hotels, and licensed shopping bazaars.
              </p>
              <p>
                <strong>Cash Strictly Required:</strong> Tipping, Khan el-Khalili spice stalls, felucca skippers, desert camel handlers, and monument restrooms.
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: SOS & EMERGENCY DIRECTORY */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            {/* Immediate SOS Hotline Card */}
            <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#ffb700]" />
                <h2 className="text-base font-extrabold tracking-tight">24/7 RIHAL Operations Hotline</h2>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                If you encounter any delay, get separated from your party, need medical assistance, or require urgent translation, our duty manager is on call 24 hours a day.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={dayDetails.dutyManager.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile bg-[#008009] hover:bg-[#006607] text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Operations via WhatsApp</span>
                </a>

                <a
                  href={dayDetails.dutyManager.callUrl}
                  className="btn-tactile bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Operations Duty Desk</span>
                </a>
              </div>
            </div>

            {/* Emergency Numbers Directory */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-[#003580] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#006ce4]" />
                <span>Official Egyptian Emergency Hotlines</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Egypt Tourist Police (شرطة السياحة)', number: '126', note: 'Dedicated English-speaking tourist police across all sights' },
                  { name: 'National Ambulance (الإسعاف)', number: '123', note: 'Emergency medical dispatch' },
                  { name: 'General Police (الشرطة)', number: '122', note: 'Central emergency response' },
                  { name: 'Fire Department (المطافئ)', number: '180', note: 'Fire and rescue' },
                ].map((s, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-[#f8f9fa] flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                      <div className="text-[10px] text-slate-500">{s.note}</div>
                    </div>
                    <a
                      href={`tel:${s.number}`}
                      className="w-10 h-8 rounded-lg bg-[#006ce4] hover:bg-[#0057b8] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs transition"
                    >
                      {s.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Details Reference */}
            <div className="bg-white rounded-xl border border-[#e7e7e7] p-4 shadow-2xs space-y-2 text-xs">
              <div className="font-bold text-slate-900 text-xs">Your Booking Identity for Verification</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>Booking Ref: <strong className="text-[#003580]">{quote.quoteNumber}</strong></div>
                <div>Guest: <strong>{quote.travelerName}</strong></div>
                <div>Dates: <strong>{quote.startDate} ({quote.durationDays}d)</strong></div>
                <div>Pax: <strong>{quote.group?.adults || 2} Adults</strong></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* 3. STICKY MOBILE BOTTOM NAVIGATION BAR */}
      {/* ------------------------------------------------------------------ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e7e7e7] z-40 shadow-lg print:hidden">
        <div className="max-w-2xl mx-auto grid grid-cols-5 py-1.5 px-2">
          {[
            { id: 'today', label: "Today's Tour", icon: Calendar },
            { id: 'tipping', label: 'Tipping', icon: Wallet },
            { id: 'taxi', label: 'Taxi Card', icon: MapPin },
            { id: 'currency', label: 'Currency', icon: DollarSign },
            { id: 'sos', label: 'SOS Desk', icon: Shield },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1 rounded-lg transition cursor-pointer ${
                  isActive ? 'text-[#006ce4] font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <tab.icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-[#006ce4] stroke-[2.5]' : 'text-slate-400'}`} />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* 4. FULLSCREEN DRIVER MODE MODAL */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {fullscreenTaxiCardOpen && dayDetails.tonightStay && (
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-6 text-white"
            onClick={() => setFullscreenTaxiCardOpen(false)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-[#ffb700]">
                Driver Fullscreen Mode • أظهر هذا للسائق
              </span>
              <button
                onClick={() => setFullscreenTaxiCardOpen(false)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 text-center my-auto" dir="rtl">
              <div className="text-xl text-white/80 font-arabic">
                من فضلك وصّلني إلى:
              </div>
              <div className="text-4xl sm:text-5xl font-black text-[#ffb700] font-arabic leading-tight">
                {dayDetails.tonightStay.taxiCard.arabicName}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-arabic leading-relaxed max-w-xl mx-auto border-t border-white/20 pt-4">
                {dayDetails.tonightStay.taxiCard.fullArabicAddress}
              </div>
              <div className="text-base text-white/90 font-arabic">
                {dayDetails.tonightStay.taxiCard.driverInstructionsArabic}
              </div>
            </div>

            <div className="text-center text-xs text-white/60">
              Tap anywhere to close • اضغط في أي مكان للإغلاق
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
