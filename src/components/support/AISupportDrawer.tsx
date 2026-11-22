import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X, Send, Copy, Check, Trash2,
  User, MessageCircle, Compass,
  Mic, MicOff, KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SupportChatMessage,
  QUICK_SUGGESTION_CHIPS,
  getFallbackSupportResponse,
  OperationalKnowledgeContext
} from '../../lib/supportKnowledge';
import { UILanguage, Quote, Inquiry, Workspace } from '../../types';
import { TripFile, loadTrips } from '../../lib/tripStore';
import { repository } from '../../lib/storage';
import { FarisAvatarIcon } from '../common/FarisAvatarIcon';
import { buildWhatsAppTripDispatchLink } from '../../lib/whatsappDispatch';
import { purgeLegacyChatArtifacts, sanitizeChatMessages } from '../../lib/chatSanitization';

interface AISupportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  userRole?: 'traveler' | 'operator';
  isFullPageView?: boolean;
  onNavigateToTab?: (tab: string) => void;
  onApplyPasscode?: (code: string) => void;
  trips?: TripFile[];
  quotes?: Quote[];
  inquiries?: Inquiry[];
  workspace?: Workspace;
}

const STORAGE_KEY = 'rihal_faris_concierge_chat';

// Fast-path client memoization map for instant query retrieval
const LOCAL_RESPONSE_CACHE = new Map<string, SupportChatMessage>();

