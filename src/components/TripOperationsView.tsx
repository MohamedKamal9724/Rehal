import { writeSafePrintDocument } from '../lib/safePrint';
import { repository } from '../lib/storage';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plane, Users, ClipboardCheck, Hotel, Printer, Download, Plus, Trash2, 
  FileText, Phone, Truck, ChevronLeft, AlertTriangle, Shield, Compass,
  Copy, Check, ExternalLink, MessageCircle, Moon, Sparkles, Share2,
  Navigation, MapPin, Search, Calendar, Clock, CheckCircle2, RotateCcw, Key,
  UserCheck, Receipt, Sun, CloudSun, Eye, Lock, Unlock, ArrowRight
} from 'lucide-react';
import { Quote, Workspace, UILanguage } from '../types';
import {
  TripFile, TripService, TripPassenger, ServiceStatus, TripStatus,
  loadTrips, saveTrips, createTripFromQuote, newId,
} from '../lib/tripStore';
import { auditTripReadiness } from '../lib/tripReadiness';
import { fetchMultipleDestinationsWeather, DestinationWeather } from '../lib/weatherService';
import { OperationsDispatchModal } from './operations/OperationsDispatchModal';
import { GoogleTripRouteMap } from './maps/GoogleTripRouteMap';
import { resolveLocationPoint, GeoPoint } from '../lib/geoCoordinates';
import { InteractiveRoadmapBuilder } from './operations/InteractiveRoadmapBuilder';
import { RoadmapTrip, RoadStopObject, RoadStopCategory } from '../lib/roadmapTypes';
import { createSampleRoadmapTrip } from '../lib/roadmapDefaults';
import { TripOperationsHeader } from './operations/TripOperationsHeader';
import { TripFileCard } from './operations/TripFileCard';
import { TripServicesTable } from './operations/TripServicesTable';
import { TripPassengersRooming } from './operations/TripPassengersRooming';
import { TripChecklistConsole } from './operations/TripChecklistConsole';
import { RoadmapBookletModal } from './operations/RoadmapBookletModal';
import { TripPasscodesConsole } from './operations/TripPasscodesConsole';
import { QRCodeModal } from './operations/QRCodeModal';
import { ProgressiveTripModal } from './operations/ProgressiveTripModal';
import { generateQRCodeDataUrl, buildVoucherUrl, buildItineraryUrl } from '../lib/qrCodeUtility';
import { SectionHelpTrigger } from './common/SectionHelpTrigger';

