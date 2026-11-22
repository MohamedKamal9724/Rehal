import { scopedOperatorStorage } from './sessionScope';
import { Quote, Workspace, SupplierVoucher, VoucherCategory, VoucherStatus } from '../types';
import { TripFile } from './tripStore';
import { RIHAL_WORDMARK_BASE64 } from '../assets/rihalLogoBase64';

const STORAGE_KEY_PREFIX = 'qde_vouchers_';

/**
 * Calculates a date offset from a starting date string (YYYY-MM-DD).
 */
export function calculateDateOffset(startDateStr: string, dayNumber: number): string {
  try {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return startDateStr;
    d.setDate(d.getDate() + Math.max(0, dayNumber - 1));
    return d.toISOString().split('T')[0];
  } catch {
    return startDateStr;
  }
}

/**
 * 1-Click Generator: Automatically synthesizes and groups all supplier vouchers
 * from an itinerary quote, passenger manifest, and selected VIP upsells.
 */
export function generateVouchersFromQuote(
  quote: Quote,
  tripFile?: Partial<TripFile>,
  workspace?: Partial<Workspace>
): SupplierVoucher[] {
  const vouchers: SupplierVoucher[] = [];
  const adults = Math.max(1, quote.group?.adults || 1);
  const children = quote.group?.children?.length || 0;
  const infants = quote.group?.infants || 0;
  const totalPax = adults + children + infants;
  const quoteYear = new Date().getFullYear();

  // Synthesize passengers if not already present in tripFile
  const passengers = tripFile?.passengers && tripFile.passengers.length > 0
    ? tripFile.passengers
    : [
        { name: quote.travelerName, type: 'Adult', room: 'Room 1 (DBL)', dietary: '' },
        ...(adults > 1 ? Array.from({ length: adults - 1 }).map((_, i) => ({
          name: `Adult Guest ${i + 2}`,
          type: 'Adult',
          room: 'Room 1 (DBL)',
          dietary: '',
        })) : []),
        ...Array.from({ length: children }).map((_, i) => ({
          name: `Child Guest ${i + 1}`,
          type: 'Child',
          room: 'Extra Bed / DBL',
          dietary: '',
        })),
        ...Array.from({ length: infants }).map((_, i) => ({
          name: `Infant Guest ${i + 1}`,
          type: 'Infant',
          room: 'Baby Cot',
          dietary: '',
        })),
      ];

  const defaultBillingClause = `All contracted charges are billed directly to ${workspace?.name || 'RIHAL Egypt Operations'} master corporate account under agreed tariff. Absolutely NO CASH OR PAYMENT to be collected from the guests upon arrival or check-out (لا يتم تحصيل أي مبالغ من العميل).`;

  let voucherCounter = 1;
  const getNextVoucherNum = (prefix: string) => 
    `VCH-${quoteYear}-${prefix}-${String(voucherCounter++).padStart(3, '0')}`;

  // 1. HOTEL VOUCHERS (Group consecutive days at the same hotel)
  const hotelDays: { dayNumber: number; line: any; city: string }[] = [];
  quote.days?.forEach(d => {
    d.lines?.forEach(l => {
      if (l.supplierType === 'Hotel' || /hotel|resort|lodge/i.test(l.serviceName)) {
        hotelDays.push({ dayNumber: d.dayNumber, line: l, city: l.city || d.city || 'Cairo' });
      }
    });
  });

  if (hotelDays.length > 0) {
    // Group by supplier name / hotel name
    const hotelGroups: Record<string, { days: number[]; city: string; lines: any[] }> = {};
    hotelDays.forEach(hd => {
      const hotelKey = hd.line.supplierName || hd.line.serviceName;
      if (!hotelGroups[hotelKey]) {
        hotelGroups[hotelKey] = { days: [], city: hd.city, lines: [] };
      }
      hotelGroups[hotelKey].days.push(hd.dayNumber);
      hotelGroups[hotelKey].lines.push(hd.line);
    });

    Object.entries(hotelGroups).forEach(([hotelName, groupData]) => {
      const minDay = Math.min(...groupData.days);
      const maxDay = Math.max(...groupData.days);
      const nights = groupData.days.length;
      const checkInDate = calculateDateOffset(quote.startDate, minDay);
      const checkOutDate = calculateDateOffset(quote.startDate, maxDay + 1);

      vouchers.push({
        id: `vch-hotel-${minDay}-${Math.random().toString(36).slice(2, 7)}`,
        voucherNumber: getNextVoucherNum('HTL'),
        quoteId: quote.id,
        tripId: tripFile?.id,
        category: 'hotel',
        supplierType: 'Hotel',
        supplierName: hotelName,
        supplierContactPhone: groupData.lines[0]?.supplierPhone || '+20233773222',
        city: groupData.city,
        serviceTitle: `Accommodation Reservation: ${hotelName} (${nights} Night${nights > 1 ? 's' : ''})`,
        serviceDescription: `Confirmed 5-star accommodations for ${totalPax} guests. Check-in: ${checkInDate} (after 14:00) | Check-out: ${checkOutDate} (before 12:00).`,
        serviceDate: checkInDate,
        endDate: checkOutDate,
        nightsCount: nights,
        dayNumbers: groupData.days,
        roomCount: Math.ceil(adults / 2),
        roomType: groupData.lines[0]?.serviceName || 'Deluxe Room',
        mealPlan: 'Bed & Breakfast (Daily Buffet Included)',
        paxCount: totalPax,
        leadGuestName: quote.travelerName,
        passengers,
        status: 'Confirmed',
        specialInstructions: 'Nile or Pyramid View requested where available. High floor, non-smoking stateroom.',
        billingClause: defaultBillingClause,
        qrCodeToken: `QR-HTL-${quote.quoteNumber}`,
      });
    });
  }

  // 2. NILE CRUISE VOUCHERS
  const cruiseLines: { dayNumber: number; line: any; city: string }[] = [];
  quote.days?.forEach(d => {
    d.lines?.forEach(l => {
      if (l.supplierType === 'Nile Cruise' || /cruise|dahabiya|boat/i.test(l.serviceName)) {
        cruiseLines.push({ dayNumber: d.dayNumber, line: l, city: l.city || d.city || 'Luxor' });
      }
    });
  });

  if (cruiseLines.length > 0) {
    const cruiseName = cruiseLines[0].line.supplierName || cruiseLines[0].line.serviceName || '5★ Luxury Nile Cruiser';
    const cruiseDays = cruiseLines.map(c => c.dayNumber);
    const minDay = Math.min(...cruiseDays);
    const maxDay = Math.max(...cruiseDays);
    const embarkDate = calculateDateOffset(quote.startDate, minDay);
    const disembarkDate = calculateDateOffset(quote.startDate, maxDay + 1);

    vouchers.push({
      id: `vch-cruise-${minDay}-${Math.random().toString(36).slice(2, 7)}`,
      voucherNumber: getNextVoucherNum('CRU'),
      quoteId: quote.id,
      tripId: tripFile?.id,
      category: 'cruise',
      supplierType: 'Nile Cruise',
      supplierName: cruiseName,
      supplierContactPhone: '+201004567890',
      city: 'Luxor / Aswan',
      serviceTitle: `Nile Cruise Cabin Allocation: ${cruiseName}`,
      serviceDescription: `Luxury Sailing Itinerary between Luxor and Aswan including shore temples & full board dining.`,
      serviceDate: embarkDate,
      endDate: disembarkDate,
      nightsCount: cruiseDays.length,
      dayNumbers: cruiseDays,
      roomCount: Math.ceil(adults / 2),
      roomType: 'Panoramic Deluxe Cabin',
      mealPlan: 'Full Board (Breakfast, Lunch & Dinner Included)',
      paxCount: totalPax,
      leadGuestName: quote.travelerName,
      passengers,
      status: 'Confirmed',
      specialInstructions: 'Early embarkation luggage drop-off. Inform boat chef of any vegetarian or dietary requests.',
      billingClause: defaultBillingClause,
      qrCodeToken: `QR-CRU-${quote.quoteNumber}`,
    });
  }

  // 3. PRIVATE TRANSPORT & CHAUFFEUR RUN SHEETS
  // Arrival airport transfer
  const arrivalFlight = tripFile?.arrival?.flight || 'BA 155 (LHR → CAI)';
  const arrivalTime = tripFile?.arrival?.time || '14:30';
  const arrivalDate = tripFile?.arrival?.date || quote.startDate;

  vouchers.push({
    id: `vch-trans-arrival-${Math.random().toString(36).slice(2, 7)}`,
    voucherNumber: getNextVoucherNum('TRN'),
    quoteId: quote.id,
    tripId: tripFile?.id,
    category: 'transport',
    supplierType: 'Transport',
    supplierName: 'RIHAL Executive Chauffeur Fleet',
    supplierContactPhone: tripFile?.driverPhone || '+201012345678',
    city: 'Cairo',
    serviceTitle: 'Airport VIP Arrival Meet & Chauffeur Transfer to Hotel',
    serviceDescription: `Private airport greeting inside customs hall, baggage porterage, and Mercedes VIP transfer to hotel.`,
    serviceDate: arrivalDate,
    dayNumbers: [1],
    pickupTime: arrivalTime,
    pickupLocation: 'Cairo International Airport (Terminal 2/3 Customs Exit)',
    dropoffLocation: 'Hotel Lobby (Cairo / Giza)',
    flightDetails: `Flight ${arrivalFlight} • Arrival Time ${arrivalTime}`,
    vehicleCategory: tripFile?.vehicleType || (totalPax > 3 ? 'Mercedes Sprinter VIP A/C' : 'Mercedes E-Class / Toyota HiAce A/C'),
    driverName: tripFile?.driverName || 'Captain Ahmed Abdelrahman',
    driverPhone: tripFile?.driverPhone || '+20 10 1234 5678',
    paxCount: totalPax,
    leadGuestName: quote.travelerName,
    passengers,
    status: 'Confirmed',
    specialInstructions: `Driver must hold a clear RIHAL logo sign with: "MR. ${quote.travelerName.toUpperCase()}". Cold mineral water and wet towels onboard.`,
    billingClause: defaultBillingClause,
    qrCodeToken: `QR-ARR-${quote.quoteNumber}`,
  });

  // Departure airport transfer (Last day)
  const lastDay = quote.durationDays || 5;
  const departureDate = calculateDateOffset(quote.startDate, lastDay);
  const departureFlight = tripFile?.departure?.flight || 'BA 154 (CAI → LHR)';
  const departureTime = tripFile?.departure?.time || '10:00';

  vouchers.push({
    id: `vch-trans-dep-${Math.random().toString(36).slice(2, 7)}`,
    voucherNumber: getNextVoucherNum('TRN'),
    quoteId: quote.id,
    tripId: tripFile?.id,
    category: 'transport',
    supplierType: 'Transport',
    supplierName: 'RIHAL Executive Chauffeur Fleet',
    supplierContactPhone: tripFile?.driverPhone || '+201012345678',
    city: quote.days?.[quote.days.length - 1]?.city || 'Cairo',
    serviceTitle: 'Departure Transfer: Hotel to Airport for International Flight',
    serviceDescription: `Hotel pickup 3 hours prior to departure, private luggage transfer to airport departures terminal.`,
    serviceDate: departureDate,
    dayNumbers: [lastDay],
    pickupTime: departureTime,
    pickupLocation: 'Hotel Reception Lobby',
    dropoffLocation: 'Cairo International Airport Departures',
    flightDetails: `Outbound Flight ${departureFlight} • Pickup at ${departureTime}`,
    vehicleCategory: tripFile?.vehicleType || (totalPax > 3 ? 'Mercedes Sprinter VIP A/C' : 'Mercedes E-Class / Toyota HiAce A/C'),
    driverName: tripFile?.driverName || 'Captain Ahmed Abdelrahman',
    driverPhone: tripFile?.driverPhone || '+20 10 1234 5678',
    paxCount: totalPax,
    leadGuestName: quote.travelerName,
    passengers,
    status: 'Confirmed',
    specialInstructions: 'Ensure guests have passports and flight tickets before leaving the hotel lobby.',
    billingClause: defaultBillingClause,
    qrCodeToken: `QR-DEP-${quote.quoteNumber}`,
  });

  // 4. LICENSED EGYPTOLOGIST GUIDE ASSIGNMENT
  const guideDays = quote.days?.filter(d => {
    const text = `${d.title || ''} ${d.description || ''}`.toLowerCase();
    return /pyramid|karnak|temple|museum|gem|luxor|aswan|abu simbel|tomb/i.test(text);
  }) || [];

  if (guideDays.length > 0) {
    const primaryCity = guideDays[0].city || 'Cairo';
    const firstTourDate = calculateDateOffset(quote.startDate, guideDays[0].dayNumber);

    vouchers.push({
      id: `vch-guide-${Math.random().toString(36).slice(2, 7)}`,
      voucherNumber: getNextVoucherNum('GDE'),
      quoteId: quote.id,
      tripId: tripFile?.id,
      category: 'guide',
      supplierType: 'Guide',
      supplierName: tripFile?.guideName ? `Syndicate Egyptologist: ${tripFile.guideName}` : 'Syndicate of Egyptian Tourist Guides',
      supplierContactPhone: tripFile?.guidePhone || '+201098765432',
      city: primaryCity,
      serviceTitle: `Licensed Egyptologist Private Tour Assignment (${quote.language.toUpperCase()})`,
      serviceDescription: `Private Egyptologist guiding for: ${guideDays.map(g => g.title).slice(0, 3).join(' • ')}`,
      serviceDate: firstTourDate,
      dayNumbers: guideDays.map(g => g.dayNumber),
      pickupTime: '08:30',
      pickupLocation: 'Hotel Lobby Concierge Desk',
      guideName: tripFile?.guideName || 'Not assigned',
      guidePhone: tripFile?.guidePhone || '+20 10 9876 5432',
      guideLanguage: tripFile?.guideLanguage || quote.language.toUpperCase(),
      paxCount: totalPax,
      leadGuestName: quote.travelerName,
      passengers,
      status: 'Confirmed',
      specialInstructions: `Fluent in ${quote.language.toUpperCase()}. Client is interested in ancient architecture and photography. Pacing should be relaxed.`,
      billingClause: defaultBillingClause,
      qrCodeToken: `QR-GDE-${quote.quoteNumber}`,
    });
  }

  // 5. CLIENT CONFIRMED VIP ADD-ONS & UPSELLS
  if (quote.upsells && quote.upsells.length > 0) {
    const activeSelectedIds = new Set(quote.selectedUpsellIds || []);
    const confirmedUpsells = quote.upsells.filter(u => activeSelectedIds.has(u.id));

    confirmedUpsells.forEach((upsell) => {
      const upsellDay = upsell.city.toLowerCase() === 'luxor' ? 3 : upsell.city.toLowerCase() === 'aswan' ? 4 : 2;
      const serviceDate = calculateDateOffset(quote.startDate, upsellDay);

      vouchers.push({
        id: `vch-upsell-${upsell.id}-${Math.random().toString(36).slice(2, 7)}`,
        voucherNumber: getNextVoucherNum('EXC'),
        quoteId: quote.id,
        tripId: tripFile?.id,
        category: 'excursion',
        supplierType: 'Other',
        supplierName: `${upsell.city} Authorized Luxury Provider`,
        supplierContactPhone: '+201009988776',
        city: upsell.city,
        serviceTitle: `★ VIP Add-on Voucher: ${upsell.title}`,
        serviceDescription: upsell.description,
        serviceDate,
        dayNumbers: [upsellDay],
        pickupTime: upsell.title.includes('Balloon') ? '04:45' : '18:00',
        pickupLocation: 'Hotel or Cruise Lobby',
        paxCount: upsell.priceBasis === 'per_person' ? adults : totalPax,
        leadGuestName: quote.travelerName,
        passengers,
        status: 'Confirmed',
        specialInstructions: `${upsell.badge || 'VIP Client'}. Pre-flight safety briefing and official certificate included where applicable.`,
        billingClause: defaultBillingClause,
        qrCodeToken: `QR-UP-${upsell.id}`,
      });
    });
  }

  return vouchers;
}

