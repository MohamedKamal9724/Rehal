import React, { useState } from 'react';
import { 
  Database, Plus, Filter, Search, AlertTriangle, 
  Clock, ArrowUpRight, Copy, Download, Upload, 
  Trash2, Edit2, ShieldAlert, Check, Calendar, DollarSign,
  X, ChevronRight, RefreshCw, AlertCircle, Building2,
  Phone, Mail, MapPin, Tag, Layers, Sparkles,
  FileSpreadsheet, SlidersHorizontal, FileText, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Currency, OccupancyBasis, Rate, Season, Supplier, 
  SupplierType, UILanguage, Workspace, User, ExchangeRate 
} from '../types';
import { EGYPT_CITIES, SUPPLIER_TYPES, DEFAULT_EXCHANGE_RATES } from '../lib/constants';
import { UI_TRANSLATIONS } from '../lib/i18n';
import { repository } from '../lib/storage';
import { exportRateLibraryToExcel, downloadBlankRateTemplateExcel } from '../lib/exportUtils';
import { fetchLiveExchangeRates } from '../lib/currencyService';
import { ExcelColumnMapperModal } from './ingestion/ExcelColumnMapperModal';
import { RateIngestionModal } from './ingestion/RateIngestionModal';
import { PdfReviewSplitPane } from './ingestion/PdfReviewSplitPane';
import { BulkRateActionDrawer } from './maintenance/BulkRateActionDrawer';
import { ExecutiveSkeleton } from './common/ExecutiveSkeleton';
import { GuidanceTrigger } from './common/GuidanceTrigger';

interface RateLibraryViewProps {
  workspace: Workspace;
  currentUser: User;
  suppliers: Supplier[];
  rates: Rate[];
  seasons: Season[];
  uiLang: UILanguage;
  onSaveRate: (rate: Rate) => void;
  onDeleteRate: (id: string) => void;
  onSaveSupplier: (supplier: Supplier) => void;
  isLoading?: boolean;
  initialTab?: 'suppliers' | 'rates' | 'seasons' | 'fx';
}

