import { operatorStorageKey, setOperatorScope, getOperatorScope } from './sessionScope';
import { Quote, HajjUmrahPackage, PilgrimBooking, Inquiry, FollowUpTask, Currency } from '../types';
import { getStoredExchangeRates } from './currencyService';

export type ServiceStatus = 'To request' | 'Requested' | 'Confirmed' | 'Reconfirmed' | 'Cancelled';
export type TripStatus = 
  | 'Preparing' 
  | 'Ready' 
  | 'In Progress' 
  | 'Operating' 
  | 'Planning' 
  | 'Confirmed' 
  | 'Completed' 
  | 'Cancelled';

export interface TripService {
  id: string;
  dayNumber: number;
  serviceName: string;
  supplierName: string;
  supplierType: string;
  city: string;
  status: ServiceStatus;
  confirmationNo: string;
  note: string;
  boardBasis?: string;
  roomType?: string;
  nightsCount?: number;
  pickupTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  billingTerms?: string;
  supplierPhone?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedVehiclePlate?: string;
  assignedVehicleType?: string;
  assignedGuideName?: string;
  assignedGuidePhone?: string;
  assignedGuideLanguage?: string;
  dispatchedAt?: string;
}
export interface TripPassenger {
  id: string;
  name: string;
  nationality: string;
  type: 'Adult' | 'Child' | 'Infant';
  room: string;
  dietary: string;
  personalCode?: string; // e.g. "GARCIA-01"
  phone?: string;
  seatNumber?: string;
}
export interface TripChecklistItem { id: string; label: string; done: boolean; }
export interface TripLogEntry { id: string; at: string; text: string; author?: string; }

export interface TripFile {
  id: string;
  quoteId: string;
  fileNumber: string;
  tourPasscode?: string; // Master Tour Group Code e.g. "RIHAL-7K28" or "EG-7842"
  passcodeDisabled?: boolean;
  assignedOperatorName?: string;
  notes?: string;
  travelerName: string;
  startDate: string;
  durationDays: number;
  status: TripStatus;
  isUmrah?: boolean;
  umrahPortalLicense?: string;
  nusukAgentCode?: string;
  arrival: { flight: string; date: string; time: string; airport: string; meetAndAssist: boolean };
  departure: { flight: string; date: string; time: string; airport: string };
  guideName: string; guidePhone: string; guideLanguage: string;
  guideLicense?: string;
  airportRepName?: string;
  airportRepPhone?: string;
  driverName: string; driverPhone: string; vehiclePlate: string; vehicleType: string;
  emergencyContact: string;
  services: TripService[];
  passengers: TripPassenger[];
  checklist: TripChecklistItem[];
  log: TripLogEntry[];
  updatedAt: string;
}

export interface SafeTravelerTripProjection {
  fileNumber: string;
  tourPasscode?: string;
  travelerName: string;
  startDate: string;
  durationDays: number;
  status: TripStatus;
  arrival: { flight: string; date: string; time: string; airport: string; meetAndAssist: boolean };
  departure: { flight: string; date: string; time: string; airport: string };
  guide: { name: string; phone: string; language: string };
  driver: { name: string; phone: string; vehicleType: string; vehiclePlate: string };
  emergencyContact: string;
  itinerary: {
    dayNumber: number;
    city: string;
    services: {
      serviceName: string;
      city: string;
      supplierType: string;
      confirmationNo: string;
    }[];
  }[];
  passengersCount: number;
  vouchers: {
    serviceName: string;
    supplierName: string;
    city: string;
    confirmationNo: string;
    dayNumber: number;
  }[];
}

export const CANONICAL_PASSCODE_ALIASES = new Set([
  'EG-CAI-7491',
  'EG-LXR-9281',
  'RIHAL-842A',
  'TRIP-2026-0104',
]);