/**
 * Formats a bilingual, operational dispatch message optimized for WhatsApp communication with Egyptian suppliers.
 */
export function formatWhatsAppDispatchMessage(
  voucher: SupplierVoucher,
  workspace: Partial<Workspace>
): string {
  const company = workspace.name || 'RIHAL Egypt Expeditions';
  const hotline = workspace.whatsappNumber || workspace.contactPhone || '+201000000000';

  let specificDetails = '';

  if (voucher.category === 'hotel') {
    specificDetails = `
🏨 تفاصيل الإقامة / Accommodation Details:
• الفندق / Hotel: ${voucher.supplierName} (${voucher.city})
• تاريخ الدخول / Check-in: ${voucher.serviceDate} (After 14:00)
• تاريخ الخروج / Check-out: ${voucher.endDate || 'Next Day'}
• عدد الليالي / Nights: ${voucher.nightsCount || 1} Night(s)
• نوع الغرفة / Room: ${voucher.roomType || 'Deluxe Room'} (${voucher.roomCount || 1} Rooms)
• الوجبات / Meal Plan: ${voucher.mealPlan || 'Bed & Breakfast'}
• قائمة النزلاء / Guests:
${voucher.passengers.map((p, i) => `  ${i + 1}. ${p.name || 'Guest'} (${p.type})${p.room ? ` - ${p.room}` : ''}`).join('\n')}`;
  } else if (voucher.category === 'cruise') {
    specificDetails = `
🚢 تفاصيل الباخرة النيلية / Nile Cruise Details:
• الباخرة / Vessel: ${voucher.supplierName}
• الإبحار من / Embarkation: ${voucher.city} (${voucher.serviceDate})
• نهاية الرحلة / Disembarkation: ${voucher.endDate || 'End Date'}
• الكبائن / Cabins: ${voucher.roomCount || 1} Cabin(s) (${voucher.roomType || 'Deluxe Stateroom'})
• الوجبات / Meal Plan: Full Board Included (فطور وغداء وعشاء)`;
  } else if (voucher.category === 'transport') {
    specificDetails = `
🚗 تفاصيل النقل والسيارة / Chauffeur & Vehicle:
• نقطة الالتقاء / Pickup: ${voucher.pickupLocation || 'Airport / Hotel'}
• الموعد / Time: ${voucher.pickupTime || '09:00'}
• الوجهة / Drop-off: ${voucher.dropoffLocation || 'Destination'}
• الرحلة الجوية / Flight: ${voucher.flightDetails || 'N/A'}
• نوع المركبة / Vehicle: ${voucher.vehicleCategory || 'VIP Mercedes / HiAce'}
• السائق المسؤول / Driver: ${voucher.driverName || 'Captain Assigned'} (${voucher.driverPhone || 'TBD'})
• لافتة الاستقبال / Signboard: "WELCOME: ${voucher.leadGuestName.toUpperCase()}"`;
  } else if (voucher.category === 'guide') {
    specificDetails = `
🏛️ تفاصيل الإرشاد السياحي / Guide Assignment:
• المرشد / Egyptologist: ${voucher.guideName || 'Licensed Guide'} (${voucher.guidePhone || 'TBD'})
• لغة الجولة / Language: ${voucher.guideLanguage || 'English'}
• مكان الالتقاء / Meeting: ${voucher.pickupLocation || 'Hotel Lobby'} at ${voucher.pickupTime || '08:30'}
• المزارات / Sightseeing: ${voucher.serviceDescription || 'Full Day Itinerary'}`;
  } else {
    specificDetails = `
✨ تفاصيل النشاط والخدمة / Service Details:
• الخدمة / Service: ${voucher.serviceTitle}
• الموعد / Pickup: ${voucher.pickupTime || 'TBD'} from ${voucher.pickupLocation || 'Hotel Lobby'}
• المدينة / City: ${voucher.city}
• الملاحظات / Notes: ${voucher.specialInstructions || 'VIP Handling'}`;
  }

  return `📍 أمر تشغيل سياحي رسمي / OFFICIAL OPERATIONS DISPATCH
شركة ${company} — توريد وتنسيق خدمات

🔖 رقم القسيمة / Voucher Ref: #${voucher.voucherNumber}
👤 العميل الرئيسي / Lead Traveler: ${voucher.leadGuestName} (${voucher.paxCount} Pax)
📅 التاريخ / Date: ${voucher.serviceDate}
${specificDetails}

⚠️ تعليمات المحاسبة والمالية / Billing Policy:
${voucher.billingClause}

📞 عمليات الطوارئ / 24/7 Operations Duty Manager:
${hotline} • ${workspace.contactEmail || 'ops@rihal.eg'}
شكراً لتعاونكم الدائم معنا لتقديم أفضل تجربة لضيوف مصر.`;
}

