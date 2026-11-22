import { writeSafePrintDocument } from '../../lib/safePrint';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  MessageSquare,
  CheckCircle2,
  Clock,
  Plus,
  Edit3,
  X,
  Save,
  Shield,
  MapPin,
  Hotel,
  Truck,
  UserCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Copy,
  Check,
  FileText,
  Calendar,
  Phone,
  CreditCard,
  Ship,
  Compass,
  Columns,
  LayoutGrid,
  RefreshCw,
  Stamp,
  Building2,
} from 'lucide-react';
import { TripFile, TripService, ServiceStatus, loadTrips, saveTrips, newId, CANONICAL_AL_FUTTAIM_TRIP } from '../../lib/tripStore';
import { Workspace, UILanguage, Quote } from '../../types';
import { OperationsDispatchModal } from './OperationsDispatchModal';
import { QRCodeModal } from './QRCodeModal';
import { GuidanceTrigger } from '../common/GuidanceTrigger';

interface VouchersDispatchViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  quotes?: Quote[];
  onNavigateToTrips?: () => void;
}

export interface VoucherItem {
  id: string;
  voucherNo: string;
  tripId: string;
  fileNumber: string;
  tourPasscode?: string;
  travelerName: string;
  serviceId: string;
  serviceName: string;
  supplierName: string;
  supplierType: string;
  city: string;
  dayNumber: number;
  status: ServiceStatus;
  confirmationNo: string;
  notes: string;
  paxCount: number;
  serviceDate: string;
  boardBasis: string;
  roomType: string;
  nightsCount: number;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  billingTerms: string;
  supplierPhone: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleType: string;
  guideName: string;
  guidePhone: string;
  guideLanguage: string;
}

function buildStarterOperationalTrips(_quotes: Quote[]): TripFile[] {
  return [CANONICAL_AL_FUTTAIM_TRIP];
}