export const CANONICAL_AL_FUTTAIM_TRIP: TripFile = {
  id: 'trip-royal-nile-104',
  quoteId: 'quote-104',
  fileNumber: 'TRIP-2026-0104',
  tourPasscode: 'EG-CAI-7491',
  passcodeDisabled: false,
  assignedOperatorName: 'Mohamed Ali',
  travelerName: 'Al-Futtaim Royal Delegation (وفد الفطيم الملكي)',
  startDate: '2026-11-20',
  durationDays: 7,
  status: 'Operating',
  arrival: {
    flight: 'EK 927 (Emirates First Class)',
    date: '2026-11-20',
    time: '10:30',
    airport: 'Cairo International Airport (CAI) — VIP Lounge',
    meetAndAssist: true,
  },
  departure: {
    flight: 'EK 924 (Emirates First Class)',
    date: '2026-11-27',
    time: '19:45',
    airport: 'Cairo International Airport (CAI) — Terminal 2 VIP',
  },
  guideName: 'Sherif Al-Muniri (أ. شريف المنيري)',
  guidePhone: '+20 100 555 0198',
  guideLanguage: 'Arabic / English',
  guideLicense: 'EGT-LUX-4920',
  airportRepName: 'Kareem El-Shenawy (كريم الشناوي)',
  airportRepPhone: '+20 100 412 8890',
  driverName: 'Capt. Mahmoud El-Masry (كابتن محمود المصري)',
  driverPhone: '+20 100 882 4190',
  vehiclePlate: 'س ي ا ٩١٤ - مصر',
  vehicleType: 'Mercedes-Benz V-Class VIP (2026)',
  emergencyContact: '+20 100 999 0000',
  services: [
    {
      id: 'svc-104-hotel-cai',
      dayNumber: 1,
      serviceName: 'Four Seasons Hotel Cairo at Nile Plaza — 2x Royal Nile View Suites (2 Nights)',
      supplierName: 'Four Seasons Hotel Cairo at Nile Plaza',
      supplierType: 'Hotel',
      city: 'Cairo',
      status: 'Confirmed',
      confirmationNo: 'FS-CAI-88412',
      boardBasis: 'BB (Bed & Gourmet Breakfast)',
      roomType: '2x Royal Nile View Suites (King + Twin)',
      nightsCount: 2,
      pickupTime: '14:00 Check-in (Early VIP Access Guaranteed)',
      pickupLocation: '1089 Corniche El Nil, Garden City, Cairo',
      dropoffLocation: 'Private Nile Terrace Check-in Desk',
      billingTerms: 'Full Account to RIHAL / QuoteDesk Master Ledger (Include Extras)',
      supplierPhone: '+20 2 2791 7000',
      note: 'VIP fruit basket, fresh Arabian dates, and butler service confirmed. Early check-in at 11:30 AM.',
      dispatchedAt: '2026-11-10T09:30:00Z',
    },
    {
      id: 'svc-104-trf-cai',
      dayNumber: 1,
      serviceName: 'Cairo International Airport VIP Lounge & Fleet Transfer to Four Seasons',
      supplierName: 'RIHAL Executive Fleet Egypt',
      supplierType: 'Transport',
      city: 'Cairo',
      status: 'Confirmed',
      confirmationNo: 'CAI-VIP-302',
      pickupTime: '10:30 AM',
      pickupLocation: 'Cairo International Airport (CAI) — VIP Lounge Gate',
      dropoffLocation: 'Four Seasons Hotel Cairo at Nile Plaza',
      billingTerms: 'RIHAL Owned Fleet — Pre-Allocated',
      supplierPhone: '+20 100 882 4190',
      assignedDriverName: 'Capt. Mahmoud El-Masry (كابتن محمود المصري)',
      assignedDriverPhone: '+20 100 882 4190',
      assignedVehiclePlate: 'س ي ا ٩١٤ - مصر',
      assignedVehicleType: 'Mercedes-Benz V-Class VIP (2026)',
      assignedGuideName: 'Kareem El-Shenawy (Airport VIP Representative)',
      assignedGuidePhone: '+20 100 412 8890',
      assignedGuideLanguage: 'Arabic / English',
      note: 'Separate luggage van arranged. Cold towels, Evian water & onboard Wi-Fi active.',
      dispatchedAt: '2026-11-10T10:15:00Z',
    },
    {
      id: 'svc-104-tour-giza',
      dayNumber: 2,
      serviceName: 'Private Giza Plateau, Great Sphinx Enclosure & Grand Egyptian Museum (GEM) Royal Wing',
      supplierName: 'Ministry of Tourism & Antiquities VIP Desk',
      supplierType: 'Activity',
      city: 'Giza',
      status: 'Reconfirmed',
      confirmationNo: 'GEM-VIP-114',
      pickupTime: '08:30 AM',
      pickupLocation: 'Four Seasons Hotel Cairo Main Lobby',
      dropoffLocation: 'Grand Egyptian Museum VIP Gate & Mena House Khufu View Lounge',
      billingTerms: 'Pre-paid Electronic Permits Issued',
      supplierPhone: '+20 2 3531 7344',
      assignedDriverName: 'Capt. Mahmoud El-Masry (كابتن محمود المصري)',
      assignedDriverPhone: '+20 100 882 4190',
      assignedVehiclePlate: 'س ي ا ٩١٤ - مصر',
      assignedVehicleType: 'Mercedes-Benz V-Class VIP (2026)',
      assignedGuideName: 'Sherif Al-Muniri (أ. شريف المنيري)',
      assignedGuidePhone: '+20 100 555 0198',
      assignedGuideLanguage: 'Arabic / English',
      note: 'Includes private curator access at GEM and reserved Pyramid-view lunch table at 9 Pyramids Lounge.',
      dispatchedAt: '2026-11-11T11:00:00Z',
    },
    {
      id: 'svc-104-hotel-lxr',
      dayNumber: 3,
      serviceName: 'Sofitel Winter Palace Luxor — 2x Royal Garden & Nile Suites (1 Night Pre-Cruise)',
      supplierName: 'Sofitel Winter Palace Luxor',
      supplierType: 'Hotel',
      city: 'Luxor',
      status: 'Confirmed',
      confirmationNo: 'SWP-LXR-55109',
      boardBasis: 'HB (Breakfast & 1886 Royal Dining Dinner)',
      roomType: '2x Historic Wing Suites',
      nightsCount: 1,
      pickupTime: '12:30 PM Check-in after MS 062 Morning Flight',
      pickupLocation: 'Corniche El Nile Street, East Bank, Luxor',
      dropoffLocation: 'Royal Wing Reception',
      billingTerms: 'Full Account to RIHAL Master Ledger',
      supplierPhone: '+20 95 238 0422',
      note: 'Evening horse-drawn caleche & private dining reservation at 1886 Restaurant at 20:30.',
      dispatchedAt: '2026-11-11T14:20:00Z',
    },
    {
      id: 'svc-104-tour-karnak',
      dayNumber: 3,
      serviceName: 'Luxor East Bank: Karnak Temple Complex & Illuminated Luxor Temple Tour',
      supplierName: 'Upper Egypt Heritage Operations',
      supplierType: 'Activity',
      city: 'Luxor',
      status: 'Confirmed',
      confirmationNo: 'LXR-KRK-409',
      pickupTime: '15:30 PM',
      pickupLocation: 'Sofitel Winter Palace Luxor Promenade',
      dropoffLocation: 'Karnak Avenue of Sphinxes & Luxor Temple',
      billingTerms: 'Pre-paid VIP Entry Permits',
      supplierPhone: '+20 95 237 2110',
      assignedDriverName: 'Capt. Hassan El-Qenaoui (كابتن حسن القناوي)',
      assignedDriverPhone: '+20 109 334 7120',
      assignedVehiclePlate: 'ص ق ر ٤١٢ - مصر',
      assignedVehicleType: 'Toyota Coaster VIP Saloon',
      assignedGuideName: 'Sherif Al-Muniri (أ. شريف المنيري)',
      assignedGuidePhone: '+20 100 555 0198',
      assignedGuideLanguage: 'Arabic / English',
      note: 'Includes private sunset access to Hypostyle Hall and Avenue of Sphinxes.',
      dispatchedAt: '2026-11-12T08:00:00Z',
    },
    {
      id: 'svc-104-cruise-embark',
      dayNumber: 4,
      serviceName: 'Sanctuary Sun Boat IV — 3-Night Luxury Nile Cruise Embarkation & West Bank Royal Tombs',
      supplierName: 'Sanctuary Retreats Nile Cruises (Sanctuary Sun Boat IV)',
      supplierType: 'Cruise',
      city: 'Luxor',
      status: 'Confirmed',
      confirmationNo: 'SSB-NILE-4402',
      boardBasis: 'FB+ (Full Board Gourmet Dining & Private Deck)',
      roomType: '2x Presidential Nile Deck Suites',
      nightsCount: 3,
      pickupTime: '07:30 AM West Bank Tour / 12:30 PM Cruise Embarkation',
      pickupLocation: 'Sofitel Winter Palace Luxor -> Valley of the Kings -> Sanctuary Private Dock',
      dropoffLocation: 'Sanctuary Sun Boat IV Private Mooring, Luxor',
      billingTerms: 'Full Account to RIHAL Master Ledger',
      supplierPhone: '+20 95 237 4400',
      assignedDriverName: 'Capt. Hassan El-Qenaoui (كابتن حسن القناوي)',
      assignedDriverPhone: '+20 109 334 7120',
      assignedVehiclePlate: 'ص ق ر ٤١٢ - مصر',
      assignedVehicleType: 'Toyota Coaster VIP Saloon',
      assignedGuideName: 'Sherif Al-Muniri (أ. شريف المنيري)',
      assignedGuidePhone: '+20 100 555 0198',
      assignedGuideLanguage: 'Arabic / English',
      note: 'Includes Valley of the Kings (Tutankhamun & Seti I VIP tickets), Hatshepsut Temple & Colossi of Memnon before boarding Sanctuary Sun Boat IV.',
      dispatchedAt: '2026-11-12T12:00:00Z',
    },
    {
      id: 'svc-104-cruise-sail',
      dayNumber: 5,
      serviceName: 'Sanctuary Sun Boat IV — Nile Sailing Luxor to Aswan via Edfu (Temple of Horus) & Kom Ombo',
      supplierName: 'Sanctuary Retreats Nile Cruises (Sanctuary Sun Boat IV)',
      supplierType: 'Cruise',
      city: 'Edfu & Kom Ombo',
      status: 'Confirmed',
      confirmationNo: 'SSB-SAIL-5503',
      boardBasis: 'FB+ (Full Board & Upper Deck Afternoon Tea)',
      roomType: '2x Presidential Nile Deck Suites',
      nightsCount: 1,
      pickupTime: '08:00 AM Edfu Temple / 16:30 PM Kom Ombo Double Temple',
      pickupLocation: 'Sanctuary Sun Boat IV Private Gangway',
      dropoffLocation: 'Edfu Temple of Horus & Kom Ombo Sobek Sanctuary',
      billingTerms: 'Included in Cruise Charter Package',
      supplierPhone: '+20 95 237 4400',
      assignedGuideName: 'Sherif Al-Muniri (أ. شريف المنيري)',
      assignedGuidePhone: '+20 100 555 0198',
      assignedGuideLanguage: 'Arabic / English',
      note: 'Esna Lock transit, private golf buggy transfer at Edfu Temple of Horus, sunset visit to Kom Ombo Temple & Crocodile Museum.',
      dispatchedAt: '2026-11-12T12:30:00Z',
    },
    {
      id: 'svc-104-tour-aswan',
      dayNumber: 6,
      serviceName: 'Aswan Royal Program: Private Charter to Abu Simbel, Philae Temple & Sunset Nile Felucca',
      supplierName: 'Sanctuary Sun Boat IV & Aswan VIP Aviation',
      supplierType: 'Activity',
      city: 'Aswan',
      status: 'Confirmed',
      confirmationNo: 'ASW-VIP-6604',
      boardBasis: 'FB+ (Captain Farewell Gala Dinner Aboard Sanctuary Sun Boat IV)',
      roomType: '2x Presidential Nile Deck Suites',
      nightsCount: 1,
      pickupTime: '06:30 AM Abu Simbel Flight / 13:30 PM Philae Island / 17:00 PM Sunset Felucca',
      pickupLocation: 'Sanctuary Sun Boat IV Aswan Corniche Mooring',
      dropoffLocation: 'Abu Simbel Sun Temples, Agilkia Island & Elephantine Island',
      billingTerms: 'Pre-paid VIP Aviation & Sanctuary Charter',
      supplierPhone: '+20 97 231 5500',
      assignedDriverName: 'Capt. Tarek El-Nubi (كابتن طارق النوبي)',
      assignedDriverPhone: '+20 106 771 9200',
      assignedVehiclePlate: 'أ س و ٢١٨ - مصر',
      assignedVehicleType: 'Mercedes-Benz V-Class VIP',
      assignedGuideName: 'Sherif Al-Muniri (أ. شريف المنيري)',
      assignedGuidePhone: '+20 100 555 0198',
      assignedGuideLanguage: 'Arabic / English',
      note: 'Morning flight to Abu Simbel (Great Temple of Ramesses II & Nefertari), motorboat to Philae Temple of Isis, private sunset felucca around Elephantine Island.',
      dispatchedAt: '2026-11-13T09:00:00Z',
    },
    {
      id: 'svc-104-dep-cai',
      dayNumber: 7,
      serviceName: 'Sanctuary Sun Boat IV Disembarkation, Domestic Business Flight (ASW-CAI) & VIP International Departure',
      supplierName: 'EgyptAir Business & RIHAL Executive Fleet',
      supplierType: 'Transport',
      city: 'Aswan / Cairo',
      status: 'Confirmed',
      confirmationNo: 'CAI-DEP-7705',
      pickupTime: '09:00 AM Disembarkation / 11:15 AM Flight MS 085 / 19:45 PM EK 924 Departure',
      pickupLocation: 'Sanctuary Sun Boat IV Aswan Dock -> Aswan Airport (ASW)',
      dropoffLocation: 'Cairo International Airport (CAI) — Terminal 2 First Class Lounge',
      billingTerms: 'RIHAL Executive Fleet & Pre-ticketed Business Class',
      supplierPhone: '+20 100 882 4190',
      assignedDriverName: 'Capt. Mahmoud El-Masry (كابتن محمود المصري)',
      assignedDriverPhone: '+20 100 882 4190',
      assignedVehiclePlate: 'س ي ا ٩١٤ - مصر',
      assignedVehicleType: 'Mercedes-Benz V-Class VIP (2026)',
      assignedGuideName: 'Sherif Al-Muniri (أ. شريف المنيري)',
      assignedGuidePhone: '+20 100 555 0198',
      assignedGuideLanguage: 'Arabic / English',
      note: 'Smooth disembarkation after breakfast on Sanctuary Sun Boat IV, fast-track transfer via MS 085 to Cairo, and VIP Lounge assistance for Emirates EK 924.',
      dispatchedAt: '2026-11-13T15:00:00Z',
    },
  ],
  passengers: [
    { id: 'pax-1', name: 'H.E. Tariq Al-Futtaim', nationality: 'UAE', type: 'Adult', room: 'Suite 1 (King)', dietary: 'Halal Gourmet / No Shellfish', personalCode: 'FUTTAIM-01', phone: '+971 50 441 9000' },
    { id: 'pax-2', name: 'Sheikha Maryam Al-Futtaim', nationality: 'UAE', type: 'Adult', room: 'Suite 1 (King)', dietary: 'Halal Gourmet', personalCode: 'FUTTAIM-02', phone: '+971 50 441 9001' },
    { id: 'pax-3', name: 'Rashid Al-Futtaim', nationality: 'UAE', type: 'Adult', room: 'Suite 2 (Twin)', dietary: 'None', personalCode: 'FUTTAIM-03' },
    { id: 'pax-4', name: 'Noora Al-Futtaim', nationality: 'UAE', type: 'Adult', room: 'Suite 2 (Twin)', dietary: 'Gluten-Free Options', personalCode: 'FUTTAIM-04' },
  ],
  checklist: [
    { id: 'chk-1', label: 'Passenger names and nationalities collected for all travelers', done: true },
    { id: 'chk-2', label: 'Visa / entry requirements checked with the traveler', done: true },
    { id: 'chk-3', label: 'Arrival flight details received and airport meet & assist booked', done: true },
    { id: 'chk-4', label: 'All hotel bookings confirmed and rooming list sent to hotels', done: true },
    { id: 'chk-5', label: 'Nile cruise cabins allocated and embarkation time confirmed', done: true },
    { id: 'chk-6', label: 'Domestic flight tickets issued and names match passports', done: true },
    { id: 'chk-7', label: 'Vehicle and driver assigned for every transfer and touring day', done: true },
    { id: 'chk-8', label: 'Licensed Egyptologist guide assigned (language matches traveler)', done: true },
    { id: 'chk-9', label: 'Entrance tickets / timed-entry slots arranged where needed', done: true },
    { id: 'chk-10', label: 'Meals, dietary needs and special requests passed to suppliers', done: true },
    { id: 'chk-11', label: 'Vouchers sent to suppliers and traveler', done: true },
    { id: 'chk-12', label: 'Guide and driver briefed with manifest and emergency contacts', done: true },
    { id: 'chk-13', label: 'Traveler welcome message and WhatsApp contact shared', done: true },
    { id: 'chk-14', label: 'All services reconfirmed 48 hours before arrival', done: true },
    { id: 'chk-15', label: 'Departure transfer reconfirmed', done: true },
    { id: 'chk-16', label: 'Post-trip feedback requested', done: false },
  ],
  log: [
    { id: 'log-1', at: '2026-11-12T09:30:00Z', text: 'Hotel & VIP Transport vouchers issued and reconfirmed across Cairo, Luxor & Sanctuary Sun Boat IV.', author: 'Mohamed Ali' },
  ],
  updatedAt: '2026-11-15T15:00:00Z',
};