/**
 * Generates an executive, print-ready HTML voucher with authentic Egyptian DMC headers,
 * Ministry of Tourism licensing, QR verification code, and official stamp block.
 */
export function generatePrintableVoucherHtml(
  voucher: SupplierVoucher,
  workspace: Partial<Workspace>
): string {
  const company = workspace.name || 'RIHAL Egypt Expeditions';
  const address = workspace.address || '';
  const phone = workspace.contactPhone || '';
  const email = workspace.contactEmail || '';

  const categoryBadgeColor = 
    voucher.category === 'hotel' ? '#003580' :
    voucher.category === 'cruise' ? '#0e7490' :
    voucher.category === 'transport' ? '#008009' :
    voucher.category === 'guide' ? '#b45309' : '#7e22ce';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Service Voucher ${voucher.voucherNumber} - ${voucher.leadGuestName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 1.2cm 1.4cm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #fafaf9;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 24px;
    }
    .voucher-card {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #003580;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 22px;
      font-weight: 800;
      color: #003580;
      letter-spacing: -0.5px;
    }
    .company-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .voucher-pill {
      display: inline-block;
      padding: 6px 14px;
      background: ${categoryBadgeColor};
      color: #ffffff;
      font-weight: 800;
      font-size: 11px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ref-box {
      text-align: right;
    }
    .ref-no {
      font-size: 18px;
      font-weight: 800;
      color: #003580;
      font-family: monospace;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 12px;
    }
    .grid-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      width: 25%;
    }
    .grid-table td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #003580;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0 8px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pax-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 6px;
    }
    .pax-table th {
      background: #f1f5f9;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    .pax-table td {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
    }
    .billing-banner {
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 18px 0;
      font-size: 11px;
      color: #1e3a8a;
    }
    .sign-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
    }
    .stamp-circle {
      width: 80px;
      height: 80px;
      border: 2px dashed #003580;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: #003580;
      text-align: center;
      font-weight: 700;
      margin-top: 8px;
      transform: rotate(-10deg);
      opacity: 0.8;
    }
    .arabic-title {
      font-family: 'Amiri', serif;
      font-size: 12px;
      color: #475569;
      direction: rtl;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .voucher-card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="voucher-card">
    <table class="header-table">
      <tr>
        <td style="display: flex; align-items: center; gap: 14px;">
          <img src="${RIHAL_WORDMARK_BASE64}" alt="RIHAL رحال" style="height: 50px; width: auto; max-width: 220px; object-fit: contain;" />
          <div>
            <div class="arabic-title" style="color: #9E782A; font-weight: 700;">${company} — تنظيم وتشغيل الرحلات الفاخرة</div>
            <div class="company-subtitle">${address ? `${address} • ` : ''}Tel: ${phone} • Operations: ${email || 'operations@rihal.eg'}</div>
          </div>
        </td>
        <td class="ref-box">
          <div class="voucher-pill">${voucher.category.toUpperCase()} SERVICE VOUCHER</div>
          <div class="ref-no mt-1">${voucher.voucherNumber}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Date Issued: ${new Date().toISOString().split('T')[0]}</div>
        </td>
      </tr>
    </table>

    <div class="section-title">Supplier &amp; Service Logistics</div>
    <table class="grid-table">
      <tr>
        <th>Contracted Supplier</th>
        <td><strong>${voucher.supplierName}</strong></td>
        <th>Service Location</th>
        <td>${voucher.city}, Egypt</td>
      </tr>
      <tr>
        <th>Service Title</th>
        <td colspan="3"><strong>${voucher.serviceTitle}</strong></td>
      </tr>
      <tr>
        <th>Service Date</th>
        <td><strong>${voucher.serviceDate}</strong></td>
        <th>Duration / Nights</th>
        <td>${voucher.nightsCount ? `${voucher.nightsCount} Night(s)` : 'Full Day Execution'}</td>
      </tr>
      ${voucher.pickupLocation ? `
      <tr>
        <th>Pickup Location</th>
        <td>${voucher.pickupLocation}</td>
        <th>Pickup Time</th>
        <td><strong>${voucher.pickupTime || 'Standard Service'}</strong></td>
      </tr>` : ''}
      ${voucher.flightDetails ? `
      <tr>
        <th>Flight / Arrival Coordinates</th>
        <td colspan="3"><strong>${voucher.flightDetails}</strong></td>
      </tr>` : ''}
      ${voucher.vehicleCategory ? `
      <tr>
        <th>Vehicle &amp; Chauffeur</th>
        <td colspan="3">${voucher.vehicleCategory} ${voucher.driverName ? `• Driver: <strong>${voucher.driverName}</strong> (${voucher.driverPhone || ''})` : ''}</td>
      </tr>` : ''}
      ${voucher.guideName ? `
      <tr>
        <th>Assigned Egyptologist</th>
        <td colspan="3"><strong>${voucher.guideName}</strong> (${voucher.guideLanguage || 'English'}) • Tel: ${voucher.guidePhone || 'Direct'}</td>
      </tr>` : ''}
    </table>

    <div class="section-title">Traveler Manifest &amp; Rooming (${voucher.paxCount} Guests)</div>
    <table class="grid-table">
      <tr>
        <th>Lead Traveler / Party Head</th>
        <td><strong>${voucher.leadGuestName}</strong></td>
        <th>Total Party Size</th>
        <td><strong>${voucher.paxCount} Travelers</strong></td>
      </tr>
      ${voucher.roomType ? `
      <tr>
        <th>Room Category &amp; Plan</th>
        <td>${voucher.roomType} (${voucher.roomCount || 1} Room/Cabin)</td>
        <th>Meal Board Basis</th>
        <td><strong>${voucher.mealPlan || 'Bed & Breakfast'}</strong></td>
      </tr>` : ''}
    </table>

    ${voucher.passengers && voucher.passengers.length > 0 ? `
    <table class="pax-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Full Name (as in passport)</th>
          <th>Guest Type</th>
          <th>Room Allocation</th>
          <th>Dietary / Notes</th>
        </tr>
      </thead>
      <tbody>
        ${voucher.passengers.map((p, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${p.name || 'Traveler Name TBC'}</strong></td>
            <td>${p.type || 'Adult'}</td>
            <td>${p.room || 'Standard Room'}</td>
            <td>${p.dietary || 'None'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>` : ''}

    <div class="billing-banner">
      <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">
        ★ Direct Operator Settlement Clause (شرط المحاسبة المباشرة)
      </div>
      <div>${voucher.billingClause}</div>
    </div>

    <div class="sign-section">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">
          For ${company} (Authorizing Officer)
        </div>
        <div style="border-bottom: 1px solid #94a3b8; height: 35px; margin-top: 8px;"></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
          Operations Director Signature • Cairo Headquarters
        </div>
        <div class="stamp-circle">
          DALIL DMC<br/>OFFICIAL<br/>OPERATIONS
        </div>
      </div>

      <div>
        <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">
          Supplier Confirmation &amp; Stamped Receipt
        </div>
        <div style="border-bottom: 1px solid #94a3b8; height: 35px; margin-top: 8px;"></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
          Received &amp; Confirmed by Supplier Desk Representative
        </div>
        <div style="margin-top: 14px; font-size: 11px; color: #003580; font-weight: 700;">
          Conf Code: _____________________
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;
}

