import { useState, useEffect, useMemo, useCallback } from 'react';
import { Inquiry, Quote, FollowUpTask } from '../types';

export type NotificationCategory = 'urgent_followup' | 'new_inquiry' | 'quote_status';
export type NotificationUrgency = 'high' | 'medium' | 'normal';

export type NotificationFilter = 
  | 'all' 
  | 'urgent_followup' 
  | 'new_inquiry' 
  | 'quote_status' 
  | 'unread'
  | 'urgent';

export interface NotificationBadgeSettings {
  inquiries: boolean;
  quotes: boolean;
  followUps: boolean;
}

export const DEFAULT_BADGE_SETTINGS: NotificationBadgeSettings = {
  inquiries: true,
  quotes: true,
  followUps: true,
};

export interface OperatorNotification {
  id: string;
  category: NotificationCategory;
  urgency: NotificationUrgency;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  timestamp: string; // ISO string
  relativeTimeEn: string;
  relativeTimeAr: string;
  targetTab: string; // 'followups' | 'inbox' | 'quotes' | 'pipeline'
  targetSubTab?: string;
  recordId: string;
  isRead: boolean;
}

export interface UseOperatorNotificationsOptions {
  workspaceId?: string;
  inquiries?: Inquiry[];
  quotes?: Quote[];
  followUps?: FollowUpTask[];
  uiLang?: 'ar' | 'en';
}