/**
 * Projects a TripFile into a strictly restricted traveler view.
 * Guarantees that internal costs, margins, supplier contract rates,
 * internal notes, and staff permissions are NEVER exposed to the traveler.
 */
export function projectTripForTraveler(trip: TripFile): SafeTravelerTripProjection {
  const dayMap = new Map<number, { serviceName: string; city: string; supplierType: string; confirmationNo: string }[]>();
  
  for (const s of trip.services || []) {
    if (s.status === 'Cancelled') continue;
    const dayList = dayMap.get(s.dayNumber) || [];
    dayList.push({
      serviceName: s.serviceName,
      city: s.city,
      supplierType: s.supplierType,
      confirmationNo: s.confirmationNo,
    });
    dayMap.set(s.dayNumber, dayList);
  }

  const daysSorted = Array.from(dayMap.keys()).sort((a, b) => a - b);
  const itinerary = daysSorted.map(dayNum => ({
    dayNumber: dayNum,
    city: dayMap.get(dayNum)?.[0]?.city || 'Egypt',
    services: dayMap.get(dayNum) || [],
  }));

  const vouchers = (trip.services || [])
    .filter(s => s.status === 'Confirmed' || s.status === 'Reconfirmed' || s.confirmationNo)
    .map(s => ({
      serviceName: s.serviceName,
      supplierName: s.supplierName,
      city: s.city,
      confirmationNo: s.confirmationNo,
      dayNumber: s.dayNumber,
    }));

  return {
    fileNumber: trip.fileNumber,
    tourPasscode: trip.tourPasscode,
    travelerName: trip.travelerName,
    startDate: trip.startDate,
    durationDays: trip.durationDays,
    status: trip.status,
    arrival: trip.arrival,
    departure: trip.departure,
    guide: {
      name: trip.guideName,
      phone: trip.guidePhone,
      language: trip.guideLanguage,
    },
    driver: {
      name: trip.driverName,
      phone: trip.driverPhone,
      vehicleType: trip.vehicleType,
      vehiclePlate: trip.vehiclePlate,
    },
    emergencyContact: trip.emergencyContact,
    itinerary,
    passengersCount: trip.passengers?.length || 1,
    vouchers,
  };
}

