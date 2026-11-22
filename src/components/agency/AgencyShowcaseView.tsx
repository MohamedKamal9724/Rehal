import React, { useState, useMemo } from 'react';
import { 
  Building2, ShieldCheck, MapPin, Globe, Phone, Mail, 
  MessageSquare, Users, Truck, Compass, CheckCircle2, 
  Sparkles, ExternalLink, Calendar, ChevronRight, X, 
  Send, Award, Filter, Star, Eye, ArrowLeft, ArrowRight,
  Shield, Clock, Luggage, Anchor, Check, Edit3, Image as ImageIcon,
  ThumbsUp, Share2, Info, ChevronDown, Plane, BookOpen
} from 'lucide-react';
import { Workspace, UILanguage, Inquiry, AgencyDirectoryItem } from '../../types';
import { getAllDirectoryAgencies, findDirectoryAgencyById } from '../../lib/agenciesData';
import { buildWhatsAppUrl } from '../../lib/phone';
import { repository } from '../../lib/storage';
import { loadTrips } from '../../lib/tripStore';
import { AgencyTrip, getTripsForAgency } from '../../lib/agencyTripsData';
import { AgencyTripDetailModal } from './AgencyTripDetailModal';
import { SmartTravelPackingGuide } from '../traveler/SmartTravelPackingGuide';
import { TravelEtiquettePhrasebook } from '../traveler/TravelEtiquettePhrasebook';
import { AgencyProfileEditor } from './AgencyProfileEditor';
import { TravelerStoriesBar } from '../traveler/TravelerStoriesBar';
import { TravelerStoryEditorModal } from '../traveler/TravelerStoryEditorModal';

interface AgencyShowcaseViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  agencyId?: string | null;
  isOperator?: boolean;
  onBackToApp?: () => void;
  onNavigateToQuotes?: () => void;
  onNavigateToSettings?: () => void;
  onReloadData?: () => void;
  onSelectAnotherAgency?: (id: string) => void;
}

interface ShowcasePackage {
  id: string;
  titleEn: string;
  titleAr: string;
  durationEn: string;
  durationAr: string;
  priceUsd: number;
  imageUrl: string;
  highlightsEn: string[];
  highlightsAr: string[];
  destinations: string[];
}

interface ShowcaseReview {
  id: string;
  travelerName: string;
  travelerOrigin: string;
  travelerFlag: string;
  rating: number;
  date: string;
  tripTakenEn: string;
  tripTakenAr: string;
  commentEn: string;
  commentAr: string;
  responseEn?: string;
  responseAr?: string;
}

interface PastExpedition {
  id: string;
  titleEn: string;
  titleAr: string;
  dateEn: string;
  dateAr: string;
  paxCount: number;
  imageUrl: string;
  summaryEn: string;
  summaryAr: string;
}

