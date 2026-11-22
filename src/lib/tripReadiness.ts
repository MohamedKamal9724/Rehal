import { TripFile, TripService, TripPassenger } from './tripStore';

export interface TripReadinessCheck {
  id: 'accommodation' | 'transport' | 'guides' | 'guests' | 'documents';
  label: string;
  labelAr: string;
  isComplete: boolean;
  summary: string;
  summaryAr: string;
  targetTab: 'accommodation' | 'transport' | 'guides' | 'guests' | 'documents';
  actionLabel: string;
  actionLabelAr: string;
}

export interface TripReadinessReport {
  score: number; // 0 to 100
  isFullyReady: boolean;
  checks: TripReadinessCheck[];
  missingCount: number;
  nextRecommendedAction?: TripReadinessCheck;
}

/**
 * Evaluates trip readiness using purely state-driven operational facts.
 * Never calculates from fake data or assumes unassigned services are complete.
 */
export function auditTripReadiness(trip: TripFile): TripReadinessReport {
  const checks: TripReadinessCheck[] = [];

  // 1. Accommodation Confirmed
  const hotelServices = (trip.services || []).filter(s =>
    s.supplierType?.toLowerCase().includes('hotel') ||
    s.serviceName?.toLowerCase().includes('hotel') ||
    s.serviceName?.toLowerCase().includes('cruise') ||
    s.serviceName?.toLowerCase().includes('resort')
  );

  let accommComplete = false;
  let accommSummary = '';
  let accommSummaryAr = '';

  if (hotelServices.length === 0) {
    accommComplete = false;
    accommSummary = 'No hotel or Nile cruise booked';
    accommSummaryAr = 'لم يتم حجز فنادق أو بواخر نيلية';
  } else {
    const confirmedHotels = hotelServices.filter(s =>
      (s.status === 'Confirmed' || s.status === 'Reconfirmed') &&
      Boolean(s.confirmationNo && s.confirmationNo.trim())
    );
    accommComplete = confirmedHotels.length === hotelServices.length;
    accommSummary = accommComplete
      ? `${confirmedHotels.length}/${hotelServices.length} accommodations confirmed`
      : `${hotelServices.length - confirmedHotels.length} accommodation confirmation pending`;
    accommSummaryAr = accommComplete
      ? `تم تأكيد جميع أماكن الإقامة (${confirmedHotels.length}/${hotelServices.length})`
      : `ينقص تأكيد ${hotelServices.length - confirmedHotels.length} فندق أو باخرة`;
  }

  checks.push({
    id: 'accommodation',
    label: 'Accommodation Confirmed',
    labelAr: 'تأكيد حجوزات الإقامة والفنادق',
    isComplete: accommComplete,
    summary: accommSummary,
    summaryAr: accommSummaryAr,
    targetTab: 'accommodation',
    actionLabel: accommComplete ? 'Review Hotels' : 'Confirm Hotels',
    actionLabelAr: accommComplete ? 'مراجعة الفنادق' : 'تأكيد الفنادق',
  });

  // 2. Transport Assigned
  const hasDriver = Boolean(trip.driverName && trip.driverName.trim());
  const hasVehicle = Boolean(trip.vehiclePlate && trip.vehiclePlate.trim());
  const hasArrivalFlight = Boolean(trip.arrival?.flight && trip.arrival.flight.trim());
  const transportComplete = hasDriver && (hasVehicle || hasArrivalFlight);

  let transportSummary = '';
  let transportSummaryAr = '';
  if (!hasDriver) {
    transportSummary = 'No chauffeur assigned';
    transportSummaryAr = 'لم يتم تعيين سائق';
  } else if (!hasVehicle) {
    transportSummary = `${trip.driverName} assigned (Vehicle plate pending)`;
    transportSummaryAr = `تم تعيين ${trip.driverName} (اللوحة قيد التحديد)`;
  } else {
    transportSummary = `${trip.driverName} · ${trip.vehiclePlate}`;
    transportSummaryAr = `تم التعيين: ${trip.driverName} · ${trip.vehiclePlate}`;
  }

  checks.push({
    id: 'transport',
    label: 'Transport Assigned',
    labelAr: 'تعيين أسطول النقل والسائق',
    isComplete: transportComplete,
    summary: transportSummary,
    summaryAr: transportSummaryAr,
    targetTab: 'transport',
    actionLabel: transportComplete ? 'Review Fleet' : 'Assign Chauffeur',
    actionLabelAr: transportComplete ? 'مراجعة النقل' : 'تعيين سائق',
  });

  // 3. Guide Assigned
  const hasGuide = Boolean(trip.guideName && trip.guideName.trim());
  const hasGuidePhone = Boolean(trip.guidePhone && trip.guidePhone.trim());
  const guideComplete = hasGuide;

  let guideSummary = '';
  let guideSummaryAr = '';
  if (!hasGuide) {
    guideSummary = 'No Egyptologist guide assigned';
    guideSummaryAr = 'لم يتم تعيين مرشد سياحي';
  } else if (!hasGuidePhone) {
    guideSummary = `${trip.guideName} assigned (Phone pending)`;
    guideSummaryAr = `تم تعيين المرشد: ${trip.guideName} (الهاتف غير مسجل)`;
  } else {
    guideSummary = `${trip.guideName} (${trip.guideLanguage || 'English'})`;
    guideSummaryAr = `المرشد: ${trip.guideName} (${trip.guideLanguage || 'الإنجليزية'})`;
  }

  checks.push({
    id: 'guides',
    label: 'Guide Assigned',
    labelAr: 'تعيين المرشد السياحي المرخص',
    isComplete: guideComplete,
    summary: guideSummary,
    summaryAr: guideSummaryAr,
    targetTab: 'guides',
    actionLabel: guideComplete ? 'Review Guide' : 'Assign Guide',
    actionLabelAr: guideComplete ? 'مراجعة المرشد' : 'تعيين مرشد',
  });

  // 4. Traveller Information Complete
  const passengers = trip.passengers || [];
  const hasPassengers = passengers.length > 0;
  const passengersWithNames = passengers.filter(p => p.name && p.name.trim());
  const guestsComplete = hasPassengers && passengersWithNames.length === passengers.length;

  let guestsSummary = '';
  let guestsSummaryAr = '';
  if (!hasPassengers) {
    guestsSummary = 'No travellers in manifest';
    guestsSummaryAr = 'كشف المسافرين فارغ';
  } else if (passengersWithNames.length < passengers.length) {
    guestsSummary = `${passengers.length - passengersWithNames.length} passenger name(s) missing`;
    guestsSummaryAr = `ينقص أسماء ${passengers.length - passengersWithNames.length} مسافر`;
  } else {
    guestsSummary = `${passengers.length} passenger name(s) verified`;
    guestsSummaryAr = `كشف المسافرين مكتمل (${passengers.length} مسافر)`;
  }

  checks.push({
    id: 'guests',
    label: 'Traveller Information Complete',
    labelAr: 'اكتمال بيانات المسافرين والغرف',
    isComplete: guestsComplete,
    summary: guestsSummary,
    summaryAr: guestsSummaryAr,
    targetTab: 'guests',
    actionLabel: guestsComplete ? 'View Guests' : 'Add Guest Names',
    actionLabelAr: guestsComplete ? 'عرض المسافرين' : 'تسجيل المسافرين',
  });

  // 5. Required Vouchers Generated
  const activeServices = (trip.services || []).filter(s => s.status !== 'Cancelled');
  let vouchersComplete = false;
  let vouchersSummary = '';
  let vouchersSummaryAr = '';

  if (activeServices.length === 0) {
    vouchersComplete = false;
    vouchersSummary = 'No services in itinerary';
    vouchersSummaryAr = 'لا توجد خدمات مضافة للرحلة';
  } else {
    const unrequested = activeServices.filter(s => s.status === 'To request');
    vouchersComplete = unrequested.length === 0;
    vouchersSummary = vouchersComplete
      ? `${activeServices.length} service vouchers ready`
      : `${unrequested.length} service(s) require voucher dispatch`;
    vouchersSummaryAr = vouchersComplete
      ? `جميع قسائم التشغيل جاهزة (${activeServices.length})`
      : `ينقص إصدار قسائم لـ ${unrequested.length} خدمة`;
  }

  checks.push({
    id: 'documents',
    label: 'Required Vouchers Generated',
    labelAr: 'إصدار قسائم التشغيل الرسمية',
    isComplete: vouchersComplete,
    summary: vouchersSummary,
    summaryAr: vouchersSummaryAr,
    targetTab: 'documents',
    actionLabel: vouchersComplete ? 'View Vouchers' : 'Generate Vouchers',
    actionLabelAr: vouchersComplete ? 'عرض القسائم' : 'إصدار القسائم',
  });

  const completedCount = checks.filter(c => c.isComplete).length;
  const score = Math.round((completedCount / checks.length) * 100);
  const isFullyReady = completedCount === checks.length;
  const missingCount = checks.length - completedCount;
  const nextRecommendedAction = checks.find(c => !c.isComplete);

  return {
    score,
    isFullyReady,
    checks,
    missingCount,
    nextRecommendedAction,
  };
}