interface Props { 
  workspace: Workspace; 
  quotes: Quote[]; 
  uiLang: UILanguage; 
  initialSubTab?: string;
  initialTripId?: string;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

const AR: Record<string, string> = {
  'Trip Operations':'عمليات الرحلات','Overview':'نظرة عامة','Services':'الخدمات','Passengers & rooming':'المسافرون والغرف','Checklist':'قائمة المراجعة','Notes & incidents':'ملاحظات وحوادث',
  'Vouchers & Dispatch':'أوامر التشغيل والقسائم','Open Vouchers Console':'فتح منصة القسائم والتشغيل','Batch Print A4 Pack':'طباعة مجمعة لملف الـ A4',
  'Traveler Concierge':'دليل المسافر اليومي والبقشيش',
  'All':'الكل','Planning':'تخطيط','Confirmed':'مؤكدة','Operating':'قيد التنفيذ','Completed':'مكتملة','Cancelled':'ملغاة',
  'To request':'للطلب','Requested':'تم الطلب','Reconfirmed':'أعيد تأكيدها',
  'Manifest':'كشف المسافرين','Ops sheet':'ورقة التشغيل','Rooming CSV':'قائمة الغرف CSV','Guide program':'برنامج المرشد','All trip files':'كل ملفات الرحلات',
  'Add passenger':'إضافة مسافر','Add':'إضافة','Arrival':'الوصول','Departure':'المغادرة','Guide, driver & contacts':'المرشد والسائق وجهات الاتصال',
  'Flight':'الرحلة','Airport':'المطار','Date':'التاريخ','Time':'الوقت','Airport meet & assist booked':'تم حجز الاستقبال بالمطار',
  'Guide name':'اسم المرشد','Guide phone':'هاتف المرشد','Guide language':'لغة المرشد','Emergency contact':'اتصال الطوارئ','Driver name':'اسم السائق','Driver phone':'هاتف السائق','Vehicle type':'نوع المركبة','Plate number':'رقم اللوحة','WhatsApp guide':'واتساب المرشد',
  'Day':'اليوم','Service':'الخدمة','Supplier':'المورد','Status':'الحالة','Conf #':'رقم التأكيد','Note':'ملاحظة',
  'Name (as in passport)':'الاسم (كما في الجواز)','Type':'النوع','Nationality':'الجنسية','Room':'الغرفة','Dietary / special':'الطعام / طلبات خاصة','Adult':'بالغ','Child':'طفل','Infant':'رضيع',
  'Request / confirm':'طلب / تأكيد','Copy email':'نسخ البريد','Open email':'فتح البريد','WhatsApp':'واتساب','Copied':'تم النسخ','Close':'إغلاق',
  'Backup all data':'نسخ احتياطي للبيانات','Restore backup':'استعادة نسخة','Arriving in 7 days':'تصل خلال 7 أيام','Unconfirmed services':'خدمات غير مؤكدة','Missing guide/driver':'ينقصها مرشد/سائق',
  '+ New trip file from quote…':'+ ملف رحلة جديد من عرض سعر…','Add a note, change request or incident…':'أضف ملاحظة أو طلب تغيير أو حادثة…',
};

const TRIP_STATUSES: TripStatus[] = ['All' as any, 'Operating', 'Confirmed', 'Planning', 'Completed', 'Cancelled'];

function download(name: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const esc = (s: string) => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

function printHtml(title: string, body: string, brand: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to print.'); return; }
  writeSafePrintDocument(w, `<html><head><title>${esc(title)}</title><style>
  body{font-family:Arial,sans-serif;padding:28px;color:#0f172a}h1{color:${brand};margin:0 0 4px}h2{font-size:14px;margin-top:20px;border-bottom:2px solid ${brand};padding-bottom:4px}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}th,td{border:1px solid #cbd5e1;padding:6px;text-align:left}th{background:#f1f5f9}.m{color:#64748b;font-size:12px}
  </style></head><body>${body}<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export const TripOperationsView: React.FC<Props> = ({ 
  workspace, 
  quotes, 
  uiLang, 
  initialSubTab, 
  initialTripId,
  onNavigateTab 
}) => {
  const isAr = uiLang === 'ar';
  const tr = (x: string) => (isAr ? AR[x] || x : x);
  const [trips, setTrips] = useState<TripFile[]>(() => loadTrips());
  const [openId, setOpenId] = useState<string | null>(initialTripId || null);
  const [tab, setTab] = useState<string>(initialSubTab || 'overview');
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProgressiveModalOpen, setIsProgressiveModalOpen] = useState(false);
  
  const [dispatchModalQuote, setDispatchModalQuote] = useState<Quote | null>(null);
  const [dispatchModalTrip, setDispatchModalTrip] = useState<TripFile | null>(null);
  const [copiedPortalId, setCopiedPortalId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [tripWeather, setTripWeather] = useState<Record<string, DestinationWeather>>({});
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [activeRoadmapTrip, setActiveRoadmapTrip] = useState<RoadmapTrip | null>(null);
  const [bookletTrip, setBookletTrip] = useState<RoadmapTrip | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalTrip, setQrModalTrip] = useState<TripFile | null>(null);
  const [qrModalType, setQrModalType] = useState<'itinerary' | 'passenger' | 'voucher'>('itinerary');
  const [qrModalPassenger, setQrModalPassenger] = useState<TripPassenger | null>(null);
  const [qrModalService, setQrModalService] = useState<TripService | null>(null);
  const brand = workspace.brandColors?.primary || '#44200F';

  const handleOpenQrModal = (
    targetTrip: TripFile,
    type: 'itinerary' | 'passenger' | 'voucher' = 'itinerary',
    passenger: TripPassenger | null = null,
    service: TripService | null = null
  ) => {
    setQrModalTrip(targetTrip);
    setQrModalType(type);
    setQrModalPassenger(passenger);
    setQrModalService(service);
    setIsQrModalOpen(true);
  };

  useEffect(() => {
    if (initialSubTab) {
      setTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (initialTripId) {
      setOpenId(initialTripId);
    }
  }, [initialTripId]);

  const persist = (next: TripFile[]) => { 
    setTrips(next); 
    saveTrips(next); 
  };

  const updateTrip = (id: string, patch: Partial<TripFile>) => {
    persist(trips.map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t));
  };

  const handleCreateProgressiveTrip = (newTrip: TripFile) => {
    persist([newTrip, ...trips]);
    setOpenId(newTrip.id);
    setTab('overview');
  };

  const currentTrip = trips.find(t => t.id === openId) || null;
  const availableQuotes = quotes.filter(q => !trips.some(t => t.quoteId === q.id));

  // Contextual Destination Weather for this specific trip
  useEffect(() => {
    if (!currentTrip) return;
    const rawCities = [
      ...currentTrip.services.map(s => s.city).filter(Boolean),
      'Cairo',
      'Luxor'
    ];
    const cities = Array.from(new Set(rawCities)).slice(0, 4);
    let active = true;
    setLoadingWeather(true);
    fetchMultipleDestinationsWeather(cities)
      .then(data => {
        if (active) setTripWeather(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingWeather(false);
      });
    return () => { active = false; };
  }, [currentTrip?.id]);

  // Operational Readiness Report
  const readiness = useMemo(() => {
    if (!currentTrip) return null;
    return auditTripReadiness(currentTrip);
  }, [currentTrip]);

  const handleCopyTripCode = (targetTrip: TripFile) => {
    const code = targetTrip.tourPasscode || targetTrip.fileNumber;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCodeId(targetTrip.id);
      setTimeout(() => setCopiedCodeId(null), 2500);
    }
  };

  const handleTogglePasscode = (targetTrip: TripFile) => {
    updateTrip(targetTrip.id, { passcodeDisabled: !targetTrip.passcodeDisabled });
  };

  // Progress metrics calculation
  const getProgress = (t: TripFile) => {
    const live = t.services.filter(s => s.status !== 'Cancelled');
    const ok = live.filter(s => s.status === 'Confirmed' || s.status === 'Reconfirmed').length;
    return { ok, total: live.length, pct: live.length ? Math.round((ok / live.length) * 100) : 0 };
  };

  // Filtered trips for list view
  const shownTrips = useMemo(() => {
    return trips
      .filter(t => {
        if (filter === 'Upcoming') {
          const isUp = t.status === 'Confirmed' || t.status === 'Planning' || (!t.status && t.startDate);
          if (!isUp || t.status === 'Completed' || t.status === 'Cancelled') return false;
        } else if (filter === 'In Progress') {
          if (t.status !== 'Operating') return false;
        } else if (filter === 'Completed') {
          if (t.status !== 'Completed') return false;
        } else if (filter === 'Needs Attention') {
          const hasUnconfirmed = t.services.some(s => s.status === 'To request' || s.status === 'Requested');
          const missingStaff = !t.driverName || !t.guideName;
          if ((!hasUnconfirmed && !missingStaff) || t.status === 'Completed' || t.status === 'Cancelled') return false;
        } else if (filter !== 'All' && t.status !== filter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = t.travelerName.toLowerCase().includes(q) ||
            t.fileNumber.toLowerCase().includes(q) ||
            (t.guideName || '').toLowerCase().includes(q) ||
            (t.driverName || '').toLowerCase().includes(q) ||
            t.services.some(s => s.city.toLowerCase().includes(q) || s.serviceName.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [trips, filter, searchQuery]);

  // Overall Operations KPIs
  const kpis = useMemo(() => {
    const active = trips.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
    const operatingNow = trips.filter(t => t.status === 'Operating').length;
    const arrivingSoon = active.filter(t => {
      if (!t.startDate) return false;
      const days = Math.ceil((new Date(t.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 5;
    }).length;
    const unconfirmed = active.reduce((acc, t) => {
      const p = getProgress(t);
      return acc + (p.total - p.ok);
    }, 0);
    const missingStaff = active.filter(t => !t.guideName || !t.driverName).length;
    return { operatingNow, arrivingSoon, unconfirmed, missingStaff, totalActive: active.length };
  }, [trips]);

  const getRoadmapForTrip = (t: TripFile): RoadmapTrip => {
    const stops: RoadStopObject[] = t.services.map((s, idx) => {
      const geo = resolveLocationPoint(s.serviceName, s.supplierName, s.city, s.supplierType);
      const cat: RoadStopCategory = 
        s.supplierType.toLowerCase().includes('hotel') ? 'hotel' :
        s.supplierType.toLowerCase().includes('transport') ? 'transfer' : 'sightseeing';
      return {
        id: s.id || `stop-${idx}`,
        name: s.serviceName,
        category: cat,
        city: s.city,
        dayNumber: s.dayNumber || 1,
        time: `${9 + (idx % 8)}:00 AM`,
        durationMinutes: 90,
        notes: s.note,
        coordinates: { lat: geo.lat, lng: geo.lng },
        supplierName: s.supplierName,
      };
    });

    return {
      id: `roadmap-${t.id}`,
      tripName: `${t.travelerName} Tour Route`,
      travelerGroupName: t.travelerName,
      paxCount: t.passengers.length || 12,
      startDate: t.startDate || new Date().toISOString().slice(0, 10),
      durationDays: t.durationDays || 4,
      leadGuideName: t.guideName,
      leadGuidePhone: t.guidePhone,
      driverName: t.driverName,
      driverPhone: t.driverPhone,
      vehicleType: t.vehicleType,
      vehiclePlate: t.vehiclePlate,
      stops: stops.length > 0 ? stops : createSampleRoadmapTrip().stops,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quoteId: t.quoteId,
      fileNumber: t.fileNumber,
    };
  };

  const openRoadmapForTrip = (t: TripFile) => {
    const roadmapTrip = getRoadmapForTrip(t);
    setActiveRoadmapTrip(roadmapTrip);
    setIsRoadmapOpen(true);
  };

  const getLivePortalUrl = (t: TripFile) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${pathname}?view=concierge&quoteId=${encodeURIComponent(t.quoteId || t.id)}`;
  };

  const handleCopyPortalLink = (t: TripFile) => {
    const url = getLivePortalUrl(t);
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedPortalId(t.id);
      setTimeout(() => setCopiedPortalId(null), 2500);
    }
  };

  const handleLaunchDispatch = (targetTrip: TripFile) => {
    let matchingQuote = quotes.find(q => q.id === targetTrip.quoteId);
    if (!matchingQuote) {
      matchingQuote = {
        id: targetTrip.quoteId || targetTrip.id,
        workspaceId: workspace.id,
        quoteNumber: targetTrip.fileNumber,
        travelerName: targetTrip.travelerName,
        travelerEmail: '',
        travelerPhone: '',
        version: 1,
        startDate: targetTrip.startDate,
        durationDays: targetTrip.durationDays,
        targetCurrency: 'USD',
        status: 'Accepted',
        group: {
          adults: targetTrip.passengers.length || 2,
          children: [],
          infants: 0,
        },
        days: [],
        totalCostEgp: 0,
        totalPriceEgp: 0,
        marginPercent: 20,
        totalPriceQuoteCurrency: 0,
        validUntil: targetTrip.startDate || new Date().toISOString(),
        assignedAgentId: 'agent-ops',
        assignedAgentName: 'Operations Team',
        publicToken: targetTrip.fileNumber,
        createdAt: targetTrip.updatedAt || new Date().toISOString(),
        updatedAt: targetTrip.updatedAt || new Date().toISOString(),
        viewCount: 1,
        language: 'en',
      };
    }
    setDispatchModalQuote(matchingQuote || null);
    setDispatchModalTrip(targetTrip);
  };

  const createFromQuote = (qid: string) => {
    const q = quotes.find(x => x.id === qid); 
    if (!q) return;
    const t = createTripFromQuote(q, trips.length);
    persist([...trips, t]); 
    setOpenId(t.id); 
    setTab('overview');
  };

  const dayDate = (t: TripFile, d: number) => { 
    const x = new Date(t.startDate); 
    x.setDate(x.getDate() + d - 1); 
    return isNaN(x.getTime()) ? '' : x.toISOString().slice(0, 10); 
  };

  /* ---------- Official Print Handlers ---------- */
  const exportRooming = (t: TripFile) => download(
    `${t.fileNumber}-rooming.csv`,
    ['Name,Type,Nationality,Room,Dietary/Special', ...t.passengers.map(p => [p.name, p.type, p.nationality, p.room, p.dietary].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))].join('\n')
  );