export function findTripOrGuestByCode(code: string): { trip: TripFile; passenger?: TripPassenger } | null {
  if (!code || !code.trim()) return null;
  const loaded = loadTrips();
  const scope = getOperatorScope();
  const allowCanonicalFallback =
    !scope || ['ws-default', 'ws-demo', 'comp_bluenile_01'].includes(scope.companyId);
  const trips =
    allowCanonicalFallback &&
    !loaded.some(t => t.id === CANONICAL_AL_FUTTAIM_TRIP.id || t.fileNumber === CANONICAL_AL_FUTTAIM_TRIP.fileNumber)
      ? [...loaded, CANONICAL_AL_FUTTAIM_TRIP]
      : loaded;
  const cleanCode = code.trim().toUpperCase();

  for (const t of trips) {
    if (t.passcodeDisabled) continue;
    const isCanonicalTrip = t.id === CANONICAL_AL_FUTTAIM_TRIP.id || t.fileNumber === 'TRIP-2026-0104';
    if (isCanonicalTrip && CANONICAL_PASSCODE_ALIASES.has(cleanCode)) {
      return { trip: t };
    }
    if (t.tourPasscode && t.tourPasscode.toUpperCase() === cleanCode) {
      return { trip: t };
    }
    if (t.fileNumber && t.fileNumber.toUpperCase() === cleanCode) {
      return { trip: t };
    }
    const pax = t.passengers?.find(p => p.personalCode && p.personalCode.toUpperCase() === cleanCode);
    if (pax) {
      return { trip: t, passenger: pax };
    }
  }
  return null;
}