function formatRelativeTime(dateString: string, isAr: boolean): string {
  try {
    const then = new Date(dateString).getTime();
    const now = Date.now();
    const diffMinutes = Math.max(0, Math.floor((now - then) / (1000 * 60)));

    if (diffMinutes < 2) {
      return isAr ? 'الآن' : 'Just now';
    }
    if (diffMinutes < 60) {
      return isAr ? `منذ ${diffMinutes} د` : `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return isAr ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return isAr ? 'أمس' : 'Yesterday';
    }
    return isAr ? `منذ ${diffDays} ي` : `${diffDays}d ago`;
  } catch {
    return isAr ? 'مؤخراً' : 'Recently';
  }
}

export function useOperatorNotifications({
  workspaceId = 'default_ws',
  inquiries = [],
  quotes = [],
  followUps = [],
  uiLang = 'ar',
}: UseOperatorNotificationsOptions = {}) {
  const isAr = uiLang === 'ar';
  const storageKey = `rihal_read_notifications_${workspaceId}`;
  const badgeSettingsKey = `rihal_badge_settings_${workspaceId}`;

  // Read state stored in localStorage
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {
      // Local storage unavailable or failed
    }
    return new Set<string>();
  });

  // Badge trigger settings
  const [badgeSettings, setBadgeSettings] = useState<NotificationBadgeSettings>(() => {
    try {
      const stored = localStorage.getItem(badgeSettingsKey);
      if (stored) {
        return { ...DEFAULT_BADGE_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Local storage unavailable or failed
    }
    return DEFAULT_BADGE_SETTINGS;
  });

  const [filter, setFilter] = useState<NotificationFilter>('all');

  // Sync readIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(readIds)));
    } catch {
      // Ignore
    }
  }, [readIds, storageKey]);

  // Sync badgeSettings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(badgeSettingsKey, JSON.stringify(badgeSettings));
    } catch {
      // Ignore
    }
  }, [badgeSettings, badgeSettingsKey]);

  // Derive all active notifications reactively
  const allNotifications = useMemo<OperatorNotification[]>(() => {
    const list: OperatorNotification[] = [];

    // 1. Follow-up tasks alerts
    followUps.forEach((f) => {
      if (f.status === 'Completed') return;
      const isUrgent = Boolean(f.isUrgent);
      const notifId = `followup_${f.id}`;
      const timeStr = f.dueDate || new Date().toISOString();

      list.push({
        id: notifId,
        category: 'urgent_followup',
        urgency: isUrgent ? 'high' : 'medium',
        titleEn: isUrgent 
          ? `Urgent Follow-up: ${f.travelerName}` 
          : `Follow-up Due: ${f.travelerName}`,
        titleAr: isUrgent 
          ? `متابعة عاجلة جداً: ${f.travelerName}` 
          : `متابعة عميل: ${f.travelerName}`,
        descriptionEn: f.triggerReason || f.suggestedMessage || 'Client viewing proposal; high-intent engagement.',
        descriptionAr: f.suggestedMessage || f.triggerReason || 'العميل يستعرض عرض الرحلة؛ نسبة اهتمام مرتفعة تستدعي التواصل.',
        timestamp: timeStr,
        relativeTimeEn: formatRelativeTime(timeStr, false),
        relativeTimeAr: formatRelativeTime(timeStr, true),
        targetTab: 'followups',
        recordId: f.id,
        isRead: readIds.has(notifId),
      });
    });

    // 2. Inbound new inquiries
    inquiries.forEach((inq) => {
      if (inq.status !== 'New') return;
      const notifId = `inquiry_${inq.id}`;
      const timeStr = inq.receivedAt || new Date().toISOString();

      list.push({
        id: notifId,
        category: 'new_inquiry',
        urgency: 'medium',
        titleEn: `New Inquiry: ${inq.travelerName}`,
        titleAr: `طلب رحلة وارد جديد: ${inq.travelerName}`,
        descriptionEn: inq.rawText 
          ? inq.rawText.slice(0, 90) + (inq.rawText.length > 90 ? '...' : '') 
          : `Received via ${inq.source || 'Direct'}. Awaiting quotation.`,
        descriptionAr: inq.rawText 
          ? inq.rawText.slice(0, 90) + (inq.rawText.length > 90 ? '...' : '') 
          : `وارد من ${inq.source || 'الموقع'}. بانتظار إعداد العرض والتسعير.`,
        timestamp: timeStr,
        relativeTimeEn: formatRelativeTime(timeStr, false),
        relativeTimeAr: formatRelativeTime(timeStr, true),
        targetTab: 'inbox',
        recordId: inq.id,
        isRead: readIds.has(notifId),
      });
    });

    // 3. Quotes status transitions
    quotes.forEach((q) => {
      const isAccepted = q.status === 'Accepted';
      const isViewed = (q.viewCount || 0) > 0;
      if (!isAccepted && !isViewed) return;

      const notifId = `quote_${q.id}_${q.status}`;
      const timeStr = q.updatedAt || new Date().toISOString();

      list.push({
        id: notifId,
        category: 'quote_status',
        urgency: isAccepted ? 'high' : 'normal',
        titleEn: isAccepted 
          ? `Quote Accepted: ${q.travelerName}` 
          : `Proposal Viewed: ${q.travelerName}`,
        titleAr: isAccepted 
          ? `تم قبول العرض: ${q.travelerName}` 
          : `العميل استعرض العرض: ${q.travelerName}`,
        descriptionEn: isAccepted 
          ? `Confirmed booking for ${q.targetCurrency || 'USD'} ${(q.totalPriceQuoteCurrency || q.totalPriceEgp || 0).toLocaleString()}. Ready for ops dispatch.` 
          : `Viewed ${q.viewCount || 1} times. Follow-up opportunity recommended.`,
        descriptionAr: isAccepted 
          ? `تم تأكيد حجز الرحلة بقيمة ${(q.totalPriceQuoteCurrency || q.totalPriceEgp || 0).toLocaleString()} ${q.targetCurrency || 'USD'}. جاهزة للتشغيل الميداني.` 
          : `تم فتح العرض ${q.viewCount || 1} مرة من العميل. يُوصى بمتابعته.`,
        timestamp: timeStr,
        relativeTimeEn: formatRelativeTime(timeStr, false),
        relativeTimeAr: formatRelativeTime(timeStr, true),
        targetTab: isAccepted ? 'trips' : 'quotes',
        recordId: q.id,
        isRead: readIds.has(notifId),
      });
    });

    // Sort by timestamp descending
    return list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [followUps, inquiries, quotes, readIds]);

  // Category and status counts for filter buttons
  const counts = useMemo(() => {
    return {
      all: allNotifications.length,
      urgent_followup: allNotifications.filter((n) => n.category === 'urgent_followup').length,
      new_inquiry: allNotifications.filter((n) => n.category === 'new_inquiry').length,
      quote_status: allNotifications.filter((n) => n.category === 'quote_status').length,
      unread: allNotifications.filter((n) => !n.isRead).length,
      urgent: allNotifications.filter((n) => n.urgency === 'high').length,
    };
  }, [allNotifications]);

  // Badge unread count filtered by operator badge preferences
  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => {
      if (n.isRead) return false;
      if (n.category === 'new_inquiry' && !badgeSettings.inquiries) return false;
      if (n.category === 'quote_status' && !badgeSettings.quotes) return false;
      if (n.category === 'urgent_followup' && !badgeSettings.followUps) return false;
      return true;
    }).length;
  }, [allNotifications, badgeSettings]);

  // Urgent badge count filtered by operator badge preferences
  const urgentCount = useMemo(() => {
    return allNotifications.filter((n) => {
      if (n.isRead || n.urgency !== 'high') return false;
      if (n.category === 'urgent_followup' && !badgeSettings.followUps) return false;
      if (n.category === 'quote_status' && !badgeSettings.quotes) return false;
      return true;
    }).length;
  }, [allNotifications, badgeSettings]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      allNotifications.forEach((n) => next.add(n.id));
      return next;
    });
  }, [allNotifications]);

  const clearAll = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      allNotifications.forEach((n) => next.add(n.id));
      return next;
    });
  }, [allNotifications]);

  const toggleBadgeSetting = useCallback((key: keyof NotificationBadgeSettings) => {
    setBadgeSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return allNotifications.filter((n) => !n.isRead);
    }
    if (filter === 'urgent') {
      return allNotifications.filter((n) => n.urgency === 'high');
    }
    if (filter === 'urgent_followup') {
      return allNotifications.filter((n) => n.category === 'urgent_followup');
    }
    if (filter === 'new_inquiry') {
      return allNotifications.filter((n) => n.category === 'new_inquiry');
    }
    if (filter === 'quote_status') {
      return allNotifications.filter((n) => n.category === 'quote_status');
    }
    return allNotifications;
  }, [allNotifications, filter]);

  return {
    notifications: allNotifications,
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
    setBadgeSettings,
    toggleBadgeSetting,
  };
}
