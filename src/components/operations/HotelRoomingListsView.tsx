import { writeSafePrintDocument } from '../../lib/safePrint';
import React, { useState, useMemo, useCallback } from 'react';
import {
  Hotel,
  Search,
  Download,
  Printer,
  Copy,
  Check,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  BedDouble,
  Columns,
  LayoutGrid,
  ListChecks,
} from 'lucide-react';
import { TripFile, TripPassenger, TripService, loadTrips, saveTrips, newId } from '../../lib/tripStore';
import { Workspace, UILanguage } from '../../types';
import { GuidanceTrigger } from '../common/GuidanceTrigger';
import {
  MealPlanType,
  LiveHotelItem,
  RAW_EGYPT_HOTEL_INVENTORY,
} from '../../lib/liveHotelService';
import { HotelSearchEngine } from './HotelSearchEngine';

interface HotelRoomingListsViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onNavigateToTrips?: () => void;
}

export const HotelRoomingListsView: React.FC<HotelRoomingListsViewProps> = ({
  workspace,
  uiLang,
  onNavigateToTrips,
}) => {
  const isAr = uiLang === 'ar';
  const [trips, setTrips] = useState<TripFile[]>(() => loadTrips());
  const [selectedTripId, setSelectedTripId] = useState<string>(() => trips[0]?.id || 'all');

  // Workspace Layout Mode: 'split' (Side-by-Side Explorer + Rooming Builder), 'hotels', 'rooming'
  const [workspaceMode, setWorkspaceMode] = useState<'split' | 'hotels' | 'rooming'>('split');

  // Synced state from HotelSearchEngine
  const [availableHotelsCount, setAvailableHotelsCount] = useState<number>(RAW_EGYPT_HOTEL_INVENTORY.length);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [checkInDate, setCheckInDate] = useState<string>('2026-11-20');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-11-24');
  const [activeMealPlan, setActiveMealPlan] = useState<MealPlanType>('BB');

  // Assign Hotel to Trip & Rooming Modal State
  const [assignModalHotel, setAssignModalHotel] = useState<LiveHotelItem | null>(null);
  const [assignTargetTripId, setAssignTargetTripId] = useState<string>(() => trips[0]?.id || '');
  const [assignDayNumber, setAssignDayNumber] = useState<number>(1);
  const [assignDblCount, setAssignDblCount] = useState<number>(3);
  const [assignSglCount, setAssignSglCount] = useState<number>(1);
  const [assignSuiteCount, setAssignSuiteCount] = useState<number>(1);
  const [assignConfirmationNo, setAssignConfirmationNo] = useState<string>('');
  const [assignAutoDistributePax, setAssignAutoDistributePax] = useState<boolean>(true);
  const [assignmentToast, setAssignmentToast] = useState<string | null>(null);

  // Rooming List Builder State
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<{ tripId: string; passenger: TripPassenger } | null>(null);
  const [isAddPaxModalOpen, setIsAddPaxModalOpen] = useState(false);
  const [targetTripForAdd, setTargetTripForAdd] = useState<string>(trips[0]?.id || '');
  const [newPaxData, setNewPaxData] = useState({
    name: '',
    nationality: 'Spanish',
    type: 'Adult' as 'Adult' | 'Child' | 'Infant',
    room: 'Room 101 (DBL)',
    dietary: '',
    personalCode: '',
  });

  const handleHotelsLoaded = useCallback((loadedHotels: LiveHotelItem[], syncedAt: string) => {
    setAvailableHotelsCount(loadedHotels.length);
    setLastSyncedTime(syncedAt);
  }, []);

  // Sync check-in date when a specific trip is selected
  const handleSelectTripGroup = (tripId: string) => {
    setSelectedTripId(tripId);
    if (tripId !== 'all') {
      const found = trips.find((t) => t.id === tripId);
      if (found?.startDate) {
        setCheckInDate(found.startDate);
        try {
          const d = new Date(found.startDate);
          d.setDate(d.getDate() + Math.max(1, found.durationDays || 4));
          setCheckOutDate(d.toISOString().split('T')[0]);
        } catch {}
      }
    }
  };

  // Active selected trip or all
  const activeTrips = useMemo(() => {
    if (selectedTripId === 'all') return trips;
    return trips.filter((t) => t.id === selectedTripId);
  }, [trips, selectedTripId]);

  // Aggregate passengers across active trips
  const passengerEntries = useMemo(() => {
    const list: { trip: TripFile; passenger: TripPassenger }[] = [];
    activeTrips.forEach((t) => {
      (t.passengers || []).forEach((p) => {
        list.push({ trip: t, passenger: p });
      });
    });
    return list;
  }, [activeTrips]);

  // KPIs
  const stats = useMemo(() => {
    const totalPax = passengerEntries.length;
    const singles = passengerEntries.filter(
      (e) => e.passenger.room.toLowerCase().includes('sgl') || e.passenger.room.toLowerCase().includes('single')
    ).length;
    const doubles = passengerEntries.filter(
      (e) =>
        e.passenger.room.toLowerCase().includes('dbl') ||
        e.passenger.room.toLowerCase().includes('double') ||
        e.passenger.room.toLowerCase().includes('twin') ||
        (!e.passenger.room.toLowerCase().includes('sgl') && !e.passenger.room.toLowerCase().includes('suite'))
    ).length;
    const suites = passengerEntries.filter(
      (e) => e.passenger.room.toLowerCase().includes('suite') || e.passenger.room.toLowerCase().includes('sut')
    ).length;
    const specialNeeds = passengerEntries.filter(
      (e) => !!e.passenger.dietary && e.passenger.dietary !== 'Standard'
    ).length;
    return { totalPax, singles, doubles, suites, specialNeeds };
  }, [passengerEntries]);

  // Open Assign Hotel Modal from HotelSearchEngine
  const openAssignHotelModal = (
    hotel: LiveHotelItem,
    context: { checkIn: string; checkOut: string; mealPlan: MealPlanType }
  ) => {
    setCheckInDate(context.checkIn);
    setCheckOutDate(context.checkOut);
    setActiveMealPlan(context.mealPlan);

    const defaultTripId = selectedTripId !== 'all' ? selectedTripId : trips[0]?.id || '';
    const targetTrip = trips.find((t) => t.id === defaultTripId);
    const paxLen = targetTrip?.passengers?.length || 6;
    setAssignModalHotel(hotel);
    setAssignTargetTripId(defaultTripId);
    setAssignDayNumber(1);
    setAssignDblCount(Math.max(1, Math.floor(paxLen / 2)));
    setAssignSglCount(paxLen % 2);
    setAssignSuiteCount(0);
    const prefix = hotel.regionId.slice(0, 3).toUpperCase();
    setAssignConfirmationNo(`HTL-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
    setAssignAutoDistributePax(true);
  };

  // Confirm Assigning Hotel to Trip & Rooming List
  const handleConfirmAssignHotel = () => {
    if (!assignModalHotel || !assignTargetTripId) return;
    const targetTrip = trips.find((t) => t.id === assignTargetTripId);
    if (!targetTrip) return;

    const dblOpt = assignModalHotel.roomOptions?.find((r) => r.code === 'DBL');
    const sglOpt = assignModalHotel.roomOptions?.find((r) => r.code === 'SGL');
    const suiteOpt = assignModalHotel.roomOptions?.find((r) => r.code === 'SUITE');
    const nights = assignModalHotel.nights || 4;

    const totalCostUsd =
      assignDblCount * (dblOpt?.totalStayUsd || 0) +
      assignSglCount * (sglOpt?.totalStayUsd || 0) +
      assignSuiteCount * (suiteOpt?.totalStayUsd || 0);

    const roomSummaryParts: string[] = [];
    if (assignDblCount > 0) roomSummaryParts.push(`${assignDblCount}x DBL`);
    if (assignSglCount > 0) roomSummaryParts.push(`${assignSglCount}x SGL`);
    if (assignSuiteCount > 0) roomSummaryParts.push(`${assignSuiteCount}x Suite`);

    const newService: TripService = {
      id: newId(),
      dayNumber: assignDayNumber,
      serviceName: `${isAr ? assignModalHotel.nameAr : assignModalHotel.nameEn} (${roomSummaryParts.join(', ')} · ${
        assignModalHotel.mealPlan || activeMealPlan
      })`,
      supplierName: assignModalHotel.nameEn,
      supplierType: assignModalHotel.category === 'Nile Cruise' ? 'Cruise' : 'Hotel',
      city: assignModalHotel.regionId,
      status: 'Confirmed',
      confirmationNo: assignConfirmationNo.trim() || `CONF-${Date.now().toString().slice(-4)}`,
      note: `${nights} Nights (${checkInDate} → ${checkOutDate}) | Est. Total: $${totalCostUsd.toLocaleString()} | Direct: ${
        assignModalHotel.officialWebsite
      }`,
    };

    let updatedPassengers = [...(targetTrip.passengers || [])];
    if (assignAutoDistributePax && updatedPassengers.length > 0) {
      const roomLabels: string[] = [];
      let roomNum = 201;
      for (let i = 0; i < assignSuiteCount; i++) {
        roomLabels.push(`Suite ${roomNum} (VIP)`, `Suite ${roomNum} (VIP)`);
        roomNum++;
      }
      for (let i = 0; i < assignDblCount; i++) {
        roomLabels.push(`Room ${roomNum} (DBL)`, `Room ${roomNum} (DBL)`);
        roomNum++;
      }
      for (let i = 0; i < assignSglCount; i++) {
        roomLabels.push(`Room ${roomNum} (SGL)`);
        roomNum++;
      }
      updatedPassengers = updatedPassengers.map((p, idx) => ({
        ...p,
        room: roomLabels[idx] || p.room || `Room ${201 + Math.floor(idx / 2)} (DBL)`,
      }));
    }

    const updatedTrip: TripFile = {
      ...targetTrip,
      services: [newService, ...(targetTrip.services || [])],
      passengers: updatedPassengers,
      updatedAt: new Date().toISOString(),
    };

    const nextTrips = trips.map((t) => (t.id === targetTrip.id ? updatedTrip : t));
    setTrips(nextTrips);
    saveTrips(nextTrips);
    setSelectedTripId(targetTrip.id);
    setAssignModalHotel(null);

    setAssignmentToast(
      isAr
        ? `تم إسناد "${assignModalHotel.nameAr}" للفوج ${targetTrip.fileNumber} وتحديث كشف التسكين بنجاح`
        : `Assigned "${assignModalHotel.nameEn}" to ${targetTrip.fileNumber} & updated rooming list`
    );
    setTimeout(() => setAssignmentToast(null), 4500);
  };

  // Auto-number rooms for a trip
  const handleAutoNumberTripRooms = (trip: TripFile) => {
    const nextPassengers = (trip.passengers || []).map((p, idx) => {
      const isSingle = p.room.toLowerCase().includes('sgl') || p.room.toLowerCase().includes('single');
      const isSuite = p.room.toLowerCase().includes('suite');
      const roomNo = 101 + Math.floor(idx / 2);
      return {
        ...p,
        room: isSuite ? `Suite ${roomNo} (VIP)` : isSingle ? `Room ${101 + idx} (SGL)` : `Room ${roomNo} (DBL)`,
      };
    });
    const updatedTrip = { ...trip, passengers: nextPassengers, updatedAt: new Date().toISOString() };
    const nextTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
    setTrips(nextTrips);
    saveTrips(nextTrips);
    setAssignmentToast(
      isAr
        ? `تم ترقيم وتنظيم غرف الفوج ${trip.fileNumber} تلقائياً`
        : `Auto-organized room numbers for ${trip.fileNumber}`
    );
    setTimeout(() => setAssignmentToast(null), 3500);
  };

  // Export Rooming List CSV
  const exportRoomingCsv = (trip?: TripFile) => {
    const targetTrips = trip ? [trip] : activeTrips;
    const rows = [
      [
        'Trip File',
        'Group Name',
        'Room # / Cabin',
        'Guest Full Name',
        'Nationality',
        'Guest Type',
        'Dietary / Special Needs',
        'Personal Passcode',
      ],
    ];

    targetTrips.forEach((t) => {
      (t.passengers || []).forEach((p) => {
        rows.push([
          t.fileNumber,
          t.travelerName,
          p.room || 'Unassigned',
          p.name || 'Unnamed Guest',
          p.nationality || '',
          p.type || 'Adult',
          p.dietary || 'Standard',
          p.personalCode || '',
        ]);
      });
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rooming-List-${trip ? trip.fileNumber : 'All-Groups'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Rooming List formatted text
  const copyRoomingList = (trip?: TripFile) => {
    const targetTrips = trip ? [trip] : activeTrips;
    let text = `HOTEL ROOMING LIST - ${workspace.name}\n`;
    text += `========================================\n\n`;

    targetTrips.forEach((t) => {
      text += `Trip: ${t.fileNumber} | ${t.travelerName}\n`;
      text += `Dates: ${t.startDate || 'TBD'} (${t.durationDays} Days) | Total Pax: ${t.passengers?.length || 0}\n`;
      text += `----------------------------------------\n`;
      (t.passengers || []).forEach((p, idx) => {
        text += `${idx + 1}. [${p.room || 'Room'}] ${p.name || 'Guest'} (${p.nationality}) - ${
          p.dietary || 'Standard'
        }\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedId('rooming-all');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Print Official Rooming Manifest A4
  const printRoomingManifest = (trip?: TripFile) => {
    const targetTrips = trip ? [trip] : activeTrips;
    const w = window.open('', '_blank');
    if (!w) return;
    const title = `Official-Rooming-List-${trip ? trip.fileNumber : 'Master'}`;

    let tablesHtml = '';
    targetTrips.forEach((t) => {
      const paxRows = (t.passengers || [])
        .map(
          (p, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: bold; font-family: monospace; color: #44200F;">${p.room || 'Room 101'}</td>
          <td style="font-weight: bold;">${p.name || 'Guest'}</td>
          <td>${p.nationality || 'Not specified'}</td>
          <td>${p.type}</td>
          <td>${p.dietary || 'Standard'}</td>
          <td style="font-family: monospace; font-size: 11px;">${p.personalCode || '-'}</td>
        </tr>
      `
        )
        .join('');

      const hotelSvcs = t.services.filter(
        (s) =>
          s.supplierType.toLowerCase().includes('hotel') ||
          s.serviceName.toLowerCase().includes('hotel') ||
          s.serviceName.toLowerCase().includes('cruise') ||
          s.supplierType.toLowerCase().includes('cruise')
      );
      const hotelInfo = hotelSvcs
        .map((h) => `${h.city}: <b>${h.serviceName}</b> (Conf: ${h.confirmationNo || 'Pending'})`)
        .join(' &bull; ');

      tablesHtml += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <div style="background: #FAF7F2; padding: 10px 14px; border-radius: 6px; border: 1px solid #EDE0CC; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <b style="font-size: 14px; color: #44200F;">${t.travelerName}</b>
                <span style="font-family: monospace; color: #795037; margin-left: 8px;">[File: ${t.fileNumber}]</span>
              </div>
              <div><b>Arrival:</b> ${t.startDate || '2026-11-15'} &bull; <b>Pax:</b> ${t.passengers?.length || 0}</div>
            </div>
            ${
              hotelInfo
                ? `<div style="font-size: 11px; color: #44200F; margin-top: 4px;"><b>Accommodations:</b> ${hotelInfo}</div>`
                : ''
            }
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
            <thead>
              <tr style="background: #44200F; color: white;">
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 30px;">#</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 120px;">Room / Cabin</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1;">Guest Full Name (Passport)</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 90px;">Nationality</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 60px;">Type</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 130px;">Dietary / Requests</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 90px;">Guest Code</th>
              </tr>
            </thead>
            <tbody>
              ${paxRows}
            </tbody>
          </table>
        </div>
      `;
    });

    writeSafePrintDocument(
      w,
      `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}">
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
          .header { border-bottom: 2px solid #44200F; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 4px; color: #44200F; text-transform: uppercase; }
          .badge { display: inline-block; background: #44200F; color: #C4A177; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; }
          table th, table td { border: 1px solid #cbd5e1; padding: 6px 8px; }
          tr:nth-child(even) { background: #FAF8F5; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; }
          .stamp-box { width: 140px; height: 80px; border: 2px dashed #C4A177; border-radius: 6px; margin: 8px auto 0; display: flex; align-items: center; justify-content: center; color: #795037; font-size: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin:0; font-size: 16px; color: #44200F;">${workspace.name}</h2>
            <div style="font-size: 11px; color: #795037;">Inbound Group Reservations & Hotel Rooming Desk</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">OFFICIAL HOTEL ROOMING MANIFEST</div>
            <div style="font-size: 11px; margin-top: 4px; font-weight: bold;">كشف تسكين الفنادق والكبائن المعتمد</div>
            <div style="font-size: 11px; color: #64748b;">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="title">${
          isAr ? 'كشف تسكين الغرف وتوزيع كبائن البواخر' : 'OFFICIAL HOTEL & CRUISE CABIN ROOMING LIST'
        }</div>
        <div style="text-align: center; color: #64748b; font-size: 11px; margin-bottom: 20px;">
          ${
            isAr
              ? 'موجه إلى السادة مكاتب حجز واستقبال الفنادق والبواخر النيلية'
              : 'Addressed to Hotel Front Desk & Nile Cruise Reservations'
          }
        </div>

        ${tablesHtml}

        <div class="footer">
          <div>
            <div><b>${isAr ? 'مدير حجز الفنادق والتسكين' : 'Hotel Reservations Manager'}</b></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${workspace.name} Desk</div>
            <div class="stamp-box">Company Stamp</div>
          </div>
          <div>
            <div><b>${isAr ? 'مكتب استقبال الفندق / الباخرة' : 'Hotel Front Desk Reception'}</b></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Keys & Registration Confirmed</div>
            <div style="margin-top: 35px; border-bottom: 1px solid #94a3b8; width: 140px;"></div>
          </div>
        </div>

        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `
    );
    w.document.close();
  };

  // Handle saving edited passenger
  const handleSavePassenger = () => {
    if (!editingPassenger) return;
    const { tripId, passenger } = editingPassenger;
    const targetTrip = trips.find((t) => t.id === tripId);
    if (targetTrip) {
      const nextPassengers = targetTrip.passengers.map((p) => (p.id === passenger.id ? passenger : p));
      const updatedTrip = { ...targetTrip, passengers: nextPassengers, updatedAt: new Date().toISOString() };
      const nextTrips = trips.map((t) => (t.id === tripId ? updatedTrip : t));
      setTrips(nextTrips);
      saveTrips(nextTrips);
    }
    setIsEditModalOpen(false);
    setEditingPassenger(null);
  };

  // Handle deleting a passenger from rooming list
  const handleDeletePassenger = (tripId: string, passengerId: string) => {
    const targetTrip = trips.find((t) => t.id === tripId);
    if (!targetTrip) return;
    const nextPassengers = targetTrip.passengers.filter((p) => p.id !== passengerId);
    const updatedTrip = { ...targetTrip, passengers: nextPassengers, updatedAt: new Date().toISOString() };
    const nextTrips = trips.map((t) => (t.id === tripId ? updatedTrip : t));
    setTrips(nextTrips);
    saveTrips(nextTrips);
  };

  // Handle adding new passenger
  const handleAddNewPassenger = () => {
    const targetTrip = trips.find((t) => t.id === targetTripForAdd);
    if (!targetTrip) return;

    const newPassenger: TripPassenger = {
      id: newId(),
      name: newPaxData.name || 'New Guest',
      nationality: newPaxData.nationality,
      type: newPaxData.type,
      room: newPaxData.room,
      dietary: newPaxData.dietary || 'Standard',
      personalCode:
        newPaxData.personalCode ||
        `${targetTrip.fileNumber.slice(-4)}-${String(targetTrip.passengers.length + 1).padStart(2, '0')}`,
    };

    const nextPassengers = [...targetTrip.passengers, newPassenger];
    const updatedTrip = { ...targetTrip, passengers: nextPassengers, updatedAt: new Date().toISOString() };
    const nextTrips = trips.map((t) => (t.id === targetTripForAdd ? updatedTrip : t));
    setTrips(nextTrips);
    saveTrips(nextTrips);

    setIsAddPaxModalOpen(false);
    setNewPaxData({
      name: '',
      nationality: 'Spanish',
      type: 'Adult',
      room: 'Room 101 (DBL)',
      dietary: '',
      personalCode: '',
    });
  };

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Notification Banner */}
      {assignmentToast && (
        <div className="bg-emerald-950 text-emerald-100 border border-emerald-700/80 rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{assignmentToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAssignmentToast(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Executive Warm Luxury Hero Header */}
      <div className="bg-gradient-to-br from-[#44200F] via-[#592B15] to-[#311509] text-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#C4A177]/25 relative overflow-hidden">
        <GuidanceTrigger
          sectionKey="trips_workspace"
          uiLang={uiLang}
          variant="gold"
          pinned={true}
          size="sm"
          label={isAr ? 'دليل الفنادق والتسكين' : 'Hotels & Rooming Guide'}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 ltr:pr-14 rtl:pl-14">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-[#C4A177] font-semibold">
              <Hotel className="w-4 h-4 shrink-0" />
              <span>
                {isAr
                  ? 'محرك الفنادق والأسعار الحية · بناء كشوف التسكين والكبائن'
                  : 'Live Regional Hotel Pricing API · Interactive Rooming List Builder'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[11px] text-[#EDE0CC]">
                {isAr ? `آخر تحديث: ${lastSyncedTime}` : `Synced: ${lastSyncedTime}`}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {isAr
                ? 'مستكشف الفنادق المتاحة حياً ومنشئ قوائم التسكين'
                : 'Live Hotel Explorer & Interactive Rooming List Builder'}
            </h1>
            <p className="text-xs sm:text-sm text-[#EDE0CC]/90 leading-relaxed">
              {isAr
                ? 'واجهة مزدوجة تتيح استعراض الفنادق المتاحة وألبومات صورها وأسعارها الحالية وروابط الحجز المباشر في الجانب الأول، مع بناء وتوزيع كشوف تسكين الأفواج في الجانب المقابل.'
                : 'Split-view operations desk: explore live regional hotels, photo galleries, real-time rates, and direct booking links on the left while building and exporting group rooming manifests on the right.'}
            </p>
          </div>

          {/* Uniform h-9 Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => exportRoomingCsv()}
              className="h-9 px-3.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition inline-flex items-center justify-center gap-1.5 cursor-pointer border border-white/15 whitespace-nowrap shrink-0"
              title={isAr ? 'تصدير كشف التسكين CSV' : 'Export Rooming List CSV'}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>

            <button
              type="button"
              onClick={() => printRoomingManifest()}
              className="h-9 px-4 rounded-xl text-xs font-extrabold bg-[#C4A177] hover:bg-[#d4b48c] text-[#311509] transition inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              title={isAr ? 'طباعة كشف التسكين الرسمي A4' : 'Print A4 Rooming Manifest'}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'طباعة الكشف A4' : 'Print Manifest A4'}</span>
            </button>

            <button
              type="button"
              onClick={() => copyRoomingList()}
              className="h-9 px-3 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition inline-flex items-center justify-center gap-1.5 cursor-pointer border border-white/15 whitespace-nowrap shrink-0"
              title={isAr ? 'نسخ للواتساب والبريد' : 'Copy for WhatsApp'}
            >
              {copiedId === 'rooming-all' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{copiedId === 'rooming-all' ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
            </button>

            {onNavigateToTrips && (
              <button
                type="button"
                onClick={onNavigateToTrips}
                className="h-9 px-3 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/15 text-[#EDE0CC] hover:text-white transition inline-flex items-center justify-center gap-1.5 cursor-pointer border border-white/10 whitespace-nowrap shrink-0"
              >
                <span>{isAr ? 'الأفواج' : 'Trips'}</span>
                {isAr ? <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> : <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
              </button>
            )}
          </div>
        </div>

        {/* Equal-Height KPI Counters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/15 items-stretch">
          <div className="h-full bg-white/8 backdrop-blur-xs rounded-2xl p-3.5 border border-white/12 flex flex-col justify-between">
            <div className="text-xs text-[#EDE0CC] font-medium truncate">
              {isAr ? 'الفنادق المتاحة بالبحث' : 'Available Live Hotels'}
            </div>
            <div className="text-xl font-black text-[#C4A177] mt-1 font-mono tabular-nums">
              {availableHotelsCount}
            </div>
          </div>

          <div className="h-full bg-white/8 backdrop-blur-xs rounded-2xl p-3.5 border border-white/12 flex flex-col justify-between">
            <div className="text-xs text-[#EDE0CC] font-medium truncate">
              {isAr ? 'إجمالي النزلاء بالتسكين' : 'Total Manifest Guests'}
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono tabular-nums">{stats.totalPax}</div>
          </div>

          <div className="h-full bg-white/8 backdrop-blur-xs rounded-2xl p-3.5 border border-white/12 flex flex-col justify-between">
            <div className="text-xs text-[#EDE0CC] font-medium truncate">
              {isAr ? 'غرف مزدوجة (DBL)' : 'Double / Twin (DBL)'}
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono tabular-nums">{stats.doubles}</div>
          </div>

          <div className="h-full bg-white/8 backdrop-blur-xs rounded-2xl p-3.5 border border-white/12 flex flex-col justify-between">
            <div className="text-xs text-[#EDE0CC] font-medium truncate">
              {isAr ? 'غرف مفردة (SGL)' : 'Single Rooms (SGL)'}
            </div>
            <div className="text-xl font-black text-amber-300 mt-1 font-mono tabular-nums">{stats.singles}</div>
          </div>

          <div className="h-full bg-white/8 backdrop-blur-xs rounded-2xl p-3.5 border border-white/12 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="text-xs text-[#EDE0CC] font-medium truncate">
              {isAr ? 'أجنحة وكبائن VIP' : 'Suites & Nile Cabins'}
            </div>
            <div className="text-xl font-black text-emerald-300 mt-1 font-mono tabular-nums">{stats.suites}</div>
          </div>
        </div>
      </div>

      {/* Unified Toolbar: Active Trip Group Selector & Split-View Mode Switcher */}
      <div className="bg-white rounded-2xl p-4 border border-[#EDE0CC] shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-[#44200F] whitespace-nowrap shrink-0">
              {isAr ? 'الفوج السياحي النشط:' : 'Active Tour Group:'}
            </span>
            <select
              value={selectedTripId}
              onChange={(e) => handleSelectTripGroup(e.target.value)}
              className="h-9 px-3 text-xs font-bold bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-[#44200F] focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
            >
              <option value="all">
                {isAr ? 'جميع الأفواج المؤكدة (Master View)' : 'All Confirmed Groups (Master)'}
              </option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fileNumber} — {t.travelerName} ({t.passengers?.length || 0} {isAr ? 'نزيل' : 'pax'})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsAddPaxModalOpen(true)}
            className="h-9 px-3.5 rounded-xl text-xs font-bold bg-[#44200F] hover:bg-[#311509] text-[#FAF8F5] inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
            <span>{isAr ? 'إضافة نزيل للتسكين' : 'Add Guest to Rooming'}</span>
          </button>
        </div>

        {/* Workspace View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#EDE0CC] self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setWorkspaceMode('split')}
            className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition cursor-pointer ${
              workspaceMode === 'split'
                ? 'bg-[#44200F] text-white shadow-2xs'
                : 'text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <Columns className="w-3.5 h-3.5 shrink-0" />
            <span>{isAr ? 'تقسيم الشاشة (فنادق + تسكين)' : 'Split-View Workspace'}</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('hotels')}
            className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition cursor-pointer ${
              workspaceMode === 'hotels'
                ? 'bg-[#44200F] text-white shadow-2xs'
                : 'text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>{isAr ? 'مستكشف الفنادق فقط' : 'Hotel Explorer Only'}</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('rooming')}
            className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition cursor-pointer ${
              workspaceMode === 'rooming'
                ? 'bg-[#44200F] text-white shadow-2xs'
                : 'text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5 shrink-0" />
            <span>{isAr ? 'منشئ التسكين فقط' : 'Rooming Builder Only'}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TRUE SPLIT-VIEW WORKSPACE: LEFT = HOTEL EXPLORER, RIGHT = ROOMING     */}
      {/* ===================================================================== */}
      <div
        className={
          workspaceMode === 'split'
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'
            : 'space-y-6'
        }
      >
        {/* LEFT PANE: HOTEL SEARCH ENGINE, GOOGLE MAPS SIDEBAR & IMAGE CAROUSEL EXPLORER */}
        {(workspaceMode === 'split' || workspaceMode === 'hotels') && (
          <div className={workspaceMode === 'split' ? 'lg:col-span-7 xl:col-span-7' : 'w-full'}>
            <HotelSearchEngine
              uiLang={uiLang}
              initialCheckIn={checkInDate}
              initialCheckOut={checkOutDate}
              onAssignHotelToRooming={openAssignHotelModal}
              onHotelsLoaded={handleHotelsLoaded}
              compactColumns={workspaceMode === 'split'}
            />
          </div>
        )}

        {/* RIGHT PANE: INTERACTIVE ROOMING LIST BUILDER */}
        {(workspaceMode === 'split' || workspaceMode === 'rooming') && (
          <div
            className={
              workspaceMode === 'split'
                ? 'lg:col-span-5 xl:col-span-5 space-y-5 lg:sticky lg:top-20'
                : 'w-full space-y-5'
            }
          >
            {/* Rooming Builder Header & Search Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EDE0CC] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDE0CC]/80">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#795037]">
                    <BedDouble className="w-4 h-4 text-[#C4A177] shrink-0" />
                    <span>
                      {isAr
                        ? 'منشئ كشوف التسكين التفاعلي · توزيع الغرف والكبائن'
                        : 'Interactive Rooming List Builder · Cabin & Room Allocation'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#44200F] mt-0.5">
                    {isAr
                      ? 'توزيع غرف النزلاء والفنادق المسندة للأفواج'
                      : 'Group Rooming Manifests & Assigned Accommodations'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddPaxModalOpen(true)}
                  className="h-9 px-3 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#EDE0CC]/60 text-[#44200F] border border-[#EDE0CC] inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                  <span>{isAr ? '+ إضافة نزيل' : '+ Add Guest'}</span>
                </button>
              </div>

              {/* Search & Room Type Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl inline-flex items-center gap-2 flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث باسم النزيل، رقم الغرفة، الجنسية...' : 'Filter guest, room #, nationality...'}
                    className="w-full bg-transparent text-xs text-[#44200F] placeholder:text-[#795037]/60 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#795037] hover:text-[#44200F] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="h-9 px-3 text-xs font-bold bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-[#44200F] focus:outline-none cursor-pointer"
                >
                  <option value="All">{isAr ? 'جميع الغرف' : 'All Rooms'}</option>
                  <option value="Suite">{isAr ? 'أجنحة (Suite)' : 'Suites'}</option>
                  <option value="DBL">{isAr ? 'مزدوجة (DBL)' : 'Double (DBL)'}</option>
                  <option value="SGL">{isAr ? 'مفردة (SGL)' : 'Single (SGL)'}</option>
                </select>
              </div>
            </div>

            {/* Active Trip Rooming Cards */}
            <div className="space-y-5">
              {activeTrips.map((trip) => {
                const tripPassengers = (trip.passengers || []).filter((p) => {
                  if (roomFilter !== 'All' && !p.room.toLowerCase().includes(roomFilter.toLowerCase())) return false;
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.nationality.toLowerCase().includes(q) ||
                      p.room.toLowerCase().includes(q) ||
                      (p.dietary || '').toLowerCase().includes(q) ||
                      (p.personalCode || '').toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                const hotelServices = (trip.services || []).filter(
                  (s) =>
                    s.supplierType.toLowerCase().includes('hotel') ||
                    s.serviceName.toLowerCase().includes('hotel') ||
                    s.serviceName.toLowerCase().includes('cruise') ||
                    s.supplierType.toLowerCase().includes('cruise') ||
                    s.serviceName.toLowerCase().includes('resort')
                );

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-3xl border border-[#EDE0CC] shadow-2xs overflow-hidden"
                  >
                    {/* Trip Group Header */}
                    <div className="p-4 sm:p-5 bg-[#FAF7F2] border-b border-[#EDE0CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#44200F] text-[#C4A177] flex items-center justify-center shrink-0 shadow-2xs">
                          <Hotel className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono tabular-nums font-bold text-xs bg-[#44200F] text-[#FAF8F5] px-2 py-0.5 rounded-lg">
                              {trip.fileNumber}
                            </span>
                            <h3 className="font-extrabold text-sm text-[#44200F]">{trip.travelerName}</h3>
                          </div>
                          <div className="text-[11px] text-[#795037] mt-0.5 flex flex-wrap items-center gap-1.5 font-mono tabular-nums">
                            <span>
                              {isAr ? 'الوصول:' : 'Arrival:'} {trip.startDate || '2026-11-15'}
                            </span>
                            <span>·</span>
                            <span>
                              {trip.durationDays} {isAr ? 'أيام' : 'Days'}
                            </span>
                            <span>·</span>
                            <span>
                              {trip.passengers?.length || 0} {isAr ? 'نزلاء' : 'Guests'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Equal-Height h-9 Group Actions */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAutoNumberTripRooms(trip)}
                          className="h-9 px-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#EDE0CC]/50 text-[#44200F] border border-[#EDE0CC] inline-flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                          title={isAr ? 'ترقيم وتوزيع غرف الفوج تلقائياً' : 'Auto-number rooms'}
                        >
                          <BedDouble className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                          <span>{isAr ? 'ترقيم تلقائي' : 'Auto-Room'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => printRoomingManifest(trip)}
                          className="h-9 px-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#EDE0CC]/50 text-[#44200F] border border-[#EDE0CC] inline-flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                          <span>{isAr ? 'طباعة' : 'Print'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => exportRoomingCsv(trip)}
                          className="h-9 px-2.5 rounded-xl text-xs font-bold bg-white hover:bg-[#EDE0CC]/50 text-[#44200F] border border-[#EDE0CC] inline-flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Assigned Hotels & Direct Booking Links Strip */}
                    <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#EDE0CC] flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-extrabold text-[#44200F] shrink-0">
                        {isAr ? 'الفنادق المسندة:' : 'Assigned Hotels:'}
                      </span>
                      {hotelServices.length === 0 ? (
                        <span className="text-[#795037]">
                          {isAr
                            ? 'اختر فندقاً من المستكشف المجاور واضغط "إسناد للتسكين"'
                            : 'Select a hotel from the Explorer and click "Assign to List"'}
                        </span>
                      ) : (
                        hotelServices.map((h) => {
                          const bookingHref = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
                            `${h.serviceName} ${h.city} Egypt`
                          )}`;
                          return (
                            <div
                              key={h.id}
                              className="bg-white px-2.5 py-1 rounded-xl border border-[#EDE0CC] text-[#44200F] inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <span className="font-extrabold text-[#795037]">{h.city}:</span>
                              <span className="font-bold truncate max-w-[180px]">{h.serviceName}</span>
                              {h.confirmationNo && (
                                <span className="font-mono tabular-nums text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                  {h.confirmationNo}
                                </span>
                              )}
                              <a
                                href={bookingHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#EA580C] hover:underline inline-flex items-center gap-0.5 font-bold text-[10px] shrink-0"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span>{isAr ? 'حجز' : 'Book'}</span>
                              </a>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Passenger & Rooming Manifest Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-start">
                        <thead>
                          <tr className="bg-[#FAF7F2]/60 border-b border-[#EDE0CC] text-[11px] font-bold text-[#795037]">
                            <th className="py-2.5 px-3 text-start">{isAr ? 'الغرفة / الكابينة' : 'Room / Cabin'}</th>
                            <th className="py-2.5 px-3 text-start">{isAr ? 'اسم النزيل (الجواز)' : 'Guest Full Name'}</th>
                            <th className="py-2.5 px-3 text-start">{isAr ? 'الجنسية' : 'Nationality'}</th>
                            <th className="py-2.5 px-3 text-start">{isAr ? 'الوجبات / طلبات' : 'Dietary'}</th>
                            <th className="py-2.5 px-3 text-end">{isAr ? 'إجراء' : 'Edit'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EDE0CC]/60">
                          {tripPassengers.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-[#FAF8F5] transition">
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="font-mono tabular-nums font-bold text-[#44200F] bg-[#FAF7F2] px-2 py-1 rounded-lg border border-[#EDE0CC]">
                                  {p.room || `Room ${101 + Math.floor(idx / 2)} (DBL)`}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{p.name || 'Unnamed Guest'}</div>
                                {p.personalCode && (
                                  <div className="text-[10px] text-emerald-800 font-mono tabular-nums">
                                    Code: {p.personalCode}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="font-medium text-slate-700">{p.nationality}</span>
                                <span className="ms-1 text-[10px] text-[#795037]">· {p.type}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                {p.dietary && p.dietary !== 'Standard' ? (
                                  <span className="font-bold text-amber-800">{p.dietary}</span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">
                                    {isAr ? 'قياسي' : 'Standard'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-end whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPassenger({ tripId: trip.id, passenger: { ...p } });
                                      setIsEditModalOpen(true);
                                    }}
                                    className="p-1.5 text-[#795037] hover:text-[#44200F] hover:bg-[#FAF7F2] rounded-lg transition cursor-pointer"
                                    title={isAr ? 'تعديل بيانات النزيل والغرفة' : 'Edit Guest Details'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePassenger(trip.id, p.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title={isAr ? 'حذف النزيل' : 'Remove Guest'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: ASSIGN LIVE HOTEL TO TRIP & ROOMING MANIFEST                 */}
      {/* ===================================================================== */}
      {assignModalHotel && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#EDE0CC]">
            <div className="p-5 bg-[#44200F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Hotel className="w-5 h-5 text-[#C4A177] shrink-0" />
                <div>
                  <h3 className="text-sm font-extrabold">
                    {isAr ? 'إسناد الفندق للرحلة وتوزيع غرف التسكين' : 'Assign Hotel to Trip & Rooming List'}
                  </h3>
                  <p className="text-[11px] text-[#EDE0CC]">
                    {isAr ? assignModalHotel.nameAr : assignModalHotel.nameEn}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalHotel(null)}
                className="text-[#EDE0CC] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#44200F] block mb-1.5">
                  {isAr ? 'اختر الفوج السياحي المستهدف' : 'Select Target Tour Group'}
                </label>
                <select
                  value={assignTargetTripId}
                  onChange={(e) => setAssignTargetTripId(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-bold text-[#44200F] focus:outline-none"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fileNumber} — {t.travelerName} ({t.passengers?.length || 0} {isAr ? 'نزلاء' : 'Guests'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE0CC]">
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'غرف مزدوجة (DBL)' : 'Double (DBL)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={assignDblCount}
                    onChange={(e) => setAssignDblCount(Math.max(0, Number(e.target.value)))}
                    className="w-full h-9 px-2.5 bg-white border border-[#EDE0CC] rounded-lg font-mono tabular-nums font-bold text-sm text-[#44200F]"
                  />
                </div>

                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE0CC]">
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'غرف مفردة (SGL)' : 'Single (SGL)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={assignSglCount}
                    onChange={(e) => setAssignSglCount(Math.max(0, Number(e.target.value)))}
                    className="w-full h-9 px-2.5 bg-white border border-[#EDE0CC] rounded-lg font-mono tabular-nums font-bold text-sm text-[#44200F]"
                  />
                </div>

                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE0CC]">
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'أجنحة (Suite)' : 'Royal Suites'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={assignSuiteCount}
                    onChange={(e) => setAssignSuiteCount(Math.max(0, Number(e.target.value)))}
                    className="w-full h-9 px-2.5 bg-white border border-[#EDE0CC] rounded-lg font-mono tabular-nums font-bold text-sm text-[#44200F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'رقم مرجع / تأكيد الحجز' : 'Hotel Confirmation Code'}
                  </label>
                  <input
                    type="text"
                    value={assignConfirmationNo}
                    onChange={(e) => setAssignConfirmationNo(e.target.value)}
                    placeholder="HTL-LXR-8492"
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono tabular-nums font-bold text-[#44200F]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'يوم التسكين بالبرنامج' : 'Check-in Day #'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={assignDayNumber}
                    onChange={(e) => setAssignDayNumber(Math.max(1, Number(e.target.value)))}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono tabular-nums font-bold text-[#44200F]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE0CC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignAutoDistributePax}
                  onChange={(e) => setAssignAutoDistributePax(e.target.checked)}
                  className="w-4 h-4 accent-[#44200F] rounded"
                />
                <span className="font-semibold text-[#44200F]">
                  {isAr
                    ? 'توزيع نزلاء الفوج تلقائياً على الغرف المحددة في جدول التسكين'
                    : 'Auto-distribute group passengers into these allocated rooms'}
                </span>
              </label>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#795037]">
                  {isAr
                    ? 'هل ترغب في إتمام الحجز الفوري على المنصة العالمية أولاً؟'
                    : 'Need to complete external booking first?'}
                </span>
                <a
                  href={assignModalHotel.directBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-extrabold text-[#EA580C] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح رابط الحجز المباشر' : 'Open Direct Booking'}</span>
                </a>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#EDE0CC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignModalHotel(null)}
                className="h-9 px-4 rounded-xl text-xs font-bold text-[#795037] hover:bg-[#EDE0CC]/60 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignHotel}
                className="h-9 px-5 rounded-xl text-xs font-extrabold bg-[#44200F] hover:bg-[#311509] text-white inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{isAr ? 'تأكيد الإسناد وتحديث التسكين' : 'Confirm & Update Rooming'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT PASSENGER & ROOM ALLOCATION                             */}
      {/* ===================================================================== */}
      {isEditModalOpen && editingPassenger && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#EDE0CC]">
            <div className="p-5 bg-[#44200F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hotel className="w-5 h-5 text-[#C4A177]" />
                <h3 className="text-sm font-bold">
                  {isAr ? 'تعديل بيانات النزيل وتوزيع الغرفة' : 'Edit Guest & Room Allocation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#EDE0CC] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#44200F] block mb-1">
                  {isAr ? 'اسم النزيل بالكامل (كما في الجواز)' : 'Guest Full Name (As in Passport)'}
                </label>
                <input
                  type="text"
                  value={editingPassenger.passenger.name}
                  onChange={(e) =>
                    setEditingPassenger({
                      ...editingPassenger,
                      passenger: { ...editingPassenger.passenger, name: e.target.value },
                    })
                  }
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'رقم / نوع الغرفة أو الكابينة' : 'Room / Cabin No.'}
                  </label>
                  <input
                    type="text"
                    value={editingPassenger.passenger.room}
                    onChange={(e) =>
                      setEditingPassenger({
                        ...editingPassenger,
                        passenger: { ...editingPassenger.passenger, room: e.target.value },
                      })
                    }
                    placeholder="Suite 401 / Deluxe DBL"
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono tabular-nums focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'الجنسية' : 'Nationality'}
                  </label>
                  <input
                    type="text"
                    value={editingPassenger.passenger.nationality}
                    onChange={(e) =>
                      setEditingPassenger({
                        ...editingPassenger,
                        passenger: { ...editingPassenger.passenger, nationality: e.target.value },
                      })
                    }
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#44200F] block mb-1">
                  {isAr ? 'الطلبات الخاصة والوجبات' : 'Special Dietary / Requests'}
                </label>
                <input
                  type="text"
                  value={editingPassenger.passenger.dietary}
                  onChange={(e) =>
                    setEditingPassenger({
                      ...editingPassenger,
                      passenger: { ...editingPassenger.passenger, dietary: e.target.value },
                    })
                  }
                  placeholder="No Seafood / Gluten-Free / High Floor"
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#44200F] block mb-1">
                  {isAr ? 'كود الدخول الشخصي للكونسيرج' : 'Personal Guest Passcode'}
                </label>
                <input
                  type="text"
                  value={editingPassenger.passenger.personalCode || ''}
                  onChange={(e) =>
                    setEditingPassenger({
                      ...editingPassenger,
                      passenger: { ...editingPassenger.passenger, personalCode: e.target.value },
                    })
                  }
                  placeholder="GARCIA-01"
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#EDE0CC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-bold text-[#795037] hover:bg-[#EDE0CC]/60 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSavePassenger}
                className="h-9 px-5 rounded-xl text-xs font-extrabold bg-[#44200F] hover:bg-[#311509] text-white inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{isAr ? 'حفظ التغييرات' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: ADD NEW GUEST TO ROOMING MANIFEST                            */}
      {/* ===================================================================== */}
      {isAddPaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#EDE0CC]">
            <div className="p-5 bg-[#44200F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C4A177]" />
                <h3 className="text-sm font-bold">
                  {isAr ? 'إضافة نزيل جديد لكشف التسكين' : 'Add New Guest to Rooming List'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPaxModalOpen(false)}
                className="text-[#EDE0CC] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#44200F] block mb-1">
                  {isAr ? 'الفوج / ملف الرحلة' : 'Target Trip File'}
                </label>
                <select
                  value={targetTripForAdd}
                  onChange={(e) => setTargetTripForAdd(e.target.value)}
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-bold text-[#44200F]"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fileNumber} — {t.travelerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#44200F] block mb-1">
                  {isAr ? 'اسم النزيل بالكامل (كما في الجواز)' : 'Guest Full Name'}
                </label>
                <input
                  type="text"
                  value={newPaxData.name}
                  onChange={(e) => setNewPaxData({ ...newPaxData, name: e.target.value })}
                  placeholder="e.g. Maria Gonzalez"
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'توزيع الغرفة / الكابينة' : 'Room / Cabin'}
                  </label>
                  <input
                    type="text"
                    value={newPaxData.room}
                    onChange={(e) => setNewPaxData({ ...newPaxData, room: e.target.value })}
                    placeholder="Room 204 (DBL)"
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono tabular-nums focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#44200F] block mb-1">
                    {isAr ? 'الجنسية' : 'Nationality'}
                  </label>
                  <input
                    type="text"
                    value={newPaxData.nationality}
                    onChange={(e) => setNewPaxData({ ...newPaxData, nationality: e.target.value })}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#44200F] block mb-1">
                  {isAr ? 'الطلبات الخاصة والوجبات' : 'Dietary / Requests'}
                </label>
                <input
                  type="text"
                  value={newPaxData.dietary}
                  onChange={(e) => setNewPaxData({ ...newPaxData, dietary: e.target.value })}
                  placeholder="Vegetarian, Non-Smoking, etc."
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-t border-[#EDE0CC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddPaxModalOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-bold text-[#795037] hover:bg-[#EDE0CC]/60 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAddNewPassenger}
                className="h-9 px-5 rounded-xl text-xs font-extrabold bg-[#44200F] hover:bg-[#311509] text-white inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{isAr ? 'إضافة النزيل' : 'Add Guest'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
