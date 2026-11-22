import React from 'react';
import { 
  Plane, Phone, MessageSquare, Shield, Printer, Download, 
  Compass, Truck, Users, Calendar, MapPin, AlertTriangle, 
  ExternalLink, ChevronLeft, Clock, CheckCircle2, AlertCircle,
  QrCode
} from 'lucide-react';
import { TripFile, TripStatus } from '../../lib/tripStore';
import { Workspace, UILanguage } from '../../types';

interface TripOperationsHeaderProps {
  trip: TripFile;
  workspace: Workspace;
  uiLang: UILanguage;
  onBack: () => void;
  onStatusChange: (status: TripStatus) => void;
  onLaunchDispatch: () => void;
  onOpenRoadmap: () => void;
  onPrintManifest: () => void;
  onPrintDaily: () => void;
  onPrintProgram: () => void;
  onExportRooming: () => void;
  onPrintBooklet?: () => void;
  onOpenQrModal?: (type?: 'itinerary' | 'passenger' | 'voucher') => void;
  confirmedCount: number;
  totalServicesCount: number;
}

const TRIP_STATUSES: TripStatus[] = ['Preparing', 'Ready', 'In Progress', 'Completed', 'Cancelled'];

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  Preparing: { en: 'Preparing', ar: 'قيد التجهيز والتخطيط' },
  Planning: { en: 'Preparing', ar: 'قيد التجهيز والتخطيط' },
  Ready: { en: 'Ready for Operations', ar: 'جاهزة للتشغيل' },
  Confirmed: { en: 'Ready for Operations', ar: 'جاهزة للتشغيل' },
  'In Progress': { en: 'In Progress / Operating', ar: 'قيد التنفيذ الميداني' },
  Operating: { en: 'In Progress / Operating', ar: 'قيد التنفيذ الميداني' },
  Completed: { en: 'Completed', ar: 'مكتملة' },
  Cancelled: { en: 'Cancelled', ar: 'ملغاة' },
};