  const printManifest = async (t: TripFile) => {
    let qrHtml = '';
    try {
      const qrDataUrl = await generateQRCodeDataUrl(buildItineraryUrl(t), { width: 140, margin: 1 });
      qrHtml = `<div style="float:right;text-align:center;padding:8px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;margin-left:16px"><img src="${qrDataUrl}" width="100" height="100" style="display:block" /><div style="font-size:9px;font-family:monospace;margin-top:3px;color:#64748b">SCAN FOR MOBILE</div></div>`;
    } catch {
      qrHtml = '';
    }

    printHtml(`Manifest ${t.fileNumber}`, `
      <div style="overflow:hidden">
        ${qrHtml}
        <h1>${esc(workspace.name)}</h1>
        <div class="m">Passenger manifest · ${esc(t.fileNumber)} · ${esc(t.travelerName)} · ${esc(t.startDate)} (${t.durationDays} days)</div>
      </div>
      <h2>Arrival</h2><div>${esc(t.arrival.flight)} · ${esc(t.arrival.date)} ${esc(t.arrival.time)} · ${esc(t.arrival.airport)} · Meet & assist: ${t.arrival.meetAndAssist ? 'Yes' : 'No'}</div>
      <h2>Team on ground</h2><div>Guide: ${esc(t.guideName)} ${esc(t.guidePhone)} (${esc(t.guideLanguage)})<br/>Driver: ${esc(t.driverName)} ${esc(t.driverPhone)} · ${esc(t.vehicleType)} ${esc(t.vehiclePlate)}<br/>Emergency: ${esc(t.emergencyContact || workspace.contactPhone)}</div>
      <h2>Passengers</h2><table><tr><th>#</th><th>Name</th><th>Type</th><th>Nationality</th><th>Room</th><th>Dietary / special</th></tr>
      ${t.passengers.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.name)}</td><td>${p.type}</td><td>${esc(p.nationality)}</td><td>${esc(p.room)}</td><td>${esc(p.dietary)}</td></tr>`).join('')}</table>
      <h2>Departure</h2><div>${esc(t.departure.flight)} · ${esc(t.departure.date)} ${esc(t.departure.time)} · ${esc(t.departure.airport)}</div>`, brand);
  };

  const printDaily = (t: TripFile) => {
    const days = [...new Set(t.services.map(s => s.dayNumber))].sort((a, b) => a - b);
    printHtml(`Operations sheet ${t.fileNumber}`, `<h1>Operations Sheet</h1><div class="m">${esc(t.fileNumber)} · ${esc(t.travelerName)} · Guide ${esc(t.guideName)} · Driver ${esc(t.driverName)} ${esc(t.vehiclePlate)}</div>
    ${days.map(d => `<h2>Day ${d}</h2><table><tr><th>Service</th><th>Supplier</th><th>City</th><th>Status</th><th>Conf #</th></tr>${t.services.filter(s => s.dayNumber === d).map(s => `<tr><td>${esc(s.serviceName)}</td><td>${esc(s.supplierName)}</td><td>${esc(s.city)}</td><td>${s.status}</td><td>${esc(s.confirmationNo)}</td></tr>`).join('')}</table>`).join('')}`, brand);
  };

  const printProgram = (t: TripFile) => {
    const days = [...new Set(t.services.map(x => x.dayNumber))].sort((a, b) => a - b);
    printHtml(`Program ${t.fileNumber}`, `<h1>${esc(t.travelerName)} - Daily Program</h1><div class="m">${esc(workspace.name)} · Guide ${esc(t.guideName)} ${esc(t.guidePhone)} · Driver ${esc(t.driverName)} ${esc(t.driverPhone)} ${esc(t.vehiclePlate)} · Emergency ${esc(t.emergencyContact || workspace.contactPhone)}</div>
    ${days.map(d => `<h2>Day ${d} · ${esc(dayDate(t, d))}</h2><table><tr><th>Service</th><th>City</th><th>Supplier</th><th>Conf #</th></tr>${t.services.filter(x => x.dayNumber === d && x.status !== 'Cancelled').map(x => `<tr><td>${esc(x.serviceName)}</td><td>${esc(x.city)}</td><td>${esc(x.supplierName)}</td><td>${esc(x.confirmationNo)}</td></tr>`).join('')}</table>`).join('')}`, brand);
  };

  const printVoucher = async (t: TripFile, s: TripService) => {
    let qrHtml = '';
    try {
      const qrDataUrl = await generateQRCodeDataUrl(buildVoucherUrl(t, s), { width: 140, margin: 1 });
      qrHtml = `<div style="float:right;text-align:center;padding:8px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;margin-left:16px"><img src="${qrDataUrl}" width="100" height="100" style="display:block" /><div style="font-size:9px;font-family:monospace;margin-top:3px;color:#64748b">SCAN TO VERIFY</div></div>`;
    } catch {
      qrHtml = '';
    }

    printHtml(`Voucher ${t.fileNumber}`, `
      <div style="overflow:hidden">
        ${qrHtml}
        <h1>Service Voucher</h1>
        <div class="m">${esc(workspace.name)} · ${esc(workspace.contactEmail)} · ${esc(workspace.contactPhone)}</div>
        <h2>To: ${esc(s.supplierName || 'Supplier')}</h2>
      </div>
      <table style="clear:both"><tr><th>File</th><td>${esc(t.fileNumber)}</td><th>Confirmation #</th><td>${esc(s.confirmationNo)}</td></tr>
      <tr><th>Service</th><td colspan="3">${esc(s.serviceName)} (${esc(s.supplierType)})</td></tr>
      <tr><th>City</th><td>${esc(s.city)}</td><th>Day</th><td>${s.dayNumber} (trip starts ${esc(t.startDate)})</td></tr>
      <tr><th>Lead guest</th><td>${esc(t.travelerName)}</td><th>Pax</th><td>${t.passengers.length}</td></tr>
      <tr><th>Notes</th><td colspan="3">${esc(s.note)}</td></tr></table>
      <p class="m">This voucher confirms services arranged by ${esc(workspace.name)}. Settlement is handled directly between the operator and supplier under the agreed contract.</p>`, brand);
  };

  /* Backup & Restore */
  const exportAll = () => {
    const blob = new Blob([JSON.stringify(repository.exportWorkspaceBackup(), null, 2)], {type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='daleel-workspace-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const importAll = (_file:File) => { alert('الاستعادة متوقفة لحين تفعيل التحقق من بنية البيانات وملكيتها. لم تتغير بياناتك.'); };

  // Road Map Builder Screen
  if (isRoadmapOpen) {
    return (
      <InteractiveRoadmapBuilder
        workspace={workspace}
        uiLang={uiLang}
        initialTrip={activeRoadmapTrip}
        onClose={() => setIsRoadmapOpen(false)}
        onSaveAsTripFile={() => {
          setTrips(loadTrips());
        }}
        availableQuotes={quotes}
      />
    );
  }

  /* ------------------------------------------------------------- */
  /* 1. OPERATIONS DASHBOARD & TRIP FILES OVERVIEW                 */
  /* ------------------------------------------------------------- */
  if (!currentTrip) {
    return (
      <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Executive Header */}
        <div className="relative bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <SectionHelpTrigger
            sectionKey="trips_workspace"
            uiLang={uiLang}
            size="sm"
            pinned={true}
            label={isAr ? 'دليل التشغيل' : 'Operations Guide'}
            onNavigateTab={onNavigateTab}
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ltr:pr-14 rtl:pl-14">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {tr('Trip Operations')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#44200F] text-orange-200 border border-orange-400/30 font-mono">
                  {trips.length} {isAr ? 'ملف رحلة' : 'Files'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isAr
                ? 'الرحلات المؤكدة للعملاء والتشغيل الميداني تُدار من هنا — متابعة حركة الوفود، قسائم الفنادق، تعيين السائقين والمرشدين، وجاهزية الرحلة.'
                : 'Confirmed customer trips are managed here — track active delegations, hotel vouchers, assigned drivers and guides, and trip readiness.'}
            </p>
          </div>

          {/* Primary Operations Actions - Standardized equal height h-9 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsProgressiveModalOpen(true)}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#44200F] via-[#5c2410] to-[#44200F] hover:to-[#ea580c] text-white border border-orange-500/30 font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-orange-300" />
              <span>{isAr ? '+ ملف رحلة جديد' : '+ New Trip File'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRoadmapTrip(null);
                setIsRoadmapOpen(true);
              }}
              className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-white" />
              <span>{isAr ? '+ خريطة طريق' : '+ Road Map'}</span>
            </button>

            {availableQuotes.length > 0 && (
              <select
                className="h-9 px-3 text-xs font-semibold rounded-xl bg-white border border-[#EDE0CC] text-[#44200F] shadow-2xs focus:outline-hidden focus:border-orange-400 cursor-pointer"
                value=""
                onChange={e => e.target.value && createFromQuote(e.target.value)}
              >
                <option value="">{isAr ? '+ استيراد من عرض سعر...' : '+ Import from Quote...'}</option>
                {availableQuotes.map(q => (
                  <option key={q.id} value={q.id}>
                    {q.quoteNumber} · {q.travelerName} ({q.status})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

        {/* Quick Operations Hubs Bar */}
        {onNavigateTab && (
          <div className="luxury-tab-bar bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-2 shrink-0">
              {isAr ? 'أقسام التشغيل والحركة:' : 'Operations Hubs:'}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('trips_fleet')}
              className="h-10 px-3.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 flex items-center gap-2 transition shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{isAr ? 'حركة النقل والسيارات' : 'Fleet & Transportation'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('trips_guides')}
              className="h-10 px-3.5 rounded-xl text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200/80 flex items-center gap-2 transition shrink-0 whitespace-nowrap cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>{isAr ? 'المرشدون وممثلو المطارات' : 'Tour Guides & Reps'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('trips_rooming')}
              className="h-10 px-3.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 flex items-center gap-2 transition shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Hotel className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{isAr ? 'التسكين وقوائم الفنادق' : 'Hotel Rooming Lists'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('trips_vouchers')}
              className="h-10 px-3.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center gap-2 transition shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{isAr ? 'قسائم وأوامر التشغيل' : 'Vouchers & Dispatch'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('passcodes')}
              className="h-10 px-3.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 flex items-center gap-2 transition shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isAr ? 'أكواد الأفواج والمسافرين' : 'Tour Passcodes'}</span>
            </button>
          </div>
        )}

        {/* Executive Metric Cards Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? 'أفواج قيد التنفيذ الآن' : 'Operating in Country'}
              </span>
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
              {kpis.operatingNow}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <Truck className="w-3.5 h-3.5 text-sky-600" />
              <span>{isAr ? 'حافلات ومرشدون في الميدان' : 'Coaches & guides on road'}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                {isAr ? 'تصل خلال 48–72 ساعة' : 'Arriving in 48-72h'}
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-800 mt-2 font-mono">
              {kpis.arrivingSoon}
            </div>
            <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
              <Plane className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'متابعة رحلات الوصول والاستقبال' : 'Flight tracking & airport meet'}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? 'خدمات غير مؤكدة' : 'Unconfirmed Services'}
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-3xl font-black text-rose-700 mt-2 font-mono">
              {kpis.unconfirmed}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAr ? 'بانتظار ردود الموردين' : 'Awaiting supplier confirmation #'}
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isAr ? 'ملفات تحتاج تعيين طاقم' : 'Missing Staff / Fleet'}
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-black text-slate-800 mt-2 font-mono">
              {kpis.missingStaff}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAr ? 'ينقصها مرشد مرخص أو سائق' : 'No licensed guide or driver'}
            </div>
          </div>
        </div>

        {/* Filter, Search & Backup Strip */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs: Upcoming, In Progress, Completed, Needs Attention, All */}
          <div className="luxury-tab-bar flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 flex-nowrap">
            {[
              { id: 'Upcoming', labelEn: 'Upcoming', labelAr: 'القادمة' },
              { id: 'In Progress', labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
              { id: 'Completed', labelEn: 'Completed', labelAr: 'المكتملة' },
              { id: 'Needs Attention', labelEn: 'Needs Attention', labelAr: 'تحتاج تدخلاً' },
              { id: 'All', labelEn: 'All Trips', labelAr: 'كل الرحلات' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setFilter(s.id)}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center ${
                  filter === s.id 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isAr ? s.labelAr : s.labelEn}
              </button>
            ))}
          </div>

          {/* Search Bar & Data Backup */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px] flex-1 md:flex-initial">
              <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم، الملف، المرشد...' : 'Filter trip files...'}
                className={`w-full text-xs font-medium py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-hidden ${isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
              />
            </div>

            <button
              onClick={exportAll}
              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-1 shadow-2xs transition cursor-pointer"
              title="Backup operations files"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">{isAr ? 'نسخ احتياطي' : 'Backup'}</span>
            </button>

            <label className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-1 shadow-2xs transition cursor-pointer">
              <span>{isAr ? 'استعادة' : 'Restore'}</span>
              <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files && e.target.files[0] && importAll(e.target.files[0])} />
            </label>
          </div>
        </div>

