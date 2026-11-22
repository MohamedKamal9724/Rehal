export type UserRole = 'Owner' | 'Admin' | 'Sales Agent' | 'Operations' | 'Viewer' | 'Traveler';

export type UILanguage = 'en' | 'ar';
export type ProposalLanguage = 'en' | 'ar' | 'ru' | 'de' | 'es' | 'fr' | 'it';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'EGP' | 'RUB' | 'SAR';

export interface AgencyPhoto {
  id: string;
  url: string;
  caption: string;
  captionAr?: string;
  category: 'office' | 'fleet' | 'tours' | 'hotels';
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverImageUrl?: string;
  brandColors: {
    primary: string; // #44200F Espresso
    accent: string;  // #795037 Walnut
    gold: string;    // #C4A177 Champagne
  };
  defaultLanguage: UILanguage;
  defaultCurrency: Currency;
  hideNetCostsFromAgents: boolean;
  minMarginPercent: number;
  requireApprovalBelowMinMargin: boolean;
  defaultProposalTheme: 'classic' | 'modern' | 'luxury';
  quoteValidityDays: number;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  taxRegistrationNumber?: string;
  arabicName?: string;
  tourismLicenseNumber?: string;
  address?: string;
  commercialRegistry?: string;
  description?: string;
  descriptionAr?: string;
  galleryPhotos?: AgencyPhoto[];
  supportedLanguages?: string[];
  coveredDestinations?: string[];
  minGroupPax?: number;
  maxGroupPax?: number;
  guideRosterCount?: number;
  fleetDescription?: string;
  fleetDescriptionAr?: string;
  foundedYear?: number;
  enableHajjUmrah?: boolean;
  hajjUmrahSettings?: {
    portalLicenseNumber?: string;
    nusukAgentCode?: string;
    defaultProgramTier?: '5_star_luxury' | '4_star_classic' | 'economic_air' | 'deluxe_hajj';
    includeZamzamByDefault?: boolean;
    includeHaramainTrainByDefault?: boolean;
    allowDirectPilgrimBookings?: boolean;
  };
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
    swiftCode: string;
    branch: string;
  };
  bankWireDetails?: {
    bankName: string;
    swiftCode: string;
    ibanUsd: string;
    ibanEur: string;
    ibanEgp: string;
    beneficiaryName: string;
  };
  termsAndConditions?: string;
  paymentInstructionsText?: string;
  subscriptionPlan?: 'Solo' | 'Team' | 'Agency';
  monthlyQuoteLimit?: number;
  aiCreditsLimit?: number;
  aiCreditsUsed?: number;
  isPlatformVerified?: boolean;
  isDemo?: boolean;
  rating?: number;
  reviewCount?: number;
  completedTripsCount?: number;
  travelersCount?: number;
  fleetCount?: number;
  guideCount?: number;
  licenseNumber?: string;
  phone?: string;
  isDataReadinessComplete?: boolean;
  createdAt: string;
}

export interface AgencyDirectoryItem {
  id: string;
  name: string;
  arabicName: string;
  slug: string;
  logoUrl?: string;
  isDemo?: boolean;
  rating: number; // e.g. 4.96
  reviewCount: number; // e.g. 184
  tourismLicenseNumber: string; // e.g. EG-MOT-ClassA-8491
  licenseClass: 'Class A' | 'Class B';
  commercialRegistry: string;
  taxRegistrationNumber: string;
  address: string;
  addressAr?: string;
  governorates: string[];
  supportedLanguages: string[];
  minGroupPax: number;
  maxGroupPax: number;
  guideRosterCount: number;
  fleetCount: number;
  foundedYear: number;
  description: string;
  descriptionAr: string;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  brandColors: {
    primary: string;
    accent: string;
    gold: string;
  };
  samplePackageName: string;
  samplePackagePriceUsd: number;
  isVerified: boolean;
  coverImageUrl?: string;
  specialties: string[];
  specialtiesAr: string[];
}

export interface User {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: UserRole;
  language: UILanguage;
  status: 'active' | 'invited' | 'inactive';
  avatarUrl?: string;
  phone?: string;
  canViewNetCostsOverride?: boolean;
  customRoleId?: string;
  customJobTitleEn?: string;
  customJobTitleAr?: string;
}

