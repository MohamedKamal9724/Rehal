import React, { useState } from 'react';
import { 
  Key, Users, Shield, Copy, Check, MessageSquare, 
  ExternalLink, QrCode, Printer, RefreshCw, Smartphone, 
  Hotel, Plane, AlertCircle, Sparkles, UserCheck, Share2
} from 'lucide-react';
import { TripFile, TripPassenger, saveTrips, loadTrips } from '../../lib/tripStore';
import { UILanguage, Workspace } from '../../types';
import { dispatchTripCodeToWhatsApp } from '../../lib/whatsappDispatch';

interface TripPasscodesConsoleProps {
  trip: TripFile;
  workspace: Workspace;
  uiLang: UILanguage;
  onUpdateTrip?: (updated: TripFile) => void;
  onTestPassengerCode?: (code: string) => void;
  onOpenQrModal?: (type: 'itinerary' | 'passenger', pax?: TripPassenger) => void;
}

export const TripPasscodesConsole: React.FC<TripPasscodesConsoleProps> = ({
  trip,
  workspace,
  uiLang,
  onUpdateTrip,
  onTestPassengerCode,
  onOpenQrModal,
}) => {
  const isAr = uiLang === 'ar';
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const masterCode = trip.tourPasscode || `EG-${trip.fileNumber.replace(/[^0-9]/g, '').slice(-4) || '8491'}`;

  const handleCopy = (text: string, id: string, isLink = false) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    } else {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleGenerateCodes = () => {
    const prefix = (trip.travelerName.split(' ')[0] || 'GUEST').slice(0, 5).toUpperCase();
    const updatedPassengers: TripPassenger[] = (trip.passengers || []).map((p, idx) => ({
      ...p,
      personalCode: p.personalCode || `${prefix}-${String(idx + 1).padStart(2, '0')}`,
    }));

    const updatedTrip: TripFile = {
      ...trip,
      tourPasscode: trip.tourPasscode || `EG-${Math.floor(1000 + Math.random() * 9000)}`,
      passengers: updatedPassengers,
      updatedAt: new Date().toISOString(),
    };

    const allTrips = loadTrips();
    const idx = allTrips.findIndex(t => t.id === trip.id);
    if (idx >= 0) {
      allTrips[idx] = updatedTrip;
      saveTrips(allTrips);
    }
    if (onUpdateTrip) onUpdateTrip(updatedTrip);
  };

  const getPassengerLink = (code: string) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?code=${code}`;
  };

  const handleSendWhatsAppToGuest = (pax: TripPassenger) => {
    dispatchTripCodeToWhatsApp({ trip, passenger: pax, workspace, uiLang });
  };

  const handlePrintManifest = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-900" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Key className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
              {isAr ? 'منظومة أكواد الدخول للأفواج' : 'Tour & Guest Passcode Security'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
            {isAr ? `أكواد دخول الفوج: ${trip.travelerName}` : `Guest Passcodes for: ${trip.travelerName}`}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {isAr 
              ? 'توليد وإدارة الأكواد السرية الخاصة بالفوج والعملاء. يدخل السائح الكود من هاتفه ليظهر له فوراً برنامجه المخصص، غرفته، وسائقه ومرشده.'
              : 'Generate secure access codes for the tour and individual travelers. Guests enter their code on mobile to unlock their personalized itinerary and rooming details.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateCodes}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isAr ? 'توليد وتحديث الأكواد' : 'Generate / Sync Passcodes'}
          </button>

          <button
            type="button"
            onClick={handlePrintManifest}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            {isAr ? 'طباعة كشف الأكواد' : 'Print Passcodes'}
          </button>
        </div>
      </div>

      {/* Master Tour Passcode Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'كود الفوج العام (Master Tour Passcode)' : 'Master Tour Group Passcode'}</span>
          </div>
          <p className="text-xs text-slate-300">
            {isAr 
              ? 'كود عام يمنح أي مسافر بالفوج الدخول للاطلاع على البرنامج اليومي وبيانات المرشد والحافلة.'
              : 'Shared group passcode allowing any traveler in the expedition to view the master itinerary and contacts.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
            {masterCode}
          </div>

          <button
            type="button"
            onClick={() => handleCopy(masterCode, 'master')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition shrink-0"
            title={isAr ? 'نسخ كود الفوج' : 'Copy Code'}
          >
            {copiedCode === 'master' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {onOpenQrModal && (
            <button
              type="button"
              onClick={() => onOpenQrModal('itinerary')}
              className="p-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 transition shrink-0"
              title={isAr ? 'توليد ومسح رمز QR لكود الفوج' : 'Generate Group QR Code'}
            >
              <QrCode className="w-4 h-4 text-amber-300" />
            </button>
          )}

          {onTestPassengerCode && (
            <button
              type="button"
              onClick={() => onTestPassengerCode(masterCode)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition shrink-0 flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isAr ? 'تجربة على الهاتف' : 'Test on Mobile'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Individual Passenger Codes List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'الأكواد الفردية لكل عميل ومسافر بالفوج' : 'Individual Traveler Personal Codes'}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({trip.passengers?.length || 0} {isAr ? 'مسافر' : 'Travelers'})
            </span>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {isAr ? 'كل كود يفتح بيانات الغرفة والتفضيلات الشخصية' : 'Personalized room & dietary mapping'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {(trip.passengers || []).map((pax, idx) => {
            const personalCode = pax.personalCode || `GUEST-${String(idx + 1).padStart(2, '0')}`;
            const link = getPassengerLink(personalCode);

            return (
              <div 
                key={pax.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                {/* Passenger Info */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center font-mono text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {pax.name || (isAr ? `مسافر رقم ${idx + 1}` : `Guest #${idx + 1}`)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {pax.type}
                      </span>
                      {pax.room && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                          <Hotel className="w-2.5 h-2.5" />
                          {pax.room}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                      <span>{pax.nationality || 'Spain'}</span>
                      {pax.dietary && (
                        <>
                          <span>·</span>
                          <span className="text-amber-700 font-medium">Dietary: {pax.dietary}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Passcode and Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{isAr ? 'الكود:' : 'Code:'}</span>
                    <span className="font-mono font-bold text-sm text-slate-900 tracking-wider">
                      {personalCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(personalCode, pax.id)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                    title={isAr ? 'نسخ كود المسافر' : 'Copy Code'}
                  >
                    {copiedCode === pax.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {onOpenQrModal && (
                    <button
                      type="button"
                      onClick={() => onOpenQrModal('passenger', pax)}
                      className="p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition"
                      title={isAr ? 'توليد ومسح رمز QR خاص بهذا المسافر' : 'Generate personal passenger QR code'}
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-800" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppToGuest(pax)}
                    className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition"
                    title={isAr ? 'إرسال الكود للعميل عبر واتساب' : 'Share Code via WhatsApp'}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {onTestPassengerCode && (
                    <button
                      type="button"
                      onClick={() => onTestPassengerCode(personalCode)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1 shadow-2xs"
                    >
                      <Smartphone className="w-3 h-3 text-amber-400" />
                      <span>{isAr ? 'تجربة كمسافر' : 'Preview'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