/**
 * 1-Click Multi-Voucher Print Pack: Compiles all vouchers into a continuous
 * clean multi-page document with exact A4 page breaks.
 */
export function generateBatchVouchersHtml(
  vouchers: SupplierVoucher[],
  workspace: Partial<Workspace>
): string {
  const company = workspace.name || 'RIHAL Egypt Expeditions';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Operations Vouchers Pack (${vouchers.length} Vouchers) - ${company}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');
    @page { size: A4 portrait; margin: 1cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-wrapper {
      page-break-after: always;
      padding: 18px 24px;
      min-height: 98vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-bottom: 2px dashed #e2e8f0;
    }
    .page-wrapper:last-child {
      page-break-after: avoid;
      border-bottom: none;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #003580;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #003580;
    }
    .ref-no {
      font-size: 16px;
      font-weight: 800;
      color: #003580;
      font-family: monospace;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 11px;
    }
    .grid-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      width: 25%;
    }
    .grid-table td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #003580;
      text-transform: uppercase;
      margin: 12px 0 6px 0;
    }
    .pax-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-top: 4px;
    }
    .pax-table th { background: #f1f5f9; padding: 4px 8px; border: 1px solid #cbd5e1; }
    .pax-table td { padding: 4px 8px; border: 1px solid #cbd5e1; }
    .billing-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 12px 0;
      font-size: 10px;
      color: #1e3a8a;
    }
    .sign-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
    }
    .stamp-circle {
      width: 65px;
      height: 65px;
      border: 2px dashed #003580;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #003580;
      text-align: center;
      font-weight: 700;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  ${vouchers.map((voucher, idx) => `
    <div class="page-wrapper">
      <div>
        <table class="header-table">
          <tr>
            <td style="display: flex; align-items: center; gap: 12px;">
              <img src="${RIHAL_WORDMARK_BASE64}" alt="RIHAL رحال" style="height: 38px; width: auto; max-width: 180px; object-fit: contain;" />
              <div>
                <div class="company-title">${company}</div>
                <div style="font-size: 10px; color: #64748b;">
                   • Cairo, Egypt
                </div>
              </div>
            </td>
            <td style="text-align: right;">
              <span style="background: #003580; color: white; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 10px; text-transform: uppercase;">
                ${voucher.category.toUpperCase()} VOUCHER (${idx + 1}/${vouchers.length})
              </span>
              <div class="ref-no" style="margin-top: 4px;">${voucher.voucherNumber}</div>
            </td>
          </tr>
        </table>

        <div class="section-title">Service Details: ${voucher.serviceTitle}</div>
        <table class="grid-table">
          <tr>
            <th>Supplier Name</th>
            <td><strong>${voucher.supplierName}</strong></td>
            <th>Location</th>
            <td>${voucher.city}, Egypt</td>
          </tr>
          <tr>
            <th>Service Execution Date</th>
            <td><strong>${voucher.serviceDate}</strong></td>
            <th>End / Check-out</th>
            <td>${voucher.endDate || 'Same Day'}</td>
          </tr>
          ${voucher.pickupLocation ? `
          <tr>
            <th>Pickup Location &amp; Time</th>
            <td>${voucher.pickupLocation}</td>
            <td><strong>${voucher.pickupTime || 'Standard'}</strong></td>
          </tr>` : ''}
          ${voucher.flightDetails ? `
          <tr>
            <th>Flight Coordinates</th>
            <td colspan="3">${voucher.flightDetails}</td>
          </tr>` : ''}
          ${voucher.vehicleCategory ? `
          <tr>
            <th>Vehicle &amp; Chauffeur</th>
            <td colspan="3">${voucher.vehicleCategory} ${voucher.driverName ? `• Driver: ${voucher.driverName}` : ''}</td>
          </tr>` : ''}
          ${voucher.guideName ? `
          <tr>
            <th>Egyptologist Guiding</th>
            <td colspan="3">${voucher.guideName} (${voucher.guideLanguage || 'English'})</td>
          </tr>` : ''}
        </table>

        <div class="section-title">Traveler Manifest (${voucher.paxCount} Guests) — Lead: ${voucher.leadGuestName}</div>
        ${voucher.roomType ? `
        <table class="grid-table">
          <tr>
            <th>Room Category</th>
            <td>${voucher.roomType} (${voucher.roomCount || 1} Room/Cabin)</td>
            <th>Meal Plan</th>
            <td>${voucher.mealPlan || 'Bed & Breakfast'}</td>
          </tr>
        </table>` : ''}

        ${voucher.passengers && voucher.passengers.length > 0 ? `
        <table class="pax-table">
          <thead>
            <tr><th>#</th><th>Name</th><th>Type</th><th>Room</th><th>Dietary/Special</th></tr>
          </thead>
          <tbody>
            ${voucher.passengers.slice(0, 6).map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${p.name || 'Traveler'}</strong></td>
                <td>${p.type}</td>
                <td>${p.room || 'DBL'}</td>
                <td>${p.dietary || 'None'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : ''}

        <div class="billing-banner">
          <strong>Settlement Policy:</strong> ${voucher.billingClause}
        </div>
      </div>

      <div class="sign-section">
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #475569;">For ${company} (Operations Seal)</div>
          <div style="border-bottom: 1px solid #94a3b8; height: 25px;"></div>
          <div class="stamp-circle">DALIL DMC<br/>OPERATIONS</div>
        </div>
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #475569;">Supplier Desk Confirmation</div>
          <div style="border-bottom: 1px solid #94a3b8; height: 25px;"></div>
          <div style="font-size: 10px; color: #003580; font-weight: 700; margin-top: 6px;">
            Confirmed by: _______________________
          </div>
        </div>
      </div>
    </div>
  `).join('')}

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;
}

/**
 * Persists customized vouchers to local storage.
 */
export function saveVouchersForQuote(quoteId: string, vouchers: SupplierVoucher[]): void {
  try {
    scopedOperatorStorage.setItem(`${STORAGE_KEY_PREFIX}${quoteId}`, JSON.stringify(vouchers));
  } catch (e) {
    console.error('Failed to save vouchers:', e);
  }
}

/**
 * Loads customized vouchers from local storage or generates them dynamically if absent.
 */
export function loadVouchersForQuote(
  quote: Quote,
  tripFile?: Partial<TripFile>,
  workspace?: Partial<Workspace>
): SupplierVoucher[] {
  try {
    const raw = scopedOperatorStorage.getItem(`${STORAGE_KEY_PREFIX}${quote.id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached vouchers:', e);
  }

  // Generate fresh
  const fresh = generateVouchersFromQuote(quote, tripFile, workspace);
  saveVouchersForQuote(quote.id, fresh);
  return fresh;
}
