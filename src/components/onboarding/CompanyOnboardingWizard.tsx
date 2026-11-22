import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, Phone, Mail, FileText, ArrowRight, ArrowLeft, 
  CheckCircle2, Sparkles, Users, UserPlus, Trash2, 
  Globe, MapPin, Layers, Image as ImageIcon, Check, 
  Save, LogOut, ChevronRight, Briefcase, Plus, X,
  Compass, Plane, BookOpen, Star, HelpCircle, AlertCircle, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workspace, CustomStaffRole, UILanguage, Currency } from '../../types';
import { RihalLogo } from '../common/RihalLogo';
import { 
  OnboardingDraftData, 
  calculateOnboardingProgress, 
  getSavedOnboardingDraft, 
  fetchOnboardingDraftFromServer,
  persistOnboardingDraft, 
  clearOnboardingDraft 
} from '../../lib/onboardingCalculator';
import { CircularProgressIndicator } from './CircularProgressIndicator';
import {
  getStoredToken,
  updateOperatorCompanyOnServer,
  inviteTeamMemberOnServer,
} from '../../services/authService';
import {
  normalizeEgyptianPhone,
  validateEgyptianPhone,
  suggestArabicCompanyName,
} from '../../lib/phone';

export interface CompanyOnboardingWizardProps {
  initialCompanyName?: string;
  initialEmail?: string;
  initialLang?: UILanguage;
  currentUser?: { name?: string; email?: string; photoUrl?: string };
  workspace?: Workspace;
  onCancel?: () => void;
  onComplete: (data: {
    workspaceData: Partial<Workspace>;
    activateStarterTariffs: boolean;
    teamMembers?: Array<{ name: string; email: string; role: string; phone?: string }>;
    customRoles?: CustomStaffRole[];
    destinationAction?: 'inquiry' | 'quote' | 'dashboard';
    publicProfileSkipped?: boolean;
  }) => void;
}

// 5 Understandable Role Templates
export const ROLE_TEMPLATES = [
  { id: 'Owner', labelEn: 'Owner', labelAr: 'المالك', descEn: 'Executive control over all settings, billing, and team', descAr: 'إدارة كاملة للنظام، الفواتير، وفريق العمل' },
  { id: 'Sales', labelEn: 'Sales', labelAr: 'المبيعات', descEn: 'Manage inbound inquiries, quote building, and client proposals', descAr: 'استقبال الطلبات، بناء عروض الأسعار، وتجهيز البرامج' },
  { id: 'Operations', labelEn: 'Operations', labelAr: 'العمليات والتشغيل', descEn: 'Manage confirmed trips, drivers, guides, and vouchers', descAr: 'إدارة الرحلات المؤكدة، السائقين، المرشدين، والقسائم' },
  { id: 'Finance', labelEn: 'Finance', labelAr: 'المالية', descEn: 'Financial ledger, supplier payments, and margin approvals', descAr: 'دفتر الحسابات، مدفوعات الموردين، واعتماد الهوامش' },
  { id: 'Viewer', labelEn: 'Viewer', labelAr: 'مستعرض فقط', descEn: 'Read-only access to itineraries and schedules', descAr: 'اطلاع فقط على البرامج والرحلات دون صلاحية التعديل' },
];

// Simple Selectable Business Areas
export const BUSINESS_AREAS = [
  { 
    id: 'sales', 
    titleEn: 'Sales & Quotes', 
    titleAr: 'عروض الأسعار والمبيعات', 
    descEn: 'Capture inquiries from WhatsApp, build custom itineraries, and send pricing quotes.', 
    descAr: 'استقبال استفسارات العملاء والواتساب، بناء البرامج السياحية، وإرسال عروض الأسعار.',
    icon: FileText,
  },
  { 
    id: 'trips', 
    titleEn: 'Trip Operations', 
    titleAr: 'إدارة وتشغيل الرحلات', 
    descEn: 'Operate confirmed trips, assign drivers and guides, and generate hotel vouchers.', 
    descAr: 'تشغيل الرحلات المؤكدة، تعيين السائقين والمرشدين، وإصدار قسائم الإقامة الميدانية.',
    icon: Plane,
  },
  { 
    id: 'rates', 
    titleEn: 'Rates & Suppliers', 
    titleAr: 'مكتبة الأسعار والموردين', 
    descEn: 'Store supplier rate contracts for hotels, cruises, transport, and monuments.', 
    descAr: 'حفظ وتحديث عقود وأسعار الفنادق، الكروزات النيلية، النقل، ورسوم المزارات.',
    icon: Layers,
  },
  { 
    id: 'hajj_umrah', 
    titleEn: 'Hajj & Umrah', 
    titleAr: 'برامج الحج والعمرة', 
    descEn: 'Dedicated vertical for Makkah & Madinah packages, pilgrim groups, and visas.', 
    descAr: 'مسار مخصص لبرامج مكة والمدينة، أفواج المعتمرين، الحجوزات، والتأشيرات.',
    icon: Compass,
  },
  { 
    id: 'showcase', 
    titleEn: 'Public Company Profile', 
    titleAr: 'الملف التعريفي والصفحة العامة', 
    descEn: 'Showcase your company on the RIHAL directory and receive direct traveler leads.', 
    descAr: 'عرض شركتك في دليل رحال السياحي واستقبال استفسارات المسافرين المباشرة.',
    icon: Globe,
  },
];