        {/* Trip Files Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shownTrips.map(t => (
            <TripFileCard
              key={t.id}
              trip={t}
              uiLang={uiLang}
              workspace={workspace}
              onOpen={() => {
                setOpenId(t.id);
                setTab('overview');
              }}
              onLaunchDispatch={() => handleLaunchDispatch(t)}
              onOpenRoadmap={() => openRoadmapForTrip(t)}
              onOpenGpsRadar={() => {
                setOpenId(t.id);
                setTab('gps_radar');
              }}
              onOpenQrModal={() => handleOpenQrModal(t, 'itinerary')}
              livePortalUrl={getLivePortalUrl(t)}
            />
          ))}
        </div>

        {/* Empty State */}
        {shownTrips.length === 0 && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {isAr ? 'لا توجد ملفات رحلات مطابقة' : 'No Trip Files Found'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {isAr
                ? 'اختر عرض سعر مقبول لإنشاء ملف رحلة جديد، أو اضغط زر "+ جدولة خريطة طريق" لبناء جدول مسار سياحي جديد.'
                : 'Select an accepted quote from the dropdown above to create a trip file, or click "+ Schedule Group Road Map" to plan a tourist highway route.'}
            </p>
          </div>
        )}

        {/* Operations Dispatch Modal */}
        {dispatchModalQuote && (
          <OperationsDispatchModal
            isOpen={!!dispatchModalQuote}
            onClose={() => {
              setDispatchModalQuote(null);
              setDispatchModalTrip(null);
            }}
            quote={dispatchModalQuote}
            tripFile={dispatchModalTrip || undefined}
            workspace={workspace}
            uiLang={uiLang}
          />
        )}

