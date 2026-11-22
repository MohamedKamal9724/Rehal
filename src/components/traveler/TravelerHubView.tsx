import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Star, ShieldCheck, MapPin, Globe, Phone, 
  MessageSquare, Key, Search, ArrowRight, ArrowLeft, 
  ExternalLink, Sparkles, Calendar, Users, CheckCircle2, 
  Compass, LogIn, LogOut, Briefcase, Award, X, ChevronRight,
  AlertCircle, Eye, Filter, Send, Clock, User as UserIcon, ChevronDown,
  Luggage, BookOpen, LayoutGrid, List, Bookmark, Heart, Image as ImageIcon,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AgencyDirectoryItem, Quote, UILanguage, Workspace, User, Inquiry } from '../../types';
import { getAllDirectoryAgencies, syncDirectoryAgenciesFromServer } from '../../lib/agenciesData';
import { findTripOrGuestByCode, TripFile, TripPassenger } from '../../lib/tripStore';
import { repository } from '../../lib/storage';
import { RihalLogo } from '../common/RihalLogo';
import { SmartTravelPackingGuide } from './SmartTravelPackingGuide';
import { TravelEtiquettePhrasebook } from './TravelEtiquettePhrasebook';
import { TravelerStoriesBar } from './TravelerStoriesBar';
import { TravelerFeedPost } from './TravelerFeedPost';
import { TravelerGridPost } from './TravelerGridPost';
import { TravelerAgencyProfileModal } from './TravelerAgencyProfileModal';
import { TravelerWishlistDrawer } from './TravelerWishlistDrawer';
import { TRAVELER_FEED_POSTS, TRAVELER_STORIES, TravelerFeedPostItem, getAllFeedPosts } from '../../lib/travelerFeedData';
import { TravelerStoryEditorModal } from './TravelerStoryEditorModal';
import { AISupportDrawer } from '../support/AISupportDrawer';
import { AISupportFloatingTrigger } from '../support/AISupportFloatingTrigger';
import { FarisAvatarIcon } from '../common/FarisAvatarIcon';

interface TravelerHubViewProps {
  uiLang: UILanguage;
  onSetUiLang: (lang: UILanguage) => void;
  currentUser?: User;
  currentWorkspace: Workspace;
  quotes: Quote[];
  onOpenGuestPasscode: (code: string) => void;
  onOpenPortalToken: (token: string) => void;
  onOpenAgencyShowcase: (agencyId?: string) => void;
  onRequestQuoteFromAgency: (agency: AgencyDirectoryItem) => void;
  onSwitchToOperatorDesk?: () => void;
  hasCompanyMembership?: boolean;
  companyName?: string;
  onSignInTraveler?: (email: string, name?: string) => void;
  onSignOut?: () => void;
}

