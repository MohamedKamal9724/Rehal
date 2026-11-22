import React, { useState } from 'react';
import { 
  Moon, Sparkles, Building2, Train, Compass, Check, 
  MapPin, Clock, ShieldCheck, FileText, ArrowRight, ArrowLeft,
  Search, Calculator, HeartHandshake, CheckCircle2, Award, 
  Filter, Layers, Star, Info, Users, Plane, FileCheck2, 
  AlertCircle, X, ChevronRight, Ticket, Phone, ExternalLink, 
  Calendar, CheckCircle, RefreshCw, LayoutDashboard
} from 'lucide-react';
import { 
  Workspace, User as UserType, UILanguage, Quote 
} from '../../types';
import { 
  SAMPLE_HAJJ_UMRAH_PACKAGES, 
  HajjUmrahPresetPackage,
  convertPresetToQuote
} from '../../lib/hajjUmrahData';
import { HajjPackageCard } from './components/HajjPackageCard';
import { UmrahCostCalculator } from './components/UmrahCostCalculator';
import { SacredZiyaratDirectory } from './components/SacredZiyaratDirectory';
import { UmrahRitualGuide } from './components/UmrahRitualGuide';
import { PilgrimageLogisticsView } from './components/PilgrimageLogisticsView';
import { HajjUmrahOverviewPanel } from './components/HajjUmrahOverviewPanel';
import { RitualStepsProgressPanel } from './components/RitualStepsProgressPanel';
import { SectionHelpTrigger } from '../common/SectionHelpTrigger';

export interface PilgrimageGroup {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  packageType: string;
  packageTypeAr: string;
  pilgrimCount: number;
  currentLocation: 'makkah' | 'madinah' | 'haramain_transit';
  currentHotelEn: string;
  currentHotelAr: string;
  hotelZone: string;
  hotelZoneAr: string;
  assignedGuideEn: string;
  assignedGuideAr: string;
  guidePhone: string;
  dates: string;
  status: 'active_in_makkah' | 'active_in_madinah' | 'in_transit' | 'departing_soon';
  zamzamQuotaDelivered: boolean;
}

export interface PilgrimageVisaApplication {
  id: string;
  pilgrimNameEn: string;
  pilgrimNameAr: string;
  passportNumber: string;
  nationalityEn: string;
  nationalityAr: string;
  groupCode: string;
  nusukRef: string;
  submissionDate: string;
  status: 'awaiting_ministry' | 'biometrics_pending' | 'ready_to_issue' | 'issued';
  packageTier: string;
}

export interface PilgrimageFlight {
  id: string;
  flightNumber: string;
  carrier: string;
  carrierAr: string;
  departureAirport: string;
  departureCityEn: string;
  departureCityAr: string;
  arrivalAirport: string;
  arrivalCityEn: string;
  arrivalCityAr: string;
  departureDateTime: string;
  hoursUntilDeparture: number;
  terminal: string;
  gate: string;
  passengersCount: number;
  groupCodes: string[];
  airportCoordinatorEn: string;
  airportCoordinatorAr: string;
  coordinatorPhone: string;
  status: 'on_schedule' | 'boarding_ready' | 'delayed' | 'counter_open';
  zamzamAllowanceVerified: boolean;
}

const INITIAL_PILGRIMAGE_GROUPS: PilgrimageGroup[] = [
  {
    id: 'grp-01',
    code: 'HU-MK-801',
    nameEn: 'Royal Clock Tower Elite Delegation',
    nameAr: 'وفد النخبة الملكية — أبراج الساعة',
    packageType: '5-Star Royal VIP',
    packageTypeAr: 'خمس نجوم ملكي VIP',
    pilgrimCount: 28,
    currentLocation: 'makkah',
    currentHotelEn: 'Fairmont Makkah Clock Royal Tower',
    currentHotelAr: 'فيرمونت برج ساعة مكة الملكي',
    hotelZone: 'Central Haram Plaza (0m)',
    hotelZoneAr: 'ساحات الحرم المركزية (٠م)',
    assignedGuideEn: 'Sheikh Dr. Tariq Al-Sayed',
    assignedGuideAr: 'فضيلة د. طارق السيد',
    guidePhone: '+966 50 148 2901',
    dates: '12 - 21 Rajab',
    status: 'active_in_makkah',
    zamzamQuotaDelivered: true,
  },
  {
    id: 'grp-02',
    code: 'HU-MK-803',
    nameEn: 'Jabal Omar Serenity Caravan',
    nameAr: 'قافلة جبل عمر للسكينة والروحانية',
    packageType: '5-Star Luxury',
    packageTypeAr: 'خمس نجوم فاخر',
    pilgrimCount: 36,
    currentLocation: 'makkah',
    currentHotelEn: 'Address Jabal Omar Makkah',
    currentHotelAr: 'العنوان جبل عمر مكة المكرمة',
    hotelZone: 'Ibrahim Al-Khalil St (180m)',
    hotelZoneAr: 'شارع إبراهيم الخليل (١٨٠م)',
    assignedGuideEn: 'Ustadh Mahmoud Radwan',
    assignedGuideAr: 'أستاذ محمود رضوان',
    guidePhone: '+966 54 229 3810',
    dates: '14 - 23 Rajab',
    status: 'active_in_makkah',
    zamzamQuotaDelivered: true,
  },
  {
    id: 'grp-03',
    code: 'HU-MD-802',
    nameEn: 'Al-Rawdah Al-Sharifa Delegation',
    nameAr: 'وفد الروضة الشريفة — المدينة المنورة',
    packageType: '5-Star Luxury',
    packageTypeAr: 'خمس نجوم فاخر',
    pilgrimCount: 32,
    currentLocation: 'madinah',
    currentHotelEn: 'The Oberoi Madinah',
    currentHotelAr: 'فندق أوبروي المدينة المنورة',
    hotelZone: 'Northern Haram Piazza (20m)',
    hotelZoneAr: 'المنطقة الشمالية المركزية (٢٠م)',
    assignedGuideEn: 'Sheikh Ahmad Al-Qadi',
    assignedGuideAr: 'الشيخ أحمد القاضي',
    guidePhone: '+966 56 712 9044',
    dates: '10 - 19 Rajab',
    status: 'active_in_madinah',
    zamzamQuotaDelivered: false,
  },
  {
    id: 'grp-04',
    code: 'HU-MD-804',
    nameEn: 'Madinah Peace & Ziyarat Group',
    nameAr: 'فوج طيبة الطيبة والزيارات النبوية',
    packageType: '4-Star Classic',
    packageTypeAr: 'أربع نجوم كلاسيكي',
    pilgrimCount: 24,
    currentLocation: 'madinah',
    currentHotelEn: 'Madinah Hilton',
    currentHotelAr: 'هيلتون المدينة المنورة',
    hotelZone: 'King Fahd Gate (70m)',
    hotelZoneAr: 'باب الملك فهد (٧٠م)',
    assignedGuideEn: 'Ustadh Hani Al-Banna',
    assignedGuideAr: 'أستاذ هاني البنا',
    guidePhone: '+966 50 882 1744',
    dates: '11 - 20 Rajab',
    status: 'active_in_madinah',
    zamzamQuotaDelivered: false,
  },
  {
    id: 'grp-05',
    code: 'HU-TR-806',
    nameEn: 'Haramain Express Transit Cohort',
    nameAr: 'فوج قطار الحرمين السريع في الانتقال',
    packageType: '5-Star Luxury',
    packageTypeAr: 'خمس نجوم فاخر',
    pilgrimCount: 18,
    currentLocation: 'haramain_transit',
    currentHotelEn: 'Transit to Makkah Swissôtel',
    currentHotelAr: 'انتقال بالقطار إلى سويس أوتيل مكة',
    hotelZone: 'Haramain Train HHR 07 (300 km/h)',
    hotelZoneAr: 'قطار الحرمين رقم ٠٧ (سرعة ٣٠٠ كم/س)',
    assignedGuideEn: 'Mutawwif Omar Al-Ghamdi',
    assignedGuideAr: 'المطوف عمر الغامدي',
    guidePhone: '+966 55 930 1822',
    dates: '13 - 22 Rajab',
    status: 'in_transit',
    zamzamQuotaDelivered: false,
  },
  {
    id: 'grp-06',
    code: 'HU-MK-807',
    nameEn: 'Ajyad Executive Family Group',
    nameAr: 'فوج أجياد العائلي التنفيذي',
    packageType: '5-Star Royal VIP',
    packageTypeAr: 'خمس نجوم ملكي VIP',
    pilgrimCount: 10,
    currentLocation: 'makkah',
    currentHotelEn: 'Raffles Makkah Palace',
    currentHotelAr: 'قصر رافلز مكة المكرمة',
    hotelZone: 'King Abdulaziz Gate (0m)',
    hotelZoneAr: 'مواجهة باب الملك عبد العزيز (٠م)',
    assignedGuideEn: 'Dr. Youssef Kamel',
    assignedGuideAr: 'د. يوسف كامل',
    guidePhone: '+966 50 331 4480',
    dates: '15 - 24 Rajab',
    status: 'active_in_makkah',
    zamzamQuotaDelivered: true,
  },
];