export interface OperationalKpiSummary {
  bookedRevenueEgp: number;
  pipelineValueEgp: number;
  totalPortfolioValueEgp: number;
  acceptedQuotesCount: number;
  openQuotesCount: number;
  activePipelineQuotesCount: number;
  draftQuotesCount: number;
  sentQuotesCount: number;
  rejectedOrExpiredQuotesCount: number;
  totalQuotesCount: number;
  conversionRatePct: number;
  totalExpectedProfitEgp: number;
  bookedProfitEgp: number;
  avgMarginPct: number;
  activeTripsCount: number;
  completedTripsCount: number;
  totalTripsCount: number;
  totalTravelersCount: number;
  issuedVouchersCount: number;
  confirmedServicesCount: number;
  totalServicesCount: number;
  openInquiriesCount: number;
  quotedInquiriesCount: number;
  totalInquiriesCount: number;
  openFollowUpsCount: number;
  pendingFollowUpsCount: number;
}

export function computeOperationalKpis(params: {
  quotes: Quote[];
  inquiries: Inquiry[];
  trips?: TripFile[];
  followUps?: FollowUpTask[];
}): OperationalKpiSummary {
  const quotes = params.quotes || [];
  const inquiries = params.inquiries || [];
  const trips = params.trips || loadTrips();
  const followUps = params.followUps || [];

  const fxRates = getStoredExchangeRates();
  const toEgp = (amount: number, currency?: string): number => {
    if (!amount) return 0;
    const curr = (currency || 'EGP') as Currency;
    if (curr === 'EGP') return amount;
    const rate = fxRates[curr]?.rateToEgp || 50.4;
    return amount * rate;
  };

  const getQuoteSellEgp = (q: Quote) => {
    if (q.totalPriceEgp && q.totalPriceEgp > 0) return Math.round(q.totalPriceEgp);
    const rawSell = q.totals?.totalSell ?? q.totalPriceQuoteCurrency ?? 0;
    const curr = q.displayCurrency || q.targetCurrency || 'EGP';
    return Math.round(toEgp(rawSell, curr));
  };
  const getQuoteCostEgp = (q: Quote) => {
    if (q.totalCostEgp && q.totalCostEgp > 0) return Math.round(q.totalCostEgp);
    const rawCost = q.totals?.totalCost ?? 0;
    const curr = q.displayCurrency || q.targetCurrency || 'EGP';
    return Math.round(toEgp(rawCost, curr));
  };
  const getQuoteProfitEgp = (q: Quote) => {
    const sellEgp = getQuoteSellEgp(q);
    const costEgp = getQuoteCostEgp(q);
    if (costEgp > 0) return Math.max(0, sellEgp - costEgp);
    const curr = q.displayCurrency || q.targetCurrency || 'EGP';
    const rawMargin = q.totals?.marginAmount ?? q.totals?.totalMargin ?? 0;
    return Math.round(toEgp(rawMargin, curr));
  };
  const getQuoteMarginPct = (q: Quote) => Number(q.totals?.marginPct ?? q.marginPercent ?? 0);

  const acceptedQuotes = quotes.filter(q => q.status === 'Accepted');
  const sentQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Viewed');
  const draftQuotes = quotes.filter(q => q.status === 'Draft');
  const openQuotes = quotes.filter(q => q.status === 'Draft' || q.status === 'Sent' || q.status === 'Viewed');
  const rejectedOrExpiredQuotes = quotes.filter(q => q.status === 'Declined' || q.status === 'Expired');
  const activeOrAcceptedQuotes = quotes.filter(q => q.status !== 'Declined' && q.status !== 'Expired');

  const bookedRevenueEgp = acceptedQuotes.reduce((sum, q) => sum + getQuoteSellEgp(q), 0);
  const pipelineValueEgp = openQuotes.reduce((sum, q) => sum + getQuoteSellEgp(q), 0);
  const totalPortfolioValueEgp = bookedRevenueEgp + pipelineValueEgp;

  const bookedProfitEgp = acceptedQuotes.reduce((sum, q) => sum + getQuoteProfitEgp(q), 0);
  const totalExpectedProfitEgp = activeOrAcceptedQuotes.reduce((sum, q) => sum + getQuoteProfitEgp(q), 0);
  const avgMarginPct = activeOrAcceptedQuotes.length > 0
    ? Math.round((activeOrAcceptedQuotes.reduce((sum, q) => sum + getQuoteMarginPct(q), 0) / activeOrAcceptedQuotes.length) * 10) / 10
    : 0;

  const conversionRatePct = quotes.length > 0
    ? Math.round((acceptedQuotes.length / quotes.length) * 100)
    : 0;

  const activeTrips = trips.filter(t => t.status !== 'Cancelled' && t.status !== 'Completed');
  const completedTrips = trips.filter(t => t.status === 'Completed');

  let issuedVouchersCount = 0;
  let totalServicesCount = 0;
  let tripTravelersCount = 0;

  for (const t of trips) {
    if (t.status === 'Cancelled') continue;
    tripTravelersCount += t.passengers?.length || 0;
    for (const s of t.services || []) {
      if (s.status === 'Cancelled') continue;
      totalServicesCount++;
      if (s.status === 'Confirmed' || s.status === 'Reconfirmed' || Boolean(s.confirmationNo && s.confirmationNo.trim())) {
        issuedVouchersCount++;
      }
    }
  }

  const quoteTravelersCount = acceptedQuotes.reduce(
    (sum, q) => sum + (q.group?.adults || 0) + (q.group?.children?.length || 0) + (q.group?.infants || 0),
    0
  );

  const openInquiriesCount = inquiries.filter(i => i.status === 'New' || i.status === 'In Progress').length;
  const quotedInquiriesCount = inquiries.filter(i => i.status === 'Quoted' || i.status === 'Won').length;
  const openFollowUpsCount = followUps.filter(f => !f.done && f.status !== 'Completed').length;

  return {
    bookedRevenueEgp,
    pipelineValueEgp,
    totalPortfolioValueEgp,
    acceptedQuotesCount: acceptedQuotes.length,
    openQuotesCount: openQuotes.length,
    activePipelineQuotesCount: openQuotes.length,
    draftQuotesCount: draftQuotes.length,
    sentQuotesCount: sentQuotes.length,
    rejectedOrExpiredQuotesCount: rejectedOrExpiredQuotes.length,
    totalQuotesCount: quotes.length,
    conversionRatePct,
    totalExpectedProfitEgp,
    bookedProfitEgp,
    avgMarginPct,
    activeTripsCount: activeTrips.length,
    completedTripsCount: completedTrips.length,
    totalTripsCount: trips.length,
    totalTravelersCount: Math.max(tripTravelersCount, quoteTravelersCount),
    issuedVouchersCount,
    confirmedServicesCount: issuedVouchersCount,
    totalServicesCount,
    openInquiriesCount,
    quotedInquiriesCount,
    totalInquiriesCount: inquiries.length,
    openFollowUpsCount,
    pendingFollowUpsCount: openFollowUpsCount,
  };
}