export type PermissionLevel = 'none' | 'view' | 'edit';

export type OperationalSection = 
  | 'quotes'       // Quotations & Pricing Engine
  | 'inquiries'    // Client Inquiries & Inbox
  | 'rates'        // Supplier Rate Library
  | 'trips'        // Field Operations & Expeditions
  | 'vouchers'     // Operations Vouchers & Run Sheets
  | 'fleet'        // Transport & Chauffeur Fleet
  | 'guides'       // Licensed Tour Guides Roster
  | 'weather'      // Live Destination Weather & APIs
  | 'analytics'    // Operations Analytics
  | 'settings';    // Company Profile & Settings

export interface CustomStaffRole {
  id: string;
  workspaceId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  isSystem?: boolean;
  permissions: Record<OperationalSection, PermissionLevel>;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone?: string;
  customRoleId: string;
  customJobTitleEn?: string;
  customJobTitleAr?: string;
  status: 'active' | 'suspended';
  assignedSince: string;
}

export type SupplierType = 
  | 'Hotel'
  | 'Nile Cruise'
  | 'Transport'
  | 'Guide'
  | 'Attraction'
  | 'Restaurant'
  | 'Domestic Flight'
  | 'Visa/Services'
  | 'Other';

export interface Supplier {
  id: string;
  workspaceId: string;
  name: string;
  type: SupplierType;
  city: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  contractValidityStart: string;
  contractValidityEnd: string;
  rating?: number;
  isDemo?: boolean;
}

export type OccupancyBasis = 'per_person' | 'single' | 'double' | 'triple' | 'per_vehicle' | 'per_group';
export type NationalityTier = 'all' | 'foreign' | 'egyptian_arab' | 'arab' | 'egyptian' | 'student';
export type MealPlan = 'Room Only' | 'Bed & Breakfast' | 'Half Board' | 'Full Board' | 'All Inclusive' | 'None';

export interface Rate {
  id: string;
  workspaceId: string;
  supplierId: string;
  supplierName: string;
  serviceName: string;
  supplierType: SupplierType;
  city: string;
  seasonIds: string[];
  occupancyBasis: OccupancyBasis;
  paxTierMin?: number;
  paxTierMax?: number;
  mealPlan?: MealPlan;
  nationalityTier: NationalityTier;
  currency: Currency;
  netCost: number;
  validityStart: string;
  validityEnd: string;
  childDiscountPercent?: number; // e.g. 50% off for 6-11
  childFreeMaxAge?: number; // e.g. under 6 free
  singleSupplement?: number;
  peakSurcharge?: number;
  maxVehiclePax?: number;
  notes?: string;
  version: number;
  updatedAt: string;
  isDemo?: boolean;
}

export interface Season {
  id: string;
  workspaceId: string;
  name: string; // e.g. 'Low Summer', 'High Winter', 'Peak Christmas/NY', 'Ramadan'
  startDate: string;
  endDate: string;
  color: string;
}

export interface ExchangeRate {
  id: string;
  workspaceId: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  safetyBufferPercent: number; // e.g. 3% buffer
  lastUpdated: string;
  isStale?: boolean;
}

export type InquiryStatus = 'New' | 'In Progress' | 'Quoted' | 'Waiting' | 'Won' | 'Lost';
export type InquirySource = 'WhatsApp' | 'Email' | 'Web Form' | 'B2B Partner' | 'Phone' | 'Other';

export interface GroupComposition {
  adults: number;
  children: { age: number }[];
  infants: number;
}

export interface ParsedRequirements {
  destinationSummary?: string;
  hotelTier?: string;
  budgetTotal?: number;
  mealPlan?: string;
  travelerName?: string;
  nationality?: string;
  language?: ProposalLanguage;
  startDate?: string;
  endDate?: string;
  isFlexibleDates?: boolean;
  durationDays?: number;
  group: GroupComposition;
  cities: string[];
  hotelStarRating?: number;
  budgetAmount?: number;
  budgetCurrency?: Currency;
  interests: string[];
  specialRequests?: string;
  transportPreference?: string;
  flightNeeded?: boolean;
  urgency: 'Low' | 'Medium' | 'High';
  confidenceScores: Record<string, number>; // 0 to 1
  clarifyingQuestions?: string[];
  isConfirmedByAgent?: boolean;
}