const INITIAL_VISA_APPLICATIONS: PilgrimageVisaApplication[] = [
  {
    id: 'visa-01',
    pilgrimNameEn: 'Ibrahim Abdel-Rahman Mansour',
    pilgrimNameAr: 'إبراهيم عبد الرحمن منصور',
    passportNumber: 'A28910482',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصري',
    groupCode: 'HU-MK-808',
    nusukRef: 'NSK-2026-881920',
    submissionDate: 'Today, 08:30 AM',
    status: 'awaiting_ministry',
    packageTier: '5-Star Royal VIP',
  },
  {
    id: 'visa-02',
    pilgrimNameEn: 'Fatima El-Zahraa Mostafa',
    pilgrimNameAr: 'فاطمة الزهراء مصطفى',
    passportNumber: 'A31849201',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصرية',
    groupCode: 'HU-MK-808',
    nusukRef: 'NSK-2026-881921',
    submissionDate: 'Today, 08:35 AM',
    status: 'awaiting_ministry',
    packageTier: '5-Star Royal VIP',
  },
  {
    id: 'visa-03',
    pilgrimNameEn: 'Mohamed Tarek Al-Husseini',
    pilgrimNameAr: 'محمد طارق الحسيني',
    passportNumber: 'A19382014',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصري',
    groupCode: 'HU-MD-809',
    nusukRef: 'NSK-2026-881934',
    submissionDate: 'Today, 09:15 AM',
    status: 'awaiting_ministry',
    packageTier: '5-Star Luxury',
  },
  {
    id: 'visa-04',
    pilgrimNameEn: 'Nouran Samir Al-Shazly',
    pilgrimNameAr: 'نوران سمير الشاذلي',
    passportNumber: 'A24910283',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصرية',
    groupCode: 'HU-MD-809',
    nusukRef: 'NSK-2026-881935',
    submissionDate: 'Today, 09:20 AM',
    status: 'awaiting_ministry',
    packageTier: '5-Star Luxury',
  },
  {
    id: 'visa-05',
    pilgrimNameEn: 'Dr. Khaled Mahmoud Zaki',
    pilgrimNameAr: 'د. خالد محمود زكي',
    passportNumber: 'A40192837',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصري',
    groupCode: 'HU-MK-810',
    nusukRef: 'NSK-2026-882001',
    submissionDate: 'Today, 10:00 AM',
    status: 'biometrics_pending',
    packageTier: '4-Star Classic',
  },
  {
    id: 'visa-06',
    pilgrimNameEn: 'Hoda Abdel-Aziz Radwan',
    pilgrimNameAr: 'هدى عبد العزيز رضوان',
    passportNumber: 'A39019283',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصرية',
    groupCode: 'HU-MK-810',
    nusukRef: 'NSK-2026-882002',
    submissionDate: 'Today, 10:05 AM',
    status: 'biometrics_pending',
    packageTier: '4-Star Classic',
  },
  {
    id: 'visa-07',
    pilgrimNameEn: 'Ahmed Essam El-Din',
    pilgrimNameAr: 'أحمد عصام الدين',
    passportNumber: 'A18294022',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصري',
    groupCode: 'HU-MK-810',
    nusukRef: 'NSK-2026-882003',
    submissionDate: 'Today, 10:10 AM',
    status: 'biometrics_pending',
    packageTier: '4-Star Classic',
  },
  {
    id: 'visa-08',
    pilgrimNameEn: 'Layla Badr Al-Deen',
    pilgrimNameAr: 'ليلى بدر الدين',
    passportNumber: 'A20194832',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصرية',
    groupCode: 'HU-MK-810',
    nusukRef: 'NSK-2026-882004',
    submissionDate: 'Today, 10:15 AM',
    status: 'biometrics_pending',
    packageTier: '4-Star Classic',
  },
  {
    id: 'visa-09',
    pilgrimNameEn: 'Hassan Ali El-Sayed',
    pilgrimNameAr: 'حسن علي السيد',
    passportNumber: 'A55829103',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصري',
    groupCode: 'HU-MK-811',
    nusukRef: 'NSK-2026-881640',
    submissionDate: 'Yesterday, 04:00 PM',
    status: 'ready_to_issue',
    packageTier: '5-Star Luxury',
  },
  {
    id: 'visa-10',
    pilgrimNameEn: 'Samira Tawfiq Othman',
    pilgrimNameAr: 'سميرة توفيق عثمان',
    passportNumber: 'A55829104',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصرية',
    groupCode: 'HU-MK-811',
    nusukRef: 'NSK-2026-881641',
    submissionDate: 'Yesterday, 04:05 PM',
    status: 'ready_to_issue',
    packageTier: '5-Star Luxury',
  },
  {
    id: 'visa-11',
    pilgrimNameEn: 'Amr Mamdouh Fawzy',
    pilgrimNameAr: 'عمرو ممدوح فوزي',
    passportNumber: 'A38192049',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصري',
    groupCode: 'HU-MD-812',
    nusukRef: 'NSK-2026-881702',
    submissionDate: 'Yesterday, 02:20 PM',
    status: 'awaiting_ministry',
    packageTier: '5-Star Royal VIP',
  },
  {
    id: 'visa-12',
    pilgrimNameEn: 'Zeinab Farouk Helmy',
    pilgrimNameAr: 'زينب فاروق حلمي',
    passportNumber: 'A38192050',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصرية',
    groupCode: 'HU-MD-812',
    nusukRef: 'NSK-2026-881703',
    submissionDate: 'Yesterday, 02:25 PM',
    status: 'awaiting_ministry',
    packageTier: '5-Star Royal VIP',
  },
  {
    id: 'visa-13',
    pilgrimNameEn: 'Sherif Wagdy Bayoumi',
    pilgrimNameAr: 'شريف وجدي بيومي',
    passportNumber: 'A49102938',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصري',
    groupCode: 'HU-MK-813',
    nusukRef: 'NSK-2026-881788',
    submissionDate: 'Yesterday, 06:10 PM',
    status: 'awaiting_ministry',
    packageTier: 'Deluxe Hajj',
  },
  {
    id: 'visa-14',
    pilgrimNameEn: 'Mona Kamal Al-Gharably',
    pilgrimNameAr: 'منى كمال الغرابلي',
    passportNumber: 'A49102939',
    nationalityEn: 'Egyptian',
    nationalityAr: 'مصرية',
    groupCode: 'HU-MK-813',
    nusukRef: 'NSK-2026-881789',
    submissionDate: 'Yesterday, 06:15 PM',
    status: 'awaiting_ministry',
    packageTier: 'Deluxe Hajj',
  },
];