const KEY = 'qde_trip_files';
const uid = () => Math.random().toString(36).slice(2, 10);

export const CHECKLIST_TEMPLATE = [
  'Passenger names and nationalities collected for all travelers',
  'Visa / entry requirements checked with the traveler',
  'Arrival flight details received and airport meet & assist booked',
  'All hotel bookings confirmed and rooming list sent to hotels',
  'Nile cruise cabins allocated and embarkation time confirmed',
  'Domestic flight tickets issued and names match passports',
  'Vehicle and driver assigned for every transfer and touring day',
  'Licensed Egyptologist guide assigned (language matches traveler)',
  'Entrance tickets / timed-entry slots arranged where needed',
  'Meals, dietary needs and special requests passed to suppliers',
  'Vouchers sent to suppliers and traveler',
  'Guide and driver briefed with manifest and emergency contacts',
  'Traveler welcome message and WhatsApp contact shared',
  'All services reconfirmed 48 hours before arrival',
  'Departure transfer reconfirmed',
  'Post-trip feedback requested',
];

function getTripStorageKey(): string | null {
  if (!getOperatorScope()) return null;
  try {
    return operatorStorageKey(KEY);
  } catch {
    return null;
  }
}

export function loadTrips(): TripFile[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const key = getTripStorageKey();
    if (!key) return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return (saved as TripFile[]).map(t => {
      if (t.id === CANONICAL_AL_FUTTAIM_TRIP.id || t.fileNumber === CANONICAL_AL_FUTTAIM_TRIP.fileNumber) {
        const hasFullWeek = (t.durationDays || 0) >= 7 && (t.services?.length || 0) >= 9;
        const needsDateUpgrade = !t.startDate || t.startDate === '2026-05-12';
        if (!hasFullWeek || needsDateUpgrade || t.tourPasscode === 'RIHAL-842A' || t.quoteId === 'quote-demo-104') {
          return {
            ...CANONICAL_AL_FUTTAIM_TRIP,
            ...t,
            quoteId: 'quote-104',
            startDate: needsDateUpgrade ? CANONICAL_AL_FUTTAIM_TRIP.startDate : t.startDate,
            arrival: needsDateUpgrade ? CANONICAL_AL_FUTTAIM_TRIP.arrival : t.arrival,
            durationDays: 7,
            tourPasscode: 'EG-CAI-7491',
            departure: needsDateUpgrade ? CANONICAL_AL_FUTTAIM_TRIP.departure : t.departure,
            services: (t.services?.length || 0) >= 9 ? t.services : CANONICAL_AL_FUTTAIM_TRIP.services,
            checklist: (t.checklist && t.checklist.length >= 16) ? t.checklist : CANONICAL_AL_FUTTAIM_TRIP.checklist,
          };
        }
      }
      return t;
    });
  } catch {
    return [];
  }
}

