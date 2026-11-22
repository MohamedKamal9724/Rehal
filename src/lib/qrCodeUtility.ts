import QRCode from 'qrcode';
import { TripFile, TripPassenger, TripService } from './tripStore';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

const DEFAULT_DARK = '#44200F'; // RIHAL Espresso
const DEFAULT_LIGHT = '#FFFFFF';

/**
 * Build the canonical full URL for a trip or guest
 */
export function buildItineraryUrl(trip: TripFile, passenger?: TripPassenger): string {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '';
  
  if (passenger?.personalCode) {
    return `${origin}${pathname}?code=${encodeURIComponent(passenger.personalCode)}`;
  }
  
  const code = trip.tourPasscode || trip.fileNumber;
  return `${origin}${pathname}?code=${encodeURIComponent(code)}`;
}

/**
 * Build canonical URL for a supplier or service voucher
 */
export function buildVoucherUrl(trip: TripFile, service: TripService): string {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '';
  const conf = service.confirmationNo || service.id;
  
  return `${origin}${pathname}?view=voucher&fileNumber=${encodeURIComponent(trip.fileNumber)}&serviceId=${encodeURIComponent(service.id)}&conf=${encodeURIComponent(conf)}&tripId=${encodeURIComponent(trip.id)}`;
}

/**
 * Build traveler concierge deep link
 */
export function buildConciergeUrl(trip: TripFile): string {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' && window.location.pathname ? window.location.pathname : '';
  return `${origin}${pathname}?view=concierge&quoteId=${encodeURIComponent(trip.quoteId || trip.id)}`;
}

/**
 * Generate QR code as PNG data URL
 */
export async function generateQRCodeDataUrl(
  text: string, 
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 320,
    margin = 2,
    darkColor = DEFAULT_DARK,
    lightColor = DEFAULT_LIGHT,
  } = options;

  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    throw err;
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSvg(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    margin = 2,
    darkColor = DEFAULT_DARK,
    lightColor = DEFAULT_LIGHT,
  } = options;

  try {
    return await QRCode.toString(text, {
      type: 'svg',
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code SVG:', err);
    throw err;
  }
}

/**
 * Download QR code data URL as PNG file
 */
export function downloadQRCodePng(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download SVG text as file
 */
export function downloadQRCodeSvg(svgText: string, fileName: string) {
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