export const CompanyOnboardingWizard: React.FC<CompanyOnboardingWizardProps> = ({
  initialCompanyName = '',
  initialEmail = '',
  initialLang = 'ar',
  currentUser,
  workspace,
  onCancel,
  onComplete,
}) => {
  const [lang, setLang] = useState<UILanguage>(initialLang);
  const isAr = lang === 'ar';

  // Load saved draft if present
  const savedDraft = useMemo(() => getSavedOnboardingDraft(), []);

  // Step state: 1: Company, 2: Team, 3: Business Areas, 4: Public Profile, 5: Ready
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (savedDraft?.currentStep && savedDraft.currentStep >= 1 && savedDraft.currentStep <= 5) {
      return savedDraft.currentStep;
    }
    return 1;
  });

  // Step 1: Your Company (Blank editable fields with helpful placeholders)
  const isBlueNileWs = workspace?.id === 'comp_bluenile_01' || workspace?.id === 'ws-default' || workspace?.id === 'ws-demo';
  const initialEn =
    savedDraft?.company?.name ||
    initialCompanyName ||
    (workspace?.name && workspace.name !== 'unconfigured' && !isBlueNileWs ? workspace.name : '');
  const initialAr =
    savedDraft?.company?.arabicName ??
    (workspace?.arabicName && !isBlueNileWs ? workspace.arabicName : suggestArabicCompanyName(initialEn));

  const [englishName, setEnglishName] = useState(initialEn);
  const [arabicName, setArabicName] = useState(initialAr);
  const [arabicTouched, setArabicTouched] = useState<boolean>(
    Boolean(savedDraft?.company?.arabicName !== undefined || (workspace?.arabicName && !isBlueNileWs))
  );
  const [contactEmail, setContactEmail] = useState(
    savedDraft?.company?.contactEmail || initialEmail || (!isBlueNileWs && workspace?.contactEmail ? workspace.contactEmail : '')
  );
  const [contactPhone, setContactPhone] = useState(
    savedDraft?.company?.contactPhone || (!isBlueNileWs && workspace?.contactPhone ? workspace.contactPhone : '')
  );
  const [phoneBlurred, setPhoneBlurred] = useState<boolean>(Boolean(savedDraft?.company?.contactPhone || workspace?.contactPhone));
  const [description, setDescription] = useState(
    savedDraft?.company?.description || (!isBlueNileWs && workspace?.description ? workspace.description : '')
  );
  const [city, setCity] = useState(savedDraft?.company?.city || 'Cairo');
  const [website, setWebsite] = useState(savedDraft?.company?.website || '');
  const [logoUrl, setLogoUrl] = useState(savedDraft?.company?.logoUrl || (!isBlueNileWs && workspace?.logoUrl ? workspace.logoUrl : ''));
  const [coverImageUrl, setCoverImageUrl] = useState(savedDraft?.company?.coverImageUrl || (!isBlueNileWs && workspace?.coverImageUrl ? workspace.coverImageUrl : ''));

  // Validation refs and field error messages (Continue is never silently disabled)
  const englishNameRef = useRef<HTMLInputElement | null>(null);
  const contactEmailRef = useRef<HTMLInputElement | null>(null);
  const contactPhoneRef = useRef<HTMLInputElement | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    englishName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }>({});
  const [validationBanner, setValidationBanner] = useState<string | null>(null);

  // Step 2: Team (Working alone vs inviting team)
  const [isWorkingAlone, setIsWorkingAlone] = useState<boolean>(() => {
    if (savedDraft?.team?.isSolo !== undefined) return savedDraft.team.isSolo;
    return true;
  });
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    status: 'invited' | 'active';
  }>>(() => {
    if (savedDraft?.team?.members && savedDraft.team.members.length > 0) {
      return savedDraft.team.members;
    }
    return [];
  });
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Sales');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showCustomPermissions, setShowCustomPermissions] = useState(false);

  // Step 3: Business Areas
  const [selectedAreas, setSelectedAreas] = useState<string[]>(() => {
    if (savedDraft?.businessAreas && savedDraft.businessAreas.length > 0) {
      return savedDraft.businessAreas;
    }
    return ['sales', 'trips', 'rates'];
  });

  // Step 4: Public Profile (Optional)
  const [publicDestinations, setPublicDestinations] = useState<string[]>(() => {
    return savedDraft?.publicProfile?.destinations || ['Cairo', 'Giza', 'Luxor', 'Aswan'];
  });
  const [isProfileSkipped, setIsProfileSkipped] = useState(savedDraft?.publicProfile?.isSkipped || false);

  // Auto-save banner feedback
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [hasHydratedFromServer, setHasHydratedFromServer] = useState(false);

  // Hydrate saved onboarding step & fields from server on mount (reload resume)
  useEffect(() => {
    let active = true;
    const token = getStoredToken();
    fetchOnboardingDraftFromServer(token).then(serverDraft => {
      if (!active) return;
      if (serverDraft) {
        const localTime = savedDraft?.lastSavedAt ? new Date(savedDraft.lastSavedAt).getTime() : 0;
        const serverTime = serverDraft.lastSavedAt ? new Date(serverDraft.lastSavedAt).getTime() : 1;
        if (!savedDraft || serverTime >= localTime) {
          if (serverDraft.currentStep >= 1 && serverDraft.currentStep <= 5) {
            setCurrentStep(serverDraft.currentStep);
          }
          if (serverDraft.company?.name) setEnglishName(serverDraft.company.name);
          if (serverDraft.company?.arabicName !== undefined) {
            setArabicName(serverDraft.company.arabicName);
            setArabicTouched(true);
          }
          if (serverDraft.company?.contactEmail) setContactEmail(serverDraft.company.contactEmail);
          if (serverDraft.company?.contactPhone) {
            setContactPhone(serverDraft.company.contactPhone);
            setPhoneBlurred(true);
          }
          if (serverDraft.company?.description !== undefined) setDescription(serverDraft.company.description);
          if (serverDraft.company?.city) setCity(serverDraft.company.city);
          if (serverDraft.company?.website !== undefined) setWebsite(serverDraft.company.website);
          if (serverDraft.company?.logoUrl !== undefined) setLogoUrl(serverDraft.company.logoUrl);
          if (serverDraft.company?.coverImageUrl !== undefined) setCoverImageUrl(serverDraft.company.coverImageUrl);
          if (serverDraft.team?.isSolo !== undefined) setIsWorkingAlone(serverDraft.team.isSolo);
          if (Array.isArray(serverDraft.team?.members)) setTeamMembers(serverDraft.team.members);
          if (Array.isArray(serverDraft.businessAreas) && serverDraft.businessAreas.length > 0) {
            setSelectedAreas(serverDraft.businessAreas);
          }
          if (Array.isArray(serverDraft.publicProfile?.destinations)) {
            setPublicDestinations(serverDraft.publicProfile.destinations);
          }
          if (serverDraft.publicProfile?.isSkipped !== undefined) {
            setIsProfileSkipped(serverDraft.publicProfile.isSkipped);
          }
        }
      }
      setHasHydratedFromServer(true);
    }).catch(() => {
      if (active) setHasHydratedFromServer(true);
    });
    return () => { active = false; };
  }, []);

  // Auto-suggest Arabic transliteration while user hasn't manually edited Arabic field
  const handleEnglishNameChange = (val: string) => {
    setEnglishName(val);
    if (fieldErrors.englishName) {
      setFieldErrors(prev => ({ ...prev, englishName: undefined }));
      setValidationBanner(null);
    }
    if (!arabicTouched) {
      setArabicName(suggestArabicCompanyName(val));
    }
  };

  // Egyptian phone validation state
  const phoneValidation = useMemo(() => validateEgyptianPhone(contactPhone), [contactPhone]);

  const handlePhoneBlur = () => {
    setPhoneBlurred(true);
    if (!contactPhone.trim()) {
      setFieldErrors(prev => ({
        ...prev,
        contactPhone: isAr
          ? 'يرجى إدخال رقم هاتف أو واتساب مصري صحيح (مثال: +20 100 000 0000)'
          : 'Please enter a valid Egyptian phone or WhatsApp number (e.g. +20 100 000 0000)',
      }));
      return;
    }
    const normalized = normalizeEgyptianPhone(contactPhone);
    if (normalized.isValid) {
      setContactPhone(normalized.display);
      setFieldErrors(prev => ({ ...prev, contactPhone: undefined }));
      setValidationBanner(null);
    } else {
      setFieldErrors(prev => ({
        ...prev,
        contactPhone: isAr
          ? 'صيغة رقم الهاتف غير صحيحة. أدخل رقماً مصرياً مثل +20 100 000 0000 أو 01000000000'
          : 'Invalid phone number. Enter an Egyptian mobile or landline such as +20 100 000 0000 or 01000000000',
      }));
    }
  };

  // Calculate live progress
  const progressDraft = useMemo<OnboardingDraftData>(() => ({
    currentStep,
    lastSavedAt: new Date().toISOString(),
    company: {
      name: englishName,
      arabicName,
      contactEmail,
      contactPhone,
      description,
      city,
      website,
      logoUrl,
      coverImageUrl,
    },
    team: {
      isSolo: isWorkingAlone,
      members: teamMembers,
      isSkipped: isWorkingAlone,
    },
    businessAreas: selectedAreas,
    publicProfile: {
      destinations: publicDestinations,
      isSkipped: isProfileSkipped,
    },
  }), [
    currentStep, englishName, arabicName, contactEmail, contactPhone,
    description, city, website, logoUrl, coverImageUrl,
    isWorkingAlone, teamMembers, selectedAreas, publicDestinations, isProfileSkipped
  ]);

  const progressScore = useMemo(() => {
    return calculateOnboardingProgress(progressDraft, workspace);
  }, [progressDraft, workspace]);

  // Clean step-based percentage indicator: 20%, 40%, 60%, 80%, 100%
  const stepPercentage = currentStep === 1 ? 20 : currentStep === 2 ? 40 : currentStep === 3 ? 60 : currentStep === 4 ? 80 : 100;

  // Persist draft after initial hydration
  useEffect(() => {
    if (!hasHydratedFromServer) return;
    const token = getStoredToken();
    persistOnboardingDraft(progressDraft, token).catch(() => {});
  }, [progressDraft, hasHydratedFromServer]);

  const handleManualSave = async () => {
    const token = getStoredToken();
    await persistOnboardingDraft(progressDraft, token);
    setSavedFeedback(isAr ? 'تم حفظ المسودة على الخادم بنجاح' : 'Progress saved securely to server');
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  // Explicit Step 1 validation with scroll + focus on first invalid field (Continue button is NEVER silently disabled)
  const validateStep1 = (): boolean => {
    const errors: { englishName?: string; contactEmail?: string; contactPhone?: string } = {};
    const missingNames: string[] = [];
    let firstInvalidRef: React.RefObject<HTMLInputElement | null> | null = null;

    if (!englishName.trim()) {
      errors.englishName = isAr ? 'يرجى إدخال اسم الشركة بالإنجليزية' : 'Please enter your company name';
      missingNames.push(isAr ? 'اسم الشركة' : 'Company Name');
      if (!firstInvalidRef) firstInvalidRef = englishNameRef;
    }

    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      errors.contactEmail = isAr ? 'يرجى إدخال بريد إلكتروني صحيح للعمليات' : 'Please enter a valid contact email';
      missingNames.push(isAr ? 'البريد الإلكتروني' : 'Contact Email');
      if (!firstInvalidRef) firstInvalidRef = contactEmailRef;
    }

    const phoneCheck = normalizeEgyptianPhone(contactPhone);
    if (!phoneCheck.isValid) {
      errors.contactPhone = isAr
        ? 'يرجى إدخال رقم هاتف/واتساب مصري صحيح مثل +20 100 000 0000 أو 01000000000'
        : 'Please enter a valid Egyptian phone/WhatsApp number (e.g. +20 100 000 0000 or 01000000000)';
      missingNames.push(isAr ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp');
      if (!firstInvalidRef) firstInvalidRef = contactPhoneRef;
    } else if (phoneCheck.display !== contactPhone) {
      setContactPhone(phoneCheck.display);
    }

    setFieldErrors(errors);
    setPhoneBlurred(true);

    if (missingNames.length > 0) {
      setValidationBanner(
        isAr
          ? `يرجى استكمال الحقول المطلوبة قبل المتابعة: ${missingNames.join('، ')}`
          : `Please complete the required fields before continuing: ${missingNames.join(', ')}`
      );
      if (firstInvalidRef?.current) {
        firstInvalidRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidRef.current.focus();
      }
      return false;
    }

    setValidationBanner(null);
    return true;
  };

  const handleContinueStep = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      const normalized = normalizeEgyptianPhone(contactPhone);
      const finalPhone = normalized.isValid ? normalized.display : contactPhone.trim();
      setContactPhone(finalPhone);
      updateOperatorCompanyOnServer({
        name: englishName.trim(),
        arabicName: arabicName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: finalPhone,
        description: description.trim() || undefined,
      }).catch(() => {});
    }

    if (currentStep === 2 && !isWorkingAlone && teamMembers.length > 0) {
      for (const m of teamMembers) {
        inviteTeamMemberOnServer({ name: m.name, email: m.email, role: m.role }).catch(() => {});
      }
    }

    if (currentStep === 4) {
      setIsProfileSkipped(false);
      updateOperatorCompanyOnServer({
        name: englishName.trim(),
        arabicName: arabicName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        description: description.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
        publishToDirectory: true,
      }).catch(() => {});
    }

    const nextStep = Math.min(5, currentStep + 1);
    setCurrentStep(nextStep);
    const token = getStoredToken();
    persistOnboardingDraft({ ...progressDraft, currentStep: nextStep }, token).catch(() => {});
  };

  const handleAddTeamMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim().includes('@')) return;
    const newMember = {
      id: `invite-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      phone: newMemberPhone.trim() || undefined,
      status: 'invited' as const,
    };
    setTeamMembers(prev => [...prev, newMember]);
    inviteTeamMemberOnServer({ name: newMember.name, email: newMember.email, role: newMember.role }).catch(() => {});
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setShowAddMemberForm(false);
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const toggleBusinessArea = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? (prev.length > 1 ? prev.filter(a => a !== areaId) : prev) 
        : [...prev, areaId]
    );
  };

  // Complete Onboarding and launch chosen initial action
  const handleFinalLaunch = (destinationAction: 'inquiry' | 'quote' | 'dashboard') => {
    const normalized = normalizeEgyptianPhone(contactPhone);
    const finalPhone = normalized.isValid ? normalized.display : contactPhone.trim();
    clearOnboardingDraft();
    onComplete({
      workspaceData: {
        name: englishName.trim(),
        arabicName: arabicName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: finalPhone,
        whatsappNumber: finalPhone,
        description: description.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
        coveredDestinations: publicDestinations,
        enableHajjUmrah: selectedAreas.includes('hajj_umrah'),
        isDataReadinessComplete: true,
      },
      activateStarterTariffs: selectedAreas.includes('rates'),
      teamMembers,
      destinationAction,
      publicProfileSkipped: isProfileSkipped,
    });
  };

  return (
    <div 
      className="min-h-screen bg-[#FAF7F2] text-[#44200F] flex flex-col font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP HEADER & PROGRESS BAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EDE0CC] px-3.5 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <RihalLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#44200F] whitespace-nowrap">RIHAL</span>
                <span className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-[#EDE0CC]/60 font-semibold text-[#795037] whitespace-nowrap">
                  {isAr ? 'إعداد مساحة عمل الشركة' : 'Company Workspace Setup'}
                </span>
                <span className="sm:hidden inline-flex text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EDE0CC] font-bold text-[#795037] whitespace-nowrap">
                  {isAr ? `خطوة ${currentStep}/5` : `Step ${currentStep}/5`}
                </span>
              </div>
              <p className="text-[11px] text-[#795037] hidden sm:block truncate">
                {isAr ? 'رحلة إعداد سريعة بدون تعقيدات بيروقراطية' : 'Intuitive onboarding built for travel professionals'}
              </p>
            </div>
          </div>

          {/* Center Progress */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <CircularProgressIndicator 
              percentage={stepPercentage}
              size="sm"
              isArabic={isAr}
            />
            <div className="hidden md:block text-xs">
              <div className="font-bold text-[#44200F] whitespace-nowrap">
                {isAr ? `الخطوة ${currentStep} من 5` : `Step ${currentStep} of 5`}
              </div>
              <div className="text-[11px] text-[#795037] whitespace-nowrap">
                {currentStep === 1 && (isAr ? 'بيانات الشركة الأساسية' : 'Your Company')}
                {currentStep === 2 && (isAr ? 'فريق العمل' : 'Your Team')}
                {currentStep === 3 && (isAr ? 'مجالات العمل' : 'Business Focus')}
                {currentStep === 4 && (isAr ? 'الملف التعريفي' : 'Public Profile')}
                {currentStep === 5 && (isAr ? 'جاهز للانطلاق' : 'Ready to Launch')}
              </div>
            </div>
          </div>

          {/* Top Actions: Language & Save & Exit */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
              className="h-9 px-2.5 rounded-xl border border-[#EDE0CC] hover:bg-[#FAF7F2] text-xs font-bold text-[#795037] transition inline-flex items-center justify-center whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAr ? 'English' : 'عربي'}
            </button>
            <button
              type="button"
              onClick={handleManualSave}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition inline-flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">{isAr ? 'حفظ ومتابعة لاحقاً' : 'Save & Exit'}</span>
              <span className="sm:hidden">{isAr ? 'حفظ' : 'Save'}</span>
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition inline-flex items-center justify-center shrink-0 cursor-pointer"
                title={isAr ? 'خروج' : 'Exit'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auto-save notification banner */}
      {savedFeedback && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs text-center py-1.5 font-bold animate-fadeIn">
          {savedFeedback}
        </div>
      )}

      {/* 2. MAIN ONBOARDING WORKSPACE */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-8 flex flex-col justify-center">
        {/* Step Indicator Pills - Equal Height & Width Across Mobile & Desktop */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 mb-5 sm:mb-8 items-stretch">
          {[
            { step: 1, labelEn: 'Company', labelAr: 'الشركة' },
            { step: 2, labelEn: 'Team', labelAr: 'الفريق' },
            { step: 3, labelEn: 'Focus', labelAr: 'النشاط' },
            { step: 4, labelEn: 'Profile', labelAr: 'الملف' },
            { step: 5, labelEn: 'Ready', labelAr: 'الانطلاق' },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <div 
                key={item.step} 
                className={`flex flex-col items-center justify-center text-center min-h-[58px] sm:min-h-[66px] px-1.5 py-2 rounded-xl transition border ${
                  isCurrent 
                    ? 'border-[#44200F] bg-white shadow-xs font-extrabold text-[#44200F]' 
                    : isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' 
                    : 'border-[#EDE0CC]/60 bg-white/50 text-slate-400'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mb-1 shrink-0 ${
                  isCurrent 
                    ? 'bg-[#44200F] text-white' 
                    : isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.step}
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold whitespace-nowrap truncate max-w-full">
                  {isAr ? item.labelAr : item.labelEn}
                </span>
              </div>
            );
          })}
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-md p-5 sm:p-10">
          <AnimatePresence mode="wait">
            {/* ============================================================== */}
            {/* STEP 1: YOUR COMPANY                                           */}
            {/* ============================================================== */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isAr ? 'الخطوة 1: بيانات شركتك' : 'Step 1: Your Company'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#44200F]">
                    {isAr ? 'أدخل المعلومات الأساسية لشركتك السياحية' : 'Enter your company information'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#795037] mt-1">
                    {isAr 
                      ? 'هذه البيانات تُستخدم في ترويسة عروض الأسعار وقسائم التشغيل للتواصل المباشر مع المسافرين والشركاء.'
                      : 'This information appears on quotes, itineraries, and vouchers for direct partner and traveler communications.'}
                  </p>
                </div>

                {validationBanner && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-semibold" role="alert">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{validationBanner}</span>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* English Name (Required) */}
                  <div>
                    <label htmlFor="onb-company-en" className="block text-xs font-bold text-[#44200F] mb-1">
                      {isAr ? 'اسم الشركة بالإنجليزية *' : 'Company Name (English) *'}
                    </label>
                    <input
                      id="onb-company-en"
                      ref={englishNameRef}
                      type="text"
                      value={englishName}
                      onChange={e => handleEnglishNameChange(e.target.value)}
                      placeholder={isAr ? 'مثال: Abbas Tours' : 'e.g. Abbas Tours'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white focus:outline-hidden focus:ring-1 ${
                        fieldErrors.englishName
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30'
                          : 'border-slate-300 focus:border-[#44200F] focus:ring-[#44200F]'
                      }`}
                      dir="ltr"
                    />
                    {fieldErrors.englishName && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-700">{fieldErrors.englishName}</p>
                    )}
                  </div>

                  {/* Arabic Name (Optional with smart editable suggestion) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="onb-company-ar" className="block text-xs font-bold text-[#44200F]">
                        {isAr ? 'اسم الشركة بالعربية' : 'Company Name (Arabic)'}
                      </label>
                      <span className="text-[11px] font-medium text-[#795037]">
                        {isAr ? '(اختياري)' : '(Optional)'}
                      </span>
                    </div>
                    <input
                      id="onb-company-ar"
                      type="text"
                      value={arabicName}
                      onChange={e => {
                        setArabicTouched(true);
                        setArabicName(e.target.value);
                      }}
                      placeholder={isAr ? 'اختياري — يُستخدم الاسم الإنجليزي تلقائياً عند تركه فارغاً' : 'Optional — English name is used if left blank'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#44200F] focus:ring-1 focus:ring-[#44200F] text-sm text-slate-800 bg-white"
                      dir="rtl"
                    />
                  </div>

                  {/* Contact Email (Required) */}
                  <div>
                    <label htmlFor="onb-contact-email" className="block text-xs font-bold text-[#44200F] mb-1">
                      {isAr ? 'البريد الإلكتروني للعمليات *' : 'Contact Email *'}
                    </label>
                    <input
                      id="onb-contact-email"
                      ref={contactEmailRef}
                      type="email"
                      value={contactEmail}
                      onChange={e => {
                        setContactEmail(e.target.value);
                        if (fieldErrors.contactEmail) {
                          setFieldErrors(prev => ({ ...prev, contactEmail: undefined }));
                          setValidationBanner(null);
                        }
                      }}
                      placeholder="operations@yourcompany.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white focus:outline-hidden focus:ring-1 ${
                        fieldErrors.contactEmail
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30'
                          : 'border-slate-300 focus:border-[#44200F] focus:ring-[#44200F]'
                      }`}
                      dir="ltr"
                    />
                    {fieldErrors.contactEmail && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-700">{fieldErrors.contactEmail}</p>
                    )}
                  </div>

                  {/* Phone / WhatsApp (Required — Egyptian Normalizer + WhatsApp Verified Tick) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="onb-contact-phone" className="block text-xs font-bold text-[#44200F]">
                        {isAr ? 'رقم الهاتف والواتساب *' : 'Phone / WhatsApp *'}
                      </label>
                      {phoneBlurred && phoneValidation.isValid && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAr ? 'رقم واتساب صحيح' : 'WhatsApp ready'}</span>
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="onb-contact-phone"
                        ref={contactPhoneRef}
                        type="tel"
                        value={contactPhone}
                        onChange={e => {
                          setContactPhone(e.target.value);
                          if (fieldErrors.contactPhone) {
                            setFieldErrors(prev => ({ ...prev, contactPhone: undefined }));
                            setValidationBanner(null);
                          }
                        }}
                        onBlur={handlePhoneBlur}
                        placeholder="+20 100 000 0000"
                        className={`w-full px-3.5 py-2.5 pe-9 rounded-xl border text-sm text-slate-800 bg-white focus:outline-hidden focus:ring-1 ${
                          fieldErrors.contactPhone
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/30'
                            : phoneBlurred && phoneValidation.isValid
                              ? 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500'
                              : 'border-slate-300 focus:border-[#44200F] focus:ring-[#44200F]'
                        }`}
                        dir="ltr"
                      />
                      {phoneBlurred && phoneValidation.isValid && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute end-3 top-3 pointer-events-none" />
                      )}
                    </div>
                    {fieldErrors.contactPhone ? (
                      <p className="mt-1 text-[11px] font-semibold text-rose-700">{fieldErrors.contactPhone}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#795037]">
                        {isAr
                          ? 'يدعم الأرقام المصرية (01000000000 أو +20 100 000 0000) ويُنسّق تلقائياً للواتساب.'
                          : 'Accepts Egyptian numbers (01000000000 or +20 100 000 0000) and normalizes automatically.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Optional Fields Accordion / Section */}
                <div className="pt-2 border-t border-[#EDE0CC]/60 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-[#795037]">
                    <span>{isAr ? 'معلومات إضافية (اختيارية)' : 'Optional details'}</span>
                    <span className="text-[11px] text-slate-400">{isAr ? 'يمكن ضبطها لاحقاً' : 'Can be filled later'}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary City (Optional) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {isAr ? 'المدينة والمقر الرئيسي' : 'Primary Operating City'}
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder={isAr ? 'القاهرة، الأقصر، أسوان، شرم الشيخ...' : 'Cairo, Luxor, Aswan...'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50"
                      />
                    </div>

                    {/* Website (Optional) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        {isAr ? 'الموقع الإلكتروني' : 'Website'}
                      </label>
                      <input
                        type="url"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Description (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {isAr ? 'نبذة تعريفية مختصرة' : 'Company Bio / Overview'}
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={isAr ? 'نبذة عن تخصصات شركتكم السياحية والرحلات التي تنظمونها...' : 'Brief description of your travel agency and destination specialties...'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 resize-none"
                    />
                  </div>
                </div>

                {/* Bottom Assurance Note */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr
                      ? 'بياناتك التشغيلية كافية بالكامل لإنشاء عروض الأسعار وتأكيد الحجوزات وإصدار جداول الرحلات فوراً.'
                      : 'Your operational coordinates are ready to immediately create quotes, confirm bookings, and issue trip itineraries.'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STEP 2: YOUR TEAM                                              */}
            {/* ============================================================== */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold mb-2">
                    <Users className="w-3.5 h-3.5 text-indigo-700" />
                    <span>{isAr ? 'الخطوة 2: فريق العمل' : 'Step 2: Your Team'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#44200F]">
                    {isAr ? 'هل تعمل بمفردك أم مع فريق عمل؟' : 'Are you working alone or with a team?'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#795037] mt-1">
                    {isAr 
                      ? 'يمكنك دعوة زملائك في المبيعات والتشغيل والمالية لتوزيع المهام بصلاحيات محددة.'
                      : 'You can invite colleagues and assign intuitive roles, or start solo and invite them anytime later.'}
                  </p>
                </div>

                {/* 2 Options Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsWorkingAlone(true)}
                    className={`p-5 rounded-2xl border-2 text-start transition cursor-pointer flex flex-col justify-between ${
                      isWorkingAlone 
                        ? 'border-[#44200F] bg-white shadow-sm ring-1 ring-[#44200F]' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-3 font-bold">
                        1
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-[#44200F]">
                        {isAr ? 'أبدأ بمفردي الآن' : "I'm starting alone"}
                      </h3>
                      <p className="text-xs text-[#795037] mt-1">
                        {isAr
                          ? 'أنت المالك والمسؤول الوحيد عن الحساب حالياً. يمكنك دعوة فريقك في أي وقت من الإعدادات.'
                          : 'You will have full control as Owner. You can invite team members at any time from Team Settings.'}
                      </p>
                    </div>
                    {isWorkingAlone && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-4">
                        <Check className="w-4 h-4" />
                        <span>{isAr ? 'تم الاختيار' : 'Selected'}</span>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkingAlone(false);
                      if (teamMembers.length === 0) setShowAddMemberForm(true);
                    }}
                    className={`p-5 rounded-2xl border-2 text-start transition cursor-pointer flex flex-col justify-between ${
                      !isWorkingAlone 
                        ? 'border-[#44200F] bg-white shadow-sm ring-1 ring-[#44200F]' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-[#44200F]/10 flex items-center justify-center text-[#44200F] mb-3">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-[#44200F]">
                        {isAr ? 'دعوة فريق العمل' : 'Invite my team'}
                      </h3>
                      <p className="text-xs text-[#795037] mt-1">
                        {isAr
                          ? 'أضف زملاء العمل في المبيعات، الحجوزات، والعمليات الميدانية بقوالب صلاحيات واضحة.'
                          : 'Add sales agents, operations coordinators, or accountants with clear role templates.'}
                      </p>
                    </div>
                    {!isWorkingAlone && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-4">
                        <Check className="w-4 h-4" />
                        <span>{isAr ? 'تم الاختيار' : 'Selected'}</span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Team Invitation Form (Only if "Invite my team" is chosen) */}
                {!isWorkingAlone && (
                  <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#44200F]">
                        {isAr ? 'قائمة أعضاء الفريق المدعوين' : 'Invited Team Members'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddMemberForm(prev => !prev)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-[#44200F] rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إضافة عضو جديد' : 'Add Member'}</span>
                      </button>
                    </div>

                    {/* Member Add Inputs */}
                    {showAddMemberForm && (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'الاسم' : 'Name'}
                            </label>
                            <input
                              type="text"
                              value={newMemberName}
                              onChange={e => setNewMemberName(e.target.value)}
                              placeholder={isAr ? 'أحمد الشريف' : 'Ahmed El-Sharif'}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'البريد الإلكتروني' : 'Email'}
                            </label>
                            <input
                              type="email"
                              value={newMemberEmail}
                              onChange={e => setNewMemberEmail(e.target.value)}
                              placeholder="ahmed@agency.eg"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                              dir="ltr"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'الدور الوظيفي' : 'Role'}
                            </label>
                            <select
                              value={newMemberRole}
                              onChange={e => setNewMemberRole(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                            >
                              {ROLE_TEMPLATES.map(r => (
                                <option key={r.id} value={r.id}>
                                  {isAr ? `${r.labelAr} (${r.descAr})` : `${r.labelEn} - ${r.descEn}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddMemberForm(false)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={handleAddTeamMember}
                            disabled={!newMemberName.trim() || !newMemberEmail.trim().includes('@')}
                            className="px-3.5 py-1.5 bg-[#44200F] text-white text-xs font-bold rounded-lg hover:bg-[#32170a] disabled:opacity-50"
                          >
                            {isAr ? 'حفظ وإرسال الدعوة' : 'Send Invite'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Member List */}
                    {teamMembers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        {isAr ? 'لم يتم إضافة أعضاء بعد. اضغط "إضافة عضو جديد" لدعوة زملائك.' : 'No team members added yet. Click "Add Member" to invite your colleagues.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teamMembers.map(m => (
                          <div 
                            key={m.id} 
                            className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-[#44200F]">{m.name}</div>
                                <div className="text-[11px] text-slate-500">{m.email} · <span className="text-amber-700 font-semibold">{m.role}</span></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
                                {isAr ? 'دعوة معلقة' : 'Pending Invite'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Collapsed Customise Permissions */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCustomPermissions(prev => !prev)}
                        className="text-[11px] text-[#795037] hover:text-[#44200F] font-bold underline flex items-center gap-1"
                      >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showCustomPermissions ? 'rotate-90' : ''}`} />
                        <span>{isAr ? 'تخصيص الصلاحيات المتقدمة (اختياري)' : 'Customise advanced permissions (Optional)'}</span>
                      </button>

                      {showCustomPermissions && (
                        <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                          <p>
                            {isAr 
                              ? 'صلاحيات مصفوفة الأمان الـ 17 موديول متاحة بمرونة لاحقاً داخل: الشركة > الفريق والصلاحيات. القوالب الافتراضية كافية لبدء العمل فوراً.'
                              : 'The full 17-module permission matrix can be fine-tuned later inside Company > Team & Permissions. Standard templates provide instant secure defaults.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STEP 3: WHAT DO YOU USE RIHAL FOR?                             */}
            {/* ============================================================== */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isAr ? 'الخطوة 3: نشاط الشركة' : 'Step 3: What do you use RIHAL for?'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#44200F]">
                    {isAr ? 'ما هي مجالات عملك الأساسية في رحال؟' : 'What do you use RIHAL for?'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#795037] mt-1">
                    {isAr 
                      ? 'حدد الخدمات التي تركز عليها لتخصيص اختصارات الواجهة وأولويات العمل في مساحتك.'
                      : 'Select the business areas your agency focuses on. This personalises shortcuts and workspace navigation.'}
                  </p>
                </div>

                {/* 5 Selectable Business Area Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {BUSINESS_AREAS.map((area) => {
                    const isSelected = selectedAreas.includes(area.id);
                    const Icon = area.icon;
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => toggleBusinessArea(area.id)}
                        className={`p-4 rounded-2xl border-2 text-start transition cursor-pointer flex items-start gap-3.5 ${
                          isSelected 
                            ? 'border-[#44200F] bg-white shadow-2xs ring-1 ring-[#44200F]' 
                            : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#44200F] text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-[#44200F]">
                              {isAr ? area.titleAr : area.titleEn}
                            </span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-[#44200F] border-[#44200F] text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-xs text-[#795037] mt-1 line-clamp-2">
                            {isAr ? area.descAr : area.descEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900">
                  {isAr 
                    ? 'ملاحظة: هذا الاختيار لا يقيد أي صلاحيات أمنية، بل يخصص شريط الأدوات وسرعة الوصول للوظائف الأهم لشركتك.'
                    : 'Note: Selecting business areas personalises your navigation priority. You will always have access to all system tools.'}
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STEP 4: PUBLIC PROFILE (OPTIONAL / SKIPPABLE)                   */}
            {/* ============================================================== */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold mb-2">
                      <Globe className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                      <span>{isAr ? 'الخطوة 4: الملف التعريفي العام (اختياري)' : 'Step 4: Public Profile (Optional)'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#44200F]">
                      {isAr ? 'عرض شركتك في دليل المسافرين' : 'Showcase your agency to travelers'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#795037] mt-1">
                      {isAr 
                        ? 'أضف لمستك الجمالية لعرضها في معرض الشركات السياحية، أو اضغط "تخطي" للوصول لغرفة العمليات فوراً.'
                        : 'Add branding for the public travel directory, or skip to launch your operational workspace immediately.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileSkipped(true);
                      setCurrentStep(5);
                    }}
                    className="h-9 px-3.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition whitespace-nowrap shrink-0 self-start inline-flex items-center justify-center cursor-pointer"
                  >
                    {isAr ? 'تخطي هذه الخطوة' : 'Skip for now'}
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Logo URL */}
                  <div>
                    <label className="block text-xs font-bold text-[#44200F] mb-1">
                      {isAr ? 'رابط شعار الشركة (Logo)' : 'Company Logo URL'}
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                      dir="ltr"
                    />
                  </div>

                  {/* Cover Image URL */}
                  <div>
                    <label className="block text-xs font-bold text-[#44200F] mb-1">
                      {isAr ? 'رابط صورة الغلاف الفاخرة' : 'Cover Image URL'}
                    </label>
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={e => setCoverImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                      dir="ltr"
                    />
                  </div>

                  {/* Covered Destinations */}
                  <div>
                    <label className="block text-xs font-bold text-[#44200F] mb-1">
                      {isAr ? 'أهم المقاصد السياحية التي تغطيها شركتك' : 'Covered Tourism Destinations'}
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Cairo', 'Giza', 'Luxor', 'Aswan', 'Hurghada', 'Sharm El Sheikh', 'Alexandria', 'Siwa', 'Makkah', 'Madinah'].map(dest => {
                        const isChecked = publicDestinations.includes(dest);
                        return (
                          <button
                            key={dest}
                            type="button"
                            onClick={() => {
                              setPublicDestinations(prev => 
                                isChecked ? prev.filter(d => d !== dest) : [...prev, dest]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                              isChecked 
                                ? 'bg-[#44200F] text-white border-[#44200F]' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {dest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================== */}
            {/* STEP 5: READY                                                  */}
            {/* ============================================================== */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-4 space-y-6"
              >
                {/* Celebratory Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 shadow-sm mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#44200F]">
                    {isAr
                      ? `مساحة عمل ${arabicName.trim() || englishName.trim() || 'شركتك'} جاهزة!`
                      : `${englishName.trim() || 'Your'} workspace is ready.`}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#795037] mt-1 max-w-lg mx-auto">
                    {isAr
                      ? 'تم حفظ إعداداتك الحقيقية على الخادم. اختر خطوتك الأولى للبدء الآن:'
                      : 'Your workspace configuration has been saved to the server. Choose how you would like to begin:'}
                  </p>
                </div>

                {/* Real Workspace Readiness Summary Computed from Actual Saved State */}
                <div className="bg-[#FAF7F2] border border-[#EDE0CC] rounded-2xl p-4 text-start grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-[#795037]">
                      {isAr ? 'نسبة الجاهزية' : 'Readiness'}
                    </div>
                    <div className="text-base font-black text-[#44200F] tabular-nums mt-0.5">
                      {progressScore.percentage}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#795037]">
                      {isAr ? 'رقم الواتساب' : 'WhatsApp'}
                    </div>
                    <div className="text-xs font-bold text-emerald-800 truncate mt-1" dir="ltr">
                      {phoneValidation.isValid ? phoneValidation.display : (contactPhone || '—')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#795037]">
                      {isAr ? 'فريق العمل' : 'Team Setup'}
                    </div>
                    <div className="text-xs font-bold text-[#44200F] mt-1">
                      {isWorkingAlone
                        ? (isAr ? 'مالك منفرد' : 'Solo Owner')
                        : (isAr ? `${teamMembers.length} مدعوين` : `${teamMembers.length} invited`)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#795037]">
                      {isAr ? 'مجالات التشغيل' : 'Active Focus'}
                    </div>
                    <div className="text-xs font-bold text-[#44200F] mt-1">
                      {isAr ? `${selectedAreas.length} أقسام مفعّلة` : `${selectedAreas.length} areas enabled`}
                    </div>
                  </div>
                </div>

                {/* 3 Real Operational Launch Cards (Zero Demo Seeding) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-start pt-2">
                  {/* Action 1: Add First Enquiry */}
                  <button
                    type="button"
                    onClick={() => handleFinalLaunch('inquiry')}
                    className="p-5 rounded-2xl border-2 border-indigo-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/40 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-sm text-[#44200F]">
                        {isAr ? 'تسجيل أول طلب وارد' : 'Add your first enquiry'}
                      </h3>
                      <p className="text-xs text-[#795037] mt-1">
                        {isAr
                          ? 'استقبل طلباً جديداً من واتساب أو البريد لتحويله لعرض سعر فوراً.'
                          : 'Intake a traveler lead from WhatsApp or web form to begin quoting.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mt-4 group-hover:translate-x-0.5 transition-transform">
                      <span>{isAr ? 'فتح صندوق الطلبات' : 'Open Inbox'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Action 2: Create First Quote */}
                  <button
                    type="button"
                    onClick={() => handleFinalLaunch('quote')}
                    className="p-5 rounded-2xl border-2 border-[#44200F] bg-white hover:bg-[#FAF7F2] transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#44200F] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-5 h-5 text-[#C4A177]" />
                      </div>
                      <h3 className="font-extrabold text-sm text-[#44200F]">
                        {isAr ? 'إنشاء أول عرض سعر' : 'Create your first quote'}
                      </h3>
                      <p className="text-xs text-[#795037] mt-1">
                        {isAr
                          ? 'صمم برنامجاً سياحياً مخصصاً يوماً بيوم مع حساب تكاليف الموردين وهامش الربح.'
                          : 'Build a customized day-by-day itinerary with pricing and margins.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#44200F] mt-4 group-hover:translate-x-0.5 transition-transform">
                      <span>{isAr ? 'فتح صانع العروض' : 'Open Quote Builder'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Action 3: Open Dashboard & Readiness Overview */}
                  <button
                    type="button"
                    onClick={() => handleFinalLaunch('dashboard')}
                    className="p-5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-sm text-[#44200F]">
                        {isAr ? 'فتح لوحة التحكم ونظرة الجاهزية' : 'Open Dashboard & Readiness Overview'}
                      </h3>
                      <p className="text-xs text-[#795037] mt-1">
                        {isAr
                          ? 'انتقل إلى لوحة العمليات النظيفة لمتابعة جاهزية شركتك وإضافة أسعارك الحقيقية.'
                          : 'Enter your clean operational cockpit to track readiness and manage your live workspace.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-4 group-hover:translate-x-0.5 transition-transform">
                      <span>{isAr ? 'الدخول للوحة التحكم' : 'Open Dashboard'}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3. NAVIGATION CONTROLS (Back / Continue / Skip) */}
          <div className="mt-8 pt-5 border-t border-[#EDE0CC] flex items-center justify-between gap-3">
            {/* Back Button */}
            <div>
              {currentStep > 1 && currentStep < 5 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="h-11 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeft className={`w-3.5 h-3.5 shrink-0 ${isAr ? 'rotate-180' : ''}`} />
                  <span className="hidden sm:inline">{isAr ? 'الرجوع للخطوة السابقة' : 'Back'}</span>
                  <span className="sm:hidden">{isAr ? 'رجوع' : 'Back'}</span>
                </button>
              )}
            </div>

            {/* Next / Continue Buttons */}
            <div className="flex items-center gap-2">
              {currentStep === 4 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileSkipped(true);
                    setCurrentStep(5);
                  }}
                  className="h-11 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition inline-flex items-center justify-center whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isAr ? 'تخطي' : 'Skip'}
                </button>
              )}

              {currentStep < 5 && (
                <button
                  type="button"
                  onClick={handleContinueStep}
                  className="h-11 px-6 rounded-xl bg-[#44200F] hover:bg-[#32170a] text-white text-xs font-bold transition inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{isAr ? 'متابعة' : 'Continue'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
