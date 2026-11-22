import React, { useMemo, useState } from 'react';
import { 
  Clock, MessageCircle, Check, CheckCircle2, 
  Bell, ExternalLink, Eye, Flame, Edit3
} from 'lucide-react';
import { FollowUpTask, Quote, UILanguage, Workspace } from '../types';
import { UI_TRANSLATIONS } from '../lib/i18n';
import { buildWhatsAppUrl } from '../lib/phone';
import { GuidanceTrigger } from './common/GuidanceTrigger';

interface FollowUpsViewProps {
  workspace: Workspace;
  followUps: FollowUpTask[];
  quotes?: Quote[];
  uiLang: UILanguage;
  onUpdateFollowUp: (id: string, updates: Partial<FollowUpTask>) => void;
  onOpenQuote?: (quote: Quote) => void;
}

function formatRelativeViewTime(iso: string | undefined, isAr: boolean): string {
  if (!iso) return isAr ? 'لم يُفتح بعد' : 'Not opened yet';
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return isAr ? `منذ ${hrs} س` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return isAr ? `منذ ${days} يوم` : `${days}d ago`;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  workspace,
  followUps,
  quotes = [],
  uiLang,
  onUpdateFollowUp,
  onOpenQuote,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const isAr = uiLang === 'ar';
  const t = (key: string) => UI_TRANSLATIONS[uiLang]?.[key] || key;

  const quoteById = useMemo(() => {
    const map = new Map<string, Quote>();
    quotes.forEach(q => map.set(q.id, q));
    return map;
  }, [quotes]);

  // Order: pending first, then by proposal views desc, then lastViewedAt recency desc
  const sortedFollowUps = useMemo(() => {
    return [...followUps].sort((a, b) => {
      const aDone = Boolean(a.done || a.status === 'Completed');
      const bDone = Boolean(b.done || b.status === 'Completed');
      if (aDone !== bDone) return aDone ? 1 : -1;

      const qa = quoteById.get(a.quoteId);
      const qb = quoteById.get(b.quoteId);

      const viewsA = qa?.viewCount ?? 0;
      const viewsB = qb?.viewCount ?? 0;
      if (viewsB !== viewsA) return viewsB - viewsA;

      const lastA = qa?.lastViewedAt ? new Date(qa.lastViewedAt).getTime() : 0;
      const lastB = qb?.lastViewedAt ? new Date(qb.lastViewedAt).getTime() : 0;
      if (lastB !== lastA) return lastB - lastA;

      if (Boolean(b.isUrgent) !== Boolean(a.isUrgent)) return b.isUrgent ? 1 : -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });
  }, [followUps, quoteById]);

  const pendingCount = followUps.filter(f => !f.done && f.status !== 'Completed').length;

  const getDraftMessage = (task: FollowUpTask) => {
    return draftEdits[task.id] ?? task.suggestedMessage;
  };

  const handleCopyAndWhatsApp = (task: FollowUpTask) => {
    const message = getDraftMessage(task);
    navigator.clipboard.writeText(message);
    setCopiedId(task.id);
    setTimeout(() => setCopiedId(null), 2500);

    if (task.travelerPhone) {
      window.open(buildWhatsAppUrl(task.travelerPhone, message), '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveDraft = (taskId: string) => {
    const updated = draftEdits[taskId];
    if (updated !== undefined && updated.trim()) {
      onUpdateFollowUp(taskId, { suggestedMessage: updated.trim() });
    }
    setEditingDraftId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header bar with Guidance */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-[#EDE0CC] p-5 shadow-2xs">
        <GuidanceTrigger
          sectionKey="sales_pipeline"
          uiLang={uiLang}
          pinned={true}
          size="sm"
          label={isAr ? 'دليل المتابعات' : 'Follow-ups Guide'}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ltr:pr-14 rtl:pl-14">
          <div>
            <h1 className="text-lg font-bold text-[#44200F] tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>{t('followups.title')}</span>
            </h1>
            <p className="text-xs text-[#795037] mt-0.5">{t('followups.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* High-Intent Telemetry Conversion Rule */}
      <div className="bg-[#FAF7F2] border border-[#C4A177]/60 rounded-xl p-4 flex items-center gap-3 text-[#44200F] shadow-2xs">
        <Bell className="w-4 h-4 text-[#795037] shrink-0" />
        <div className="text-xs leading-relaxed text-[#795037]">
          <span className="font-bold text-[#44200F]">
            {isAr ? 'قاعدة التحويل الذكية:' : 'Conversion Pattern:'}
          </span>{' '}
          {isAr
            ? 'العروض التي تتجاوز 3 مشاهدات من العميل تحقق نسبة تحويل أعلى بـ 65% عند متابعتها خلال ساعتين من آخر مشاهدة.'
            : 'Proposals with 3+ traveler views convert 65% higher when followed up within 2 hours of telemetry detection.'}
        </div>
      </div>

      {/* Today's Queue */}
      <div className="bg-white rounded-xl border border-[#EDE0CC] shadow-2xs divide-y divide-[#EDE0CC]/60 overflow-hidden">
        <div className="p-4 bg-[#FAF7F2] flex items-center justify-between">
          <span className="text-xs font-bold text-[#44200F] uppercase tracking-wider">
            {t('followups.today_queue')} ({pendingCount} {isAr ? 'معلقة' : 'Pending'})
          </span>
          <span className="text-xs text-[#795037]">
            {isAr ? 'مرتبة حسب عدد المشاهدات وآخر تفاعل' : 'Ordered by proposal views & view recency'}
          </span>
        </div>

        <div className="divide-y divide-[#EDE0CC]/60">
          {sortedFollowUps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              {isAr ? 'لا توجد مهام متابعة مجدولة حالياً.' : 'No follow-up tasks queued yet.'}
            </div>
          ) : (
            sortedFollowUps.map(task => {
              const linkedQuote = quoteById.get(task.quoteId);
              const viewCount = linkedQuote?.viewCount ?? 0;
              const isHighIntent = viewCount >= 3;
              const isCompleted = Boolean(task.done || task.status === 'Completed');
              const isEditing = editingDraftId === task.id;
              const curr = linkedQuote?.displayCurrency || linkedQuote?.targetCurrency || 'EGP';
              const sellTotal = linkedQuote?.totals?.totalSell ?? linkedQuote?.totalPriceQuoteCurrency ?? 0;

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 transition ${
                    isCompleted ? 'opacity-65 bg-slate-50/40' : 'hover:bg-[#FAF7F2]/50'
                  }`}
                >
                  <div className="space-y-2.5 flex-1 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-[#44200F]">{task.travelerName}</span>
                      {linkedQuote && (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#EDE0CC] text-[#795037]">
                          {linkedQuote.quoteNumber} · {curr} {sellTotal.toLocaleString()}
                        </span>
                      )}
                      {viewCount > 0 && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                          isHighIntent
                            ? 'bg-orange-100 text-orange-900 border border-orange-300'
                            : 'bg-amber-50 text-[#795037] border border-[#EDE0CC]'
                        }`}>
                          {isHighIntent ? <Flame className="w-3 h-3 text-orange-600" /> : <Eye className="w-3 h-3" />}
                          <span>{viewCount} {isAr ? 'مشاهدات' : 'views'}</span>
                          {linkedQuote?.lastViewedAt && (
                            <span className="text-[10px] opacity-80">
                              · {formatRelativeViewTime(linkedQuote.lastViewedAt, isAr)}
                            </span>
                          )}
                        </span>
                      )}
                      {(task.isUrgent || isHighIntent) && !isCompleted && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {isHighIntent ? (isAr ? 'أولوية قصوى (<2س)' : 'Priority <2h Window') : (isAr ? 'أولوية SLA' : 'Priority SLA')}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#795037]">{task.triggerReason}</p>

                    {/* Editable WhatsApp Nudge Draft */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={getDraftMessage(task)}
                          onChange={e => setDraftEdits(prev => ({ ...prev, [task.id]: e.target.value }))}
                          className="w-full p-3 rounded-lg border border-[#C4A177] bg-white text-xs text-[#44200F] leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-[#C4A177]/30"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveDraft(task.id)}
                            className="h-7 px-3 rounded-lg bg-[#44200F] text-[#FAF7F2] text-[11px] font-bold cursor-pointer"
                          >
                            {isAr ? 'حفظ المسودة' : 'Save Draft'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDraftId(null)}
                            className="h-7 px-3 rounded-lg border border-[#EDE0CC] text-[11px] font-semibold text-slate-600 cursor-pointer"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#EDE0CC] text-xs text-[#44200F] leading-relaxed flex items-start justify-between gap-2">
                        <span className="italic">"{getDraftMessage(task)}"</span>
                        <button
                          type="button"
                          onClick={() => setEditingDraftId(task.id)}
                          title={isAr ? 'تعديل نص رسالة الواتساب' : 'Edit WhatsApp nudge draft'}
                          className="p-1 text-[#795037] hover:text-[#44200F] rounded shrink-0 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {linkedQuote && onOpenQuote && (
                      <button
                        type="button"
                        onClick={() => onOpenQuote(linkedQuote)}
                        className="h-9 px-3.5 bg-white hover:bg-[#FAF7F2] text-[#44200F] border border-[#C4A177] rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                        <span>{isAr ? 'فتح العرض' : 'Open Quote'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyAndWhatsApp(task)}
                      className="h-9 px-3.5 bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedId === task.id ? <Check className="w-3.5 h-3.5 text-[#C4A177] shrink-0" /> : <MessageCircle className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />}
                      <span>{copiedId === task.id ? t('common.copied') : t('followups.one_click_whatsapp')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateFollowUp(task.id, {
                        status: isCompleted ? 'Pending' : 'Completed',
                        done: !isCompleted,
                      })}
                      className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        isCompleted
                          ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                          : 'border-[#EDE0CC] text-[#795037] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{isCompleted ? (isAr ? 'مكتمل' : 'Completed') : (isAr ? 'تمت المتابعة' : 'Mark Done')}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