        {/* Instant QR Code Generator Modal */}
        {isQrModalOpen && qrModalTrip && (
          <QRCodeModal
            isOpen={isQrModalOpen}
            onClose={() => {
              setIsQrModalOpen(false);
              setQrModalTrip(null);
              setQrModalPassenger(null);
              setQrModalService(null);
            }}
            trip={qrModalTrip}
            workspace={workspace}
            uiLang={uiLang}
            initialType={qrModalType}
            initialPassenger={qrModalPassenger}
            initialService={qrModalService}
          />
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* 2. OPENED TRIP FILE: EXECUTIVE TOUR COMMAND CENTER           */
  /* ------------------------------------------------------------- */
  const p = getProgress(currentTrip);

  // Build GeoPoints for GPS Route Radar
  const tripWaypoints: GeoPoint[] = currentTrip ? (() => {
    const points: GeoPoint[] = [];

    // Arrival Airport
    if (currentTrip.arrival?.airport || currentTrip.arrival?.flight) {
      points.push(resolveLocationPoint(currentTrip.arrival.airport || 'Cairo International Airport', undefined, currentTrip.services[0]?.city || 'Cairo', 'transfer'));
    }

    // Services
    const sorted = [...currentTrip.services].sort((a, b) => a.dayNumber - b.dayNumber);
    sorted.forEach(s => {
      points.push(resolveLocationPoint(s.serviceName, s.supplierName, s.city, s.supplierType));
    });

    // Departure Airport
    if (currentTrip.departure?.airport || currentTrip.departure?.flight) {
      points.push(resolveLocationPoint(currentTrip.departure.airport || 'Cairo International Airport', undefined, currentTrip.services[currentTrip.services.length - 1]?.city || 'Cairo', 'transfer'));
    }

    return points.filter((pt, idx, arr) => idx === 0 || Math.abs(pt.lat - arr[idx - 1].lat) > 0.0001 || Math.abs(pt.lng - arr[idx - 1].lng) > 0.0001);
  })() : [];

  const tabsConfig = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: Plane },
    { id: 'guests', label: isAr ? 'الضيوف والغرف' : 'Guests', icon: Users },
    { id: 'itinerary', label: isAr ? 'برنامج الرحلة' : 'Itinerary', icon: Navigation },
    { id: 'accommodation', label: isAr ? 'الإقامة والفنادق' : 'Accommodation', icon: Hotel },
    { id: 'transport', label: isAr ? 'حركة النقل' : 'Transport', icon: Truck },
    { id: 'guides', label: isAr ? 'المرشدون' : 'Guides', icon: UserCheck },
    { id: 'documents', label: isAr ? 'المستندات والقسائم' : 'Documents', icon: Shield },
    { id: 'activity', label: isAr ? 'النشاط والملاحظات' : 'Activity', icon: ClipboardCheck },
  ] as const;

  const hotelServices = currentTrip.services.filter(s => 
    s.supplierType.toLowerCase().includes('hotel') || 
    s.serviceName.toLowerCase().includes('hotel') || 
    s.serviceName.toLowerCase().includes('cruise') ||
    s.serviceName.toLowerCase().includes('resort')
  );

  const transportServices = currentTrip.services.filter(s => 
    s.supplierType.toLowerCase().includes('transport') || 
    s.supplierType.toLowerCase().includes('transfer') || 
    s.serviceName.toLowerCase().includes('transfer') ||
    s.serviceName.toLowerCase().includes('airport')
  );