export const TravelerHubView: React.FC<TravelerHubViewProps> = ({
  uiLang,
  onSetUiLang,
  currentUser,
  currentWorkspace,
  onOpenGuestPasscode,
  onOpenPortalToken,
  onOpenAgencyShowcase,
  onRequestQuoteFromAgency,
  onSwitchToOperatorDesk,
  hasCompanyMembership,
  companyName,
  onSignOut,
}) => {
  const isAr = uiLang === 'ar';
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeHubTab, setActiveHubTab] = useState<'feed' | 'directory' | 'packing' | 'phrasebook' | 'support'>('feed');
  const [feedViewMode, setFeedViewMode] = useState<'feed' | 'grid'>('feed');
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [selectedAgencyProfileId, setSelectedAgencyProfileId] = useState<string | null>(null);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<TravelerFeedPostItem | null>(null);
  const [isStoryCreatorOpen, setIsStoryCreatorOpen] = useState(false);
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState(0);
  const [directoryAgencies, setDirectoryAgencies] = useState<AgencyDirectoryItem[]>(() => getAllDirectoryAgencies());

  useEffect(() => {
    setDirectoryAgencies(getAllDirectoryAgencies());
    syncDirectoryAgenciesFromServer()
      .then(list => setDirectoryAgencies(list))
      .catch(() => {});
  }, []);

  // Local storage for wishlist and likes
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rihal_traveler_wishlist');
      return saved ? JSON.parse(saved) : ['post_cai_01'];
    } catch {
      return ['post_cai_01'];
    }
  });

  const [likedPostIds, setLikedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rihal_traveler_liked_posts');
      return saved ? JSON.parse(saved) : ['post_cai_01', 'post_dah_02'];
    } catch {
      return ['post_cai_01', 'post_dah_02'];
    }
  });

  const handleToggleLike = (postId: string) => {
    setLikedPostIds(prev => {
      const updated = prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId];
      try {
        localStorage.setItem('rihal_traveler_liked_posts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleToggleWishlist = (postId: string) => {
    setWishlistIds(prev => {
      const updated = prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId];
      try {
        localStorage.setItem('rihal_traveler_wishlist', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const brandPrimary = currentWorkspace.brandColors?.primary || '#44200F';
  const brandAccent = currentWorkspace.brandColors?.accent || '#795037';
  const brandGold = currentWorkspace.brandColors?.gold || '#C4A177';

  // Booking Code Input State
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Search & Filtering State for Agencies
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  // Inquiry Modal State (3-Step Custom Trip Builder Wizard)
  const [inquiryModalAgency, setInquiryModalAgency] = useState<AgencyDirectoryItem | null>(null);
  const [inquiryStep, setInquiryStep] = useState<1 | 2 | 3>(1);
  const [inquirySelectedCities, setInquirySelectedCities] = useState<string[]>(['Cairo & Giza', 'Luxor', 'Aswan']);
  const [inquiryTripVibe, setInquiryTripVibe] = useState<string>('Luxury Nile Cruise & Heritage');
  const [inquiryDuration, setInquiryDuration] = useState<number>(8);
  const [inquiryHotelTier, setInquiryHotelTier] = useState<string>('5★ Palace & Luxury Nile Cruise');
  const [inquiryName, setInquiryName] = useState(currentUser?.name || '');
  const [inquiryEmail, setInquiryEmail] = useState(currentUser?.email || '');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryTravelDates, setInquiryTravelDates] = useState('');
  const [inquiryPaxCount, setInquiryPaxCount] = useState(2);
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquiryRequestId, setInquiryRequestId] = useState<string | null>(null);

  const openInquiryWizard = (agency: AgencyDirectoryItem) => {
    setInquiryModalAgency(agency);
    setInquiryStep(1);
    setInquirySubmitted(false);
    setInquiryError(null);
  };

  // Agency Detail Drawer
  const [selectedAgencyDetail, setSelectedAgencyDetail] = useState<AgencyDirectoryItem | null>(null);

  // Sample quick test codes — all verified against Al-Futtaim Royal Delegation (TRIP-2026-0104)
  const SAMPLE_PASSCODES = [
    { code: 'EG-CAI-7491', labelAr: 'وفد الفطيم الملكي — القاهرة والأقصر وأسوان (٧ أيام)', labelEn: 'Al-Futtaim Royal Delegation — 7-Day Cairo, Luxor & Aswan' },
    { code: 'EG-LXR-9281', labelAr: 'وفد الفطيم الملكي — الأقصر وكروز الصن بوت ٤', labelEn: 'Al-Futtaim Royal Delegation — Luxor & Sanctuary Sun Boat IV' },
    { code: 'RIHAL-842A', labelAr: 'كود العمليات الرئيسي (TRIP-2026-0104)', labelEn: 'Operations Master Passcode (TRIP-2026-0104)' },
  ];

  const GOVERNORATES = [
    { id: 'all', labelAr: 'جميع المحافظات', labelEn: 'All Governorates' },
    { id: 'Cairo', labelAr: 'القاهرة والجيزة', labelEn: 'Cairo & Giza' },
    { id: 'Luxor', labelAr: 'الأقصر', labelEn: 'Luxor' },
    { id: 'Aswan', labelAr: 'أسوان والنوبة', labelEn: 'Aswan & Nubia' },
    { id: 'Hurghada', labelAr: 'الغردقة والبحر الأحمر', labelEn: 'Hurghada & Red Sea' },
    { id: 'Sharm El Sheikh', labelAr: 'شرم الشيخ وسيناء', labelEn: 'Sharm El Sheikh' },
    { id: 'Alexandria', labelAr: 'الإسكندرية', labelEn: 'Alexandria' },
  ];

  // Filter agencies (strictly without formal license numbers)
  const filteredAgencies = useMemo(() => {
    return directoryAgencies.filter(agency => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = agency.name.toLowerCase().includes(q) || agency.arabicName.toLowerCase().includes(q);
        const matchCity = agency.governorates.some(g => g.toLowerCase().includes(q));
        const matchSpec = agency.specialties.some(s => s.toLowerCase().includes(q)) || (agency.specialtiesAr && agency.specialtiesAr.some(s => s.toLowerCase().includes(q)));
        if (!matchName && !matchCity && !matchSpec) return false;
      }
      // Governorate filter
      if (selectedGovernorate !== 'all') {
        const hasGov = agency.governorates.some(g => g.toLowerCase().includes(selectedGovernorate.toLowerCase()));
        if (!hasGov) return false;
      }
      // Specialty filter
      if (selectedSpecialty !== 'all') {
        const hasSpec = agency.specialties.some(s => s.toLowerCase().includes(selectedSpecialty.toLowerCase())) ||
          (agency.specialtiesAr && agency.specialtiesAr.some(s => s.toLowerCase().includes(selectedSpecialty.toLowerCase())));
        if (!hasSpec) return false;
      }
      return true;
    });
  }, [directoryAgencies, searchQuery, selectedGovernorate, selectedSpecialty]);

  // Filter Instagram Feed & Grid Posts (including custom company posts)
  const filteredFeedPosts = useMemo(() => {
    const allPosts = getAllFeedPosts();
    return allPosts.filter(post => {
      const locationText = (post.locationEn || post.city || '').toLowerCase();
      // Governorate filter
      if (selectedGovernorate !== 'all') {
        const qGov = selectedGovernorate.toLowerCase();
        const matchGov = locationText.includes(qGov) ||
          (selectedGovernorate === 'Cairo' && (locationText.includes('cairo') || locationText.includes('giza'))) ||
          (selectedGovernorate === 'Luxor' && locationText.includes('luxor')) ||
          (selectedGovernorate === 'Aswan' && (locationText.includes('aswan') || locationText.includes('nubia'))) ||
          (selectedGovernorate === 'Hurghada' && (locationText.includes('hurghada') || locationText.includes('red sea') || locationText.includes('dahab')));
        if (!matchGov) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (post.titleEn || '').toLowerCase().includes(q) || (post.titleAr || '').toLowerCase().includes(q);
        const matchAgency = (post.agencyName || post.agencyNameEn || '').toLowerCase().includes(q) || (post.agencyArabicName || post.agencyNameAr || '').toLowerCase().includes(q);
        const matchLoc = locationText.includes(q);
        const matchTag = (post.tags || post.hashtags || []).some(tag => tag.toLowerCase().includes(q));
        if (!matchTitle && !matchAgency && !matchLoc && !matchTag) return false;
      }
      return true;
    });
  }, [selectedGovernorate, searchQuery, feedRefreshTrigger]);

  // Handle Passcode Lookup
  const handlePasscodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasscodeError(null);
    const clean = passcodeInput.trim().toUpperCase();
    if (!clean) {
      setPasscodeError(isAr ? 'يرجى إدخال كود الرحلة' : 'Please enter a trip passcode');
      return;
    }
    const match = findTripOrGuestByCode(clean);
    if (match) {
      onOpenGuestPasscode(clean);
    } else {
      setPasscodeError(isAr ? `الكود (${clean}) غير مسجل. جرب أحد الأكواد التجريبية أدناه.` : `Passcode (${clean}) not found. Try one of the demo codes below.`);
    }
  };

  // Handle Inquiry Submission directly to the Selected Agency
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryModalAgency) return;

    setInquirySubmitting(true);
    setInquiryError(null);

    const curatedSummary = `[Style: ${inquiryTripVibe} | Duration: ${inquiryDuration} Days | Stays: ${inquiryHotelTier} | Cities: ${inquirySelectedCities.join(', ')}] ${inquiryNotes}`.trim();

    try {
      const res = await fetch('/api/traveler/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: inquiryModalAgency.id,
          travelerName: inquiryName.trim() || (isAr ? 'مسافر زائر' : 'Guest Traveler'),
          travelerEmail: inquiryEmail.trim() || 'traveler@example.com',
          travelerPhone: inquiryPhone.trim() || undefined,
          destination: inquirySelectedCities.join(', ') || inquiryTravelDates || 'Egypt',
          paxCount: inquiryPaxCount,
          notes: curatedSummary,
          language: isAr ? 'ar' : 'en',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || (isAr ? 'تعذر إرسال الطلب، يرجى المحاولة لاحقاً' : 'Failed to submit inquiry'));
      }

      const data = await res.json();
      setInquiryRequestId(data.requestId || `req_${Date.now()}`);
      setInquirySubmitted(true);
    } catch (err: any) {
      setInquiryError(err.message || (isAr ? 'تعذر إرسال الطلب، يرجى المحاولة لاحقاً' : 'Failed to submit inquiry'));
    } finally {
      setInquirySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans pb-20 md:pb-0" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Navigation Bar - Clean Luxury Minimalist Theme - Fixed dir='ltr' so logo and controls stay physically anchored */}
      <header dir="ltr" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Logo & Brand Identity (Clean, prominent, no squeezed badges) */}
          <div className="flex items-center">
            <RihalLogo 
              variant="compact" 
              isArabic={isAr} 
              size="md" 
              className="h-9 sm:h-11"
              onClick={() => {
                setActiveHubTab('directory');
                setSelectedAgencyDetail(null);
                setPasscodeInput('');
                setPasscodeError(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          {/* Center Navigation Tabs: Equal-height h-9 single-line pills */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-2xl border border-[#EDE0CC] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveHubTab('feed')}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeHubTab === 'feed'
                  ? 'bg-gradient-to-r from-[#EA580C] to-[#E1306C] text-white shadow-xs'
                  : 'text-[#795037] hover:text-[#44200F]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeHubTab === 'feed' ? 'text-white' : 'text-[#C4A177]'}`} />
              <span>{isAr ? 'القصص' : 'Stories'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveHubTab('directory')}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeHubTab === 'directory'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-[#795037] hover:text-[#44200F]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'الشركات' : 'Agencies'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveHubTab('packing')}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeHubTab === 'packing'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-[#795037] hover:text-[#44200F]'
              }`}
            >
              <Luggage className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'الحقيبة' : 'Packing'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveHubTab('phrasebook')}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeHubTab === 'phrasebook'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-[#795037] hover:text-[#44200F]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'العبارات' : 'Phrases'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveHubTab('support')}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeHubTab === 'support'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-[#795037] hover:text-[#44200F]'
              }`}
            >
              <FarisAvatarIcon size={18} className="w-4.5 h-4.5 shrink-0" />
              <span>{isAr ? 'فارس' : 'Faris'}</span>
            </button>
          </nav>

          {/* Right Header Utilities: Uniform h-9 Height across Wishlist, Language Switcher & Account Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Wishlist / Saved Packages Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE0CC] border border-[#EDE0CC] text-[#44200F] transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs"
              title={isAr ? 'المحفوظات وقائمة الأمنيات' : 'Saved Wishlist'}
            >
              <Bookmark className={`w-4 h-4 shrink-0 ${wishlistIds.length > 0 ? 'fill-[#EA580C] text-[#EA580C]' : 'text-[#795037]'}`} />
              <span className="hidden lg:inline text-xs font-bold text-[#795037]">
                {isAr ? 'المحفوظات' : 'Wishlist'}
              </span>
              {wishlistIds.length > 0 && (
                <span className="bg-[#EA580C] text-white text-[10px] font-extrabold w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Language Switcher: AR / EN (Matched h-9 container) */}
            <div className="h-9 flex items-center bg-[#FAF7F2] p-0.5 rounded-xl border border-[#EDE0CC] text-xs font-bold shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => onSetUiLang('ar')}
                className={`h-full px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                  isAr ? 'bg-[#44200F] text-[#FAF7F2] shadow-2xs font-extrabold' : 'text-[#795037] hover:text-[#44200F]'
                }`}
                title="العربية (AR)"
              >
                AR
              </button>
              <button
                type="button"
                onClick={() => onSetUiLang('en')}
                className={`h-full px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                  !isAr ? 'bg-[#44200F] text-[#FAF7F2] shadow-2xs font-extrabold' : 'text-[#795037] hover:text-[#44200F]'
                }`}
                title="English (EN)"
              >
                EN
              </button>
            </div>

            {/* Account Profile Trigger & Dropdown Menu (Matched h-9) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="h-9 flex items-center gap-2 px-1.5 sm:px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-800 transition shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                title={isAr ? 'حساب المستخدم' : 'User Account'}
                aria-expanded={accountMenuOpen}
              >
                <div 
                  className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-xs font-black shadow-2xs shrink-0"
                  style={{
                    backgroundColor: brandPrimary,
                    color: brandGold,
                  }}
                >
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[120px] truncate">
                  {currentUser?.name || (isAr ? 'حسابي' : 'Account')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Account Dropdown Menu */}
              <AnimatePresence>
                {accountMenuOpen && (
                  <>
                    {/* Backdrop to close on outside click */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setAccountMenuOpen(false)}
                      aria-hidden="true"
                    />

                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="fixed right-3 top-15 sm:top-auto sm:absolute sm:right-0 sm:mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2 z-50 text-xs"
                    >
                      {/* User Info Header */}
                      <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {currentUser?.name || (isAr ? 'حساب المستخدم' : 'User Account')}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {currentUser?.email || (isAr ? 'مستخدم معتمد' : 'Active User')}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{isAr ? 'حساب نشط ومفعل' : 'Active Account'}</span>
                        </div>
                      </div>

                      {/* Switch to Operator Desk (strictly restricted to accounts with verified company membership) */}
                      {hasCompanyMembership && onSwitchToOperatorDesk && (
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            onSwitchToOperatorDesk();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:text-[#44200F] hover:bg-amber-50/80 font-medium transition cursor-pointer text-start border border-amber-200/70 bg-amber-50/40 mb-1"
                        >
                          <Briefcase className="w-4 h-4 text-[#795037] shrink-0" />
                          <div className="truncate">
                            <div className="font-bold text-[#44200F]">
                              {companyName ? `${isAr ? 'لوحة تحكم' : 'Operator Desk:'} ${companyName}` : (isAr ? 'لوحة تحكم الشركات' : 'Operator Desk')}
                            </div>
                            <div className="text-[10px] text-slate-500">{isAr ? 'الانتقال لغرفة العمليات والتسعير' : 'DMC Operations & Cockpit'}</div>
                          </div>
                        </button>
                      )}

                      {/* Sign Out */}
                      {onSignOut && (
                        <div className="border-t border-slate-100 pt-1 mt-1">
                          <button
                            onClick={() => {
                              setAccountMenuOpen(false);
                              onSignOut();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer text-start"
                          >
                            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sub Navigation Tabs */}
      <div className="md:hidden border-b border-[#EDE0CC] px-4 py-2 bg-[#FAF7F2] flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap luxury-tab-bar">
        <button
          type="button"
          onClick={() => setActiveHubTab('feed')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
            activeHubTab === 'feed'
              ? 'bg-gradient-to-r from-[#EA580C] to-[#E1306C] text-white shadow-xs'
              : 'bg-white text-[#795037] border border-[#EDE0CC]'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeHubTab === 'feed' ? 'text-white' : 'text-[#C4A177]'}`} />
          <span>{isAr ? 'القصص' : 'Stories'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveHubTab('directory')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
            activeHubTab === 'directory'
              ? 'bg-[#44200F] text-white shadow-xs'
              : 'bg-white text-[#795037] border border-[#EDE0CC]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span>{isAr ? 'الشركات' : 'Agencies'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveHubTab('packing')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
            activeHubTab === 'packing'
              ? 'bg-[#44200F] text-white shadow-xs'
              : 'bg-white text-[#795037] border border-[#EDE0CC]'
          }`}
        >
          <Luggage className="w-3.5 h-3.5 shrink-0" />
          <span>{isAr ? 'الحقيبة' : 'Packing'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveHubTab('phrasebook')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
            activeHubTab === 'phrasebook'
              ? 'bg-[#44200F] text-white shadow-xs'
              : 'bg-white text-[#795037] border border-[#EDE0CC]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>{isAr ? 'العبارات' : 'Phrases'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveHubTab('support')}
          className={`h-9 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
            activeHubTab === 'support'
              ? 'bg-[#44200F] text-white shadow-xs'
              : 'bg-white text-[#795037] border border-[#EDE0CC]'
          }`}
        >
          <FarisAvatarIcon size={16} className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'فارس' : 'Faris'}</span>
        </button>
      </div>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* VIEW 0: INSTAGRAM-STYLE TRAVELER STORIES & FEED */}
        {activeHubTab === 'feed' && (
          <div className="space-y-6">
            {/* Top Destination Stories Bar */}
            <TravelerStoriesBar 
              uiLang={uiLang} 
              onSelectAgency={(agencyId: string) => setSelectedAgencyProfileId(agencyId)} 
              onOpenStoryCreator={() => setIsStoryCreatorOpen(true)}
              refreshTrigger={feedRefreshTrigger}
            />

            {/* Quick Trip Code Banner for Existing Bookings (Clean, Elevated, Minimal) */}
            <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 rounded-2xl p-4 border border-amber-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#44200F] text-[#C4A177] flex items-center justify-center shrink-0 shadow-2xs">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#44200F]">
                    {isAr ? 'لديك كود حجز أو رحلة سارية؟' : 'Have a Booking Passcode or Trip Code?'}
                  </h3>
                  <p className="text-[11px] text-[#795037]">
                    {isAr ? 'تابع تفاصيل خط سيرك اليومي وبيانات المرشد وقسائم الفنادق' : 'Track your live itinerary, guide contacts, and hotel vouchers'}
                  </p>
                </div>
              </div>

              {/* Quick Input & Demo Codes - Uniform h-9 */}
              <form onSubmit={handlePasscodeSubmit} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="h-9 flex items-center gap-2 px-3 bg-white border border-amber-200 rounded-xl focus-within:ring-2 focus-within:ring-[#C4A177] shadow-2xs flex-1 md:flex-initial">
                  <Key className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                  <input
                    type="text"
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      if (passcodeError) setPasscodeError(null);
                    }}
                    placeholder={isAr ? 'كود: EG-CAI-7491' : 'Code: EG-CAI-7491'}
                    className="w-28 sm:w-36 bg-transparent border-0 p-0 text-xs font-mono uppercase text-[#44200F] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="h-9 px-3.5 bg-[#44200F] hover:bg-[#321609] text-white font-bold text-xs rounded-xl transition shadow-2xs cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center justify-center"
                >
                  <span>{isAr ? 'فتح البوابة' : 'Open'}</span>
                </button>

                <div className="hidden lg:flex items-center gap-1.5 ms-1">
                  {SAMPLE_PASSCODES.slice(0, 2).map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setPasscodeInput(item.code);
                        setPasscodeError(null);
                        onOpenGuestPasscode(item.code);
                      }}
                      className="h-9 px-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-[11px] font-mono font-bold text-[#44200F] transition inline-flex items-center whitespace-nowrap shrink-0 cursor-pointer"
                      title={isAr ? item.labelAr : item.labelEn}
                    >
                      {item.code}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {passcodeError && (
              <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            {/* Feed Filter Bar: View Toggle (Feed / Grid), Destination Pills, and Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              {/* Destination Filter Pills */}
              <div className="luxury-tab-bar flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 flex-nowrap">
                {GOVERNORATES.map(gov => (
                  <button
                    key={gov.id}
                    onClick={() => setSelectedGovernorate(gov.id)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center justify-center transition cursor-pointer ${
                      selectedGovernorate === gov.id
                        ? 'bg-[#44200F] text-[#C4A177] shadow-xs'
                        : 'bg-white hover:bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC]'
                    }`}
                  >
                    {isAr ? gov.labelAr : gov.labelEn}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle (Feed vs 3-Column Grid) & Search - Uniform h-9 */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <div className="h-9 flex items-center gap-2 px-3 bg-white border border-[#EDE0CC] rounded-xl shadow-2xs flex-1 sm:w-56 focus-within:ring-2 focus-within:ring-[#C4A177]">
                  <Search className="w-3.5 h-3.5 text-[#795037] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isAr ? 'بحث بالاسم، #هاشتاج...' : 'Search tours, #tag...'}
                    className="w-full bg-transparent border-0 p-0 text-xs text-[#44200F] placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="h-9 flex items-center bg-white p-1 rounded-xl border border-[#EDE0CC] shadow-2xs shrink-0 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setFeedViewMode('feed')}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      feedViewMode === 'feed'
                        ? 'bg-[#44200F] text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={isAr ? 'عرض الخلاصة' : 'Feed View'}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedViewMode('grid')}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                      feedViewMode === 'grid'
                        ? 'bg-[#44200F] text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={isAr ? 'عرض الشبكة' : 'Grid View'}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* FEED MODE VIEW */}
            {feedViewMode === 'feed' && (
              <div className="space-y-6">
                {filteredFeedPosts.map((post) => (
                  <TravelerFeedPost
                    key={post.id}
                    post={post}
                    uiLang={uiLang}
                    isLiked={likedPostIds.includes(post.id)}
                    isSaved={wishlistIds.includes(post.id)}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleWishlist}
                    onOpenAgencyProfile={(agencyId) => setSelectedAgencyProfileId(agencyId)}
                     onOpenInquiry={(agency) => openInquiryWizard(agency)}
                   />
                 ))}
               </div>
            )}

            {/* GRID MODE VIEW (Instagram 3-Column Explore Grid) */}
            {feedViewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
                {filteredFeedPosts.map((post) => (
                  <TravelerGridPost
                    key={post.id}
                    post={post}
                    uiLang={uiLang}
                    isLiked={likedPostIds.includes(post.id)}
                    onSelect={(p) => setSelectedPostForDetail(p)}
                    onSelectAgency={(agencyId) => setSelectedAgencyProfileId(agencyId)}
                  />
                ))}
              </div>
            )}

            {filteredFeedPosts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#EDE0CC] p-8 max-w-xl mx-auto">
                <Compass className="w-12 h-12 text-[#C4A177] mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  {isAr ? 'لم نجد رحلات تطابق هذا البحث' : 'No tours match your search criteria'}
                </h3>
                <p className="text-slate-500 text-xs mb-4">
                  {isAr ? 'جرّب كتابة اسم مدينة أخرى أو تصفية عامة' : 'Try searching for another destination or reset filters'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGovernorate('all');
                  }}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] rounded-xl text-xs font-bold border border-[#EDE0CC] transition"
                >
                  {isAr ? 'إعادة ضبط عوامل التصفية' : 'Reset Filters'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 1: SMART PACKING GUIDE */}
        {activeHubTab === 'packing' && (
          <SmartTravelPackingGuide uiLang={uiLang} />
        )}

        {/* VIEW 2: TRAVEL ETIQUETTE & PHRASEBOOK */}
        {activeHubTab === 'phrasebook' && (
          <TravelEtiquettePhrasebook uiLang={uiLang} />
        )}

        {/* VIEW 4: AI OPERATIONS & SUPPORT CENTER */}
        {activeHubTab === 'support' && (
          <AISupportDrawer
            isOpen={true}
            onClose={() => setActiveHubTab('feed')}
            uiLang={uiLang}
            userRole="traveler"
            isFullPageView={true}
            onApplyPasscode={(code) => {
              const clean = code.trim().toUpperCase();
              setPasscodeInput(clean);
              setPasscodeError(null);
              const match = findTripOrGuestByCode(clean);
              if (match) {
                onOpenGuestPasscode(clean);
              }
            }}
          />
        )}

        {/* VIEW 3: ACCREDITED AGENCIES DIRECTORY & BOOKING CODE ACCESS */}
        {activeHubTab === 'directory' && (
          <>
            {/* HERO BANNER */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#44200F] via-[#5c301a] to-[#321609] text-white p-6 sm:p-10 shadow-xl border border-white/10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4A177]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EDE0CC]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#C4A177] text-xs font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصفح مفتوح ومجاني لجميع المسافرين بدون أي رسوم اشتراك' : 'Open & Free Browsing for All Travelers — Zero Subscription'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {isAr 
                ? 'استكشف وتواصل مع كبرى شركات السياحة ومنظمي الرحلات بمصر' 
                : "Explore Egypt's Premier Incoming Tour Operators & DMCs"}
            </h1>

            <p className="text-[#EDE0CC] text-sm sm:text-base leading-relaxed">
              {isAr 
                ? 'تصفح دليلاً شاملاً لشركات السياحة ومنظمي الرحلات الموثوقين في مصر، تواصل معهم مباشرة عبر واتساب بدون وسيط، أو أدخل كود رحلتك لمتابعة تفاصيل جدولك وقسائم خدماتك.'
                : 'Browse verified Egyptian tour operators and DMCs, connect directly via WhatsApp without intermediaries, or enter your trip booking code to view your live itinerary and vouchers.'}
            </p>

            {/* Quick Guarantees / Highlights */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#EDE0CC]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isAr ? 'جاهزية تشغيلية معتمدة' : 'Verified Operational Readiness'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#C4A177] shrink-0" />
                <span>{isAr ? 'تواصل فوري ومباشر مع الشركات' : 'Direct Agency Contact'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#EDE0CC] shrink-0" />
                <span>{isAr ? 'بدون أي اشتراك أو دفع للمسافرين' : 'Free for All Travelers'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: ENTER BOOKING PASSCODE */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#EDE0CC] relative overflow-hidden">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] text-[#795037] text-xs font-semibold mb-3 border border-[#EDE0CC]">
              <Key className="w-3.5 h-3.5 text-[#795037] shrink-0" />
              <span>{isAr ? 'خدمة المسافرين الحاجزين' : 'Existing Booking Access'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#44200F] mb-2">
              {isAr ? 'لديك كود حجز أو رحلة سارية؟' : 'Have a Booking Passcode or Trip Code?'}
            </h2>
            <p className="text-[#795037] text-xs sm:text-sm mb-6 leading-relaxed">
              {isAr 
                ? 'أدخل الكود الممنوح لك من شركة السياحة للاطلاع الفوري على خط سير الرحلة يوماً بيوم، توقيتات الاستقبال، بيانات السائق والمرشد وقسائم الفنادق.'
                : 'Enter the passcode provided by your tour operator to instantly view your day-by-day itinerary, chauffeur pickup schedule, Egyptologist guide contact, and hotel vouchers.'}
            </p>

            {/* Passcode Form with Flex Container (Zero Overlap with Key Icon) */}
            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className={`flex items-center gap-3 px-4 py-3 bg-[#FAF7F2] border rounded-2xl flex-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C4A177] transition ${
                  passcodeError ? 'border-rose-300 ring-1 ring-rose-200' : 'border-[#EDE0CC]'
                }`}>
                  <Key className="w-5 h-5 text-[#795037] shrink-0" />
                  <input
                    type="text"
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      if (passcodeError) setPasscodeError(null);
                    }}
                    placeholder={isAr ? 'أدخل كود الرحلة مثلاً: EG-CAI-7491' : 'Enter passcode e.g. EG-CAI-7491'}
                    className="w-full bg-transparent border-0 p-0 text-[#44200F] font-mono text-sm tracking-wider uppercase focus:outline-none focus:ring-0 placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] font-bold text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>{isAr ? 'عرض تفاصيل الرحلة' : 'Open Trip Portal'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 shrink-0" />}
                </button>
              </div>

              {passcodeError && (
                <div className="flex items-center gap-2 text-rose-600 text-xs mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passcodeError}</span>
                </div>
              )}

              {/* Demo Clickable Chips */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  {isAr ? 'جرّب بضغطة واحدة أحد الأكواد التجريبية الجاهزة:' : 'Or test immediately with a ready demo trip passcode:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PASSCODES.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setPasscodeInput(item.code);
                        setPasscodeError(null);
                        onOpenGuestPasscode(item.code);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 text-xs font-mono font-medium text-amber-900 transition"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span className="font-bold">{item.code}</span>
                      <span className="text-slate-500 font-sans text-[11px]">({isAr ? item.labelAr : item.labelEn})</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* SECTION 2: BROWSE & CHOOSE COMPANIES (Directory, Filters, Cards) */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-semibold mb-2 border border-cyan-200">
                <Building2 className="w-3.5 h-3.5 text-cyan-700" />
                <span>{isAr ? 'دليل شركات السياحة المعتمدة' : 'Official Agency Directory'}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {isAr ? 'تصفح واختيار شركات السياحة' : 'Browse & Choose Tourism Agencies'}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                {isAr 
                  ? `عرض ${filteredAgencies.length} شركة سياحة ومنظم رحلات نشط بمصر — تواصل مباشرة مع الإدارة` 
                  : `Showing ${filteredAgencies.length} verified Egyptian DMC operators — connect directly`}
              </p>
            </div>

            {/* Search Input in Natural Flex Group */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-[#EDE0CC] rounded-2xl w-full md:w-80 shadow-xs focus-within:ring-2 focus-within:ring-[#C4A177]">
              <Search className="w-4 h-4 text-[#795037] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم، المحافظة، التخصص...' : 'Search by name, city, specialty...'}
                className="w-full bg-transparent border-0 p-0 text-xs text-[#44200F] placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills for Destinations */}
          <div className="luxury-tab-bar flex items-center gap-2 overflow-x-auto pb-2 flex-nowrap">
            <span className="text-xs font-semibold text-[#795037] shrink-0 whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#795037] shrink-0" />
              {isAr ? 'الوجهة:' : 'Destination:'}
            </span>
            {GOVERNORATES.map(gov => (
              <button
                key={gov.id}
                onClick={() => setSelectedGovernorate(gov.id)}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center justify-center transition-all cursor-pointer ${
                  selectedGovernorate === gov.id
                    ? 'bg-[#44200F] text-[#C4A177] shadow-xs'
                    : 'bg-white hover:bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC]'
                }`}
              >
                {isAr ? gov.labelAr : gov.labelEn}
              </button>
            ))}
          </div>

          {/* Agency Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredAgencies.map((agency) => {
              const cleanWhatsApp = agency.whatsappNumber.replace(/[^0-9]/g, '');
              const waText = encodeURIComponent(
                isAr 
                  ? `مرحباً ${agency.arabicName}، أود الاستفسار عن برامج الرحلات السياحية المتاحة عبر منصة ريحال.` 
                  : `Hello ${agency.name}, I am inquiring about your tour packages via RIHAL Travel Portal.`
              );
              const waUrl = `https://wa.me/${cleanWhatsApp || '201000000000'}?text=${waText}`;

              return (
                <div 
                  key={agency.id}
                  onClick={() => onOpenAgencyShowcase(agency.id)}
                  className="bg-white rounded-3xl overflow-hidden border border-[#EDE0CC] shadow-xs hover:shadow-lg hover:border-[#C4A177] transition-all duration-300 flex flex-col h-full group cursor-pointer"
                >
                  {/* Card Cover Banner */}
                  <div className="relative h-36 overflow-hidden bg-[#44200F]">
                    <img 
                      src={agency.coverImageUrl} 
                      alt={isAr ? agency.arabicName : agency.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Active Operator Badge */}
                    <div className="absolute top-3 left-3 bg-[#44200F]/90 backdrop-blur-md text-[#C4A177] px-2.5 py-1 rounded-xl text-[10px] font-bold border border-[#C4A177]/30 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{isAr ? 'منظم رحلات نشط' : 'Active Operator'}</span>
                    </div>

                    {/* Rating Pill */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold text-[#44200F] flex items-center gap-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{agency.rating.toFixed(2)}</span>
                      <span className="text-slate-500 text-[10px] font-normal">({agency.reviewCount})</span>
                    </div>
                  </div>

                  {/* Card Body - Completely below cover photo, zero negative margins, generous spacing */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    {/* Agency Identity: Logo + Titles cleanly on white surface */}
                    <div className="flex items-center gap-3.5 pb-3 border-b border-[#EDE0CC]/60">
                      <img 
                        src={agency.logoUrl} 
                        alt={agency.name} 
                        className="w-13 h-13 rounded-2xl object-cover border border-[#EDE0CC] shadow-xs bg-white shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-[#44200F] truncate group-hover:text-[#795037] transition leading-snug">
                          {isAr ? agency.arabicName : agency.name}
                        </h3>
                        <p className="text-xs text-[#795037] truncate mt-0.5">
                          {isAr ? agency.name : agency.arabicName}
                        </p>
                      </div>
                    </div>
                    {/* Official Registration Details */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>{isAr ? 'حالة التشغيل:' : 'Operations:'}</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>{isAr ? 'معتمد ونشط' : 'Active & Verified'}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>{isAr ? 'المقر الرئيسي:' : 'Headquarters:'}</span>
                        <span className="text-slate-700 font-medium truncate max-w-[180px]">
                          {isAr ? agency.addressAr : agency.address}
                        </span>
                      </div>

                      {/* Brief Description */}
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed pt-1">
                        {isAr ? agency.descriptionAr : agency.description}
                      </p>
                    </div>

                    {/* Governorates / Destinations */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        {isAr ? 'الوجهات والمحافظات:' : 'Covered Destinations:'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {agency.governorates.slice(0, 4).map((gov) => (
                          <span 
                            key={gov}
                            className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#795037] text-[11px] font-medium border border-[#EDE0CC]"
                          >
                            {gov}
                          </span>
                        ))}
                        {agency.governorates.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#795037] text-[10px] border border-[#EDE0CC]">
                            +{agency.governorates.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Operational Capacities */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EDE0CC] text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#795037]" />
                        <span>{agency.guideRosterCount} {isAr ? 'مرشد معتمد' : 'Guides'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#795037]" />
                        <span>{agency.supportedLanguages.length} {isAr ? 'لغات معتمدة' : 'Languages'}</span>
                      </div>
                    </div>

                    {/* Sample Package Tag */}
                    {agency.samplePackageName && (
                      <div className="bg-[#FAF7F2] border border-[#EDE0CC] p-2.5 rounded-2xl flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] font-semibold text-[#795037] block">
                            {isAr ? 'برنامج مميز:' : 'Signature Tour:'}
                          </span>
                          <span className="font-semibold text-slate-800 truncate block text-[11px]">
                            {agency.samplePackageName}
                          </span>
                        </div>
                        {agency.samplePackagePriceUsd && (
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 block">{isAr ? 'يبدأ من' : 'from'}</span>
                            <span className="font-bold text-[#44200F]">${agency.samplePackagePriceUsd}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons: WhatsApp & Quote Request (Strictly Equal h-10) */}
                    <div className="pt-2 grid grid-cols-2 gap-2 items-stretch" onClick={(e) => e.stopPropagation()}>
                      {/* WhatsApp Button */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 flex items-center justify-center gap-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                      </a>

                      {/* Request Custom Quote Button */}
                      <button
                        onClick={() => openInquiryWizard(agency)}
                        className="h-10 flex items-center justify-center gap-1.5 px-3 bg-[#44200F] hover:bg-[#321609] text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'طلب عرض سعر' : 'Get Quote'}</span>
                      </button>
                    </div>

                    {/* View Profile & Trips Link */}
                    <button
                      type="button"
                      onClick={() => onOpenAgencyShowcase(agency.id)}
                      className="w-full h-10 text-center text-xs font-bold text-[#44200F] hover:text-[#795037] px-3 bg-[#FAF7F2] hover:bg-[#EDE0CC] rounded-xl border border-[#EDE0CC] transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
                      <span className="truncate">{isAr ? 'استعراض بروفايل الشركة والرحلات والصور' : 'View Profile, Trips & Photos'}</span>
                      {isAr ? <ChevronRight className="w-3.5 h-3.5 rotate-180 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAgencies.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
              <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-base mb-1">
                {isAr ? 'لم نجد شركات تطابق هذا البحث' : 'No agencies match your search criteria'}
              </h3>
              <p className="text-slate-500 text-xs mb-4">
                {isAr ? 'جرّب تغيير عبارة البحث أو اختيار "جميع المحافظات"' : 'Try relaxing your search query or selecting "All Governorates"'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGovernorate('all');
                  setSelectedSpecialty('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                {isAr ? 'إعادة ضبط عوامل التصفية' : 'Reset Filters'}
              </button>
            </div>
          )}
        </section>
          </>
        )}

      </main>

      {/* MODAL: 3-STEP INTERACTIVE CUSTOM TRIP BUILDER & DIRECT QUOTE INQUIRY */}
      <AnimatePresence>
        {inquiryModalAgency && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#EDE0CC] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#44200F] to-[#321609] text-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={inquiryModalAgency.logoUrl}
                    alt={inquiryModalAgency.name}
                    className="w-10 h-10 rounded-xl object-cover bg-white p-0.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">
                      {isAr ? 'تصميم رحلتك وطلب عرض سعر' : 'Custom Egypt Trip & Quote Builder'}
                    </h3>
                    <p className="text-xs text-[#C4A177] truncate">
                      {isAr ? inquiryModalAgency.arabicName : inquiryModalAgency.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInquiryModalAgency(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 text-slate-200 hover:text-white flex items-center justify-center transition shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6">
                {inquirySubmitted ? (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg text-[#44200F] mb-1">
                        {isAr ? 'تم إرسال طلب رحلتك المخصصة بنجاح!' : 'Custom Trip Request Dispatched!'}
                      </h4>
                      {inquiryRequestId && (
                        <div className="inline-block my-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                          {isAr ? `رقم الطلب المرجعي: ${inquiryRequestId}` : `Reference ID: ${inquiryRequestId}`}
                        </div>
                      )}
                      <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto mt-1">
                        {isAr
                          ? `تم توجيه تفاصيل رحلتك (${inquiryDuration} أيام · ${inquiryPaxCount} مسافرين · ${inquirySelectedCities.join('، ')}) مباشرة إلى قسم الحجوزات في ${inquiryModalAgency.arabicName}.`
                          : `Your custom ${inquiryDuration}-day itinerary request (${inquiryPaxCount} travelers · ${inquirySelectedCities.join(', ')}) has been routed directly to ${inquiryModalAgency.name}.`}
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                      <a
                        href={`https://wa.me/${inquiryModalAgency.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          isAr 
                            ? `مرحباً، أرسلت للتو طلب تصميم رحلة عبر منصة ريحال (رقم الطلب: ${inquiryRequestId || ''}) باسم ${inquiryName} لمدة ${inquiryDuration} أيام لعدد ${inquiryPaxCount} مسافرين (${inquirySelectedCities.join(' - ')}).`
                            : `Hello, I just submitted a custom ${inquiryDuration}-day trip request via RIHAL (Ref: ${inquiryRequestId || ''}) under ${inquiryName} for ${inquiryPaxCount} travelers (${inquirySelectedCities.join(', ')}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span>{isAr ? 'تأكيد فوري عبر واتساب الشركة' : 'Instant WhatsApp Confirmation'}</span>
                      </a>
                      <button
                        onClick={() => {
                          setInquiryModalAgency(null);
                          setInquirySubmitted(false);
                          setInquiryRequestId(null);
                        }}
                        className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        {isAr ? 'إغلاق' : 'Done'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    {/* Equal-Height 3-Step Indicator Bar */}
                    <div className="grid grid-cols-3 gap-2 items-stretch">
                      {[
                        { s: 1 as const, labelEn: '1. Destinations', labelAr: '١. الوجهات' },
                        { s: 2 as const, labelEn: '2. Dates & Stays', labelAr: '٢. الإقامة والمدة' },
                        { s: 3 as const, labelEn: '3. Contact Info', labelAr: '٣. التواصل' },
                      ].map((item) => {
                        const isCurrent = inquiryStep === item.s;
                        const isDone = inquiryStep > item.s;
                        return (
                          <button
                            key={item.s}
                            type="button"
                            onClick={() => setInquiryStep(item.s)}
                            className={`min-h-[42px] px-2 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap truncate cursor-pointer ${
                              isCurrent
                                ? 'bg-[#44200F] text-[#C4A177] border-[#44200F] shadow-2xs'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-[#FAF7F2] text-slate-500 border-[#EDE0CC]'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>

                    {inquiryError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{inquiryError}</span>
                      </div>
                    )}

                    {/* STEP 1: DESTINATIONS & VIBE */}
                    {inquiryStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-[#44200F] mb-2">
                            {isAr ? 'اختر المدن والمقاصد التي ترغب بزيارتها:' : 'Select destinations you wish to explore:'}
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: 'Cairo & Giza', ar: 'القاهرة والأهرامات' },
                              { id: 'Luxor', ar: 'الأقصر والكرنك' },
                              { id: 'Aswan', ar: 'أسوان وأبو سمبل' },
                              { id: 'Nile Cruise', ar: 'كروز النيل الفاخر' },
                              { id: 'Red Sea', ar: 'البحر الأحمر والغردقة' },
                              { id: 'Alexandria', ar: 'الإسكندرية' },
                            ].map((city) => {
                              const active = inquirySelectedCities.includes(city.id);
                              return (
                                <button
                                  key={city.id}
                                  type="button"
                                  onClick={() => {
                                    setInquirySelectedCities((prev) =>
                                      prev.includes(city.id)
                                        ? prev.length > 1
                                          ? prev.filter((c) => c !== city.id)
                                          : prev
                                        : [...prev, city.id]
                                    );
                                  }}
                                  className={`h-10 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-1.5 whitespace-nowrap cursor-pointer ${
                                    active
                                      ? 'bg-[#44200F] text-[#C4A177] border-[#44200F] shadow-2xs'
                                      : 'bg-[#FAF7F2] text-[#44200F] border-[#EDE0CC] hover:bg-[#EDE0CC]/60'
                                  }`}
                                >
                                  <span className="truncate">{isAr ? city.ar : city.id}</span>
                                  {active && <CheckCircle2 className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#44200F] mb-2">
                            {isAr ? 'طابع الرحلة المفضل:' : 'Preferred Travel Style:'}
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { id: 'Luxury Nile Cruise & Heritage', ar: 'كروز نيلي فاخر وآثار ملكية' },
                              { id: 'Private Family VIP Expedition', ar: 'رحلة عائلية خاصة كبار الزوار' },
                              { id: 'Archaeology & Grand Museum Focus', ar: 'استكشاف أثري والمتحف الكبير' },
                              { id: 'Romantic Honeymoon & Red Sea', ar: 'شهر عسل واستجمام بالبحر الأحمر' },
                            ].map((vibe) => {
                              const active = inquiryTripVibe === vibe.id;
                              return (
                                <button
                                  key={vibe.id}
                                  type="button"
                                  onClick={() => setInquiryTripVibe(vibe.id)}
                                  className={`h-10 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-2 whitespace-nowrap cursor-pointer ${
                                    active
                                      ? 'bg-amber-50 text-[#44200F] border-[#44200F] ring-1 ring-[#44200F]'
                                      : 'bg-white text-slate-700 border-[#EDE0CC] hover:bg-[#FAF7F2]'
                                  }`}
                                >
                                  <span className="truncate">{isAr ? vibe.ar : vibe.id}</span>
                                  <Sparkles className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-amber-600' : 'text-slate-300'}`} />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setInquiryStep(2)}
                            className="h-11 px-6 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#C4A177] text-xs font-bold transition inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            <span>{isAr ? 'التالي: المدة والإقامة' : 'Next: Dates & Stays'}</span>
                            {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: GROUP SIZE, DURATION & STAYS */}
                    {inquiryStep === 2 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC]">
                            <label className="block text-[11px] font-bold text-[#795037] mb-1.5">
                              {isAr ? 'عدد المسافرين' : 'Travelers (Pax)'}
                            </label>
                            <div className="flex items-center justify-between bg-white rounded-xl border border-[#EDE0CC] p-1">
                              <button
                                type="button"
                                onClick={() => setInquiryPaxCount(Math.max(1, inquiryPaxCount - 1))}
                                className="w-8 h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] font-bold flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-black text-sm text-[#44200F]">{inquiryPaxCount}</span>
                              <button
                                type="button"
                                onClick={() => setInquiryPaxCount(Math.min(50, inquiryPaxCount + 1))}
                                className="w-8 h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC]">
                            <label className="block text-[11px] font-bold text-[#795037] mb-1.5">
                              {isAr ? 'مدة الرحلة (أيام)' : 'Duration (Days)'}
                            </label>
                            <div className="flex items-center justify-between bg-white rounded-xl border border-[#EDE0CC] p-1">
                              <button
                                type="button"
                                onClick={() => setInquiryDuration(Math.max(3, inquiryDuration - 1))}
                                className="w-8 h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] font-bold flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-black text-sm text-[#44200F]">{inquiryDuration}d</span>
                              <button
                                type="button"
                                onClick={() => setInquiryDuration(Math.min(21, inquiryDuration + 1))}
                                className="w-8 h-8 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#44200F] mb-1.5">
                            {isAr ? 'مستوى الفنادق والإقامة:' : 'Accommodation Tier:'}
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { id: '5★ Palace & Luxury Nile Cruise', ar: 'فنادق القصور التاريخية ٥ نجوم وكروز فاخر' },
                              { id: 'Boutique Dahabiya & Heritage Stays', ar: 'ذهبية نيلية خاصة وفنادق بوتيك تراثية' },
                              { id: '4★/5★ Executive Comfort & Value', ar: 'فنادق ٤ و ٥ نجوم مميزة بتكلفة متوازنة' },
                            ].map((tier) => (
                              <button
                                key={tier.id}
                                type="button"
                                onClick={() => setInquiryHotelTier(tier.id)}
                                className={`h-10 px-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                                  inquiryHotelTier === tier.id
                                    ? 'bg-[#44200F] text-[#C4A177] border-[#44200F]'
                                    : 'bg-white text-slate-700 border-[#EDE0CC] hover:bg-[#FAF7F2]'
                                }`}
                              >
                                <span className="truncate">{isAr ? tier.ar : tier.id}</span>
                                {inquiryHotelTier === tier.id && <CheckCircle2 className="w-4 h-4 text-[#C4A177] shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {isAr ? 'تاريخ أو شهر السفر التقريبي' : 'Approximate Travel Date or Month'}
                          </label>
                          <input
                            type="text"
                            value={inquiryTravelDates}
                            onChange={(e) => setInquiryTravelDates(e.target.value)}
                            placeholder={isAr ? 'مثال: نوفمبر ٢٠٢٦، أو عطلة الشتاء' : 'e.g. November 2026, or Winter Holiday'}
                            className="w-full h-10 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setInquiryStep(1)}
                            className="h-11 px-4 rounded-xl border border-[#EDE0CC] text-xs font-bold text-[#795037] hover:bg-[#FAF7F2] transition inline-flex items-center justify-center cursor-pointer"
                          >
                            {isAr ? 'السابق' : 'Back'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setInquiryStep(3)}
                            className="h-11 px-6 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#C4A177] text-xs font-bold transition inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            <span>{isAr ? 'التالي: بيانات التواصل' : 'Next: Contact Details'}</span>
                            {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: CONTACT & SUBMIT */}
                    {inquiryStep === 3 && (
                      <div className="space-y-3.5">
                        {/* Curated Summary Pill */}
                        <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC] text-[11px] text-[#44200F] flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold">
                            {inquiryDuration} {isAr ? 'أيام' : 'Days'} · {inquiryPaxCount} {isAr ? 'مسافرين' : 'Travelers'}
                          </span>
                          <span className="text-[#795037] font-semibold truncate max-w-[220px]">
                            {inquirySelectedCities.join(' • ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              {isAr ? 'الاسم بالكامل' : 'Full Name'} *
                            </label>
                            <input
                              type="text"
                              required
                              value={inquiryName}
                              onChange={(e) => setInquiryName(e.target.value)}
                              placeholder={isAr ? 'محمد علي' : 'Mohamed Ali'}
                              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              {isAr ? 'البريد الإلكتروني' : 'Email Address'} *
                            </label>
                            <input
                              type="email"
                              required
                              value={inquiryEmail}
                              onChange={(e) => setInquiryEmail(e.target.value)}
                              placeholder="traveler@example.com"
                              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {isAr ? 'رقم الهاتف / واتساب للتواصل السريع' : 'Phone / WhatsApp Number'}
                          </label>
                          <input
                            type="tel"
                            value={inquiryPhone}
                            onChange={(e) => setInquiryPhone(e.target.value)}
                            placeholder="+20 100 000 0000"
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {isAr ? 'ملاحظات أو طلبات خاصة إضافية' : 'Additional Notes or Special Requests'}
                          </label>
                          <textarea
                            rows={2}
                            value={inquiryNotes}
                            onChange={(e) => setInquiryNotes(e.target.value)}
                            placeholder={isAr ? 'مثلاً: نفضل مرشد يتحدث الإيطالية أو جناح مطل على النيل...' : 'e.g., Private airport meet & assist, Nile view suite...'}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setInquiryStep(2)}
                            className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition inline-flex items-center justify-center cursor-pointer"
                          >
                            {isAr ? 'السابق' : 'Back'}
                          </button>
                          <button
                            type="submit"
                            disabled={inquirySubmitting}
                            className="h-11 px-5 rounded-xl bg-[#44200F] hover:bg-[#321609] disabled:opacity-50 text-[#C4A177] text-xs font-bold transition shadow-md inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 shrink-0" />
                            <span>{inquirySubmitting ? (isAr ? 'جارِ الإرسال...' : 'Submitting...') : (isAr ? 'إرسال طلب العرض الآن' : 'Submit Custom Request')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AGENCY CREDENTIALS DETAIL DRAWER */}
      <AnimatePresence>
        {selectedAgencyDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200"
            >
              {/* Cover Banner */}
              <div className="relative h-36 overflow-hidden bg-[#44200F]">
                <img
                  src={selectedAgencyDetail.coverImageUrl}
                  alt={selectedAgencyDetail.name}
                  className="w-full h-full object-cover opacity-85"
                />
                <button
                  onClick={() => setSelectedAgencyDetail(null)}
                  className="absolute top-3 end-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition shadow-xs cursor-pointer z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 text-xs text-slate-700 bg-white">
                {/* Agency Identity Row in Modal Body */}
                <div className="flex items-center gap-4 pb-4 border-b border-[#EDE0CC]">
                  <img
                    src={selectedAgencyDetail.logoUrl}
                    alt={selectedAgencyDetail.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#EDE0CC] bg-white shadow-xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-lg text-[#44200F] leading-tight">
                      {isAr ? selectedAgencyDetail.arabicName : selectedAgencyDetail.name}
                    </h3>
                    <p className="text-xs text-[#795037] mt-0.5">
                      {isAr ? selectedAgencyDetail.name : selectedAgencyDetail.arabicName}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold mt-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{selectedAgencyDetail.rating}</span>
                      <span className="text-slate-500 font-normal">({selectedAgencyDetail.reviewCount} {isAr ? 'تقييم معتمد' : 'reviews'})</span>
                    </div>
                  </div>
                </div>
                {/* Operational Readiness Card */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'حالة التشغيل الميداني' : 'Operations Status'}</span>
                    <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>{isAr ? 'نشط ومعتمد' : 'Active & Verified'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'سنة التأسيس' : 'Founded Year'}</span>
                    <span className="font-bold text-slate-800">{selectedAgencyDetail.foundedYear}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'دعم الطوارئ' : 'Duty Support'}</span>
                    <span className="font-bold text-[#44200F]">{isAr ? 'مكتب عمليات ٢٤/٧' : '24/7 Operations Desk'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'نطاق الرحلات' : 'Destinations'}</span>
                    <span className="font-medium text-slate-700">{isAr ? 'مصر الشاملة' : 'Pan-Egypt'}</span>
                  </div>
                </div>

                {/* About */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">{isAr ? 'عن الشركة' : 'About the Agency'}</h4>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {isAr ? selectedAgencyDetail.descriptionAr : selectedAgencyDetail.description}
                  </p>
                </div>

                {/* Specialties */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">{isAr ? 'التخصصات والخدمات المميزة' : 'Key Specialties'}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(isAr && selectedAgencyDetail.specialtiesAr ? selectedAgencyDetail.specialtiesAr : selectedAgencyDetail.specialties).map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Contacts */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isAr ? 'الهاتف المباشر:' : 'Direct Phone:'}</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-800">{selectedAgencyDetail.contactPhone}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isAr ? 'العنوان الرسمي:' : 'Official Address:'}</span>
                    </span>
                    <span className="text-slate-800 font-medium">{isAr ? selectedAgencyDetail.addressAr : selectedAgencyDetail.address}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 flex gap-2">
                  <a
                    href={`https://wa.me/${selectedAgencyDetail.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      isAr ? 'مرحباً، أود التواصل معكم عبر منصة ريحال السياحية.' : 'Hello, contacting you via RIHAL Travel Portal.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isAr ? 'محادثة واتساب مباشرة' : 'Direct WhatsApp Chat'}</span>
                  </a>
                  <button
                    onClick={() => {
                      const agency = selectedAgencyDetail;
                      setSelectedAgencyDetail(null);
                      setInquiryModalAgency(agency);
                      setInquirySubmitted(false);
                    }}
                    className="flex-1 py-3 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAr ? 'طلب عرض أسعار' : 'Request Quote'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: INSTAGRAM WISHLIST DRAWER */}
      <TravelerWishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        uiLang={uiLang}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onSelectPost={(post) => setSelectedPostForDetail(post)}
      />

      {/* MODAL: INSTAGRAM-STYLE AGENCY CREATOR PROFILE */}
      <AnimatePresence>
        {selectedAgencyProfileId && (
          <TravelerAgencyProfileModal
            agencyId={selectedAgencyProfileId}
            uiLang={uiLang}
            onClose={() => setSelectedAgencyProfileId(null)}
            onSelectPost={(post) => setSelectedPostForDetail(post)}
            onOpenInquiry={(agency) => {
              setSelectedAgencyProfileId(null);
              setInquiryModalAgency(agency);
              setInquirySubmitted(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* MODAL: FOCUSED FEED POST DETAIL (Triggered from Grid or Wishlist) */}
      <AnimatePresence>
        {selectedPostForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm" dir={isAr ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative max-w-xl w-full max-h-[92vh] overflow-y-auto rounded-3xl"
            >
              <button
                type="button"
                onClick={() => setSelectedPostForDetail(null)}
                className="absolute top-3 end-3 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition shadow-md cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <TravelerFeedPost
                post={selectedPostForDetail}
                uiLang={uiLang}
                isLiked={likedPostIds.includes(selectedPostForDetail.id)}
                isSaved={wishlistIds.includes(selectedPostForDetail.id)}
                onToggleLike={handleToggleLike}
                onToggleSave={handleToggleWishlist}
                onOpenAgencyProfile={(agencyId) => {
                  setSelectedPostForDetail(null);
                  setSelectedAgencyProfileId(agencyId);
                }}
                onOpenInquiry={(agency) => {
                  setSelectedPostForDetail(null);
                  setInquiryModalAgency(agency);
                  setInquirySubmitted(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TravelerStoryEditorModal
        isOpen={isStoryCreatorOpen}
        onClose={() => setIsStoryCreatorOpen(false)}
        uiLang={uiLang}
        currentWorkspace={currentWorkspace}
        onStoryPublished={() => setFeedRefreshTrigger(prev => prev + 1)}
      />

      {/* FLOATING AI SUPPORT TRIGGER & MODAL DRAWER (Hidden when viewing full-page Faris tab) */}
      {activeHubTab !== 'support' && (
        <AISupportFloatingTrigger
          uiLang={uiLang}
          isOpen={isSupportDrawerOpen}
          onOpenSupport={() => setIsSupportDrawerOpen(true)}
          userRole="traveler"
        />
      )}

      <AISupportDrawer
        isOpen={isSupportDrawerOpen}
        onClose={() => setIsSupportDrawerOpen(false)}
        uiLang={uiLang}
        userRole="traveler"
        isFullPageView={false}
        onApplyPasscode={(code) => {
          setIsSupportDrawerOpen(false);
          const clean = code.trim().toUpperCase();
          setPasscodeInput(clean);
          setPasscodeError(null);
          const match = findTripOrGuestByCode(clean);
          if (match) {
            onOpenGuestPasscode(clean);
          }
        }}
      />

      {/* Mobile Fixed Thumb-Zone Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE0CC] px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 gap-1 items-stretch">
          <button
            type="button"
            onClick={() => setActiveHubTab('feed')}
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
              activeHubTab === 'feed'
                ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                : 'text-[#795037] hover:bg-[#FAF7F2]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'القصص' : 'Stories'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHubTab('directory')}
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
              activeHubTab === 'directory'
                ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                : 'text-[#795037] hover:bg-[#FAF7F2]'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'الشركات' : 'Agencies'}</span>
          </button>

          <button
            type="button"
            onClick={() => openInquiryWizard(directoryAgencies[0] || getAllDirectoryAgencies()[0])}
            className="min-h-[48px] rounded-xl bg-gradient-to-r from-[#EA580C] to-[#E1306C] text-white flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'صمم رحلتك' : 'Plan Trip'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHubTab('packing')}
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
              activeHubTab === 'packing'
                ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                : 'text-[#795037] hover:bg-[#FAF7F2]'
            }`}
          >
            <Luggage className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'الحقيبة' : 'Packing'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHubTab('support')}
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
              activeHubTab === 'support'
                ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                : 'text-[#795037] hover:bg-[#FAF7F2]'
            }`}
          >
            <FarisAvatarIcon size={16} className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'فارس' : 'Faris'}</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium text-slate-700">
            {isAr ? 'ريحال (RIHAL) — منصة ربط المسافرين بكبرى شركات السياحة ومنظمي الرحلات بمصر' : 'RIHAL — Connecting Travelers with Egypt Tour Operators & DMCs'}
          </p>
          <p className="text-[11px] text-slate-400">
            {isAr 
              ? 'تصفح مجاني بالكامل للمسافرين • لا توجد عمولات خفية • جاهزية تشغيلية كاملة واستجابة مباشرة عبر واتساب' 
              : 'Completely free for travelers • No hidden markups • Full operational readiness with direct WhatsApp concierge'}
          </p>
        </div>
      </footer>
    </div>
  );
};