export interface Inquiry {
  id: string;
  workspaceId: string;
  contactId?: string;
  travelerName: string;
  travelerEmail?: string;
  travelerPhone?: string;
  source: InquirySource;
  rawText: string;
  status: InquiryStatus;
  assignedAgentId: string;
  assignedAgentName: string;
  receivedAt: string;
  language: ProposalLanguage;
  requirements?: ParsedRequirements;
  isDemo?: boolean;
  slaMinutes: number;
}

export interface FXSnapshot {
  lockedAt: string;
  baseCurrency: 'EGP';
  safetyBufferPercent: number; // e.g., 0.03 (3%)
  ratesToEgp: Record<Currency, number>; // e.g., { EGP: 1, USD: 49.50, EUR: 54.20, GBP: 63.80, RUB: 0.52, SAR: 13.20 }
}

export interface RoomingAllocation {
  singleRooms: number;
  doubleRooms: number;
  tripleRooms: number;
  childrenAges: number[];
}

export interface QuoteLine {
  id: string;
  dayNumber: number;
  serviceId?: string;
  serviceName: string;
  supplierName?: string;
  supplierType: SupplierType;
  city: string;
  quantity: number;
  occupancyBasis: OccupancyBasis;
  unitCost: number;
  costCurrency: Currency;
  markupPercent: number;
  markupFixed: number;
  unitPrice: number;
  totalCostEgp: number;
  totalPriceEgp: number;
  totalPriceQuoteCurrency: number;
  status: 'OK' | 'Rate missing' | 'Overridden' | 'Expired rate';
  costCalculationNotes: string;
  // Audit enhancements
  pricingType?: 'per_person' | 'group';
  isManualOverride?: boolean;
  overrideLockedPax?: number;
  sellPriceOverride?: number;
  singleSupplement?: number;
  hasBlockingRate?: boolean;
  statusMessage?: string;
  occupancy?: OccupancyBasis | string;
}

export interface QuoteDay {
  dayNumber: number;
  date?: string;
  title: string;
  arabicTitle?: string;
  description: string;
  city: string;
  hotel?: string;
  hotelMealPlan?: string;
  lines: QuoteLine[];
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired';

export interface ProposalUpsell {
  id: string;
  title: string;
  arabicTitle?: string;
  city: string;
  description: string;
  price: number; // in quote targetCurrency
  priceBasis: 'per_person' | 'per_group';
  netCost?: number;
  category: 'Excursion' | 'VIP Service' | 'Dining' | 'Upgrade';
  badge?: string; // e.g. 'Most Popular', 'VIP Exclusive', 'Sunrise Flight'
  icon?: string;
  isSelected?: boolean;
}

export interface QuoteTotals {
  totalCost: number;
  totalSell: number;
  marginAmount: number;
  marginPct: number;
  perPersonSell?: number;
  totalMargin?: number;
  totalNet?: number;
  currencyBreakdown?: Partial<Record<Currency, number>>;
}

export interface Quote {
  id: string;
  workspaceId: string;
  quoteNumber: string; // e.g. DAL-2026-0042
  inquiryId?: string;
  title?: string;
  travelerName: string;
  travelerEmail?: string;
  travelerPhone?: string;
  travelerNationality?: string;
  version: number;
  status: QuoteStatus;
  targetCurrency: Currency;
  displayCurrency?: Currency;
  exchangeRateUsed?: number;
  safetyBufferPct?: number;
  targetMarginPct?: number;
  startDate: string;
  durationDays: number;
  group: GroupComposition;
  days: QuoteDay[];
  totalCostEgp: number;
  totalPriceEgp: number;
  totalPriceQuoteCurrency: number;
  marginPercent: number;
  totals?: QuoteTotals;
  inclusions?: string[];
  exclusions?: string[];
  paymentTerms?: string;
  cancellationPolicy?: string;
  validityDate?: string;
  b2bCommissionPercent?: number;
  validUntil: string;
  language: ProposalLanguage;
  assignedAgentId: string;
  assignedAgentName: string;
  internalNotes?: string;
  requiresAdminApproval?: boolean;
  adminApproved?: boolean;
  publicToken: string;
  publicTokenHash?: string;
  tokenRevoked?: boolean;
  viewCount: number;
  lastViewedAt?: string;
  upsells?: ProposalUpsell[];
  selectedUpsellIds?: string[];
  fxSnapshot?: FXSnapshot;
  rooming?: RoomingAllocation;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface ProposalViewEvent {
  id: string;
  quoteId: string;
  timestamp: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  timeSpentSeconds: number;
  sectionsViewed: string[];
  userAgent?: string;
}

export interface FollowUpTask {
  id: string;
  workspaceId: string;
  quoteId: string;
  inquiryId?: string;
  travelerName: string;
  travelerPhone?: string;
  triggerReason: string;
  status: 'Pending' | 'Completed' | 'Snoozed';
  done?: boolean;
  suggestedMessage: string;
  dueDate: string;
  isUrgent?: boolean;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'Inquiry' | 'Quote' | 'Rate' | 'Workspace' | 'User';
  entityId: string;
  details: string;
  timestamp: string;
}

export type VoucherStatus = 'Draft' | 'Dispatched' | 'Confirmed' | 'Voucher Issued';
export type VoucherCategory = 'hotel' | 'cruise' | 'transport' | 'guide' | 'excursion' | 'general';

export interface SupplierVoucher {
  id: string;
  voucherNumber: string;
  quoteId: string;
  tripId?: string;
  category: VoucherCategory;
  supplierType: SupplierType | string;
  supplierName: string;
  supplierContactPhone?: string;
  city: string;
  serviceTitle: string;
  serviceDescription?: string;
  serviceDate: string;
  endDate?: string;
  nightsCount?: number;
  dayNumbers: number[];
  