export function saveTrips(trips: TripFile[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    const key = getTripStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(trips));
  } catch {
    // ignore storage quota errors
  }
}

export function createTripFromQuote(q: Quote, count: number): TripFile {
  const services: TripService[] = [];
  q.days.forEach(d => d.lines.forEach(l => services.push({
    id: uid(), dayNumber: d.dayNumber || l.dayNumber, serviceName: l.serviceName,
    supplierName: l.supplierName || '', supplierType: l.supplierType, city: l.city || d.city,
    status: 'To request', confirmationNo: '', note: '',
  })));

  // Include confirmed client VIP upsells & add-ons
  if (q.upsells && q.selectedUpsellIds && q.selectedUpsellIds.length > 0) {
    const selectedSet = new Set(q.selectedUpsellIds);
    q.upsells.filter(u => selectedSet.has(u.id)).forEach(u => {
      const dayNum = u.city.toLowerCase() === 'luxor' ? 3 : u.city.toLowerCase() === 'aswan' ? 4 : 2;
      services.push({
        id: uid(),
        dayNumber: dayNum,
        serviceName: `★ [VIP Add-on] ${u.title}`,
        supplierName: `${u.city} Luxury Partner`,
        supplierType: u.category || 'Other',
        city: u.city,
        status: 'To request',
        confirmationNo: '',
        note: u.description || '',
      });
    });
  }
  const prefix = (q.travelerName.split(' ')[0] || 'GUEST').slice(0, 5).toUpperCase();
  const codeSeed = Math.random().toString(36).substring(2, 6).toUpperCase();
  const tourPasscode = `RIHAL-${codeSeed}`;

  const passengers: TripPassenger[] = [];
  let pIdx = 1;
  for (let i = 0; i < q.group.adults; i++) {
    passengers.push({ 
      id: uid(), 
      name: i === 0 ? q.travelerName : '', 
      nationality: q.travelerNationality || '', 
      type: 'Adult', 
      room: `Room ${Math.ceil(pIdx / 2)}`, 
      dietary: '',
      personalCode: `${prefix}-${String(pIdx).padStart(2, '0')}`
    });
    pIdx++;
  }
  q.group.children.forEach(() => {
    passengers.push({ 
      id: uid(), 
      name: '', 
      nationality: q.travelerNationality || '', 
      type: 'Child', 
      room: `Room ${Math.ceil(pIdx / 2)}`, 
      dietary: '',
      personalCode: `${prefix}-${String(pIdx).padStart(2, '0')}`
    });
    pIdx++;
  });
  for (let i = 0; i < q.group.infants; i++) {
    passengers.push({ 
      id: uid(), 
      name: '', 
      nationality: q.travelerNationality || '', 
      type: 'Infant', 
      room: '', 
      dietary: '',
      personalCode: `${prefix}-${String(pIdx).padStart(2, '0')}`
    });
    pIdx++;
  }

  return {
    id: uid(), quoteId: q.id, fileNumber: `TRIP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
    tourPasscode,
    travelerName: q.travelerName, startDate: q.startDate, durationDays: q.durationDays, status: 'Preparing',
    assignedOperatorName: q.assignedAgentName || 'Tour Operations Desk',
    arrival: { flight: '', date: q.startDate, time: '', airport: 'Cairo (CAI)', meetAndAssist: true },
    departure: { flight: '', date: '', time: '', airport: '' },
    guideName: '', guidePhone: '', guideLanguage: (q.language || 'English').toUpperCase(),
    driverName: '', driverPhone: '', vehiclePlate: '', vehicleType: '', emergencyContact: '',
    services, passengers,
    checklist: CHECKLIST_TEMPLATE.map(label => ({ id: uid(), label, done: false })),
    log: [
      {
        id: uid(),
        at: new Date().toISOString(),
        text: `Trip initialized from Quote #${q.quoteNumber || q.id} for ${q.travelerName}`,
        author: q.assignedAgentName || 'Operations Desk',
      }
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function createTripFromHajjPackage(_pkg: HajjUmrahPackage, _pilgrims: PilgrimBooking[], _count: number, _settings?: unknown): TripFile {
  throw new Error('Religious travel booking is not configured; no trip created.');
}

export const newId = uid;
