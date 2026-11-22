import { TripFile, TripPassenger } from './tripStore';
import { Workspace, UILanguage } from '../types';
import { buildWhatsAppUrl } from './phone';

export interface WhatsAppDispatchOptions {
  trip: TripFile;
  passenger?: TripPassenger;
  workspace?: Workspace;
  uiLang?: UILanguage;
  customPhoneNumber?: string;
}

/**
 * Builds a direct portal URL for the trip passcode.
 */
export function buildTripPortalUrl(code: string): string {
  if (typeof window === 'undefined') {
    return `https://rihal-egypt.com/portal?code=${code}`;
  }
  const base = window.location.origin + window.location.pathname;
  return `${base}?code=${encodeURIComponent(code)}`;
}

/**
 * Formats a localized, hospitality-grade message containing trip access code,
 * dates, guide/driver details, and instant portal link.
 */
export function formatTripDispatchMessage(options: WhatsAppDispatchOptions): string {
  const { trip, passenger, workspace, uiLang = 'ar' } = options;
  const isAr = uiLang === 'ar';
  const companyName = isAr
    ? (workspace?.arabicName || workspace?.name || 'رِحال للسياحة')
    : (workspace?.name || workspace?.arabicName || 'RIHAL Egypt');
  const code = passenger?.personalCode || trip.tourPasscode || trip.fileNumber;
  const guestName = passenger?.name || trip.travelerName;
  const portalUrl = buildTripPortalUrl(code);

  const guideInfo = trip.guideName ? `${trip.guideName} (${trip.guidePhone || ''})` : '';
  const driverInfo = trip.driverName ? `${trip.driverName} (${trip.vehiclePlate || trip.vehicleType || ''})` : '';

  if (isAr) {
    let msg = `🌟 *مرحباً بك في مصر مع ${companyName}* 🌟\n\n`;
    msg += `عزيزنا الضيف الكريم: *${guestName}*،\n`;
    msg += `يسعدنا الترحيب بكم. كود الدخول الخاص برحلتكم لمتابعة البرنامج والخدمات الحية هو:\n`;
    msg += `🔑 كود الرحلة: *${code}*\n\n`;

    if (trip.startDate) {
      msg += `📅 تاريخ بدء الرحلة: ${trip.startDate} (${trip.durationDays || 4} أيام)\n`;
    }
    if (guideInfo) {
      msg += `🏛️ المرشد السياحي: ${guideInfo}\n`;
    }
    if (driverInfo) {
      msg += `🚐 السائق والنقل: ${driverInfo}\n`;
    }

    msg += `\n📲 *افتح بوابة رحلتك الرقمية وكشوف الفنادق هنا:*\n${portalUrl}\n\n`;
    msg += `نتمنى لحضراتكم إقامة سعيدة وتجربة سفر لا تُنسى في مصر! 🇪🇬✨`;
    return msg;
  } else {
    let msg = `🌟 *Welcome to Egypt with ${companyName}* 🌟\n\n`;
    msg += `Dear Guest: *${guestName}*,\n`;
    msg += `It is our pleasure to host you. Here is your official trip access passcode for live itinerary & service vouchers:\n`;
    msg += `🔑 Access Passcode: *${code}*\n\n`;

    if (trip.startDate) {
      msg += `📅 Tour Start Date: ${trip.startDate} (${trip.durationDays || 4} Days)\n`;
    }
    if (guideInfo) {
      msg += `🏛️ Licensed Guide: ${guideInfo}\n`;
    }
    if (driverInfo) {
      msg += `🚐 Private Chauffeur: ${driverInfo}\n`;
    }

    msg += `\n📲 *Open your live mobile travel portal here:*\n${portalUrl}\n\n`;
    msg += `We wish you an extraordinary and unforgettable journey in Egypt! 🇪🇬✨`;
    return msg;
  }
}

/**
 * Builds the complete wa.me link for 1-click WhatsApp dispatch.
 */
export function buildWhatsAppTripDispatchLink(options: WhatsAppDispatchOptions): string {
  const message = formatTripDispatchMessage(options);
  const rawPhone = options.customPhoneNumber || options.passenger?.phone || '';
  return buildWhatsAppUrl(rawPhone, message);
}

/**
 * Executes a 1-click WhatsApp dispatch opening the web/app link.
 */
export function dispatchTripCodeToWhatsApp(options: WhatsAppDispatchOptions): void {
  const link = buildWhatsAppTripDispatchLink(options);
  if (typeof window !== 'undefined') {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}
