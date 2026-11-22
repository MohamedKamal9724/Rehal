import React, { useState } from 'react';
import { 
  Inbox, Sparkles, Clock, Copy, Check, AlertTriangle, 
  MessageSquare, User, Calendar, MapPin, DollarSign, 
  ChevronRight, ArrowRight, ArrowLeft, ShieldCheck, RefreshCw, Send, FileSpreadsheet
} from 'lucide-react';
import { Inquiry, ParsedRequirements, ProposalLanguage, UILanguage, Workspace } from '../types';
import { parseInquiryWithAi, sanitizeInquiryText } from '../lib/gemini';
import { PROPOSAL_LANGUAGES } from '../lib/constants';
import { UI_TRANSLATIONS } from '../lib/i18n';
import { exportInquiriesToExcel } from '../lib/exportUtils';
import { GuidanceTrigger } from './common/GuidanceTrigger';


interface InboxViewProps {
  inquiries: Inquiry[];
  workspace?: Workspace;
  onSaveInquiry: (inquiry: Inquiry) => void;
  onProceedToQuote: (inquiry: Inquiry) => void;
  onOpenPublicInquiry?: () => void;
  uiLang: UILanguage;
  selectedInquiryId?: string;
}

export const InboxView: React.FC<InboxViewProps> = ({
  inquiries,
  workspace,
  onSaveInquiry,
  onProceedToQuote,
  onOpenPublicInquiry,
  uiLang,
  selectedInquiryId,
}) => {
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(
    inquiries.find(i => i.id === selectedInquiryId) || inquiries[0] || null
  );
  const [mobileTab, setMobileTab] = useState<'queue' | 'detail'>('queue');
  const [isParsing, setIsParsing] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);

  // Form state for pasting new inquiry
  const [pastedText, setPastedText] = useState('');
  const [inquirySource, setInquirySource] = useState<Inquiry['source']>('WhatsApp');
  const [travelerNameInput, setTravelerNameInput] = useState('');
  const [travelerContactInput, setTravelerContactInput] = useState('');

  const t = (key: string) => UI_TRANSLATIONS[uiLang]?.[key] || key;

  const handleRunAiParser = async (targetInquiry: Inquiry) => {
    setIsParsing(true);
    try {
      const parsed = await parseInquiryWithAi(targetInquiry.rawText, targetInquiry.language);
      const updated: Inquiry = {
        ...targetInquiry,
        travelerName: parsed.travelerName || targetInquiry.travelerName,
        language: parsed.language || targetInquiry.language,
        requirements: parsed,
      };
      setSelectedInquiry(updated);
      onSaveInquiry(updated);
    } catch (err) {
      console.error('Error running AI parser:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreatePastedInquiry = async () => {
    if (!pastedText.trim()) return;
    const sanitized = sanitizeInquiryText(pastedText);
    
    // Create preliminary inquiry
    const newInq: Inquiry = {
      id: `inq-${Date.now()}`,
      workspaceId: workspace?.id || 'ws-egypt-live',
      travelerName: travelerNameInput.trim() || 'New Traveler',
      travelerPhone: travelerContactInput.includes('+') ? travelerContactInput : undefined,
      travelerEmail: travelerContactInput.includes('@') ? travelerContactInput : undefined,
      source: inquirySource,
      rawText: sanitized,
      status: 'New',
      assignedAgentId: 'user-primary-owner',
      assignedAgentName: 'Tour Operations',
      receivedAt: new Date().toISOString(),
      language: 'en',
      slaMinutes: 1,
    };

    setPasteModalOpen(false);
    setPastedText('');
    setTravelerNameInput('');
    setTravelerContactInput('');

    // Trigger AI parse immediately
    setIsParsing(true);
    setSelectedInquiry(newInq);
    const parsed = await parseInquiryWithAi(sanitized, 'en');
    newInq.requirements = parsed;
    newInq.language = parsed.language || 'en';
    if (parsed.travelerName && parsed.travelerName !== 'Traveler') {
      newInq.travelerName = parsed.travelerName;
    }
    setIsParsing(false);
    setSelectedInquiry(newInq);
  };

  const getSuggestedReply = (inquiry: Inquiry): string => {
    const lang = inquiry.language || 'en';
    const name = inquiry.travelerName.split(' ')[0] || 'there';

    if (lang === 'ru') {
      return `Здравствуйте, ${name}! Благодарим за обращение к нам. Мы подготовили для вас индивидуальную программу по Египту с пятизвездочными отелями и лицензированным русскоговорящим гидом. Уточните, пожалуйста, удобные даты вылета, чтобы мы зафиксировали за вами места.`;
    }
    if (lang === 'ar') {
      return `أهلاً بك أستاذ ${name}، يسعدنا في فريق تنظيم الرحلات استقبال طلبكم. لقد قمنا بتجهيز مقترح لبرنامجكم الفاخر شاملاً الإقامة والتنقلات الخاصة. هل هناك أي متطلبات خاصة ترغبون بإضافتها قبل إرسال العرض الرسمي؟`;
    }
    if (lang === 'de') {
      return `Guten Tag ${name}, vielen Dank für Ihre Anfrage. Wir haben Ihren individuellen Reisevorschlag mit erstklassigen 5-Sterne-Hotels und deutschsprachigem Reiseleiter ausgearbeitet. Dürfen wir Ihnen das detaillierte Angebot zusenden?`;
    }
    return `Hello ${name}, thank you for reaching out to us! We have curated a bespoke private Egypt itinerary with 5-star accommodations and our expert licensed Egyptologist. May I confirm if you prefer taking the domestic flight or private road transfer between cities?`;
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="relative overflow-hidden bg-white border border-[#e7e7e7] rounded-xl p-5 shadow-2xs">
        <GuidanceTrigger
          sectionKey="sales_inbox"
          uiLang={uiLang}
          pinned={true}
          size="sm"
          label={uiLang === 'ar' ? 'دليل الوارد' : 'Inbox Guide'}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ltr:pr-14 rtl:pl-14">
          <div>
            <h1 className="text-lg font-bold text-[#003580] tracking-tight flex items-center gap-2">
              <Inbox className="w-5 h-5 text-orange-600" />
              <span>{t('inbox.title')}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{t('inbox.subtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenPublicInquiry && (
              <button
                type="button"
                onClick={onOpenPublicInquiry}
                className="h-9 px-3.5 bg-[#0f2035] hover:bg-[#1b365d] text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                title={uiLang === 'ar' ? 'فتح نموذج طلب الرحلات للزوار (B2C Wizard)' : 'Open Public Traveler Inquiry Form (B2C)'}
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>{uiLang === 'ar' ? 'نموذج طلب الرحلات للزوار' : 'Public Visitor Form'}</span>
              </button>
            )}

            {inquiries.length > 0 && workspace && (
              <button
                onClick={() => exportInquiriesToExcel(inquiries, workspace)}
                className="h-9 px-3.5 bg-[#e8f5e9] hover:bg-[#d4edda] text-[#008009] border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                title="Export all inquiries into an Excel spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#008009]" />
                <span>Export Excel</span>
              </button>
            )}

            <button
              onClick={() => setPasteModalOpen(true)}
              className="h-9 px-3.5 bg-gradient-to-r from-[#44200F] via-[#5c2410] to-[#44200F] hover:to-[#ea580c] text-white border border-orange-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-orange-300" />
              <span>{t('inbox.new_inquiry')}</span>
            </button>
          </div>
        </div>
      </div>


      {/* Mobile Queue vs Detail Toggle Pills */}
      <div className="lg:hidden flex items-center p-1 bg-[#f0f6ff] rounded-lg border border-[#006ce4]/20 mb-2">
        <button
          onClick={() => setMobileTab('queue')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
            mobileTab === 'queue'
              ? 'bg-white text-[#003580] shadow-2xs border border-[#e7e7e7]'
              : 'text-slate-600 hover:text-[#003580]'
          }`}
        >
          Inbound Queue ({inquiries.length})
        </button>
        <button
          onClick={() => setMobileTab('detail')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${
            mobileTab === 'detail'
              ? 'bg-white text-[#003580] shadow-2xs border border-[#e7e7e7]'
              : 'text-slate-600 hover:text-[#003580]'
          }`}
        >
          {selectedInquiry ? `Review: ${selectedInquiry.travelerName.split(' ')[0]}` : 'Review Inquiry'}
        </button>
      </div>

      {/* Main split view: Inbox List (left) & Side-by-Side Review (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inquiry list */}
        <div className={`lg:col-span-4 bg-white rounded-xl border border-[#e7e7e7] shadow-2xs divide-y divide-[#e7e7e7] overflow-hidden ${
          mobileTab === 'detail' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="p-3.5 bg-[#f8f9fa] text-xs font-bold text-[#003580] uppercase tracking-wider flex items-center justify-between">
            <span>Inbound Queue ({inquiries.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">Auto-sanitized</span>
          </div>

          <div className="max-h-[640px] overflow-y-auto divide-y divide-[#e7e7e7] p-1.5 space-y-1">
            {inquiries.length > 0 ? (
              inquiries.map(inq => {
                const isSelected = selectedInquiry?.id === inq.id;
                return (
                  <div
                    key={inq.id}
                    onClick={() => {
                      setSelectedInquiry(inq);
                      setMobileTab('detail');
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition text-start ${
                      isSelected 
                        ? 'bg-[#f0f6ff] text-[#003580] border-s-4 border-[#006ce4] border-[#006ce4]/30 font-medium' 
                        : 'hover:bg-[#f8f9fa] text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">{inq.travelerName}</span>
                      <span className="text-[10px] text-slate-500 font-medium shrink-0">
                        {inq.source}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-1 text-[10px]">
                      <span className="font-mono font-bold text-[#795037]">{inq.id.toUpperCase()}</span>
                      <span className={`px-1.5 py-0.2 rounded font-semibold ${
                        inq.status === 'Won' ? 'bg-emerald-50 text-emerald-700' :
                        inq.status === 'Quoted' ? 'bg-amber-50 text-amber-800' :
                        'bg-orange-50 text-orange-800'
                      }`}>{inq.status}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic">
                      "{inq.rawText}"
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-[#d97706] font-semibold">
                        <Clock className="w-3 h-3 text-[#d97706]" />
                        {inq.slaMinutes}m elapsed
                      </span>
                      <span className="uppercase text-[10px] text-slate-500 font-mono">{inq.language}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-[#f0f6ff] border border-[#006ce4]/20 flex items-center justify-center text-[#006ce4] mb-3">
                  <Inbox className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="text-xs font-bold text-[#003580]">Your inbox is clear</div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  No pending inquiries in the queue.
                </p>
                <button
                  onClick={() => setPasteModalOpen(true)}
                  className="mt-3.5 px-3 py-1.5 bg-[#006ce4] hover:bg-[#0057b8] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Manually Create Inquiry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Side-by-Side Review Screen */}
        <div className={`lg:col-span-8 bg-white rounded-xl border border-[#e7e7e7] shadow-2xs p-4 sm:p-5 space-y-5 ${
          mobileTab === 'queue' ? 'hidden lg:block' : 'block'
        }`}>
          {selectedInquiry ? (
            <>
              {/* Mobile Back Button to Inquiries Queue */}
              <div className="lg:hidden pb-1">
                <button
                  onClick={() => setMobileTab('queue')}
                  className="text-xs font-bold text-[#006ce4] hover:text-[#0057b8] flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#f0f6ff] border border-[#006ce4]/30 min-h-[36px]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>Back to Queue ({inquiries.length})</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e7e7e7] gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-[#003580]">{selectedInquiry.travelerName}</h2>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Source: {selectedInquiry.source}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <select
                      value={selectedInquiry.status}
                      onChange={(e) => {
                        const updated: Inquiry = { ...selectedInquiry, status: e.target.value as any };
                        setSelectedInquiry(updated);
                        onSaveInquiry(updated);
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Quoted">Quoting / Quoted</option>
                      <option value="Won">Won</option>
                      <option value="Lost">Lost</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span>Assigned: <strong className="text-slate-700">{selectedInquiry.assignedAgentName || 'Tour Operations'}</strong></span>
                    {selectedInquiry.travelerPhone && (
                      <span>Phone: <strong className="text-slate-700 font-mono">{selectedInquiry.travelerPhone}</strong></span>
                    )}
                    {selectedInquiry.travelerEmail && (
                      <span>Email: <strong className="text-slate-700">{selectedInquiry.travelerEmail}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={isParsing}
                    onClick={() => handleRunAiParser(selectedInquiry)}
                    className="btn-tactile flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-[#f0f6ff] hover:bg-[#e1eeff] border border-[#006ce4]/30 text-[#003580] rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-2xs min-h-[38px] cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#006ce4] ${isParsing ? 'animate-spin' : ''}`} />
                    <span>{isParsing ? 'Extracting...' : 'Extract Fields'}</span>
                  </button>
                  <button
                    onClick={() => onProceedToQuote(selectedInquiry)}
                    className="btn-tactile flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 bg-[#006ce4] hover:bg-[#0057b8] active:bg-[#003b95] text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition min-h-[38px] cursor-pointer"
                  >
                    <span>{uiLang === 'ar' ? 'إنشاء عرض سعر' : 'Create Quote'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>

              {/* Side-by-Side Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Panel: Original Message */}
                <div className="bg-[#f8f9fa] border border-[#e7e7e7] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#003580] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>{t('inbox.raw_message')}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Original</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-lg border border-[#e7e7e7] text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                      {selectedInquiry.rawText}
                    </div>
                  </div>

                  {/* Redaction Notice */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-[#008009] bg-[#e8f5e9] px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#008009] shrink-0" />
                    <span>Privacy Shield active: Sensitive numbers automatically masked.</span>
                  </div>
                </div>

                {/* Right Panel: Extracted Structured Requirements */}
                <div className="bg-[#f8f9fa] border border-[#e7e7e7] rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-[#003580] uppercase tracking-wider flex items-center justify-between">
                    <span>{t('inbox.extracted_fields')}</span>
                    <span className="text-[10px] text-[#008009] bg-[#e8f5e9] px-2 py-0.5 rounded font-bold">
                      Agent Confirmed
                    </span>
                  </div>

                  {selectedInquiry.requirements ? (
                    <div className="space-y-2.5 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2.5 rounded-lg border border-[#e7e7e7]">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Travel Duration</span>
                          <span className="font-bold text-slate-900 tabular-nums">{selectedInquiry.requirements.durationDays} Days</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-[#e7e7e7]">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Group Pax</span>
                          <span className="font-bold text-slate-900 tabular-nums">
                            {selectedInquiry.requirements.group.adults} Adults
                            {selectedInquiry.requirements.group.children.length > 0 && `, ${selectedInquiry.requirements.group.children.length} Kids`}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-[#e7e7e7]">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">Target Cities</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedInquiry.requirements.cities.map(c => (
                            <span key={c} className="px-2 py-0.5 rounded bg-[#f0f6ff] text-[#003580] font-bold text-[11px] border border-[#006ce4]/20">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-[#e7e7e7]">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">Accommodation Tier</span>
                        <span className="font-bold text-[#ffb700] text-sm">
                          {'★'.repeat(selectedInquiry.requirements.hotelStarRating || 5)} <span className="text-xs text-slate-900 font-bold">5-Star Luxury</span>
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-[#e7e7e7]">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">Interests &amp; Requests</span>
                        <span className="text-slate-700 block mt-0.5">
                          {selectedInquiry.requirements.interests.join(', ') || 'Custom cultural itinerary'}
                        </span>
                      </div>

                      {/* Ambiguous clarifying questions */}
                      {selectedInquiry.requirements.clarifyingQuestions && selectedInquiry.requirements.clarifyingQuestions.length > 0 && (
                        <div className="bg-[#fffbe8] p-2.5 rounded-lg border border-[#ffb700]/50 text-slate-900">
                          <span className="text-[10px] font-bold uppercase block text-[#003580] flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-[#d97706]" />
                            Clarification Needed:
                          </span>
                          <p className="text-[11px] mt-0.5 text-slate-700">
                            {selectedInquiry.requirements.clarifyingQuestions[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 bg-white rounded-lg border border-dashed border-[#e7e7e7]">
                      <p className="text-xs">Click "AI Parse Requirements" above to extract structured trip dates, pax, cities, and preferences.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested Reply Draft (Never auto-sent) */}
              <div className="bg-[#f0f6ff] border border-[#006ce4]/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#003580] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#006ce4]" />
                    <span>{t('inbox.suggested_reply')} ({selectedInquiry.language.toUpperCase()})</span>
                  </span>
                  <span className="text-[11px] text-[#006ce4] font-medium">Copy &amp; paste to chat (never auto-sent)</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-[#e7e7e7] text-xs text-slate-800 leading-relaxed font-sans">
                  {getSuggestedReply(selectedInquiry)}
                </div>
                <div className="mt-2.5 flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getSuggestedReply(selectedInquiry));
                      setCopiedDraft(true);
                      setTimeout(() => setCopiedDraft(false), 2000);
                    }}
                    className="px-3.5 py-1.5 bg-[#006ce4] hover:bg-[#0057b8] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    {copiedDraft ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDraft ? t('common.copied') : 'Copy Draft Reply'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 px-4 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#f0f6ff] border border-[#006ce4]/20 flex items-center justify-center text-[#006ce4] mb-4 shadow-2xs">
                <Inbox className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-[#003580] tracking-tight">Your inbox is clear</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                No active inquiry selected for review. Paste a traveler chat from WhatsApp or connect a webhook to test automated entity extraction.
              </p>
              <button
                onClick={() => setPasteModalOpen(true)}
                className="mt-5 px-4 py-2 bg-[#006ce4] hover:bg-[#0057b8] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Manually Create Inquiry</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Paste New Inquiry */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#e7e7e7] w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-[#003580] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffb700]" />
              <span>Paste Traveler Chat or Email</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Traveler Name</label>
                <input
                  type="text"
                  placeholder="e.g. John & Sarah Doe"
                  value={travelerNameInput}
                  onChange={(e) => setTravelerNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e7e7e7] rounded-lg text-xs focus:border-[#006ce4] focus:ring-1 focus:ring-[#006ce4] outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Channel Source</label>
                <select
                  value={inquirySource}
                  onChange={(e) => setInquirySource(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#e7e7e7] rounded-lg text-xs focus:border-[#006ce4] outline-hidden"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="Web Form">Web Form</option>
                  <option value="B2B Partner">B2B Partner</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Raw Traveler Message</label>
              <textarea
                rows={5}
                placeholder="Paste the full chat message (English, Russian, German, French, Spanish, or Arabic)..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full p-3 border border-[#e7e7e7] rounded-lg text-xs font-sans text-slate-900 focus:border-[#006ce4] focus:ring-1 focus:ring-[#006ce4] outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 border border-[#e7e7e7] rounded-lg text-xs text-slate-700 hover:bg-[#f8f9fa] cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={!pastedText.trim()}
                onClick={handleCreatePastedInquiry}
                className="px-4 py-2 bg-[#006ce4] hover:bg-[#0057b8] text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#ffb700]" />
                <span>Save &amp; Parse with AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
