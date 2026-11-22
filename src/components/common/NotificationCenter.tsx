import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Check, 
  Clock, 
  Inbox, 
  FileText, 
  ArrowUpRight, 
  Flame, 
  SlidersHorizontal,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inquiry, Quote, FollowUpTask } from '../../types';
import { 
  useOperatorNotifications, 
  OperatorNotification, 
  NotificationCategory,
  NotificationFilter,
  NotificationBadgeSettings
} from '../../hooks/useOperatorNotifications';

export interface NotificationCenterProps {
  workspaceId?: string;
  inquiries?: Inquiry[];
  quotes?: Quote[];
  followUps?: FollowUpTask[];
  uiLang?: 'ar' | 'en';
  onNavigateTab: (tab: string, subTab?: string) => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  workspaceId = 'default_ws',
  inquiries = [],
  quotes = [],
  followUps = [],
  uiLang = 'ar',
  onNavigateTab,
  className = '',
}) => {
  const isAr = uiLang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    filteredNotifications,
    counts,
    unreadCount,
    urgentCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    filter,
    setFilter,
    badgeSettings,
    toggleBadgeSetting,
  } = useOperatorNotifications({
    workspaceId,
    inquiries,
    quotes,
    followUps,
    uiLang,
  });

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (n: OperatorNotification) => {
    markAsRead(n.id);
    setIsOpen(false);
    onNavigateTab(n.targetTab, n.targetSubTab);
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'urgent_followup':
        return <Flame className="w-3.5 h-3.5 text-orange-600" />;
      case 'new_inquiry':
        return <Inbox className="w-3.5 h-3.5 text-sky-600" />;
      case 'quote_status':
        return <FileText className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getCategoryBadge = (n: OperatorNotification) => {
    switch (n.category) {
      case 'urgent_followup':
        return (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
            {isAr ? 'متابعة عاجلة' : 'Urgent Follow-up'}
          </span>
        );
      case 'new_inquiry':
        return (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
            {isAr ? 'طلب جديد' : 'New Inquiry'}
          </span>
        );
      case 'quote_status':
        return (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            {isAr ? 'تحديث الحالة' : 'Status Update'}
          </span>
        );
    }
  };

  const getEmptyStateCopy = () => {
    switch (filter) {
      case 'urgent_followup':
        return {
          title: isAr ? 'لا توجد متابعات عاجلة' : 'No urgent follow-ups',
          desc: isAr 
            ? 'جميع تنبيهات المتابعة العاجلة مع العملاء مكتملة ومحدّثة.' 
            : 'No high-priority client proposals requiring immediate contact.',
        };
      case 'new_inquiry':
        return {
          title: isAr ? 'لا توجد طلبات جديدة' : 'No new inquiries',
          desc: isAr 
            ? 'تم استلام وتوزيع جميع طلبات الرحلات الواردة بنجاح.' 
            : 'All inbound customer inquiries have been addressed.',
        };
      case 'quote_status':
        return {
          title: isAr ? 'لا توجد تحديثات عروض' : 'No status updates',
          desc: isAr 
            ? 'لا توجد عروض مقبولة حديثاً أو مشاهدات جديدة بانتظار الإجراء.' 
            : 'No newly accepted quotes or recent client proposal views.',
        };
      case 'unread':
        return {
          title: isAr ? 'لا توجد تنبيهات غير مقروءة' : 'No unread notifications',
          desc: isAr 
            ? 'لقد قمت بمراجعة كافة الإشعارات والتنبيهات التشغيلية.' 
            : 'You have caught up with all incoming system notifications.',
        };
      default:
        return {
          title: isAr ? 'لا توجد تنبيهات معلقة!' : 'All caught up!',
          desc: isAr
            ? 'جميع طلبات العملاء والمتابعات مسجلة ومكتملة بشكل ممتاز.'
            : 'No unhandled inquiries or overdue client follow-ups.',
        };
    }
  };

  const emptyCopy = getEmptyStateCopy();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 36px Standardized Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 flex items-center justify-center rounded-xl bg-white hover:bg-orange-50/50 border border-[#EDE0CC] hover:border-orange-300 text-[#44200F] transition shadow-2xs cursor-pointer active:scale-95 relative"
        title={isAr ? 'مركز التنبيهات والإشعارات' : 'Operator Notification Center'}
        aria-expanded={isOpen}
        aria-label={isAr ? 'مركز التنبيهات والإشعارات' : 'Operator Notification Center'}
      >
        <Bell className="w-4 h-4 text-[#44200F]" />

        {/* Unread Counter Badge (filtered by badge trigger preferences) */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-white pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            {urgentCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping absolute -top-0.5 -end-0.5 pointer-events-none" />
            )}
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop Overlay - closes on tap outside */}
            <div 
              className="fixed inset-0 bg-black/25 backdrop-blur-2xs z-40 sm:hidden"
              onClick={() => {
                setIsOpen(false);
                setShowSettings(false);
              }}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              dir={isAr ? 'rtl' : 'ltr'}
              className="fixed left-3 right-3 top-15 sm:top-auto sm:left-auto sm:right-0 sm:absolute sm:mt-2 w-auto sm:w-[420px] max-w-[calc(100vw-1.5rem)] max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-xl border border-[#EDE0CC] p-3 z-50 text-xs"
            >
            {/* Top Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EDE0CC] gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-xs text-[#44200F] truncate">
                    {isAr ? 'مركز التنبيهات التشغيلية' : 'Operations Alerts'}
                  </h3>
                </div>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-orange-500 text-white shrink-0">
                    {unreadCount} {isAr ? 'جديد' : 'new'}
                  </span>
                )}
              </div>

              {/* Action Buttons: Settings Toggle + Mark All Read + Clear All */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Badge Settings Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-lg border text-[11px] transition cursor-pointer flex items-center gap-1 ${
                    showSettings
                      ? 'bg-orange-100 text-orange-900 border-orange-300 shadow-2xs'
                      : 'bg-[#FAF7F2] hover:bg-orange-50 text-[#795037] hover:text-[#44200F] border-[#EDE0CC]'
                  }`}
                  title={isAr ? 'إعدادات شارة التنبيهات' : 'Badge Notification Settings'}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-orange-700" />
                  <span className="hidden sm:inline font-bold text-[10px]">
                    {isAr ? 'الشارة' : 'Badge'}
                  </span>
                </button>

                {/* Mark All as Read Action */}
                {counts.unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="p-1.5 sm:px-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title={isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {isAr ? 'تحديد الكل كمقروء' : 'Mark Read'}
                    </span>
                  </button>
                )}

                {/* Clear All Action */}
                {counts.all > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-red-50 hover:text-red-700 border border-[#EDE0CC] text-[#795037] transition cursor-pointer"
                    title={isAr ? 'مسح الكل' : 'Clear all notifications'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Badge Settings Area */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden border-b border-[#EDE0CC] pb-2.5 my-2.5 bg-[#FAF7F2] p-2.5 rounded-xl border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-extrabold text-[11px] text-[#44200F] block">
                        {isAr ? 'تخصيص شارة التنبيهات على الجرس' : 'Badge Notification Triggers'}
                      </span>
                      <p className="text-[10px] text-[#795037]">
                        {isAr 
                          ? 'اختر الأحداث التي تُظهر رقماً برتقالياً على الجرس' 
                          : 'Choose which event types display a counter badge on the bell icon'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="p-1 text-[#795037] hover:text-[#44200F] rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {/* Inquiries Badge Toggle */}
                    <div className="h-13 min-h-[52px] flex items-center justify-between p-2 px-2.5 rounded-xl bg-white border border-[#EDE0CC]/80">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                          <Inbox className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-[11px] text-[#44200F]">
                            {isAr ? 'الطلبات الجديدة (Inquiries)' : 'New Inquiries'}
                          </div>
                          <div className="text-[9px] text-[#795037]">
                            {isAr ? 'طلبات العملاء الواردة والمجدولة' : 'Inbound travel leads'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={badgeSettings.inquiries}
                        onClick={() => toggleBadgeSetting('inquiries')}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          badgeSettings.inquiries ? 'bg-orange-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                            badgeSettings.inquiries 
                              ? (isAr ? '-translate-x-4' : 'translate-x-4') 
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Urgent Follow-ups Badge Toggle */}
                    <div className="h-13 min-h-[52px] flex items-center justify-between p-2 px-2.5 rounded-xl bg-white border border-[#EDE0CC]/80">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
                          <Flame className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-[11px] text-[#44200F]">
                            {isAr ? 'المتابعات العاجلة (Urgent Follow-ups)' : 'Urgent Follow-ups'}
                          </div>
                          <div className="text-[9px] text-[#795037]">
                            {isAr ? 'تنبيهات استعراض العروض وتفاعل العملاء' : 'View spikes and urgent tasks'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={badgeSettings.followUps}
                        onClick={() => toggleBadgeSetting('followUps')}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          badgeSettings.followUps ? 'bg-orange-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                            badgeSettings.followUps 
                              ? (isAr ? '-translate-x-4' : 'translate-x-4') 
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Quotes Badge Toggle */}
                    <div className="h-13 min-h-[52px] flex items-center justify-between p-2 px-2.5 rounded-xl bg-white border border-[#EDE0CC]/80">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-[11px] text-[#44200F]">
                            {isAr ? 'تحديثات الحالة والعروض (Quotes)' : 'Status Updates & Quotes'}
                          </div>
                          <div className="text-[9px] text-[#795037]">
                            {isAr ? 'قبول العروض واستعراض مقترحات السفر' : 'Accepted quotes and views'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={badgeSettings.quotes}
                        onClick={() => toggleBadgeSetting('quotes')}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          badgeSettings.quotes ? 'bg-orange-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                            badgeSettings.quotes 
                              ? (isAr ? '-translate-x-4' : 'translate-x-4') 
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter Buttons Bar: Urgent Follow-ups | New Inquiries | Status Updates | All | Unread */}
            <div className="flex items-center gap-1.5 p-1 my-2 bg-[#FAF7F2] rounded-xl border border-[#EDE0CC] overflow-x-auto scrollbar-none touch-pan-x">
              {/* All */}
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`h-8 shrink-0 px-2.5 text-center rounded-lg font-bold text-[10px] sm:text-[11px] transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filter === 'all'
                    ? 'bg-[#44200F] text-white shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F] hover:bg-white/60'
                }`}
              >
                <span>{isAr ? 'الكل' : 'All'}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                  filter === 'all' ? 'bg-orange-500 text-white' : 'bg-[#EDE0CC] text-[#44200F]'
                }`}>
                  {counts.all}
                </span>
              </button>

              {/* Urgent Follow-ups */}
              <button
                type="button"
                onClick={() => setFilter('urgent_followup')}
                className={`h-8 shrink-0 px-2.5 text-center rounded-lg font-bold text-[10px] sm:text-[11px] transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filter === 'urgent_followup'
                    ? 'bg-[#44200F] text-white shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F] hover:bg-white/60'
                }`}
              >
                <Flame className={`w-3 h-3 ${filter === 'urgent_followup' ? 'text-orange-300' : 'text-orange-600'}`} />
                <span>{isAr ? 'متابعات عاجلة' : 'Urgent Follow-ups'}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                  filter === 'urgent_followup' ? 'bg-orange-500 text-white' : 'bg-[#EDE0CC] text-[#44200F]'
                }`}>
                  {counts.urgent_followup}
                </span>
              </button>

              {/* New Inquiries */}
              <button
                type="button"
                onClick={() => setFilter('new_inquiry')}
                className={`h-8 shrink-0 px-2.5 text-center rounded-lg font-bold text-[10px] sm:text-[11px] transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filter === 'new_inquiry'
                    ? 'bg-[#44200F] text-white shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F] hover:bg-white/60'
                }`}
              >
                <Inbox className={`w-3 h-3 ${filter === 'new_inquiry' ? 'text-sky-300' : 'text-sky-600'}`} />
                <span>{isAr ? 'طلبات جديدة' : 'New Inquiries'}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                  filter === 'new_inquiry' ? 'bg-orange-500 text-white' : 'bg-[#EDE0CC] text-[#44200F]'
                }`}>
                  {counts.new_inquiry}
                </span>
              </button>

              {/* Status Updates */}
              <button
                type="button"
                onClick={() => setFilter('quote_status')}
                className={`h-8 shrink-0 px-2.5 text-center rounded-lg font-bold text-[10px] sm:text-[11px] transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filter === 'quote_status'
                    ? 'bg-[#44200F] text-white shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F] hover:bg-white/60'
                }`}
              >
                <FileText className={`w-3 h-3 ${filter === 'quote_status' ? 'text-emerald-300' : 'text-emerald-600'}`} />
                <span>{isAr ? 'تحديثات الحالة' : 'Status Updates'}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                  filter === 'quote_status' ? 'bg-orange-500 text-white' : 'bg-[#EDE0CC] text-[#44200F]'
                }`}>
                  {counts.quote_status}
                </span>
              </button>

              {/* Unread */}
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`h-8 shrink-0 px-2.5 text-center rounded-lg font-bold text-[10px] sm:text-[11px] transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filter === 'unread'
                    ? 'bg-[#44200F] text-white shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F] hover:bg-white/60'
                }`}
              >
                <span>{isAr ? 'غير مقروء' : 'Unread'}</span>
                {counts.unread > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>
            </div>

            {/* Notification Item List */}
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-0.5">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-xs text-[#44200F]">
                    {emptyCopy.title}
                  </div>
                  <p className="text-[11px] text-[#795037] mt-1 max-w-xs mx-auto leading-relaxed">
                    {emptyCopy.desc}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const title = isAr ? n.titleAr : n.titleEn;
                  const desc = isAr ? n.descriptionAr : n.descriptionEn;
                  const relTime = isAr ? n.relativeTimeAr : n.relativeTimeEn;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-start relative group min-h-[102px] flex flex-col justify-between ${
                        !n.isRead
                          ? 'bg-orange-50/50 hover:bg-orange-100/60 border-orange-200/90 shadow-2xs'
                          : 'bg-white hover:bg-[#FAF7F2] border-[#EDE0CC]/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getCategoryIcon(n.category)}
                            {getCategoryBadge(n)}
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-mono text-[#795037]">
                              {relTime}
                            </span>
                            {!n.isRead && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                }}
                                className="p-1 rounded-md text-[#795037] hover:text-[#44200F] hover:bg-white transition"
                                title={isAr ? 'تعليم كمقروء' : 'Mark as read'}
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="font-bold text-xs text-[#44200F] mt-1.5 truncate">
                          {title}
                        </div>

                        <p className="text-[11px] text-[#795037] line-clamp-2 mt-0.5 leading-snug h-8">
                          {desc}
                        </p>
                      </div>

                      <div className="mt-1.5 pt-1.5 border-t border-[#EDE0CC]/40 flex items-center justify-between text-[10px] font-bold text-orange-700">
                        <span className="inline-flex items-center gap-1">
                          <span>{isAr ? 'فتح ومتابعة' : 'Open & handle'}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>
  );
};
