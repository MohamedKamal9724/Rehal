import React from 'react';
import { 
  Users, Calendar, Plane, Shield, Truck, Compass, 
  ChevronRight, AlertTriangle, CheckCircle2, Phone,
  Clock, MapPin, ExternalLink, Navigation, QrCode, MessageCircle
} from 'lucide-react';
import { TripFile, TripStatus } from '../../lib/tripStore';
import { UILanguage, Workspace } from '../../types';
import { dispatchTripCodeToWhatsApp } from '../../lib/whatsappDispatch';

interface TripFileCardProps {
  trip: TripFile;
  uiLang: UILanguage;
  workspace?: Workspace;
  onOpen: () => void;
  onLaunchDispatch: () => void;
  onOpenRoadmap: () => void;
  onOpenGpsRadar: () => void;
  onOpenQrModal?: () => void;
  livePortalUrl: string;
}

const STATUS_CONFIG: Record<TripStatus, { bg: string; text: string; border: string; dot: string }> = {
  Preparing: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  Ready: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  'In Progress': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Planning: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  Confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Operating: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-500' },
  Completed: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export const TripFileCard: React.FC<TripFileCardProps> = ({
  trip,
  uiLang,
  workspace,
  onOpen,
  onLaunchDispatch,
  onOpenRoadmap,
  onOpenGpsRadar,
  onOpenQrModal,
  livePortalUrl,
}) => {
  const isAr = uiLang === 'ar';
  const statusCfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.Planning;

  // Calculate Confirmation Progress
  const liveServices = trip.services.filter(s => s.status !== 'Cancelled');
  const confirmedServices = liveServices.filter(s => s.status === 'Confirmed' || s.status === 'Reconfirmed');
  const totalServices = liveServices.length;
  const pct = totalServices > 0 ? Math.round((confirmedServices.length / totalServices) * 100) : 0;

  // Calculate days to arrival
  const daysToArrival = trip.startDate 
    ? Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div 
      onClick={onOpen}
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-400/60 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Banner & Header */}
      <div className="p-4 sm:p-5 pb-3">
        {/* Status Bar & File Number */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
              <span>{isAr ? (trip.status === 'Planning' ? 'تخطيط' : trip.status === 'Confirmed' ? 'مؤكدة' : trip.status === 'Operating' ? 'قيد التنفيذ' : trip.status === 'Completed' ? 'مكتملة' : 'ملغاة') : trip.status}</span>
            </span>

            {daysToArrival !== null && daysToArrival >= 0 && daysToArrival <= 5 && trip.status !== 'Completed' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{isAr ? `تصل خلال ${daysToArrival} أيام` : `Arrives in ${daysToArrival}d`}</span>
              </span>
            )}
          </div>

          <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md">
            {trip.fileNumber}
          </span>
        </div>

        {/* Traveler Name & Tour Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
          {trip.travelerName}
        </h3>

        {/* Key Logistics Metadata */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-2 font-medium">
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {trip.startDate || 'Date TBD'} ({trip.durationDays || 4} {isAr ? 'أيام' : 'days'})
          </span>

          <span className="text-slate-300">·</span>

          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-slate-700">{trip.passengers.length || 2}</strong> {isAr ? 'مسافر' : 'Pax'}
          </span>

          {trip.services[0]?.city && (
            <>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {trip.services[0].city}
              </span>
            </>
          )}
        </div>

        {/* Operational Readiness Progress */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'جاهزية الخدمات والحجوزات' : 'Service Confirmations'}</span>
            </span>
            <span className="font-mono font-bold text-slate-800">
              {confirmedServices.length}/{totalServices} ({pct}%)
            </span>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                pct === 100 
                  ? 'bg-emerald-500' 
                  : pct >= 50 
                  ? 'bg-sky-500' 
                  : 'bg-amber-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Guide & Driver Tags - Structured Luxury Icon Boxes (Equal Height on Mobile & Desktop) */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px] items-stretch">
          <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
            <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sand shrink-0">
              <Compass className="w-4 h-4 text-[#795037]" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="luxury-box-title">
                {isAr ? 'المرشد السياحي' : 'Tour Guide'}
              </span>
              <span className="luxury-box-value">
                {trip.guideName || (isAr ? 'لم يعين بعد' : 'Unassigned')}
              </span>
            </div>
          </div>

          <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
            <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sand shrink-0">
              <Truck className="w-4 h-4 text-[#795037]" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="luxury-box-title">
                {isAr ? 'السائق والمركبة' : 'Fleet & Driver'}
              </span>
              <span className="luxury-box-value">
                {trip.driverName || (isAr ? 'لم يعين بعد' : 'Unassigned')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Ribbon (Mobile optimized with high-contrast icon action boxes) */}
      <div 
        className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/90 border-t border-slate-150 flex items-center justify-between gap-1.5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => dispatchTripCodeToWhatsApp({ trip, workspace, uiLang })}
            className="h-8 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title={isAr ? 'إرسال كود الرحلة للعميل على واتساب بنقرة واحدة' : '1-Click WhatsApp Trip Code Dispatch'}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={onLaunchDispatch}
            className="h-8 px-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs border border-sky-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Open official supplier vouchers & operations dispatch"
          >
            <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="hidden sm:inline">{isAr ? 'القسائم والتشغيل' : 'Vouchers'}</span>
            <span className="sm:hidden">{isAr ? 'القسائم' : 'Vouchers'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenRoadmap}
            className="h-8 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Open interactive road map and tour timeline"
          >
            <Truck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="hidden sm:inline">{isAr ? 'خريطة الطريق' : 'Road Map'}</span>
            <span className="sm:hidden">{isAr ? 'الخريطة' : 'Map'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenGpsRadar}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs"
            title="Open GPS Route & Hotel Radar"
          >
            <Navigation className="w-3.5 h-3.5 text-sky-600" />
          </button>

          <a
            href={livePortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs"
            title="Open live traveler mobile concierge portal"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
          </a>

          {onOpenQrModal && (
            <button
              type="button"
              onClick={onOpenQrModal}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-amber-50 hover:bg-amber-100 text-[#44200F] border border-amber-300 transition cursor-pointer shadow-2xs"
              title={isAr ? 'توليد ومسح رمز QR للبرنامج والقسائم' : 'Generate QR Code for Itinerary & Vouchers'}
            >
              <QrCode className="w-3.5 h-3.5 text-[#795037]" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition cursor-pointer ps-1"
        >
          <span>{isAr ? 'التفاصيل' : 'Manage'}</span>
          <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};