export const VouchersDispatchView: React.FC<VouchersDispatchViewProps> = ({
  workspace,
  uiLang,
  quotes = [],
  onNavigateToTrips,
}) => {
  const isAr = uiLang === 'ar';

  const [trips, setTrips] = useState<TripFile[]>(() => {
    const existing = loadTrips();
    if (existing.length > 0 && existing.some(t => (t.services || []).length > 0)) {
      return existing;
    }
    const starter = buildStarterOperationalTrips(quotes);
    saveTrips(starter);
    return starter;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [tripFilter, setTripFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [layoutMode, setLayoutMode] = useState<'split' | 'grid'>('split');

  // Selected voucher in the Live A4 Studio
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
  const [studioMode, setStudioMode] = useState<'preview' | 'edit' | 'create'>('preview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [dispatchModalTrip, setDispatchModalTrip] = useState<TripFile | null>(null);
  const [dispatchModalQuote, setDispatchModalQuote] = useState<Quote | null>(null);
  const [qrModalTrip, setQrModalTrip] = useState<TripFile | null>(null);
  const [qrModalService, setQrModalService] = useState<TripService | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Aggregate all vouchers across all trips
  const vouchers: VoucherItem[] = useMemo(() => {
    const list: VoucherItem[] = [];

    trips.forEach(t => {
      const baseDate = t.startDate ? new Date(t.startDate) : new Date();

      (t.services || []).forEach(s => {
        const svcDate = new Date(baseDate.getTime() + (Math.max(1, s.dayNumber) - 1) * 24 * 60 * 60 * 1000);
        const dateStr = isNaN(svcDate.getTime()) ? '2026-11-20' : svcDate.toISOString().split('T')[0];
        const seed = Math.abs((s.id + t.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000) % 9000 + 1000);
        const catCode = (s.supplierType || 'SVC').slice(0, 3).toUpperCase();
        const isStay = s.supplierType.toLowerCase().includes('hotel') || s.supplierType.toLowerCase().includes('cruise');

        list.push({
          id: `vch-${t.id}-${s.id}`,
          voucherNo: `VCH-${(t.fileNumber || '0104').slice(-4)}-${catCode}-${seed}`,
          tripId: t.id,
          fileNumber: t.fileNumber,
          tourPasscode: t.tourPasscode,
          travelerName: t.travelerName,
          serviceId: s.id,
          serviceName: s.serviceName,
          supplierName: s.supplierName || (isAr ? 'مورد سياحي معتمد' : 'Authorized DMC Supplier'),
          supplierType: s.supplierType || 'Hotel',
          city: s.city || 'Cairo',
          dayNumber: s.dayNumber || 1,
          status: s.status || 'Confirmed',
          confirmationNo: s.confirmationNo || '',
          notes: s.note || '',
          paxCount: t.passengers?.length || 4,
          serviceDate: dateStr,
          boardBasis: s.boardBasis || (isStay ? 'BB - Bed & Buffet Breakfast' : 'Included in Program'),
          roomType: s.roomType || (isStay ? '2x Deluxe Room (DBL)' : 'Private Group Allocation'),
          nightsCount: s.nightsCount || (isStay ? 3 : 1),
          pickupTime: s.pickupTime || (isStay ? '14:00 Check-In' : '08:30 AM'),
          pickupLocation: s.pickupLocation || `${s.city || 'Cairo'} Central Point`,
          dropoffLocation: s.dropoffLocation || s.serviceName,
          billingTerms: s.billingTerms || 'Direct Corporate Account (Credit)',
          supplierPhone: s.supplierPhone || '+20 2 2791 7000',
          driverName: s.assignedDriverName || t.driverName || 'كابتن محمود عبد الرحمن',
          driverPhone: s.assignedDriverPhone || t.driverPhone || '+20 100 412 8890',
          vehiclePlate: s.assignedVehiclePlate || t.vehiclePlate || 'س ص ع 4921',
          vehicleType: s.assignedVehicleType || t.vehicleType || 'Mercedes-Benz Tourismo VIP',
          guideName: s.assignedGuideName || t.guideName || 'أ. شريف المنيري',
          guidePhone: s.assignedGuidePhone || t.guidePhone || '+20 122 781 9044',
          guideLanguage: s.assignedGuideLanguage || t.guideLanguage || 'Arabic / English',
        });
      });
    });

    return list;
  }, [trips, isAr]);

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      if (tripFilter !== 'All' && v.tripId !== tripFilter) return false;
      if (typeFilter !== 'All') {
        const st = v.supplierType.toLowerCase();
        if (typeFilter === 'Hotel' && !st.includes('hotel')) return false;
        if (typeFilter === 'Cruise' && !st.includes('cruise')) return false;
        if (typeFilter === 'Transfer' && !st.includes('transfer') && !st.includes('transport') && !st.includes('flight')) return false;
        if (typeFilter === 'Guide' && !st.includes('guide')) return false;
        if (typeFilter === 'Excursion' && !st.includes('excursion') && !st.includes('other') && !st.includes('ticket')) return false;
      }
      if (statusFilter !== 'All' && v.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          v.voucherNo.toLowerCase().includes(q) ||
          v.supplierName.toLowerCase().includes(q) ||
          v.serviceName.toLowerCase().includes(q) ||
          v.confirmationNo.toLowerCase().includes(q) ||
          v.fileNumber.toLowerCase().includes(q) ||
          v.travelerName.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.driverName.toLowerCase().includes(q) ||
          v.guideName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [vouchers, tripFilter, typeFilter, statusFilter, searchQuery]);

  // Keep selectedVoucherId synced with available vouchers
  useEffect(() => {
    if (filteredVouchers.length > 0 && !filteredVouchers.some(v => v.id === selectedVoucherId)) {
      setSelectedVoucherId(filteredVouchers[0].id);
    }
  }, [filteredVouchers, selectedVoucherId]);

  const activeVoucher: VoucherItem | null = useMemo(() => {
    return filteredVouchers.find(v => v.id === selectedVoucherId) || vouchers.find(v => v.id === selectedVoucherId) || filteredVouchers[0] || vouchers[0] || null;
  }, [filteredVouchers, vouchers, selectedVoucherId]);

  // Draft state for live editing or creating a new voucher/dispatch order
  const [draftForm, setDraftForm] = useState<VoucherItem>(() =>
    activeVoucher || {
      id: 'new',
      voucherNo: 'VCH-NEW-HTL-9012',
      tripId: trips[0]?.id || 'new-trip',
      fileNumber: trips[0]?.fileNumber || 'TRIP-2026-0105',
      travelerName: trips[0]?.travelerName || 'VIP Guest Delegation',
      serviceId: 'new-svc',
      serviceName: 'Four Seasons Hotel Cairo at Nile Plaza',
      supplierName: 'Four Seasons Cairo Nile Plaza',
      supplierType: 'Hotel',
      city: 'Cairo',
      dayNumber: 1,
      status: 'Confirmed',
      confirmationNo: 'CNF-90812',
      notes: 'VIP welcome amenities, panoramic Nile view rooms guaranteed.',
      paxCount: 4,
      serviceDate: '2026-11-22',
      boardBasis: 'BB - Bed & Buffet Breakfast',
      roomType: '2x Deluxe Nile View DBL',
      nightsCount: 3,
      pickupTime: '14:00 Check-In',
      pickupLocation: 'Cairo International Airport',
      dropoffLocation: 'Four Seasons Hotel Cairo',
      billingTerms: 'Direct Corporate Account (Credit)',
      supplierPhone: '+20 2 2791 7000',
      driverName: 'كابتن محمود عبد الرحمن',
      driverPhone: '+20 100 412 8890',
      vehiclePlate: 'س ص ع 4921',
      vehicleType: 'Mercedes-Benz V-Class VIP',
      guideName: 'أ. شريف المنيري',
      guidePhone: '+20 122 781 9044',
      guideLanguage: 'Arabic / English',
    }
  );

  // Sync draftForm when switching selected voucher in preview/edit mode
  useEffect(() => {
    if (studioMode !== 'create' && activeVoucher) {
      setDraftForm(activeVoucher);
    }
  }, [activeVoucher, studioMode]);

  // The voucher currently rendered inside the Live A4 Paper Sheet (reflects live typing in edit/create mode!)
  const previewVoucher: VoucherItem | null = studioMode === 'preview' ? activeVoucher : draftForm;

  // KPIs
  const stats = useMemo(() => {
    const total = vouchers.length;
    const confirmed = vouchers.filter(v => v.status === 'Confirmed' || v.status === 'Reconfirmed').length;
    const pending = vouchers.filter(v => v.status === 'To request' || v.status === 'Requested').length;
    const hotelsAndCruises = vouchers.filter(
      v => v.supplierType.toLowerCase().includes('hotel') || v.supplierType.toLowerCase().includes('cruise')
    ).length;
    const fleetAndGuides = vouchers.filter(
      v =>
        v.supplierType.toLowerCase().includes('transfer') ||
        v.supplierType.toLowerCase().includes('transport') ||
        v.supplierType.toLowerCase().includes('guide')
    ).length;
    return { total, confirmed, pending, hotelsAndCruises, fleetAndGuides };
  }, [vouchers]);

  // Open Create New Voucher / Dispatch Order Studio
  const handleStartNewVoucher = (presetCategory: string = 'Hotel') => {
    const baseTrip = trips.find(t => t.id === (tripFilter !== 'All' ? tripFilter : trips[0]?.id)) || trips[0];
    const rand = Math.floor(1000 + Math.random() * 9000);
    const catCode = presetCategory.slice(0, 3).toUpperCase();
    const isStay = presetCategory === 'Hotel' || presetCategory === 'Cruise';

    setDraftForm({
      id: `vch-new-${Date.now()}`,
      voucherNo: `VCH-${(baseTrip?.fileNumber || '0105').slice(-4)}-${catCode}-${rand}`,
      tripId: baseTrip?.id || 'new-trip',
      fileNumber: baseTrip?.fileNumber || `TRIP-2026-${rand}`,
      travelerName: baseTrip?.travelerName || (isAr ? 'مجموعة وفد كبار الزوار' : 'Executive VIP Tour Group'),
      serviceId: newId(),
      serviceName:
        presetCategory === 'Hotel'
          ? 'Sofitel Legend Old Cataract Aswan (3 Nights)'
          : presetCategory === 'Cruise'
          ? 'Oberoi Philae Luxury Nile Cruiser (4 Nights)'
          : presetCategory === 'Transfer'
          ? 'VIP Airport Meet & Assist + Private Mercedes Coach Transfer'
          : presetCategory === 'Guide'
          ? 'Licensed Senior Egyptologist Full-Day Guiding'
          : 'Private Sound & Light Show VIP Terrace Entry',
      supplierName:
        presetCategory === 'Hotel'
          ? 'Sofitel Legend Old Cataract'
          : presetCategory === 'Cruise'
          ? 'Oberoi Nile Cruises Egypt'
          : presetCategory === 'Transfer'
          ? 'Daleel Tourist Fleet & Limousine'
          : presetCategory === 'Guide'
          ? 'Egyptian Tour Guides Syndicate'
          : 'Sound & Light Cinema Company',
      supplierType: presetCategory,
      city: presetCategory === 'Hotel' ? 'Aswan' : presetCategory === 'Cruise' ? 'Luxor' : 'Cairo',
      dayNumber: 1,
      status: 'Confirmed',
      confirmationNo: `CNF-${rand}`,
      notes: isStay
        ? isAr
          ? 'إطلالة مباشرة على النيل، تسجيل دخول مبكر وضمان الغرف المتجاورة.'
          : 'Direct panoramic Nile view, early check-in & adjacent rooms guaranteed.'
        : isAr
        ? 'يرجى التواجد قبل الموعد بـ 30 دقيقة مع لوحة استقبال باسم الفوج.'
        : 'Please arrive 30 minutes prior to scheduled pickup with branded group signboard.',
      paxCount: baseTrip?.passengers?.length || 4,
      serviceDate: baseTrip?.startDate || '2026-11-22',
      boardBasis: isStay ? 'BB - Bed & Buffet Breakfast' : 'VIP Service & Refreshments Included',
      roomType: isStay ? '2x Luxury Nile View DBL' : 'Mercedes-Benz Tourismo / VIP Van',
      nightsCount: isStay ? 3 : 1,
      pickupTime: isStay ? '14:00 Check-In' : '08:30 AM',
      pickupLocation: isStay ? 'Aswan Corniche El Nil' : 'Cairo Airport Terminal 3 / Hotel Lobby',
      dropoffLocation: isStay ? 'Sofitel Old Cataract Reception' : 'Giza Plateau & GEM Museum',
      billingTerms: 'Direct Corporate Account (Credit)',
      supplierPhone: '+20 100 249 1000',
      driverName: baseTrip?.driverName || 'كابتن محمود عبد الرحمن',
      driverPhone: baseTrip?.driverPhone || '+20 100 412 8890',
      vehiclePlate: baseTrip?.vehiclePlate || 'س ص ع 4921',
      vehicleType: baseTrip?.vehicleType || 'Mercedes-Benz V-Class VIP',
      guideName: baseTrip?.guideName || 'أ. شريف المنيري',
      guidePhone: baseTrip?.guidePhone || '+20 122 781 9044',
      guideLanguage: baseTrip?.guideLanguage || 'Arabic / English',
    });
    setStudioMode('create');
    setLayoutMode('split');
  };

  // Save edited or newly created voucher to persistent tripStore
  const handleSaveDraftVoucher = () => {
    const newService: TripService = {
      id: draftForm.serviceId || newId(),
      dayNumber: Number(draftForm.dayNumber) || 1,
      serviceName: draftForm.serviceName.trim() || 'Official Tourist Service',
      supplierName: draftForm.supplierName.trim() || 'Authorized Supplier',
      supplierType: draftForm.supplierType || 'Hotel',
      city: draftForm.city.trim() || 'Cairo',
      status: draftForm.status,
      confirmationNo: draftForm.confirmationNo.trim(),
      note: draftForm.notes.trim(),
      boardBasis: draftForm.boardBasis,
      roomType: draftForm.roomType,
      nightsCount: Number(draftForm.nightsCount) || 1,
      pickupTime: draftForm.pickupTime,
      pickupLocation: draftForm.pickupLocation,
      dropoffLocation: draftForm.dropoffLocation,
      billingTerms: draftForm.billingTerms,
      supplierPhone: draftForm.supplierPhone,
      assignedDriverName: draftForm.driverName,
      assignedDriverPhone: draftForm.driverPhone,
      assignedVehiclePlate: draftForm.vehiclePlate,
      assignedVehicleType: draftForm.vehicleType,
      assignedGuideName: draftForm.guideName,
      assignedGuidePhone: draftForm.guidePhone,
      assignedGuideLanguage: draftForm.guideLanguage,
      dispatchedAt: new Date().toISOString(),
    };

    let targetTrip = trips.find(t => t.id === draftForm.tripId);
    let nextTrips: TripFile[];

    if (targetTrip) {
      const exists = (targetTrip.services || []).some(s => s.id === newService.id);
      const nextServices = exists
        ? targetTrip.services.map(s => (s.id === newService.id ? newService : s))
        : [newService, ...(targetTrip.services || [])];

      const updatedTrip: TripFile = {
        ...targetTrip,
        travelerName: draftForm.travelerName || targetTrip.travelerName,
        driverName: draftForm.driverName || targetTrip.driverName,
        driverPhone: draftForm.driverPhone || targetTrip.driverPhone,
        vehiclePlate: draftForm.vehiclePlate || targetTrip.vehiclePlate,
        vehicleType: draftForm.vehicleType || targetTrip.vehicleType,
        guideName: draftForm.guideName || targetTrip.guideName,
        guidePhone: draftForm.guidePhone || targetTrip.guidePhone,
        guideLanguage: draftForm.guideLanguage || targetTrip.guideLanguage,
        services: nextServices,
        updatedAt: new Date().toISOString(),
      };
      nextTrips = trips.map(t => (t.id === updatedTrip.id ? updatedTrip : t));
      targetTrip = updatedTrip;
    } else {
      const createdTripId = newId();
      targetTrip = {
        id: createdTripId,
        quoteId: createdTripId,
        fileNumber: draftForm.fileNumber || `TRIP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        tourPasscode: `RIHAL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        travelerName: draftForm.travelerName || 'VIP Tour Delegation',
        startDate: draftForm.serviceDate || '2026-11-20',
        durationDays: Math.max(1, Number(draftForm.nightsCount) || 4),
        status: 'Confirmed',
        arrival: { flight: 'MS-913', date: draftForm.serviceDate, time: '14:00', airport: 'Cairo (CAI)', meetAndAssist: true },
        departure: { flight: 'MS-914', date: draftForm.serviceDate, time: '18:00', airport: 'Cairo (CAI)' },
        guideName: draftForm.guideName,
        guidePhone: draftForm.guidePhone,
        guideLanguage: draftForm.guideLanguage,
        driverName: draftForm.driverName,
        driverPhone: draftForm.driverPhone,
        vehiclePlate: draftForm.vehiclePlate,
        vehicleType: draftForm.vehicleType,
        emergencyContact: workspace.contactPhone || '+20 100 249 1000',
        services: [newService],
        passengers: Array.from({ length: Math.max(1, Number(draftForm.paxCount) || 2) }).map((_, i) => ({
          id: newId(),
          name: i === 0 ? draftForm.travelerName : `Guest ${i + 1}`,
          nationality: 'VIP',
          type: 'Adult',
          room: draftForm.roomType || 'Room 101',
          dietary: '',
        })),
        checklist: [],
        log: [],
        updatedAt: new Date().toISOString(),
      };
      nextTrips = [targetTrip, ...trips];
    }

    setTrips(nextTrips);
    saveTrips(nextTrips);
    const savedVoucherId = `vch-${targetTrip.id}-${newService.id}`;
    setSelectedVoucherId(savedVoucherId);
    setStudioMode('preview');
    showToast(
      isAr
        ? `تم حفظ وإصدار القسيمة الرسمية (${draftForm.voucherNo}) وتحديث سجل التشغيل`
        : `Official Voucher (${draftForm.voucherNo}) saved & issued to operations registry`
    );
  };

  // 1-Click Status Progression directly on any voucher
  const handleQuickStatusChange = (v: VoucherItem, nextStatus: ServiceStatus) => {
    const nextTrips = trips.map(t => {
      if (t.id !== v.tripId) return t;
      return {
        ...t,
        services: (t.services || []).map(s =>
          s.id === v.serviceId
            ? {
                ...s,
                status: nextStatus,
                confirmationNo:
                  (nextStatus === 'Confirmed' || nextStatus === 'Reconfirmed') && !s.confirmationNo
                    ? `CNF-${Math.floor(10000 + Math.random() * 90000)}`
                    : s.confirmationNo,
              }
            : s
        ),
        updatedAt: new Date().toISOString(),
      };
    });
    setTrips(nextTrips);
    saveTrips(nextTrips);
    showToast(
      isAr
        ? `تم تحديث حالة القسيمة ${v.voucherNo} إلى: ${nextStatus}`
        : `Updated ${v.voucherNo} status to ${nextStatus}`
    );
  };

  // Format WhatsApp Message for Supplier / Driver / Guide
  const formatVoucherWhatsAppText = (v: VoucherItem) => {
    const isTransport = v.supplierType.toLowerCase().includes('transfer') || v.supplierType.toLowerCase().includes('transport');
    const isGuide = v.supplierType.toLowerCase().includes('guide');

    if (isAr) {
      return (
        `*${isTransport ? 'أمر تشغيل وتحرك مركبة سياحية' : isGuide ? 'أمر تكليف مرشد سياحي معتمد' : 'قسيمة حجز وتوريد خدمة سياحية رسمية'} — ${workspace.name}*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔖 *رقم القسيمة:* ${v.voucherNo}\n` +
        `📁 *ملف الفوج:* ${v.fileNumber}\n` +
        `🏢 *المورد / الجهة:* ${v.supplierName} (${v.city})\n` +
        `🔢 *رقم التأكيد:* ${v.confirmationNo || 'قيد التأكيد الفوري'}\n` +
        `👥 *اسم الفوج / الضيف:* ${v.travelerName} (${v.paxCount} أفراد)\n` +
        `📅 *التاريخ والوقت:* ${v.serviceDate} • ${v.pickupTime}\n` +
        `🛎️ *الخدمة المطلوبة:* ${v.serviceName}\n` +
        `🍽️ *الغرف / المشمولات:* ${v.roomType} (${v.boardBasis})\n` +
        `📍 *نقطة التحرك / الموقع:* ${v.pickupLocation} ← ${v.dropoffLocation}\n` +
        `🚐 *السائق والمركبة:* ${v.driverName} (${v.driverPhone}) — لوحة: ${v.vehiclePlate}\n` +
        `🧭 *المرشد السياحي:* ${v.guideName} (${v.guidePhone})\n` +
        `💳 *التسوية المالية:* ${v.billingTerms}\n` +
        (v.notes ? `📝 *تعليمات التشغيل:* ${v.notes}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ *حالة الاعتماد:* ${v.status}\n` +
        `📞 مكتب العمليات والطوارئ: ${workspace.contactPhone || '+20 100 249 1000'}`
      );
    }

    return (
      `*OFFICIAL DMC SERVICE VOUCHER & DISPATCH ORDER — ${workspace.name}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *Voucher Ref:* ${v.voucherNo}\n` +
      `📁 *File Number:* ${v.fileNumber}\n` +
      `🏢 *Supplier:* ${v.supplierName} (${v.city})\n` +
      `🔢 *Confirmation No:* ${v.confirmationNo || 'Pending Reconfirmation'}\n` +
      `👥 *Lead Guest / Group:* ${v.travelerName} (${v.paxCount} Pax)\n` +
      `📅 *Date & Time:* ${v.serviceDate} • ${v.pickupTime}\n` +
      `🛎️ *Designated Service:* ${v.serviceName}\n` +
      `🍽️ *Allocation / Board:* ${v.roomType} (${v.boardBasis})\n` +
      `📍 *Route / Location:* ${v.pickupLocation} → ${v.dropoffLocation}\n` +
      `🚐 *Assigned Driver:* ${v.driverName} (${v.driverPhone}) — Plate: ${v.vehiclePlate}\n` +
      `🧭 *Assigned Guide:* ${v.guideName} (${v.guidePhone})\n` +
      `💳 *Billing Settlement:* ${v.billingTerms}\n` +
      (v.notes ? `📝 *Operational Notes:* ${v.notes}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *Status:* ${v.status}\n` +
      `📞 24/7 Operations Desk: ${workspace.contactPhone || '+20 100 249 1000'}`
    );
  };

  const handleCopyWhatsAppText = (v: VoucherItem) => {
    const text = formatVoucherWhatsAppText(v);
    navigator.clipboard?.writeText(text);
    setCopiedId(v.id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast(
      isAr
        ? 'تم نسخ نص أمر التشغيل الرسمي للحافظة — جاهز للإرسال عبر واتساب'
        : 'Formatted WhatsApp voucher & dispatch order copied to clipboard'
    );
  };

  // Print Official Branded Voucher A4 (Iframe-safe hidden print frame fallback + safePrint)
  const printOfficialVoucher = (v: VoucherItem) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}">
      <head>
        <title>${v.voucherNo} - ${v.fileNumber}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 12.5px; line-height: 1.5; }
          .header { border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { text-align: center; font-size: 17px; font-weight: 800; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge { display: inline-block; background: #0f172a; color: white; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .card-title { font-weight: 800; font-size: 11.5px; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #e2e8f0; }
          .row-label { color: #64748b; font-size: 11px; }
          .row-val { font-weight: 700; }
          .full-box { border: 2px solid #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 16px; background: #ffffff; }
          .footer { margin-top: 28px; display: flex; justify-content: space-between; text-align: center; font-size: 11.5px; }
          .stamp-box { width: 145px; height: 82px; border: 2px dashed #059669; border-radius: 8px; margin: 8px auto 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #059669; font-size: 10px; font-weight: bold; background: #ecfdf5; }
          .barcode-box { text-align: center; font-family: monospace; font-size: 16px; letter-spacing: 4px; padding: 6px 14px; border: 1px solid #cbd5e1; background: #fff; width: fit-content; margin: 8px auto 14px; font-weight: bold; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin:0; font-size: 18px; color: #0f172a;">${workspace.name}</h2>
            <div style="font-size: 11px; color: #475569;">Egyptian Ministry of Tourism License #2049-Cat A • IATA Accredited DMC</div>
            <div style="font-size: 11px; color: #475569;">24/7 Operations Desk: <b>${workspace.contactPhone || '+20 100 249 1000'}</b></div>
          </div>
          <div style="text-align: right;">
            <div class="badge">OFFICIAL DMC VOUCHER & DISPATCH</div>
            <div style="font-size: 13px; margin-top: 4px; font-weight: bold; font-family: monospace; color: #b45309;">${v.voucherNo}</div>
            <div style="font-size: 11px; color: #64748b;">Issued: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="title">${isAr ? 'قسيمة توريد خدمة وأمر تشغيل رسمي معتمد' : 'OFFICIAL SUPPLIER SERVICE VOUCHER & DISPATCH ORDER'}</div>
        <div class="barcode-box">||| ${v.voucherNo} |||</div>

        <div class="grid">
          <div class="card">
            <div class="card-title">${isAr ? 'بيانات المورد والخدمة' : 'SUPPLIER & SERVICE PARTICULARS'}</div>
            <div class="row"><span class="row-label">${isAr ? 'المورد / الفندق' : 'Supplier Name'}:</span><span class="row-val">${v.supplierName}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'المدينة والتصنيف' : 'City & Category'}:</span><span class="row-val">${v.city} — ${v.supplierType}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'رقم تأكيد الحجز' : 'Confirmation No'}:</span><span class="row-val" style="color: #0284c7; font-family: monospace;">${v.confirmationNo || 'PENDING'}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'التاريخ والوقت' : 'Service Date & Time'}:</span><span class="row-val">${v.serviceDate} (${v.pickupTime})</span></div>
            <div class="row"><span class="row-label">${isAr ? 'هاتف المورد' : 'Supplier Contact'}:</span><span class="row-val" style="font-family: monospace;">${v.supplierPhone}</span></div>
          </div>

          <div class="card">
            <div class="card-title">${isAr ? 'بيانات الفوج والتسكين' : 'GUEST & ALLOCATION MANIFEST'}</div>
            <div class="row"><span class="row-label">${isAr ? 'رقم ملف التشغيل' : 'Operations File'}:</span><span class="row-val" style="font-family: monospace;">${v.fileNumber}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'اسم الفوج / الضيف' : 'Lead Guest / Group'}:</span><span class="row-val">${v.travelerName}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'عدد الأفراد والليالي' : 'Pax & Duration'}:</span><span class="row-val">${v.paxCount} Pax • ${v.nightsCount} Night(s)/Day(s)</span></div>
            <div class="row"><span class="row-label">${isAr ? 'نوع الغرف / المركبة' : 'Allocation / Unit'}:</span><span class="row-val">${v.roomType}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'نظام الوجبات / المشمولات' : 'Board / Inclusions'}:</span><span class="row-val">${v.boardBasis}</span></div>
          </div>
        </div>

        <div class="full-box">
          <div style="font-weight: 800; font-size: 12px; margin-bottom: 4px; color: #475569; text-transform: uppercase;">${isAr ? 'تفاصيل الخدمة ومسار التشغيل' : 'DESIGNATED SERVICE & LOGISTICS ROUTE'}</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${v.serviceName}</div>
          <div style="margin-top: 6px; font-size: 12px; color: #334155;">
            <b>${isAr ? 'نقطة الالتقاء والتحرك:' : 'Pickup / Location:'}</b> ${v.pickupLocation} &rarr; ${v.dropoffLocation}
          </div>
          <div style="margin-top: 6px; font-size: 12px; color: #334155; display: flex; justify-content: space-between; gap: 12px;">
            <span><b>${isAr ? 'السائق والمركبة:' : 'Assigned Driver:'}</b> ${v.driverName} (${v.driverPhone}) — [${v.vehiclePlate}]</span>
            <span><b>${isAr ? 'المرشد المرافق:' : 'Assigned Guide:'}</b> ${v.guideName} (${v.guidePhone})</span>
          </div>
          ${v.notes ? `<div style="margin-top: 8px; font-size: 12px; color: #1e293b; background: #fffbeb; padding: 8px 10px; border-radius: 6px; border: 1px solid #fde68a;"><b>${isAr ? 'ملاحظات وتعليمات خاصة:' : 'Special Operational Instructions:'}</b> ${v.notes}</div>` : ''}
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #0f172a;">
            <b>${isAr ? 'شروط التسوية المالية والفوترة:' : 'Financial Settlement & Billing Terms:'}</b> ${v.billingTerms}
          </div>
        </div>

        <div class="footer">
          <div>
            <div><b>${isAr ? 'الختم الإلكتروني والاعتماد الرسمي' : 'Authorized DMC Electronic Seal'}</b></div>
            <div class="stamp-box">
              <div>${workspace.name.toUpperCase()}</div>
              <div>VERIFIED • ${v.status.toUpperCase()}</div>
              <div style="font-family: monospace; font-size: 9px;">${v.voucherNo}</div>
            </div>
          </div>
          <div>
            <div><b>${isAr ? 'توقيع الضيف / قائد الفوج' : 'Tour Leader / Guest Signature'}</b></div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Services received as specified</div>
            <div style="margin-top: 48px; border-bottom: 1px solid #94a3b8; width: 150px;"></div>
          </div>
          <div>
            <div><b>${isAr ? 'ختم وتوقيع المورد بالاستلام' : 'Supplier Acknowledgment & Stamp'}</b></div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Accepted for corporate settlement</div>
            <div style="width: 145px; height: 82px; border: 2px dashed #94a3b8; border-radius: 8px; margin: 8px auto 0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px;">Supplier Stamp</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use hidden iframe for reliable printing inside sandboxed preview without popup blockers
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (win) {
      writeSafePrintDocument(win, htmlContent);
      win.document.close();
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch {}
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 250);
    }
  };

  // Batch Print all filtered vouchers
  const batchPrintVouchers = () => {
    if (filteredVouchers.length === 0) return;
    const pages = filteredVouchers
      .map(
        v => `
      <div style="page-break-after: always; padding: 18px; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px;">
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between;">
          <div>
            <h2 style="margin:0; font-size: 16px;">${workspace.name}</h2>
            <div style="font-size: 10px; color: #475569;">Egyptian Ministry of Tourism License #2049-Cat A</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; font-family: monospace; color: #b45309; font-size: 13px;">${v.voucherNo}</div>
            <div style="font-size: 10px; color: #64748b;">File: ${v.fileNumber} • ${v.serviceDate}</div>
          </div>
        </div>
        <div style="font-weight: 800; font-size: 15px; margin-bottom: 10px; color: #0f172a;">${v.supplierType.toUpperCase()} VOUCHER — ${v.serviceName}</div>
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 11.5px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div><b>Supplier:</b> ${v.supplierName} (${v.city})</div>
          <div><b>Confirmation No:</b> <span style="font-family: monospace; color: #0284c7;">${v.confirmationNo || 'PENDING'}</span></div>
          <div><b>Guest / Group:</b> ${v.travelerName} (${v.paxCount} Pax)</div>
          <div><b>Allocation / Board:</b> ${v.roomType} • ${v.boardBasis}</div>
          <div><b>Pickup / Route:</b> ${v.pickupTime} — ${v.pickupLocation}</div>
          <div><b>Billing Terms:</b> ${v.billingTerms}</div>
          <div><b>Assigned Driver:</b> ${v.driverName} (${v.driverPhone})</div>
          <div><b>Assigned Guide:</b> ${v.guideName} (${v.guidePhone})</div>
        </div>
        ${v.notes ? `<div style="margin-top: 8px; font-size: 11px; color: #334155; background: #fffbeb; padding: 8px; border: 1px solid #fde68a; border-radius: 6px;"><b>Notes:</b> ${v.notes}</div>` : ''}
      </div>
    `
      )
      .join('');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    if (win) {
      writeSafePrintDocument(
        win,
        `<!DOCTYPE html><html><head><title>Operations-Vouchers-Pack</title><style>@page { size: A4; margin: 10mm; } body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; }</style></head><body>${pages}</body></html>`
      );
      win.document.close();
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch {}
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 250);
    }
  };

  // Launch Full Dispatch Console for a trip
  const launchDispatchForTrip = (tripId: string) => {
    const targetTrip = trips.find(item => item.id === tripId) || trips[0];
    if (targetTrip) {
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
            adults: targetTrip.passengers?.length || 4,
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
    }
  };

  const getCategoryIcon = (supplierType: string) => {
    const st = supplierType.toLowerCase();
    if (st.includes('cruise')) return <Ship className="w-4 h-4 text-sky-700" />;
    if (st.includes('hotel')) return <Hotel className="w-4 h-4 text-amber-700" />;
    if (st.includes('transfer') || st.includes('transport')) return <Truck className="w-4 h-4 text-emerald-700" />;
    if (st.includes('guide')) return <UserCheck className="w-4 h-4 text-purple-700" />;
    return <Compass className="w-4 h-4 text-amber-700" />;
  };

  const getDocumentHeaderTitle = (supplierType: string) => {
    const st = supplierType.toLowerCase();
    if (st.includes('cruise')) {
      return {
        ar: 'قسيمة إقامة وحجز باخرة نيلية رسمية',
        en: 'OFFICIAL NILE CRUISE ACCOMMODATION VOUCHER',
      };
    }
    if (st.includes('hotel')) {
      return {
        ar: 'قسيمة إقامة وحجز فندقي رسمية معتمدة',
        en: 'OFFICIAL HOTEL ACCOMMODATION VOUCHER',
      };
    }
    if (st.includes('transfer') || st.includes('transport')) {
      return {
        ar: 'أمر تشغيل وتحرك مركبة سياحية رسمي',
        en: 'OFFICIAL FLEET & DRIVER DISPATCH ORDER',
      };
    }
    if (st.includes('guide')) {
      return {
        ar: 'أمر تكليف مرشد سياحي ومرافق رسمي',
        en: 'OFFICIAL LICENSED TOUR GUIDE ASSIGNMENT ORDER',
      };
    }
    return {
      ar: 'قسيمة دخول مزارات وخدمات سياحية رسمية',
      en: 'OFFICIAL EXCURSION & SERVICE VOUCHER',
    };
  };

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 end-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-2.5 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Calm Light Header Banner */}
      <div className="bg-gradient-to-br from-[#FAF8F5] via-[#FFFDF9] to-[#F3EDE2] text-[#44200F] rounded-3xl p-6 border border-[#E5DEC9] shadow-2xs relative overflow-hidden">
        <GuidanceTrigger
          sectionKey="trips_workspace"
          uiLang={uiLang}
          variant="gold"
          pinned={true}
          size="sm"
          label={isAr ? 'دليل القسائم' : 'Vouchers Guide'}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10 pe-12 sm:pe-14">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8C6239]">
              <Receipt className="w-4 h-4 text-[#B8860B]" />
              <span>{isAr ? 'استوديو قسائم الفنادق وأوامر التشغيل الرسمية' : 'Official DMC Vouchers & Dispatch Studio'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px] text-[#6E4730]">{workspace.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#44200F]">
              {isAr ? 'إصدار القسائم وأوامر التشغيل الحية (A4 Studio)' : 'Vouchers & Field Dispatch Studio'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E4730] max-w-2xl leading-relaxed">
              {isAr
                ? 'أنشئ وعدّل قسائم الفنادق والبواخر وأوامر حركة السائقين والمرشدين فوراً مع معاينة حية لوثيقة الـ A4 الرسمية، الباركود، الختم الإلكتروني، والإرسال المباشر عبر واتساب.'
                : 'Issue, customize, and preview official A4 hotel vouchers, Nile cruise allocations, and driver/guide dispatch orders in real time with digital verification seals and instant WhatsApp dispatch.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleStartNewVoucher('Hotel')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#B8860B] hover:bg-[#9A6F05] text-white transition flex items-center gap-2 cursor-pointer shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? '+ إصدار قسيمة / أمر تشغيل جديد' : '+ Issue New Voucher / Order'}</span>
            </button>

            <button
              type="button"
              onClick={() => batchPrintVouchers()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF6EE] text-[#44200F] border border-[#D8CEB8] transition flex items-center gap-2 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-[#8C6239]" />
              <span>{isAr ? 'طباعة الحزمة المجمعة A4' : 'Batch Print Pack A4'}</span>
            </button>

            {trips.length > 0 && (
              <button
                type="button"
                onClick={() => launchDispatchForTrip(activeVoucher?.tripId || trips[0].id)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF6EE] text-[#44200F] border border-[#D8CEB8] transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isAr ? 'غرفة عمليات الفوج' : 'Trip Dispatch Console'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Card Light KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#E5DEC9]">
          <div className="bg-white rounded-2xl p-3.5 border border-[#E5DEC9] shadow-2xs">
            <div className="text-[11px] text-[#795037] font-semibold">
              {isAr ? 'إجمالي القسائم وأوامر الشغل' : 'Total Vouchers & Orders'}
            </div>
            <div className="text-2xl font-black text-[#44200F] font-mono tabular-nums mt-0.5">{stats.total}</div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-emerald-200/80 shadow-2xs">
            <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'مؤكدة ومختومة إلكترونياً' : 'Confirmed & Sealed'}</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-0.5">{stats.confirmed}</div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-[#E5DEC9] shadow-2xs">
            <div className="text-[11px] text-[#8C6239] font-semibold flex items-center gap-1.5">
              <Hotel className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>{isAr ? 'قسائم الفنادق والبواخر' : 'Hotel & Cruise Vouchers'}</span>
            </div>
            <div className="text-2xl font-black text-[#B8860B] font-mono tabular-nums mt-0.5">{stats.hotelsAndCruises}</div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-[#E5DEC9] shadow-2xs">
            <div className="text-[11px] text-sky-900 font-semibold flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-sky-700" />
              <span>{isAr ? 'أوامر حركة النقل والمرشدين' : 'Transport & Guide Orders'}</span>
            </div>
            <div className="text-2xl font-black text-sky-800 font-mono tabular-nums mt-0.5">{stats.fleetAndGuides}</div>
          </div>
        </div>
      </div>

      {/* Category Segmented Bar + Search & Filters */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Category Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
            {[
              { id: 'All', labelAr: 'الكل', labelEn: 'All Documents' },
              { id: 'Hotel', labelAr: 'قسائم الفنادق', labelEn: 'Hotel Vouchers' },
              { id: 'Cruise', labelAr: 'البواخر النيلية', labelEn: 'Nile Cruises' },
              { id: 'Transfer', labelAr: 'أوامر حركة النقل', labelEn: 'Fleet & Transfers' },
              { id: 'Guide', labelAr: 'تكليف المرشدين', labelEn: 'Tour Guides' },
              { id: 'Excursion', labelAr: 'المزارات والأنشطة', labelEn: 'Excursions & VIP' },
            ].map(tab => {
              const active = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#44200F] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                  }`}
                >
                  {isAr ? tab.labelAr : tab.labelEn}
                </button>
              );
            })}
          </div>

          {/* Quick Create Presets + View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">
              {isAr ? 'إنشاء سريع:' : 'Quick Issue:'}
            </span>
            <button
              type="button"
              onClick={() => handleStartNewVoucher('Hotel')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {isAr ? '+ قسيمة فندق' : '+ Hotel Voucher'}
            </button>
            <button
              type="button"
              onClick={() => handleStartNewVoucher('Transfer')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {isAr ? '+ أمر شغل سائق' : '+ Driver Order'}
            </button>
            <button
              type="button"
              onClick={() => handleStartNewVoucher('Guide')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              {isAr ? '+ تكليف مرشد' : '+ Guide Brief'}
            </button>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl ms-auto xl:ms-2">
              <button
                type="button"
                onClick={() => setLayoutMode('split')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  layoutMode === 'split' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{isAr ? 'استوديو مزدوج + A4' : 'Split Studio'}</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                  layoutMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'شبكة البطاقات' : 'Cards Grid'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Dropdown Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث برقم القسيمة، اسم الفندق أو المورد، رقم التأكيد، اسم الفوج، السائق، أو المدينة...'
                  : 'Search voucher code, supplier, confirmation no, guest name, driver, or city...'
              }
              className="w-full ps-10 pe-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tripFilter}
              onChange={e => setTripFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none max-w-[220px]"
            >
              <option value="All">{isAr ? 'جميع الأفواج والرحلات' : 'All Tour Groups'}</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>
                  {t.fileNumber} — {t.travelerName.slice(0, 22)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
            >
              <option value="All">{isAr ? 'جميع حالات الاعتماد' : 'All Statuses'}</option>
              <option value="Confirmed">{isAr ? 'مؤكد (Confirmed)' : 'Confirmed'}</option>
              <option value="Reconfirmed">{isAr ? 'إعادة تأكيد 48 ساعة (Reconfirmed)' : 'Reconfirmed'}</option>
              <option value="Requested">{isAr ? 'تم الإرسال للمورد (Requested)' : 'Requested'}</option>
              <option value="To request">{isAr ? 'مسودة قيد الطلب (To request)' : 'To request'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Workspace: Split Studio vs. Full Grid */}
      <div className={layoutMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-6'}>
        {/* Left/Start Pane: Interactive Voucher & Dispatch List */}
        <div
          className={
            layoutMode === 'split'
              ? 'lg:col-span-5 space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pe-1'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          }
        >
          {filteredVouchers.map(v => {
            const isSelected = activeVoucher?.id === v.id && studioMode !== 'create';
            const isConfirmed = v.status === 'Confirmed' || v.status === 'Reconfirmed';

            return (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedVoucherId(v.id);
                  if (studioMode === 'create') setStudioMode('preview');
                  if (layoutMode === 'grid') setLayoutMode('split');
                }}
                className={`rounded-2xl border transition cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'bg-[#FFFDF9] border-[#B8860B] ring-2 ring-[#B8860B]/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  {/* Card Top Bar */}
                  <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getCategoryIcon(v.supplierType)}
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-black text-[#44200F] tabular-nums truncate">
                          {v.voucherNo}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                          <span className="font-mono tabular-nums">{v.fileNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>{v.city}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {isAr ? `يوم ${v.dayNumber}` : `Day ${v.dayNumber}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConfirmed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span
                        className={`text-[11px] font-bold ${
                          isConfirmed ? 'text-emerald-800' : 'text-amber-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        {v.serviceName}
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-700">{v.supplierName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-sky-800 font-bold">
                          {v.confirmationNo ? `#${v.confirmationNo}` : isAr ? 'بدون رقم تأكيد' : 'No Conf #'}
                        </span>
                      </div>
                    </div>

                    {/* Key Operational Metadata Strip */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">{isAr ? 'الفوج / الضيف:' : 'Guest / Group:'}</span>
                        <span className="font-bold text-slate-800 truncate max-w-[180px]">
                          {v.travelerName} ({v.paxCount} {isAr ? 'أفراد' : 'Pax'})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">{isAr ? 'التاريخ والموعد:' : 'Date & Time:'}</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-800">
                          {v.serviceDate} · {v.pickupTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500">{isAr ? 'التسكين / المشمولات:' : 'Allocation:'}</span>
                        <span className="font-semibold text-[#6E4730] truncate max-w-[190px]">
                          {v.roomType} ({v.boardBasis.split('-')[0].trim()})
                        </span>
                      </div>
                    </div>

                    {/* 1-Click Status Stepper */}
                    <div
                      className="flex items-center justify-between gap-1 pt-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="text-[10px] font-semibold text-slate-400">
                        {isAr ? 'اعتماد فوري:' : 'Quick Status:'}
                      </span>
                      <div className="flex items-center gap-1">
                        {(['Requested', 'Confirmed', 'Reconfirmed'] as ServiceStatus[]).map(st => {
                          const active = v.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleQuickStatusChange(v, st)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                active
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {st === 'Requested'
                                ? isAr
                                  ? 'تم الطلب'
                                  : 'Requested'
                                : st === 'Confirmed'
                                ? isAr
                                  ? 'مؤكد'
                                  : 'Confirmed'
                                : isAr
                                ? 'مؤكد 48س'
                                : 'Reconfirmed'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Quick Actions Footer */}
                <div
                  className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVoucherId(v.id);
                      setStudioMode('preview');
                      setLayoutMode('split');
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {isAr ? 'معاينة A4' : 'Preview A4'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoucherId(v.id);
                        setDraftForm(v);
                        setStudioMode('edit');
                        setLayoutMode('split');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-[#44200F] border border-amber-200 flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isAr ? 'تعديل' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppText(v)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedId === v.id ? <Check className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      <span>{isAr ? 'واتساب' : 'WA'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => printOfficialVoucher(v)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Printer className="w-3 h-3" />
                      <span>{isAr ? 'طباعة' : 'Print'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredVouchers.length === 0 && (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-3 col-span-full">
              <Receipt className="w-9 h-9 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                {isAr ? 'لا توجد قسائم مطابقة للبحث الحالي' : 'No vouchers match the current filter'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isAr
                  ? 'يمكنك إعادة ضبط الفلاتر أو إصدار قسيمة فندقية أو أمر تشغيل سائق جديد فوراً.'
                  : 'Reset filters or issue a new official hotel voucher or driver dispatch order immediately.'}
              </p>
              <button
                type="button"
                onClick={() => handleStartNewVoucher('Hotel')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#B8860B] text-white hover:bg-[#9A6F05] transition cursor-pointer"
              >
                {isAr ? '+ إصدار قسيمة جديدة الآن' : '+ Issue New Voucher Now'}
              </button>
            </div>
          )}
        </div>

        {/* Right/End Pane: Live Official A4 Document Studio & Instant Builder */}
        {layoutMode === 'split' && previewVoucher && (
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-4">
            {/* Studio Control Bar */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStudioMode('preview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    studioMode === 'preview'
                      ? 'bg-[#44200F] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isAr ? 'معاينة الوثيقة A4' : 'Live A4 Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeVoucher && studioMode === 'preview') setDraftForm(activeVoucher);
                    setStudioMode('edit');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    studioMode === 'edit'
                      ? 'bg-[#B8860B] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحرير وتخصيص القسيمة' : 'Customize & Crew'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartNewVoucher('Hotel')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                    studioMode === 'create'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'منشئ قسيمة جديدة' : 'New Voucher Builder'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppText(previewVoucher)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                >
                  {copiedId === previewVoucher.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  <span>{isAr ? 'نسخ وإرسال واتساب' : 'WhatsApp Dispatch'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const matchedTrip = trips.find(t => t.id === previewVoucher.tripId) || trips[0];
                    if (matchedTrip) {
                      const matchedSvc =
                        matchedTrip.services.find(s => s.id === previewVoucher.serviceId) ||
                        matchedTrip.services[0];
                      if (matchedSvc) {
                        setQrModalTrip(matchedTrip);
                        setQrModalService(matchedSvc);
                      }
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-[#44200F] border border-amber-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{isAr ? 'رمز QR' : 'QR Seal'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => printOfficialVoucher(previewVoucher)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة A4 رسمية' : 'Print Official A4'}</span>
                </button>
              </div>
            </div>

            {/* Instant Voucher & Dispatch Builder / Live Editor Drawer */}
            {(studioMode === 'edit' || studioMode === 'create') && (
              <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#D8CEB8] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#44200F]">
                      {studioMode === 'create'
                        ? isAr
                          ? 'إصدار قسيمة أو أمر تشغيل جديد (تحديث حي في الوثيقة بالأسفل)'
                          : 'Issue New Official Voucher / Dispatch Order (Live A4 Preview Below)'
                        : isAr
                        ? `تحرير بيانات القسيمة وأمر التشغيل (${draftForm.voucherNo})`
                        : `Edit Voucher & Crew Assignment (${draftForm.voucherNo})`}
                    </h3>
                    <p className="text-[11px] text-[#795037]">
                      {isAr
                        ? 'أي تعديل تكتبه هنا يظهر فوراً في وثيقة الـ A4 الرسمية بالأسفل قبل الاعتماد والطباعة'
                        : 'Every change updates the official A4 document sheet below in real time'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStudioMode('preview')}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Preset Document Type Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { type: 'Hotel', labelAr: 'قسيمة فندق', labelEn: 'Hotel Voucher' },
                    { type: 'Cruise', labelAr: 'باخرة نيلية', labelEn: 'Nile Cruise' },
                    { type: 'Transfer', labelAr: 'أمر شغل نقل', labelEn: 'Fleet Order' },
                    { type: 'Guide', labelAr: 'تكليف مرشد', labelEn: 'Guide Brief' },
                    { type: 'Excursion', labelAr: 'قسيمة مزارات', labelEn: 'Excursion' },
                  ].map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setDraftForm({ ...draftForm, supplierType: item.type })}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        draftForm.supplierType.toLowerCase() === item.type.toLowerCase()
                          ? 'bg-[#44200F] text-white border-[#44200F]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isAr ? item.labelAr : item.labelEn}
                    </button>
                  ))}
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'ملف الفوج / الرحلة' : 'Tour Group File'}
                    </label>
                    <select
                      value={draftForm.tripId}
                      onChange={e => {
                        const found = trips.find(t => t.id === e.target.value);
                        if (found) {
                          setDraftForm({
                            ...draftForm,
                            tripId: found.id,
                            fileNumber: found.fileNumber,
                            travelerName: found.travelerName,
                            paxCount: found.passengers?.length || 4,
                          });
                        } else {
                          setDraftForm({ ...draftForm, tripId: 'new-trip' });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    >
                      {trips.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.fileNumber} — {t.travelerName.slice(0, 20)}
                        </option>
                      ))}
                      <option value="new-trip">{isAr ? '+ إنشاء ملف فوج جديد تلقائياً' : '+ Create New Group File'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'اسم الفوج / الضيف الرئيسي' : 'Lead Guest / Group Name'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.travelerName}
                      onChange={e => setDraftForm({ ...draftForm, travelerName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {isAr ? 'عدد الأفراد (Pax)' : 'Pax Count'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={draftForm.paxCount}
                        onChange={e => setDraftForm({ ...draftForm, paxCount: Number(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono tabular-nums focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {isAr ? 'الليالي / الأيام' : 'Nights / Days'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={draftForm.nightsCount}
                        onChange={e => setDraftForm({ ...draftForm, nightsCount: Number(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono tabular-nums focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'اسم الخدمة / الفندق / برنامج التحرك' : 'Designated Service / Hotel Title'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.serviceName}
                      onChange={e => setDraftForm({ ...draftForm, serviceName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'اسم المورد الرسمي' : 'Official Supplier Name'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.supplierName}
                      onChange={e => setDraftForm({ ...draftForm, supplierName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'رقم تأكيد المورد (Confirmation #)' : 'Supplier Confirmation Code'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.confirmationNo}
                      onChange={e => setDraftForm({ ...draftForm, confirmationNo: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono tabular-nums focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'المدينة وتاريخ التنفيذ' : 'City & Service Date'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={draftForm.city}
                        onChange={e => setDraftForm({ ...draftForm, city: e.target.value })}
                        placeholder="Cairo"
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                      <input
                        type="date"
                        value={draftForm.serviceDate}
                        onChange={e => setDraftForm({ ...draftForm, serviceDate: e.target.value })}
                        className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl font-mono tabular-nums focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'حالة الاعتماد والختم' : 'Voucher Status'}
                    </label>
                    <select
                      value={draftForm.status}
                      onChange={e => setDraftForm({ ...draftForm, status: e.target.value as ServiceStatus })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="Confirmed">Confirmed (مؤكد ومختوم)</option>
                      <option value="Reconfirmed">Reconfirmed (إعادة تأكيد نهائي)</option>
                      <option value="Requested">Requested (تم الإرسال للمورد)</option>
                      <option value="To request">To request (مسودة قيد الطلب)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'توزيع الغرف / نوع المركبة' : 'Room Allocation / Vehicle Unit'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.roomType}
                      onChange={e => setDraftForm({ ...draftForm, roomType: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'نظام الوجبات / المشمولات' : 'Board Basis / Inclusions'}
                    </label>
                    <select
                      value={draftForm.boardBasis}
                      onChange={e => setDraftForm({ ...draftForm, boardBasis: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="BB - Bed & Buffet Breakfast">BB - Bed & Buffet Breakfast</option>
                      <option value="HB - Half Board (Breakfast & Dinner)">HB - Half Board (B+D)</option>
                      <option value="FB - Full Board + Sightseeing">FB - Full Board (B+L+D)</option>
                      <option value="AI - Soft All-Inclusive">AI - All Inclusive</option>
                      <option value="VIP Refreshments & Entrance Fees Included">VIP Refreshments & Entry Included</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'طريقة التسوية المالية والفوترة' : 'Billing & Settlement Terms'}
                    </label>
                    <select
                      value={draftForm.billingTerms}
                      onChange={e => setDraftForm({ ...draftForm, billingTerms: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    >
                      <option value="Direct Corporate Account (Credit)">حساب الشركة الآجل (Corporate Credit)</option>
                      <option value="Prepaid via Bank Transfer">مدفوع مسبقاً تحويل بنكي (Prepaid)</option>
                      <option value="Cash Settlement on Site">نقداً عند الوصول / مع المندوب (Cash on Site)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'ساعة التحرك / الدخول' : 'Pickup / Check-In Time'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.pickupTime}
                      onChange={e => setDraftForm({ ...draftForm, pickupTime: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'نقطة التجمع / الاستلام' : 'Pickup / Origin Location'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.pickupLocation}
                      onChange={e => setDraftForm({ ...draftForm, pickupLocation: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'وجهة الوصول' : 'Dropoff / Destination'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.dropoffLocation}
                      onChange={e => setDraftForm({ ...draftForm, dropoffLocation: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'اسم السائق ورقم اللوحة' : 'Assigned Driver & Plate'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={draftForm.driverName}
                        onChange={e => setDraftForm({ ...draftForm, driverName: e.target.value })}
                        placeholder="Driver Name"
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                      <input
                        type="text"
                        value={draftForm.vehiclePlate}
                        onChange={e => setDraftForm({ ...draftForm, vehiclePlate: e.target.value })}
                        placeholder="Plate No"
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'هاتف السائق' : 'Driver Phone'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.driverPhone}
                      onChange={e => setDraftForm({ ...draftForm, driverPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'المرشد السياحي المرافق' : 'Assigned Tour Guide'}
                    </label>
                    <input
                      type="text"
                      value={draftForm.guideName}
                      onChange={e => setDraftForm({ ...draftForm, guideName: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="font-bold text-slate-700 block mb-1">
                      {isAr ? 'ملاحظات خاصة وتعليمات الفندق / التشغيل' : 'Special Operational Instructions & VIP Notes'}
                    </label>
                    <textarea
                      rows={2}
                      value={draftForm.notes}
                      onChange={e => setDraftForm({ ...draftForm, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DEC9]">
                  <button
                    type="button"
                    onClick={() => setStudioMode('preview')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white transition cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraftVoucher}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#44200F] hover:bg-[#2E1509] text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {studioMode === 'create'
                        ? isAr
                          ? 'حفظ وإصدار القسيمة الرسمية'
                          : 'Save & Issue Official Voucher'
                        : isAr
                        ? 'حفظ التعديلات في القسيمة'
                        : 'Save Voucher Changes'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE OFFICIAL A4 DOCUMENT SHEET PREVIEW */}
            <div className="bg-slate-200/70 p-3 sm:p-5 rounded-3xl border border-slate-300/80 shadow-inner">
              <div className="bg-white rounded-2xl border border-slate-300 shadow-lg p-6 sm:p-8 space-y-5 text-slate-900 relative overflow-hidden">
                {/* Official Letterhead Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#B8860B]" />
                      <h2 className="text-lg font-black tracking-tight text-slate-900">
                        {workspace.name}
                      </h2>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {isAr
                        ? 'ترخيص وزارة السياحة المصرية رقم #2049 فئة (أ) • عضو الاتحاد المصري للغرف السياحية'
                        : 'Egyptian Ministry of Tourism License #2049-Cat A • Accredited Destination Management'}
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono tabular-nums">
                      {isAr ? 'مكتب العمليات والطوارئ 24/7:' : '24/7 Operations Hotline:'}{' '}
                      <b>{workspace.contactPhone || '+20 100 249 1000'}</b>
                    </p>
                  </div>

                  <div className="sm:text-end space-y-1 shrink-0">
                    <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-[10px] font-black tracking-wider uppercase">
                      OFFICIAL SERVICE VOUCHER
                    </div>
                    <div className="text-sm font-mono font-black text-[#B8860B] tabular-nums">
                      {previewVoucher.voucherNo}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {isAr ? 'ملف رقم:' : 'File Ref:'} <b>{previewVoucher.fileNumber}</b>
                    </div>
                  </div>
                </div>

                {/* Document Title & Barcode Verification Strip */}
                <div className="text-center space-y-2 py-1">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {isAr
                      ? getDocumentHeaderTitle(previewVoucher.supplierType).ar
                      : getDocumentHeaderTitle(previewVoucher.supplierType).en}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr
                      ? 'برجاء تقديم الخدمات الموضحة أدناه لضيوفنا الكرام واعتماد التسوية المالية وفق شروط التعاقد الموضحة'
                      : 'Please provide the designated services detailed below to our guests and settle according to the stated billing terms'}
                  </p>
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs font-black tracking-[0.25em] text-slate-800 tabular-nums">
                    ||| {previewVoucher.voucherNo} |||
                  </div>
                </div>

                {/* 2-Column Particulars Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supplier Particulars */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
                    <div className="font-black text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                      <span>{isAr ? 'بيانات المورد ومقدم الخدمة' : 'SUPPLIER PARTICULARS'}</span>
                      <span className="text-[11px] font-mono text-slate-500">{previewVoucher.supplierType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dotted border-slate-200 gap-2">
                      <span className="text-slate-500">{isAr ? 'اسم المورد / الفندق:' : 'Supplier Name:'}</span>
                      <span className="font-bold text-slate-900 text-end">{previewVoucher.supplierName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dotted border-slate-200 gap-2">
                      <span className="text-slate-500">{isAr ? 'المدينة:' : 'Destination City:'}</span>
                      <span className="font-bold text-slate-900">{previewVoucher.city}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dotted border-slate-200 gap-2">
                      <span className="text-slate-500">{isAr ? 'رقم تأكيد الحجز:' : 'Confirmation Code:'}</span>
                      <span className="font-mono font-black text-sky-700 tabular-nums">
                        {previewVoucher.confirmationNo || (isAr ? 'بانتظار التأكيد' : 'PENDING')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dotted border-slate-200 gap-2">
                      <span className="text-slate-500">{isAr ? 'التاريخ والموعد:' : 'Date & Schedule:'}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {previewVoucher.serviceDate} ({previewVoucher.pickupTime})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 gap-2">
                      <span className="text-slate-500">{isAr ? 'هاتف المورد:' : 'Supplier Contact:'}</span>
                      <span className="font-mono text-slate-800 tabular-nums">{previewVoucher.supplierPhone}</span>
                    </div>
                  </div>

                  {/* Guest & Allocation Manifest */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
                    <div className="font-black text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                      <span>{isAr ? 'بيانات الفوج والتسكين' : 'GUEST & ALLOCATION MANIFEST'}</span>
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                        Day {previewVoucher.dayNumber}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dotted border-slate-200 gap-2">
                      <span className="text-slate-500">{isAr ? 'اسم الفوج / النزيل:' : 'Lead Guest / Group:'}</span>
                      <span className="font-bold text-slate-900 text-end">{previewVoucher.travelerName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dotted border-slate-200 gap-2">
                      <span className="text-slate-500">{isAr ? 'العدد والمدة:' : 'Pax & Duration:'}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {previewVoucher.paxCount} {isAr ? 'أفراد' : 'Pax'} · {previewVoucher.nightsCount}{' '}
                        {isAr ? 'ليالٍ / أيام' : 'Night(s)/Day(s)'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dotted border-slate-200 gap-2">
                      <span className="text-slate-500">{isAr ? 'الغرف / الوحدة:' : 'Room / Vehicle Unit:'}</span>
                      <span className="font-bold text-slate-900 text-end">{previewVoucher.roomType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dotted border-slate-200 gap-2">
                      <span className="text-slate-500">{isAr ? 'نظام الوجبات / المشمولات:' : 'Board / Inclusions:'}</span>
                      <span className="font-bold text-[#8C6239] text-end">{previewVoucher.boardBasis}</span>
                    </div>
                    <div className="flex justify-between py-1 gap-2">
                      <span className="text-slate-500">{isAr ? 'التسوية المالية:' : 'Billing Settlement:'}</span>
                      <span className="font-bold text-emerald-800 text-end">{previewVoucher.billingTerms}</span>
                    </div>
                  </div>
                </div>

                {/* Designated Service & Crew Assignment Box */}
                <div className="rounded-xl border-2 border-slate-900 p-4 space-y-3 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {isAr ? 'تفاصيل الخدمة المعتمدة ومسار التشغيل' : 'DESIGNATED SERVICE & LOGISTICS'}
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                        {previewVoucher.serviceName}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg tabular-nums shrink-0">
                      {previewVoucher.pickupLocation} &rarr; {previewVoucher.dropoffLocation}
                    </div>
                  </div>

                  {/* Assigned Driver & Guide Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500">
                        {isAr ? 'بيانات السائق والمركبة المعينة:' : 'Assigned Fleet Driver & Vehicle:'}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {previewVoucher.driverName} ·{' '}
                        <span className="font-mono tabular-nums text-slate-700">{previewVoucher.driverPhone}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                        {previewVoucher.vehicleType} — [{previewVoucher.vehiclePlate}]
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500">
                        {isAr ? 'المرشد السياحي ومندوب الاستقبال:' : 'Assigned Licensed Guide & Rep:'}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {previewVoucher.guideName} ·{' '}
                        <span className="font-mono tabular-nums text-slate-700">{previewVoucher.guidePhone}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {isAr ? 'اللغات:' : 'Languages:'} {previewVoucher.guideLanguage}
                      </div>
                    </div>
                  </div>

                  {previewVoucher.notes && (
                    <div className="text-xs bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-amber-950">
                      <b>{isAr ? 'ملاحظات وتعليمات التشغيل الخاصة:' : 'Special Operational Instructions:'}</b>{' '}
                      {previewVoucher.notes}
                    </div>
                  )}
                </div>

                {/* Official Electronic Stamp & Signatures Footer */}
                <div className="grid grid-cols-3 gap-4 pt-3 text-center text-xs">
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-800">
                      {isAr ? 'الختم الإلكتروني للشركة' : 'DMC Electronic Seal'}
                    </div>
                    <div
                      className={`mx-auto w-36 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 ${
                        previewVoucher.status === 'Confirmed' || previewVoucher.status === 'Reconfirmed'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800'
                          : 'border-amber-500 bg-amber-50/70 text-amber-800'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-black text-[10px]">
                        <Stamp className="w-3.5 h-3.5" />
                        <span>{workspace.name.slice(0, 18).toUpperCase()}</span>
                      </div>
                      <div className="text-[10px] font-black mt-0.5">
                        {previewVoucher.status === 'Confirmed' || previewVoucher.status === 'Reconfirmed'
                          ? isAr
                            ? 'معتمد ومؤكد إلكترونياً'
                            : 'VERIFIED & CONFIRMED'
                          : isAr
                          ? 'قيد تأكيد المورد'
                          : 'PENDING CONFIRMATION'}
                      </div>
                      <div className="text-[9px] font-mono tabular-nums opacity-80 mt-0.5">
                        {previewVoucher.voucherNo}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-slate-800">
                        {isAr ? 'توقيع الضيف / قائد الفوج' : 'Guest / Tour Leader Sign'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isAr ? 'إقرار باستلام الخدمة' : 'Service received satisfactorily'}
                      </div>
                    </div>
                    <div className="border-b border-slate-300 w-32 mx-auto pb-1 text-[11px] font-semibold text-slate-600">
                      {previewVoucher.travelerName.slice(0, 18)}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-800">
                      {isAr ? 'ختم وتوقيع المورد' : 'Supplier Stamp & Sign'}
                    </div>
                    <div className="mx-auto w-36 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                      {isAr ? 'ختم الفندق / المورد' : 'Official Supplier Stamp'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Scannable Voucher QR Code Modal */}
      {qrModalTrip && qrModalService && (
        <QRCodeModal
          isOpen={!!(qrModalTrip && qrModalService)}
          onClose={() => {
            setQrModalTrip(null);
            setQrModalService(null);
          }}
          trip={qrModalTrip}
          workspace={workspace}
          uiLang={uiLang}
          initialType="voucher"
          initialService={qrModalService}
        />
      )}
    </div>
  );
};
