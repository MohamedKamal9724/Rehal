import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, ArrowRight, Database, MessageSquare, 
  Sparkles, Clock, Eye, DollarSign, TrendingUp, Compass, 
  Layers, Plus, Check, RefreshCw, Send, ShieldAlert, FileText,
  FileSpreadsheet, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workspace, UILanguage, Inquiry, Rate } from '../../types';
import { downloadBlankRateTemplateExcel } from '../../lib/exportUtils';


interface DayOneEmptyDashboardProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onNavigateTab: (tab: string) => void;
  onSimulateInquiry: () => void;
  onSeedStarterRates: () => void;
  hasRates: boolean;
  hasInquiries: boolean;
  onSwitchToFullView?: () => void;
}

export const DayOneEmptyDashboard: React.FC<DayOneEmptyDashboardProps> = ({
  workspace,
  uiLang,
  onNavigateTab,
  onSimulateInquiry,
  onSeedStarterRates,
  hasRates,
  hasInquiries,
  onSwitchToFullView,
}) => {
  const [ratesImported, setRatesImported] = useState(hasRates);
  const [inquirySimulated, setInquirySimulated] = useState(hasInquiries);
  const [showSimulateToast, setShowSimulateToast] = useState(false);

  // Update internal states if props change
  React.useEffect(() => {
    if (hasRates) setRatesImported(true);
    if (hasInquiries) setInquirySimulated(true);
  }, [hasRates, hasInquiries]);

  // Compute completion progress
  const completedCount = 1 + (ratesImported ? 1 : 0) + (inquirySimulated ? 1 : 0);
  const progressPercent = Math.round((completedCount / 3) * 100);

  const handleImportRatesClick = () => {
    onSeedStarterRates();
    setRatesImported(true);
  };

  const handleSimulateClick = () => {
    onSimulateInquiry();
    setInquirySimulated(true);
    setShowSimulateToast(true);
    setTimeout(() => setShowSimulateToast(false), 5000);
  };

  const brandPrimary = workspace?.brandColors?.primary || '#44200F';
  const brandAccent = workspace?.brandColors?.accent || '#795037';
  const brandGold = workspace?.brandColors?.gold || '#C4A177';

  return (
    <div 
      className="space-y-8 animate-in fade-in duration-200"
      style={{
        '--brand-primary': brandPrimary,
        '--brand-accent': brandAccent,
        '--brand-gold': brandGold,
      } as React.CSSProperties}
    >
      
      {/* 1. WELCOME TO DALIL HEADER */}
      <div 
        className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs"
        style={{
          borderTop: `4px solid ${brandGold}`,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div 
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 border"
              style={{
                backgroundColor: `${brandPrimary}0F`,
                borderColor: `${brandGold}50`,
                color: brandPrimary,
              }}
            >
              <Compass className="w-3.5 h-3.5" style={{ color: brandGold }} />
              <span>Day-One Onboarding Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome to RIHAL, {workspace.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Your Egyptian DMC workspace is initialized with base currency <strong>{workspace.defaultCurrency}</strong> and 
              contract safety buffers. Complete these 3 quick milestones to generate your first live itinerary quote.
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 lg:w-72 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-700">Setup Progress</span>
              <span className="font-mono tabular-nums font-bold" style={{ color: brandPrimary }}>{completedCount} of 3 ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%`, backgroundColor: brandGold }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {completedCount === 3 
                ? '🎉 All milestones finished! Your workspace is fully operational.'
                : 'Follow the checklist below to complete Day One.'}
            </p>
          </div>
        </div>
      </div>

      {/* SIMULATION TOAST ALERT */}
      <AnimatePresence>
        {showSimulateToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-emerald">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900">
                  Dummy WhatsApp Inquiry Connected!
                </div>
                <div className="text-[11px] text-emerald-700">
                  Traveler "Elena Rostov (Moscow Agency)" inquiry for 7-Day Cairo & Nile Cruise has been injected into your Inbox.
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('inbox')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
            >
              <span>Open in Inbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. GETTING STARTED CHECKLIST COMPONENT */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Getting Started Checklist</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60 uppercase">
                First 5 Minutes
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow these three essential setup actions to activate your automatic quote pipeline
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          
          {/* STEP 1: Complete your company profile (Checked off) */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/30">
            <div className="flex items-start gap-3.5">
              <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-emerald">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    1. Complete your company profile
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Completed
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Workspace initialized for <strong>{workspace.name}</strong>. Configured with default currency{' '}
                  <span className="font-mono font-medium text-slate-900">{workspace.defaultCurrency}</span>, contact email, and DMC brand styling.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('settings')}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shrink-0 transition"
            >
              Review Settings
            </button>
          </div>

          {/* STEP 2: Import your first Hotel & Supplier Rates (Active) */}
          <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
            ratesImported ? 'bg-emerald-50/30' : 'bg-white'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`luxury-icon-box luxury-icon-box-sm ${
                ratesImported ? 'luxury-icon-box-emerald' : 'luxury-icon-box-blue'
              }`}>
                {ratesImported ? <Check className="w-4 h-4 stroke-[3]" /> : <Database className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    2. Import your first Hotel & Supplier Rates
                  </span>
                  {ratesImported ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Rates Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Action Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Add contract net rates for Steigenberger, Marriott Mena House, or Nile Cruises to calculate instant net costs and protected margins.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
              {!ratesImported ? (
                <>
                  <button
                    onClick={() => downloadBlankRateTemplateExcel()}
                    className="w-full sm:w-auto px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5"
                    title="Download blank Excel spreadsheet template to fill with your rates"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" />
                    <span>Blank Rate Template</span>
                  </button>
                  <button
                    onClick={handleImportRatesClick}
                    className="w-full sm:w-auto px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition cursor-pointer min-h-[40px] flex items-center justify-center"
                  >
                    Load Starter Rates
                  </button>
                  <button
                    onClick={() => onNavigateTab('rates')}
                    style={{
                      backgroundColor: brandPrimary,
                      color: '#ffffff',
                    }}
                    className="w-full sm:w-auto px-3.5 py-2 hover:opacity-95 rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[40px]"
                  >
                    <span>Go to Rate Library</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigateTab('rates')}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition min-h-[40px] flex items-center justify-center"
                >
                  View Rate Library
                </button>
              )}
            </div>
          </div>

          {/* STEP 3: Connect a dummy WhatsApp inquiry to test the AI */}
          <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
            inquirySimulated ? 'bg-emerald-50/30' : 'bg-white'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`luxury-icon-box luxury-icon-box-sm ${
                inquirySimulated ? 'luxury-icon-box-emerald' : 'luxury-icon-box-purple'
              }`}>
                {inquirySimulated ? <Check className="w-4 h-4 stroke-[3]" /> : <MessageSquare className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    3. Connect a dummy WhatsApp inquiry to test the AI
                  </span>
                  {inquirySimulated ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Inquiry Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Ready to Test
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Test our AI parser with a realistic inbound traveler WhatsApp message requesting Cairo pyramids and a 4-night Luxor cruise.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleSimulateClick}
                style={!inquirySimulated ? {
                  backgroundColor: brandPrimary,
                  color: '#ffffff',
                } : undefined}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[40px] ${
                  inquirySimulated
                    ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                    : 'hover:opacity-95 shadow-xs'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: brandGold }} />
                <span>{inquirySimulated ? 'Simulate Another Inquiry' : 'Simulate Inquiry'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. SKELETON VIEW / FAINT OUTLINE OF ANALYTICS DASHBOARD */}
      <div className="space-y-4">
        {/* Skeleton Section Header with Informational Watermark Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Analytics & Telemetry Preview
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
              Faint Outline View
            </span>
          </div>
          <span className="text-xs text-slate-400 italic hidden sm:block">
            Metrics activate once you send your first proposal
          </span>
        </div>

        {/* Faint KPI Cards Outline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50 select-none">
          {/* Faint KPI 1 */}
          <div className="bg-slate-50/60 p-4.5 rounded-xl border border-dashed border-slate-300">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Time-to-First-Quote</span>
              <Clock className="w-4 h-4 text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-slate-400 font-mono">-- mins</div>
            <div className="mt-2 h-3 bg-slate-200/70 rounded-sm w-3/4 animate-pulse" />
          </div>

          {/* Faint KPI 2 */}
          <div className="bg-slate-50/60 p-4.5 rounded-xl border border-dashed border-slate-300">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Proposal Open Rate</span>
              <Eye className="w-4 h-4 text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-slate-400 font-mono">-- %</div>
            <div className="mt-2 h-3 bg-slate-200/70 rounded-sm w-2/3 animate-pulse" />
          </div>

          {/* Faint KPI 3 */}
          <div className="bg-slate-50/60 p-4.5 rounded-xl border border-dashed border-slate-300">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Active Pipeline Value</span>
              <DollarSign className="w-4 h-4 text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-slate-400 font-mono">$0 USD</div>
            <div className="mt-2 h-3 bg-slate-200/70 rounded-sm w-1/2 animate-pulse" />
          </div>

          {/* Faint KPI 4 */}
          <div className="bg-slate-50/60 p-4.5 rounded-xl border border-dashed border-slate-300">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Average DMC Margin</span>
              <TrendingUp className="w-4 h-4 text-slate-300" />
            </div>
            <div className="text-2xl font-bold text-slate-400 font-mono">{workspace.minMarginPercent}% target</div>
            <div className="mt-2 h-3 bg-slate-200/70 rounded-sm w-3/5 animate-pulse" />
          </div>
        </div>

        {/* Faint Two Panels Outline: Inquiries Queue & Live Engagements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 opacity-50 select-none">
          
          {/* Faint Left Panel: Inbound Queue */}
          <div className="bg-slate-50/50 rounded-xl border border-dashed border-slate-300 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="h-4 bg-slate-200 rounded w-36 mb-1" />
                <div className="h-3 bg-slate-200/70 rounded w-48" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-16" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div key={row} className="p-3 bg-white/70 rounded-lg border border-slate-200/60 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-32" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                  <div className="h-7 bg-slate-200 rounded w-24 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Faint Right Panel: Telemetry & Proposals */}
          <div className="bg-slate-50/50 rounded-xl border border-dashed border-slate-300 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="h-4 bg-slate-200 rounded w-40 mb-1" />
                <div className="h-3 bg-slate-200/70 rounded w-44" />
              </div>
              <div className="h-5 bg-slate-200 rounded w-16" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div key={row} className="p-3 bg-white/70 rounded-lg border border-slate-200/60 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded w-40" />
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                  </div>
                  <div className="h-7 bg-slate-200 rounded w-24 shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
