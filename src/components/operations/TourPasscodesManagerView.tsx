import React, { useState, useMemo } from 'react';
import { 
  Key, Users, Shield, Copy, Check, MessageSquare, 
  ExternalLink, QrCode, Printer, RefreshCw, Smartphone, 
  Hotel, Plane, AlertCircle, Sparkles, UserCheck, Share2,
  Plus, Search, Calendar, ChevronRight, CheckCircle2,
  ArrowRight, ArrowLeft, Trash2, Edit3, X, Eye
} from 'lucide-react';
import { 
  TripFile, TripPassenger, loadTrips, saveTrips, 
  findTripOrGuestByCode, newId, CANONICAL_AL_FUTTAIM_TRIP 
} from '../../lib/tripStore';
import { UILanguage, Workspace, Quote } from '../../types';
import { repository } from '../../lib/storage';
import { dispatchTripCodeToWhatsApp } from '../../lib/whatsappDispatch';

interface TourPasscodesManagerViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onOpenTravelerPortal?: (trip: TripFile, passenger?: TripPassenger) => void;
  onBackToApp?: () => void;
}

export const TourPasscodesManagerView: React.FC<TourPasscodesManagerViewProps> = ({
  workspace,
  uiLang,
  onOpenTravelerPortal,
  onBackToApp,
}) => {
  const isAr = uiLang === 'ar';
  const [trips, setTrips] = useState<TripFile[]>(() => {
    const loaded = loadTrips();
    return loaded.length > 0 ? loaded : [CANONICAL_AL_FUTTAIM_TRIP];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string>(() => (loadTrips()[0] || CANONICAL_AL_FUTTAIM_TRIP).id);
  const [isNewCodeModalOpen, setIsNewCodeModalOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // New Code Form State
  const [newTourName, setNewTourName] = useState('');
  const [newPaxCount, setNewPaxCount] = useState<number>(4);
  const [newCodePrefix, setNewCodePrefix] = useState('EGY');
  const [newStartDate, setNewStartDate] = useState('2026-11-20');
  const [newTourDays, setNewTourDays] = useState<number>(7);
  const [newMasterCode, setNewMasterCode] = useState(() => `EG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newGuideName, setNewGuideName] = useState('');
  const [newDriverName, setNewDriverName] = useState('');

  const selectedTrip = trips.find(t => t.id === selectedTripId) || trips[0];

  // Helper to persist changes
  const updateTripsList = (updated: TripFile[]) => {
    setTrips(updated);
    saveTrips(updated);
  };

  const handleCopy = (text: string, id: string, isLink = false) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } else {
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  const getPassengerLink = (code: string) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?code=${code}`;
  };

  const handleSendWhatsAppToGuest = (trip: TripFile, pax: TripPassenger) => {
    dispatchTripCodeToWhatsApp({ trip, passenger: pax, workspace, uiLang });
  };

  const handleSendWhatsAppGroupMaster = (trip: TripFile) => {
    dispatchTripCodeToWhatsApp({ trip, workspace, uiLang });
  };

  // Generate or regenerate passcodes for a trip
  const handleRegenerateCodesForTrip = (tripId: string) => {
    const target = trips.find(t => t.id === tripId);
    if (!target) return;

    const prefix = (target.travelerName.split(' ')[0] || 'VIP').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || 'EGY';
    const updatedPassengers: TripPassenger[] = (target.passengers || []).map((p, idx) => ({
      ...p,
      personalCode: `${prefix}-${String(idx + 1).padStart(2, '0')}`,
    }));

    const updatedTrip: TripFile = {
      ...target,
      tourPasscode: target.tourPasscode || `EG-${Math.floor(1000 + Math.random() * 9000)}`,
      passengers: updatedPassengers,
      updatedAt: new Date().toISOString(),
    };

    const next = trips.map(t => t.id === tripId ? updatedTrip : t);
    updateTripsList(next);
  };

  // Create new Tour & Passcode Group
  const handleCreateNewPasscodeGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourName.trim()) return;

    const prefix = newCodePrefix.trim().toUpperCase() || 'VIP';
    const passengers: TripPassenger[] = [];
    for (let i = 1; i <= newPaxCount; i++) {
      passengers.push({
        id: newId(),
        name: i === 1 ? newTourName.trim() : `${isAr ? 'مسافر' : 'Guest'} #${i}`,
        nationality: isAr ? 'دولي' : 'International',
        type: 'Adult',
        room: `Room ${Math.ceil(i / 2)}`,
        dietary: 'Standard',
        personalCode: `${prefix}-${String(i).padStart(2, '0')}`,
      });
    }

    const newTrip: TripFile = {
      id: `trip-${Date.now()}`,
      quoteId: `quote-manual-${Date.now()}`,
      fileNumber: `EG-FILE-${Math.floor(1000 + Math.random() * 9000)}`,
      tourPasscode: newMasterCode.trim().toUpperCase(),
      travelerName: newTourName.trim(),
      startDate: newStartDate,
      durationDays: newTourDays,
      status: 'Operating',
      arrival: {
        flight: 'MS 800',
        date: newStartDate,
        time: '11:00',
        airport: 'Cairo International (CAI)',
        meetAndAssist: true,
      },
      departure: {
        flight: 'MS 801',
        date: newStartDate,
        time: '19:00',
        airport: 'Cairo International (CAI)',
      },
      guideName: newGuideName,
      guidePhone: '+20 100 000 1111',
      guideLanguage: 'English / Arabic',
      driverName: newDriverName,
      driverPhone: '+20 122 000 2222',
      vehiclePlate: 'أ ب ج 7712',
      vehicleType: 'Tourist Bus VIP',
      emergencyContact: workspace.contactPhone || '+20 100 000 0000',
      services: [],
      passengers,
      checklist: [],
      log: [{ id: newId(), at: new Date().toISOString(), text: `Generated Tour Passcodes for ${newTourName} (${newPaxCount} pax)` }],
      updatedAt: new Date().toISOString(),
    };

    const next = [newTrip, ...trips];
    updateTripsList(next);
    setSelectedTripId(newTrip.id);
    setIsNewCodeModalOpen(false);

    // Reset inputs
    setNewTourName('');
    setNewMasterCode(`EG-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Create Instant Sample Tour Group for testing
  const handleCreateSampleTourGroup = () => {
    const sampleTrip: TripFile = {
      id: `trip-demo-${Date.now()}`,
      quoteId: `quote-demo-${Date.now()}`,
      fileNumber: 'EG-CAI-4821',
      tourPasscode: 'EG-4821',
      travelerName: isAr ? 'فوج الأندلس الثقافي (VIP)' : 'VIP Nile Horizon Cultural Tour',
      startDate: '2026-11-20',
      durationDays: 8,
      status: 'Operating',
      arrival: {
        flight: 'MS 778',
        date: '2026-11-20',
        time: '14:30',
        airport: 'Cairo International Airport (CAI)',
        meetAndAssist: true,
      },
      departure: {
        flight: 'MS 779',
        date: '2026-11-28',
        time: '18:00',
        airport: 'Cairo International Airport (CAI)',
      },
      guideName: isAr ? 'د. محمود الفقي (مرشد أثري معتمد)' : 'Dr. Mahmoud El-Feky (Licensed Egyptologist)',
      guidePhone: '+20 100 123 4567',
      guideLanguage: 'English / Arabic',
      driverName: isAr ? 'كابتن / سامح البدري' : 'Captain Sameh El-Badry',
      driverPhone: '+20 122 987 6543',
      vehiclePlate: 'أ ب ج ٤٨٢١',
      vehicleType: 'Mercedes VIP Tour Coach 2026',
      emergencyContact: workspace.contactPhone || '+20 100 000 0000',
      services: [],
      passengers: [
        {
          id: 'pax-1',
          name: isAr ? 'أ/ أحمد المنصوري' : 'Mr. Ahmed Al-Mansouri',
          nationality: isAr ? 'إماراتي' : 'UAE',
          type: 'Adult',
          room: 'Suite 401 (Nile View)',
          dietary: 'Halal / Vegetarian',
          personalCode: 'VIP-01',
          phone: '+971 50 123 4567',
        },
        {
          id: 'pax-2',
          name: isAr ? 'د/ سارة المنصوري' : 'Dr. Sarah Al-Mansouri',
          nationality: isAr ? 'إماراتي' : 'UAE',
          type: 'Adult',
          room: 'Suite 401 (Nile View)',
          dietary: 'Standard',
          personalCode: 'VIP-02',
          phone: '+971 50 123 4568',
        },
        {
          id: 'pax-3',
          name: isAr ? 'عمر المنصوري' : 'Omar Al-Mansouri',
          nationality: isAr ? 'إماراتي' : 'UAE',
          type: 'Child',
          room: 'Room 402',
          dietary: 'Standard',
          personalCode: 'VIP-03',
        },
        {
          id: 'pax-4',
          name: isAr ? 'مريم المنصوري' : 'Mariam Al-Mansouri',
          nationality: isAr ? 'إماراتي' : 'UAE',
          type: 'Child',
          room: 'Room 402',
          dietary: 'Standard',
          personalCode: 'VIP-04',
        },
      ],
      checklist: [],
      log: [{ id: newId(), at: new Date().toISOString(), text: 'Generated Tour Passcodes' }],
      updatedAt: new Date().toISOString(),
    };

    const next = [sampleTrip, ...trips];
    updateTripsList(next);
    setSelectedTripId(sampleTrip.id);
  };

  // Filtered trips for search
  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const q = searchQuery.toLowerCase().trim();
    return trips.filter(t => 
      t.travelerName.toLowerCase().includes(q) ||
      (t.tourPasscode && t.tourPasscode.toLowerCase().includes(q)) ||
      t.fileNumber.toLowerCase().includes(q) ||
      t.passengers?.some(p => (p.personalCode && p.personalCode.toLowerCase().includes(q)) || p.name.toLowerCase().includes(q))
    );
  }, [trips, searchQuery]);

  // Overall Statistics
  const totalPassengersWithCodes = trips.reduce((acc, t) => acc + (t.passengers?.filter(p => !!p.personalCode).length || 0), 0);

  return (
    <div className="space-y-6 pb-24 md:pb-8 text-slate-900 selection:bg-amber-100" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {onBackToApp && (
                <button
                  type="button"
                  onClick={onBackToApp}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition md:hidden cursor-pointer"
                  title={isAr ? 'رجوع' : 'Back'}
                >
                  {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                </button>
              )}
              <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-amber shrink-0">
                <Key className="w-4 h-4 text-amber-800" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                {isAr ? 'منظومة أكواد الأفواج والمسافرين' : 'Tour & Traveler Passcode Hub'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
              {isAr ? 'إدارة وتوليد أكواد الفوج لكل عميل' : 'Tour Groups & Individual Guest Passcodes'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isAr 
                ? 'لوحة تحكم خاصة بمسؤول شركة السياحة لإنشاء كود عام للفوج، وكود مخصص لكل مسافر (GUEST-01, GUEST-02) ليتعرف النظام على كل عميل ويوفر له بوابته الهاتفية فوراً.'
                : 'Agency command center to generate master tour passcodes and individualized guest voucher codes. Travelers enter their code on their phone to access room, flight, driver, and roadmap details.'}
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCreateSampleTourGroup}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'فوج تجريبي' : 'Sample Tour'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewCodeModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? '+ إنشاء أكواد لفوج أو عميل جديد' : '+ Generate New Tour Codes'}</span>
            </button>
          </div>
        </div>

        {/* Metric Badges (Strictly Equal Height & Symmetrical) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 items-stretch">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col justify-between min-h-[76px] h-full shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block truncate">{isAr ? 'أفواج سياحية مسجلة' : 'Registered Tours'}</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block leading-none">{trips.length}</span>
          </div>

          <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200/80 flex flex-col justify-between min-h-[76px] h-full shadow-2xs">
            <span className="text-[10px] text-emerald-800 font-bold uppercase block truncate">{isAr ? 'أكواد مسافرين نشطة' : 'Active Guest Codes'}</span>
            <span className="text-xl font-bold font-mono text-emerald-900 mt-1 block leading-none">{totalPassengersWithCodes}</span>
          </div>

          <div className="bg-sky-50/70 rounded-xl p-3 border border-sky-200/80 flex flex-col justify-between min-h-[76px] h-full shadow-2xs">
            <span className="text-[10px] text-sky-800 font-bold uppercase block truncate">{isAr ? 'أفواج قيد التنفيذ' : 'In Operation'}</span>
            <span className="text-xl font-bold font-mono text-sky-900 mt-1 block leading-none">
              {trips.filter(t => t.status === 'Operating').length}
            </span>
          </div>

          <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80 flex flex-col justify-between min-h-[76px] h-full shadow-2xs">
            <span className="text-[10px] text-amber-800 font-bold uppercase block truncate">{isAr ? 'تأكيد الحافلات والمرشدين' : 'Assigned Guides'}</span>
            <span className="text-xl font-bold font-mono text-amber-900 mt-1 block leading-none">
              {trips.length > 0 ? `${trips.filter(t => !!t.guideName).length}/${trips.length}` : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout (Responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tour Groups List (4 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-amber shrink-0">
                  <Users className="w-3.5 h-3.5 text-amber-800" />
                </div>
                <span>{isAr ? 'قائمة الأفواج والرحلات' : 'Tour Groups & Expeditions'}</span>
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredTrips.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث باسم الفوج أو الكود...' : 'Search by tour or code...'}
                className="w-full ps-8 pe-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Tours Scroll List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredTrips.map(trip => {
                const isSelected = selectedTrip?.id === trip.id;
                const paxCount = trip.passengers?.length || 2;
                const masterCode = trip.tourPasscode || `EG-${trip.fileNumber.replace(/[^0-9]/g, '').slice(-4) || '8491'}`;

                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`p-3.5 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[10px] font-bold text-white bg-slate-900 px-1.5 py-0.2 rounded">
                            {masterCode}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {trip.durationDays || 7} {isAr ? 'أيام' : 'days'}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {trip.travelerName}
                        </h4>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        trip.status === 'Operating' ? 'bg-sky-100 text-sky-800' :
                        trip.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isAr ? (trip.status === 'Operating' ? 'قيد التنفيذ' : trip.status === 'Confirmed' ? 'مؤكدة' : 'تخطيط') : trip.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span><strong>{paxCount}</strong> {isAr ? 'مسافر بكود' : 'Vouchers'}</span>
                      </span>

                      <span className="font-mono text-slate-400">
                        {trip.startDate || '2026-11'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredTrips.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  {isAr ? 'لا توجد نتائج مطابقة' : 'No matching tours found'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Tour Details & Passenger Codes Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTrip ? (
            <>
              {/* Selected Group Master Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'كود الفوج العام الرئيسي' : 'Master Tour Passcode'}</span>
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold font-serif">
                      {selectedTrip.travelerName}
                    </h2>
                  </div>

                  {/* Master Code Box */}
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-xl bg-black/40 border border-amber-500/40 text-amber-300 font-mono text-lg font-black tracking-wider shadow-inner text-center">
                      {selectedTrip.tourPasscode || selectedTrip.fileNumber}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(selectedTrip.tourPasscode || selectedTrip.fileNumber, 'master')}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition cursor-pointer"
                      title={isAr ? 'نسخ كود الفوج' : 'Copy Master Code'}
                    >
                      {copiedCodeId === 'master' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppGroupMaster(selectedTrip)}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs cursor-pointer"
                      title={isAr ? 'مشاركة عبر واتساب للفوج' : 'Share Master Code on WhatsApp'}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Logistics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">{isAr ? 'المرشد السياحي' : 'Licensed Guide'}</span>
                    <span className="font-semibold text-slate-200 truncate block">{selectedTrip.guideName || (isAr ? 'لم يعين' : 'TBD')}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">{isAr ? 'السائق والمركبة' : 'Fleet & Driver'}</span>
                    <span className="font-semibold text-slate-200 truncate block">{selectedTrip.driverName || (isAr ? 'حافلة VIP' : 'VIP Bus')}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">{isAr ? 'تاريخ الوصول' : 'Arrival Date'}</span>
                    <span className="font-semibold text-slate-200 block font-mono">{selectedTrip.startDate}</span>
                  </div>
                </div>

                {/* Quick Action Ribbon */}
                <div className="pt-2 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => handleRegenerateCodesForTrip(selectedTrip.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تحديث وتوليد أكواد جديدة لجميع العملاء' : 'Regenerate All Passenger Codes'}</span>
                  </button>

                  {/* Test Master Portal */}
                  <button
                    type="button"
                    onClick={() => onOpenTravelerPortal && onOpenTravelerPortal(selectedTrip)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isAr ? 'معاينة شاشة السائح المباشرة' : 'Preview Live Portal'}</span>
                  </button>
                </div>
              </div>

              {/* Passengers & Individual Codes Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'أكواد المسافرين الشخصية (كل عميل له كود خاص)' : 'Individual Client Passcodes & Vouchers'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isAr 
                        ? 'كود شخصي محمي لكل مسافر للوصول إلى رقم غرفته وتفاصيله الفردية'
                        : 'Unique secure passcode for each traveler to access their room assignment and itinerary.'}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {selectedTrip.passengers?.length || 0} {isAr ? 'مسافر' : 'Pax'}
                  </span>
                </div>

                {/* Mobile Friendly Passenger Cards / List */}
                <div className="space-y-2.5">
                  {(selectedTrip.passengers || []).map((pax, idx) => {
                    const code = pax.personalCode || `${selectedTrip.tourPasscode || 'GUEST'}-${idx + 1}`;
                    const link = getPassengerLink(code);

                    return (
                      <div 
                        key={pax.id || idx}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-amber-400 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {pax.name || `${isAr ? 'المسافر' : 'Passenger'} #${idx + 1}`}
                              </span>
                              {pax.room && (
                                <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                                  {pax.room}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{pax.nationality || 'Spanish'}</span>
                              {pax.dietary && pax.dietary !== 'Standard' && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-700 font-medium">{pax.dietary}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Passenger Code & Action Buttons */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                          {/* Code Display */}
                          <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono font-bold text-xs tracking-wider">
                            {code}
                          </div>

                          {/* Copy Code */}
                          <button
                            type="button"
                            onClick={() => handleCopy(code, pax.id)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                            title={isAr ? 'نسخ الكود' : 'Copy Code'}
                          >
                            {copiedCodeId === pax.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* WhatsApp Direct Share */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppToGuest(selectedTrip, pax)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                            title={isAr ? 'إرسال الكود للعميل عبر واتساب' : 'Send Passcode via WhatsApp'}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span className="hidden sm:inline">{isAr ? 'واتساب' : 'WhatsApp'}</span>
                          </button>

                          {/* Test As This Passenger */}
                          <button
                            type="button"
                            onClick={() => onOpenTravelerPortal && onOpenTravelerPortal(selectedTrip, pax)}
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition cursor-pointer"
                            title={isAr ? 'معاينة بوابة هذا المسافر' : 'Test As This Guest'}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-amber-200/80 p-8 sm:p-10 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Key className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">
                  {isAr ? 'لا توجد أكواد أفواج مسجلة حالياً' : 'No Tour Groups or Passcodes Registered Yet'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {isAr 
                    ? 'أكواد الدخول تتيح للمسافرين والمرشدين متابعة خطة الرحلة والفنادق والسائق هاتفياً فوراً. يمكنك إنشاء كود جديد أو تحميل الفوج التجريبي للاختبار.'
                    : 'Tour passcodes give travelers and guides instant mobile access to live itineraries, rooming lists, and driver contacts.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCodeModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إنشاء أكواد خاصة بفوج جديد' : 'Generate New Tour Codes'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateSampleTourGroup}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'توليد فوج تجريبي للاستكشاف' : 'Load Sample VIP Tour (Demo)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: GENERATE NEW TOUR & PASSCODES */}
      {isNewCodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                  <Key className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                    {isAr ? 'إنشاء أكواد خاصة بفوج جديد' : 'Generate New Tour & Guest Passcodes'}
                  </h3>
                  <span className="text-[11px] text-slate-500 block">
                    {isAr ? 'توليد تلقائي للأكواد الفردية لكل مسافر' : 'Automatic unique code generation for each client'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewCodeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPasscodeGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAr ? 'اسم الفوج / العميل الرئيسي' : 'Group or Lead Traveler Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={newTourName}
                  onChange={e => setNewTourName(e.target.value)}
                  placeholder={isAr ? 'مثال: فوج الأندلس الثقافي (VIP)' : 'e.g. VIP Horizon Cultural Group'}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'عدد المسافرين (Pax)' : 'Number of Guests (Pax)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newPaxCount}
                    onChange={e => setNewPaxCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'بادئة الكود (Prefix)' : 'Code Prefix'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newCodePrefix}
                    onChange={e => setNewCodePrefix(e.target.value.toUpperCase())}
                    placeholder="VIP / EGY"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-amber-900 block">
                  {isAr ? 'معاينة الأكواد التي سيتم توليدها تلقائياً:' : 'Sample Generated Passcodes:'}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900 font-bold">
                    {newMasterCode} ({isAr ? 'كود الفوج العام' : 'Master Code'})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                    {newCodePrefix || 'VIP'}-01
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                    {newCodePrefix || 'VIP'}-02
                  </span>
                  {newPaxCount > 2 && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      ... +{newPaxCount - 2} {isAr ? 'أكواد أخرى' : 'more'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'تاريخ البداية' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'مدة الرحلة (أيام)' : 'Duration (Days)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newTourDays}
                    onChange={e => setNewTourDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCodeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'توليد وحفظ الأكواد الآن' : 'Generate & Save Codes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