export const TripOperationsHeader: React.FC<TripOperationsHeaderProps> = ({
  trip,
  workspace,
  uiLang,
  onBack,
  onStatusChange,
  onLaunchDispatch,
  onOpenRoadmap,
  onPrintManifest,
  onPrintDaily,
  onPrintProgram,
  onExportRooming,
  onPrintBooklet,
  onOpenQrModal,
  confirmedCount,
  totalServicesCount,
}) => {
  const isAr = uiLang === 'ar';
  const confirmationPct = totalServicesCount > 0 
    ? Math.round((confirmedCount / totalServicesCount) * 100) 
    : 0;

  const livePortalUrl = `${window.location.origin}${window.location.pathname}?view=concierge&quoteId=${encodeURIComponent(trip.quoteId || trip.id)}`;

  return (
    <div className="space-y-3" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          <span>{isAr ? 'العودة إلى ملفات الرحلات' : 'All Trip Files'}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-mono text-[11px]">
            {trip.fileNumber}
          </span>
          <span className="text-slate-300">·</span>
          <select
            value={trip.status}
            onChange={e => onStatusChange(e.target.value as TripStatus)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:border-sky-500"
          >
            {TRIP_STATUSES.map(s => (
              <option key={s} value={s}>
                {isAr ? STATUS_LABELS[s]?.ar || s : STATUS_LABELS[s]?.en || s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Executive Telemetry Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Top Identity Strip */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950">
                VIP GROUP
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {trip.startDate} ({trip.durationDays} {isAr ? 'أيام' : 'Days'})
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <strong>{trip.passengers.length}</strong> {isAr ? 'مسافر' : 'passengers'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
              {trip.travelerName}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-300 font-medium flex-wrap pt-0.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {confirmedCount}/{totalServicesCount} {isAr ? 'خدمة مؤكدة' : 'services confirmed'} ({confirmationPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Primary Operations Actions */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
            <button
              type="button"
              onClick={onOpenRoadmap}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Truck className="w-4 h-4 text-slate-950" />
              <span>{isAr ? 'جدولة خريطة الطريق' : 'Interactive Road Map'}</span>
            </button>

            <button
              type="button"
              onClick={onLaunchDispatch}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>{isAr ? 'أوامر التشغيل والقسائم' : 'Vouchers & Dispatch'}</span>
            </button>

            <a
              href={livePortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'بوابة السائح' : 'Live Portal'}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {onOpenQrModal && (
              <button
                type="button"
                onClick={() => onOpenQrModal('itinerary')}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title={isAr ? 'توليد ومسح رمز الاستجابة السريعة QR للبرنامج والقسائم' : 'Generate QR Code for Itinerary & Vouchers'}
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'رمز QR السريع' : 'Smart QR'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Operational Dispatch Metadata Strip (Flight, Guide, Driver) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Flight & Airport Logistics */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-sky-600" />
              <span>{isAr ? 'بيانات الطيران والاستقبال' : 'Flight & Airport Logistics'}</span>
            </div>
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>{trip.arrival?.flight ? `Arrival: ${trip.arrival.flight}` : 'Flight TBC'}</span>
              <span className="font-mono text-slate-500 text-[11px]">{trip.arrival?.time || '10:00 AM'}</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {trip.arrival?.airport || 'Cairo International Airport (CAI)'}
            </p>
            {trip.arrival?.meetAndAssist && (
              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                VIP Meet & Assist Booked
              </span>
            )}
          </div>

          {/* Assigned Egyptologist Guide */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'المرشد السياحي المرافق' : 'Assigned Tour Guide'}</span>
            </div>
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>{trip.guideName || 'No Guide Assigned'}</span>
              <span className="text-[11px] text-slate-500">{trip.guideLanguage || 'English'}</span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              {trip.guidePhone ? (
                <>
                  <a
                    href={`https://wa.me/${trip.guidePhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                  <span className="text-slate-300">·</span>
                  <a
                    href={`tel:${trip.guidePhone}`}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-mono"
                  >
                    {trip.guidePhone}
                  </a>
                </>
              ) : (
                <span className="text-[11px] text-amber-700 italic">Assign licensed guide</span>
              )}
            </div>
          </div>

          {/* Assigned Driver & Chauffeur Fleet */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'السائق والمركبة المعينة' : 'Chauffeur & Fleet Coach'}</span>
            </div>
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span className="truncate">{trip.driverName || 'No Driver Assigned'}</span>
              <span className="font-mono text-slate-500 text-[11px]">{trip.vehiclePlate || 'Fleet #42'}</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {trip.vehicleType || 'Mercedes-Benz Travego VIP Luxury Coach'}
            </p>
          </div>
        </div>

        {/* Quick Documents Print Toolbar */}
        <div className="px-4 py-2.5 bg-slate-100/60 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAr ? 'وثائق التشغيل الرسمية:' : 'Official Operational Documents:'}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onPrintManifest}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3 h-3 text-slate-500" />
              <span>{isAr ? 'كشف المسافرين' : 'Manifest'}</span>
            </button>
            <button
              type="button"
              onClick={onPrintDaily}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3 h-3 text-slate-500" />
              <span>{isAr ? 'ورقة التشغيل اليومية' : 'Ops Sheet'}</span>
            </button>
            <button
              type="button"
              onClick={onPrintProgram}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3 h-3 text-slate-500" />
              <span>{isAr ? 'برنامج المرشد' : 'Guide Program'}</span>
            </button>
            <button
              type="button"
              onClick={onExportRooming}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>{isAr ? 'قائمة الغرف CSV' : 'Rooming CSV'}</span>
            </button>
            {onOpenQrModal && (
              <button
                type="button"
                onClick={() => onOpenQrModal('itinerary')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title={isAr ? 'توليد وطباعة بطاقات QR للمسافرين' : 'Generate & Print QR Passcards'}
              >
                <QrCode className="w-3 h-3 text-amber-800" />
                <span>{isAr ? 'بطاقة QR' : 'QR Badge'}</span>
              </button>
            )}
            {onPrintBooklet && (
              <button
                type="button"
                onClick={onPrintBooklet}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer"
                title="Print luxury A4 traveler tour booklet & road map PDF"
              >
                <Printer className="w-3 h-3 text-amber-400" />
                <span>{isAr ? 'كتيب الرحلة A4 (PDF)' : 'Tour Booklet (PDF)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
