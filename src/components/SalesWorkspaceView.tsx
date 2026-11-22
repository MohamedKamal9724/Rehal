import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Inbox, FileText, Kanban, Clock, ArrowRight, ArrowLeft,
  Sparkles, Plus, CheckCircle2, TrendingUp, Users, Check,
  ChevronRight, ArrowUpRight, Send, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Inquiry, Quote, Workspace, UILanguage, FollowUpTask, User, Rate } from '../types';
import { InboxView } from './InboxView';
import { QuoteBuilderView } from './QuoteBuilderView';
import { PipelineView } from './PipelineView';
import { FollowUpsView } from './FollowUpsView';
import { SectionHelpTrigger } from './common/SectionHelpTrigger';

export interface QuoteStatusTransitionEvent {
  quoteId: string;
  quoteNumber: string;
  travelerName: string;
  fromStatus: Quote['status'];
  toStatus: 'Sent' | 'Accepted';
  totalPrice: number;
  currency: string;
  timestamp: number;
}

export interface SalesWorkspaceViewProps {
  workspace: Workspace;
  currentUser: User;
  inquiries: Inquiry[];
  quotes: Quote[];
  rates: Rate[];
  followUps: FollowUpTask[];
  uiLang: UILanguage;
  activeSubTab?: 'inbox' | 'quotes' | 'pipeline' | 'followups';
  initialInquiry?: Inquiry;
  onNavigateSubTab: (subTab: 'inbox' | 'quotes' | 'pipeline' | 'followups') => void;
  onSelectInquiryForQuote: (inquiry: Inquiry) => void;
  onConfirmQuoteToTrip: (quote: Quote) => void;
  onOpenNewInquiry: () => void;
  onOpenNewQuote: () => void;
  onViewProposal: (quote: Quote) => void;
  onSaveQuote: (quote: Quote) => void;
  onSaveInquiry?: (inquiry: Inquiry) => void;
  onUpdateQuoteStatus?: (quoteId: string, status: Quote['status']) => void;
  onUpdateFollowUp?: (id: string, updates: Partial<FollowUpTask>) => void;
  onOpenGuestPasscode?: (code: string) => void;
}