export const AgencyShowcaseView: React.FC<AgencyShowcaseViewProps> = ({
  workspace,
  uiLang,
  agencyId,
  isOperator = false,
  onBackToApp,
  onNavigateToQuotes,
  onNavigateToSettings,
  onReloadData,
  onSelectAnotherAgency,
}) => {
  const isAr = uiLang === 'ar';

  // Find agency from directory if agencyId is provided, otherwise use workspace
  const directoryAgency = useMemo(() => {
    if (!agencyId) return null;
    return findDirectoryAgencyById(agencyId) || null;
  }, [agencyId]);

  // Active profile data combining directory or current workspace
  const profile = useMemo(() => {
    if (directoryAgency) {
      return {
        id: directoryAgency.id,
        name: directoryAgency.name,
        arabicName: directoryAgency.arabicName,
        logoUrl: directoryAgency.logoUrl || '',
        coverImageUrl: directoryAgency.coverImageUrl || '',
        rating: directoryAgency.rating || 0,
        reviewCount: directoryAgency.reviewCount || 0,
        tourismLicenseNumber: directoryAgency.tourismLicenseNumber || '',
        licenseClass: directoryAgency.licenseClass || 'Class A',
        commercialRegistry: directoryAgency.commercialRegistry || '',
        taxRegistrationNumber: directoryAgency.taxRegistrationNumber || '',
        address: directoryAgency.address || '',
        addressAr: directoryAgency.addressAr || directoryAgency.address || '',
        governorates: directoryAgency.governorates || [],
        supportedLanguages: directoryAgency.supportedLanguages || ['English', 'Arabic'],
        guideRosterCount: directoryAgency.guideRosterCount || 0,
        fleetCount: directoryAgency.fleetCount || 0,
        foundedYear: directoryAgency.foundedYear,
        completedTripsCount: 1420,
        travelersCount: 6850,
        description: directoryAgency.description || '',
        descriptionAr: directoryAgency.descriptionAr || '',
        whatsappNumber: directoryAgency.whatsappNumber || '',
        contactPhone: directoryAgency.contactPhone || '',
        contactEmail: '',
        isVerified: Boolean(directoryAgency.isVerified),
        isDemo: false,
        specialties: directoryAgency.specialties || [],
        specialtiesAr: directoryAgency.specialtiesAr || [],
      };
    }

    const isWsDemo = Boolean(workspace.isDemo || workspace.id === 'ws-demo' || workspace.id === 'ws-default');

    // Compute real operational statistics from live trips, quotes, suppliers, and staff
    const liveTrips = loadTrips();
    const liveQuotes = repository.getQuotes(workspace.id);
    const liveSuppliers = repository.getSuppliers(workspace.id);
    const liveUsers = repository.getUsers(workspace.id);

    const activeOrCompletedTripsCount = Math.max(
      liveTrips.filter(t => t.status !== 'Cancelled').length,
      liveQuotes.filter(q => q.status === 'Accepted').length
    );
    const totalPaxFromTrips = liveTrips.reduce((sum, t) => sum + (t.passengers?.length || 0), 0);
    const totalPaxFromQuotes = liveQuotes
      .filter(q => q.status === 'Accepted')
      .reduce((sum, q) => sum + (q.group?.adults || 0) + (q.group?.children?.length || 0) + (q.group?.infants || 0), 0);
    const computedTravelersCount = Math.max(totalPaxFromTrips, totalPaxFromQuotes);

    const uniqueGuides = new Set<string>();
    liveTrips.forEach(t => {
      if (t.guideName) uniqueGuides.add(t.guideName.trim());
    });
    liveSuppliers.filter(s => s.type === 'Guide').forEach(s => uniqueGuides.add(s.name.trim()));
    liveUsers.filter(u => u.role === 'Operations').forEach(u => uniqueGuides.add(u.name.trim()));

    const uniqueVehicles = new Set<string>();
    liveTrips.forEach(t => {
      if (t.vehiclePlate) uniqueVehicles.add(t.vehiclePlate.trim());
      else if (t.vehicleType) uniqueVehicles.add(t.vehicleType.trim());
    });
    liveSuppliers.filter(s => s.type === 'Transport').forEach(s => uniqueVehicles.add(s.name.trim()));

    const computedCompletedTrips = workspace.completedTripsCount && workspace.completedTripsCount > 0
      ? workspace.completedTripsCount
      : activeOrCompletedTripsCount;
    const computedTravelers = workspace.travelersCount && workspace.travelersCount > 0
      ? workspace.travelersCount
      : computedTravelersCount;
    const computedGuides = workspace.guideRosterCount && workspace.guideRosterCount > 0
      ? workspace.guideRosterCount
      : Math.max(uniqueGuides.size, 1);
    const computedFleet = workspace.fleetCount && workspace.fleetCount > 0
      ? workspace.fleetCount
      : Math.max(uniqueVehicles.size, 1);

    return {
      id: workspace.id,
      name: workspace.name || (isAr ? 'مساحة عمل غير مسماة' : 'Untitled Travel Company'),
      arabicName: workspace.arabicName || '',
      logoUrl: workspace.logoUrl || '',
      coverImageUrl: workspace.coverImageUrl || '',
      rating: workspace.rating ?? (isWsDemo ? 4.97 : 4.95),
      reviewCount: workspace.reviewCount ?? (isWsDemo ? 184 : Math.max(activeOrCompletedTripsCount, 1)),
      tourismLicenseNumber: workspace.tourismLicenseNumber || '',
      licenseClass: (workspace.tourismLicenseNumber ? 'Class A' : '') as any,
      commercialRegistry: workspace.commercialRegistry || '',
      taxRegistrationNumber: workspace.taxRegistrationNumber || '',
      address: workspace.address || '',
      addressAr: workspace.address || '',
      governorates: workspace.coveredDestinations || [],
      supportedLanguages: workspace.supportedLanguages || ['Arabic', 'English'],
      guideRosterCount: computedGuides,
      fleetCount: computedFleet,
      foundedYear: workspace.foundedYear || 2014,
      completedTripsCount: computedCompletedTrips,
      travelersCount: computedTravelers,
      description: workspace.description || '',
      descriptionAr: workspace.descriptionAr || '',
      whatsappNumber: workspace.whatsappNumber || '',
      contactPhone: workspace.contactPhone || '',
      contactEmail: isOperator ? (workspace.contactEmail || '') : '',
      isVerified: Boolean(workspace.isPlatformVerified ?? true),
      isDemo: false,
      specialties: ['Private Egyptologist Expeditions', 'Nile Cruise Charters', 'VIP Ground Transport'],
      specialtiesAr: ['بعثات إرشاد أثري خاصة', 'كروزات ودهبيات نيلية', 'نقل سياحي VIP'],
    };
  }, [directoryAgency, workspace, isAr]);

  // Tab navigation inside profile
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'past_trips' | 'gallery' | 'reviews' | 'packing' | 'phrasebook'>('overview');

  // Interactive Trip Detail Modal & Category Filters
  const [selectedTripForModal, setSelectedTripForModal] = useState<AgencyTrip | null>(null);
  const [tripCategoryFilter, setTripCategoryFilter] = useState<'all' | 'cultural' | 'nile' | 'coastal' | 'desert'>('all');

  // Resolve trips specifically for this company
  const agencyTrips = useMemo(() => getTripsForAgency(profile.id), [profile.id]);

  const filteredTrips = useMemo(() => {
    if (tripCategoryFilter === 'all') return agencyTrips;
    return agencyTrips.filter(t => t.category === tripCategoryFilter);
  }, [agencyTrips, tripCategoryFilter]);

  // Inquiry Modal State
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [selectedPackageForInquiry, setSelectedPackageForInquiry] = useState<ShowcasePackage | null>(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [inquiryTravelDates, setInquiryTravelDates] = useState('');
  const [inquiryPax, setInquiryPax] = useState(2);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Gallery Lightbox State
  const [activeLightboxImage, setActiveLightboxImage] = useState<{ url: string; caption: string } | null>(null);

  // Operator Edit Profile Modal & Studio Mode (defaults to true when operator views own profile)
  const [isStudioMode, setIsStudioMode] = useState(() => Boolean(isOperator && !agencyId));
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false);
  const [storiesRefreshTick, setStoriesRefreshTick] = useState(0);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(workspace.name);
  const [editArabicName, setEditArabicName] = useState(workspace.arabicName || '');
  const [editContactPhone, setEditContactPhone] = useState(workspace.contactPhone || '');
  const [editWhatsapp, setEditWhatsapp] = useState(workspace.whatsappNumber || '');
  const [editEmail, setEditEmail] = useState(workspace.contactEmail || '');
  const [editAddress, setEditAddress] = useState(workspace.address || '');
  const [editDescription, setEditDescription] = useState(workspace.description || '');
  const [editDescriptionAr, setEditDescriptionAr] = useState(workspace.descriptionAr || '');
  const [editCoverImageUrl, setEditCoverImageUrl] = useState(workspace.coverImageUrl || '');
  const [editLogoUrl, setEditLogoUrl] = useState(workspace.logoUrl || '');
  const [editSavedSuccess, setEditSavedSuccess] = useState(false);

  // Packages: Return empty for live companies, sample catalog for demo profiles
  const packages: ShowcasePackage[] = useMemo(() => {
    if (!profile.isDemo) return [];
    return [
      {
        id: 'pkg-1',
        titleEn: '8-Day Pharaohs & Private Nile Cruise Deluxe',
        titleAr: 'رحلة الفراعنة وكروز النيل الفاخر (٨ أيام / ٧ ليالٍ)',
        durationEn: '8 Days / 7 Nights',
        durationAr: '٨ أيام / ٧ ليالٍ',
        priceUsd: 1850,
        imageUrl: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=800&q=80',
        highlightsEn: ['Pyramids VIP private sunrise access', '5-star boutique Dahabiya Nile charter', 'Valley of the Kings royal tombs', 'Private Egyptologist guide throughout'],
        highlightsAr: ['دخول خاص للأهرامات عند الشروق', 'إبحار بدهبية نيلية فاخرة ٥ نجوم', 'مقابر وادي الملوك الملكية', 'مرشد أثري متخصص مرافق طوال الرحلة'],
        destinations: ['Cairo', 'Giza', 'Luxor', 'Edfu', 'Kom Ombo', 'Aswan'],
      },
      {
        id: 'pkg-2',
        titleEn: '5-Day Upper Egypt Royal Temples & Abu Simbel',
        titleAr: 'كنوز مصر العليا ومعابد أبو سمبل (٥ أيام / ٤ ليالٍ)',
        durationEn: '5 Days / 4 Nights',
        durationAr: '٥ أيام / ٤ ليالٍ',
        priceUsd: 1120,
        imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80',
        highlightsEn: ['Karnak Temple hypostyle hall private tour', 'Philae Temple & Nubian village culture', 'Abu Simbel sun temples flight excursion', 'Deluxe private Mercedes coach transport'],
        highlightsAr: ['جولة خاصة بصالة الأعمدة بمعبد الكرنك', 'معبد فيلة وتجربة القرية النوبية', 'طيران مباشر لمعبدي أبو سمبل', 'تنقلات بحافلات مرسيدس VIP خاصة'],
        destinations: ['Luxor', 'Karnak', 'Aswan', 'Abu Simbel'],
      },
      {
        id: 'pkg-3',
        titleEn: '10-Day Complete Grand Egypt & Red Sea Riviera',
        titleAr: 'رحلة مصر الكبرى وساحل البحر الأحمر (١٠ أيام / ٩ ليالٍ)',
        durationEn: '10 Days / 9 Nights',
        durationAr: '١٠ أيام / ٩ ليالٍ',
        priceUsd: 2350,
        imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80',
        highlightsEn: ['Cairo Grand Egyptian Museum full day', 'Nile cruise with private balcony suite', 'Private yacht snorkeling in Hurghada', 'Airport VIP Meet & Assist services'],
        highlightsAr: ['يوم كامل بالمتحف المصري الكبير', 'كروز نيلية بجناح ذي شرفة بانورامية', 'يخت بحري خاص وسنوركلينج بالغردقة', 'استقبال سريع VIP بمطار القاهرة'],
        destinations: ['Cairo', 'Luxor', 'Aswan', 'Hurghada'],
      },
    ];
  }, [profile.isDemo]);

  // Past Expeditions: Return empty for live companies, sample catalog for demo profiles
  const pastExpeditions: PastExpedition[] = useMemo(() => {
    if (!profile.isDemo) return [];
    return [
      {
        id: 'past-1',
        titleEn: 'Oxford University Archaeology Delegation (18 Scholars)',
        titleAr: 'بعثة جامعة أكسفورد الأثرية (١٨ باحثاً ومؤرخاً)',
        dateEn: 'November 2025',
        dateAr: 'نوفمبر ٢٠٢٥',
        paxCount: 18,
        imageUrl: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=600&q=80',
        summaryEn: 'Coordinated private archaeological permits, desert 4x4 convoys, and specialized evening lectures at Luxor Temple.',
        summaryAr: 'تنسيق تصاريح الحفائر والمواقع المغلقة وقوافل الدفع الرباعي الصحراوية مع محاضرات مسائية خاصة بالأقصر.',
      },
      {
        id: 'past-2',
        titleEn: 'Swiss Bankers Private Nile Charter & Cultural Summit',
        titleAr: 'رحلة كبار المصرفيين السويسريين وكروز النيل الخاص',
        dateEn: 'January 2026',
        dateAr: 'يناير ٢٠٢٦',
        paxCount: 26,
        imageUrl: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=600&q=80',
        summaryEn: 'Exclusive charter of a luxury 12-cabin Dahabiya sailing between Esna and Aswan with private gala dinners at Philae Island.',
        summaryAr: 'حجز حصري لدهبية نيلية فاخرة ١٢ كابينة من إسنا لأسوان مع حفلات عشاء ملكية بجزيرة فيلة.',
      },
      {
        id: 'past-3',
        titleEn: 'Tokyo Cultural Arts Society 12-Day Egypt Discovery',
        titleAr: 'جمعية طوكيو للفنون التراثية (رحلة استكشاف مصر ١٢ يوماً)',
        dateEn: 'February 2026',
        dateAr: 'فبراير ٢٠٢٦',
        paxCount: 32,
        imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=600&q=80',
        summaryEn: 'Seamless multi-city logistics with bilingual Japanese-speaking licensed Egyptologists and zero schedule delays.',
        summaryAr: 'خدمات لوجستية متكاملة بمرشدين مرخصين يتحدثون اليابانية بطلاقة ودقة تامة في المواعيد.',
      },
    ];
  }, [profile.isDemo]);

  // Verified Reviews: Return empty for live companies without reviews, sample catalog for demo profiles
  const reviews: ShowcaseReview[] = useMemo(() => {
    if (!profile.isDemo) return [];
    return [
      {
        id: 'rev-1',
        travelerName: 'Arthur & Eleanor Pendelton',
        travelerOrigin: 'London, United Kingdom',
        travelerFlag: '🇬🇧',
        rating: 5,
        date: 'February 2026',
        tripTakenEn: '8-Day Pharaohs & Private Nile Cruise Deluxe',
        tripTakenAr: 'رحلة الفراعنة وكروز النيل الفاخر',
        commentEn: 'Absolute perfection from the moment we touched down at Cairo airport. The private access to the Giza Plateau before opening hours was magical. Our Egyptologist, Mr. Tarek, brought three millennia of history to life. The Mercedes coaches were spotless and the Dahabiya felt like a private palace on the Nile.',
        commentAr: 'تجربة في غاية الروعة والاحترافية منذ لحظة وصولنا لمطار القاهرة. الدخول الخاص لهضبة الأهرامات قبل ساعات العمل الرسمية كان ساحراً. المرشد الأثري رافقنا بمعلومات غزيرة وحافلات مرسيدس في قمة النظافة والراحة.',
        responseEn: 'Thank you Arthur and Eleanor! It was an absolute honour hosting you across Egypt. We will pass your kind words directly to Mr. Tarek and our captain on the Nile.',
        responseAr: 'شكراً جزيلاً لآرثر وإليانور! كان شرفاً كبيراً استضافتكم في مصر وسننقل ثناءكم العاطر مباشرة للمرشد طارق وطاقم الدهبية النيلية.',
      },
      {
        id: 'rev-2',
        travelerName: 'Dr. Jean-Marc Delacroix',
        travelerOrigin: 'Geneva, Switzerland',
        travelerFlag: '🇨🇭',
        rating: 5,
        date: 'January 2026',
        tripTakenEn: '5-Day Upper Egypt Royal Temples',
        tripTakenAr: 'كنوز مصر العليا ومعابد أبو سمبل',
        commentEn: 'Exceptional attention to detail and punctuality. Every ticket was pre-arranged, luggage was seamlessly handled, and the flight to Abu Simbel was flawlessly coordinated. As an architect, the lighting and timing at Karnak and Philae were unforgettable.',
        commentAr: 'عناية فائقة بأدق التفاصيل والالتزام الدقيق بالمواعيد. تذاكر المعابد والانتقالات وحقائب السفر تم تنسيقها بسلاسة تامة، ورحلة أبو سمبل بالطيران كانت تجربة استثنائية.',
        responseEn: 'Dear Dr. Delacroix, we take tremendous pride in precision logistics. We look forward to welcoming your colleagues for their next archaeological expedition!',
        responseAr: 'د. جان مارك، نفخر دائماً بالدقة اللوجستية ونرحب بكم وبزملائكم في رحلاتكم الاستكشافية القادمة!',
      },
      {
        id: 'rev-3',
        travelerName: 'Sofia & Carlos Rodriguez',
        travelerOrigin: 'Madrid, Spain',
        travelerFlag: '🇪🇸',
        rating: 5,
        date: 'December 2025',
        tripTakenEn: '10-Day Complete Grand Egypt & Red Sea',
        tripTakenAr: 'رحلة مصر الكبرى وساحل البحر الأحمر',
        commentEn: 'The perfect combination of historical immersion and luxury beach relaxation in Hurghada. The Spanish-speaking guide was extraordinarily knowledgeable and our children were captivated. Recommended wholeheartedly to anyone visiting Egypt.',
        commentAr: 'مزيج متكامل بين التاريخ العريق والاستجمام الفاخر على شاطئ البحر الأحمر بالغردقة. المرشد كان يتحدث الإسبانية بطلاقة وأبهر أطفالنا بالقصص التاريخية.',
      },
    ];
  }, [profile.isDemo]);

  // Gallery Photos (combines custom uploaded workspace photos with default field gallery)
  const galleryPhotos = useMemo(() => {
    const customList = (workspace.galleryPhotos || []).map(p => ({
      url: p.url,
      captionEn: p.caption || 'Company Field Photo',
      captionAr: p.captionAr || p.caption || 'صورة ميدانية للشركة',
    }));
    const defaults = [
      { url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=800&q=80', captionEn: 'Private Sunrise at the Great Pyramids of Giza', captionAr: 'شروق الشمس الخاص أمام أهرامات الجيزة' },
      { url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80', captionEn: 'Karnak Temple Hypostyle Columns at Twilight', captionAr: 'أعمدة معبد الكرنك العظيمة في الأقصر' },
      { url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=800&q=80', captionEn: 'Traditional Dahabiya Sailing on the Nile at Aswan', captionAr: 'دهبية نيلية تقليدية تبحر في نيل أسوان' },
      { url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80', captionEn: 'Philae Island Temple of Isis Reflection', captionAr: 'معبد فيلة وجزيرة إيزيس الساحرة في أسوان' },
      { url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80', captionEn: 'Boutique VIP Cairo Heritage Walking Tour', captionAr: 'جولة مشي تراثية في القاهرة التاريخية' },
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80', captionEn: 'Private Yacht Charter in the Red Sea', captionAr: 'يخت بحري خاص في مياه البحر الأحمر الفيروزية' },
    ];
    return customList.length > 0 ? customList : defaults;
  }, [workspace.galleryPhotos]);

  const waUrl = buildWhatsAppUrl(
    profile.whatsappNumber || profile.contactPhone,
    isAr
      ? `مرحباً ${profile.arabicName || profile.name}، أود الاستفسار عن برامج الرحلات السياحية وتفاصيل الحجز.`
      : `Hello ${profile.name}, I would like to inquire about your tour itineraries and custom travel packages.`
  );

  // Handle Inquiry Submit
  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const packageName = selectedPackageForInquiry ? (isAr ? selectedPackageForInquiry.titleAr : selectedPackageForInquiry.titleEn) : (isAr ? 'برنامج مخصص' : 'Custom Itinerary');
    const inq: Inquiry = {
      id: `inq-${Date.now()}`,
      workspaceId: workspace.id,
      travelerName: inquiryName.trim() || (isAr ? 'عميل استفسار' : 'Showcase Traveler'),
      travelerEmail: inquiryEmail.trim() || 'traveler@example.com',
      travelerPhone: inquiryPhone.trim() || undefined,
      rawText: `[استفسار من الصفحة التعريفية لشركة: ${profile.arabicName || profile.name}] البرنامج المطلوب: ${packageName} | عدد المسافرين: ${inquiryPax} | تاريخ السفر التقريبي: ${inquiryTravelDates || 'غير محدد'} | ملاحظات: ${inquiryNotes}`,
      source: 'Web Form',
      status: 'New',
      assignedAgentId: 'agent-ops',
      assignedAgentName: 'Operations Desk',
      receivedAt: new Date().toISOString(),
      language: isAr ? 'ar' : 'en',
      slaMinutes: 120,
    };
    repository.saveInquiry(inq);
    setInquirySubmitted(true);
  };

  // Handle Save Operator Edit Profile
  const handleSaveOperatorProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Workspace = {
      ...workspace,
      name: editName.trim() || workspace.name,
      arabicName: editArabicName.trim() || workspace.arabicName,
      contactPhone: editContactPhone.trim() || workspace.contactPhone,
      whatsappNumber: editWhatsapp.trim() || workspace.whatsappNumber,
      contactEmail: editEmail.trim() || workspace.contactEmail,
      address: editAddress.trim() || workspace.address,
      description: editDescription.trim() || workspace.description,
      descriptionAr: editDescriptionAr.trim() || workspace.descriptionAr,
      coverImageUrl: editCoverImageUrl.trim() || workspace.coverImageUrl,
      logoUrl: editLogoUrl.trim() || workspace.logoUrl,
    };
    repository.updateWorkspace(updated);
    setEditSavedSuccess(true);
    setTimeout(() => {
      setEditSavedSuccess(false);
      setEditProfileModalOpen(false);
      if (onReloadData) onReloadData();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner Navigation & Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EDE0CC] shadow-xs">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#44200F] text-[#C4A177] flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#44200F] leading-tight">
                {isAr ? 'الملف التعريفي العام للشركة المعتمدة' : 'Official Verified DMC Profile & Showcase'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC] whitespace-nowrap shrink-0">
                {isAr ? 'صفحة عامة معتمدة' : 'Public Profile'}
              </span>
            </div>
            <p className="text-[11px] text-[#795037] mt-0.5 leading-relaxed">
              {isAr ? 'الملف الرسمي المعتمد المتاح للمسافرين والشركاء الدوليين للاطلاع على التراخيص والرحلات' : 'Official accredited profile for travelers & international partners to inspect credentials & itineraries'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0 flex-wrap">
          {/* Quick Add Story Button */}
          <button
            type="button"
            onClick={() => setStoryCreatorOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#E1306C] hover:opacity-95 text-white text-xs font-extrabold transition inline-flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{isAr ? '+ إضافة ستوري' : '+ Add Story'}</span>
          </button>

          {/* Toggle between Studio Editor Mode & Public Visitor View */}
          <button
            type="button"
            onClick={() => setIsStudioMode(prev => !prev)}
            className={`h-9 px-3.5 rounded-xl border text-xs font-bold transition inline-flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 cursor-pointer ${
              isStudioMode
                ? 'bg-[#44200F] text-[#FAF7F2] border-[#44200F]'
                : 'bg-[#FAF7F2] text-[#44200F] border-[#EDE0CC] hover:bg-[#EDE0CC]'
            }`}
          >
            <Edit3 className={`w-3.5 h-3.5 shrink-0 ${isStudioMode ? 'text-[#C4A177]' : 'text-[#795037]'}`} />
            <span>
              {isStudioMode
                ? isAr ? 'عرض الصفحة كزائر' : 'View as Visitor'
                : isAr ? 'إدارة البروفايل والصور والستوري' : 'Manage Profile, Photos & Stories'}
            </span>
          </button>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="h-9 px-4 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAr ? (
                <>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  <span>لوحة التحكم</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span>Back to Desk</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Stories Highlights Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] shadow-2xs">
        <TravelerStoriesBar
          uiLang={uiLang}
          onSelectAgency={(id) => {
            if (onSelectAnotherAgency) onSelectAnotherAgency(id);
          }}
          onOpenStoryCreator={() => setStoryCreatorOpen(true)}
          refreshTrigger={storiesRefreshTick}
        />
      </div>

      {/* When Operator switches to Studio Mode, render full Social Profile Editor right here */}
      {isStudioMode ? (
        <AgencyProfileEditor
          workspace={workspace}
          uiLang={uiLang}
          onUpdateWorkspace={(updates) => {
            const nextWs = { ...workspace, ...updates };
            repository.updateWorkspace(nextWs);
            if (onReloadData) onReloadData();
          }}
          onOpenPublicShowcase={() => setIsStudioMode(false)}
          onReloadData={onReloadData}
        />
      ) : (
        <>

      {/* Quick Company Profile Switcher Pills */}
      <div className="luxury-tab-bar bg-white px-4 py-2.5 rounded-2xl border border-[#EDE0CC] flex items-center gap-2.5 overflow-x-auto shadow-2xs flex-nowrap">
        <span className="text-xs font-bold text-[#44200F] shrink-0 whitespace-nowrap flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-[#C4A177] shrink-0" />
          <span>{isAr ? 'بروفايل الشركات المعتمدة:' : 'Accredited DMC Profiles:'}</span>
        </span>
        <div className="flex items-center gap-2 flex-nowrap">
          {getAllDirectoryAgencies().map(ag => {
            const isSelected = profile.id === ag.id;
            return (
              <button
                key={ag.id}
                type="button"
                onClick={() => {
                  if (onSelectAnotherAgency) onSelectAnotherAgency(ag.id);
                }}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#44200F] text-[#C4A177] shadow-xs ring-1 ring-[#C4A177]'
                    : 'bg-[#FAF7F2] text-[#795037] hover:bg-[#EDE0CC] border border-[#EDE0CC]'
                }`}
              >
                <span>{isAr ? (ag.arabicName || ag.name) : ag.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#C4A177] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Social Business Style Profile Header Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-[#EDE0CC] shadow-sm">
        {/* Cover Photo Banner - Neutral branded placeholder when no photo uploaded */}
        <div className="h-44 sm:h-60 md:h-72 bg-[#44200F] overflow-hidden">
          {profile.coverImageUrl ? (
            <img
              src={profile.coverImageUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#44200F] via-[#5c301a] to-[#2b1409] text-[#C4A177] p-6 text-center">
              <Building2 className="w-12 h-12 mb-2 opacity-40 text-[#C4A177]" />
              <span className="text-base font-bold text-[#FAF7F2] tracking-wide">{profile.name}</span>
              <span className="text-xs text-[#C4A177]/80 mt-1">{isAr ? 'الملف التعريفي للشركة' : 'Company Showcase'}</span>
            </div>
          )}
        </div>

        {/* Profile Info with Generous Padding - Zero Negative Margins */}
        <div className="p-6 sm:p-8 bg-white border-t border-[#EDE0CC] space-y-6">
          
          {/* Top Verification Badges Grid Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-[#EDE0CC]">
            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EDE0CC] flex items-center gap-2.5 shadow-2xs">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${profile.isVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block leading-none">{isAr ? 'حالة التوثيق' : 'Verification'}</span>
                <span className="text-xs font-bold text-[#44200F] truncate block mt-0.5">
                  {profile.isVerified 
                    ? (isAr ? 'موثقة رسمياً' : 'Platform Verified') 
                    : (isAr ? 'قيد المراجعة والتوثيق' : 'Verification Pending')}
                </span>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EDE0CC] flex items-center gap-2.5 shadow-2xs">
              <Clock className="w-4 h-4 text-[#795037] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block leading-none">{isAr ? 'سنة التأسيس' : 'Established'}</span>
                <span className="text-xs font-bold text-[#44200F] truncate block mt-0.5">
                  {profile.foundedYear 
                    ? (isAr ? `تأسست عام ${profile.foundedYear}` : `Est. ${profile.foundedYear}`)
                    : (isAr ? 'غير محدد' : 'Not specified')}
                </span>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EDE0CC] flex items-center gap-2.5 shadow-2xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block leading-none">{isAr ? 'تقييم المسافرين' : 'Rating'}</span>
                <span className="text-xs font-bold text-[#44200F] truncate block mt-0.5">
                  {profile.reviewCount > 0 
                    ? `${profile.rating.toFixed(2)} (${profile.reviewCount} ${isAr ? 'تقييم' : 'reviews'})`
                    : (isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Avatar Logo & Brand Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[#EDE0CC] shadow-md bg-white shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#44200F] text-[#C4A177] flex items-center justify-center text-2xl font-black border border-[#EDE0CC] shadow-md shrink-0">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Title & Metadata */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#44200F] leading-tight">
                    {isAr ? profile.arabicName || profile.name : profile.name}
                  </h1>
                  {profile.isVerified ? (
                    <span className="inline-flex items-center text-emerald-600 shrink-0" title={isAr ? 'شركة معتمدة رسمياً' : 'Officially Verified'}>
                      <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {isAr ? 'قيد التوثيق' : 'Verification Pending'}
                    </span>
                  )}
                </div>

                {profile.arabicName && profile.arabicName !== profile.name && (
                  <p className="text-xs sm:text-sm font-medium text-[#795037]">
                    {isAr ? profile.name : profile.arabicName}
                  </p>
                )}

                {/* Rating & Trust Line in Natural Flex Flow */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {profile.reviewCount > 0 ? (
                    <div className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                      <span>{profile.rating.toFixed(2)}</span>
                      <span className="text-slate-600 font-normal">({profile.reviewCount} {isAr ? 'تقييم معتمد' : 'reviews'})</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#EDE0CC] text-[11px] font-medium">
                      {isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                    </span>
                  )}

                  <span className="text-emerald-800 text-[11px] font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isAr ? 'منظم رحلات نشط' : 'Active Tour Operator'}</span>
                  </span>

                  {profile.address && (
                    <span className="text-slate-600 flex items-center gap-1 text-xs shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
                      <span>{isAr ? profile.addressAr : profile.address}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons in Natural Flow */}
            <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2.5 shrink-0">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full lg:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{isAr ? 'محادثة واتساب مباشرة' : 'Direct WhatsApp'}</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setSelectedPackageForInquiry(null);
                  setInquiryModalOpen(true);
                  setInquirySubmitted(false);
                }}
                className="w-full lg:w-auto px-4 py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] border border-[#C4A177]/40 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4 text-[#C4A177] shrink-0" />
                <span className="whitespace-nowrap">{isAr ? 'طلب عرض سعر مخصص' : 'Request Custom Quote'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="luxury-tab-bar border-b border-[#EDE0CC] px-4 sm:px-6 bg-[#FAF7F2] flex items-center gap-3 sm:gap-6 overflow-x-auto flex-nowrap text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`h-12 px-1 border-b-2 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#44200F] text-[#44200F]'
                : 'border-transparent text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'نظرة عامة والاعتمادات' : 'Overview & Credentials'}</span>
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`h-12 px-1 border-b-2 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'trips'
                ? 'border-[#44200F] text-[#44200F]'
                : 'border-transparent text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'البرامج السياحية المتاحة' : 'Available Itineraries'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#EDE0CC] text-[#44200F]">
              {agencyTrips.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('past_trips')}
            className={`h-12 px-1 border-b-2 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'past_trips'
                ? 'border-[#44200F] text-[#44200F]'
                : 'border-transparent text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'رحلات ووفود سابقة' : 'Past Expeditions'}</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`h-12 px-1 border-b-2 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'gallery'
                ? 'border-[#44200F] text-[#44200F]'
                : 'border-transparent text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'معرض الصور الميدانية' : 'Field Gallery'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#EDE0CC] text-[#44200F]">
              {galleryPhotos.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`h-12 px-1 border-b-2 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#44200F] text-[#44200F]'
                : 'border-transparent text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'تقييمات المسافرين المعتمدة' : 'Verified Reviews'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#EDE0CC] text-[#44200F]">
              {reviews.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('packing')}
            className={`h-12 px-1 border-b-2 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'packing'
                ? 'border-[#44200F] text-[#44200F]'
                : 'border-transparent text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <Luggage className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'دليل تجهيز الحقيبة' : 'Packing Guide'}</span>
          </button>
          <button
            onClick={() => setActiveTab('phrasebook')}
            className={`h-12 px-1 border-b-2 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'phrasebook'
                ? 'border-[#44200F] text-[#44200F]'
                : 'border-transparent text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'العبارات والإتيكيت' : 'Phrases & Etiquette'}</span>
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Trust & Key Operational Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE0CC] text-center">
                  <div className="text-2xl font-extrabold text-[#44200F] font-mono tabular-nums">
                    {profile.completedTripsCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#795037] font-semibold mt-1">
                    {isAr ? 'رحلة وبعثة مكتملة ونشطة' : 'Active & Completed Expeditions'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isAr ? 'محسوب من سجل العمليات الفعلي' : 'Computed from live trip files'}
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE0CC] text-center">
                  <div className="text-2xl font-extrabold text-[#44200F] font-mono tabular-nums">
                    {profile.travelersCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#795037] font-semibold mt-1">
                    {isAr ? 'مسافر تمت خدمتهم' : 'Travelers Served'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isAr ? 'المسافرون المسجلون بالملفات' : 'Registered across trip manifests'}
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE0CC] text-center">
                  <div className="text-2xl font-extrabold text-[#44200F] font-mono tabular-nums">
                    {profile.guideRosterCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#795037] font-semibold mt-1">
                    {isAr ? 'مرشد أثري مسجل' : 'Licensed Guides'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isAr ? 'طاقم الإرشاد المعتمد' : 'Active guide roster'}
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE0CC] text-center">
                  <div className="text-2xl font-extrabold text-[#44200F] font-mono tabular-nums">
                    {profile.fleetCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#795037] font-semibold mt-1">
                    {isAr ? 'مركبة وحافلة' : 'Fleet Vehicles'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isAr ? 'أسطول النقل السياحي' : 'Assigned transport fleet'}
                  </div>
                </div>
              </div>

              {/* Demo Mode Notice (Only when profile.isDemo is true) */}
              {profile.isDemo && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {isAr 
                      ? 'وضع المعاينة والعرض التوضيحي (Demo Mode): إحصائيات الرحلات والتقييمات مجهزة لتوضيح التجربة الكاملة للمسافرين والشركاء.'
                      : 'Demo Mode: Metrics and reviews are rendered with verified sample data to illustrate the full B2B/B2C profile.'}
                  </span>
                </div>
              )}

              {/* Split Content: About + Legal Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Cols: Description & Specialties */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-[#44200F] mb-2 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#C4A177]" />
                      <span>{isAr ? 'عن الشركة وتاريخها' : 'About Company & Operations'}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-[#FAF7F2] p-4 rounded-2xl border border-[#EDE0CC]">
                      {isAr ? profile.descriptionAr : profile.description}
                    </p>
                  </div>

                  {/* Covered Destinations */}
                  <div>
                    <h3 className="text-sm font-bold text-[#44200F] mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#C4A177]" />
                      <span>{isAr ? 'المحافظات والوجهات المغطاة' : 'Covered Governorates & Destinations'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.governorates.map(dest => (
                        <span 
                          key={dest} 
                          className="px-3 py-1.5 rounded-xl bg-white text-[#44200F] border border-[#EDE0CC] text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#C4A177]" />
                          <span>{dest}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Supported Languages */}
                  <div>
                    <h3 className="text-sm font-bold text-[#44200F] mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#C4A177]" />
                      <span>{isAr ? 'لغات الإرشاد المعتمدة للرحلات' : 'Supported Tour Guide Languages'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.supportedLanguages.map(lang => (
                        <span 
                          key={lang} 
                          className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC] text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Globe className="w-3.5 h-3.5 text-[#795037]" />
                          <span>{lang}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Specialties */}
                  <div>
                    <h3 className="text-sm font-bold text-[#44200F] mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#C4A177]" />
                      <span>{isAr ? 'مجالات التميز والخدمات الخاصة' : 'Operational Specialties'}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(isAr ? profile.specialtiesAr : profile.specialties).map((spec, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#EDE0CC] text-xs text-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold">{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Legal Registration & Direct Contacts */}
                <div className="space-y-4">
                  {/* Operational Capabilities & Readiness Card */}
                  <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#EDE0CC] space-y-3.5 text-xs">
                    <h4 className="font-bold text-[#44200F] text-sm flex items-center gap-2 pb-2 border-b border-[#EDE0CC]">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'القدرات والجاهزية التشغيلية' : 'Operational Readiness'}</span>
                    </h4>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{isAr ? 'حالة التشغيل:' : 'Operations Status:'}</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>{isAr ? 'نشط ومعتمد' : 'Active & Verified'}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{isAr ? 'دعم الطوارئ والميدان:' : 'Duty & Field Support:'}</span>
                        <span className="font-bold text-[#44200F]">
                          {isAr ? 'مكتب عمليات ٢٤/٧' : '24/7 Operations Desk'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{isAr ? 'نطاق الوجهات:' : 'Destination Scope:'}</span>
                        <span className="text-slate-800 font-medium">
                          {isAr ? 'القاهرة، الأقصر، أسوان، البحر الأحمر' : 'Cairo, Luxor, Aswan, Red Sea'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">{isAr ? 'لغات الوفود المعتمدة:' : 'Language Desks:'}</span>
                        <span className="text-slate-800 font-medium">
                          {isAr ? 'العربية، الإنجليزية، متعدد اللغات' : 'Arabic, English & Multilingual'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Contacts Card */}
                  <div className="bg-white rounded-2xl p-5 border border-[#EDE0CC] space-y-3 text-xs shadow-2xs">
                    <h4 className="font-bold text-[#44200F] text-sm flex items-center gap-2 pb-2 border-b border-[#EDE0CC]">
                      <Phone className="w-4 h-4 text-[#795037]" />
                      <span>{isAr ? 'بيانات الاتصال والتواصل' : 'Direct Contacts'}</span>
                    </h4>

                    <div className="space-y-2.5">
                      {profile.contactPhone && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="w-4 h-4 text-[#795037] shrink-0" />
                          <span className="font-mono text-xs">{profile.contactPhone}</span>
                        </div>
                      )}
                      {profile.whatsappNumber && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-mono text-xs">{profile.whatsappNumber}</span>
                        </div>
                      )}
                      {isOperator && !directoryAgency && profile.contactEmail && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail className="w-4 h-4 text-[#795037] shrink-0" />
                          <span className="truncate text-xs">{profile.contactEmail}</span>
                        </div>
                      )}
                      {profile.address && (
                        <div className="flex items-start gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-[#795037] shrink-0 mt-0.5" />
                          <span className="text-xs">{isAr ? profile.addressAr : profile.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isAr ? 'محادثة عبر واتساب' : 'WhatsApp Us'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AVAILABLE TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#44200F]">
                    {isAr ? 'البرامج والرحلات السياحية المتاحة للحجز' : 'Published Trips & Itineraries'}
                  </h3>
                  <p className="text-xs text-[#795037] mt-0.5">
                    {isAr 
                      ? 'اختر أي رحلة للاطلاع الفوري على صورها المعتمدة ومواعيد وصول ومغادرة المسافرين وخط السير.'
                      : 'Click any itinerary to view high-res photo gallery, arrival & departure timings, and detailed route.'}
                  </p>
                </div>

                <span className="text-xs font-semibold text-[#795037] bg-[#FAF7F2] px-3 py-1 rounded-xl border border-[#EDE0CC] self-start sm:self-auto">
                  {filteredTrips.length} {isAr ? 'رحلة معتمدة' : 'Trips Available'}
                </span>
              </div>

              {/* Category Filter Chips Bar */}
              <div className="luxury-tab-bar flex items-center gap-2 overflow-x-auto flex-nowrap pb-1">
                {[
                  { id: 'all', labelAr: 'جميع الرحلات', labelEn: 'All Trips' },
                  { id: 'nile', labelAr: 'كروزات نيلية وإبحار', labelEn: 'Nile Cruising' },
                  { id: 'cultural', labelAr: 'رحلات أثرية وتاريخية', labelEn: 'Archaeology & Culture' },
                  { id: 'coastal', labelAr: 'شواطئ وبحر أحمر', labelEn: 'Coastal & Red Sea' },
                  { id: 'desert', labelAr: 'سفاري ومغامرات', labelEn: 'Desert Safari' },
                ].map((cat) => {
                  const count = cat.id === 'all' 
                    ? agencyTrips.length 
                    : agencyTrips.filter(t => t.category === cat.id).length;
                  if (cat.id !== 'all' && count === 0) return null;
                  const isActive = tripCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTripCategoryFilter(cat.id as any)}
                      className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#44200F] text-[#C4A177] shadow-xs'
                          : 'bg-[#FAF7F2] text-[#795037] hover:bg-[#EDE0CC] border border-[#EDE0CC]'
                      }`}
                    >
                      <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive ? 'bg-[#C4A177] text-[#44200F]' : 'bg-[#EDE0CC] text-[#795037]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Categorized Trips Grid */}
              {filteredTrips.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-3xl bg-[#FAF7F2] border border-[#EDE0CC] space-y-3">
                  <Compass className="w-10 h-10 text-[#C4A177] mx-auto opacity-70" />
                  <h4 className="text-base font-bold text-[#44200F]">
                    {isAr ? 'لا توجد رحلات منشورة بعد' : 'No trips published yet'}
                  </h4>
                  <p className="text-xs text-[#795037] max-w-md mx-auto leading-relaxed">
                    {isAr
                      ? 'لم تقم هذه الشركة بنشر برامج سياحية للعامة بعد. يمكنك إرسال استفسار مباشر لطلب برنامج مخصص.'
                      : 'This operator has not published public itineraries yet. You can submit an enquiry for a tailored itinerary.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTrips.map(trip => (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripForModal(trip)}
                    className="bg-white rounded-3xl overflow-hidden border border-[#EDE0CC] shadow-xs hover:shadow-xl hover:border-[#C4A177] transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      {/* Clean Media Box - 100% Pure Photo, Zero Overlays */}
                      <div className="h-48 sm:h-52 bg-[#44200F] overflow-hidden">
                        <img
                          src={trip.photos[0]?.url || 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=800&q=80'}
                          alt={isAr ? trip.titleAr : trip.titleEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Content Area - Ample Padding, Zero Overlays, Clean White Card Surface */}
                      <div className="p-5 space-y-3.5">
                        
                        {/* Status Bar Below Photo: Duration, Photo Count & Price */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#EDE0CC] gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#44200F] text-[11px] font-bold border border-[#EDE0CC]">
                              {isAr ? trip.durationAr : trip.durationEn}
                            </span>
                            <span className="px-2 py-1 rounded-lg bg-[#FAF7F2] text-[#795037] text-[10px] font-semibold border border-[#EDE0CC] flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-[#C4A177]" />
                              <span>{trip.photos.length} {isAr ? 'صور' : 'Photos'}</span>
                            </span>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-[#44200F] font-mono">
                              ${trip.priceUsd}
                            </span>
                            <span className="text-[10px] font-normal text-slate-500 ms-1">
                              {isAr ? '/ فرد' : '/ pax'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Category & Capacity */}
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#FAF7F2] text-[#795037] text-[10px] font-bold border border-[#EDE0CC]">
                            {isAr ? trip.categoryLabelAr : trip.categoryLabelEn}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#795037]" />
                            <span>{isAr ? trip.groupCapacityAr : trip.groupCapacity}</span>
                          </span>
                        </div>

                        {/* Trip Title */}
                        <h4 className="font-extrabold text-sm sm:text-base text-[#44200F] group-hover:text-[#795037] transition-colors leading-snug">
                          {isAr ? trip.titleAr : trip.titleEn}
                        </h4>

                        {/* Destinations Route */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {(isAr ? trip.destinationsAr : trip.destinations).map((d, idx, arr) => (
                            <React.Fragment key={d}>
                              <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#44200F] text-[10px] font-bold border border-[#EDE0CC]">
                                {d}
                              </span>
                              {idx < arr.length - 1 && (
                                <span className="text-[#C4A177] text-[10px] font-bold">
                                  {isAr ? '←' : '→'}
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* ARRIVAL & DEPARTURE PREVIEW BOX (مواعيد الوصول والمغادرة) */}
                        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC] space-y-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                              <Plane className="w-3.5 h-3.5 text-emerald-600 rotate-45 shrink-0" />
                              <span>{isAr ? 'موعد الوصول:' : 'Arrival:'}</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {isAr ? trip.arrival.timeAr : trip.arrival.time}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                              <Plane className="w-3.5 h-3.5 text-[#44200F] -rotate-45 shrink-0" />
                              <span>{isAr ? 'موعد المغادرة:' : 'Departure:'}</span>
                            </span>
                            <span className="font-mono font-bold text-[#44200F] bg-[#EDE0CC]/70 px-2 py-0.5 rounded-md border border-[#EDE0CC]">
                              {isAr ? trip.departure.timeAr : trip.departure.time}
                            </span>
                          </div>
                        </div>

                        {/* Trip Summary Snippet */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {isAr ? trip.summaryAr : trip.summaryEn}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="p-5 pt-0 space-y-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTripForModal(trip);
                        }}
                        className="w-full py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C4A177]" />
                        <span>{isAr ? 'استعراض تفاصيل الرحلة وصورها' : 'View Trip Details & Photos'}</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={buildWhatsAppUrl(
                            profile.whatsappNumber || profile.contactPhone,
                            isAr
                              ? `مرحباً، أود الاستفسار عن رحلة (${trip.titleAr}) المنشورة ببروفايل الشركة.`
                              : `Hello, inquiring about trip (${trip.titleEn}).`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPackageForInquiry({
                              id: trip.id,
                              titleEn: trip.titleEn,
                              titleAr: trip.titleAr,
                              durationEn: trip.durationEn,
                              durationAr: trip.durationAr,
                              priceUsd: trip.priceUsd,
                              imageUrl: trip.photos[0]?.url || '',
                              highlightsEn: trip.highlightsEn,
                              highlightsAr: trip.highlightsAr,
                              destinations: trip.destinations,
                            });
                            setInquiryModalOpen(true);
                            setInquirySubmitted(false);
                          }}
                          className="py-2 bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] border border-[#EDE0CC] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3 h-3 text-[#795037]" />
                          <span>{isAr ? 'طلب سعر' : 'Quote'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {/* TAB 3: PAST EXPEDITIONS */}
          {activeTab === 'past_trips' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#44200F]">
                  {isAr ? 'سجل الرحلات والوفود المنفذة بنجاح' : 'Past Expeditions & Cultural Delegations'}
                </h3>
                <p className="text-xs text-[#795037] mt-1">
                  {isAr 
                    ? 'نماذج موثقة من الرحلات والوفود الأثرية والخاصة التي قامت الشركة بتنظيمها بأعلى معايير الدقة.'
                    : 'Documented expeditions, archaeological delegations, and private Nile charters operated with distinction.'}
                </p>
              </div>

              {pastExpeditions.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-3xl bg-[#FAF7F2] border border-[#EDE0CC] space-y-3">
                  <Compass className="w-10 h-10 text-[#C4A177] mx-auto opacity-70" />
                  <h4 className="text-base font-bold text-[#44200F]">
                    {isAr ? 'لا توجد بعثات سابقة مسجلة' : 'No past expeditions recorded'}
                  </h4>
                  <p className="text-xs text-[#795037] max-w-md mx-auto leading-relaxed">
                    {isAr
                      ? 'سيتم توثيق الوفود والرحلات المكتملة هنا تلقائياً عند إتمام العمليات التشغيلية واعتمادها.'
                      : 'Completed delegations and trips will be documented here automatically upon operational signoff.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {pastExpeditions.map(exp => (
                  <div key={exp.id} className="bg-white rounded-2xl overflow-hidden border border-[#EDE0CC] shadow-xs flex flex-col justify-between">
                    <div>
                      {/* Pure Media Box - Zero Overlays */}
                      <div className="h-44 bg-[#44200F] overflow-hidden">
                        <img src={exp.imageUrl} alt={isAr ? exp.titleAr : exp.titleEn} className="w-full h-full object-cover" />
                      </div>

                      {/* Clean Metadata Bar Below Photo */}
                      <div className="px-4 py-2.5 bg-[#FAF7F2] border-b border-[#EDE0CC] flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#44200F]">
                          {isAr ? exp.dateAr : exp.dateEn}
                        </span>
                        <span className="font-semibold text-[#795037] bg-white px-2 py-0.5 rounded-md border border-[#EDE0CC]">
                          {exp.paxCount} {isAr ? 'مسافراً' : 'Travelers'}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-sm text-[#44200F] leading-snug">
                          {isAr ? exp.titleAr : exp.titleEn}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {isAr ? exp.summaryAr : exp.summaryEn}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {/* TAB 4: FIELD GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#44200F]">
                  {isAr ? 'معرض صور العمليات الميدانية والرحلات' : 'Operational Field Gallery'}
                </h3>
                <p className="text-xs text-[#795037] mt-1">
                  {isAr 
                    ? 'لقطات حقيقية من المواقع الأثرية، كروزات النيل، وأسطول النقل السياحي. انقر على أي صورة لتكبيرها.'
                    : 'Authentic photos from archaeological expeditions, Nile charters, and VIP fleet. Click any image to preview.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {galleryPhotos.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveLightboxImage({ url: photo.url, caption: isAr ? photo.captionAr : photo.captionEn })}
                    className="group bg-white rounded-2xl overflow-hidden cursor-pointer border border-[#EDE0CC] shadow-xs hover:border-[#C4A177] hover:shadow-md transition flex flex-col justify-between"
                  >
                    {/* Pure Media Box */}
                    <div className="h-44 sm:h-52 bg-[#44200F] overflow-hidden">
                      <img
                        src={photo.url}
                        alt={isAr ? photo.captionAr : photo.captionEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    {/* Clean Caption and Action on White Surface Below Photo */}
                    <div className="p-3 bg-white flex items-center justify-between gap-2 border-t border-[#EDE0CC]">
                      <p className="text-xs font-semibold text-[#44200F] line-clamp-1">
                        {isAr ? photo.captionAr : photo.captionEn}
                      </p>
                      <span className="p-1.5 rounded-lg bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC] group-hover:bg-[#44200F] group-hover:text-[#C4A177] transition shrink-0">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {profile.reviewCount > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE0CC]">
                  <div className="flex items-center gap-4">
                    <div className="text-center sm:text-right">
                      <div className="text-3xl font-extrabold text-[#44200F]">{profile.rating.toFixed(2)}</div>
                      <div className="flex items-center gap-0.5 justify-center sm:justify-start text-amber-500 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="text-[11px] text-[#795037] mt-1 font-semibold">
                        {profile.reviewCount} {isAr ? 'تقييماً معتمداً' : 'Verified Reviews'}
                      </div>
                    </div>

                    <div className="h-12 w-px bg-[#EDE0CC] hidden sm:block" />

                    {/* Rating Breakdown Bar */}
                    <div className="space-y-1.5 flex-1 max-w-xs text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[#795037]">5 {isAr ? 'نجوم' : 'stars'}</span>
                        <div className="flex-1 bg-[#EDE0CC] rounded-full h-2 overflow-hidden">
                          <div className="bg-[#44200F] h-full rounded-full" style={{ width: '95%' }} />
                        </div>
                        <span className="w-8 font-semibold text-[#44200F]">95%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[#795037]">4 {isAr ? 'نجوم' : 'stars'}</span>
                        <div className="flex-1 bg-[#EDE0CC] rounded-full h-2 overflow-hidden">
                          <div className="bg-[#795037] h-full rounded-full" style={{ width: '5%' }} />
                        </div>
                        <span className="w-8 font-semibold text-[#44200F]">5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'جميع التقييمات من رحلات حقيقية' : '100% Verified Traveler Feedback'}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#EDE0CC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl border border-[#EDE0CC] text-[#795037]">
                      <Star className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#44200F]">
                        {isAr ? 'سجل التقييمات' : 'Customer Review Log'}
                      </div>
                      <div className="text-xs text-[#795037] mt-0.5">
                        {isAr ? 'لم تسجل تقييمات موثقة بعد' : 'No verified traveler reviews recorded yet'}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                    <Info className="w-4 h-4 text-amber-700" />
                    <span>{isAr ? 'تُسجل بعد تنفيذ الرحلات' : 'Collected after trip completion'}</span>
                  </span>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-3xl bg-[#FAF7F2] border border-[#EDE0CC] space-y-3">
                  <Star className="w-10 h-10 text-[#C4A177] mx-auto opacity-70" />
                  <h4 className="text-base font-bold text-[#44200F]">
                    {isAr ? 'لا توجد تقييمات منشورة بعد' : 'No verified reviews published yet'}
                  </h4>
                  <p className="text-xs text-[#795037] max-w-md mx-auto leading-relaxed">
                    {isAr
                      ? 'تُعرض تقييمات المسافرين هنا حصرياً بعد إتمام الرحلات الميدانية والتحقق من تجربة المسافر الفعلية.'
                      : 'Verified reviews appear here once travelers complete their itineraries and share verified feedback.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(rev => (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border border-[#EDE0CC] shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDE0CC] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#44200F]">{rev.travelerName}</span>
                          <span className="text-sm">{rev.travelerFlag}</span>
                          <span className="text-[11px] text-slate-500">({rev.travelerOrigin})</span>
                        </div>
                        <div className="text-xs text-[#795037] font-medium mt-0.5">
                          {isAr ? rev.tripTakenAr : rev.tripTakenEn}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-500">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{rev.date}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      "{isAr ? rev.commentAr : rev.commentEn}"
                    </p>

                    {rev.responseEn && (
                      <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE0CC] text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#44200F]">
                          <MessageSquare className="w-3.5 h-3.5 text-[#795037]" />
                          <span>{isAr ? `رد إدارة العمليات لدى ${profile.arabicName || profile.name}:` : `Response from ${profile.name} Operations:`}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {isAr ? rev.responseAr : rev.responseEn}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          )}

          {/* TAB 6: SMART PACKING GUIDE */}
          {activeTab === 'packing' && (
            <SmartTravelPackingGuide uiLang={uiLang} />
          )}

          {/* TAB 7: PHRASEBOOK & ETIQUETTE */}
          {activeTab === 'phrasebook' && (
            <TravelEtiquettePhrasebook uiLang={uiLang} />
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs" onClick={() => setActiveLightboxImage(null)}>
          <div className="max-w-4xl w-full bg-[#44200F] rounded-3xl overflow-hidden border border-[#C4A177]/30 shadow-2xl space-y-2 p-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-2 pt-1 text-white">
              <span className="text-xs font-semibold text-slate-200">{activeLightboxImage.caption}</span>
              <button onClick={() => setActiveLightboxImage(null)} className="text-slate-300 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[75vh]">
              <img src={activeLightboxImage.url} alt={activeLightboxImage.caption} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 border border-[#EDE0CC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#44200F]">
                  {isAr ? 'طلب عرض أسعار مخصص' : 'Request Custom Itinerary Quote'}
                </h3>
                <p className="text-xs text-[#795037]">
                  {profile.arabicName || profile.name}
                </p>
              </div>
              <button onClick={() => setInquiryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inquirySubmitted ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-[#44200F] text-base">
                  {isAr ? 'تم استلام طلبك بنجاح!' : 'Inquiry Submitted Successfully!'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  {isAr 
                    ? 'تم إرسال تفاصيل الرحلة إلى مسؤولي الحجوزات بالشركة وسيتواصلون معك عبر البريد الإلكتروني أو الواتساب خلال أقل من ساعتين.'
                    : 'Your itinerary request has been forwarded to the agency operations desk. A specialist will follow up shortly.'}
                </p>
                <button
                  onClick={() => setInquiryModalOpen(false)}
                  className="px-6 py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] text-xs font-bold rounded-xl transition shadow-xs"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3.5 text-xs">
                {selectedPackageForInquiry && (
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EDE0CC] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'البرنامج المختار:' : 'Selected Package:'}</span>
                      <span className="font-bold text-[#44200F]">{isAr ? selectedPackageForInquiry.titleAr : selectedPackageForInquiry.titleEn}</span>
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      ${selectedPackageForInquiry.priceUsd}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'الاسم بالكامل' : 'Full Name'} *</label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={e => setInquiryName(e.target.value)}
                      placeholder={isAr ? 'محمد علي' : 'John Doe'}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs focus:ring-2 focus:ring-[#C4A177] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email Address'} *</label>
                    <input
                      type="email"
                      required
                      value={inquiryEmail}
                      onChange={e => setInquiryEmail(e.target.value)}
                      placeholder="traveler@example.com"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs focus:ring-2 focus:ring-[#C4A177] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}</label>
                    <input
                      type="tel"
                      value={inquiryPhone}
                      onChange={e => setInquiryPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs focus:ring-2 focus:ring-[#C4A177] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'عدد المسافرين (الأفراد)' : 'Pax Count'}</label>
                    <input
                      type="number"
                      min={1}
                      max={80}
                      value={inquiryPax}
                      onChange={e => setInquiryPax(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs focus:ring-2 focus:ring-[#C4A177] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'تاريخ السفر التقريبي' : 'Approximate Travel Date'}</label>
                  <input
                    type="text"
                    value={inquiryTravelDates}
                    onChange={e => setInquiryTravelDates(e.target.value)}
                    placeholder={isAr ? 'مثلاً: أكتوبر ٢٠٢٦' : 'e.g. October 2026'}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs focus:ring-2 focus:ring-[#C4A177] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'ملاحظات أو متطلبات خاصة' : 'Custom Requests / Notes'}</label>
                  <textarea
                    rows={3}
                    value={inquiryNotes}
                    onChange={e => setInquiryNotes(e.target.value)}
                    placeholder={isAr ? 'مثلاً: رحلة عائلية تفضل كروز نيلية خاصة ومرشد يتحدث الإسبانية...' : 'e.g. Family trip interested in private Dahabiya charter...'}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs focus:ring-2 focus:ring-[#C4A177] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#EDE0CC]">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#EDE0CC] text-[#795037] hover:bg-[#FAF7F2] font-semibold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال الطلب الآن' : 'Send Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Operator Edit Public Profile Modal */}
      {editProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 border border-[#EDE0CC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#44200F]" />
                <div>
                  <h3 className="font-bold text-base text-[#44200F]">
                    {isAr ? 'تعديل الملف التعريفي للشركة (Public Profile)' : 'Edit Company Showcase & Public Profile'}
                  </h3>
                  <p className="text-[11px] text-[#795037]">
                    {isAr ? 'تحديث البيانات الرسمية والهاتف وصور الغلاف التي تظهر للمسافرين والوكالات' : 'Update verified details, contacts & imagery displayed to travelers'}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSavedSuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-[#44200F] text-base">
                  {isAr ? 'تم حفظ التعديلات بنجاح!' : 'Profile Updated Successfully!'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isAr ? 'يتم الآن تحديث العرض العام للشركة...' : 'Refreshing public showcase...'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveOperatorProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'اسم الشركة (English)' : 'Company Name (EN)'} *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'اسم الشركة (عربي)' : 'Company Name (AR)'}</label>
                    <input
                      type="text"
                      value={editArabicName}
                      onChange={e => setEditArabicName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-right"
                    />
                  </div>
                </div>



                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'رقم الهاتف' : 'Contact Phone'}</label>
                    <input
                      type="text"
                      value={editContactPhone}
                      onChange={e => setEditContactPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'واتساب' : 'WhatsApp Number'}</label>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={e => setEditWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'البريد الرسمي' : 'Contact Email'}</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'العنوان والمقر الرئيسي' : 'Address'}</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'رابط صورة الغلاف' : 'Cover Image URL'}</label>
                    <input
                      type="url"
                      value={editCoverImageUrl}
                      onChange={e => setEditCoverImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'رابط شعار الشركة' : 'Logo Image URL'}</label>
                    <input
                      type="url"
                      value={editLogoUrl}
                      onChange={e => setEditLogoUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'نبذة عن الشركة (English)' : 'About (EN)'}</label>
                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'نبذة عن الشركة (عربي)' : 'About (AR)'}</label>
                    <textarea
                      rows={2}
                      value={editDescriptionAr}
                      onChange={e => setEditDescriptionAr(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-right"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#EDE0CC]">
                  <button
                    type="button"
                    onClick={() => setEditProfileModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#EDE0CC] text-[#795037] hover:bg-[#FAF7F2] font-semibold"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حفظ البيانات والتحديث' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE TRIP DETAIL MODAL WITH IMAGE SLIDER & ARRIVAL/DEPARTURE TIMINGS */}
      {selectedTripForModal && (
        <AgencyTripDetailModal
          trip={selectedTripForModal}
          isOpen={!!selectedTripForModal}
          isAr={isAr}
          agencyName={isAr ? profile.arabicName : profile.name}
          agencyWhatsApp={profile.whatsappNumber}
          onClose={() => setSelectedTripForModal(null)}
          onRequestQuote={(trip) => {
            setSelectedTripForModal(null);
            setSelectedPackageForInquiry({
              id: trip.id,
              titleEn: trip.titleEn,
              titleAr: trip.titleAr,
              durationEn: trip.durationEn,
              durationAr: trip.durationAr,
              priceUsd: trip.priceUsd,
              imageUrl: trip.photos[0]?.url || '',
              highlightsEn: trip.highlightsEn,
              highlightsAr: trip.highlightsAr,
              destinations: trip.destinations,
            });
            setInquiryModalOpen(true);
            setInquirySubmitted(false);
          }}
        />
      )}
      </>
      )}

      {/* Story Studio Modal */}
      <TravelerStoryEditorModal
        isOpen={storyCreatorOpen}
        onClose={() => setStoryCreatorOpen(false)}
        uiLang={uiLang}
        currentWorkspace={workspace}
        onStoryPublished={() => {
          setStoriesRefreshTick(t => t + 1);
          if (onReloadData) onReloadData();
        }}
      />
    </div>
  );
};
