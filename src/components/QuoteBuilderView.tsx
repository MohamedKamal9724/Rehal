import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  FileText, Plus, Trash2, AlertTriangle, 
  Share2, Eye, ShieldAlert, Check, Calendar, Search, X, MessageSquare, FileSpreadsheet,
  Sparkles, RefreshCw, Zap, CornerDownLeft, Keyboard, ChevronLeft, ChevronRight,
  Navigation, MapPin, ChevronDown, ChevronUp, Route as RouteIcon, Gauge, Clock, 
  Car, Footprints, Bus, Info, CheckCircle2
} from 'lucide-react';
import { exportQuoteToExcel, exportQuoteToLuxuryPDF } from '../lib/exportUtils';

import { motion, AnimatePresence } from 'motion/react';
import { 
  Currency, GroupComposition, Inquiry, Quote, QuoteDay, 
  QuoteLine, Rate, UILanguage, Workspace, User, OccupancyBasis, ProposalUpsell, SupplierType
} from '../types';
import { draftItineraryFromRates, translateItineraryDaysWithAi } from '../lib/gemini';
import { calculateLineCostAndPrice, recalculateQuoteTotals, markupForTargetMargin, repriceLine, matchContractedRate } from '../lib/pricingEngine';
import { getSuggestedUpsellsForQuote } from '../lib/upsellService';
import { PROPOSAL_LANGUAGES, DEFAULT_EXCHANGE_RATES } from '../lib/constants';
import { getStoredExchangeRates } from '../lib/currencyService';
import { UI_TRANSLATIONS } from '../lib/i18n';
import { GuidanceTrigger } from './common/GuidanceTrigger';
import { WhatsAppParserModal } from './WhatsAppParserModal';
import { VisualItineraryTimeline } from './common/VisualItineraryTimeline';
import { GoogleTripRouteMap } from './maps/GoogleTripRouteMap';
import { resolveLocationPoint, GeoPoint } from '../lib/geoCoordinates';
import { 
  calculateConsecutiveTourDistanceMatrix, 
  DistanceMatrixResult, 
  DistanceMatrixLeg 
} from '../lib/distanceMatrix';

interface QuoteBuilderViewProps {
  workspace: Workspace;
  currentUser: User;
  rates: Rate[];
  initialInquiry?: Inquiry;
  onSaveQuote: (quote: Quote) => void;
  onViewProposal: (quote: Quote) => void;
  uiLang: UILanguage;
  highlightTimeline?: boolean;
}