  const sightseeingServices = currentTrip.services.filter(s => 
    s.supplierType.toLowerCase().includes('sightseeing') || 
    s.supplierType.toLowerCase().includes('guide') || 
    s.serviceName.toLowerCase().includes('tour') ||
    s.serviceName.toLowerCase().includes('pyramid') ||
    s.serviceName.toLowerCase().includes('temple')
  );

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Executive Command Header */}
      <TripOperationsHeader
        trip={currentTrip}
        workspace={workspace}
        uiLang={uiLang}
        onBack={() => setOpenId(null)}
        onStatusChange={status => updateTrip(currentTrip.id, { status })}
        onLaunchDispatch={() => handleLaunchDispatch(currentTrip)}
        onOpenRoadmap={() => openRoadmapForTrip(currentTrip)}
        onPrintManifest={() => printManifest(currentTrip)}
        onPrintDaily={() => printDaily(currentTrip)}
        onPrintProgram={() => printProgram(currentTrip)}
        onExportRooming={() => exportRooming(currentTrip)}
        onPrintBooklet={() => setBookletTrip(getRoadmapForTrip(currentTrip))}
        onOpenQrModal={type => handleOpenQrModal(currentTrip, type || 'itinerary')}
        confirmedCount={p.ok}
        totalServicesCount={p.total}
      />

      {/* Modern 8-Tab Unified Bar */}
      <div className="luxury-tab-bar bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap">
        {tabsConfig.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id || 
            (t.id === 'guests' && (tab === 'passengers' || tab === 'passcodes')) ||
            (t.id === 'itinerary' && (tab === 'services' || tab === 'gps_radar')) ||
            (t.id === 'documents' && tab === 'vouchers') ||
            (t.id === 'activity' && (tab === 'checklist' || tab === 'log'));

          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`h-10 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Top Status & Next Action Banner */}
          {readiness && (
            <div className={`rounded-2xl border p-4.5 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition shadow-xs ${
              readiness.isFullyReady 
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`luxury-icon-box luxury-icon-box-lg ${
                  readiness.isFullyReady ? 'luxury-icon-box-emerald' : 'luxury-icon-box-amber'
                }`}>
                  {readiness.isFullyReady ? (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                    {readiness.isFullyReady
                      ? (isAr ? 'حالة الجاهزية التشغيلية: مكتملة تماماً' : 'Operational Readiness: All Systems Go')
                      : (isAr ? 'الإجراء التشغيلي التالي المطلوب' : 'Next Required Action')}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold mt-0.5">
                    {readiness.isFullyReady
                      ? (isAr ? 'جميع متطلبات الرحلة مؤكدة وجاهزة للإقلاع والانطلاق الميداني' : 'All accommodations, transport, guides, and vouchers are confirmed')
                      : (isAr ? readiness.nextRecommendedAction?.summaryAr || 'إجراء مطلوب' : readiness.nextRecommendedAction?.summary || 'Action Required')}
                  </h3>
                  <p className="text-xs opacity-80 mt-0.5">
                    {readiness.isFullyReady
                      ? (isAr ? 'يمكنك الآن مشاركة كود وصول المسافر وطباعة حزمة الـ A4' : 'Ready to share the traveller access passcode and dispatch vouchers')
                      : (isAr ? `ينقص ${readiness.missingCount} عناصر لاكتمال جاهزية الرحلة بنسبة 100%` : `${readiness.missingCount} pending item(s) to reach 100% operational readiness`)}
                  </p>
                </div>
              </div>

              {readiness.nextRecommendedAction && !readiness.isFullyReady && (
                <button
                  type="button"
                  onClick={() => setTab(readiness.nextRecommendedAction!.targetTab)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer shrink-0"
                >
                  <span>{isAr ? readiness.nextRecommendedAction.actionLabelAr : readiness.nextRecommendedAction.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              )}
            </div>
          )}

          {/* Core Operating Cards Grid: Readiness Indicator + Traveller Access */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* 1. Trip Readiness Console */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                  <div className="flex items-center gap-2">
                    <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-purple">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {isAr ? 'مؤشر جاهزية الرحلة' : 'Trip Readiness Indicator'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'تدقيق واقعي مبني على البيانات الفعلية' : 'Real-time operational checklist'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border ${
                    readiness?.isFullyReady 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    {readiness?.score || 0}% {isAr ? 'جاهز' : 'Ready'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      readiness?.isFullyReady ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${readiness?.score || 0}%` }}
                  />
                </div>

                {/* Interactive Checklist Items */}
                <div className="divide-y divide-slate-100 mt-3">
                  {readiness?.checks.map(check => (
                    <button
                      key={check.id}
                      type="button"
                      onClick={() => setTab(check.targetTab)}
                      className="w-full py-2.5 flex items-center justify-between gap-3 text-start hover:bg-slate-50/80 px-2 rounded-lg transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          check.isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {check.isComplete ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-bold block truncate ${
                            check.isComplete ? 'text-slate-800' : 'text-slate-500'
                          }`}>
                            {isAr ? check.labelAr : check.label}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {isAr ? check.summaryAr : check.summary}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-sky-600 group-hover:text-sky-800 flex items-center gap-1 shrink-0">
                        <span>{isAr ? check.actionLabelAr : check.actionLabel}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{isAr ? 'المسؤول المعين للرحلة:' : 'Assigned Operator:'} <strong className="text-slate-700">{currentTrip.assignedOperatorName || 'Tour Desk'}</strong></span>
                <span>File #{currentTrip.fileNumber}</span>
              </div>
            </div>

            {/* 2. Unified Traveller Access Console */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                  <div className="flex items-center gap-2">
                    <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-amber">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        {isAr ? 'دخول المسافر' : 'Traveller Access'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'رابط الدخول الآمن لبرنامج السائح' : 'Secure mobile itinerary portal'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                    currentTrip.passcodeDisabled
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {currentTrip.passcodeDisabled ? (
                      <>
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>{isAr ? 'معطل' : 'Disabled'}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{isAr ? 'نشط' : 'Active'}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Explanatory Message */}
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {isAr
                    ? 'شارك هذا الرمز مع المسافر ليتمكن من فتح برنامجه السياحي بأمان، ومتابعة مواعيد الفنادق والمرشد دون الحاجة لبيانات معقدة.'
                    : 'Share this code with the traveller so they can securely open their trip, daily schedule, guide details, and vouchers on their phone.'}
                </p>

                {/* Trip Passcode Display Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {isAr ? 'كود الرحلة الرسمي' : 'Trip Code'}
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                      {currentTrip.tourPasscode || currentTrip.fileNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyTripCode(currentTrip)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      {copiedCodeId === currentTrip.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isAr ? 'نسخ الكود' : 'Copy'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenQrModal(currentTrip, 'itinerary')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      <span>QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePasscode(currentTrip)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer border ${
                        currentTrip.passcodeDisabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {currentTrip.passcodeDisabled ? (
                        <span>{isAr ? 'تفعيل' : 'Enable'}</span>
                      ) : (
                        <span>{isAr ? 'تعطيل' : 'Disable'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Direct Link Preview */}
                <div className="mt-3 flex items-center justify-between text-xs bg-slate-100/60 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 font-mono truncate max-w-[260px]">
                    {getLivePortalUrl(currentTrip)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPortalLink(currentTrip)}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                  >
                    {copiedPortalId === currentTrip.id ? (isAr ? 'تم نسخ الرابط' : 'Link Copied') : (isAr ? 'نسخ الرابط' : 'Copy Link')}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                {isAr ? 'المسافر يرى نسخة مخصصة محمية لا تشمل التكاليف الداخلية أو الملاحظات الخاصة.' : 'Travellers see a restricted projection without internal pricing, net rates, or private notes.'}
              </div>
            </div>
          </div>

          {/* Contextual Weather Widget inside Trip Overview */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {isAr ? 'الطقس الميداني لمحطات الرحلة' : 'Contextual Destination Weather'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'بيانات المناخ الميداني لحظة بلحظة' : 'Live destination climate & recommendations'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.keys(tripWeather).length > 0 ? (
                Object.values(tripWeather).map(w => (
                  <div key={w.city} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{isAr ? w.arabicName || w.city : w.city}</span>
                      <span className="text-base">{w.icon}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-mono font-black text-slate-800">{w.temperatureC}°C</span>
                      <span className="text-[11px] text-slate-500">{isAr ? w.conditionAr : w.condition}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight pt-1 border-t border-slate-200/60">
                      {isAr ? w.travelRecommendationAr : w.travelRecommendation}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-4 text-center text-xs text-slate-400">
                  {loadingWeather ? 'Loading destination weather...' : 'Destination weather loaded contextually for this trip.'}
                </div>
              )}
            </div>
          </div>

          {/* Flight Logistics & Ground Team Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Flight Arrival & Departure Logistics */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sky">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isAr ? 'بيانات الطيران والاستقبال' : 'Flight & Airport Logistics'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Arrival, departure & meet & assist
                    </p>
                  </div>
                </div>

                <label className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentTrip.arrival.meetAndAssist}
                    onChange={e => updateTrip(currentTrip.id, {
                      arrival: { ...currentTrip.arrival, meetAndAssist: e.target.checked }
                    })}
                    className="rounded text-emerald-600"
                  />
                  <span>VIP Meet & Assist</span>
                </label>
              </div>

              {/* Arrival */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{isAr ? 'رحلة الوصول' : 'Arrival Inbound Flight'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Flight No</label>
                    <input
                      type="text"
                      value={currentTrip.arrival.flight}
                      onChange={e => updateTrip(currentTrip.id, { arrival: { ...currentTrip.arrival, flight: e.target.value } })}
                      placeholder="e.g. MS 780"
                      className="w-full font-mono font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Arrival Time</label>
                    <input
                      type="text"
                      value={currentTrip.arrival.time}
                      onChange={e => updateTrip(currentTrip.id, { arrival: { ...currentTrip.arrival, time: e.target.value } })}
                      placeholder="10:00 AM"
                      className="w-full font-mono px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Airport Terminal</label>
                    <input
                      type="text"
                      value={currentTrip.arrival.airport}
                      onChange={e => updateTrip(currentTrip.id, { arrival: { ...currentTrip.arrival, airport: e.target.value } })}
                      placeholder="Cairo International Airport (CAI) Terminal 3"
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Departure */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>{isAr ? 'رحلة المغادرة' : 'Departure Outbound Flight'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Flight No</label>
                    <input
                      type="text"
                      value={currentTrip.departure.flight}
                      onChange={e => updateTrip(currentTrip.id, { departure: { ...currentTrip.departure, flight: e.target.value } })}
                      placeholder="e.g. MS 781"
                      className="w-full font-mono font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Departure Time</label>
                    <input
                      type="text"
                      value={currentTrip.departure.time}
                      onChange={e => updateTrip(currentTrip.id, { departure: { ...currentTrip.departure, time: e.target.value } })}
                      placeholder="04:00 PM"
                      className="w-full font-mono px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Guide, Driver & Ground Team Contacts */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-gold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isAr ? 'طاقم العمل الميداني والأسطول' : 'Field Guide & Chauffeur Fleet'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Direct contact & WhatsApp dispatch
                    </p>
                  </div>
                </div>

                {currentTrip.guidePhone && (
                  <a
                    href={`https://wa.me/${currentTrip.guidePhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Guide details */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>{isAr ? 'المرشد السياحي' : 'Egyptologist Guide'}</span>
                  {!currentTrip.guideName && (
                    <span className="text-amber-700 font-bold text-[10px]">No Guide Assigned</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Name</label>
                    <input
                      type="text"
                      value={currentTrip.guideName}
                      onChange={e => updateTrip(currentTrip.id, { guideName: e.target.value })}
                      placeholder="e.g. Tarek Mansour"
                      className="w-full font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={currentTrip.guidePhone}
                      onChange={e => updateTrip(currentTrip.id, { guidePhone: e.target.value })}
                      placeholder="+20 100 000 0000"
                      className="w-full font-mono px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Driver and Coach */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>{isAr ? 'السائق والمركبة' : 'Chauffeur & Fleet Coach'}</span>
                  {!currentTrip.driverName && (
                    <span className="text-amber-700 font-bold text-[10px]">No Driver Assigned</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Driver Name</label>
                    <input
                      type="text"
                      value={currentTrip.driverName}
                      onChange={e => updateTrip(currentTrip.id, { driverName: e.target.value })}
                      placeholder="e.g. Captain Hisham Zaki"
                      className="w-full font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Vehicle Plate #</label>
                    <input
                      type="text"
                      value={currentTrip.vehiclePlate}
                      onChange={e => updateTrip(currentTrip.id, { vehiclePlate: e.target.value })}
                      placeholder="ق هـ ر 8492"
                      className="w-full font-mono font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Coach Model</label>
                    <input
                      type="text"
                      value={currentTrip.vehicleType}
                      onChange={e => updateTrip(currentTrip.id, { vehicleType: e.target.value })}
                      placeholder="Mercedes-Benz Travego VIP Luxury Coach (50 Pax)"
                      className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated GPS Radar in Operations Overview */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {isAr ? 'رادار المسار الجغرافي الميداني ومواقع الفنادق' : 'Geospatial Route Radar & Hotel Nodes'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setTab('itinerary')}
                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition cursor-pointer"
              >
                <span>{isAr ? 'عرض مسار الرحلة والخدمات ←' : 'Full Itinerary & Map →'}</span>
              </button>
            </div>

            <GoogleTripRouteMap
              waypoints={tripWaypoints}
              uiLang={uiLang}
              height={380}
              showLegsList={false}
              showStatsBanner={true}
            />
          </div>
        </div>
      )}

      {/* 2. GUESTS TAB (Passengers, Rooming, Passcodes) */}
      {(tab === 'guests' || tab === 'passengers' || tab === 'passcodes') && (
        <div className="space-y-5">
          <TripPassengersRooming
            trip={currentTrip}
            uiLang={uiLang}
            onUpdatePassengers={passengers => updateTrip(currentTrip.id, { passengers })}
            onExportRoomingCsv={() => exportRooming(currentTrip)}
            onPrintManifest={() => printManifest(currentTrip)}
            onOpenPassengerQr={pax => handleOpenQrModal(currentTrip, 'passenger', pax)}
          />

          <div className="pt-2">
            <TripPasscodesConsole
              trip={currentTrip}
              workspace={workspace}
              uiLang={uiLang}
              onUpdateTrip={updated => updateTrip(currentTrip.id, updated)}
              onTestPassengerCode={code => {
                const url = new URL(window.location.href);
                url.searchParams.set('code', code);
                window.open(url.toString(), '_blank');
              }}
              onOpenQrModal={(type, pax) => handleOpenQrModal(currentTrip, type, pax || null)}
            />
          </div>
        </div>
      )}

      {/* 3. ITINERARY TAB (Day-by-Day Services & Interactive GPS Map) */}
      {(tab === 'itinerary' || tab === 'services' || tab === 'gps_radar') && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {isAr ? 'خريطة المسار الميداني ومحطات الزيارة' : 'Geospatial Route & Day-by-Day Stops'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openRoadmapForTrip(currentTrip)}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{isAr ? 'محرر خريطة الطريق' : 'Roadmap Builder'}</span>
              </button>
            </div>

            <GoogleTripRouteMap
              waypoints={tripWaypoints}
              uiLang={uiLang}
              height={420}
              showLegsList={true}
              showStatsBanner={true}
            />
          </div>

          <TripServicesTable
            trip={currentTrip}
            workspace={workspace}
            uiLang={uiLang}
            onUpdateService={(serviceId, patch) => {
              const nextServices = currentTrip.services.map(s => s.id === serviceId ? { ...s, ...patch } : s);
              updateTrip(currentTrip.id, { services: nextServices });
            }}
            onPrintVoucher={service => printVoucher(currentTrip, service)}
            onBatchPrintVouchers={() => handleLaunchDispatch(currentTrip)}
            onOpenServiceQr={service => handleOpenQrModal(currentTrip, 'voucher', null, service)}
          />
        </div>
      )}

      {/* 4. ACCOMMODATION TAB (Hotels & Nile Cruises) */}
      {tab === 'accommodation' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Hotel className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {isAr ? 'حجوزات الفنادق والبواخر النيلية' : 'Hotel & Nile Cruise Accommodation'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'متابعة أرقام تأكيد الحجوزات، كشوفات التسكين وقسائم الفنادق المعتمدة' : 'Manage hotel confirmation numbers, room manifests and direct vouchers'}
              </p>
            </div>

            <button
              onClick={() => exportRooming(currentTrip)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير كشف التسكين CSV' : 'Export Rooming CSV'}</span>
            </button>
          </div>

          {hotelServices.length > 0 ? (
            <TripServicesTable
              trip={{ ...currentTrip, services: hotelServices }}
              workspace={workspace}
              uiLang={uiLang}
              onUpdateService={(serviceId, patch) => {
                const nextServices = currentTrip.services.map(s => s.id === serviceId ? { ...s, ...patch } : s);
                updateTrip(currentTrip.id, { services: nextServices });
              }}
              onPrintVoucher={service => printVoucher(currentTrip, service)}
              onBatchPrintVouchers={() => handleLaunchDispatch(currentTrip)}
              onOpenServiceQr={service => handleOpenQrModal(currentTrip, 'voucher', null, service)}
            />
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Hotel className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">
                {isAr ? 'لم يتم تعيين فندق أو باخرة نيلية بعد' : 'No hotel or cruise assigned yet.'}
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                {isAr ? 'أضف حجز الفندق أو الباخرة للرحلة لتأكيد كشف التسكين وإصدار القسيمة.' : 'Add hotel or Nile cruise reservations to assign room manifests and generate vouchers.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  const newService: TripService = {
                    id: newId(),
                    dayNumber: 1,
                    serviceName: '5★ Luxury Hotel Booking',
                    supplierName: 'Partner Hotel',
                    supplierType: 'Hotel',
                    city: currentTrip.services[0]?.city || 'Cairo',
                    status: 'To request',
                    confirmationNo: '',
                    note: 'Standard Room with Breakfast',
                  };
                  updateTrip(currentTrip.id, { services: [...currentTrip.services, newService] });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة فندق / باخرة للرحلة' : 'Assign Hotel / Cruise'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. TRANSPORT TAB (Chauffeur, Coach & Airport Transfers) */}
      {tab === 'transport' && (
        <div className="space-y-4">
          {!currentTrip.driverName && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">{isAr ? 'لم يُعيّن سائق أو مركبة للرحلة بعد.' : 'No driver assigned yet.'}</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                {isAr ? 'أدخل اسم السائق ورقم اللوحة بالأسفل للحفظ المباشر' : 'Assign chauffeur & vehicle plate below'}
              </span>
            </div>
          )}

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {isAr ? 'أسطول النقل والسائق المكلف' : 'Fleet Vehicle & Assigned Chauffeur'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Vehicle assignment & driver WhatsApp link
                  </p>
                </div>
              </div>
              {currentTrip.driverPhone && (
                <a
                  href={`https://wa.me/${currentTrip.driverPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Chauffeur</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Driver Name</label>
                <input
                  type="text"
                  value={currentTrip.driverName}
                  onChange={e => updateTrip(currentTrip.id, { driverName: e.target.value })}
                  placeholder="e.g. Captain Hisham Zaki"
                  className="w-full font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Driver Phone / WhatsApp</label>
                <input
                  type="text"
                  value={currentTrip.driverPhone}
                  onChange={e => updateTrip(currentTrip.id, { driverPhone: e.target.value })}
                  placeholder="+20 100 000 0000"
                  className="w-full font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Vehicle Plate #</label>
                <input
                  type="text"
                  value={currentTrip.vehiclePlate}
                  onChange={e => updateTrip(currentTrip.id, { vehiclePlate: e.target.value })}
                  placeholder="ق هـ ر 8492"
                  className="w-full font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Coach / Vehicle Model</label>
                <input
                  type="text"
                  value={currentTrip.vehicleType}
                  onChange={e => updateTrip(currentTrip.id, { vehicleType: e.target.value })}
                  placeholder="Mercedes-Benz Travego VIP Luxury Coach (50 Pax)"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {transportServices.length > 0 && (
            <TripServicesTable
              trip={{ ...currentTrip, services: transportServices }}
              workspace={workspace}
              uiLang={uiLang}
              onUpdateService={(serviceId, patch) => {
                const nextServices = currentTrip.services.map(s => s.id === serviceId ? { ...s, ...patch } : s);
                updateTrip(currentTrip.id, { services: nextServices });
              }}
              onPrintVoucher={service => printVoucher(currentTrip, service)}
              onBatchPrintVouchers={() => handleLaunchDispatch(currentTrip)}
              onOpenServiceQr={service => handleOpenQrModal(currentTrip, 'voucher', null, service)}
            />
          )}
        </div>
      )}

      {/* 6. GUIDES TAB (Egyptologist Guides & Airport Reps) */}
      {tab === 'guides' && (
        <div className="space-y-4">
          {!currentTrip.guideName && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">{isAr ? 'لم يُعيّن مرشد سياحي مرافق بعد.' : 'No guide assigned yet.'}</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                {isAr ? 'أدخل اسم المرشد ورقم هاتفه بالأسفل للحفظ المباشر' : 'Assign licensed guide below'}
              </span>
            </div>
          )}

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-violet-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {isAr ? 'المرشد السياحي وممثلو المطارات' : 'Lead Egyptologist Guide & Airport Reps'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tour guiding assignments, language and briefing program
                  </p>
                </div>
              </div>
              {currentTrip.guidePhone && (
                <a
                  href={`https://wa.me/${currentTrip.guidePhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Guide</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Guide Name</label>
                <input
                  type="text"
                  value={currentTrip.guideName}
                  onChange={e => updateTrip(currentTrip.id, { guideName: e.target.value })}
                  placeholder="e.g. Tarek Mansour"
                  className="w-full font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={currentTrip.guidePhone}
                  onChange={e => updateTrip(currentTrip.id, { guidePhone: e.target.value })}
                  placeholder="+20 100 000 0000"
                  className="w-full font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Language</label>
                <input
                  type="text"
                  value={currentTrip.guideLanguage}
                  onChange={e => updateTrip(currentTrip.id, { guideLanguage: e.target.value })}
                  placeholder="English / French"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {sightseeingServices.length > 0 && (
            <TripServicesTable
              trip={{ ...currentTrip, services: sightseeingServices }}
              workspace={workspace}
              uiLang={uiLang}
              onUpdateService={(serviceId, patch) => {
                const nextServices = currentTrip.services.map(s => s.id === serviceId ? { ...s, ...patch } : s);
                updateTrip(currentTrip.id, { services: nextServices });
              }}
              onPrintVoucher={service => printVoucher(currentTrip, service)}
              onBatchPrintVouchers={() => handleLaunchDispatch(currentTrip)}
              onOpenServiceQr={service => handleOpenQrModal(currentTrip, 'voucher', null, service)}
            />
          )}
        </div>
      )}

      {/* 7. DOCUMENTS TAB (Vouchers, QR Generator, Booklet) */}
      {(tab === 'documents' || tab === 'vouchers') && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold tracking-tight">
                  {isAr ? 'منصة أوامر التشغيل والقسائم الرسمية A4' : 'Official Operations Dispatch & A4 Voucher Console'}
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {isAr
                  ? 'إصدار أوامر تشغيل رسمية معتمدة لكل الفنادق، البواخر النيلية، وسيارات الليموزين، مع إرسال مباشر للموردين عبر واتساب وطباعة مجمعة لملف الـ A4.'
                  : 'Generate legally compliant DMC service vouchers. Send instant WhatsApp confirmations to partners or batch-print the complete operations binder.'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleLaunchDispatch(currentTrip)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer shrink-0"
              >
                <Shield className="w-4 h-4 text-slate-950" />
                <span>{isAr ? 'فتح منصة القسائم' : 'Launch Dispatch Console'}</span>
              </button>

              <button
                onClick={() => handleOpenQrModal(currentTrip, 'itinerary')}
                className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isAr ? 'توليد QR كود' : 'QR Generator'}</span>
              </button>
            </div>
          </div>

          {currentTrip.services.length > 0 ? (
            <TripServicesTable
              trip={currentTrip}
              workspace={workspace}
              uiLang={uiLang}
              onUpdateService={(serviceId, patch) => {
                const nextServices = currentTrip.services.map(s => s.id === serviceId ? { ...s, ...patch } : s);
                updateTrip(currentTrip.id, { services: nextServices });
              }}
              onPrintVoucher={service => printVoucher(currentTrip, service)}
              onBatchPrintVouchers={() => handleLaunchDispatch(currentTrip)}
              onOpenServiceQr={service => handleOpenQrModal(currentTrip, 'voucher', null, service)}
            />
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">
                {isAr ? 'لا توجد خدمات مضافة لإصدار القسائم' : 'No services scheduled yet.'}
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                {isAr ? 'أضف خدمات وجولات لبرنامج الرحلة ليتم إصدار أوامر التشغيل والقسائم الرسمية.' : 'Add touring, hotel, or transfer services in the Itinerary tab to generate vouchers.'}
              </p>
              <button
                type="button"
                onClick={() => setTab('itinerary')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <span>{isAr ? 'إدارة برنامج الرحلة' : 'Add Services to Itinerary'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8. ACTIVITY TAB (Checklist & Field Log) */}
      {(tab === 'activity' || tab === 'checklist' || tab === 'log') && (
        <div className="space-y-5">
          <TripChecklistConsole
            trip={currentTrip}
            uiLang={uiLang}
            onUpdateChecklist={checklist => updateTrip(currentTrip.id, { checklist })}
          />

          <LogTabConsole
            trip={currentTrip}
            uiLang={uiLang}
            onAddLog={text => {
              const newEntry = { id: newId(), at: new Date().toISOString(), text };
              updateTrip(currentTrip.id, { log: [newEntry, ...currentTrip.log] });
            }}
          />
        </div>
      )}

      {/* Operations Dispatch Modal */}
      {dispatchModalQuote && (
        <OperationsDispatchModal
          isOpen={!!dispatchModalQuote}
          onClose={() => {
            setDispatchModalQuote(null);
            setDispatchModalTrip(null);
          }}
          quote={dispatchModalQuote}
          tripFile={dispatchModalTrip || undefined}
          workspace={workspace}
          uiLang={uiLang}
        />
      )}

      {/* Traveler Tour Booklet & Road Map PDF Modal */}
      {bookletTrip && (
        <RoadmapBookletModal
          isOpen={!!bookletTrip}
          onClose={() => setBookletTrip(null)}
          trip={bookletTrip}
          workspace={workspace}
          uiLang={uiLang}
        />
      )}

      {/* Instant QR Code Generator Modal */}
      {isQrModalOpen && qrModalTrip && (
        <QRCodeModal
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            setQrModalTrip(null);
            setQrModalPassenger(null);
            setQrModalService(null);
          }}
          trip={qrModalTrip}
          workspace={workspace}
          uiLang={uiLang}
          initialType={qrModalType}
          initialPassenger={qrModalPassenger}
          initialService={qrModalService}
        />
      )}

      {/* Progressive Disclosure Trip Creation Modal */}
      {isProgressiveModalOpen && (
        <ProgressiveTripModal
          isOpen={isProgressiveModalOpen}
          onClose={() => setIsProgressiveModalOpen(false)}
          availableQuotes={availableQuotes}
          uiLang={uiLang}
          workspace={workspace}
          onCreateTrip={handleCreateProgressiveTrip}
        />
      )}
    </div>
  );
};

const LogTabConsole: React.FC<{
  trip: TripFile;
  uiLang: UILanguage;
  onAddLog: (text: string) => void;
}> = ({ trip, uiLang, onAddLog }) => {
  const isAr = uiLang === 'ar';
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddLog(text.trim());
    setText('');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-150">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {isAr ? 'سجل الميدان والملاحظات التشغيلية' : 'Field Operations Log & Incident Chronology'}
          </h3>
        </div>
        <span className="font-mono text-xs font-bold text-slate-400">
          {trip.log.length} {isAr ? 'ملاحظة' : 'Entries'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={isAr ? 'أضف ملاحظة ميدانية، طلب تعديل، أو تقرير سائق...' : 'Add field note, client request, luggage status or guide dispatch note...'}
          className="flex-1 text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer shrink-0"
        >
          {isAr ? 'إضافة للسجل' : 'Add Note'}
        </button>
      </form>

      <div className="divide-y divide-slate-100">
        {trip.log.map((entry) => (
          <div key={entry.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{new Date(entry.at).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <p className="text-xs font-medium text-slate-800 leading-relaxed">
              {entry.text}
            </p>
          </div>
        ))}
      </div>

      {trip.log.length === 0 && (
        <div className="p-6 text-center text-slate-400 text-xs">
          {isAr ? 'لا توجد ملاحظات ميدانية مسجلة حتى الآن.' : 'No field notes logged yet.'}
        </div>
      )}
    </div>
  );
};