const INITIAL_PILGRIMAGE_FLIGHTS: PilgrimageFlight[] = [
  {
    id: 'flt-01',
    flightNumber: 'MS 671',
    carrier: 'EgyptAir',
    carrierAr: 'مصر للطيران',
    departureAirport: 'CAI',
    departureCityEn: 'Cairo International Airport',
    departureCityAr: 'مطار القاهرة الدولي (مبنى ۳)',
    arrivalAirport: 'JED',
    arrivalCityEn: 'King Abdulaziz Int. Airport, Jeddah (Hajj Terminal)',
    arrivalCityAr: 'مطار الملك عبد العزيز بجدة (صالة الحجاج)',
    departureDateTime: 'Tomorrow, 06:30 AM',
    hoursUntilDeparture: 14,
    terminal: 'Terminal 3',
    gate: 'G14',
    passengersCount: 42,
    groupCodes: ['HU-MK-808', 'HU-MK-810'],
    airportCoordinatorEn: 'Capt. Gamal Nader (Cairo Meet & Assist)',
    airportCoordinatorAr: 'كابتن جمال نادر (منسق مطار القاهرة)',
    coordinatorPhone: '+20 100 482 1920',
    status: 'counter_open',
    zamzamAllowanceVerified: true,
  },
  {
    id: 'flt-02',
    flightNumber: 'SV 312',
    carrier: 'Saudia',
    carrierAr: 'الخطوط السعودية',
    departureAirport: 'HBE',
    departureCityEn: 'Borg El Arab Airport, Alexandria',
    departureCityAr: 'مطار برج العرب الدولي، الإسكندرية',
    arrivalAirport: 'MED',
    arrivalCityEn: 'Prince Mohammad Bin Abdulaziz Airport, Madinah',
    arrivalCityAr: 'مطار الأمير محمد بن عبد العزيز، المدينة المنورة',
    departureDateTime: 'Thursday, 02:15 PM',
    hoursUntilDeparture: 36,
    terminal: 'Terminal 1',
    gate: 'B04',
    passengersCount: 28,
    groupCodes: ['HU-MD-809'],
    airportCoordinatorEn: 'Moataz Barakat (Alexandria Liaison)',
    airportCoordinatorAr: 'معتز بركات (مسؤول تفويج الإسكندرية)',
    coordinatorPhone: '+20 122 391 0492',
    status: 'on_schedule',
    zamzamAllowanceVerified: true,
  },
  {
    id: 'flt-03',
    flightNumber: 'SM 405',
    carrier: 'Air Cairo',
    carrierAr: 'إير كايرو',
    departureAirport: 'CAI',
    departureCityEn: 'Cairo International Airport',
    departureCityAr: 'مطار القاهرة الدولي (مبنى ۱)',
    arrivalAirport: 'JED',
    arrivalCityEn: 'King Abdulaziz Int. Airport, Jeddah',
    arrivalCityAr: 'مطار الملك عبد العزيز الدولي، جدة',
    departureDateTime: 'Friday, 11:45 PM',
    hoursUntilDeparture: 58,
    terminal: 'Terminal 1 Hall 4',
    gate: 'Gate 8',
    passengersCount: 34,
    groupCodes: ['HU-MK-811'],
    airportCoordinatorEn: 'Hossam Tawfiq (Air Operations)',
    airportCoordinatorAr: 'حسام توفيق (مشرف العمليات الجوية)',
    coordinatorPhone: '+20 111 829 4410',
    status: 'on_schedule',
    zamzamAllowanceVerified: true,
  },
];