  // Specific logistics
  pickupTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  flightDetails?: string;
  vehicleCategory?: string;
  driverName?: string;
  driverPhone?: string;
  guideName?: string;
  guidePhone?: string;
  guideLanguage?: string;
  
  // Hospitality & rooming
  roomCount?: number;
  roomType?: string;
  mealPlan?: string;
  paxCount: number;
  leadGuestName: string;
  passengers: { name: string; type: string; room?: string; dietary?: string }[];
  
  // Confirmation & Notes
  confirmationNumber?: string;
  status: VoucherStatus;
  specialInstructions?: string;
  billingClause: string;
  dispatchedAt?: string;
  confirmedAt?: string;
  qrCodeToken?: string;
}

// Hajj & Umrah Domain Models
export type HajjUmrahTier = '5_star_luxury' | '4_star_classic' | 'economic_air' | 'deluxe_hajj';

export interface HajjUmrahPackage {
  id: string;
  name: string;
  arabicName: string;
  tier: HajjUmrahTier;
  seasonName: string;
  nightsMakkah: number;
  nightsMadinah: number;
  makkahHotel: string;
  makkahDistanceMeters: number;
  makkahView: 'Haram Front' | 'Kaaba Direct' | 'Ajyad / City';
  makkahMealPlan: MealPlan;
  madinahHotel: string;
  madinahDistanceMeters: number;
  madinahMealPlan: MealPlan;
  transportType: 'Haramain Train VIP + GMC' | 'Haramain Train Economy' | 'VIP Private Chauffeur' | 'Luxury Pilgrimage Coach';
  airlines: string;
  route: string;
  includesPortalBarcode: boolean;
  includesNusukPermits: boolean;
  includesZiyarat: boolean;
  includesZamzam: boolean;
  pricePerPersonDoubleSar: number;
  pricePerPersonQuadSar: number;
  pricePerPersonDoubleEgp: number;
  pricePerPersonQuadEgp: number;
  highlightsEn: string[];
  highlightsAr: string[];
}

export interface PilgrimBooking {
  id: string;
  workspaceId: string;
  packageId: string;
  packageName: string;
  travelerName: string;
  arabicName?: string;
  nationalIdOrPassport: string;
  phone: string;
  roomType: 'double' | 'triple' | 'quad';
  departureDate: string;
  returnDate: string;
  portalBarcodeStatus: 'Issued' | 'Pending Verification' | 'Under Review';
  portalBarcodeNumber?: string;
  nusukPermitDate?: string;
  rawdahSlotTime?: string;
  totalCostSar: number;
  totalCostEgp: number;
  paidAmountEgp: number;
  status: 'Confirmed' | 'Visa Issued' | 'In Progress' | 'Completed';
}