export const AISupportDrawer: React.FC<AISupportDrawerProps> = ({
  isOpen,
  onClose,
  uiLang,
  userRole = 'traveler',
  isFullPageView = false,
  onNavigateToTab,
  onApplyPasscode,
  trips: propsTrips,
  quotes: propsQuotes,
  inquiries: propsInquiries,
  workspace: propsWorkspace,
}) => {
  const isAr = uiLang === 'ar';
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Operational Context (from props or live storage layer)
  const operationalContext = useMemo<OperationalKnowledgeContext>(() => {
    try {
      const activeTrips = propsTrips && propsTrips.length > 0 ? propsTrips : loadTrips();
      const ws = propsWorkspace || repository.getWorkspace();
      const activeQuotes = propsQuotes && propsQuotes.length > 0 ? propsQuotes : repository.getQuotes(ws.id);
      const activeInquiries = propsInquiries && propsInquiries.length > 0 ? propsInquiries : repository.getInquiries(ws.id);
      return {
        trips: activeTrips,
        quotes: activeQuotes,
        inquiries: activeInquiries,
        workspace: ws,
      };
    } catch {
      return {
        trips: propsTrips || [],
        quotes: propsQuotes || [],
        inquiries: propsInquiries || [],
        workspace: propsWorkspace,
      };
    }
  }, [propsTrips, propsQuotes, propsInquiries, propsWorkspace]);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice note / Speech dictation toggle
  const handleToggleVoiceInput = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setInputText(isAr ? 'أين فوج ألكسندر اليوم وحالة تشغيله؟' : "Where is Mr. Alexander's tour group today?");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = isAr ? 'ar-EG' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInputText(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening, isAr]);

  // Concise, clear welcome message
  const initialMessages: SupportChatMessage[] = useMemo(() => {
    return [
      {
        id: 'msg_welcome',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        content: isAr
          ? userRole === 'operator'
            ? `أهلاً بحضرتك! معاك **فارس** من فريق عمليات رِحال.
يمكنك الاستعلام فوراً عن بيانات التطبيق الحية:
• **موقع الأفواج اليوم:** استعلم عن موقع أي وفد وبيانات المرشد والسائق.
• **الفنادق وكشوف الغرف:** راجع تأكيدات الفنادق مثل **STG-LXR-9821** وتوزيع الغرف.
• **العروض والتسعير:** احسب التكلفة وهامش الربح وأرسل كود الرحلة عبر واتساب.`
            : `أهلاً بك! معاك **فارس**، مرافقك الشخصي في رِحال.
يمكنني مساعدتك في كل ما يخص رحلتك في مصر:
• **كود الرحلة:** أدخل كود الحجز مثل **EG-CAI-7491** لعرض برنامجك اليومي وبيانات المرشد.
• **الفنادق والتنقلات:** راجع أرقام تأكيد الإقامة والرحلات النيلية المعتمدة.
• **التواصل المباشر:** تواصل مع الشركة المنظمة لرحلتك عبر واتساب في أي وقت.`
          : userRole === 'operator'
            ? `Welcome! I'm **Faris** at the RIHAL Operations Desk.
Your live trip database, hotel confirmations, and rooming lists are ready:
• **Group Locations:** Check where any guest group is touring today with their guide and driver.
• **Rooming & Hotels:** Inspect passenger room allocations and confirmation codes like **STG-LXR-9821**.
• **Quotes & Dispatch:** Build multi-currency proposals and share passcodes via WhatsApp.`
            : `Welcome! I'm **Faris**, your personal RIHAL Egypt Concierge.
I can help you with everything inside your trip:
• **Trip Passcode:** Enter your booking code (e.g. **EG-CAI-7491**) to view daily schedules, guide, and chauffeur.
• **Verified Stays:** Check hotel and Nile cruise confirmations at a glance.
• **Direct Support:** Connect directly with your accredited Egyptian tour agency via WhatsApp.`,
      },
    ];
  }, [isAr, userRole]);

  const [messages, setMessages] = useState<SupportChatMessage[]>(() => {
    try {
      purgeLegacyChatArtifacts(STORAGE_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeChatMessages(parsed);
          if (sanitized.length > 0) {
            return sanitized.slice(-5);
          }
        }
      }
    } catch {}
    return initialMessages;
  });

  // Persist only the last 5 chats across drawer toggle & reload sessions
  useEffect(() => {
    try {
      const trimmed = messages.slice(-5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen || isFullPageView) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isFullPageView, isSending]);

  // Fast-path instant evaluation: checks if query can be answered locally
  const getInstantLocalMatch = useCallback((query: string): SupportChatMessage | null => {
    const q = query.toLowerCase().trim();
    const cacheKey = `${userRole}_${q}`;
    if (LOCAL_RESPONSE_CACHE.has(cacheKey)) {
      return LOCAL_RESPONSE_CACHE.get(cacheKey)!;
    }

    const instantTriggers = [
      'كود', 'حجز', 'passcode', 'code', 'واتساب', 'whatsapp', 'تواصل', 'contact',
      'برنامج', 'رحل', 'سعر', 'أسعار', 'package', 'price', 'tour', 'cairo', 'luxor', 'aswan', 'dahab', 'siwa',
      'عرض سعر', 'quote', 'تسعير', 'pricing', 'margin', 'هامش', 'عملات', 'سعر الصرف', 'fx', 'طبخ', 'recipe', 'python', 'code to',
      'alexander', 'ألكسندر', 'sarah', 'سارة', 'jenkins', 'wright',
      'steigenberger', 'شتايجنبرجر', 'شتيجنبرجر', 'marriott', 'ماريوت', 'mena', 'مينا',
      'فندق', 'hotel', 'booking', 'status', 'موقف', 'رحلات نشطة', 'active trips', 'عروض', 'quotes', 'where is', 'أين', 'فين',
      'rooming', 'تسكين', 'توزيع الغرف', 'غرف', 'غرفة', 'manifest', 'dietary', 'وجبات',
      'ارسال كود', 'إرسال كود', 'مشاركة كود', 'dispatch', 'مكتبة الأسعار', 'عقود', 'rates', 'إكسيل', 'اكسيل', 'excel',
      'حج', 'عمرة', 'hajj', 'umrah', 'مكة', 'المدينة', 'نسك', 'nusuk',
      'ستوري', 'ستوريز', 'قصص', 'انستا', 'انستغرام', 'stories', 'feed', 'سوشيال', 'social', 'صور',
      'تقييم الموظفين', 'أفضل الموظفين', 'top performers', 'staff', 'فريق العمل'
    ];

    const shouldResolveLocally = instantTriggers.some(t => q.includes(t));
    if (shouldResolveLocally) {
      const fallback = getFallbackSupportResponse(query, userRole, operationalContext);
      const resMsg: SupportChatMessage = {
        id: `local_${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        content: fallback.content.replace(/\[STAGE-(1|2|3): [A-Z_]+\]\s*/i, '').trim(),
        suggestedActions: fallback.suggestedActions,
        ticketId: fallback.ticketId,
      };
      LOCAL_RESPONSE_CACHE.set(cacheKey, resMsg);
      return resMsg;
    }

    return null;
  }, [userRole, operationalContext]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isSending) return;

    setInputText('');
    const userMsg: SupportChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev.slice(-4), userMsg]);
    setIsSending(true);

    const startTime = Date.now();
    const minThinkingTimeMs = 180;

    const instantMatch = getInstantLocalMatch(query);
    if (instantMatch) {
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, minThinkingTimeMs - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
      setMessages((prev) => [...prev.slice(-4), instantMatch]);
      setIsSending(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: query,
          conversationHistory: messages.slice(-4),
          role: userRole,
          language: isAr ? 'ar' : 'en',
          operationalContext,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Support service response error');
      }

      const data = await res.json();
      const botMsg: SupportChatMessage = {
        id: data.id || `bot_${Date.now()}`,
        sender: 'assistant',
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString(),
        suggestedActions: data.suggestedActions,
        ticketId: data.ticketId,
      };

      const elapsed = Date.now() - startTime;
      if (elapsed < minThinkingTimeMs) {
        await new Promise((resolve) => setTimeout(resolve, minThinkingTimeMs - elapsed));
      }

      setMessages((prev) => [...prev.slice(-4), botMsg]);
    } catch {
      const fallback = getFallbackSupportResponse(query, userRole, operationalContext);
      const fallbackMsg: SupportChatMessage = {
        id: `bot_fallback_${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        content: fallback.content.replace(/\[STAGE-(1|2|3): [A-Z_]+\]\s*/i, '').trim(),
        suggestedActions: fallback.suggestedActions,
        ticketId: fallback.ticketId,
      };

      const elapsed = Date.now() - startTime;
      if (elapsed < minThinkingTimeMs) {
        await new Promise((resolve) => setTimeout(resolve, minThinkingTimeMs - elapsed));
      }

      setMessages((prev) => [...prev.slice(-4), fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
      if (onApplyPasscode) {
        onApplyPasscode(code);
      }
    } catch {}
  };

  const handleCopyFullMessage = (msgId: string, content: string) => {
    try {
      const plain = content.replace(/\*\*/g, '');
      navigator.clipboard.writeText(plain);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {}
  };

  const handleClearHistory = () => {
    setMessages(initialMessages);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // High-contrast, clean typography renderer (no nested cards inside chat bubbles)
  const renderMessageContent = (content: string, isUser: boolean) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
      const cleanLine = isBullet ? trimmed.replace(/^[•\-]\s*/, '') : line;

      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const text = part.slice(2, -2);

          // 1-Click Copyable Passcode Chip
          const isCode = /^(EG-[A-Z]+-\d+|[A-Z]{3,4}-[A-Z]{3}-\d+|RHL-[A-Z0-9-]+)$/.test(text.trim());
          if (isCode && !isUser) {
            const codeVal = text.trim();
            const isJustCopied = copiedCode === codeVal;
            return (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleCopyCode(codeVal)}
                title={isAr ? 'اضغط لنسخ الكود' : 'Click to copy code'}
                className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#2A1409] font-mono font-bold text-xs border border-[#C4A177] cursor-pointer transition-colors"
              >
                {isJustCopied ? (
                  <Check className="w-3 h-3 text-emerald-700 shrink-0" />
                ) : (
                  <KeyRound className="w-3 h-3 text-[#795037] shrink-0" />
                )}
                <span>{codeVal}</span>
              </button>
            );
          }

          return (
            <strong
              key={pIdx}
              className={isUser ? 'font-bold text-white' : 'font-bold text-[#2A1409]'}
            >
              {text}
            </strong>
          );
        }
        return part;
      });

      if (isBullet && !isUser) {
        return (
          <div key={idx} className="flex items-start gap-2 ps-1 leading-relaxed text-[#1E1B18]">
            <span aria-hidden="true" className="text-[#B4823E] font-bold mt-0.5 shrink-0">
              •
            </span>
            <div className="flex-1 text-[13px]">{formattedParts}</div>
          </div>
        );
      }

      return (
        <p key={idx} className={trimmed === '' ? 'h-1.5' : 'leading-relaxed'}>
          {formattedParts}
        </p>
      );
    });
  };

  // Single quick suggestion bar filtered automatically for current role
  const relevantChips = useMemo(() => {
    return QUICK_SUGGESTION_CHIPS.filter(
      (c) => c.category === userRole || c.category === 'general'
    );
  }, [userRole]);

  const contentUI = (
    <div
      className="flex flex-col h-full w-full bg-[#F8F6F2] text-[#1E1B18] select-text overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. CLEAN HIGH-CONTRAST HEADER */}
      <div className="px-4 py-3.5 bg-white text-[#2A1409] shrink-0 border-b border-[#EDE0CC] flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <FarisAvatarIcon size={40} showStatusIndicator={true} className="w-10 h-10 shrink-0" />

          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-[#2A1409] truncate leading-tight">
              {isAr ? 'فارس · مساعد رِحال' : 'Faris · RIHAL Concierge'}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-[#795037] truncate mt-0.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{isAr ? 'متصل ببيانات التطبيق' : 'Synced with Live DB'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {operationalContext.trips?.length || 2} {isAr ? 'رحلات نشطة' : 'Trips'}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Header Controls: Reset & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleClearHistory}
            className="w-9 h-9 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] transition cursor-pointer flex items-center justify-center border border-[#EDE0CC]"
            title={isAr ? 'محادثة جديدة' : 'New Conversation'}
            aria-label={isAr ? 'محادثة جديدة' : 'New Conversation'}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] transition cursor-pointer flex items-center justify-center border border-[#EDE0CC]"
            title={isAr ? 'إغلاق' : 'Close'}
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CHAT STREAM — High Contrast, Uncluttered Readability */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#F8F6F2]">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isCopied = copiedMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {isUser ? (
                <div className="w-8 h-8 rounded-full bg-[#44200F] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <FarisAvatarIcon size={32} className="w-8 h-8 shrink-0 mt-0.5" />
              )}

              <div
                className={`max-w-[88%] sm:max-w-lg rounded-2xl text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-[#44200F] text-white rounded-ee-xs px-4 py-3 shadow-xs'
                    : 'bg-white text-[#1E1B18] border border-[#E6DDD0] rounded-ss-xs shadow-2xs overflow-hidden'
                }`}
              >
                {/* Minimal Top Meta Bar on Assistant Bubble */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[#F3ECE2] bg-[#FAF8F5]">
                    <span className="font-bold text-xs text-[#2A1409]">
                      {isAr ? 'فارس' : 'Faris'}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#795037] font-mono tabular-nums">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyFullMessage(msg.id, msg.content)}
                        className="p-1 rounded-md text-[#795037] hover:text-[#2A1409] hover:bg-[#EDE0CC]/60 transition cursor-pointer"
                        title={isAr ? 'نسخ الرد' : 'Copy response'}
                        aria-label={isAr ? 'نسخ الرد' : 'Copy response'}
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Readable Body */}
                <div className={isUser ? 'space-y-1 font-sans text-white' : 'px-4 py-3 space-y-1.5 font-sans text-[#1E1B18]'}>
                  {renderMessageContent(msg.content, isUser)}

                  {/* Equal-Height Inline Action Buttons */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="pt-3 mt-2.5 border-t border-[#F3ECE2] flex flex-wrap gap-2">
                      {msg.suggestedActions.map((action, i) => {
                        const isWhatsapp = action.actionType === 'whatsapp';
                        const isCopyCode = action.actionType === 'copy_passcode';

                        if (isWhatsapp) {
                          const code = action.actionPayload || 'EG-CAI-7491';
                          const targetTrip = operationalContext.trips?.find(
                            (t) =>
                              t.tourPasscode === code ||
                              t.fileNumber === code ||
                              t.travelerName.toLowerCase().includes(code.toLowerCase())
                          );
                          const waHref = targetTrip
                            ? buildWhatsAppTripDispatchLink({
                                trip: targetTrip,
                                workspace: operationalContext.workspace,
                                uiLang,
                              })
                            : `https://wa.me/?text=${encodeURIComponent(
                                isAr
                                  ? `مرحباً بك مع رِحال! كود حجز رحلتك هو: *${code}*`
                                  : `Welcome with RIHAL! Your tour access code is: *${code}*`
                              )}`;

                          return (
                            <a
                              key={i}
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl font-bold text-xs transition cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shrink-0"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-white shrink-0" />
                              <span>{isAr ? action.labelAr : action.labelEn}</span>
                            </a>
                          );
                        }

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (isCopyCode && action.actionPayload) {
                                handleCopyCode(action.actionPayload);
                              } else if (action.actionType === 'navigate' && action.actionPayload && onNavigateToTab) {
                                onNavigateToTab(action.actionPayload);
                                onClose();
                              }
                            }}
                            className={`h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                              isCopyCode
                                ? 'bg-[#FAF7F2] hover:bg-[#EDE0CC] border border-[#C4A177] text-[#2A1409] font-mono'
                                : 'bg-[#44200F] hover:bg-[#5C2D16] text-white'
                            }`}
                          >
                            {isCopyCode ? (
                              copiedCode === action.actionPayload ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                                  <span>{isAr ? action.labelAr : action.labelEn}</span>
                                </>
                              )
                            ) : (
                              <>
                                <Compass className="w-3.5 h-3.5 text-white shrink-0" />
                                <span>{isAr ? action.labelAr : action.labelEn}</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* User Message Timestamp */}
                {isUser && (
                  <div className="text-[10px] mt-1 flex items-center justify-end text-white/75 font-mono tabular-nums">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isSending && (
          <div className="flex items-start gap-2.5 animate-in fade-in duration-150">
            <FarisAvatarIcon size={32} className="w-8 h-8 shrink-0" />
            <div className="bg-white border border-[#E6DDD0] rounded-2xl rounded-ss-xs px-4 py-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-[#2A1409] font-semibold">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#44200F] animate-bounce [animation-duration:0.8s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#795037] animate-bounce [animation-duration:0.8s] [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4A177] animate-bounce [animation-duration:0.8s] [animation-delay:0.3s]" />
                </div>
                <span>{isAr ? 'جاري البحث في بيانات التطبيق...' : 'Checking live records...'}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. SINGLE CLEAN QUICK-ACTIONS STRIP (No duplicate top grid) */}
      <div className="px-3.5 py-2.5 bg-white border-t border-[#EDE0CC] shrink-0">
        <div className="luxury-tab-bar flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap">
          {relevantChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleSendMessage(isAr ? chip.promptAr : chip.promptEn)}
              disabled={isSending}
              className="h-9 shrink-0 px-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE0CC] border border-[#E6DDD0] hover:border-[#C4A177] text-xs font-semibold text-[#2A1409] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap active:scale-95 inline-flex items-center justify-center"
            >
              {isAr ? chip.labelAr : chip.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CLEAN COMPOSER BAR */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#EDE0CC] shrink-0 pb-safe">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative rounded-2xl border border-[#DDD2C2] focus-within:border-[#44200F] focus-within:ring-2 focus-within:ring-[#44200F]/10 bg-[#F8F6F2] focus-within:bg-white transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isAr
                  ? 'اسأل فارس عن رحلة، كود حجز، فندق، أو كشف تسكين...'
                  : 'Ask Faris about a trip, booking code, hotel, or rooming list...'
              }
              className="w-full bg-transparent px-3.5 py-2.5 text-[13px] text-[#1E1B18] outline-none resize-none placeholder:text-[#8C7B6E] max-h-24 leading-normal font-sans"
            />
          </div>

          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 border ${
              isListening
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#2A1409] border-[#DDD2C2]'
            }`}
            title={isListening ? (isAr ? 'إيقاف الاستماع' : 'Stop Listening') : (isAr ? 'بحث صوتي' : 'Voice Input')}
            aria-label={isAr ? 'بحث صوتي' : 'Voice Input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-10 h-10 rounded-2xl bg-[#44200F] hover:bg-[#5C2D16] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
            title={isAr ? 'إرسال' : 'Send'}
            aria-label={isAr ? 'إرسال' : 'Send'}
          >
            <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </button>
        </form>
      </div>
    </div>
  );

  // Full-page tab view inside main container
  if (isFullPageView) {
    return (
      <div className="h-[calc(100vh-8.5rem)] w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-lg border border-[#EDE0CC] bg-[#F8F6F2]">
        {contentUI}
      </div>
    );
  }

  // Slide-over Drawer view: FULL SCREEN on mobile, tailored slide-panel on desktop
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity cursor-pointer hidden sm:block"
          />

          <div className="fixed inset-0 sm:inset-y-0 sm:start-auto sm:end-0 w-full sm:max-w-md md:max-w-lg h-full flex">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full h-full bg-[#F8F6F2] shadow-2xl flex flex-col sm:border-s sm:border-[#EDE0CC] overflow-hidden"
            >
              {contentUI}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