export const SalesWorkspaceView: React.FC<SalesWorkspaceViewProps> = ({
  workspace,
  currentUser,
  inquiries,
  quotes,
  rates,
  followUps,
  uiLang,
  activeSubTab = 'inbox',
  initialInquiry,
  onNavigateSubTab,
  onSelectInquiryForQuote,
  onConfirmQuoteToTrip,
  onOpenNewInquiry,
  onOpenNewQuote,
  onViewProposal,
  onSaveQuote,
  onSaveInquiry,
  onUpdateQuoteStatus,
  onUpdateFollowUp,
}) => {
  const isAr = uiLang === 'ar';

  // Track previous statuses of quotes to detect Draft -> Sent or Draft -> Accepted transitions
  const prevQuoteStatusesRef = useRef<Record<string, Quote['status']>>({});
  const [transitionEvent, setTransitionEvent] = useState<QuoteStatusTransitionEvent | null>(null);
  const [recentlyTransitionedMap, setRecentlyTransitionedMap] = useState<Record<string, 'Sent' | 'Accepted'>>({});

  const triggerTransitionAnimation = useCallback((quote: Quote, toStatus: 'Sent' | 'Accepted') => {
    setTransitionEvent({
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      travelerName: quote.travelerName,
      fromStatus: 'Draft',
      toStatus,
      totalPrice: quote.totals?.totalSell ?? (quote as any).totalPriceQuoteCurrency ?? 0,
      currency: quote.displayCurrency || (quote as any).targetCurrency || 'EGP',
      timestamp: Date.now(),
    });
    setRecentlyTransitionedMap((prev) => ({ ...prev, [quote.id]: toStatus }));
  }, []);

  // Detect status transitions from props updates (Draft -> Sent or Draft -> Accepted)
  useEffect(() => {
    const prevMap = prevQuoteStatusesRef.current;
    for (const q of quotes) {
      const prevStatus = prevMap[q.id];
      if (prevStatus === 'Draft' && (q.status === 'Sent' || q.status === 'Accepted')) {
        triggerTransitionAnimation(q, q.status);
      }
      prevMap[q.id] = q.status;
    }
  }, [quotes, triggerTransitionAnimation]);

  // Auto-clear transition banner after 6.5 seconds
  useEffect(() => {
    if (!transitionEvent) return;
    const timer = setTimeout(() => {
      setTransitionEvent(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [transitionEvent]);

  // Wrapped handlers so transitions initiated inside QuoteBuilderView or PipelineView immediately animate
  const handleQuoteStatusChange = useCallback(
    (quoteId: string, nextStatus: Quote['status']) => {
      const targetQuote = quotes.find((q) => q.id === quoteId);
      if (targetQuote) {
        if (targetQuote.status === 'Draft' && (nextStatus === 'Sent' || nextStatus === 'Accepted')) {
          triggerTransitionAnimation(targetQuote, nextStatus);
        }
        prevQuoteStatusesRef.current[quoteId] = nextStatus;
      }

      if (onUpdateQuoteStatus) {
        onUpdateQuoteStatus(quoteId, nextStatus);
      } else if (targetQuote) {
        onSaveQuote({ ...targetQuote, status: nextStatus, updatedAt: new Date().toISOString() });
        if (nextStatus === 'Accepted') {
          onConfirmQuoteToTrip({ ...targetQuote, status: 'Accepted' });
        }
      }
    },
    [quotes, onUpdateQuoteStatus, onSaveQuote, onConfirmQuoteToTrip, triggerTransitionAnimation]
  );

  const handleSaveQuoteWithTransition = useCallback(
    (savedQuote: Quote) => {
      const prevStatus = prevQuoteStatusesRef.current[savedQuote.id];
      if (
        (prevStatus === 'Draft' || !prevStatus) &&
        (savedQuote.status === 'Sent' || savedQuote.status === 'Accepted')
      ) {
        triggerTransitionAnimation(savedQuote, savedQuote.status);
      }
      prevQuoteStatusesRef.current[savedQuote.id] = savedQuote.status;
      onSaveQuote(savedQuote);
    },
    [onSaveQuote, triggerTransitionAnimation]
  );

  // Counts for tab badges (Single Source of Truth with computeOperationalKpis)
  const newInquiriesCount = inquiries.filter((i) => i.status === 'New' || i.status === 'In Progress').length;
  const pendingDecisionsCount = quotes.filter((q) => q.status === 'Sent' || q.status === 'Viewed' || q.status === 'Draft').length;
  const pendingFollowupsCount = followUps.filter((f) => !f.done && f.status !== 'Completed').length;

  // Active sub-view
  const currentTab = activeSubTab;

  return (
    <div className="space-y-6">
      {/* 1. THE SALES WORKFLOW JOURNEY TIMELINE */}
      <div className="relative bg-white rounded-2xl border border-[#EDE0CC] p-4 sm:p-5 shadow-xs">
        <SectionHelpTrigger
          sectionKey={
            currentTab === 'inbox'
              ? 'sales_inbox'
              : currentTab === 'quotes'
              ? 'sales_quotes'
              : currentTab === 'pipeline'
              ? 'sales_pipeline'
              : 'sales_inbox'
          }
          uiLang={uiLang}
          size="sm"
          pinned={true}
          label={isAr ? 'دليل المرحلة' : 'Stage Guide'}
          onNavigateTab={(tab) => {
            if (tab === 'inbox' || tab === 'quotes' || tab === 'pipeline' || tab === 'followups') {
              onNavigateSubTab(tab as any);
            }
          }}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EDE0CC]/60 ltr:pr-14 rtl:pl-14">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
                {isAr ? 'مسار المبيعات الموحد' : 'Unified Sales Journey'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#44200F] mt-0.5">
              {isAr ? 'إدارة المبيعات والتعاقدات' : 'Sales & Quotations Hub'}
            </h1>
            <p className="text-xs text-[#795037] mt-0.5">
              {isAr
                ? 'رحلة موحدة تبدأ من استلام الطلب، ثم تسعير العرض، فمتابعة قرار العميل، وصولاً لتأكيد الرحلة ونقلها للتشغيل.'
                : 'Follow each booking from initial inquiry, through pricing & proposal, to customer acceptance and operations dispatch.'}
            </p>
          </div>

          {/* Action buttons - Standardized equal height h-9 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenNewInquiry}
              className="h-9 px-3.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#44200F] hover:bg-orange-50/50 border border-[#EDE0CC] hover:border-orange-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-orange-600" />
              <span>{isAr ? 'طلب جديد' : 'New Inquiry'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewQuote}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#44200F] via-[#5c2410] to-[#44200F] hover:to-[#ea580c] text-[#FAF7F2] border border-orange-500/30 hover:border-orange-400 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-orange-300" />
              <span>{isAr ? 'عرض سعر جديد' : 'Create Quote'}</span>
            </button>
          </div>
        </div>

        {/* Visual Workflow Steps Bar */}
        <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5 items-stretch">
          {/* Step 1: Inquiry */}
          <button
            type="button"
            onClick={() => onNavigateSubTab('inbox')}
            className={`min-h-[96px] h-full p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
              currentTab === 'inbox'
                ? 'bg-[#44200F] text-[#FAF7F2] border-[#44200F] shadow-xs'
                : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#44200F] border-[#EDE0CC]'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] font-mono font-bold shrink-0 ${currentTab === 'inbox' ? 'text-[#C4A177]' : 'text-[#795037]'}`}>
                01. {isAr ? 'الطلب الوارد' : 'INQUIRY'}
              </span>
              {newInquiriesCount > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums ${currentTab === 'inbox' ? 'bg-[#C4A177] text-[#44200F]' : 'bg-rose-100 text-rose-800'}`}>
                  {newInquiriesCount} {isAr ? 'جديد' : 'New'}
                </span>
              )}
            </div>
            <div className="text-xs font-bold mt-1 truncate">
              {isAr ? 'صندوق الطلبات' : 'Inbound Inquiries'}
            </div>
            <div className={`text-[10px] mt-0.5 truncate ${currentTab === 'inbox' ? 'text-[#EDE0CC]' : 'text-slate-500'}`}>
              {isAr ? 'استلام رغبات السائح والبرنامج' : 'Capture traveler brief & dates'}
            </div>
          </button>

          {/* Step 2: Quote */}
          <button
            type="button"
            onClick={() => onNavigateSubTab('quotes')}
            className={`min-h-[96px] h-full p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
              currentTab === 'quotes'
                ? 'bg-[#44200F] text-[#FAF7F2] border-[#44200F] shadow-xs'
                : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#44200F] border-[#EDE0CC]'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] font-mono font-bold shrink-0 ${currentTab === 'quotes' ? 'text-[#C4A177]' : 'text-[#795037]'}`}>
                02. {isAr ? 'عرض السعر' : 'QUOTE'}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums ${currentTab === 'quotes' ? 'bg-[#C4A177] text-[#44200F]' : 'bg-slate-200 text-slate-700'}`}>
                {quotes.length}
              </span>
            </div>
            <div className="text-xs font-bold mt-1 truncate">
              {isAr ? 'صانع عروض الأسعار' : 'Quote Builder'}
            </div>
            <div className={`text-[10px] mt-0.5 truncate ${currentTab === 'quotes' ? 'text-[#EDE0CC]' : 'text-slate-500'}`}>
              {isAr ? 'حساب التكاليف والربح والـ PDF' : 'Day-by-day costing & margins'}
            </div>
          </button>

          {/* Step 3: Customer Decision */}
          <button
            type="button"
            onClick={() => onNavigateSubTab('pipeline')}
            className={`min-h-[96px] h-full p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
              currentTab === 'pipeline'
                ? 'bg-[#44200F] text-[#FAF7F2] border-[#44200F] shadow-xs'
                : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#44200F] border-[#EDE0CC]'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] font-mono font-bold shrink-0 ${currentTab === 'pipeline' ? 'text-[#C4A177]' : 'text-[#795037]'}`}>
                03. {isAr ? 'قرار العميل' : 'DECISION'}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums ${currentTab === 'pipeline' ? 'bg-[#C4A177] text-[#44200F]' : 'bg-amber-100 text-amber-900'}`}>
                {pendingDecisionsCount} {isAr ? 'معلق' : 'Active'}
              </span>
            </div>
            <div className="text-xs font-bold mt-1 truncate">
              {isAr ? 'مسار القرارات والمبيعات' : 'Sales Pipeline'}
            </div>
            <div className={`text-[10px] mt-0.5 truncate ${currentTab === 'pipeline' ? 'text-[#EDE0CC]' : 'text-slate-500'}`}>
              {isAr ? 'المتابعة حتى التوقيع والدفع' : 'Track negotiation & approval'}
            </div>
          </button>

          {/* Step 4: Follow-ups */}
          <button
            type="button"
            onClick={() => onNavigateSubTab('followups')}
            className={`min-h-[96px] h-full p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
              currentTab === 'followups'
                ? 'bg-[#44200F] text-[#FAF7F2] border-[#44200F] shadow-xs'
                : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#44200F] border-[#EDE0CC]'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] font-mono font-bold shrink-0 ${currentTab === 'followups' ? 'text-[#C4A177]' : 'text-[#795037]'}`}>
                04. {isAr ? 'المتابعات والمهام' : 'FOLLOW-UPS'}
              </span>
              {pendingFollowupsCount > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums ${currentTab === 'followups' ? 'bg-[#C4A177] text-[#44200F]' : 'bg-amber-100 text-amber-800'}`}>
                  {pendingFollowupsCount}
                </span>
              )}
            </div>
            <div className="text-xs font-bold mt-1 truncate">
              {isAr ? 'متابعات العملاء' : 'Tasks & Reminders'}
            </div>
            <div className={`text-[10px] mt-0.5 truncate ${currentTab === 'followups' ? 'text-[#EDE0CC]' : 'text-slate-500'}`}>
              {isAr ? 'مواعيد الاتصال وردود الوكلاء' : 'Scheduled calls & deadlines'}
            </div>
          </button>
        </div>

        {/* Live Quote Status Progression Strip with Smooth Framer Motion Entrance Animations */}
        {quotes.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-[#EDE0CC]/70">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-[#795037]">
                {isAr ? 'حالة عروض الأسعار النشطة والتحويل الفوري:' : 'Live Quote Status & Instant Progression:'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                {quotes.filter((q) => q.status === 'Accepted').length} {isAr ? 'مقبول' : 'Accepted'} ·{' '}
                {quotes.filter((q) => q.status === 'Sent' || q.status === 'Viewed').length} {isAr ? 'مُرسل/مقروء' : 'Sent/Viewed'} ·{' '}
                {quotes.filter((q) => q.status === 'Draft').length} {isAr ? 'مسودة' : 'Draft'}
              </span>
            </div>

            <div className="luxury-tab-bar flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 flex-nowrap">
              <AnimatePresence mode="popLayout">
                {quotes.slice(0, 6).map((q) => {
                  const isSent = q.status === 'Sent';
                  const isAccepted = q.status === 'Accepted';
                  const isDraft = q.status === 'Draft';

                  return (
                    <motion.div
                      layout
                      key={`${q.id}-${q.status}`}
                      initial={{ opacity: 0, y: 12, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                      className={`h-10 px-3 rounded-xl border flex items-center gap-2.5 shrink-0 shadow-2xs transition-colors ${
                        isAccepted
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                          : isSent
                          ? 'bg-amber-50/90 border-[#C4A177] text-[#44200F]'
                          : 'bg-[#FAF7F2] border-[#EDE0CC] text-[#44200F]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onViewProposal(q)}
                        className="flex items-center gap-2 text-start cursor-pointer"
                      >
                        <span className="font-mono text-[10px] font-bold text-[#795037] tabular-nums">
                          {q.quoteNumber}
                        </span>
                        <span className="text-xs font-extrabold truncate max-w-[120px]">
                          {q.travelerName}
                        </span>
                      </button>

                      {/* Animated Status Badge */}
                      <motion.span
                        key={q.status}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                          isAccepted
                            ? 'bg-emerald-600 text-white'
                            : isSent
                            ? 'bg-[#44200F] text-[#FDE68A]'
                            : 'bg-white border border-[#EDE0CC] text-[#795037]'
                        }`}
                      >
                        {isAr
                          ? isAccepted
                            ? 'مؤكد ومقبول'
                            : isSent
                            ? 'تم الإرسال'
                            : q.status === 'Draft'
                            ? 'مسودة'
                            : q.status
                          : q.status}
                      </motion.span>

                      {/* Quick Draft -> Sent / Accepted Action Controls */}
                      {isDraft && (
                        <div className="flex items-center gap-1 ps-1 border-s border-[#EDE0CC]">
                          <button
                            type="button"
                            onClick={() => handleQuoteStatusChange(q.id, 'Sent')}
                            title={isAr ? 'تحويل العرض إلى مُرسل' : "Mark Quote as 'Sent'"}
                            className="h-6 px-2 rounded-md bg-[#44200F] hover:bg-[#5c2410] text-[#FDE68A] text-[10px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>{isAr ? 'إرسال' : 'Send'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuoteStatusChange(q.id, 'Accepted')}
                            title={isAr ? 'تأكيد وقبول العرض' : "Mark Quote as 'Accepted'"}
                            className="h-6 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                          >
                            <Check className="w-2.5 h-2.5" />
                            <span>{isAr ? 'قبول' : 'Accept'}</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* FRAMER MOTION ENTRANCE ANIMATION BANNER FOR QUOTE STATUS TRANSITION ('Draft' -> 'Sent' | 'Accepted') */}
      <AnimatePresence mode="wait">
        {transitionEvent && (
          <motion.div
            key={`${transitionEvent.quoteId}-${transitionEvent.toStatus}-${transitionEvent.timestamp}`}
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26, mass: 0.85 }}
            className={`rounded-2xl p-4 sm:p-5 border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden ${
              transitionEvent.toStatus === 'Accepted'
                ? 'bg-gradient-to-r from-[#063A23] via-[#0B4F32] to-[#063A23] text-white border-emerald-400/40'
                : 'bg-gradient-to-r from-[#241108] via-[#3B1E10] to-[#241108] text-[#FAF7F2] border-[#C4A177]/50'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <motion.div
                initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.06 }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
                  transitionEvent.toStatus === 'Accepted'
                    ? 'bg-emerald-500/25 border-emerald-300/50 text-emerald-200'
                    : 'bg-[#C4A177]/20 border-[#FDE68A]/50 text-[#FDE68A]'
                }`}
              >
                {transitionEvent.toStatus === 'Accepted' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                ) : (
                  <Send className="w-5 h-5 text-[#FDE68A]" />
                )}
              </motion.div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black tracking-wide text-[#FDE68A] tabular-nums">
                    {transitionEvent.quoteNumber}
                  </span>
                  <span aria-hidden="true" className="opacity-60">·</span>
                  <span className="text-xs font-semibold opacity-90">
                    {isAr ? 'مسودة' : 'Draft'} &rarr;{' '}
                    <strong className="font-black underline decoration-amber-400/60 underline-offset-4">
                      {isAr
                        ? transitionEvent.toStatus === 'Accepted'
                          ? 'مقبول ومؤكد للتشغيل'
                          : 'تم إرسال العرض للعميل'
                        : transitionEvent.toStatus}
                    </strong>
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black mt-0.5 truncate">
                  {transitionEvent.toStatus === 'Accepted'
                    ? isAr
                      ? `تم قبول وتأكيد عرض سعر ${transitionEvent.travelerName} بنجاح!`
                      : `Proposal Accepted for ${transitionEvent.travelerName} — Ready for Operations!`
                    : isAr
                    ? `تم إرسال عرض سعر ${transitionEvent.travelerName} للعميل!`
                    : `Proposal Sent to ${transitionEvent.travelerName}!`}
                </h3>

                <p className="text-xs opacity-80 mt-0.5 font-mono tabular-nums">
                  {isAr ? 'إجمالي قيمة العرض:' : 'Total Proposal Value:'}{' '}
                  <strong>
                    ${transitionEvent.totalPrice.toLocaleString()} {transitionEvent.currency}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const matched = quotes.find((q) => q.id === transitionEvent.quoteId);
                  if (matched) onViewProposal(matched);
                }}
                className="h-9 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <span>{isAr ? 'استعراض العرض' : 'View Proposal'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setTransitionEvent(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Dismiss'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THE ACTIVE SUB-VIEW CONTENT */}
      {currentTab === 'inbox' && (
        <InboxView
          workspace={workspace}
          inquiries={inquiries}
          uiLang={uiLang}
          onSaveInquiry={onSaveInquiry || (() => {})}
          onProceedToQuote={(inq) => {
            onSelectInquiryForQuote(inq);
            onNavigateSubTab('quotes');
          }}
          onOpenPublicInquiry={onOpenNewInquiry}
        />
      )}

      {currentTab === 'quotes' && (
        <QuoteBuilderView
          workspace={workspace}
          currentUser={currentUser}
          rates={rates}
          initialInquiry={initialInquiry}
          uiLang={uiLang}
          onViewProposal={onViewProposal}
          onSaveQuote={handleSaveQuoteWithTransition}
        />
      )}

      {currentTab === 'pipeline' && (
        <PipelineView
          workspace={workspace}
          quotes={quotes}
          inquiries={inquiries}
          uiLang={uiLang}
          recentlyTransitionedMap={recentlyTransitionedMap}
          onSelectQuote={(quote) => {
            onViewProposal(quote);
          }}
          onUpdateQuoteStatus={handleQuoteStatusChange}
          onNavigateToQuotes={() => onNavigateSubTab('quotes')}
          onProceedToQuote={(inq) => {
            onSelectInquiryForQuote(inq);
            onNavigateSubTab('quotes');
          }}
          onSaveInquiry={onSaveInquiry}
        />
      )}

      {currentTab === 'followups' && (
        <FollowUpsView
          workspace={workspace}
          followUps={followUps}
          quotes={quotes}
          uiLang={uiLang}
          onUpdateFollowUp={onUpdateFollowUp || (() => {})}
          onOpenQuote={(quote) => onViewProposal(quote)}
        />
      )}
    </div>
  );
};

export default SalesWorkspaceView;