export const QuoteBuilderView: React.FC<QuoteBuilderViewProps> = ({
  workspace,
  currentUser,
  rates,
  initialInquiry,
  onSaveQuote,
  onViewProposal,
  uiLang,
  highlightTimeline = false,
}) => {
  const t = (key: string) => UI_TRANSLATIONS[uiLang]?.[key] || key;
  const hideNetCost = workspace.hideNetCostsFromAgents && currentUser.role === 'Sales Agent';

  const defaultGroup: GroupComposition = initialInquiry?.requirements?.group || {
    adults: 2,
    children: [],
    infants: 0,
  };

  const [travelerName, setTravelerName] = useState(initialInquiry?.travelerName || '');
  const [targetCurrency, setTargetCurrency] = useState<Currency>(initialInquiry?.requirements?.budgetCurrency || workspace.defaultCurrency || 'USD');
  const [proposalLang, setProposalLang] = useState(initialInquiry?.language || 'en');
  const [group, setGroup] = useState<GroupComposition>(defaultGroup);
  const [startDate, setStartDate] = useState(initialInquiry?.requirements?.startDate || new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(initialInquiry?.requirements?.durationDays || 5);
  const [globalMarkup, setGlobalMarkup] = useState<number>(markupForTargetMargin(workspace.minMarginPercent || 20));
  const [b2bCommission, setB2bCommission] = useState<number>(0);

  // Rate picker modal state
  const [servicePickerDayIndex, setServicePickerDayIndex] = useState<number | null>(null);
  const [rateSearch, setRateSearch] = useState('');
  const [whatsappParserOpen, setWhatsappParserOpen] = useState(false);
  const [selectedTimelineDayIndex, setSelectedTimelineDayIndex] = useState<number>(0);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showRouteMap, setShowRouteMap] = useState<boolean>(true);
  const [distanceMatrixResult, setDistanceMatrixResult] = useState<DistanceMatrixResult | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState<boolean>(false);
  const [distanceMatrixMode, setDistanceMatrixMode] = useState<'driving' | 'walking' | 'transit'>('driving');
  const [showDistanceMatrixBreakdown, setShowDistanceMatrixBreakdown] = useState<boolean>(true);

  // Keyboard-driven quick line entry state
  const [quickAddDayIndex, setQuickAddDayIndex] = useState<number | null>(null);
  const [quickAddDraft, setQuickAddDraft] = useState<{
    serviceName: string;
    city: string;
    supplierType: SupplierType;
    supplierName: string;
    unitCost: number;
    costCurrency: Currency;
    markupPercent: number;
    occupancyBasis: OccupancyBasis;
    quantity: number;
  }>({
    serviceName: '',
    city: 'Cairo',
    supplierType: 'Guide',
    supplierName: '',
    unitCost: 50,
    costCurrency: 'USD',
    markupPercent: 25,
    occupancyBasis: 'per_person',
    quantity: 1,
  });
  const quickAddInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isTranslatingAi, setIsTranslatingAi] = useState(false);
  const [aiTranslateSuccess, setAiTranslateSuccess] = useState(false);

  const handleSelectTimelineDay = (idx: number) => {
    setSelectedTimelineDayIndex(idx);
    const element = document.getElementById(`quote-day-${idx}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleApplyParsedInquiry = (inq: Inquiry) => {
    if (inq.travelerName) setTravelerName(inq.travelerName);
    if (inq.requirements?.budgetCurrency) setTargetCurrency(inq.requirements.budgetCurrency);
    if (inq.language) setProposalLang(inq.language);
    if (inq.requirements?.group) setGroup(inq.requirements.group);
    if (inq.requirements?.startDate) setStartDate(inq.requirements.startDate);
    if (inq.requirements?.durationDays) setDurationDays(inq.requirements.durationDays);
    if (inq.requirements) {
      const drafted = draftItineraryFromRates(inq.requirements, rates, inq.requirements.budgetCurrency || targetCurrency);
      if (drafted.length > 0) {
        setDays(drafted);
      }
    }
  };

  useEffect(() => {
    if (initialInquiry) {
      handleApplyParsedInquiry(initialInquiry);
    }
  }, [initialInquiry]);

  // Initial Days
  const [days, setDays] = useState<QuoteDay[]>(() => {
    if (initialInquiry?.requirements) {
      return draftItineraryFromRates(initialInquiry.requirements, rates, targetCurrency);
    }
    return [
      {
        dayNumber: 1,
        title: 'Arrival in Cairo & VIP Airport Fast-Track',
        description: 'Meet and assist at Cairo International Airport, fast-track through immigration, and private chauffeur transfer to your hotel.',
        city: 'Cairo',
        lines: [],
      },
    ];
  });

  // Filter / match logic for quote services search bar
  const matchingServiceResults = React.useMemo(() => {
    const q = serviceSearchQuery.trim().toLowerCase();
    if (!q) return null;
    let matchCount = 0;
    const matchingDayIndices = new Set<number>();

    days.forEach((day, dIdx) => {
      let dayMatched = false;
      if (day.title?.toLowerCase().includes(q) || day.city?.toLowerCase().includes(q) || day.description?.toLowerCase().includes(q)) {
        dayMatched = true;
      }
      day.lines?.forEach(line => {
        if (
          line.serviceName?.toLowerCase().includes(q) ||
          line.supplierType?.toLowerCase().includes(q) ||
          line.supplierName?.toLowerCase().includes(q) ||
          line.city?.toLowerCase().includes(q)
        ) {
          matchCount++;
          dayMatched = true;
        }
      });
      if (dayMatched) {
        matchingDayIndices.add(dIdx);
      }
    });

    return { matchCount, matchingDayIndices };
  }, [days, serviceSearchQuery]);

  // Curated Luxury DMC Proposal Add-ons / Upsells
  const [upsells, setUpsells] = useState<ProposalUpsell[]>(() => {
    return getSuggestedUpsellsForQuote({ days, group });
  });

  const handleAutoSuggestUpsells = () => {
    const suggested = getSuggestedUpsellsForQuote({ days, group });
    setUpsells(suggested);
  };

  const handleToggleUpsellEnabled = (id: string) => {
    setUpsells(prev => prev.map(u => u.id === id ? { ...u, isSelected: u.isSelected === false ? true : false } : u));
  };

  const handleUpdateUpsellPrice = (id: string, price: number) => {
    setUpsells(prev => prev.map(u => u.id === id ? { ...u, price: Math.max(0, price) } : u));
  };

  const handleUpdateUpsellNetCost = (id: string, netCost: number) => {
    setUpsells(prev => prev.map(u => u.id === id ? { ...u, netCost: Math.max(0, netCost) } : u));
  };

  const handleRemoveUpsell = (id: string) => {
    setUpsells(prev => prev.filter(u => u.id !== id));
  };

  const handleAddCustomUpsell = () => {
    const newUpsell: ProposalUpsell = {
      id: `upsell-custom-${Date.now()}`,
      title: 'Bespoke Private Experience',
      arabicTitle: 'تجربة خاصة مصممة حسب الطلب',
      city: days[0]?.city || 'Cairo',
      description: 'Exclusive private service tailored for client preferences with dedicated VIP logistics.',
      price: 150,
      priceBasis: 'per_person',
      netCost: 80,
      category: 'VIP Service',
      badge: 'Custom',
      isSelected: true,
    };
    setUpsells(prev => [...prev, newUpsell]);
  };

  const activeUpsells = upsells.filter(u => u.isSelected !== false);
  const potentialUpsellsTotalUsd = activeUpsells.reduce((acc, u) => {
    return acc + (u.priceBasis === 'per_person' ? u.price * Math.max(1, group.adults) : u.price);
  }, 0);

  const allLines = days.flatMap(d => d.lines);
  const totals = recalculateQuoteTotals(allLines, targetCurrency, b2bCommission);
  const isBelowMinMargin = totals.marginPercent < workspace.minMarginPercent;

  // Approval guardrail: below-minimum-margin quotes need an Owner/Admin to send.
  const needsApproval = isBelowMinMargin && workspace.requireApprovalBelowMinMargin;
  const canApprove = currentUser.role === 'Owner' || currentUser.role === 'Admin';
  // Missing OR expired rates always block dispatch.
  const canSend = days.some(d=>d.lines.length>0) && Boolean(travelerName.trim()) && Boolean(startDate) && Number.isFinite(totals.totalPriceQuoteCurrency) && totals.totalPriceQuoteCurrency > 0 && !totals.hasBlockingRate && (!needsApproval || canApprove);

  // Keep every priced line in sync with the group, currency, travel date and the live rate library.
  // (Lines keep their own markup; manually overridden lines are left alone.)
  useEffect(() => {
    setDays((prev) =>
      prev.map((day, i) => ({
        ...day,
        lines: day.lines.map((line) => {
          const rate = rates.find((r) => r.id === line.serviceId);
          const date = new Date(new Date(startDate + 'T00:00:00Z').getTime() + i * 86400000)
            .toISOString().split('T')[0];
          return repriceLine(line, rate, group, targetCurrency, isNaN(Date.parse(date)) ? undefined : date);
        }),
      }))
    );
  }, [group, targetCurrency, startDate, rates]);

  const handleAiDraftFromRates = () => {
    const mockReq = initialInquiry?.requirements || {
      travelerName,
      language: proposalLang,
      durationDays,
      group,
      cities: ['Cairo', 'Giza', 'Luxor'],
      hotelStarRating: 5,
      interests: ['Pyramids of Giza', 'Luxor Temples'],
      urgency: 'Medium',
      confidenceScores: {},
    };
    const drafted = draftItineraryFromRates(mockReq, rates, targetCurrency);
    setDays(drafted);
  };

  const handleAiTranslateItinerary = async () => {
    if (days.length === 0 || isTranslatingAi) return;
    setIsTranslatingAi(true);
    try {
      const translated = await translateItineraryDaysWithAi(days, proposalLang);
      setDays(translated);
      setAiTranslateSuccess(true);
      setTimeout(() => setAiTranslateSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to translate itinerary with AI:', err);
    } finally {
      setIsTranslatingAi(false);
    }
  };

  const handleAddDay = () => {
    setDays([
      ...days,
      {
        dayNumber: days.length + 1,
        title: `Day ${days.length + 1}: Sightseeing & Cultural Program`,
        description: 'Explore historical sites with dedicated licensed Egyptologist.',
        city: 'Cairo',
        lines: [],
      },
    ]);
  };

  const handleRemoveDay = (dayIdx: number) => {
    const filtered = days.filter((_, idx) => idx !== dayIdx).map((d, i) => ({
      ...d,
      dayNumber: i + 1,
    }));
    setDays(filtered);
  };

  const handleAddServiceToDay = (rate: Rate) => {
    if (servicePickerDayIndex === null) return;
    const day = days[servicePickerDayIndex];
    if (!day) return;

    const occBasis: OccupancyBasis = rate.occupancyBasis;
    const calc = calculateLineCostAndPrice(
      rate,
      1,
      occBasis,
      group,
      targetCurrency,
      globalMarkup,
      0,
      undefined,
      new Date(new Date(startDate + 'T00:00:00Z').getTime() + servicePickerDayIndex * 86400000).toISOString().split('T')[0]
    );

    const newLine: QuoteLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      dayNumber: day.dayNumber,
      serviceId: rate.id,
      serviceName: rate.serviceName,
      supplierName: rate.supplierName,
      supplierType: rate.supplierType,
      city: rate.city,
      quantity: 1,
      occupancyBasis: occBasis,
      unitCost: rate.netCost,
      costCurrency: rate.currency,
      markupPercent: globalMarkup,
      markupFixed: 0,
      unitPrice: calc.unitPriceQuoteCurrency,
      totalCostEgp: calc.totalCostEgp,
      totalPriceEgp: calc.totalPriceEgp,
      totalPriceQuoteCurrency: calc.totalPriceQuoteCurrency,
      status: calc.status,
      costCalculationNotes: calc.breakdown,
    };

    const updatedDays = [...days];
    updatedDays[servicePickerDayIndex].lines.push(newLine);
    setDays(updatedDays);
    setServicePickerDayIndex(null);
  };

  const handleRemoveLine = (dayIdx: number, lineId: string) => {
    const updated = [...days];
    updated[dayIdx].lines = updated[dayIdx].lines.filter(l => l.id !== lineId);
    setDays(updated);
  };

  const handleStartQuickAdd = (dayIdx: number) => {
    const day = days[dayIdx];
    setQuickAddDraft({
      serviceName: '',
      city: day.city || 'Cairo',
      supplierType: 'Guide',
      supplierName: '',
      unitCost: 50,
      costCurrency: targetCurrency === 'EGP' ? 'EGP' : 'USD',
      markupPercent: globalMarkup,
      occupancyBasis: 'per_person',
      quantity: 1,
    });
    setQuickAddDayIndex(dayIdx);
    setTimeout(() => {
      quickAddInputRef.current?.focus();
    }, 40);
  };

  const handleCommitQuickAdd = (dayIdx: number, keepOpen = true) => {
    if (!quickAddDraft.serviceName.trim()) return;

    const day = days[dayIdx];
    const travelDate = new Date(new Date(startDate + 'T00:00:00Z').getTime() + dayIdx * 86400000).toISOString().split('T')[0];

    const synthRate: Rate = {
      id: `quick-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: workspace.id,
      supplierId: 'quick-supplier',
      supplierName: quickAddDraft.supplierName.trim() || 'Direct / On-Spot Partner',
      serviceName: quickAddDraft.serviceName.trim(),
      supplierType: quickAddDraft.supplierType,
      city: quickAddDraft.city || day.city || 'Cairo',
      seasonIds: [],
      occupancyBasis: quickAddDraft.occupancyBasis,
      nationalityTier: 'all',
      currency: quickAddDraft.costCurrency,
      netCost: Number(quickAddDraft.unitCost) || 0,
      validityStart: '2024-01-01',
      validityEnd: '2028-12-31',
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    const calc = calculateLineCostAndPrice(
      synthRate,
      quickAddDraft.quantity || 1,
      quickAddDraft.occupancyBasis,
      group,
      targetCurrency,
      quickAddDraft.markupPercent ?? globalMarkup,
      0,
      undefined,
      travelDate
    );

    const newLine: QuoteLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dayNumber: day.dayNumber,
      serviceId: synthRate.id,
      serviceName: synthRate.serviceName,
      supplierName: synthRate.supplierName,
      supplierType: synthRate.supplierType,
      city: synthRate.city,
      quantity: quickAddDraft.quantity || 1,
      occupancyBasis: quickAddDraft.occupancyBasis,
      unitCost: synthRate.netCost,
      costCurrency: synthRate.currency,
      markupPercent: quickAddDraft.markupPercent ?? globalMarkup,
      markupFixed: 0,
      unitPrice: calc.unitPriceQuoteCurrency,
      totalCostEgp: calc.totalCostEgp,
      totalPriceEgp: calc.totalPriceEgp,
      totalPriceQuoteCurrency: calc.totalPriceQuoteCurrency,
      status: calc.status,
      costCalculationNotes: calc.breakdown,
    };

    const updatedDays = [...days];
    updatedDays[dayIdx].lines.push(newLine);
    setDays(updatedDays);

    if (keepOpen) {
      setQuickAddDraft(prev => ({
        ...prev,
        serviceName: '',
        unitCost: 0,
      }));
      setTimeout(() => {
        quickAddInputRef.current?.focus();
      }, 40);
    } else {
      setQuickAddDayIndex(null);
    }
  };

  const quickAddPreviewPrice = React.useMemo(() => {
    if (quickAddDayIndex === null || !quickAddDraft.serviceName.trim()) return null;
    try {
      const travelDate = new Date(new Date(startDate + 'T00:00:00Z').getTime() + quickAddDayIndex * 86400000).toISOString().split('T')[0];
      const synthRate: Rate = {
        id: 'preview',
        workspaceId: workspace.id,
        supplierId: 'quick-supplier',
        supplierName: quickAddDraft.supplierName || 'Direct',
        serviceName: quickAddDraft.serviceName,
        supplierType: quickAddDraft.supplierType,
        city: quickAddDraft.city || 'Cairo',
        seasonIds: [],
        occupancyBasis: quickAddDraft.occupancyBasis,
        nationalityTier: 'all',
        currency: quickAddDraft.costCurrency,
        netCost: Number(quickAddDraft.unitCost) || 0,
        validityStart: '2024-01-01',
        validityEnd: '2028-12-31',
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      return calculateLineCostAndPrice(
        synthRate,
        quickAddDraft.quantity || 1,
        quickAddDraft.occupancyBasis,
        group,
        targetCurrency,
        quickAddDraft.markupPercent ?? globalMarkup,
        0,
        undefined,
        travelDate
      );
    } catch {
      return null;
    }
  }, [quickAddDayIndex, quickAddDraft, group, targetCurrency, globalMarkup, startDate, workspace.id]);

  const getCurrSymbol = (curr: Currency): string => {
    switch (curr) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'EGP': return 'EGP ';
      case 'SAR': return 'SAR ';
      case 'RUB': return '₽';
      default: return '$';
    }
  };
  const currSymbol = getCurrSymbol(targetCurrency);

  const [sessionQuoteMeta] = useState(() => ({
    id: initialInquiry ? `quote-${initialInquiry.id.replace(/^inq-/, '')}` : `quote-${Date.now()}`,
    quoteNumber: `DAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  }));

  const buildCurrentQuote = (): Quote => {
    const storedFx = getStoredExchangeRates();
    const rateToEgp = targetCurrency === 'EGP'
      ? 1
      : (storedFx[targetCurrency]?.rateToEgp || DEFAULT_EXCHANGE_RATES[targetCurrency]?.toEgp || 49.5);
    const totalCostInQuoteCurr = Math.round(totals.totalCostEgp / rateToEgp);
    return {
      id: sessionQuoteMeta.id,
      workspaceId: workspace.id,
      quoteNumber: sessionQuoteMeta.quoteNumber,
      inquiryId: initialInquiry?.id,
      travelerName: travelerName.trim() || 'Distinguished Traveler',
      travelerPhone: initialInquiry?.travelerPhone,
      travelerEmail: initialInquiry?.travelerEmail,
      version: 1,
      status: 'Draft',
      targetCurrency,
      displayCurrency: targetCurrency,
      exchangeRateUsed: rateToEgp,
      startDate,
      durationDays: days.length,
      group,
      days,
      totalCostEgp: totals.totalCostEgp,
      totalPriceEgp: totals.totalPriceEgp,
      totalPriceQuoteCurrency: totals.totalPriceQuoteCurrency,
      marginPercent: totals.marginPercent,
      totals: {
        totalCost: totalCostInQuoteCurr,
        totalSell: totals.totalPriceQuoteCurrency,
        marginAmount: Math.max(0, totals.totalPriceQuoteCurrency - totalCostInQuoteCurr),
        marginPct: totals.marginPercent,
        perPersonSell: Math.round(totals.totalPriceQuoteCurrency / Math.max(1, group.adults)),
      },
      b2bCommissionPercent: b2bCommission,
      validUntil: new Date(Date.now() + workspace.quoteValidityDays * 86400000).toISOString().split('T')[0],
      language: proposalLang,
      assignedAgentId: currentUser.id,
      assignedAgentName: currentUser.name,
      requiresAdminApproval: needsApproval,
      adminApproved: needsApproval ? canApprove : undefined,
      publicToken: `tok-${sessionQuoteMeta.id}`,
      viewCount: 0,
      upsells: activeUpsells,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleCreateOrUpdateQuote = () => {
    if (!canSend) return; // defence in depth: the buttons are disabled too
    const newQuote = buildCurrentQuote();
    onSaveQuote(newQuote);
    onViewProposal(newQuote);
  };

  const handleExportDirectExcel = () => {
    exportQuoteToExcel(buildCurrentQuote(), workspace);
  };

  const handleExportDirectPdf = () => {
    exportQuoteToLuxuryPDF(buildCurrentQuote(), workspace);
  };

  const step1Done = Boolean(travelerName.trim() && days.length > 0);
  const totalLinesCount = days.reduce((acc, d) => acc + d.lines.length, 0);
  const step2Done = totalLinesCount > 0 && !totals.hasBlockingRate;
  const step3Done = Boolean(step1Done && step2Done && totals.marginPercent > 0 && canSend);
  const completedStepsCount = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0);

  // Compute GPS waypoints for the entire quote itinerary
  const quoteWaypoints = React.useMemo(() => {
    const points: GeoPoint[] = [];
    days.forEach(day => {
      if (day.lines && day.lines.length > 0) {
        day.lines.forEach(line => {
          points.push(
            resolveLocationPoint(
              line.serviceName,
              line.supplierName,
              line.city || day.city,
              line.supplierType
            )
          );
        });
      } else if (day.city) {
        points.push(resolveLocationPoint(`${day.city} Stay`, undefined, day.city, 'hotel'));
      }
    });

    return points.filter(
      (pt, idx, arr) =>
        idx === 0 ||
        Math.abs(pt.lat - arr[idx - 1].lat) > 0.0001 ||
        Math.abs(pt.lng - arr[idx - 1].lng) > 0.0001
    );
  }, [days]);

  /**
   * Calculates travel distance and duration between consecutive tour locations
   * using the Google Maps Distance Matrix API (with real-time fallback).
   */
  const calculateDistanceMatrixBetweenLocations = useCallback(
    async (
      points: GeoPoint[] = quoteWaypoints,
      mode: 'driving' | 'walking' | 'transit' = distanceMatrixMode
    ) => {
      if (!points || points.length < 2) {
        setDistanceMatrixResult(null);
        return null;
      }

      setIsCalculatingDistance(true);
      try {
        const result = await calculateConsecutiveTourDistanceMatrix(points, mode);
        setDistanceMatrixResult(result);
        return result;
      } catch (err) {
        console.error('Error calculating Google Maps Distance Matrix:', err);
        return null;
      } finally {
        setIsCalculatingDistance(false);
      }
    },
    [quoteWaypoints, distanceMatrixMode]
  );

  // Automatically calculate and display travel distances whenever itinerary locations or mode change
  useEffect(() => {
    if (quoteWaypoints.length >= 2) {
      calculateDistanceMatrixBetweenLocations(quoteWaypoints, distanceMatrixMode);
    } else {
      setDistanceMatrixResult(null);
    }
  }, [quoteWaypoints, distanceMatrixMode, calculateDistanceMatrixBetweenLocations]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls - Mediterranean Azure Theme */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#eae5dc] shadow-xs p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <GuidanceTrigger
          sectionKey="sales_quotes"
          uiLang={uiLang}
          pinned={true}
          size="sm"
          label={uiLang === 'ar' ? 'دليل التسعير' : 'Pricing Guide'}
        />
        <div className="ltr:pr-14 rtl:pl-14">
          <h1 className="text-xl font-bold text-[#0f2035] tracking-tight">{t('quotes.builder_title')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Day-by-day itinerary pricing from contract library with live margin calculation
          </p>
        </div>


        {/* Action Controls - Standardized equal height h-9 */}
        <div className="luxury-tab-bar flex items-center gap-2 overflow-x-auto sm:flex-wrap pb-1 sm:pb-0">
          <button
            onClick={() => setWhatsappParserOpen(true)}
            className="h-9 px-3.5 bg-orange-50 hover:bg-orange-100/70 text-orange-800 border border-orange-200 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>WhatsApp Parser</span>
          </button>

          <button
            onClick={handleAiDraftFromRates}
            className="h-9 px-3.5 bg-white hover:bg-orange-50/50 text-[#44200F] border border-[#EDE0CC] hover:border-orange-300 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-[#795037] shrink-0" />
            <span>{t('quotes.ai_draft_itinerary')}</span>
          </button>

          <button
            type="button"
            disabled={isTranslatingAi || days.length === 0}
            onClick={handleAiTranslateItinerary}
            className="h-9 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95 whitespace-nowrap shrink-0"
            title="Translate itinerary day titles and descriptions using Gemini AI"
          >
            <Sparkles className={`w-3.5 h-3.5 text-orange-500 shrink-0 ${isTranslatingAi ? 'animate-spin' : ''}`} />
            <span>{isTranslatingAi ? 'AI Translating...' : aiTranslateSuccess ? 'Translated!' : `AI Translate (${proposalLang.toUpperCase()})`}</span>
          </button>

          <button
            onClick={handleExportDirectExcel}
            className="h-9 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            title="Download operator cost breakdown Excel sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Excel Sheet</span>
          </button>

          <button
            onClick={handleExportDirectPdf}
            className="h-9 px-3.5 bg-amber-50 hover:bg-amber-100 text-[#44200F] border border-[#C4A177]/60 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            title="Generate luxury printable client PDF proposal"
          >
            <FileText className="w-3.5 h-3.5 text-[#795037] shrink-0" />
            <span>Proposal PDF</span>
          </button>

          <button
            disabled={!canSend}
            onClick={handleCreateOrUpdateQuote}
            className="h-9 px-4 bg-gradient-to-r from-[#44200F] via-[#5c2410] to-[#44200F] hover:to-[#ea580c] text-white border border-orange-500/30 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-orange-300 shrink-0" />
            <span>{t('quotes.generate_proposal')}</span>
          </button>
        </div>
      </div>

      {/* Contextual Product Education */}
      <div className="bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-[#795037] shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C4A177] shrink-0" />
          <span className="font-semibold">
            {uiLang === 'ar' 
              ? 'ابدأ من طلب عميل وارد أو أنشئ عرض سعر يدوياً.' 
              : 'Start from a customer enquiry or create a quote manually.'}
          </span>
        </div>
      </div>

      {/* Guided Visual 3-Step Quotation Flow with Progress Badges */}
      <div className="bg-white rounded-2xl border border-[#eae5dc] p-4.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Quotation Journey
            </span>
            <span className="text-xs font-bold text-slate-500">
              {completedStepsCount} of 3 Steps Completed ({Math.round((completedStepsCount / 3) * 100)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canSend ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Ready for Client Proposal</span>
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Resolve Required Services</span>
              </span>
            )}
          </div>
        </div>

        {/* 3 Step Track Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
          {/* Step 1 */}
          <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between min-h-[82px] ${step1Done ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 1</span>
              {step1Done ? (
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5"><Check className="w-3 h-3" /> Ready</span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600">In Progress</span>
              )}
            </div>
            <div className="font-bold text-xs text-slate-900">Traveler &amp; Group Dates</div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{travelerName || 'Set traveler name'} · {days.length} Days</div>
          </div>

          {/* Step 2 */}
          <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between min-h-[82px] ${step2Done ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 2</span>
              {step2Done ? (
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5"><Check className="w-3 h-3" /> Ready</span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600">In Progress</span>
              )}
            </div>
            <div className="font-bold text-xs text-slate-900">Contract Rate Matching</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{totalLinesCount} Services · {totals.hasBlockingRate ? 'Missing Rates' : 'All Tariffs Matched'}</div>
          </div>

          {/* Step 3 */}
          <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between min-h-[82px] ${step3Done ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 3</span>
              {step3Done ? (
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5"><Check className="w-3 h-3" /> Validated</span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400">Final Export</span>
              )}
            </div>
            <div className="font-bold text-xs text-slate-900">Profit Margin &amp; Delivery</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{totals.marginPercent}% Margin · Luxury PDF / Excel</div>
          </div>
        </div>
      </div>

      {/* Configuration Header (Traveler, Currency, Language, Group) - Bespoke Parameter Bar */}
      <div className="bg-white rounded-2xl border border-[#eae5dc] shadow-xs p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-[#595959] uppercase tracking-wider mb-1">Traveler Name</label>
          <input
            type="text"
            value={travelerName}
            onChange={(e) => setTravelerName(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e7e7e7] rounded-md text-xs font-semibold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#595959] uppercase tracking-wider mb-1">Proposal Language</label>
          <select
            value={proposalLang}
            onChange={(e) => setProposalLang(e.target.value as any)}
            className="w-full px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e7e7e7] rounded-md text-xs font-semibold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition cursor-pointer"
          >
            {PROPOSAL_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#595959] uppercase tracking-wider mb-1">Quote Currency</label>
          <select
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value as any)}
            className="w-full px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e7e7e7] rounded-md text-xs font-semibold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition cursor-pointer"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EGP">EGP (ج.م)</option>
            <option value="RUB">RUB (₽)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#595959] uppercase tracking-wider mb-1">Adults</label>
          <input
            type="number"
            min={1}
            value={group.adults}
            onChange={(e) => setGroup({ ...group, adults: parseInt(e.target.value, 10) || 1 })}
            className="w-full px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e7e7e7] rounded-md text-xs font-semibold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#595959] uppercase tracking-wider mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e7e7e7] rounded-md text-xs font-semibold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#595959] uppercase tracking-wider mb-1">B2B Commission %</label>
          <input
            type="number"
            min={0}
            max={50}
            value={b2bCommission}
            onChange={(e) => setB2bCommission(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e7e7e7] rounded-md text-xs font-semibold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition"
          />
        </div>
      </div>

      {/* Interactive Visual Itinerary Timeline */}
      <VisualItineraryTimeline
        days={days}
        selectedDayIndex={selectedTimelineDayIndex}
        onSelectDay={handleSelectTimelineDay}
        onAddDay={handleAddDay}
        isHighlighted={highlightTimeline}
        currency={targetCurrency}
      />

      {/* Interactive Google Maps GPS Route, Hotel Pins & Distance Engine */}
      <div className="bg-white rounded-2xl border border-[#eae5dc] shadow-xs overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-sky-50/50 flex flex-wrap items-center justify-between gap-3 border-b border-[#eae5dc]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center border border-sky-200">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0f2035] tracking-tight">
                  {uiLang === 'ar' ? 'خريطة مسار الرحلة التفاعلية ومواقع الفنادق (Google Maps Platform)' : 'Interactive Itinerary GPS Route & Hotel Radar (Google Maps Platform)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  Live GPS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {uiLang === 'ar'
                  ? 'رسم مباشر لخط سير الرحلة بين المدن مع أماكن الفنادق والمزارات وحساب دقيق للمسافات المقطوعة وأزمنة الانتقال.'
                  : 'Live geospatial routing connecting hotels, sightseeing stops, and airports with real-time transit distance calculations.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRouteMap(!showRouteMap)}
              className="px-3 py-1.5 rounded-xl border border-[#eae5dc] bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              {showRouteMap ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>{uiLang === 'ar' ? 'طي الخريطة' : 'Collapse Map'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>{uiLang === 'ar' ? 'عرض خريطة المسار' : 'Show Route Map'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showRouteMap && (
          <div className="p-3 sm:p-4 space-y-4">
            <GoogleTripRouteMap
              waypoints={quoteWaypoints}
              uiLang={uiLang}
              height={400}
              showLegsList={true}
              showStatsBanner={true}
              distanceMatrixResult={distanceMatrixResult}
              isCalculatingDistance={isCalculatingDistance}
              onRecalculateDistance={() => calculateDistanceMatrixBetweenLocations(quoteWaypoints, distanceMatrixMode)}
            />

            {/* Google Maps Distance Matrix Consecutive Locations Panel */}
            <div className="bg-slate-50/80 rounded-xl border border-sky-100 p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center border border-sky-200">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        {uiLang === 'ar' 
                          ? 'حساب المسافات التراكمية بين محطات الجولة (Google Routes Engine)'
                          : 'Google Routes & Distance Engine: Consecutive Tour Distances'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {distanceMatrixResult?.source === 'google_routes_api'
                          ? 'Routes API'
                          : 'Active Engine'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {uiLang === 'ar'
                        ? 'حساب المسافة البرية الدقيقة وزمن الرحلة بين كل محطة ومحطة متتالية في البرنامج السياحي'
                        : 'Calculates exact road distance and transit duration between each consecutive tour location in sequence'}
                    </p>
                  </div>
                </div>

                {/* Travel Mode Selector & Recalculate Button */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setDistanceMatrixMode('driving');
                        calculateDistanceMatrixBetweenLocations(quoteWaypoints, 'driving');
                      }}
                      className={`px-2 py-1 rounded-md transition flex items-center gap-1 font-semibold cursor-pointer ${
                        distanceMatrixMode === 'driving' ? 'bg-sky-50 text-sky-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Driving (Car / Coach)"
                    >
                      <Car className="w-3 h-3 text-sky-600" />
                      <span>{uiLang === 'ar' ? 'سيارة / حافلة' : 'Driving'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDistanceMatrixMode('walking');
                        calculateDistanceMatrixBetweenLocations(quoteWaypoints, 'walking');
                      }}
                      className={`px-2 py-1 rounded-md transition flex items-center gap-1 font-semibold cursor-pointer ${
                        distanceMatrixMode === 'walking' ? 'bg-sky-50 text-sky-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Walking"
                    >
                      <Footprints className="w-3 h-3 text-emerald-600" />
                      <span>{uiLang === 'ar' ? 'مشي' : 'Walking'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDistanceMatrixMode('transit');
                        calculateDistanceMatrixBetweenLocations(quoteWaypoints, 'transit');
                      }}
                      className={`px-2 py-1 rounded-md transition flex items-center gap-1 font-semibold cursor-pointer ${
                        distanceMatrixMode === 'transit' ? 'bg-sky-50 text-sky-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Public Transit"
                    >
                      <Bus className="w-3 h-3 text-purple-600" />
                      <span>{uiLang === 'ar' ? 'نقل عام' : 'Transit'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => calculateDistanceMatrixBetweenLocations(quoteWaypoints, distanceMatrixMode)}
                    disabled={isCalculatingDistance || quoteWaypoints.length < 2}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCalculatingDistance ? 'animate-spin' : ''}`} />
                    <span>{uiLang === 'ar' ? 'إعادة حساب المسافات' : 'Recalculate Matrix'}</span>
                  </button>
                </div>
              </div>

              {/* Distance Matrix Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                    <RouteIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>{uiLang === 'ar' ? 'المسافة الإجمالية المتتالية' : 'Total Travel Distance'}</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {isCalculatingDistance ? (
                      <span className="text-slate-400 text-xs animate-pulse">Calculating...</span>
                    ) : distanceMatrixResult ? (
                      <span className="text-sky-700">{distanceMatrixResult.formattedTotalDistance}</span>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {uiLang === 'ar' ? 'مجموع المسافات بين المحطات' : 'Sum of consecutive legs'}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{uiLang === 'ar' ? 'زمن الانتقال التقديري' : 'Total Transit Time'}</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {isCalculatingDistance ? (
                      <span className="text-slate-400 text-xs animate-pulse">Calculating...</span>
                    ) : distanceMatrixResult ? (
                      <span className="text-amber-700">{distanceMatrixResult.formattedTotalDuration}</span>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {uiLang === 'ar' ? 'حسب ظروف الحركة والمسار' : 'Estimated transit duration'}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{uiLang === 'ar' ? 'المحطات المترابطة' : 'Tour Stops Connected'}</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {quoteWaypoints.length} <span className="text-xs font-normal text-slate-500">{uiLang === 'ar' ? 'موقع' : 'stops'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {distanceMatrixResult?.legs.length || 0} {uiLang === 'ar' ? 'مراحل انتقال' : 'consecutive legs'}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{uiLang === 'ar' ? 'حالة الاعتماد' : 'Validation Status'}</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span>Google Routes Engine</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {distanceMatrixResult?.calculatedAt ? (
                      <span>{uiLang === 'ar' ? 'محسوب الآن' : 'Updated Live'}</span>
                    ) : (
                      'Ready'
                    )}
                  </div>
                </div>
              </div>

              {/* Consecutive Stops Step-by-Step Breakdown Accordion */}
              {distanceMatrixResult && distanceMatrixResult.legs.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowDistanceMatrixBreakdown(!showDistanceMatrixBreakdown)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <RouteIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>
                        {uiLang === 'ar'
                          ? `تفاصيل المسافة بين المحطات المتعاقبة (${distanceMatrixResult.legs.length} مراحل)`
                          : `Consecutive Tour Locations Distance Matrix Breakdown (${distanceMatrixResult.legs.length} legs)`}
                      </span>
                    </div>
                    {showDistanceMatrixBreakdown ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  {showDistanceMatrixBreakdown && (
                    <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                      {distanceMatrixResult.legs.map((leg, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-150 bg-slate-50/50 hover:bg-sky-50/40 hover:border-sky-200 transition text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-sky-200">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                <span className="text-slate-800">{leg.fromName}</span>
                                <span className="text-sky-500 font-bold">➔</span>
                                <span className="text-slate-900">{leg.toName}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="capitalize font-medium text-slate-600">{distanceMatrixMode}</span>
                                <span>•</span>
                                <span>{leg.fromCoords.lat.toFixed(3)},{leg.fromCoords.lng.toFixed(3)} to {leg.toCoords.lat.toFixed(3)},{leg.toCoords.lng.toFixed(3)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono">
                            <div className="text-right">
                              <div className="font-extrabold text-sky-900">{leg.distanceText || `${leg.distanceKm} km`}</div>
                              <div className="text-[10px] text-slate-500 font-sans">~{leg.durationText || `${leg.durationMinutes} min`}</div>
                            </div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&origin=${leg.fromCoords.lat},${leg.fromCoords.lng}&destination=${leg.toCoords.lat},${leg.toCoords.lng}&travelmode=${distanceMatrixMode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300 transition"
                              title="Open directions in Google Maps"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Days & Services (left) + Sticky Financial Summary (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Days List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Day Search & Stepper Navigation Bar */}
          <div className="bg-white rounded-md border border-[#e7e7e7] p-3 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  placeholder="Search services or locations in quote (e.g. Felucca, Guide, Mena House, Transfer)..."
                  className="w-full pl-9 pr-8 py-1.5 bg-[#f8f9fa] border border-[#e7e7e7] rounded-md text-xs font-semibold text-[#1a1a1a] placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition"
                />
                {serviceSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setServiceSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Day Stepper & Navigation */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">Day:</span>
                <div className="flex items-center gap-1 bg-[#f8f9fa] p-0.5 rounded border border-[#e7e7e7]">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = Math.max(0, (selectedTimelineDayIndex ?? 0) - 1);
                      handleSelectTimelineDay(prevIdx);
                    }}
                    title="Previous Day"
                    className="p-1 rounded bg-white hover:bg-[#e1eeff] hover:text-[#006ce4] text-[#1a1a1a] border border-[#e7e7e7] shadow-2xs transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-[#003580] px-2 tabular-nums">
                    {(selectedTimelineDayIndex ?? 0) + 1} / {days.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = Math.min(days.length - 1, (selectedTimelineDayIndex ?? 0) + 1);
                      handleSelectTimelineDay(nextIdx);
                    }}
                    title="Next Day"
                    className="p-1 rounded bg-white hover:bg-[#e1eeff] hover:text-[#006ce4] text-[#1a1a1a] border border-[#e7e7e7] shadow-2xs transition cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Search Match Count & Quick Day Filter Pills */}
            {matchingServiceResults && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f0f0f0] text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="font-bold text-[#003580]">{matchingServiceResults.matchCount}</span> service{matchingServiceResults.matchCount !== 1 ? 's' : ''} matched across{' '}
                  <span className="font-bold text-[#003580]">{matchingServiceResults.matchingDayIndices.size}</span> day{matchingServiceResults.matchingDayIndices.size !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {Array.from(matchingServiceResults.matchingDayIndices).map(dIdx => (
                    <button
                      key={dIdx}
                      type="button"
                      onClick={() => handleSelectTimelineDay(dIdx)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0f6ff] hover:bg-[#003580] text-[#006ce4] hover:text-white border border-[#006ce4]/30 transition cursor-pointer"
                    >
                      Day {dIdx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {days.map((day, dayIdx) => (
            <div 
              key={day.dayNumber} 
              id={`quote-day-${dayIdx}`}
              className={`bg-white rounded-md border shadow-xs hover:border-[#006ce4]/40 p-4 sm:p-5 space-y-3.5 transition-all duration-150 ${
                matchingServiceResults?.matchingDayIndices.has(dayIdx)
                  ? 'border-[#ffb700]/70 ring-1 ring-[#ffb700]/30'
                  : 'border-[#e7e7e7]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#e7e7e7]">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-[#003580] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                    {day.dayNumber}
                  </span>
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) => {
                      const updated = [...days];
                      updated[dayIdx].title = e.target.value;
                      setDays(updated);
                    }}
                    className="font-bold text-xs sm:text-sm text-[#1a1a1a] border-b border-transparent hover:border-[#e7e7e7] focus:border-[#006ce4] outline-hidden px-1 w-full transition"
                  />
                  {matchingServiceResults?.matchingDayIndices.has(dayIdx) && (
                    <span className="text-[10px] font-bold text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded border border-[#fde68a] shrink-0">
                      Match
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
                  {/* Day Navigation Back / Next Arrows */}
                  <div className="flex items-center gap-0.5 bg-[#f8f9fa] p-0.5 rounded-lg border border-[#e7e7e7] h-8">
                    <button
                      type="button"
                      disabled={dayIdx === 0}
                      onClick={() => handleSelectTimelineDay(dayIdx - 1)}
                      title={dayIdx > 0 ? `Go to Day ${dayIdx}` : 'First day'}
                      className="w-7 h-7 rounded-md bg-white hover:bg-[#e1eeff] hover:text-[#006ce4] disabled:opacity-30 disabled:pointer-events-none text-[#1a1a1a] border border-[#e7e7e7] transition cursor-pointer inline-flex items-center justify-center"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={dayIdx === days.length - 1}
                      onClick={() => handleSelectTimelineDay(dayIdx + 1)}
                      title={dayIdx < days.length - 1 ? `Go to Day ${dayIdx + 2}` : 'Last day'}
                      className="w-7 h-7 rounded-md bg-white hover:bg-[#e1eeff] hover:text-[#006ce4] disabled:opacity-30 disabled:pointer-events-none text-[#1a1a1a] border border-[#e7e7e7] transition cursor-pointer inline-flex items-center justify-center"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartQuickAdd(dayIdx)}
                      className={`btn-tactile h-8 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                        quickAddDayIndex === dayIdx
                          ? 'bg-[#003580] text-white shadow-2xs'
                          : 'bg-[#f0f6ff] hover:bg-[#e1eeff] text-[#006ce4] border border-[#006ce4]/30'
                      }`}
                      title="Rapid inline line-item entry (Tab to move, Enter to commit & spawn next line)"
                    >
                      <Zap className="w-3 h-3 text-[#ffb700] shrink-0" />
                      <span>+ Quick Row</span>
                    </button>

                    <button
                      onClick={() => {
                        setServicePickerDayIndex(dayIdx);
                        setRateSearch('');
                      }}
                      className="btn-tactile h-8 px-2.5 bg-white hover:bg-[#f8f9fa] text-[#595959] hover:text-[#1a1a1a] border border-[#e7e7e7] rounded-lg text-[11px] font-medium inline-flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                      title="Browse contracted DMC rates catalog"
                    >
                      <Search className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Browse Rates</span>
                    </button>

                    <button
                      onClick={() => handleRemoveDay(dayIdx)}
                      className="w-8 h-8 inline-flex items-center justify-center text-[#595959] hover:text-[#c00000] hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                      title="Remove Day"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day Description */}
              <textarea
                rows={2}
                value={day.description}
                onChange={(e) => {
                  const updated = [...days];
                  updated[dayIdx].description = e.target.value;
                  setDays(updated);
                }}
                className="w-full text-xs text-[#595959] bg-[#f8f9fa] border border-[#e7e7e7] rounded-md p-2.5 font-sans focus:bg-white focus:outline-hidden focus:border-[#006ce4] focus:ring-2 focus:ring-[#006ce4]/15 transition"
              />

              {/* Line items inside this day */}
              <div className="space-y-2">
                {day.lines.map(line => {
                  const isLineMatch = serviceSearchQuery.trim() !== '' && (
                    line.serviceName?.toLowerCase().includes(serviceSearchQuery.trim().toLowerCase()) ||
                    line.supplierType?.toLowerCase().includes(serviceSearchQuery.trim().toLowerCase()) ||
                    line.supplierName?.toLowerCase().includes(serviceSearchQuery.trim().toLowerCase()) ||
                    line.city?.toLowerCase().includes(serviceSearchQuery.trim().toLowerCase())
                  );

                  return (
                  <div 
                    key={line.id} 
                    className={`p-3 rounded-md transition-all duration-150 flex items-center justify-between gap-3 text-xs ${
                      isLineMatch 
                        ? 'bg-[#fffbe8] border border-[#ffb700] ring-1 ring-[#ffb700]/50 shadow-2xs' 
                        : 'bg-[#f8f9fa] border border-[#e7e7e7] hover:bg-white hover:border-[#006ce4]/40 hover:shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1a1a1a] truncate">{line.serviceName}</span>
                        <span className="text-[10px] text-[#003580] bg-[#f0f6ff] px-1.5 py-0.2 rounded font-semibold uppercase">
                          {line.supplierType}
                        </span>
                        {line.status === 'Rate missing' && (
                          <span className="text-[10px] text-[#c00000] font-bold bg-[#fef2f2] px-1.5 py-0.2 rounded border border-[#c00000]/20">
                            Rate Missing
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#595959] mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Basis: {line.occupancyBasis}</span>
                        <span>·</span>
                        <span className="italic">{line.costCalculationNotes}</span>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <div className="font-semibold text-slate-900 tabular-nums">
                        ${line.totalPriceQuoteCurrency.toLocaleString()} {targetCurrency}
                      </div>
                      {!hideNetCost && (
                        <div className="text-[10px] text-slate-400 tabular-nums">
                          Net: {line.unitCost} {line.costCurrency} (+{line.markupPercent}%)
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveLine(dayIdx, line.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  );
                })}

                {/* Keyboard-Driven Inline Quick Add Row */}
                {quickAddDayIndex === dayIdx && (
                  <div className="p-3.5 bg-[#f0f6ff]/70 border-2 border-[#006ce4]/50 rounded-lg shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-semibold text-[#003580]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Keyboard className="w-3.5 h-3.5 text-[#006ce4]" />
                        <span>Quick Inline Line Item</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          (Press <kbd className="bg-white px-1 py-0.5 rounded border border-slate-300 font-mono text-[9px] shadow-2xs">Enter</kbd> to save &amp; open next, <kbd className="bg-white px-1 py-0.5 rounded border border-slate-300 font-mono text-[9px] shadow-2xs">Esc</kbd> to exit)
                        </span>
                      </div>
                      {quickAddPreviewPrice && (
                        <div className="text-xs font-bold text-[#003580] bg-white px-2 py-0.5 rounded border border-[#006ce4]/30 shadow-2xs w-fit">
                          Live Quote Price: ${quickAddPreviewPrice.totalPriceQuoteCurrency.toLocaleString()} {targetCurrency}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                      {/* Service Name */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">Service Name *</label>
                        <input
                          ref={quickAddInputRef}
                          type="text"
                          value={quickAddDraft.serviceName}
                          onChange={(e) => setQuickAddDraft({ ...quickAddDraft, serviceName: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCommitQuickAdd(dayIdx, true);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setQuickAddDayIndex(null);
                            }
                          }}
                          placeholder="e.g. Private Felucca with Sunset Tea"
                          className="w-full text-xs font-semibold text-[#1a1a1a] bg-white border border-[#006ce4] rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#006ce4]/20"
                        />
                      </div>

                      {/* City */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">City</label>
                        <select
                          value={quickAddDraft.city}
                          onChange={(e) => setQuickAddDraft({ ...quickAddDraft, city: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCommitQuickAdd(dayIdx, true);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setQuickAddDayIndex(null);
                            }
                          }}
                          className="w-full text-xs text-slate-700 bg-white border border-[#e7e7e7] rounded-md px-2 py-1.5 focus:outline-hidden focus:border-[#006ce4]"
                        >
                          {['Cairo', 'Giza', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh', 'Alexandria', 'Marsa Alam', 'Siwa Oasis', 'Dahab', 'El Gouna'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Supplier Type */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">Type</label>
                        <select
                          value={quickAddDraft.supplierType}
                          onChange={(e) => setQuickAddDraft({ ...quickAddDraft, supplierType: e.target.value as SupplierType })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCommitQuickAdd(dayIdx, true);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setQuickAddDayIndex(null);
                            }
                          }}
                          className="w-full text-xs text-slate-700 bg-white border border-[#e7e7e7] rounded-md px-2 py-1.5 focus:outline-hidden focus:border-[#006ce4]"
                        >
                          <option value="Guide">Tour &amp; Guide</option>
                          <option value="Transport">Private Transport</option>
                          <option value="Attraction">Attraction &amp; Monument</option>
                          <option value="Hotel">Hotel</option>
                          <option value="Nile Cruise">Nile Cruise</option>
                          <option value="Restaurant">Restaurant &amp; Dining</option>
                          <option value="Domestic Flight">Domestic Flight</option>
                          <option value="Visa/Services">Visa &amp; Meet-Assist</option>
                          <option value="Other">Other Custom</option>
                        </select>
                      </div>

                      {/* Occupancy Basis */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">Basis</label>
                        <select
                          value={quickAddDraft.occupancyBasis}
                          onChange={(e) => setQuickAddDraft({ ...quickAddDraft, occupancyBasis: e.target.value as OccupancyBasis })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCommitQuickAdd(dayIdx, true);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setQuickAddDayIndex(null);
                            }
                          }}
                          className="w-full text-xs text-slate-700 bg-white border border-[#e7e7e7] rounded-md px-2 py-1.5 focus:outline-hidden focus:border-[#006ce4]"
                        >
                          <option value="per_person">Per Person</option>
                          <option value="per_vehicle">Per Vehicle</option>
                          <option value="per_group">Per Group</option>
                          <option value="single">Single Room</option>
                          <option value="double">Double Room</option>
                          <option value="triple">Triple Room</option>
                        </select>
                      </div>

                      {/* Net Cost + Currency */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">Net Cost</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={quickAddDraft.unitCost || ''}
                            onChange={(e) => setQuickAddDraft({ ...quickAddDraft, unitCost: parseFloat(e.target.value) || 0 })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCommitQuickAdd(dayIdx, true);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setQuickAddDayIndex(null);
                              }
                            }}
                            className="w-full text-xs font-semibold tabular-nums text-slate-800 bg-white border border-[#e7e7e7] rounded-md px-2 py-1.5 focus:outline-hidden focus:border-[#006ce4]"
                          />
                          <select
                            value={quickAddDraft.costCurrency}
                            onChange={(e) => setQuickAddDraft({ ...quickAddDraft, costCurrency: e.target.value as Currency })}
                            className="text-[11px] font-bold text-slate-700 bg-white border border-[#e7e7e7] rounded-md px-1.5 py-1.5 focus:outline-hidden"
                          >
                            <option value="USD">USD</option>
                            <option value="EGP">EGP</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Markup % + Commit Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#006ce4]/15">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-600 font-medium">Markup:</span>
                          <input
                            type="number"
                            min="0"
                            max="300"
                            value={quickAddDraft.markupPercent}
                            onChange={(e) => setQuickAddDraft({ ...quickAddDraft, markupPercent: parseFloat(e.target.value) || 0 })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCommitQuickAdd(dayIdx, true);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setQuickAddDayIndex(null);
                              }
                            }}
                            className="w-14 text-xs font-bold text-slate-800 bg-white border border-[#e7e7e7] rounded px-1.5 py-1 text-center tabular-nums"
                          />
                          <span className="text-xs text-slate-500 font-bold">%</span>
                        </div>
                        {quickAddPreviewPrice && (
                          <span className="text-[11px] text-slate-500 italic hidden md:inline">
                            {quickAddPreviewPrice.breakdown}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuickAddDayIndex(null)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-medium rounded hover:bg-white/80 transition cursor-pointer"
                        >
                          Cancel (Esc)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCommitQuickAdd(dayIdx, false)}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-[#003580] border border-[#003580]/30 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5 text-[#008009]" />
                          <span>Commit Line</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCommitQuickAdd(dayIdx, true)}
                          className="px-3.5 py-1 bg-[#006ce4] hover:bg-[#0057b8] text-white rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" />
                          <span>Add &amp; Next (Enter)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {day.lines.length === 0 && quickAddDayIndex !== dayIdx && (
                  <div className="p-3 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
                    No services attached for this day. Click "+ Quick Row" for fast inline entry, or "Browse Rates" to select from contracted rates.
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={handleAddDay}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('quotes.add_day')}</span>
          </button>

          {/* ---------------------------------------------------- */}
          {/* CURATED PROPOSAL VIP UPSELLS & REVENUE ADD-ONS */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white rounded-md border border-[#e7e7e7] shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e7e7e7]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#003580] text-[#ffb700] flex items-center justify-center font-bold text-xs shadow-2xs">
                  <Sparkles className="w-4 h-4 fill-[#ffb700]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
                    <span>Proposal VIP Add-ons &amp; Curated Upsells</span>
                    <span className="text-[10px] font-bold text-[#008009] bg-[#e8f5e9] px-2 py-0.5 rounded border border-emerald-200">
                      {activeUpsells.length} Active on Proposal
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#595959]">
                    Client-toggleable luxury upgrades that appear on the proposal link with real-time recalculation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoSuggestUpsells}
                  className="btn-tactile px-2.5 py-1 bg-[#f8f9fa] hover:bg-[#e7e7e7] text-[#1a1a1a] border border-[#e7e7e7] rounded-md text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Auto-match upsells based on the cities and destinations in this itinerary"
                >
                  <RefreshCw className="w-3 h-3 text-[#006ce4]" />
                  <span>Auto-Match Itinerary</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddCustomUpsell}
                  className="btn-tactile px-2.5 py-1 bg-[#006ce4] hover:bg-[#0057b8] text-white rounded-md text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Custom</span>
                </button>
              </div>
            </div>

            {/* Upsell Items List */}
            <div className="space-y-3">
              {upsells.map(upsell => {
                const isEnabled = upsell.isSelected !== false;
                const totalSell = upsell.priceBasis === 'per_person' ? upsell.price * Math.max(1, group.adults) : upsell.price;
                const totalNet = (upsell.netCost || 0) * (upsell.priceBasis === 'per_person' ? Math.max(1, group.adults) : 1);
                const marginPct = totalSell > 0 ? Math.round(((totalSell - totalNet) / totalSell) * 100) : 0;

                return (
                  <div
                    key={upsell.id}
                    className={`p-3.5 rounded-md border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isEnabled
                        ? 'bg-white border-[#e7e7e7] hover:border-[#006ce4]/40 shadow-2xs'
                        : 'bg-[#f8f9fa] border-dashed border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggleUpsellEnabled(upsell.id)}
                        className="mt-1 w-4 h-4 text-[#006ce4] rounded border-slate-300 focus:ring-[#006ce4] cursor-pointer"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#003580] bg-[#f0f6ff] px-2 py-0.5 rounded border border-[#006ce4]/20">
                            {upsell.city}
                          </span>
                          <span className="text-xs font-bold text-[#1a1a1a] truncate">
                            {upsell.title}
                          </span>
                          {upsell.badge && (
                            <span className="text-[9px] font-bold text-[#00224f] bg-[#ffb700] px-1.5 py-0.2 rounded border border-[#e6a600]">
                              {upsell.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#595959] line-clamp-1">
                          {upsell.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {/* Net Cost (if permitted) */}
                      {!hideNetCost && (
                        <div className="text-end">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Net Cost</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono text-slate-500">$</span>
                            <input
                              type="number"
                              min={0}
                              value={upsell.netCost || 0}
                              onChange={(e) => handleUpdateUpsellNetCost(upsell.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-xs text-end font-mono bg-slate-50 focus:bg-white focus:border-[#006ce4] outline-hidden"
                            />
                          </div>
                        </div>
                      )}

                      {/* Sell Price */}
                      <div className="text-end">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Sell Price ({upsell.priceBasis === 'per_person' ? '/pax' : 'flat'})
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[#44200F]">$</span>
                          <input
                            type="number"
                            min={0}
                            value={upsell.price}
                            onChange={(e) => handleUpdateUpsellPrice(upsell.id, parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-0.5 border border-[#e7e7e7] rounded text-xs font-bold text-end font-mono text-[#1a1a1a] focus:border-[#C4A177] outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Profit Margin Pill */}
                      {!hideNetCost && (
                        <div className="text-center min-w-[48px]">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Margin</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums block ${
                            marginPct >= (workspace.minMarginPercent || 20)
                              ? 'bg-[#e8f5e9] text-[#008009]'
                              : 'bg-[#fffbe8] text-[#d97706]'
                          }`}>
                            {marginPct}%
                          </span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveUpsell(upsell.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Remove upsell"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sticky Summary - Authentic DMC Margin Ledger */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-white rounded-md border border-[#e7e7e7] shadow-xs p-5 space-y-4 hover:border-[#C4A177]/50 transition-all duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#e7e7e7]">
              <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">{t('quotes.sticky_summary')}</h3>
              <span className="text-[10px] font-bold text-[#44200F] bg-[#FAF7F2] px-2 py-0.5 rounded">Live Ledger</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {!hideNetCost && (
                <div className="flex justify-between text-[#595959]">
                  <span>Total Net Supplier Cost</span>
                  <span className="font-semibold text-[#1a1a1a] tabular-nums">{totals.totalCostEgp.toLocaleString()} EGP</span>
                </div>
              )}

              <div className="flex justify-between text-[#595959]">
                <span>Gross Profit Margin</span>
                <span className={`font-bold tabular-nums px-1.5 py-0.2 rounded ${isBelowMinMargin ? 'text-[#c00000] bg-[#fef2f2]' : 'text-[#008009] bg-[#e8f5e9]'}`}>
                  {totals.marginPercent}%
                </span>
              </div>

              {b2bCommission > 0 && (
                <div className="flex justify-between text-[#595959]">
                  <span>B2B Partner Commission ({b2bCommission}%)</span>
                  <span className="font-semibold text-[#1a1a1a] tabular-nums">
                    {currSymbol}{totals.b2bCommissionAmount.toLocaleString()} {targetCurrency}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-[#e7e7e7] flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-[#1a1a1a]">Total Client Sell Price</span>
                  <span className="block text-[11px] text-[#595959] font-mono mt-0.5">
                    {currSymbol}{(totals.totalPriceQuoteCurrency / Math.max(1, group.adults)).toFixed(2)} / adult
                  </span>
                  {targetCurrency !== 'EGP' && (
                    <span className="block text-[10px] text-slate-400 font-mono">
                      ≈ EGP {Math.round(totals.totalPriceEgp).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-[#1a1a1a] tabular-nums tracking-tight">
                  {currSymbol}{totals.totalPriceQuoteCurrency.toLocaleString()} <span className="text-xs font-bold text-[#44200F]">{targetCurrency}</span>
                </div>
              </div>

              {/* Proposal Upsell Potential Strip */}
              {activeUpsells.length > 0 && (
                <div className="p-2.5 rounded-md bg-[#FAF7F2] border border-[#EDE0CC] text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#44200F]">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#795037]" />
                      <span>{activeUpsells.length} VIP Add-ons Configured</span>
                    </span>
                    <span className="text-[#008009]">
                      +${potentialUpsellsTotalUsd.toLocaleString()} USD
                    </span>
                  </div>
                  <p className="text-[10px] text-[#595959] leading-tight">
                    Travelers can toggle these luxury add-ons on their proposal link to dynamically increase your booking revenue.
                  </p>
                </div>
              )}
            </div>

            {/* Guardrail warnings */}
            {isBelowMinMargin && (
              <div className="p-3 rounded-md bg-[#fffbe8] border border-[#ffb700]/60 text-[#d97706] text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#d97706]">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Below Minimum Margin ({workspace.minMarginPercent}%)</span>
                </div>
                <p className="text-[11px] text-[#d97706]/90">
                  {canApprove ? 'You can approve this as Owner/Admin.' : 'Requires Admin/Owner sign-off before dispatching to client.'}
                </p>
              </div>
            )}

            {totals.hasBlockingRate && (
              <div className="p-3 rounded-md bg-[#fef2f2] border border-[#c00000]/30 text-[#c00000] text-xs">
                <div className="font-bold flex items-center gap-1.5 text-[#c00000]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#c00000]" />
                  <span>{totals.hasMissingRate ? 'Rate Missing on Line Items' : 'Expired Rate on Line Items'}</span>
                </div>
                <p className="text-[11px] text-[#c00000]/90 mt-0.5">
                  Add or renew the rate in the Rate Library for the travel dates before sending the proposal.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                disabled={!canSend}
                onClick={handleCreateOrUpdateQuote}
                className="btn-tactile w-full py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-md text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Branded Proposal Link</span>
              </button>

              <button
                onClick={handleExportDirectExcel}
                className="btn-tactile w-full py-2 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#008009] border border-[#a5d6a7] rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Download formatted Excel spreadsheet of this itinerary with line item costs and profit formulas"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#008009]" />
                <span>Download Cost Sheet (Excel)</span>
              </button>

              <button
                onClick={handleExportDirectPdf}
                className="btn-tactile w-full py-2 bg-[#FAF7F2] hover:bg-[#EDE0CC]/50 text-[#44200F] border border-[#C4A177]/60 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Download or print the luxury branded PDF client proposal"
              >
                <FileText className="w-3.5 h-3.5 text-[#795037]" />
                <span>Download Proposal (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Quick Summary Bar (Visible on phones above bottom dock) */}
      <div className="lg:hidden fixed bottom-16 inset-x-3 z-25 bg-[#44200F]/95 backdrop-blur-md text-white p-3 rounded-md shadow-xl flex items-center justify-between border border-[#321609]">
        <div className="min-w-0">
          <div className="text-[10px] text-[#EDE0CC] uppercase tracking-wider font-bold">Total Sell Price</div>
          <div className="text-base font-bold text-white tabular-nums flex items-baseline gap-1.5">
            <span>{currSymbol}{totals.totalPriceQuoteCurrency.toLocaleString()}</span>
            <span className="text-[10px] text-[#EDE0CC] font-normal">{targetCurrency}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isBelowMinMargin ? 'bg-rose-900/60 text-rose-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
              {totals.marginPercent}% margin
            </span>
          </div>
        </div>

        <button
          disabled={!canSend}
          onClick={handleCreateOrUpdateQuote}
          className="px-3.5 py-2 bg-[#C4A177] hover:bg-[#b08b3b] text-[#44200F] rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 shrink-0 min-h-[40px]"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Review</span>
        </button>
      </div>

      {/* Modal: Service Picker from Rate Library */}
      <AnimatePresence>
        {servicePickerDayIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl p-5 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Attach Service from Rate Library</h3>
                <button
                  onClick={() => setServicePickerDayIndex(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search services (e.g. Mena House, Cairo Guide, Pyramids ticket)..."
                  value={rateSearch}
                  onChange={(e) => setRateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {rates
                  .filter(r => 
                    !rateSearch ||
                    r.serviceName.toLowerCase().includes(rateSearch.toLowerCase()) || 
                    r.supplierName.toLowerCase().includes(rateSearch.toLowerCase()) ||
                    r.city.toLowerCase().includes(rateSearch.toLowerCase())
                  )
                  .sort((a, b) => {
                    const currentCity = (servicePickerDayIndex !== null ? days[servicePickerDayIndex]?.city : '')?.toLowerCase();
                    const aCity = a.city?.toLowerCase() === currentCity ? 1 : 0;
                    const bCity = b.city?.toLowerCase() === currentCity ? 1 : 0;
                    return bCity - aCity;
                  })
                  .map(rate => {
                    const currentCity = (servicePickerDayIndex !== null ? days[servicePickerDayIndex]?.city : '')?.toLowerCase();
                    const isCityMatch = Boolean(currentCity && rate.city?.toLowerCase() === currentCity);
                    return (
                      <div key={rate.id} className="py-2.5 px-2 hover:bg-slate-50 rounded-lg flex items-center justify-between gap-3 text-xs transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{rate.serviceName}</span>
                            {isCityMatch && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Match: {rate.city}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-mono">
                              {rate.nationalityTier}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{rate.supplierName} · {rate.city} · Basis: {rate.occupancyBasis}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900 tabular-nums">{rate.netCost} {rate.currency}</span>
                          <button
                            onClick={() => handleAddServiceToDay(rate)}
                            className="px-3 py-1 bg-[#0f2035] hover:bg-[#1b365d] text-white rounded-lg font-medium text-xs transition cursor-pointer"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WhatsAppParserModal
        isOpen={whatsappParserOpen}
        onClose={() => setWhatsappParserOpen(false)}
        workspace={workspace}
        onProceedToQuote={handleApplyParsedInquiry}
      />
    </div>
  );
};