export const RateLibraryView: React.FC<RateLibraryViewProps> = ({
  workspace,
  currentUser,
  suppliers,
  rates,
  seasons,
  uiLang,
  onSaveRate,
  onDeleteRate,
  onSaveSupplier,
  isLoading = false,
  initialTab = 'rates',
}) => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'rates' | 'seasons' | 'fx'>(initialTab);
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [liveSyncMessage, setLiveSyncMessage] = useState<string | null>(null);

  const handleSyncRates = async () => {
    setIsSyncingRates(true);
    try {
      const { rates: liveRates, isLive } = await fetchLiveExchangeRates(true);
      const currentFx = repository.getExchangeRates(workspace.id);
      const updatedFx = currentFx.map(fx => {
        const liveInfo = liveRates[fx.fromCurrency];
        if (liveInfo) {
          const updated = {
            ...fx,
            rate: liveInfo.rateToEgp,
            lastUpdated: new Date().toISOString(),
            isStale: false,
          };
          repository.updateExchangeRate(updated);
          return updated;
        }
        return fx;
      });

      setExchangeRates(updatedFx);
      setFxLastUpdatedDaysAgo(0);
      setLiveSyncMessage(
        isLive
          ? `🟢 Synced with Live Market Rates: 1 USD = ${liveRates.USD.rateToEgp} EGP | 1 EUR = ${liveRates.EUR.rateToEgp} EGP | 1 GBP = ${liveRates.GBP.rateToEgp} EGP`
          : 'Refreshed reference rates with Central Bank of Egypt calibrated benchmark.'
      );
      setTimeout(() => setLiveSyncMessage(null), 6000);
    } catch (err) {
      console.warn('[RateLibraryView] Live sync failed:', err);
    } finally {
      setIsSyncingRates(false);
    }
  };
  
  // Rate Grid Filters
  const [rateSearch, setRateSearch] = useState('');
  const [filterCity, setFilterCity] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterValidity, setFilterValidity] = useState<'all' | 'expiring_soon' | 'active'>('all');

  // Supplier Search & Filter
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<string>('All');

  // Drawers & Modals
  const [supplierDrawerOpen, setSupplierDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [rateDrawerOpen, setRateDrawerOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);

  const [seasonModalOpen, setSeasonModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [importMenuOpen, setImportMenuOpen] = useState(false);

  // FX state
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(() => {
    return repository.getExchangeRates(workspace.id);
  });
  const [fxLastUpdatedDaysAgo, setFxLastUpdatedDaysAgo] = useState(4);
  const [fxSavedNotification, setFxSavedNotification] = useState(false);

  // Supplier Form State
  const [supFormName, setSupFormName] = useState('');
  const [supFormType, setSupFormType] = useState<SupplierType>('Hotel');
  const [supFormCity, setSupFormCity] = useState('Cairo');
  const [supFormContactPerson, setSupFormContactPerson] = useState('');
  const [supFormContactEmail, setSupFormContactEmail] = useState('');
  const [supFormContactPhone, setSupFormContactPhone] = useState('');
  const [supFormNotes, setSupFormNotes] = useState('');
  const [supFormStart, setSupFormStart] = useState('2026-01-01');
  const [supFormEnd, setSupFormEnd] = useState('2026-12-31');

  // Rate Form State
  const [rateFormSupplierId, setRateFormSupplierId] = useState('');
  const [rateFormServiceName, setRateFormServiceName] = useState('');
  const [rateFormCity, setRateFormCity] = useState('Cairo');
  const [rateFormType, setRateFormType] = useState<SupplierType>('Hotel');
  const [rateFormOccupancy, setRateFormOccupancy] = useState<OccupancyBasis>('double');
  const [rateFormCurrency, setRateFormCurrency] = useState<Currency>('USD');
  const [rateFormCost, setRateFormCost] = useState<number>(100);
  const [rateFormSingleSupp, setRateFormSingleSupp] = useState<number>(0);
  const [rateFormStart, setRateFormStart] = useState('2026-01-01');
  const [rateFormEnd, setRateFormEnd] = useState('2026-12-31');
  const [rateFormNotes, setRateFormNotes] = useState('');

  // Season Form State
  const [seasonFormName, setSeasonFormName] = useState('');
  const [seasonFormStart, setSeasonFormStart] = useState('2026-10-01');
  const [seasonFormEnd, setSeasonFormEnd] = useState('2027-04-30');
  const [seasonFormColor, setSeasonFormColor] = useState('#2563EB');

  const t = (key: string) => UI_TRANSLATIONS[uiLang]?.[key] || key;
  const hideNetCost = workspace.hideNetCostsFromAgents && currentUser.role === 'Sales Agent';

  // Helper to check if a date expires within 30 days
  const isExpiringWithin30Days = (dateStr: string) => {
    const end = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return end - now > 0 && end - now <= thirtyDays;
  };

  const isExpired = (dateStr: string) => {
    return new Date(dateStr).getTime() < new Date().getTime();
  };

  // Filtered Rates
  const filteredRates = rates.filter(r => {
    const matchesSearch = r.serviceName.toLowerCase().includes(rateSearch.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(rateSearch.toLowerCase());
    const matchesCity = filterCity === 'All' || r.city.toLowerCase() === filterCity.toLowerCase();
    const matchesType = filterType === 'All' || r.supplierType === filterType;
    
    let matchesValidity = true;
    if (filterValidity === 'expiring_soon') {
      matchesValidity = isExpiringWithin30Days(r.validityEnd);
    } else if (filterValidity === 'active') {
      matchesValidity = !isExpired(r.validityEnd);
    }

    return matchesSearch && matchesCity && matchesType && matchesValidity;
  });

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(supplierSearch.toLowerCase()));
    const matchesType = supplierTypeFilter === 'All' || s.type === supplierTypeFilter;
    return matchesSearch && matchesType;
  });

  // Open Add/Edit Supplier Sheet
  const handleOpenSupplierDrawer = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupFormName(sup.name);
      setSupFormType(sup.type);
      setSupFormCity(sup.city);
      setSupFormContactPerson(sup.contactPerson || '');
      setSupFormContactEmail(sup.contactEmail || '');
      setSupFormContactPhone(sup.contactPhone || '');
      setSupFormNotes(sup.notes || '');
      setSupFormStart(sup.contractValidityStart);
      setSupFormEnd(sup.contractValidityEnd);
    } else {
      setEditingSupplier(null);
      setSupFormName('');
      setSupFormType('Hotel');
      setSupFormCity('Cairo');
      setSupFormContactPerson('');
      setSupFormContactEmail('');
      setSupFormContactPhone('');
      setSupFormNotes('');
      setSupFormStart('2026-01-01');
      setSupFormEnd('2026-12-31');
    }
    setSupplierDrawerOpen(true);
  };

  const handleSaveSupplierForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supFormName.trim()) return;

    const supplier: Supplier = {
      id: editingSupplier?.id || `sup-${Date.now()}`,
      workspaceId: workspace.id,
      name: supFormName.trim(),
      type: supFormType,
      city: supFormCity,
      contactPerson: supFormContactPerson.trim() || undefined,
      contactEmail: supFormContactEmail.trim() || undefined,
      contactPhone: supFormContactPhone.trim() || undefined,
      notes: supFormNotes.trim() || undefined,
      contractValidityStart: supFormStart,
      contractValidityEnd: supFormEnd,
      rating: editingSupplier?.rating || 5,
    };

    onSaveSupplier(supplier);
    setSupplierDrawerOpen(false);
  };

  // Open Add/Edit Rate Sheet
  const handleOpenRateDrawer = (rate?: Rate) => {
    if (rate) {
      setEditingRate(rate);
      setRateFormSupplierId(rate.supplierId);
      setRateFormServiceName(rate.serviceName);
      setRateFormCity(rate.city);
      setRateFormType(rate.supplierType);
      setRateFormOccupancy(rate.occupancyBasis);
      setRateFormCurrency(rate.currency);
      setRateFormCost(rate.netCost);
      setRateFormSingleSupp(rate.singleSupplement || 0);
      setRateFormStart(rate.validityStart);
      setRateFormEnd(rate.validityEnd);
      setRateFormNotes(rate.notes || '');
    } else {
      setEditingRate(null);
      const firstSup = suppliers[0];
      setRateFormSupplierId(firstSup?.id || '');
      setRateFormServiceName('');
      setRateFormCity('Cairo');
      setRateFormType('Hotel');
      setRateFormOccupancy('double');
      setRateFormCurrency('USD');
      setRateFormCost(120);
      setRateFormSingleSupp(0);
      setRateFormStart('2026-01-01');
      setRateFormEnd('2026-12-31');
      setRateFormNotes('');
    }
    setRateDrawerOpen(true);
  };

  const handleSaveRateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateFormServiceName.trim()) return;

    const targetSup = suppliers.find(s => s.id === rateFormSupplierId) || suppliers[0];

    const rate: Rate = {
      id: editingRate?.id || `rate-${Date.now()}`,
      workspaceId: workspace.id,
      supplierId: targetSup.id,
      supplierName: targetSup.name,
      serviceName: rateFormServiceName.trim(),
      supplierType: rateFormType,
      city: rateFormCity,
      seasonIds: ['season-high-winter'],
      occupancyBasis: rateFormOccupancy,
      currency: rateFormCurrency,
      netCost: Number(rateFormCost) || 0,
      singleSupplement: Number(rateFormSingleSupp) || 0,
      validityStart: rateFormStart,
      validityEnd: rateFormEnd,
      nationalityTier: 'foreign',
      notes: rateFormNotes.trim(),
      version: editingRate ? (editingRate.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
    };

    onSaveRate(rate);
    setRateDrawerOpen(false);
  };

  // FX Safety Buffer Update
  const handleUpdateFxBuffer = (id: string, newBuffer: number) => {
    const updated = exchangeRates.map(fx => {
      if (fx.id === id) {
        return { ...fx, safetyBufferPercent: newBuffer, lastUpdated: new Date().toISOString() };
      }
      return fx;
    });
    setExchangeRates(updated);
    const targetFx = updated.find(fx => fx.id === id);
    if (targetFx) {
      repository.updateExchangeRate(targetFx);
    }
    setFxLastUpdatedDaysAgo(0);
    setFxSavedNotification(true);
    setTimeout(() => setFxSavedNotification(false), 2000);
  };

  const handleUpdateFxRate = (id: string, newRate: number) => {
    const updated = exchangeRates.map(fx => {
      if (fx.id === id) {
        return { ...fx, rate: newRate, lastUpdated: new Date().toISOString() };
      }
      return fx;
    });
    setExchangeRates(updated);
    const targetFx = updated.find(fx => fx.id === id);
    if (targetFx) {
      repository.updateExchangeRate(targetFx);
    }
    setFxLastUpdatedDaysAgo(0);
    setFxSavedNotification(true);
    setTimeout(() => setFxSavedNotification(false), 2000);
  };

  if (isLoading || isSyncingRates) {
    return <ExecutiveSkeleton variant="rate-library" />;
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Live Sync Banner */}
      {liveSyncMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between gap-2 shadow-2xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{liveSyncMessage}</span>
          </div>
          <button
            onClick={() => setLiveSyncMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Rate Library Header & Section Overview - Booking Design System */}
      <div className="relative bg-white border border-[#e7e7e7] rounded-md p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <GuidanceTrigger
          sectionKey="rates"
          uiLang={uiLang}
          pinned={true}
          size="sm"
          label={uiLang === 'ar' ? 'دليل الأسعار' : 'Rates Guide'}
        />
        <div className="ltr:pr-14 rtl:pl-14">
          <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">
            {uiLang === 'ar' ? 'مكتبة الأسعار وعقود الموردين' : 'Rate Library & Contracting'}
          </h1>
          <p className="text-xs text-[#595959] mt-0.5">
            {uiLang === 'ar' 
              ? 'احفظ الأسعار والعقود التي تعيد استخدامها عند بناء عروض الأسعار.' 
              : 'Save prices you reuse when building quotes.'}
          </p>
        </div>


        {/* Action Controls - Standardized equal height h-9 */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'rates' && (
            <>
              {/* Primary Add Rate */}
              <button
                type="button"
                onClick={() => handleOpenRateDrawer()}
                className="h-9 px-3.5 bg-gradient-to-r from-[#44200F] via-[#5c2410] to-[#44200F] hover:to-[#ea580c] text-white border border-orange-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-orange-300" />
                <span>Add Rate</span>
              </button>

              {/* Import Tariff Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setImportMenuOpen(!importMenuOpen)}
                  className="h-9 px-3.5 bg-white hover:bg-orange-50/50 text-[#44200F] border border-[#EDE0CC] hover:border-orange-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-orange-600" />
                  <span>Import Tariffs</span>
                  <ChevronDown className="w-3 h-3 text-[#795037]" />
                </button>

                {importMenuOpen && (
                  <div className="absolute start-0 mt-1 w-56 max-w-[calc(100vw-2rem)] bg-white border border-[#e7e7e7] rounded-lg shadow-xl py-1 z-40 text-xs text-slate-800">
                    <button
                      type="button"
                      onClick={() => { setImportMenuOpen(false); setExcelModalOpen(true); }}
                      className="w-full text-start px-3 py-2 hover:bg-[#f5f5f5] flex items-center gap-2 text-slate-700 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#006ce4]" />
                      <div>
                        <div className="font-semibold text-slate-900">Upload Excel Tariff (.xlsx)</div>
                        <div className="text-[10px] text-slate-500">Auto-map hotel & cruise rates</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImportMenuOpen(false); setPdfModalOpen(true); }}
                      className="w-full text-start px-3 py-2 hover:bg-[#f5f5f5] flex items-center gap-2 text-slate-700 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <div>
                        <div className="font-semibold text-slate-900">Parse PDF Rate Sheet</div>
                        <div className="text-[10px] text-slate-500">Vision contract extraction</div>
                      </div>
                    </button>
                    <div className="border-t border-[#e7e7e7] my-1" />
                    <button
                      type="button"
                      onClick={() => { setImportMenuOpen(false); downloadBlankRateTemplateExcel(); }}
                      className="w-full text-start px-3 py-2 hover:bg-[#fffbe8] flex items-center gap-2 text-[#d97706] transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#d97706]" />
                      <div>
                        <div className="font-semibold text-slate-900">Download Blank Template</div>
                        <div className="text-[10px] text-slate-500">Excel contracting schema</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Export Excel */}
              <button
                type="button"
                onClick={() => exportRateLibraryToExcel(rates, suppliers, workspace)}
                className="h-9 px-3.5 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#008009] border border-[#a5d6a7] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                title="Export entire rate library to formatted Excel spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#008009] shrink-0" />
                <span>Export Excel</span>
              </button>

              {/* Bulk Adjust */}
              <button
                type="button"
                onClick={() => setBulkDrawerOpen(true)}
                className="h-9 px-3.5 bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] border border-[#e7e7e7] rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#595959] shrink-0" />
                <span>Bulk Adjust</span>
              </button>
            </>
          )}

          {/* Sync FX */}
          <button
            type="button"
            onClick={handleSyncRates}
            className="h-9 px-3.5 bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] border border-[#e7e7e7] rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs hover:border-[#006ce4] cursor-pointer whitespace-nowrap shrink-0"
            title="Refresh contracted rates tariff from live exchange feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#006ce4] shrink-0 ${isSyncingRates ? 'animate-spin' : ''}`} />
            <span>Sync FX</span>
          </button>

          {activeTab === 'suppliers' && (
            <button
              onClick={() => handleOpenSupplierDrawer()}
              className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Supplier</span>
            </button>
          )}

          {activeTab === 'seasons' && (
            <button
              onClick={() => setSeasonModalOpen(true)}
              className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Season</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation with Animated Sliding Indicator (Horizontally swipeable on mobile) */}
      {/* Booking Tabs System */}
      <div className="bg-white border border-[#e7e7e7] rounded-xl p-1.5 shadow-xs">
        <div className="luxury-tab-bar flex items-center gap-1.5 relative overflow-x-auto no-scrollbar scroll-smooth flex-nowrap py-0.5">
          {[
            { id: 'rates', label: `Rates (${rates.length})` },
            { id: 'suppliers', label: `Suppliers (${suppliers.length})` },
            { id: 'seasons', label: `Seasons (${seasons.length})` },
            { id: 'fx', label: 'Exchange Rates (FX)', alert: fxLastUpdatedDaysAgo >= 3 },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  relative h-10 px-4 text-xs font-bold rounded-lg transition-colors z-10 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer
                  ${isActive ? 'text-[#006ce4] bg-[#f0f6ff] border border-[#006ce4]/30 shadow-2xs' : 'text-[#595959] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]'}
                `}
              >
                <span>{tab.label}</span>
                {tab.alert && (
                  <span className="text-[10px] text-[#d97706] bg-[#fffbe8] px-1.5 py-0.2 rounded font-bold border border-[#ffb700]/50 shrink-0">
                    Review
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >

      {/* TAB 1: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          {/* Supplier Filters */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers by name or contact..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full text-xs outline-hidden text-slate-900 bg-transparent placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Type:</span>
              <select
                value={supplierTypeFilter}
                onChange={(e) => setSupplierTypeFilter(e.target.value)}
                className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/80 text-slate-700 font-medium text-xs focus:outline-hidden focus:border-slate-400 cursor-pointer"
              >
                <option value="All">All Supplier Types</option>
                {SUPPLIER_TYPES.map(st => <option key={st.type} value={st.type}>{st.type}</option>)}
              </select>
            </div>
          </div>

          {/* Supplier Data Table */}
          {filteredSuppliers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5 text-start">Supplier Name</th>
                    <th className="py-2.5 px-3.5 text-start">Type</th>
                    <th className="py-2.5 px-3.5 text-start">City / Region</th>
                    <th className="py-2.5 px-3.5 text-start">Contact Information</th>
                    <th className="py-2.5 px-3.5 text-start">Contract Validity</th>
                    <th className="py-2.5 px-3.5 text-start">Status</th>
                    <th className="py-2.5 px-3.5 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSuppliers.map(sup => (
                    <tr key={sup.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{sup.name}</span>
                        </div>
                        {sup.notes && (
                          <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs ps-5.5">
                            {sup.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="text-slate-600 font-medium">
                          {sup.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                        {sup.city}
                      </td>
                      <td className="py-2.5 px-3.5 text-[11px]">
                        <div className="text-slate-900 font-medium">{sup.contactPerson || 'Direct DMC Desk'}</div>
                        <div className="text-slate-400">{sup.contactEmail || sup.contactPhone}</div>
                      </td>
                      <td className="py-2.5 px-3.5 text-[11px] tabular-nums text-slate-500">
                        {sup.contractValidityStart} to {sup.contractValidityEnd}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Active
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-end">
                        <button
                          onClick={() => handleOpenSupplierDrawer(sup)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-2xs">
                <Building2 className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">No Suppliers Configured</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Add your hotel partners, Nile cruise operators, transport fleets, and licensed guides to manage seasonal DMC contract rates.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => handleOpenSupplierDrawer()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Your First Supplier</span>
                </button>
                <button
                  onClick={() => setExcelModalOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-medium flex items-center gap-2 shadow-2xs transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  <span>Import CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RATES (THE CORE ENGINE) */}
      {activeTab === 'rates' && (
        <div className="bg-white border border-[#e7e7e7] rounded-md shadow-xs overflow-hidden space-y-0">
          {/* Advanced Rate Filters Toolbar - Signature Booking Accent Frame */}
          <div className="p-3 border-b-2 border-[#ffb700] bg-[#fffbe8]/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-xs bg-white px-2.5 py-1 rounded-md border border-[#e7e7e7] focus-within:border-[#006ce4]">
              <Search className="w-3.5 h-3.5 text-[#006ce4]" />
              <input
                type="text"
                placeholder="Search service name or supplier..."
                value={rateSearch}
                onChange={(e) => setRateSearch(e.target.value)}
                className="w-full text-xs outline-hidden text-[#1a1a1a] bg-transparent placeholder:text-[#595959]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* City Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[#595959] text-[11px] font-bold">City:</span>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-2.5 py-1 bg-white rounded-md border border-[#e7e7e7] text-[#1a1a1a] text-xs font-medium focus:outline-hidden focus:border-[#006ce4] cursor-pointer"
                >
                  <option value="All">All Cities</option>
                  {EGYPT_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Service Type Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[11px] font-medium">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/80 text-slate-700 text-xs font-medium focus:outline-hidden focus:border-slate-400 cursor-pointer"
                >
                  <option value="All">All Service Types</option>
                  {SUPPLIER_TYPES.map(st => <option key={st.type} value={st.type}>{st.type}</option>)}
                </select>
              </div>

              {/* Validity Dates Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[11px] font-medium">Validity:</span>
                <select
                  value={filterValidity}
                  onChange={(e) => setFilterValidity(e.target.value as any)}
                  className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/80 text-slate-700 text-xs font-medium focus:outline-hidden focus:border-slate-400 cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="active">Active Only</option>
                  <option value="expiring_soon">Expiring Next 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rates View: Cards for Mobile, High-Density Table for Desktop */}
          {filteredRates.length > 0 ? (
            <>
              {/* Mobile Card Grid for Phones */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredRates.map(rate => {
                  const expiring = isExpiringWithin30Days(rate.validityEnd);
                  const expired = isExpired(rate.validityEnd);

                  return (
                    <div key={rate.id} className="p-3.5 space-y-2 hover:bg-slate-50/60 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{rate.serviceName}</div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                            <span className="truncate">{rate.supplierName}</span>
                            <span>·</span>
                            <span className="shrink-0">{rate.city}</span>
                          </div>
                        </div>
                        <div className="text-end shrink-0">
                          <div className="text-xs font-bold text-slate-900 tabular-nums">
                            {hideNetCost ? '••••••' : `${rate.netCost.toLocaleString()} ${rate.currency}`}
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize">{rate.occupancyBasis.replace('_', ' ')}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="font-mono text-[10px] text-slate-400">{rate.validityStart} to {rate.validityEnd}</span>
                        <div className="flex items-center gap-1.5">
                          {expiring && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              &lt;30d
                            </span>
                          )}
                          {expired && (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Expired
                            </span>
                          )}
                          {!expiring && !expired && (
                            <span className="text-[10px] text-emerald-700 font-medium">Valid</span>
                          )}
                          <button
                            onClick={() => handleOpenRateDrawer(rate)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded bg-slate-100 hover:bg-slate-200 ml-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                            title="Edit Rate"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dense High-Density Data Grid (Desktop/Tablet) - Booking Design System */}
              <div className="hidden md:block overflow-x-auto max-h-[640px]">
                <table className="w-full text-start text-xs border-collapse">
                  <thead className="bg-[#f8f9fa] border-b border-[#e7e7e7] sticky top-0 z-10 text-[#595959] text-[11px] uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-3.5 text-start">Supplier Name</th>
                      <th className="py-2.5 px-3.5 text-start">Service / Contract Name</th>
                      <th className="py-2.5 px-3.5 text-start">City</th>
                      <th className="py-2.5 px-3.5 text-start">Occupancy Basis</th>
                      <th className="py-2.5 px-3.5 text-start">Net Cost</th>
                      <th className="py-2.5 px-3.5 text-start">Validity Dates</th>
                      <th className="py-2.5 px-3.5 text-start">Alerts / Policy</th>
                      <th className="py-2.5 px-3.5 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7e7e7] text-[#1a1a1a]">
                    {filteredRates.map(rate => {
                      const expiring = isExpiringWithin30Days(rate.validityEnd);
                      const expired = isExpired(rate.validityEnd);

                      return (
                        <tr key={rate.id} className="hover:bg-[#f0f6ff] transition group">
                          <td className="py-2.5 px-3.5 font-bold text-[#1a1a1a] whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>{rate.supplierName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3.5 font-medium text-slate-900">
                            <div className="font-semibold text-slate-900">{rate.serviceName}</div>
                            {rate.notes && (
                              <div className="text-[11px] text-slate-400 font-normal truncate max-w-sm">
                                {rate.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 font-medium whitespace-nowrap">
                            {rate.city}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="text-slate-600 font-medium capitalize">
                              {rate.occupancyBasis.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                            {hideNetCost ? (
                              <span className="text-slate-400 font-mono tracking-widest">••••••</span>
                            ) : (
                              <span>{rate.netCost.toLocaleString()} {rate.currency}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-[11px] tabular-nums text-slate-500 whitespace-nowrap">
                            {rate.validityStart} to {rate.validityEnd}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            {expiring && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Expires &lt;30d
                              </span>
                            )}
                            {expired && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Expired Rate
                              </span>
                            )}
                            {!expiring && !expired && (
                              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" /> Valid
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-end whitespace-nowrap space-x-1">
                            <button
                              onClick={() => handleOpenRateDrawer(rate)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                              title="Edit Rate"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteRate(rate.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-2xs">
                <Database className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">No Contracted Rates Found</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Your rate library is empty. Add contracted net rates to enable instant automatic quote pricing, season surcharges, and margin protection.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => handleOpenRateDrawer()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Your First Rate</span>
                </button>
                <button
                  onClick={() => setExcelModalOpen(true)}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Rate Ingestion (FileReader)</span>
                </button>
                <button
                  onClick={() => downloadBlankRateTemplateExcel()}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-700" />
                  <span>Download Blank Excel Template</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEASONS */}
      {activeTab === 'seasons' && (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Named Season Date Ranges</h2>
              <p className="text-[11px] text-slate-500">Rates attach to seasons to apply automatic high/peak holiday surcharges</p>
            </div>
            <button
              onClick={() => setSeasonModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-800 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Season</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5 text-start">Season Name</th>
                  <th className="py-2.5 px-3.5 text-start">Start Date</th>
                  <th className="py-2.5 px-3.5 text-start">End Date</th>
                  <th className="py-2.5 px-3.5 text-start">Color Tag</th>
                  <th className="py-2.5 px-3.5 text-start">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {seasons.map(season => (
                  <tr key={season.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: season.color }}></span>
                        <span>{season.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 tabular-nums text-slate-600">
                      {season.startDate}
                    </td>
                    <td className="py-3 px-3.5 tabular-nums text-slate-600">
                      {season.endDate}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400">
                      {season.color}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="text-slate-600 font-medium text-[11px]">
                        Active Calendar
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EXCHANGE RATES (FX) */}
      {activeTab === 'fx' && (
        <div className="space-y-4">
          {/* Visible FX Warning Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between gap-3 text-slate-800 shadow-2xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold text-xs text-slate-900">
                  Exchange rates last updated {fxLastUpdatedDaysAgo} days ago.
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The safety buffer ensures quotes in EUR, USD, and GBP absorb currency fluctuations between quote dispatch and booking confirmation.
                </p>
              </div>
            </div>

            {fxSavedNotification && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Buffer Updated
              </span>
            )}
          </div>

          {/* Compact FX Table with Live Safety Buffer Calculation */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Manual Exchange Rates & Safety Buffer Configuration</h2>
              <p className="text-[11px] text-slate-500">Deterministic formula: Quote FX = Base Rate * (1 + Safety Buffer %)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-500 text-[11px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5 text-start">Currency Pair</th>
                    <th className="py-2.5 px-3.5 text-start">Base Market Rate (EGP)</th>
                    <th className="py-2.5 px-3.5 text-start">Safety Buffer %</th>
                    <th className="py-2.5 px-3.5 text-start">Effective Quoting Rate (EGP)</th>
                    <th className="py-2.5 px-3.5 text-start">Formula Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {exchangeRates.map(fx => {
                    const effectiveRate = Math.round(fx.rate * (1 + fx.safetyBufferPercent / 100) * 100) / 100;

                    return (
                      <tr key={fx.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3.5 font-semibold text-slate-900">
                          1 {fx.fromCurrency} → {fx.toCurrency}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              value={fx.rate}
                              onChange={(e) => handleUpdateFxRate(fx.id, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 rounded-lg border border-slate-200/80 text-xs font-semibold tabular-nums text-slate-900 focus:outline-hidden focus:border-slate-400"
                            />
                            <span className="text-slate-400 text-[11px]">EGP</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.5"
                              value={fx.safetyBufferPercent}
                              onChange={(e) => handleUpdateFxBuffer(fx.id, parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 rounded-lg border border-slate-200/80 text-xs font-semibold tabular-nums text-slate-900 focus:outline-hidden focus:border-slate-400"
                            />
                            <span className="text-slate-400 text-[11px]">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 tabular-nums text-sm">
                          {effectiveRate} EGP
                        </td>
                        <td className="py-3 px-3.5 text-[11px] text-slate-400 font-mono">
                          {fx.rate} * (1 + {fx.safetyBufferPercent}%) = {effectiveRate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* SLIDE-OUT DRAWER / SHEET: ADD/EDIT SUPPLIER */}
      {supplierDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-s border-[#E2E8F0] p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <button
                  onClick={() => setSupplierDrawerOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form id="supplierForm" onSubmit={handleSaveSupplierForm} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Four Seasons Hotel Cairo at Nile Plaza"
                    value={supFormName}
                    onChange={(e) => setSupFormName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Supplier Type</label>
                    <select
                      value={supFormType}
                      onChange={(e) => setSupFormType(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                    >
                      {SUPPLIER_TYPES.map(st => <option key={st.type} value={st.type}>{st.type}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">City / Region</label>
                    <select
                      value={supFormCity}
                      onChange={(e) => setSupFormCity(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                    >
                      {EGYPT_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Karim Gamal (Director of Sales)"
                      value={supFormContactPerson}
                      onChange={(e) => setSupFormContactPerson(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="+20 100 123 4567"
                      value={supFormContactPhone}
                      onChange={(e) => setSupFormContactPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="reservations@hotel.com"
                    value={supFormContactEmail}
                    onChange={(e) => setSupFormContactEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Contract Start</label>
                    <input
                      type="date"
                      value={supFormStart}
                      onChange={(e) => setSupFormStart(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Contract End</label>
                    <input
                      type="date"
                      value={supFormEnd}
                      onChange={(e) => setSupFormEnd(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contract Notes & Policies</label>
                  <textarea
                    rows={3}
                    placeholder="Special DMC booking terms, cancellation deadlines, breakfast inclusions..."
                    value={supFormNotes}
                    onChange={(e) => setSupFormNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                  />
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSupplierDrawerOpen(false)}
                className="px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="supplierForm"
                className="px-4 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-md text-xs font-semibold shadow-2xs"
              >
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OUT DRAWER / SHEET: ADD/EDIT RATE */}
      {rateDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-s border-[#E2E8F0] p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  {editingRate ? 'Edit Contracted Rate' : 'Add New Service Rate'}
                </h3>
                <button
                  onClick={() => setRateDrawerOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form id="rateForm" onSubmit={handleSaveRateForm} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Contracted Supplier *</label>
                  <select
                    value={rateFormSupplierId}
                    onChange={(e) => setRateFormSupplierId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Service / Room Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deluxe Room (Pyramids View) - Double Occupancy"
                    value={rateFormServiceName}
                    onChange={(e) => setRateFormServiceName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Service Type</label>
                    <select
                      value={rateFormType}
                      onChange={(e) => setRateFormType(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                    >
                      {SUPPLIER_TYPES.map(st => <option key={st.type} value={st.type}>{st.type}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">City</label>
                    <select
                      value={rateFormCity}
                      onChange={(e) => setRateFormCity(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                    >
                      {EGYPT_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Occupancy Basis</label>
                    <select
                      value={rateFormOccupancy}
                      onChange={(e) => setRateFormOccupancy(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                    >
                      <option value="double">Double Occupancy</option>
                      <option value="single">Single Occupancy</option>
                      <option value="triple">Triple Occupancy</option>
                      <option value="per_person">Per Person</option>
                      <option value="per_vehicle">Per Vehicle</option>
                      <option value="per_group">Per Group</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Currency</label>
                    <select
                      value={rateFormCurrency}
                      onChange={(e) => setRateFormCurrency(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-medium text-xs text-gray-900"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EGP">EGP (ج.م)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Net Cost *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="0.01"
                      value={rateFormCost}
                      onChange={(e) => setRateFormCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md font-bold text-xs text-gray-900 tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Single Supplement</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={rateFormSingleSupp}
                      onChange={(e) => setRateFormSingleSupp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900 tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Validity Start</label>
                    <input
                      type="date"
                      value={rateFormStart}
                      onChange={(e) => setRateFormStart(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Validity End</label>
                    <input
                      type="date"
                      value={rateFormEnd}
                      onChange={(e) => setRateFormEnd(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Rate Notes & Child Policy</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Under 6 free of charge. Peak Christmas surcharge applies."
                    value={rateFormNotes}
                    onChange={(e) => setRateFormNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-900"
                  />
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRateDrawerOpen(false)}
                className="px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="rateForm"
                className="px-4 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-md text-xs font-semibold shadow-2xs"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SEASON */}
      {seasonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl border border-[#CBD5E1] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#0F172A]">Add Season Date Range</h3>
              <button onClick={() => setSeasonModalOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Season Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Peak Easter & Spring Break"
                  value={seasonFormName}
                  onChange={(e) => setSeasonFormName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={seasonFormStart}
                    onChange={(e) => setSeasonFormStart(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={seasonFormEnd}
                    onChange={(e) => setSeasonFormEnd(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSeasonModalOpen(false)}
                className="px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (seasonFormName) {
                    seasons.push({
                      id: `season-${Date.now()}`,
                      workspaceId: workspace.id,
                      name: seasonFormName,
                      startDate: seasonFormStart,
                      endDate: seasonFormEnd,
                      color: seasonFormColor,
                    });
                    setSeasonModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 bg-[#0F172A] text-white rounded-md text-xs font-semibold"
              >
                Create Season
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FileReader Rate Ingestion Modal */}
      <RateIngestionModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        suppliers={suppliers}
        workspaceId={workspace.id}
        onImportRates={(imported) => {
          repository.saveBulkRates(imported);
          imported.forEach(onSaveRate);
        }}
      />

      {/* AI PDF Vision Rate Extractor Split Pane */}
      <PdfReviewSplitPane
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        suppliers={suppliers}
        workspaceId={workspace.id}
        onApproveRates={(approvedRates) => {
          repository.saveBulkRates(approvedRates);
          approvedRates.forEach(onSaveRate);
        }}
      />

      {/* Bulk Rate Rule Drawer */}
      <BulkRateActionDrawer
        isOpen={bulkDrawerOpen}
        onClose={() => setBulkDrawerOpen(false)}
        rates={rates}
        onApplyBulkUpdate={(updatedRates) => {
          updatedRates.forEach(onSaveRate);
        }}
      />
    </div>
  );
};
