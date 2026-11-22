import React, { useState, useEffect, useId } from 'react';
import { 
  X, QrCode, Download, Copy, Check, ExternalLink, 
  Share2, Printer, Smartphone, Users, Shield, 
  MapPin, Calendar, Hotel, Truck, RefreshCw, Sparkles
} from 'lucide-react';
import { TripFile, TripPassenger, TripService } from '../../lib/tripStore';
import { Workspace, UILanguage } from '../../types';
import { 
  generateQRCodeDataUrl, 
  generateQRCodeSvg, 
  downloadQRCodePng, 
  downloadQRCodeSvg,
  buildItineraryUrl,
  buildVoucherUrl,
  buildConciergeUrl
} from '../../lib/qrCodeUtility';
import { writeSafePrintDocument } from '../../lib/safePrint';

export interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripFile;
  workspace: Workspace;
  uiLang: UILanguage;
  initialType?: 'itinerary' | 'passenger' | 'voucher';
  initialPassenger?: TripPassenger | null;
  initialService?: TripService | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  trip,
  workspace,
  uiLang,
  initialType = 'itinerary',
  initialPassenger = null,
  initialService = null,
}) => {
  const isAr = uiLang === 'ar';
  const selectId = useId();

  const [activeType, setActiveType] = useState<'itinerary' | 'passenger' | 'voucher'>(initialType);
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>(
    initialPassenger?.id || trip.passengers?.[0]?.id || ''
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialService?.id || trip.services?.[0]?.id || ''
  );

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setActiveType(initialType);
    if (initialPassenger?.id) setSelectedPassengerId(initialPassenger.id);
    if (initialService?.id) setSelectedServiceId(initialService.id);
  }, [initialType, initialPassenger, initialService, isOpen]);

  // Determine current active target and code
  const currentPassenger = trip.passengers?.find(p => p.id === selectedPassengerId) || trip.passengers?.[0];
  const currentService = trip.services?.find(s => s.id === selectedServiceId) || trip.services?.[0];

  let targetUrl = '';
  let targetTitle = '';
  let targetSubtitle = '';
  let targetCode = '';
  let fileBaseName = '';

  if (activeType === 'passenger' && currentPassenger) {
    targetUrl = buildItineraryUrl(trip, currentPassenger);
    targetTitle = currentPassenger.name || (isAr ? 'مسافر غير مسمى' : 'Unnamed Guest');
    targetSubtitle = `${isAr ? 'كود المسافر الشخصي' : 'Guest Passcode'} · ${currentPassenger.room || (isAr ? 'غرفة غير محددة' : 'Room TBD')}`;
    targetCode = currentPassenger.personalCode || trip.tourPasscode || trip.fileNumber;
    fileBaseName = `QR-${trip.fileNumber}-${(currentPassenger.name || 'guest').replace(/\s+/g, '_')}`;
  } else if (activeType === 'voucher' && currentService) {
    targetUrl = buildVoucherUrl(trip, currentService);
    targetTitle = currentService.serviceName;
    targetSubtitle = `${currentService.supplierName} · ${currentService.city} (${isAr ? 'اليوم' : 'Day'} ${currentService.dayNumber})`;
    targetCode = currentService.confirmationNo || `VCH-${trip.fileNumber.slice(-4)}-${currentService.dayNumber}`;
    fileBaseName = `QR-Voucher-${trip.fileNumber}-Day${currentService.dayNumber}`;
  } else {
    // Master Group Itinerary
    targetUrl = buildItineraryUrl(trip);
    targetTitle = trip.travelerName;
    targetSubtitle = `${isAr ? 'كود الفوج العام' : 'Tour Master Passcode'} · ${trip.fileNumber}`;
    targetCode = trip.tourPasscode || trip.fileNumber;
    fileBaseName = `QR-Tour-${trip.fileNumber}`;
  }

  // Generate QR code whenever target URL changes
  useEffect(() => {
    if (!isOpen || !targetUrl) return;

    let isSubscribed = true;
    setIsGenerating(true);

    Promise.all([
      generateQRCodeDataUrl(targetUrl, {
        width: 380,
        margin: 2,
        darkColor: '#44200F', // RIHAL Espresso
        lightColor: '#FFFFFF',
      }),
      generateQRCodeSvg(targetUrl, {
        margin: 2,
        darkColor: '#44200F',
        lightColor: '#FFFFFF',
      }),
    ])
      .then(([dataUrl, svg]) => {
        if (!isSubscribed) return;
        setQrDataUrl(dataUrl);
        setQrSvg(svg);
        setIsGenerating(false);
      })
      .catch(err => {
        if (!isSubscribed) return;
        console.error('Error generating QR:', err);
        setIsGenerating(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [targetUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(targetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCopyCode = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(targetCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  const handleDownloadPng = () => {
    if (qrDataUrl) {
      downloadQRCodePng(qrDataUrl, `${fileBaseName}.png`);
    }
  };

  const handleDownloadSvg = () => {
    if (qrSvg) {
      downloadQRCodeSvg(qrSvg, `${fileBaseName}.svg`);
    }
  };

  const handleWhatsAppShare = () => {
    const textEn = `*${workspace.name} Travel Document*\n` +
      `Trip File: ${trip.fileNumber}\n` +
      `Target: ${targetTitle}\n` +
      `Passcode: *${targetCode}*\n\n` +
      `Scan or tap link to view live mobile itinerary & vouchers:\n${targetUrl}`;

    const textAr = `*وثيقة سفر من ${workspace.name}*\n` +
      `ملف الرحلة: ${trip.fileNumber}\n` +
      `البيان: ${targetTitle}\n` +
      `كود الدخول: *${targetCode}*\n\n` +
      `امسح الرمز أو افتح الرابط للاطلاع على البرنامج وقسائم الخدمات:\n${targetUrl}`;

    const text = isAr ? textAr : textEn;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintBadge = () => {
    const brandPrimary = workspace.brandColors?.primary || '#44200F';
    const brandChampagne = '#C4A177';
    const brandSand = '#EDE0CC';

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert(isAr ? 'يرجى السماح بالنوافذ المنبثقة لطباعة بطاقة الـ QR' : 'Please enable pop-ups to print the QR badge.');
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="${uiLang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${isAr ? 'بطاقة QR الرسمية' : 'Official QR Travel Badge'} - ${trip.fileNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 20px;
      background: #faf7f2;
    }
    .badge-card {
      max-width: 540px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid ${brandSand};
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(68,32,15,0.08);
      text-align: center;
      page-break-inside: avoid;
    }
    .badge-header {
      border-bottom: 2px solid ${brandSand};
      padding-bottom: 18px;
      margin-bottom: 24px;
    }
    .company-name {
      font-size: 22px;
      font-weight: 800;
      color: ${brandPrimary};
      letter-spacing: 0.5px;
      margin: 0 0 4px 0;
    }
    .badge-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: ${brandSand};
      color: ${brandPrimary};
      padding: 4px 12px;
      border-radius: 9999px;
    }
    .badge-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 16px 0 4px 0;
    }
    .badge-subtitle {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 20px;
    }
    .qr-container {
      background: #faf7f2;
      border: 1px dashed ${brandChampagne};
      border-radius: 16px;
      padding: 20px;
      display: inline-block;
      margin: 0 auto 20px auto;
    }
    .qr-container img {
      width: 220px;
      height: 220px;
      display: block;
    }
    .passcode-pill {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 18px;
      font-weight: 800;
      color: ${brandPrimary};
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 6px 16px;
      border-radius: 12px;
      display: inline-block;
      margin-bottom: 14px;
      letter-spacing: 1.5px;
    }
    .instructions {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
      max-width: 440px;
      margin: 0 auto 20px auto;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px;
      text-align: ${isAr ? 'right' : 'left'};
      font-size: 11px;
      border: 1px solid #e2e8f0;
    }
    .meta-label { color: #64748b; font-weight: 600; }
    .meta-val { color: #0f172a; font-weight: 700; }
    .footer-help {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 24px;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .badge-card { border: 1px solid #cbd5e1; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="badge-card">
    <div class="badge-header">
      <div class="company-name">${workspace.name}</div>
      <div class="badge-tag">${isAr ? 'بطاقة المرور والبرنامج الرقمي' : 'Official Digital Travel Pass'}</div>
    </div>

    <div class="badge-title">${targetTitle}</div>
    <div class="badge-subtitle">${targetSubtitle}</div>

    <div class="qr-container">
      <img src="${qrDataUrl}" alt="QR Code" />
    </div>

    <div>
      <span class="passcode-pill">${targetCode}</span>
    </div>

    <div class="instructions">
      ${isAr 
        ? 'امسح رمز الاستجابة السريعة (QR) بكاميرا هاتفك المحمول للوصول فوراً للبرنامج التفاعلي، بيانات المرشد، السائق، وأرقام الطوارئ والقسائم.' 
        : 'Scan this QR code with any smartphone camera to instantly access your live interactive itinerary, tour guide contacts, room vouchers, and operations run sheet.'}
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-label">${isAr ? 'رقم ملف الرحلة' : 'File Number'}:</div>
        <div class="meta-val">${trip.fileNumber}</div>
      </div>
      <div>
        <div class="meta-label">${isAr ? 'تاريخ البداية' : 'Start Date'}:</div>
        <div class="meta-val">${trip.startDate || 'TBD'} (${trip.durationDays} ${isAr ? 'أيام' : 'days'})</div>
      </div>
      <div>
        <div class="meta-label">${isAr ? 'المرشد المرافق' : 'Tour Guide'}:</div>
        <div class="meta-val">${trip.guideName || (isAr ? 'معين من الإدارة' : 'Official Guide')}</div>
      </div>
      <div>
        <div class="meta-label">${isAr ? 'طوارئ العمليات' : 'Operations Desk'}:</div>
        <div class="meta-val">${workspace.contactPhone || '+20 2 2738 0000'}</div>
      </div>
    </div>

    <div class="footer-help">
      ${workspace.name} · ${workspace.contactEmail || ''} · ${targetUrl}
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

    writeSafePrintDocument(printWin, html);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div 
        className="relative bg-white rounded-3xl max-w-xl w-full border border-amber-900/15 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#44200F] via-[#5C2E16] to-[#44200F] text-white flex items-center justify-between border-b border-amber-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {isAr ? 'منظومة توليد رموز QR السريعة' : 'Instant QR Code Utility'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C4A177]/30 text-[#EDE0CC] border border-[#C4A177]/40">
                  {trip.fileNumber}
                </span>
              </div>
              <p className="text-xs text-amber-100/70 mt-0.5">
                {isAr ? 'روابط ذكية قابلة للمسح لبرامج الرحلات وقسائم الخدمات' : 'Scannable smart links for traveler itineraries & vouchers'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-amber-200/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Scope Switcher */}
        <div className="p-4 bg-[#FAF7F2] border-b border-[#EDE0CC] space-y-3">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#EDE0CC] shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveType('itinerary')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeType === 'itinerary'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isAr ? 'برنامج الفوج العام' : 'Tour Itinerary'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType('passenger')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeType === 'passenger'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isAr ? 'كود مسافر محدد' : 'Passenger Passcode'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType('voucher')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeType === 'voucher'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAr ? 'قسيمة خدمة / مورد' : 'Service Voucher'}</span>
            </button>
          </div>

          {/* Sub-selectors */}
          {activeType === 'passenger' && (
            <div className="flex items-center gap-2">
              <label htmlFor={`${selectId}-pax`} className="text-xs font-bold text-slate-600 shrink-0">
                {isAr ? 'اختر المسافر:' : 'Select Passenger:'}
              </label>
              <select
                id={`${selectId}-pax`}
                value={selectedPassengerId}
                onChange={e => setSelectedPassengerId(e.target.value)}
                className="flex-1 text-xs font-bold bg-white border border-[#EDE0CC] rounded-xl px-3 py-1.5 text-slate-800 shadow-2xs focus:outline-hidden focus:border-[#C4A177]"
              >
                {(trip.passengers || []).map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    #{idx + 1} {p.name || `Guest ${idx + 1}`} ({p.room || 'No Room'}) - {p.personalCode || 'Auto Code'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeType === 'voucher' && (
            <div className="flex items-center gap-2">
              <label htmlFor={`${selectId}-svc`} className="text-xs font-bold text-slate-600 shrink-0">
                {isAr ? 'اختر الخدمة:' : 'Select Service:'}
              </label>
              <select
                id={`${selectId}-svc`}
                value={selectedServiceId}
                onChange={e => setSelectedServiceId(e.target.value)}
                className="flex-1 text-xs font-bold bg-white border border-[#EDE0CC] rounded-xl px-3 py-1.5 text-slate-800 shadow-2xs focus:outline-hidden focus:border-[#C4A177]"
              >
                {(trip.services || []).map(s => (
                  <option key={s.id} value={s.id}>
                    Day {s.dayNumber}: {s.serviceName} ({s.supplierName}) · {s.confirmationNo || 'Pending Conf'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="p-5 space-y-4">
          {/* QR Display Card */}
          <div className="bg-[#FAF7F2] border-2 border-dashed border-[#C4A177]/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative group">
            {isGenerating ? (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-[#795037]" />
                <span className="text-xs font-bold">{isAr ? 'جاري توليد رمز الـ QR...' : 'Generating QR Code...'}</span>
              </div>
            ) : qrDataUrl ? (
              <div className="space-y-3 flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-[#EDE0CC] inline-block">
                  <img
                    src={qrDataUrl}
                    alt="Scannable QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 block rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xs font-bold bg-amber-100 text-[#44200F] px-3 py-1 rounded-lg border border-amber-300">
                      {targetCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
                      title={isAr ? 'نسخ الكود' : 'Copy Passcode'}
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <h4 className="text-sm font-extrabold text-[#44200F] line-clamp-1">
                    {targetTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {targetSubtitle}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-rose-500 text-xs">
                {isAr ? 'تعذر توليد رمز الـ QR' : 'Failed to generate QR Code'}
              </div>
            )}
          </div>

          {/* Scannable Target URL Bar */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between gap-2 text-xs">
            <div className="truncate flex items-center gap-1.5 text-slate-600 min-w-0">
              <span className="font-bold text-slate-400 text-[10px] uppercase shrink-0 font-mono">URL:</span>
              <span className="truncate font-mono text-[11px] text-slate-700">{targetUrl}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title={isAr ? 'نسخ الرابط للحافظة' : 'Copy link to clipboard'}
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copiedLink ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}</span>
              </button>

              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition"
                title={isAr ? 'فتح الرابط في تبويب جديد' : 'Open in new tab'}
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Action Ribbon: Download, Share, Print */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isGenerating || !qrDataUrl}
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#795037]" />
              <span>{isAr ? 'تحميل PNG' : 'PNG Image'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={isGenerating || !qrSvg}
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>{isAr ? 'متجه SVG' : 'SVG Vector'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال واتساب' : 'WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBadge}
              disabled={isGenerating || !qrDataUrl}
              className="px-3 py-2.5 rounded-xl bg-[#44200F] hover:bg-[#5C2E16] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'طباعة كارت' : 'Print Badge'}</span>
            </button>
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-5 py-3 bg-[#FAF7F2] border-t border-[#EDE0CC] flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C4A177]" />
            <span>
              {isAr 
                ? 'متوافق مع جميع كاميرات الهواتف الذكية دون الحاجة لتطبيق إضافي.' 
                : 'Universal QR: Scannable with standard iOS & Android camera apps.'}
            </span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