interface HajjUmrahViewProps {
  workspace: Workspace;
  currentUser: UserType;
  uiLang: UILanguage;
  onToggleHajjUmrah: (enabled: boolean) => void;
  onProceedToQuote: (quote: Quote) => void;
  onNavigateToTrips?: () => void;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export const HajjUmrahView: React.FC<HajjUmrahViewProps> = ({
  workspace,
  currentUser,
  uiLang,
  onProceedToQuote,
  onNavigateToTrips,
  onNavigateTab
}) => {
  const isAr = uiLang === 'ar';
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'calculator' | 'ziyarat' | 'rituals' | 'logistics'>('overview');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Top-Level Operational Statistics Summary Row State
  const [groups, setGroups] = useState<PilgrimageGroup[]>(INITIAL_PILGRIMAGE_GROUPS);
  const [visas, setVisas] = useState<PilgrimageVisaApplication[]>(INITIAL_VISA_APPLICATIONS);
  const [flights, setFlights] = useState<PilgrimageFlight[]>(INITIAL_PILGRIMAGE_FLIGHTS);
  
  // Modal inspection dialog state
  const [activeStatModal, setActiveStatModal] = useState<'groups' | 'visas' | 'flights' | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [visaFilterStatus, setVisaFilterStatus] = useState<string>('all');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Derived Summary Figures
  const totalPilgrimsInGroups = groups.reduce((acc, g) => acc + g.pilgrimCount, 0);
  const makkahGroupsCount = groups.filter(g => g.currentLocation === 'makkah').length;
  const madinahGroupsCount = groups.filter(g => g.currentLocation === 'madinah').length;
  const transitGroupsCount = groups.filter(g => g.currentLocation === 'haramain_transit').length;

  const pendingVisas = visas.filter(v => v.status !== 'issued');
  const awaitingMinistryCount = visas.filter(v => v.status === 'awaiting_ministry').length;
  const biometricsPendingCount = visas.filter(v => v.status === 'biometrics_pending').length;
  const readyToIssueCount = visas.filter(v => v.status === 'ready_to_issue').length;

  const totalDepartingPassengers = flights.reduce((acc, f) => acc + f.passengersCount, 0);
  const closestFlight = flights[0]; // MS 671 in 14h

  // Operational action: Simulate Electronic Nusuk Approval (Demo Mode)
  const handleApproveVisa = (visaId: string) => {
    setVisas(prev => prev.map(v => v.id === visaId ? { ...v, status: 'issued' } : v));
    const target = visas.find(v => v.id === visaId);
    setNoticeMessage(
      isAr 
        ? `وضع تجريبي: تم تحديث حالة تأشيرة المعتمر (${target?.pilgrimNameAr || ''}) في المحاكي المحلي بنجاح.` 
        : `Demo Mode: Simulated Nusuk visa status updated locally for ${target?.pilgrimNameEn || ''}.`
    );
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Convert Nusuk Visa Queue item / cohort into a Sales Pipeline Quote
  const handleCreateQuoteFromVisa = (visa: PilgrimageVisaApplication) => {
    const matchedGroup = groups.find(g => g.code === visa.groupCode);
    const matchedPkg =
      SAMPLE_HAJJ_UMRAH_PACKAGES.find(p =>
        visa.packageTier.toLowerCase().includes('royal') || visa.packageTier.toLowerCase().includes('vip')
          ? p.tier === '5_star_vip'
          : visa.packageTier.toLowerCase().includes('4-star')
          ? p.tier === '4_star_classic'
          : p.tier === '5_star_luxury'
      ) || SAMPLE_HAJJ_UMRAH_PACKAGES[0];
    const leadName = matchedGroup
      ? `${isAr ? matchedGroup.nameAr : matchedGroup.nameEn} (${visa.groupCode})`
      : `${isAr ? visa.pilgrimNameAr : visa.pilgrimNameEn} (${visa.nusukRef})`;
    const paxCount = matchedGroup?.pilgrimCount || 2;
    const generated = convertPresetToQuote(matchedPkg, workspace, 'double', paxCount, leadName);
    generated.quoteNumber = `NSK-${visa.nusukRef.replace(/[^A-Z0-9]/gi, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;
    onProceedToQuote(generated);
  };

  // Operational action: Toggle Zamzam quota delivery
  const handleToggleZamzam = (groupId: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, zamzamQuotaDelivered: !g.zamzamQuotaDelivered } : g));
  };

  const filteredPackages = SAMPLE_HAJJ_UMRAH_PACKAGES.filter((pkg) => {
    const matchesTier = selectedTier === 'all' || pkg.tier === selectedTier;
    const matchesSearch = searchQuery.trim() === '' ||
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.arabicName.includes(searchQuery) ||
      pkg.makkahHotel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.makkahHotelAr.includes(searchQuery) ||
      pkg.madinahHotel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.madinahHotelAr.includes(searchQuery);
    return matchesTier && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* =========================================================================
          LIGHT HIJAZI IVORY & EMERALD HEADER WITH MASHRABIYA LINE ART
         ========================================================================= */}
      <div className="bg-gradient-to-br from-[#FAF8F5] via-[#FFFDF9] to-[#F3ECE1] text-[#44200F] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden border border-[#E5D5B5]">
        <SectionHelpTrigger
          sectionKey="hajj_hub"
          uiLang={uiLang}
          variant="gold"
          size="sm"
          pinned={true}
          label={isAr ? 'دليل المنظومة' : 'Desk Guide'}
          onNavigateTab={onNavigateTab}
        />

        {/* Subtle Mashrabiya & Islamic Arch Geometric Line Art Watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.14]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hajj-light-mashrabiya" width="76" height="76" patternUnits="userSpaceOnUse">
                <polygon
                  points="38,18 42,29 53,29 44,36 47,47 38,40 29,47 32,36 23,29 34,29"
                  fill="none"
                  stroke="#B8860B"
                  strokeWidth="0.9"
                />
                <rect x="26" y="26" width="24" height="24" fill="none" stroke="#C4A177" strokeWidth="0.6" />
                <rect x="26" y="26" width="24" height="24" fill="none" stroke="#C4A177" strokeWidth="0.6" transform="rotate(45 38 38)" />
                <circle cx="38" cy="38" r="19" fill="none" stroke="#B8860B" strokeWidth="0.5" strokeDasharray="2 2.5" />
                <path d="M0,38 L19,38 M57,38 L76,38 M38,0 L38,19 M38,57 L38,76" stroke="#C4A177" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hajj-light-mashrabiya)" />
          </svg>
        </div>

        {/* Soft Decorative Mihrab Arch Silhouette on the Side */}
        <div className={`absolute -bottom-8 ${isAr ? 'left-6' : 'right-6'} w-56 h-56 opacity-[0.08] pointer-events-none`}>
          <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 12 C55 48 32 88 32 140 L32 210 L168 210 L168 140 C168 88 145 48 100 12 Z" stroke="#8C6218" strokeWidth="4" />
            <path d="M100 28 C64 58 46 92 46 140 L46 210 L154 210 L154 140 C154 92 136 58 100 28 Z" stroke="#065F46" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Top Delicate Gold & Emerald Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#C4A177] via-[#059669] to-[#C4A177] opacity-80" />

        <div className="relative z-10 space-y-5">
          {/* Sacred Badges & Season Tag Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5D5B5]/80 pb-3.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Makkah Al-Mukarramah Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FDF8EE] border border-[#DFC48C] text-[#6E4B11] text-xs font-bold shadow-2xs">
                <span className="w-5 h-5 rounded-lg bg-[#F5E6C4] border border-[#D4AF37]/60 flex items-center justify-center text-[11px]">
                  🕋
                </span>
                <span>{isAr ? 'رحاب الحرم المكي الشريف' : 'Al-Masjid Al-Haram — Makkah'}</span>
              </div>

              {/* Madinah Al-Munawwarah Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                <span className="w-5 h-5 rounded-lg bg-emerald-100 border border-emerald-300/70 flex items-center justify-center text-[11px]">
                  🕌
                </span>
                <span>{isAr ? 'المسجد النبوي والروضة الشريفة' : 'Prophet’s Mosque — Madinah'}</span>
              </div>
            </div>

            {/* Nusuk & Season Badge */}
            <div className="inline-flex items-center gap-2 text-xs text-[#6E4B11] bg-white/90 px-3.5 py-1.5 rounded-xl border border-[#E5D5B5] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">{isAr ? 'محاكي نُسك (وضع تجريبي) · موسم ١٤٤٧ هـ' : 'Nusuk Demo Operations · 1447H'}</span>
            </div>
          </div>

          {/* Main Heading & Concise Subtitle */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <p className="text-xs font-serif font-bold text-[#8C6218] tracking-wide">
                {isAr ? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ · لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ' : 'In the Name of Allah · Labbayk Allahumma Labbayk'}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-[#44200F] tracking-tight leading-snug">
                {isAr ? 'بوابة إدارة رحلات الحج والعمرة والزيارات النبوية' : 'Hajj, Umrah & Sacred Ziyarat Operations'}
              </h1>
              <p className="text-xs sm:text-sm text-[#795037] leading-relaxed">
                {isAr
                  ? 'إدارة منظمة لبرامج الحج والعمرة، تسعير الفنادق المركزية بمكة والمدينة، متابعة تأشيرات نُسك، وتنسيق قطار الحرمين السريع وسقيا زمزم.'
                  : 'Organized pilgrimage management: central Makkah & Madinah hotels, instant package costing, Nusuk visa tracking, and Haramain high-speed rail.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('packages')}
                className="h-10 px-4 rounded-xl bg-white hover:bg-[#FAF5EB] text-[#44200F] border border-[#D8C39E] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#B8860B]" />
                <span>{isAr ? 'استعراض الباقات' : 'Browse Packages'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('calculator')}
                className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#9A6F1A] to-[#B8860B] hover:from-[#855E14] hover:to-[#9A6F1A] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>{isAr ? 'حاسبة عمرة فورية' : 'Quick Cost Calculator'}</span>
              </button>
            </div>
          </div>

          {/* Integrated Calm 4-Card Operational Summary Strip (Replaces Cluttered Duplicate Rows) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* KPI 1: Active Groups */}
            <button
              type="button"
              onClick={() => {
                setActiveStatModal('groups');
                setModalSearchQuery('');
              }}
              className="bg-white/95 hover:bg-white border border-[#E5D5B5] hover:border-[#B8860B] rounded-2xl p-3.5 text-start transition-all shadow-2xs hover:shadow-md group cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-[#795037]">
                    {isAr ? 'الأفواج النشطة بالحرمين' : 'Active Pilgrim Groups'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black font-mono text-[#44200F]">{groups.length}</span>
                  <span className="text-xs font-bold text-[#8C6218]">
                    ({totalPilgrimsInGroups} {isAr ? 'معتمر' : 'Pilgrims'})
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {isAr
                    ? `${makkahGroupsCount} بمكة · ${madinahGroupsCount} بالمدينة · ${transitGroupsCount} بالقطار`
                    : `${makkahGroupsCount} Makkah · ${madinahGroupsCount} Madinah`}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#FAF3E3] border border-[#E5D5B5] flex items-center justify-center text-[#8C6218] group-hover:bg-[#B8860B] group-hover:text-white transition-colors shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </button>

            {/* KPI 2: Pending Nusuk Visas */}
            <button
              type="button"
              onClick={() => {
                setActiveStatModal('visas');
                setModalSearchQuery('');
              }}
              className="bg-white/95 hover:bg-white border border-[#E5D5B5] hover:border-[#B8860B] rounded-2xl p-3.5 text-start transition-all shadow-2xs hover:shadow-md group cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[11px] font-bold text-[#795037]">
                    {isAr ? 'تأشيرات نُسك قيد الإجراء' : 'Nusuk Visa Queue'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black font-mono text-[#44200F]">{pendingVisas.length}</span>
                  <span className="text-xs font-bold text-amber-700">
                    {isAr ? `${readyToIssueCount} جاهز للإصدار` : `${readyToIssueCount} Ready`}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {isAr ? `${awaitingMinistryCount} بالوزارة · ${biometricsPendingCount} بصمة` : `${awaitingMinistryCount} Ministry · ${biometricsPendingCount} Bio`}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </button>

            {/* KPI 3: Upcoming Flights */}
            <button
              type="button"
              onClick={() => {
                setActiveStatModal('flights');
                setModalSearchQuery('');
              }}
              className="bg-white/95 hover:bg-white border border-[#E5D5B5] hover:border-[#B8860B] rounded-2xl p-3.5 text-start transition-all shadow-2xs hover:shadow-md group cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-[11px] font-bold text-[#795037]">
                    {isAr ? 'رحلات الطيران المغادرة' : 'Upcoming Flights'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black font-mono text-[#44200F]">{flights.length}</span>
                  <span className="text-xs font-bold text-sky-700">
                    ({totalDepartingPassengers} {isAr ? 'مسافر' : 'Pax'})
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block font-mono">
                  {closestFlight.carrier} {closestFlight.flightNumber} (-{closestFlight.hoursUntilDeparture}h)
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors shrink-0">
                <Plane className="w-4 h-4" />
              </div>
            </button>

            {/* KPI 4: Haramain Rail & Zamzam Quota */}
            <button
              type="button"
              onClick={() => setActiveTab('logistics')}
              className="bg-white/95 hover:bg-white border border-[#E5D5B5] hover:border-emerald-600 rounded-2xl p-3.5 text-start transition-all shadow-2xs hover:shadow-md group cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="text-[11px] font-bold text-[#795037]">
                    {isAr ? 'قطار الحرمين وسقيا زمزم' : 'Haramain Rail & Zamzam'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black font-mono text-[#065F46]">300</span>
                  <span className="text-xs font-bold text-[#065F46]">
                    {isAr ? 'كم/س · ٥ لتر زمزم' : 'km/h · 5L Zamzam'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {isAr ? 'ربط مباشر: مكة ⇄ جدة ⇄ المدينة' : 'Direct link: Makkah ⇄ Madinah'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors shrink-0">
                <Train className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Success / Action Notice Banner */}
      {noticeMessage && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{noticeMessage}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          ORGANIZED SUB-PAGES NAVIGATION TABS (CLEAN LIGHT SURFACE)
          ========================================================================= */}
      <div className="bg-white border border-[#EDE0CC] rounded-2xl p-2 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 py-0.5">
          {[
            { id: 'overview', icon: LayoutDashboard, labelAr: 'نظرة عامة والتشغيل', labelEn: 'Operations Overview' },
            { id: 'packages', icon: Building2, labelAr: 'برامج الحج والعمرة', labelEn: 'Hajj & Umrah Packages' },
            { id: 'calculator', icon: Calculator, labelAr: 'حاسبة تكلفة العمرة', labelEn: 'Cost Calculator' },
            { id: 'ziyarat', icon: Compass, labelAr: 'دليل وخريطة المزارات', labelEn: 'Ziyarat Sites & Map' },
            { id: 'rituals', icon: HeartHandshake, labelAr: 'تتبع مناسك الأفواج', labelEn: 'Ritual Progress' },
            { id: 'logistics', icon: Train, labelAr: 'قطار الحرمين وزمزم', labelEn: 'Rail & Zamzam Logistics' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`h-10 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#8C6218] to-[#B8860B] text-white shadow-xs'
                    : 'bg-transparent text-[#44200F] hover:bg-[#FAF7F2] hover:text-[#8C6218]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFF6D6]' : 'text-[#B8860B]'}`} />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Contextual Guidance Trigger for Active Sub-Tab */}
        <div className="shrink-0 ms-1 sm:ms-2">
          <SectionHelpTrigger
            sectionKey={
              activeTab === 'overview' ? 'hajj_overview' :
              activeTab === 'packages' ? 'hajj_packages' :
              activeTab === 'calculator' ? 'hajj_calculator' :
              activeTab === 'ziyarat' ? 'hajj_ziyarat_map' :
              activeTab === 'rituals' ? 'hajj_rituals' : 'hajj_logistics'
            }
            uiLang={uiLang}
            variant="gold"
            label={isAr ? 'دليل التبويب' : 'Tab Guide'}
            onNavigateTab={(tab, subTab) => {
              if (tab === 'hajj_umrah' && subTab) {
                setActiveTab(subTab as any);
              } else if (onNavigateTab) {
                onNavigateTab(tab, subTab);
              }
            }}
          />
        </div>
      </div>

      {/* =========================================================================
          TAB 0: OPERATIONS OVERVIEW & INTERACTIVE METRIC CARDS
         ========================================================================= */}
      {activeTab === 'overview' && (
        <HajjUmrahOverviewPanel
          uiLang={uiLang}
          groups={groups}
          visas={visas}
          flights={flights}
          onApproveVisa={handleApproveVisa}
          onCreateVisaQuote={handleCreateQuoteFromVisa}
          onOpenStatModal={(modal) => {
            setActiveStatModal(modal);
            setModalSearchQuery('');
          }}
          onSwitchTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* =========================================================================
          TAB 1: UMRAH PACKAGES (WITH INSTANT QUOTE CONVERTER)
         ========================================================================= */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          {/* Filters & Search Controls - Clean Light Ivory Bar */}
          <div className="bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] border border-[#E5D5B5] rounded-3xl p-5 sm:p-6 space-y-4 text-[#44200F] shadow-2xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              {/* Category Tier Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedTier('all')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center whitespace-nowrap shrink-0 ${
                    selectedTier === 'all'
                      ? 'bg-[#8C6218] text-white shadow-2xs'
                      : 'text-[#44200F] bg-white border border-[#EDE0CC] hover:border-[#B8860B]'
                  }`}
                >
                  {isAr ? 'كافة الباقات' : 'All Packages'}
                </button>
                <button
                  onClick={() => setSelectedTier('5_star_vip')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedTier === '5_star_vip'
                      ? 'bg-[#FDF4E0] text-[#7C5310] border border-[#B8860B] shadow-2xs'
                      : 'text-[#44200F] bg-white border border-[#EDE0CC] hover:border-[#B8860B]'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-[#B8860B] fill-[#B8860B] shrink-0" />
                  <span>{isAr ? 'النخبة الملكية VIP' : 'Royal VIP (Clock Tower)'}</span>
                </button>
                <button
                  onClick={() => setSelectedTier('5_star_luxury')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedTier === '5_star_luxury'
                      ? 'bg-[#FDF4E0] text-[#7C5310] border border-[#B8860B] shadow-2xs'
                      : 'text-[#44200F] bg-white border border-[#EDE0CC] hover:border-[#B8860B]'
                  }`}
                >
                  <span>{isAr ? '٥ نجوم جبل عمر' : '5-Star Luxury'}</span>
                </button>
                <button
                  onClick={() => setSelectedTier('4_star_classic')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center whitespace-nowrap shrink-0 ${
                    selectedTier === '4_star_classic'
                      ? 'bg-[#FAF3E3] text-[#44200F] border border-[#C4A177] shadow-2xs'
                      : 'text-[#44200F] bg-white border border-[#EDE0CC] hover:border-[#C4A177]'
                  }`}
                >
                  {isAr ? '٤ نجوم كلاسيكية اقتصادية' : '4-Star Classic'}
                </button>
                <button
                  onClick={() => setSelectedTier('deluxe_hajj')}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center whitespace-nowrap shrink-0 ${
                    selectedTier === 'deluxe_hajj'
                      ? 'bg-emerald-700 text-white border border-emerald-700 shadow-2xs'
                      : 'text-[#065F46] bg-emerald-50/70 border border-emerald-200 hover:border-emerald-500'
                  }`}
                >
                  {isAr ? 'الحج السياحي الفاخر' : 'Deluxe Hajj Program'}
                </button>
              </div>

              {/* Package Search */}
              <div className="relative w-full sm:w-64">
                <Search className={`w-4 h-4 text-[#B8860B] absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالفندق أو الاسم...' : 'Search hotel or package...'}
                  className={`w-full h-9 bg-white border border-[#DFC798] rounded-xl text-xs text-[#44200F] placeholder-[#9C7A54] focus:outline-none focus:ring-1 focus:ring-[#B8860B] focus:border-[#B8860B] ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>
            </div>

            <div className="text-xs text-[#795037] flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#EDE0CC] pt-3 relative z-10">
              <span>
                {isAr
                  ? `عرض ${filteredPackages.length} باقة مصممة وفق أحدث معايير مواسم الزيارة والعمرة المباركة.`
                  : `Showing ${filteredPackages.length} pilgrimage packages designed for the sacred season.`}
              </span>
              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                <span className="text-[11px] text-[#8C6218] font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>{isAr ? 'التحويل الفوري إلى عرض سعر رسمي للعميل بضغطة واحدة' : 'Instant 1-Click Quote Conversion'}</span>
                </span>
                <SectionHelpTrigger
                  sectionKey="hajj_packages"
                  uiLang={uiLang}
                  variant="gold"
                  size="sm"
                  onNavigateTab={onNavigateTab}
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <HajjPackageCard
                key={pkg.id}
                packageData={pkg}
                workspace={workspace}
                uiLang={uiLang}
                onProceedToQuote={onProceedToQuote}
              />
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: INTERACTIVE COST CALCULATOR
         ========================================================================= */}
      {activeTab === 'calculator' && (
        <UmrahCostCalculator
          workspace={workspace}
          uiLang={uiLang}
          onProceedToQuote={onProceedToQuote}
        />
      )}

      {/* =========================================================================
          TAB 3: SACRED SITES & ZIYARAT DIRECTORY
         ========================================================================= */}
      {activeTab === 'ziyarat' && (
        <SacredZiyaratDirectory
          uiLang={uiLang}
          onSelectSiteForItinerary={(site) => {
            setNoticeMessage(
              isAr
                ? `تمت إضافة مزار (${site.nameAr}) بنجاح إلى برنامج وتفويج الرحلة!`
                : `Added ${site.nameEn} to the pilgrimage itinerary and route schedule!`
            );
            setTimeout(() => setNoticeMessage(null), 4000);
          }}
        />
      )}

      {/* =========================================================================
          TAB 4: RITUAL STEPS CHECKLIST & LOCATION-SPECIFIC ADVICE
         ========================================================================= */}
      {activeTab === 'rituals' && (
        <RitualStepsProgressPanel
          uiLang={uiLang}
          groups={groups}
          onSwitchToZiyaratMap={() => setActiveTab('ziyarat')}
        />
      )}

      {/* =========================================================================
          TAB 5: HARAMAIN RAIL & ZAMZAM LOGISTICS
         ========================================================================= */}
      {activeTab === 'logistics' && (
        <PilgrimageLogisticsView
          uiLang={uiLang}
        />
      )}

      {/* =========================================================================
          INTERACTIVE INSPECTION MODALS FOR OPERATIONAL SUMMARY METRICS (LIGHT THEME)
         ========================================================================= */}

      {/* 1. ACTIVE PILGRIMAGE GROUPS MODAL */}
      {activeStatModal === 'groups' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#DFC798] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-[#44200F]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#EDE0CC] flex items-center justify-between bg-gradient-to-r from-[#FAF6EE] via-white to-[#F5EFE6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FDF4E0] border border-[#DFC798] flex items-center justify-center text-[#8C6218]">
                  <Users className="w-5 h-5 text-[#B8860B]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#44200F]">
                    {isAr ? 'سجل وفود وقوافل المعتمرين النشطة' : 'Active Pilgrimage Delegations & Rooming Roster'}
                  </h3>
                  <span className="text-xs text-[#795037]">
                    {groups.length} {isAr ? 'أفواج ميدانية' : 'Active Groups'} · {totalPilgrimsInGroups} {isAr ? 'معتمر مقيم' : 'Current Pilgrims'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveStatModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#EDE0CC] flex items-center justify-center text-[#795037] hover:text-[#44200F] hover:border-[#B8860B] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search and Filters */}
            <div className="p-4 border-b border-[#EDE0CC] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className={`w-4 h-4 text-[#B8860B] absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالكود أو الفندق أو المرشد...' : 'Filter group, hotel or guide...'}
                  className={`w-full py-1.5 bg-[#FAF8F5] border border-[#DFC798] rounded-xl text-xs text-[#44200F] placeholder-[#9C7A54] focus:outline-none focus:ring-1 focus:ring-[#B8860B] ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              <div className="text-xs text-[#795037] flex items-center gap-2">
                <span className="inline-flex items-center gap-1 font-bold text-[#8C6218]">
                  <Building2 className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>{isAr ? 'فنادق مركزية معتمدة بالحرمين' : 'Central Verified Hotels'}</span>
                </span>
              </div>
            </div>

            {/* Modal Body / Groups List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5">
              {groups
                .filter(g =>
                  modalSearchQuery.trim() === '' ||
                  g.code.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  g.nameEn.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  g.nameAr.includes(modalSearchQuery) ||
                  g.currentHotelEn.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  g.currentHotelAr.includes(modalSearchQuery) ||
                  g.assignedGuideEn.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  g.assignedGuideAr.includes(modalSearchQuery)
                )
                .map(group => {
                  const isMakkah = group.currentLocation === 'makkah';
                  const isMadinah = group.currentLocation === 'madinah';

                  return (
                    <div
                      key={group.id}
                      className="p-4 rounded-2xl bg-white border border-[#EDE0CC] hover:border-[#B8860B] transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#FAF3E3] pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-[#FDF4E0] border border-[#DFC798] text-[#7C5310]">
                            {group.code}
                          </span>
                          <h4 className="font-bold text-sm text-[#44200F]">
                            {isAr ? group.nameAr : group.nameEn}
                          </h4>
                        </div>

                        {/* Location Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isMakkah
                              ? 'bg-[#FDF4E0] text-[#7C5310] border-[#DFC798]'
                              : isMadinah
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-sky-50 text-sky-800 border-sky-200'
                          }`}>
                            {isMakkah ? (isAr ? '🕋 مكة المكرمة' : '🕋 Makkah Sanctuary') : isMadinah ? (isAr ? '🕌 المدينة المنورة' : '🕌 Madinah Munawwarah') : (isAr ? '🚄 قطار الحرمين السريع' : '🚄 Haramain Train Transit')}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#44200F] bg-[#FAF7F2] px-2.5 py-0.5 rounded-lg border border-[#EDE0CC]">
                            {group.pilgrimCount} {isAr ? 'معتمر' : 'Pilgrims'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-[#795037] block uppercase font-bold">{isAr ? 'فندق الإقامة والمسافة' : 'Assigned Hotel'}</span>
                          <p className="font-bold text-[#44200F]">{isAr ? group.currentHotelAr : group.currentHotelEn}</p>
                          <span className="text-[11px] text-[#8C6218] block font-medium">{isAr ? group.hotelZoneAr : group.hotelZone}</span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] text-[#795037] block uppercase font-bold">{isAr ? 'المطوف / المرشد الديني' : 'Spiritual Guide / Mutawwif'}</span>
                          <p className="font-bold text-[#44200F]">{isAr ? group.assignedGuideAr : group.assignedGuideEn}</p>
                          <span className="text-[11px] text-slate-500 font-mono block dir-ltr">{group.guidePhone}</span>
                        </div>

                        <div className="space-y-1 sm:text-end">
                          <span className="text-[10px] text-[#795037] block uppercase font-bold">{isAr ? 'حصة ماء زمزم المعتمدة' : 'Zamzam Sealed 5L'}</span>
                          <button
                            onClick={() => handleToggleZamzam(group.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer sm:ml-auto ${
                              group.zamzamQuotaDelivered
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{group.zamzamQuotaDelivered ? (isAr ? 'تم استلام الحصص' : 'Quota Delivered') : (isAr ? 'قيد التوزيع والتسليم' : 'Pending Delivery')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EDE0CC] bg-white flex items-center justify-between">
              <span className="text-xs text-[#795037]">
                {isAr ? 'بيانات تفويج تجريبية مهيأة لمحاكي نُسك' : 'Demo delegation roster (local preview state)'}
              </span>
              <button
                onClick={() => setActiveStatModal(null)}
                className="px-4 py-2 bg-[#8C6218] text-white font-bold text-xs rounded-xl hover:bg-[#734F10] transition cursor-pointer"
              >
                {isAr ? 'إغلاق السجل' : 'Close Roster'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PENDING VISA APPLICATIONS MODAL */}
      {activeStatModal === 'visas' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#DFC798] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-[#44200F]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#EDE0CC] flex items-center justify-between bg-gradient-to-r from-[#FAF6EE] via-white to-[#F5EFE6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FDF4E0] border border-[#DFC798] flex items-center justify-center text-[#8C6218]">
                  <FileCheck2 className="w-5 h-5 text-[#B8860B]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#44200F]">
                    {isAr ? 'إدارة ومتابعة تأشيرات منصة نُسك الإلكترونية' : 'Pending Nusuk Pilgrimage Visas & Approval Portal'}
                  </h3>
                  <span className="text-xs text-[#795037]">
                    {pendingVisas.length} {isAr ? 'تأشيرة قيد الإجراء والتدقيق' : 'Pending Verification & Issuance'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveStatModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#EDE0CC] flex items-center justify-center text-[#795037] hover:text-[#44200F] hover:border-[#B8860B] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search and Filters */}
            <div className="p-4 border-b border-[#EDE0CC] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className={`w-4 h-4 text-[#B8860B] absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث باسم المعتمر أو رقم الجواز أو مرجع نسك...' : 'Search pilgrim, passport or Nusuk ref...'}
                  className={`w-full py-1.5 bg-[#FAF8F5] border border-[#DFC798] rounded-xl text-xs text-[#44200F] placeholder-[#9C7A54] focus:outline-none focus:ring-1 focus:ring-[#B8860B] ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setVisaFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    visaFilterStatus === 'all'
                      ? 'bg-[#8C6218] text-white'
                      : 'bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC]'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'} ({visas.length})
                </button>
                <button
                  onClick={() => setVisaFilterStatus('awaiting_ministry')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    visaFilterStatus === 'awaiting_ministry'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isAr ? 'الوزارة' : 'Ministry'} ({awaitingMinistryCount})
                </button>
                <button
                  onClick={() => setVisaFilterStatus('biometrics_pending')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    visaFilterStatus === 'biometrics_pending'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}
                >
                  {isAr ? 'البصمة' : 'Biometrics'} ({biometricsPendingCount})
                </button>
                <button
                  onClick={() => setVisaFilterStatus('ready_to_issue')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    visaFilterStatus === 'ready_to_issue'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isAr ? 'جاهز للإصدار' : 'Ready'} ({readyToIssueCount})
                </button>
              </div>
            </div>

            {/* Modal Body / Visas Table */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              {visas
                .filter(v => {
                  const matchesFilter = visaFilterStatus === 'all' || v.status === visaFilterStatus;
                  const matchesSearch = modalSearchQuery.trim() === '' ||
                    v.pilgrimNameEn.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                    v.pilgrimNameAr.includes(modalSearchQuery) ||
                    v.passportNumber.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                    v.nusukRef.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                    v.groupCode.toLowerCase().includes(modalSearchQuery.toLowerCase());
                  return matchesFilter && matchesSearch;
                })
                .map(visa => {
                  const isIssued = visa.status === 'issued';
                  const isReady = visa.status === 'ready_to_issue';
                  const isBio = visa.status === 'biometrics_pending';

                  return (
                    <div
                      key={visa.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#EDE0CC] hover:border-[#B8860B] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#44200F] text-sm">
                            {isAr ? visa.pilgrimNameAr : visa.pilgrimNameEn}
                          </h4>
                          <span className="font-mono text-[11px] text-[#795037] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#EDE0CC]">
                            {visa.passportNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[#795037] text-[11px]">
                          <span>{isAr ? visa.nationalityAr : visa.nationalityEn}</span>
                          <span>·</span>
                          <span className="font-mono font-bold text-[#8C6218]">{visa.nusukRef}</span>
                          <span>·</span>
                          <span className="font-bold">{visa.groupCode}</span>
                          <span>·</span>
                          <span className="text-slate-500">{visa.submissionDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 sm:self-center">
                        {/* Status Chip */}
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                          isIssued
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isReady
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : isBio
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isIssued
                            ? (isAr ? 'تم الإصدار بنجاح' : 'Visa Issued')
                            : isReady
                            ? (isAr ? 'جاهز للاعتماد' : 'Ready to Issue')
                            : isBio
                            ? (isAr ? 'فحص البصمة' : 'Biometrics Match')
                            : (isAr ? 'بانتظار الوزارة' : 'Awaiting Ministry')}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveStatModal(null);
                            handleCreateQuoteFromVisa(visa);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#44200F] border border-[#C4A177] font-bold text-xs transition shadow-2xs cursor-pointer"
                        >
                          {isAr ? 'إنشاء عرض سعر' : 'Create Quote'}
                        </button>

                        {/* Direct Action Trigger */}
                        {!isIssued && (
                          <button
                            onClick={() => handleApproveVisa(visa.id)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8C6218] to-[#B8860B] text-white font-bold text-xs hover:from-[#734F10] hover:to-[#9A6F1A] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'اعتماد تجريبي' : 'Simulate Issue'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EDE0CC] bg-white flex items-center justify-between">
              <span className="text-xs text-[#795037]">
                {isAr ? 'وضع تجريبي: محاكي بيانات التأشيرات بدون اتصال فعلي بالخادم' : 'Demo Mode: local visa queue simulation — no live government API submission'}
              </span>
              <button
                onClick={() => setActiveStatModal(null)}
                className="px-4 py-2 bg-[#8C6218] text-white font-bold text-xs rounded-xl hover:bg-[#734F10] transition cursor-pointer"
              >
                {isAr ? 'إغلاق البوابة' : 'Close Portal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. UPCOMING FLIGHT DEPARTURES MODAL */}
      {activeStatModal === 'flights' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FAF8F5] border border-[#DFC798] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-[#44200F]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#EDE0CC] flex items-center justify-between bg-gradient-to-r from-[#FAF6EE] via-white to-[#F5EFE6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#44200F]">
                    {isAr ? 'بيان رحلات الطيران ومغادرة المعتمرين والحجاج' : 'Upcoming Pilgrimage Flight Manifests & Airport Logistics'}
                  </h3>
                  <span className="text-xs text-[#795037]">
                    {flights.length} {isAr ? 'رحلات خلال ٧٢ ساعة' : 'Upcoming Departures within 72h'} · {totalDepartingPassengers} {isAr ? 'مسافر' : 'Total Passengers'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveStatModal(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#EDE0CC] flex items-center justify-center text-[#795037] hover:text-[#44200F] hover:border-[#B8860B] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Flights Roster Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {flights.map(flight => (
                <div
                  key={flight.id}
                  className="p-5 rounded-2xl bg-white border border-[#EDE0CC] hover:border-[#B8860B] transition-all space-y-4 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FAF3E3] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-xl bg-[#FDF4E0] border border-[#DFC798] text-[#7C5310] font-mono font-black text-sm">
                        {flight.carrier} {flight.flightNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#44200F] text-sm">
                          {isAr ? flight.carrierAr : flight.carrier}
                        </h4>
                        <span className="text-xs text-[#795037] font-mono">
                          {flight.departureAirport} → {flight.arrivalAirport}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 font-mono">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>{isAr ? `خلال ${flight.hoursUntilDeparture} ساعة` : `In ${flight.hoursUntilDeparture} hours`}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] font-mono font-bold text-xs">
                        {flight.passengersCount} {isAr ? 'راكب' : 'Passengers'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#795037] block uppercase font-bold">{isAr ? 'خط ومطار الإقلاع' : 'Departure Terminal'}</span>
                      <p className="font-bold text-[#44200F]">{isAr ? flight.departureCityAr : flight.departureCityEn}</p>
                      <span className="text-[11px] text-[#8C6218] block font-mono font-bold">{flight.terminal} · {flight.gate}</span>
                      <span className="text-slate-500 block text-[11px]">{flight.departureDateTime}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-[#795037] block uppercase font-bold">{isAr ? 'مطار الوصول وصالة الاستقبال' : 'Arrival Airport'}</span>
                      <p className="font-bold text-[#44200F]">{isAr ? flight.arrivalCityAr : flight.arrivalCityEn}</p>
                      <div className="pt-1 flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تصريح شحن مياه زمزم ٥ لتر مفعّل' : 'Zamzam 5L Air Cargo Authorized'}</span>
                      </div>
                    </div>

                    <div className="space-y-1 sm:text-end">
                      <span className="text-[10px] text-[#795037] block uppercase font-bold">{isAr ? 'منسق المطار والاستقبال' : 'Airport Meet & Assist'}</span>
                      <p className="font-bold text-[#44200F]">{isAr ? flight.airportCoordinatorAr : flight.airportCoordinatorEn}</p>
                      <span className="text-[11px] text-[#8C6218] block font-mono dir-ltr">{flight.coordinatorPhone}</span>
                      <div className="pt-1">
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#EDE0CC] text-[#44200F] font-mono">
                          {isAr ? 'الأفواج:' : 'Groups:'} {flight.groupCodes.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EDE0CC] bg-white flex items-center justify-between">
              <span className="text-xs text-[#795037]">
                {isAr ? 'تم التحقق من صالات الحجاج وخدمات الاستقبال بمطار جدة ومطار المدينة' : 'All manifests synced with Hajj Terminal operations at JED & MED'}
              </span>
              <button
                onClick={() => setActiveStatModal(null)}
                className="px-4 py-2 bg-[#8C6218] text-white font-bold text-xs rounded-xl hover:bg-[#734F10] transition cursor-pointer"
              >
                {isAr ? 'إغلاق البيان' : 'Close Manifest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

