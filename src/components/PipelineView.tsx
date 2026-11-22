import React, { useState } from 'react';
import {
  Kanban, DollarSign, CheckCircle2, XCircle,
  ArrowRight, Clock, Plus, Filter, User, Share2, Check, MessageSquare, Shield,
  FileSpreadsheet, FileText, Download, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Inquiry, UILanguage, Workspace } from '../types';
import { UI_TRANSLATIONS } from '../lib/i18n';
import { WhatsAppParserModal } from './WhatsAppParserModal';
import { OperationsDispatchModal } from './operations/OperationsDispatchModal';
import { exportPipelineToExcel, exportQuoteToExcel, exportQuoteToLuxuryPDF } from '../lib/exportUtils';
import { GuidanceTrigger } from './common/GuidanceTrigger';
import { computeOperationalKpis } from '../lib/tripStore';
import { getStoredExchangeRates } from '../lib/currencyService';
import { DEFAULT_EXCHANGE_RATES } from '../lib/constants';

interface PipelineViewProps {
  quotes: Quote[];
  inquiries: Inquiry[];
  workspace: Workspace;
  uiLang: UILanguage;
  recentlyTransitionedMap?: Record<string, 'Sent' | 'Accepted'>;
  onUpdateQuoteStatus: (quoteId: string, status: Quote['status']) => void;
  onSelectQuote: (quote: Quote) => void;
  onNavigateToQuotes?: () => void;
  onProceedToQuote?: (inquiry: Inquiry) => void;
  onSaveInquiry?: (inquiry: Inquiry) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  quotes,
  inquiries,
  workspace,
  uiLang,
  recentlyTransitionedMap = {},
  onUpdateQuoteStatus,
  onSelectQuote,
  onNavigateToQuotes,
  onProceedToQuote,
  onSaveInquiry,
}) => {
  const t = (key: string) => UI_TRANSLATIONS[uiLang]?.[key] || key;
  const [whatsappParserOpen, setWhatsappParserOpen] = useState(false);

  const columns: { status: Quote['status']; label: string; accent: string }[] = [
    { status: 'Draft', label: 'Drafting & Qualifying', accent: 'border-[#EDE0CC]' },
    { status: 'Sent', label: 'Proposal Sent', accent: 'border-[#795037]' },
    { status: 'Viewed', label: 'Proposal Viewed', accent: 'border-[#C4A177]' },
    { status: 'Accepted', label: 'Won / Confirmed', accent: 'border-[#008009]' },
    { status: 'Declined', label: 'Lost / Closed', accent: 'border-slate-300' },
  ];

  const [mobileActiveStage, setMobileActiveStage] = React.useState<string>('all');
  const [copiedQuoteId, setCopiedQuoteId] = React.useState<string | null>(null);
  const [dispatchModalQuote, setDispatchModalQuote] = React.useState<Quote | null>(null);

  const liveKpis = React.useMemo(
    () => computeOperationalKpis({ quotes, inquiries }),
    [quotes, inquiries]
  );
  const isAr = uiLang === 'ar';

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="relative overflow-hidden bg-white border border-[#EDE0CC] rounded-2xl p-5 shadow-2xs">
        <GuidanceTrigger
          sectionKey="sales_pipeline"
          uiLang={uiLang}
          pinned={true}
          size="sm"
          label={uiLang === 'ar' ? 'دليل المسار' : 'Pipeline Guide'}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ltr:pr-14 rtl:pl-14">
          <div>
            <h1 className="text-lg font-bold text-[#44200F] tracking-tight flex items-center gap-2">
              <Kanban className="w-5 h-5 text-orange-600" />
              <span>Sales Pipeline &amp; Booking Stages</span>
            </h1>
            <p className="text-xs text-[#795037] mt-0.5">
              Stage progression and revenue velocity from inbound inquiry to confirmed DMC booking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportPipelineToExcel(quotes, workspace)}
              className="h-9 px-3.5 bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#008009] border border-[#a5d6a7] rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
              title="Download full sales pipeline and revenue ledger in Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#008009]" />
              <span>Export Ledger (Excel)</span>
            </button>

            <button
              onClick={() => setWhatsappParserOpen(true)}
              className="h-9 px-3.5 bg-[#FAF7F2] hover:bg-orange-50/50 text-[#44200F] border border-[#EDE0CC] hover:border-orange-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
              <span>Paste WhatsApp Chat</span>
            </button>

            {onNavigateToQuotes && (
              <button
                onClick={onNavigateToQuotes}
                className="h-9 px-3.5 bg-gradient-to-r from-[#44200F] to-[#5c2410] hover:to-[#ea580c] text-white border border-orange-500/30 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-orange-300" />
                <span>Create New Quote</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Pipeline Summary KPI Strip (Single Source of Truth with Dashboard) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#EDE0CC] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'قيمة مسار المبيعات النشط' : 'Pipeline Value (Open)'}
          </div>
          <div className="text-lg font-black text-[#44200F] font-mono tabular-nums mt-1">
            EGP {liveKpis.pipelineValueEgp.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {liveKpis.activePipelineQuotesCount} {isAr ? 'عروض قيد المتابعة' : 'active quotes (Draft / Sent / Viewed)'}
          </div>
        </div>

        <div className="bg-white border border-[#EDE0CC] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'الإيرادات المؤكدة (مقبول)' : 'Booked Revenue (Won)'}
          </div>
          <div className="text-lg font-black text-emerald-800 font-mono tabular-nums mt-1">
            EGP {liveKpis.bookedRevenueEgp.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            {liveKpis.acceptedQuotesCount} {isAr ? 'عروض مؤكدة' : 'accepted quotes'}
          </div>
        </div>

        <div className="bg-white border border-[#EDE0CC] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'الرحلات النشطة' : 'Active Trips'}
          </div>
          <div className="text-lg font-black text-[#44200F] font-mono tabular-nums mt-1">
            {liveKpis.activeTripsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {liveKpis.issuedVouchersCount} {isAr ? 'قسيمة خدمة مصدرة' : 'issued vouchers'}
          </div>
        </div>

        <div className="bg-white border border-[#EDE0CC] rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
            {isAr ? 'معدل التحويل والهامش' : 'Win Rate & Avg Margin'}
          </div>
          <div className="text-lg font-black text-[#44200F] font-mono tabular-nums mt-1">
            {liveKpis.conversionRatePct}% · {liveKpis.avgMarginPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {liveKpis.totalInquiriesCount} {isAr ? 'إجمالي' : 'total'} · {liveKpis.openInquiriesCount} {isAr ? 'مفتوحة' : 'open inquiries'}
          </div>
        </div>
      </div>

      {/* Empty State when no quotes exist */}
      {quotes.length === 0 ? (
        <div className="bg-white border border-[#EDE0CC] rounded-xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center justify-center text-[#44200F] mb-4 shadow-2xs">
            <Kanban className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold text-[#44200F] tracking-tight">No active quotes</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm">
            Your sales pipeline is empty. Build custom day-by-day itineraries with Egyptian rates, protected margins, and send interactive proposals.
          </p>
          {onNavigateToQuotes && (
            <button
              onClick={onNavigateToQuotes}
              className="mt-5 px-4 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Start Your First Quote</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Stage Selector */}
          <div className="md:hidden luxury-tab-bar flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap py-1">
            <button
              onClick={() => setMobileActiveStage('all')}
              className={`h-9 px-3.5 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer ${
                mobileActiveStage === 'all'
                  ? 'bg-[#44200F] text-[#C4A177] shadow-xs'
                  : 'bg-white border border-[#EDE0CC] text-slate-600'
              }`}
            >
              All Stages ({quotes.length})
            </button>
            {columns.map((c) => {
              const count = quotes.filter((q) => q.status === c.status).length;
              return (
                <button
                  key={c.status}
                  onClick={() => setMobileActiveStage(c.status)}
                  className={`h-9 px-3.5 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer ${
                    mobileActiveStage === c.status
                      ? 'bg-[#795037] text-white shadow-xs'
                      : 'bg-white border border-[#EDE0CC] text-slate-600'
                  }`}
                >
                  {c.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {columns
              .filter((col) => mobileActiveStage === 'all' || col.status === mobileActiveStage)
              .map((col) => {
                const colQuotes = quotes.filter((q) => q.status === col.status);
                const fxRates = getStoredExchangeRates();
                const colTotal = colQuotes.reduce((acc, q) => {
                  if (q.totalPriceEgp && q.totalPriceEgp > 0) return acc + Math.round(q.totalPriceEgp);
                  const rawSell = q.totals?.totalSell ?? (q as any).totalPriceQuoteCurrency ?? 0;
                  const curr = (q.displayCurrency || q.targetCurrency || 'EGP') as keyof typeof DEFAULT_EXCHANGE_RATES;
                  if (curr === 'EGP') return acc + Math.round(rawSell);
                  const rate = q.exchangeRateUsed || fxRates[curr]?.rateToEgp || DEFAULT_EXCHANGE_RATES[curr]?.toEgp || 49.5;
                  return acc + Math.round(rawSell * rate);
                }, 0);

                return (
                  <div
                    key={col.status}
                    className="bg-white rounded-xl border border-[#EDE0CC] shadow-2xs flex flex-col min-w-[240px] overflow-hidden"
                  >
                    {/* Column Header */}
                    <div className={`p-3.5 border-b border-[#EDE0CC] bg-[#FAF7F2] border-t-4 ${col.accent}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#44200F]">{col.label}</span>
                        <span className="text-xs font-medium text-slate-500 tabular-nums">{colQuotes.length}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1.5 tabular-nums font-mono">
                        EGP {colTotal.toLocaleString()}
                      </div>
                    </div>

                    {/* Column Cards with Smooth Framer Motion Entrance Animations */}
                    <div className="p-2.5 flex-1 space-y-2.5 min-h-[400px] overflow-y-auto">
                      <AnimatePresence mode="popLayout">
                        {colQuotes.map((quote) => {
                          const wasTransitionedTo = recentlyTransitionedMap[quote.id];
                          const isNewlySent = wasTransitionedTo === 'Sent' && quote.status === 'Sent';
                          const isNewlyAccepted = wasTransitionedTo === 'Accepted' && quote.status === 'Accepted';

                          return (
                            <motion.div
                              layout
                              key={`${quote.id}-${quote.status}`}
                              initial={{ opacity: 0, y: 18, scale: 0.94 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.92 }}
                              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                              className={`card-lift p-3.5 rounded-xl border bg-white hover:bg-[#FAF7F2]/40 shadow-xs cursor-pointer transition-colors duration-150 space-y-2 group ${
                                isNewlyAccepted
                                  ? 'border-emerald-400 ring-2 ring-emerald-500/20'
                                  : isNewlySent
                                  ? 'border-[#C4A177] ring-2 ring-[#C4A177]/25'
                                  : 'border-[#EDE0CC] hover:border-[#C4A177]/60'
                              }`}
                              onClick={() => onSelectQuote(quote)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#1a1a1a] truncate group-hover:text-[#795037] transition-colors">
                                  {quote.travelerName}
                                </span>
                                <span className="text-[10px] font-mono text-[#595959] tabular-nums shrink-0">
                                  {quote.quoteNumber}
                                </span>
                              </div>

                              <div className="text-xs text-[#595959] flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-[#44200F] tabular-nums font-mono">
                                    {(quote.displayCurrency || (quote as any).targetCurrency || 'EGP')}{' '}
                                    {(quote.totals?.totalSell ?? (quote as any).totalPriceQuoteCurrency ?? 0).toLocaleString()}
                                  </span>
                                  {(quote.displayCurrency || quote.targetCurrency || 'EGP') !== 'EGP' && quote.totalPriceEgp > 0 && (
                                    <span className="block text-[10px] text-slate-400 font-mono tabular-nums">
                                      ≈ EGP {Math.round(quote.totalPriceEgp).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-[#008009] font-bold tabular-nums">
                                  {Math.round(quote.totals?.marginPct ?? (quote as any).marginPercent ?? 22)}% margin
                                </span>
                              </div>

                              <div className="text-[11px] text-[#595959] flex items-center justify-between pt-1 border-t border-[#EDE0CC]">
                                <span>{quote.durationDays} days</span>
                                {quote.viewCount > 0 && (
                                  <span className="text-[#44200F] bg-[#EDE0CC] px-1.5 py-0.2 rounded font-bold text-[10px] shadow-2xs tabular-nums">
                                    {quote.viewCount} views
                                  </span>
                                )}
                              </div>

                              {/* Quick Move & Share & Download Actions */}
                              <div
                                className="pt-1 flex items-center justify-end gap-1 opacity-75 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  title="Download Luxury Client Proposal (PDF)"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportQuoteToLuxuryPDF(quote, workspace);
                                  }}
                                  className="btn-tactile p-1 text-[#795037] hover:text-[#44200F] hover:bg-[#FAF7F2] rounded transition cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  title="Download Operator Cost Sheet (Excel)"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    exportQuoteToExcel(quote, workspace);
                                  }}
                                  className="btn-tactile p-1 text-[#008009] hover:text-[#005706] hover:bg-[#e8f5e9] rounded transition cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  title="Copy Client Proposal Link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = `${window.location.origin}${window.location.pathname}?view=client&quoteId=${encodeURIComponent(quote.id)}`;
                                    navigator.clipboard.writeText(link);
                                    setCopiedQuoteId(quote.id);
                                    setTimeout(() => setCopiedQuoteId(null), 2000);
                                  }}
                                  className="btn-tactile p-1 text-[#595959] hover:text-[#44200F] hover:bg-[#FAF7F2] rounded transition cursor-pointer"
                                >
                                  {copiedQuoteId === quote.id ? (
                                    <Check className="w-3.5 h-3.5 text-[#008009]" />
                                  ) : (
                                    <Share2 className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  title="1-Click Supplier Vouchers & Operations Dispatch"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDispatchModalQuote(quote);
                                  }}
                                  className="btn-tactile p-1 text-[#795037] hover:text-[#44200F] hover:bg-[#FAF7F2] rounded transition cursor-pointer"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </button>

                                {col.status === 'Draft' && (
                                  <button
                                    title="Mark as Sent"
                                    onClick={() => onUpdateQuoteStatus(quote.id, 'Sent')}
                                    className="btn-tactile p-1 text-[#795037] hover:text-[#44200F] hover:bg-amber-50 rounded transition cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {col.status !== 'Accepted' && (
                                  <button
                                    title="Mark as Won"
                                    onClick={() => onUpdateQuoteStatus(quote.id, 'Accepted')}
                                    className="btn-tactile p-1 text-[#595959] hover:text-[#008009] hover:bg-[#e8f5e9] rounded transition cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {col.status !== 'Declined' && (
                                  <button
                                    title="Mark as Lost"
                                    onClick={() => onUpdateQuoteStatus(quote.id, 'Declined')}
                                    className="btn-tactile p-1 text-[#595959] hover:text-[#c00000] hover:bg-[#fef2f2] rounded transition cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {colQuotes.length === 0 && (
                        <div className="h-32 flex items-center justify-center text-xs text-[#595959] border border-dashed border-[#e7e7e7] rounded-md">
                          No quotes in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      <WhatsAppParserModal
        isOpen={whatsappParserOpen}
        onClose={() => setWhatsappParserOpen(false)}
        workspace={workspace}
        onProceedToQuote={(inq) => {
          if (onProceedToQuote) onProceedToQuote(inq);
          else if (onNavigateToQuotes) onNavigateToQuotes();
        }}
        onSaveInquiry={onSaveInquiry}
      />

      {dispatchModalQuote && (
        <OperationsDispatchModal
          isOpen={!!dispatchModalQuote}
          onClose={() => setDispatchModalQuote(null)}
          quote={dispatchModalQuote}
          workspace={workspace}
          uiLang={uiLang}
        />
      )}
    </div>
  );
};
