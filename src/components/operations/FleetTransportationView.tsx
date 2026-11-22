import { writeSafePrintDocument } from '../../lib/safePrint';
import React, { useState, useMemo } from 'react';
import { 
  Truck, Search, Phone, MessageSquare, Printer, CheckCircle2, 
  Clock, AlertCircle, Plus, Edit3, X, Save, Car, Shield, 
  MapPin, Plane, Users, Calendar, ArrowRight, ArrowLeft, RefreshCw
} from 'lucide-react';
import { TripFile, loadTrips, saveTrips, newId } from '../../lib/tripStore';
import { Workspace, UILanguage } from '../../types';
import { GuidanceTrigger } from '../common/GuidanceTrigger';

interface FleetTransportationViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onNavigateToTrips?: () => void;
}

interface VehicleMovement {
  id: string;
  tripId: string;
  fileNumber: string;
  travelerName: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleType: string;
  route: string;
  pickupTime: string;
  pickupLocation: string;
  destination: string;
  paxCount: number;
  flightDetails?: string;
  status: 'In-Transit' | 'Dispatched' | 'Scheduled' | 'Standby' | 'Completed';
  notes?: string;
}

export const FleetTransportationView: React.FC<FleetTransportationViewProps> = ({
  workspace,
  uiLang,
  onNavigateToTrips,
}) => {
  const isAr = uiLang === 'ar';
  const [trips, setTrips] = useState<TripFile[]>(() => loadTrips());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<VehicleMovement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'movements' | 'fleet_roster'>('movements');

  // Convert trips into concrete vehicle movements
  const movements: VehicleMovement[] = useMemo(() => {
    const list: VehicleMovement[] = [];
    trips.forEach(t => {
      // Main assigned trip vehicle
      const isAirportArrival = t.arrival && t.arrival.flight;
      const primaryHotel =
        t.services.find(s => (s.supplierType || '').toLowerCase().includes('hotel') && (s.city || '').toLowerCase().includes('cairo'))?.supplierName ||
        t.services.find(s => (s.supplierType || '').toLowerCase().includes('hotel'))?.supplierName ||
        'Four Seasons Hotel Cairo at Nile Plaza';
      list.push({
        id: `mov-${t.id}-main`,
        tripId: t.id,
        fileNumber: t.fileNumber,
        travelerName: t.travelerName,
        driverName: t.driverName || '',
        driverPhone: t.driverPhone || '',
        vehiclePlate: t.vehiclePlate || '',
        vehicleType: t.vehicleType || (isAr ? 'مركبة سياحية' : 'Tourist Vehicle'),
        route: isAirportArrival 
          ? `${t.arrival.airport || 'Cairo Airport CAI'} → ${primaryHotel}`
          : `${primaryHotel} → Giza Plateau & GEM Museum`,
        pickupTime: t.arrival?.time || '09:00',
        pickupLocation: t.arrival?.airport || 'Cairo Airport Terminal 3',
        destination: primaryHotel,
        paxCount: t.passengers?.length || 4,
        flightDetails: isAirportArrival ? `${t.arrival.flight} (${t.arrival.time})` : undefined,
        status: t.status === 'Operating' ? 'In-Transit' : 'Dispatched',
        notes: isAirportArrival ? 'Meet & Assist with VIP Name Signboard inside Arrivals Hall' : 'Full-day sightseeing tour',
      });

      // Find any specific transfer services in services array
      t.services.filter(s => s.supplierType.toLowerCase().includes('transfer') || s.serviceName.toLowerCase().includes('transfer') || s.serviceName.toLowerCase().includes('flight')).slice(0, 1).forEach((s) => {
        list.push({
          id: `mov-${t.id}-svc-${s.id}`,
          tripId: t.id,
          fileNumber: t.fileNumber,
          travelerName: t.travelerName,
          driverName: t.driverName || '',
          driverPhone: t.driverPhone || '',
          vehiclePlate: t.vehiclePlate || '',
          vehicleType: t.vehicleType || (isAr ? 'حافلة سياحية' : 'Tourism Coach'),
          route: `${s.city}: ${s.serviceName}`,
          pickupTime: '14:30',
          pickupLocation: `${s.city} Hotel Reception`,
          destination: `${s.city} Airport / Station`,
          paxCount: t.passengers?.length || 6,
          status: 'Scheduled',
          notes: s.note || 'Intercity convoy transfer & luggage assistance',
        });
      });
    });

    return list;
  }, [trips, isAr]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (vehicleFilter !== 'All' && !m.vehicleType.toLowerCase().includes(vehicleFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          m.driverName.toLowerCase().includes(q) ||
          m.vehiclePlate.toLowerCase().includes(q) ||
          m.vehicleType.toLowerCase().includes(q) ||
          m.fileNumber.toLowerCase().includes(q) ||
          m.travelerName.toLowerCase().includes(q) ||
          m.route.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [movements, statusFilter, vehicleFilter, searchQuery]);

  // KPIs
  const stats = useMemo(() => {
    const inTransit = movements.filter(m => m.status === 'In-Transit').length;
    const dispatched = movements.filter(m => m.status === 'Dispatched').length;
    const scheduled = movements.filter(m => m.status === 'Scheduled').length;
    const airportPickups = movements.filter(m => !!m.flightDetails).length;
    return { total: movements.length, inTransit, dispatched, scheduled, airportPickups };
  }, [movements]);

  // WhatsApp Driver Dispatch Generator
  const sendDriverWhatsApp = (m: VehicleMovement) => {
    const text = isAr
      ? `*أمر تشغيل حركة سيارة سياحية - ${workspace.name}*\n` +
        `----------------------------------------\n` +
        `🚗 *المركبة:* ${m.vehicleType} (لوحة: ${m.vehiclePlate})\n` +
        `👤 *الكابتن:* ${m.driverName}\n` +
        `📁 *رقم الفوج / الملف:* ${m.fileNumber}\n` +
        `👥 *اسم الضيف / الفوج:* ${m.travelerName} (${m.paxCount} ركاب)\n` +
        `🕒 *موعد التحرك:* ${m.pickupTime}\n` +
        `📍 *مكان التحرك:* ${m.pickupLocation}\n` +
        `🏁 *الوجهة:* ${m.destination}\n` +
        (m.flightDetails ? `✈️ *بيانات الرحلة الجوية:* ${m.flightDetails}\n` : '') +
        (m.notes ? `📝 *ملاحظات خاصة:* ${m.notes}\n` : '') +
        `----------------------------------------\n` +
        `📞 *طوارئ العمليات 24/7:* ${workspace.contactPhone || '+20 100 249 1000'}\n` +
        `يرجى تأكيد الاستلام والتواجد قبل الموعد بـ 20 دقيقة.`
      : `*TOURIST TRANSPORT DISPATCH ORDER - ${workspace.name}*\n` +
        `----------------------------------------\n` +
        `🚗 *Vehicle:* ${m.vehicleType} (Plate: ${m.vehiclePlate})\n` +
        `👤 *Chauffeur:* ${m.driverName}\n` +
        `📁 *File Number:* ${m.fileNumber}\n` +
        `👥 *Guest / Group:* ${m.travelerName} (${m.paxCount} Pax)\n` +
        `🕒 *Pickup Time:* ${m.pickupTime}\n` +
        `📍 *Pickup Point:* ${m.pickupLocation}\n` +
        `🏁 *Destination:* ${m.destination}\n` +
        (m.flightDetails ? `✈️ *Flight Details:* ${m.flightDetails}\n` : '') +
        (m.notes ? `📝 *Notes:* ${m.notes}\n` : '') +
        `----------------------------------------\n` +
        `📞 *24/7 Operations Desk:* ${workspace.contactPhone || '+20 100 249 1000'}\n` +
        `Please confirm receipt and report at pickup location 20 mins prior.`;

    const cleanPhone = (m.driverPhone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Official Ministry of Tourism Movement Permit A4 Print
  const printMovementPermit = (m: VehicleMovement) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const title = `Transport-Permit-${m.vehiclePlate}-${m.fileNumber}`;
    writeSafePrintDocument(w, `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}">
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
          .header { border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
          .subtitle { text-align: center; font-size: 12px; color: #475569; }
          .badge { display: inline-block; background: #0f172a; color: white; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; }
          .card-title { font-weight: bold; font-size: 12px; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #e2e8f0; }
          .row-label { color: #64748b; font-size: 11px; }
          .row-val { font-weight: bold; }
          .full-box { border: 2px solid #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 20px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; }
          .stamp-box { width: 140px; height: 90px; border: 2px dashed #94a3b8; border-radius: 6px; margin: 8px auto 0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin:0; font-size: 16px;">${workspace.name}</h2>
            ${workspace.contactPhone ? `<div style="font-size: 11px; color: #475569;">Operations Desk: <b>${workspace.contactPhone}</b></div>` : ''}
            ${workspace.contactEmail ? `<div style="font-size: 11px; color: #475569;">Email: <b>${workspace.contactEmail}</b></div>` : ''}
          </div>
          <div style="text-align: right;">
            <div class="badge">أمر تشغيل حركة سيارة سياحية</div>
            <div style="font-size: 11px; margin-top: 4px; font-weight: bold;">Official Transport Permit</div>
            <div style="font-size: 11px; color: #64748b;">Ref: MOT-MOV-${Date.now().toString().slice(-6)}</div>
          </div>
        </div>

        <div class="title">${isAr ? 'أمر حركة وتشغيل مركبة سياحية معتمد' : 'OFFICIAL TOURIST VEHICLE MOVEMENT WAYBILL'}</div>
        <div class="subtitle">${isAr ? 'صادر بموجب تعليمات الإدارة العامة لشرطة السياحة والآثار وقطاع الشركات بوزارة السياحة' : 'Issued under Tourism Police & Egyptian Ministry of Tourism Regulations'}</div>

        <div class="grid" style="margin-top: 20px;">
          <div class="card">
            <div class="card-title">${isAr ? 'بيانات المركبة والسائق' : 'VEHICLE & CHAUFFEUR'}</div>
            <div class="row"><span class="row-label">${isAr ? 'نوع وموديل المركبة' : 'Vehicle Type'}:</span><span class="row-val">${m.vehicleType || (isAr ? 'مركبة سياحية' : 'Tour Vehicle')}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'رقم اللوحة السياحية' : 'Tourism Plate No.'}:</span><span class="row-val" style="font-size: 14px; color: #0284c7;">${m.vehiclePlate || (isAr ? 'قيد التحديد' : 'Pending plate')}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'اسم السائق المعتمد' : 'Chauffeur Name'}:</span><span class="row-val">${m.driverName || (isAr ? 'لم يُعيّن سائق بعد' : 'Driver not assigned')}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'هاتف السائق' : 'Driver Mobile'}:</span><span class="row-val">${m.driverPhone || '—'}</span></div>
          </div>

          <div class="card">
            <div class="card-title">${isAr ? 'بيانات الفوج والرحلة' : 'TRIP & GUEST PARTICULARS'}</div>
            <div class="row"><span class="row-label">${isAr ? 'رقم ملف التشغيل' : 'File Number'}:</span><span class="row-val" style="font-family: monospace;">${m.fileNumber}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'اسم الضيف / الفوج' : 'Traveler Name'}:</span><span class="row-val">${m.travelerName}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'عدد الركاب' : 'Passenger Count'}:</span><span class="row-val">${m.paxCount} ${isAr ? 'أفراد' : 'Pax'}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'رقم الطيران / الوصول' : 'Flight / Pickup'}:</span><span class="row-val">${m.flightDetails || 'Local Movement'}</span></div>
          </div>
        </div>

        <div class="full-box">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #0f172a;">${isAr ? 'خط السير ومسار الحركة المعتمد' : 'APPROVED MOVEMENT ROUTE & SCHEDULE'}</div>
          <div style="font-size: 14px; font-weight: bold; color: #0369a1;">${m.route}</div>
          <div style="display: flex; gap: 30px; margin-top: 8px; font-size: 12px;">
            <div><b>${isAr ? 'نقطة التحرك' : 'Pickup'}:</b> ${m.pickupLocation} (${m.pickupTime})</div>
            <div><b>${isAr ? 'الوجهة' : 'Destination'}:</b> ${m.destination}</div>
          </div>
          ${m.notes ? `<div style="margin-top: 8px; font-size: 11px; color: #475569; background: #f1f5f9; padding: 6px; border-radius: 4px;"><b>${isAr ? 'تعليمات التشغيل' : 'Instructions'}:</b> ${m.notes}</div>` : ''}
        </div>

        <div class="footer">
          <div>
            <div><b>${isAr ? 'مدير الحركة والنقل' : 'Fleet Operations Manager'}</b></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${workspace.name} Dispatch Desk</div>
            <div class="stamp-box">Official Dispatch Stamp</div>
          </div>
          <div>
            <div><b>${isAr ? 'توقيع السائق بالاستلام' : 'Chauffeur Acknowledgment'}</b></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">I confirm vehicle check & permit</div>
            <div style="margin-top: 40px; border-bottom: 1px solid #94a3b8; width: 140px;"></div>
          </div>
          <div>
            <div><b>${isAr ? 'إخطار شرطة السياحة' : 'Tourism Police Check'}</b></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Checkpoint Verification</div>
            <div class="stamp-box">Police Gate Check</div>
          </div>
        </div>

        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  // Handle saving movement update
  const handleSaveMovement = () => {
    if (!editingMovement) return;
    const targetTrip = trips.find(t => t.id === editingMovement.tripId);
    if (targetTrip) {
      const updatedTrip: TripFile = {
        ...targetTrip,
        driverName: editingMovement.driverName,
        driverPhone: editingMovement.driverPhone,
        vehiclePlate: editingMovement.vehiclePlate,
        vehicleType: editingMovement.vehicleType,
        updatedAt: new Date().toISOString(),
      };
      const nextTrips = trips.map(t => t.id === targetTrip.id ? updatedTrip : t);
      setTrips(nextTrips);
      saveTrips(nextTrips);
    }
    setIsEditModalOpen(false);
    setEditingMovement(null);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2035] via-[#162e4d] to-[#0f2035] text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <GuidanceTrigger
          sectionKey="trips_workspace"
          uiLang={uiLang}
          variant="gold"
          pinned={true}
          size="sm"
          label={isAr ? 'دليل النقل' : 'Fleet Guide'}
        />
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 ltr:pr-14 rtl:pl-14">

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Truck className="w-3.5 h-3.5" />
              <span>{isAr ? 'إدارة الحركة والنقل الميداني' : 'Fleet & Ground Transportation Desk'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {isAr ? 'حركة النقل والسيارات والمركبات السياحية' : 'Fleet & Transportation Operations'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isAr
                ? 'إدارة وجدولة سيارات الليموزين، باصات الكوستر وحافلات الـ 50 راكب. إصدار أوامر التشغيل للسائقين عبر واتساب، وطباعة تصاريح الحركة الرسمية لشرطة السياحة.'
                : 'Centralized dispatch command for Egyptian tourist limousines, HiAce vans, coaster midibuses and luxury coaches. Broadcast WhatsApp assignments and print Ministry of Tourism waybills.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToTrips && (
              <button
                onClick={onNavigateToTrips}
                className="h-9 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2 cursor-pointer border border-white/10 active:scale-95"
              >
                <span>{isAr ? 'العودة لملفات الأفواج' : 'Back to Trip Files'}</span>
                {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Live Counters (Strictly Equal Height) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 items-stretch">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between min-h-[82px] h-full">
            <div className="text-xs text-slate-300 font-medium truncate">{isAr ? 'إجمالي التحركات' : 'Total Dispatches'}</div>
            <div className="text-2xl font-black text-white mt-1 leading-none">{stats.total}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between min-h-[82px] h-full">
            <div className="text-xs text-amber-300 font-medium flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="truncate">{isAr ? 'في الطريق الآن' : 'In-Transit Now'}</span>
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1 leading-none">{stats.inTransit}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between min-h-[82px] h-full">
            <div className="text-xs text-emerald-300 font-medium truncate">{isAr ? 'استقبال مطارات اليوم' : 'Airport Meet & Assist'}</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 leading-none">{stats.airportPickups}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between min-h-[82px] h-full">
            <div className="text-xs text-sky-300 font-medium truncate">{isAr ? 'جاهز ومجدول' : 'Scheduled & Standby'}</div>
            <div className="text-2xl font-black text-sky-300 mt-1 leading-none">{stats.scheduled + stats.dispatched}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث باسم السائق، رقم اللوحة، رقم الفوج، أو خط السير...' : 'Search by driver name, plate number, trip file, or route...'}
            className="w-full ps-10 pe-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="All">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="In-Transit">{isAr ? 'في الطريق (In-Transit)' : 'In-Transit'}</option>
            <option value="Dispatched">{isAr ? 'مُرسل للسائق (Dispatched)' : 'Dispatched'}</option>
            <option value="Scheduled">{isAr ? 'مجدول (Scheduled)' : 'Scheduled'}</option>
          </select>

          {/* Vehicle Category */}
          <select
            value={vehicleFilter}
            onChange={e => setVehicleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="All">{isAr ? 'جميع المركبات' : 'All Vehicles'}</option>
            <option value="Mercedes">{isAr ? 'مرسيدس VIP' : 'Mercedes VIP'}</option>
            <option value="HiAce">{isAr ? 'تويوتا هاي إس (12-14 راكب)' : 'Toyota HiAce (12-14)'}</option>
            <option value="Coaster">{isAr ? 'تويوتا كوستر (22 راكب)' : 'Toyota Coaster (22)'}</option>
            <option value="Coach">{isAr ? 'حافلات سياحية 50 راكب' : 'Grand Coach (50)'}</option>
          </select>
        </div>
      </div>

      {/* Movement Cards Grid */}
      {filteredMovements.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <Truck className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">
            {isAr ? 'لا توجد حركات نقل مجدولة حالياً' : 'No fleet movements scheduled yet'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isAr 
              ? 'عند تسجيل رحلات جديدة أو تأكيد حجوزات تتضمن خدمات نقل سياحي، ستظهر أوامر الحركة وسجلات السائقين هنا تلقائياً.'
              : 'Fleet movements and chauffeur run sheets will appear here automatically as trips with transport services are created and confirmed.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMovements.map(m => {
            const isTransit = m.status === 'In-Transit';
            return (
              <div 
                key={m.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Top Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sky">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-slate-500 block leading-none">
                          {m.fileNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate max-w-[170px] block mt-0.5">
                          {m.travelerName}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      isTransit 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : m.status === 'Dispatched'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {isTransit && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                      <span>{m.status}</span>
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3.5">
                    {/* Vehicle & Plate details */}
                    <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100/80 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-sky-950">{m.vehicleType}</span>
                        <span className="font-mono font-black text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                          {m.vehiclePlate || (isAr ? 'لوحة قيد التحديد' : 'Plate Pending')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{m.paxCount} {isAr ? 'ركاب' : 'Passengers'}</span>
                        </span>
                        <span className="text-slate-500 font-medium">
                          {isAr ? 'حركة تشغيل رسمية' : 'Scheduled Movement'}
                        </span>
                      </div>
                    </div>

                    {/* Chauffeur info */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {m.driverName ? m.driverName.charAt(0) : '?'}
                        </div>
                        <div className="truncate">
                          <div className={`font-bold ${m.driverName ? 'text-slate-800' : 'text-amber-800'}`}>
                            {m.driverName || (isAr ? 'لم يُعيّن سائق بعد' : 'Driver not assigned')}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {m.driverPhone || (isAr ? 'الهاتف غير محدد' : 'No phone')}
                          </div>
                        </div>
                      </div>
                      {m.driverPhone ? (
                        <a
                          href={`tel:${m.driverPhone}`}
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                          title={isAr ? 'اتصال مباشر بالسائق' : 'Call Chauffeur'}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                          {isAr ? 'قيد التكليف' : 'Unassigned'}
                        </span>
                      )}
                    </div>

                  {/* Route & Schedule */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="font-semibold leading-snug">{m.route}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 ps-5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{m.pickupTime}</span>
                      </span>
                      {m.flightDetails && (
                        <span className="flex items-center gap-1 font-mono text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100">
                          <Plane className="w-3 h-3" />
                          <span>{m.flightDetails}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {m.notes && (
                    <div className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded-lg border border-amber-100 leading-tight">
                      <b>{isAr ? 'ملاحظة:' : 'Note:'}</b> {m.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2">
                <button
                  onClick={() => sendDriverWhatsApp(m)}
                  className="px-2 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                  title={isAr ? 'إرسال أمر التشغيل للسائق عبر الواتساب' : 'Send WhatsApp Dispatch Order'}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                </button>

                <button
                  onClick={() => printMovementPermit(m)}
                  className="px-2 py-2 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                  title={isAr ? 'طباعة أمر تشغيل سياحي معتمد A4' : 'Print A4 Waybill Permit'}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تصريح A4' : 'Permit A4'}</span>
                </button>

                <button
                  onClick={() => {
                    setEditingMovement(m);
                    setIsEditModalOpen(true);
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1 transition cursor-pointer"
                  title={isAr ? 'تعديل السائق أو المركبة' : 'Edit Driver / Vehicle'}
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'تعديل' : 'Edit'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Edit Vehicle & Driver Assignment Modal */}
      {isEditModalOpen && editingMovement && (
        <div className="fixed inset-0 z-50 bg-[#0f2035]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">
                  {isAr ? 'تعديل بيانات المركبة والسائق' : 'Edit Vehicle & Driver Assignment'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAr ? 'اسم السائق / الكابتن' : 'Chauffeur Name'}
                </label>
                <input
                  type="text"
                  value={editingMovement.driverName}
                  onChange={e => setEditingMovement({ ...editingMovement, driverName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAr ? 'هاتف السائق (واتساب)' : 'Driver Phone Number'}
                </label>
                <input
                  type="text"
                  value={editingMovement.driverPhone}
                  onChange={e => setEditingMovement({ ...editingMovement, driverPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAr ? 'رقم اللوحة السياحية' : 'Tourism Plate Number'}
                  </label>
                  <input
                    type="text"
                    value={editingMovement.vehiclePlate}
                    onChange={e => setEditingMovement({ ...editingMovement, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAr ? 'نوع وموديل المركبة' : 'Vehicle Type'}
                  </label>
                  <input
                    type="text"
                    value={editingMovement.vehicleType}
                    onChange={e => setEditingMovement({ ...editingMovement, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAr ? 'حالة الحركة الميدانية' : 'Dispatch Status'}
                </label>
                <select
                  value={editingMovement.status}
                  onChange={e => setEditingMovement({ ...editingMovement, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="Scheduled">Scheduled (مجدول)</option>
                  <option value="Dispatched">Dispatched (تم إرسال الأمر للسائق)</option>
                  <option value="In-Transit">In-Transit (في الطريق الآن)</option>
                  <option value="Completed">Completed (مكتمل)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveMovement}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
