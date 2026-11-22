import React, { useState, useRef } from 'react';
import { 
  X, Upload, Link2, Sparkles, Image as ImageIcon, Video, 
  MessageSquare, DollarSign, MapPin, Check, Eye, Type, 
  MoveVertical, AlertCircle, Play, Pause, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DestinationStory, StorySlide, StoryTextStyle, 
  StoryTextPosition, StoryMediaType, saveCustomStory 
} from '../../lib/travelerFeedData';
import { getAllDirectoryAgencies } from '../../lib/agenciesData';
import { UILanguage, Workspace } from '../../types';

interface TravelerStoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLang: UILanguage;
  onStoryPublished: (newStory: DestinationStory) => void;
  currentWorkspace?: Workspace;
  initialStory?: DestinationStory | null;
}

const PRESET_MEDIA_SAMPLES = [
  {
    nameEn: 'Pyramids Golden Sunset',
    nameAr: 'غروب الأهرامات الذهبي',
    url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1080&q=85',
    type: 'image' as StoryMediaType,
    destinationEn: 'Giza & Cairo',
    destinationAr: 'القاهرة والجيزة',
  },
  {
    nameEn: 'Nile Dahabiya Sailing',
    nameAr: 'إبحار دهبية النيل الخاصة',
    url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1080&q=85',
    type: 'image' as StoryMediaType,
    destinationEn: 'Nile Dahabiya',
    destinationAr: 'كروز ودهبيات النيل',
  },
  {
    nameEn: 'Luxor Temple Columns',
    nameAr: 'أعمدة معبد الأقصر المهيبة',
    url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1080&q=85',
    type: 'image' as StoryMediaType,
    destinationEn: 'Luxor & Thebes',
    destinationAr: 'الأقصر وطيبة',
  },
  {
    nameEn: 'Red Sea Azure Waters',
    nameAr: 'مياه البحر الأحمر الفيروزية',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1080&q=85',
    type: 'image' as StoryMediaType,
    destinationEn: 'Red Sea & Dahab',
    destinationAr: 'البحر الأحمر ودهب',
  },
  {
    nameEn: 'Siwa Salt Springs',
    nameAr: 'ينابيع ملح واحة سيوة',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=85',
    type: 'image' as StoryMediaType,
    destinationEn: 'Siwa Oasis',
    destinationAr: 'واحة سيوة',
  },
];

export const TravelerStoryEditorModal: React.FC<TravelerStoryEditorModalProps> = ({
  isOpen,
  onClose,
  uiLang,
  onStoryPublished,
  currentWorkspace,
  initialStory,
}) => {
  const isAr = uiLang === 'ar';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const availableAgencies = React.useMemo(() => {
    const baseAgencies = getAllDirectoryAgencies();
    if (!currentWorkspace) return baseAgencies;
    const exists = baseAgencies.some(a => a.id === currentWorkspace.id);
    if (exists) return baseAgencies;
    return [
      {
        id: currentWorkspace.id,
        name: currentWorkspace.name || 'My Travel Company',
        arabicName: currentWorkspace.arabicName || currentWorkspace.name || 'شركتي للسياحة',
        slug: currentWorkspace.slug || 'my-company',
        logoUrl: currentWorkspace.logoUrl || 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=200&q=80',
        coverImageUrl: currentWorkspace.coverImageUrl || 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
        whatsappNumber: currentWorkspace.whatsappNumber || currentWorkspace.contactPhone || '+201000000000',
        contactPhone: currentWorkspace.contactPhone || '+201000000000',
        contactEmail: currentWorkspace.contactEmail || 'info@rihal.eg',
        rating: currentWorkspace.rating || 4.95,
        reviewCount: currentWorkspace.reviewCount || 42,
        tourismLicenseNumber: '',
        licenseClass: 'Class A' as const,
        commercialRegistry: '',
        taxRegistrationNumber: '',
        address: currentWorkspace.address || 'Cairo, Egypt',
        governorates: currentWorkspace.coveredDestinations || ['Cairo'],
        supportedLanguages: currentWorkspace.supportedLanguages || ['Arabic', 'English'],
        minGroupPax: 1,
        maxGroupPax: 40,
        guideRosterCount: currentWorkspace.guideRosterCount || 10,
        fleetCount: currentWorkspace.fleetCount || 8,
        foundedYear: currentWorkspace.foundedYear || 2020,
        description: currentWorkspace.description || '',
        descriptionAr: currentWorkspace.descriptionAr || '',
        brandColors: currentWorkspace.brandColors || { primary: '#44200F', accent: '#795037', gold: '#C4A177' },
        samplePackageName: 'Signature Egypt Tour',
        samplePackagePriceUsd: 1450,
        isVerified: Boolean(currentWorkspace.isPlatformVerified),
        specialties: [],
        specialtiesAr: [],
      },
      ...baseAgencies,
    ];
  }, [currentWorkspace]);

  // Form State
  const [mediaSourceTab, setMediaSourceTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [mediaUrl, setMediaUrl] = useState<string>(initialStory?.slides[0]?.imageUrl || PRESET_MEDIA_SAMPLES[0].url);
  const [mediaType, setMediaType] = useState<StoryMediaType>(initialStory?.slides[0]?.mediaType || 'image');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Story Text Overlays
  const [titleEn, setTitleEn] = useState(initialStory?.slides[0]?.titleEn || 'Private Dahabiya Sunset Experience');
  const [titleAr, setTitleAr] = useState(initialStory?.slides[0]?.titleAr || 'تجربة إبحار استثنائية على دهبية النيل الفاخرة');
  const [subtitleEn, setSubtitleEn] = useState(initialStory?.slides[0]?.subtitleEn || 'Exclusive charter with chef & Egyptologist');
  const [subtitleAr, setSubtitleAr] = useState(initialStory?.slides[0]?.subtitleAr || 'رحلة خاصة متكاملة مع شيف محترف ومرشد متخصص');

  // Styling & Placement
  const [textStyle, setTextStyle] = useState<StoryTextStyle>(initialStory?.slides[0]?.textStyle || 'luxury-gold');
  const [textPosition, setTextPosition] = useState<StoryTextPosition>(initialStory?.slides[0]?.textPosition || 'bottom');

  // WhatsApp Call to Action & Commercials
  const [enableWhatsAppCta, setEnableWhatsAppCta] = useState(true);
  const [ctaTextEn, setCtaTextEn] = useState(initialStory?.slides[0]?.ctaTextEn || 'Inquire via WhatsApp');
  const [ctaTextAr, setCtaTextAr] = useState(initialStory?.slides[0]?.ctaTextAr || 'احجز واستفسر عبر واتساب');
  const [packagePriceUsd, setPackagePriceUsd] = useState<number | undefined>(initialStory?.slides[0]?.packagePriceUsd ?? 1450);
  const [whatsappNumber, setWhatsappNumber] = useState(initialStory?.slides[0]?.whatsappNumber || availableAgencies[0].whatsappNumber || '+201000000000');

  // Operator & Destination Attribution
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(initialStory?.agencyId || availableAgencies[0].id);
  const [destinationEn, setDestinationEn] = useState(initialStory?.destinationEn || 'Nile Dahabiya');
  const [destinationAr, setDestinationAr] = useState(initialStory?.destinationAr || 'كروز ودهبيات النيل');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  React.useEffect(() => {
    if (initialStory && initialStory.slides[0]) {
      const s = initialStory.slides[0];
      setMediaUrl(s.imageUrl);
      setMediaType(s.mediaType || 'image');
      setTitleEn(s.titleEn);
      setTitleAr(s.titleAr);
      setSubtitleEn(s.subtitleEn);
      setSubtitleAr(s.subtitleAr);
      setTextStyle(s.textStyle || 'luxury-gold');
      setTextPosition(s.textPosition || 'bottom');
      setPackagePriceUsd(s.packagePriceUsd);
      setWhatsappNumber(s.whatsappNumber || availableAgencies[0].whatsappNumber);
      setSelectedAgencyId(initialStory.agencyId);
      setDestinationEn(initialStory.destinationEn);
      setDestinationAr(initialStory.destinationAr);
    }
  }, [initialStory, availableAgencies]);

  // Handle local file upload (image or short video)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setUploadedFileName(file.name);

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMediaUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Publishing the Story
  const handlePublish = () => {
    if (!mediaUrl.trim()) {
      setErrorMsg(isAr ? 'يرجى تحميل صورة أو فيديو أو إدخال رابط وسائط' : 'Please upload media or provide a media URL');
      return;
    }
    if (!titleEn.trim() && !titleAr.trim()) {
      setErrorMsg(isAr ? 'يرجى كتابة عنوان للقصة' : 'Please provide a story title');
      return;
    }

    setIsPublishing(true);
    setErrorMsg(null);

    const chosenAgency = availableAgencies.find(a => a.id === selectedAgencyId) || availableAgencies[0];

    const newSlide: StorySlide = {
      id: initialStory?.slides[0]?.id || `slide_${Date.now()}`,
      imageUrl: mediaUrl,
      mediaType,
      titleEn: titleEn.trim() || 'Signature Egypt Experience',
      titleAr: titleAr.trim() || 'تجربة استثنائية في مصر',
      subtitleEn: subtitleEn.trim(),
      subtitleAr: subtitleAr.trim(),
      textStyle,
      textPosition,
      agencyId: chosenAgency.id,
      agencyNameEn: chosenAgency.name,
      agencyNameAr: chosenAgency.arabicName,
      whatsappNumber: whatsappNumber.trim() || chosenAgency.whatsappNumber,
      packagePriceUsd: enableWhatsAppCta ? packagePriceUsd : undefined,
      ctaTextEn: enableWhatsAppCta ? (ctaTextEn.trim() || 'Inquire via WhatsApp') : undefined,
      ctaTextAr: enableWhatsAppCta ? (ctaTextAr.trim() || 'احجز عبر واتساب') : undefined,
    };

    const newStory: DestinationStory = {
      id: initialStory?.id || `custom_story_${Date.now()}`,
      destinationEn: destinationEn.trim() || 'Egypt Highlight',
      destinationAr: destinationAr.trim() || 'معالم مصر',
      coverImage: mediaType === 'image' ? mediaUrl : (chosenAgency.coverImageUrl || 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80'),
      agencyId: chosenAgency.id,
      agencyNameEn: chosenAgency.name,
      agencyNameAr: chosenAgency.arabicName,
      agencyAvatar: chosenAgency.logoUrl || 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=200&q=80',
      slides: [newSlide],
      isCustom: true,
      createdAt: initialStory?.createdAt || new Date().toISOString(),
    };

    // Save locally
    saveCustomStory(newStory);

    setTimeout(() => {
      setIsPublishing(false);
      onStoryPublished(newStory);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  // Selected agency helper
  const chosenAgency = availableAgencies.find(a => a.id === selectedAgencyId) || availableAgencies[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] overflow-hidden flex flex-col border border-slate-200"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C] p-0.5 flex items-center justify-center text-white shadow-xs">
              <div className="w-full h-full rounded-[14px] bg-[#44200F] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#C4A177]" />
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-[#44200F]">
                {isAr ? 'محرر قصص المنظمين (Story Studio)' : 'Tour Operator Story Studio'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr 
                  ? 'انشر قصة مصورة أو فيديو مع نصوص متحركة وزر حجز مباشر عبر واتساب' 
                  : 'Publish photo or video stories with custom overlay typography & WhatsApp booking CTAs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body: Split View (Canvas on Left/Right, Controls on other side) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* 1. LIVE 9:16 MOBILE CANVAS PREVIEW (5 Cols on LG) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start">
            <div className="w-full max-w-[280px] sm:max-w-[300px] aspect-[9/16] bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border-4 border-slate-800 relative flex flex-col justify-between p-4 select-none group">
              
              {/* Background Media */}
              {mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Story Canvas Background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Readability Gradient Scrims (Top & Bottom) */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

              {/* Simulated Story Progress Bar */}
              <div className="relative z-10 w-full flex items-center gap-1.5 pt-1">
                <div className="h-1 flex-1 bg-white/40 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full w-2/3 animate-pulse" />
                </div>
              </div>

              {/* Top Creator Info Bar on Canvas */}
              <div className="relative z-10 flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <img
                    src={chosenAgency.logoUrl}
                    alt={chosenAgency.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/80"
                  />
                  <div>
                    <span className="font-bold text-white text-[11px] drop-shadow-sm block leading-tight">
                      {isAr ? chosenAgency.arabicName : chosenAgency.name}
                    </span>
                    <span className="text-[9px] text-[#C4A177] font-semibold drop-shadow-sm block">
                      {isAr ? destinationAr : destinationEn}
                    </span>
                  </div>
                </div>

                <div className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-white/90 text-[10px] font-bold border border-white/20">
                  {isAr ? 'الآن' : 'Now'}
                </div>
              </div>

              {/* Live Text Overlay (Positioned based on textPosition state) */}
              <div className={`relative z-10 w-full my-auto transition-all duration-300 ${
                textPosition === 'top' 
                  ? 'self-start mt-4' 
                  : textPosition === 'center' 
                    ? 'self-center my-auto' 
                    : 'self-end mb-2'
              }`}>
                {/* Visual Typography Presets */}
                <div className={`p-3 rounded-2xl transition-all ${
                  textStyle === 'luxury-gold'
                    ? 'bg-black/50 backdrop-blur-xs border border-[#C4A177]/40 text-[#C4A177]'
                    : textStyle === 'neon'
                      ? 'bg-black/75 backdrop-blur-md border border-white/30 text-white shadow-lg'
                      : textStyle === 'editorial'
                        ? 'bg-gradient-to-r from-[#44200F]/90 to-[#795037]/80 text-[#FAF7F2] border border-amber-300/30'
                        : 'bg-black/30 backdrop-blur-xs text-white'
                }`}>
                  <h3 className={`font-black leading-tight drop-shadow-md ${
                    textStyle === 'luxury-gold' ? 'text-sm font-serif' : 'text-sm font-sans'
                  }`}>
                    {isAr ? titleAr : titleEn}
                  </h3>

                  {(isAr ? subtitleAr : subtitleEn) && (
                    <p className="text-[11px] text-white/90 leading-snug mt-1 drop-shadow-sm font-normal">
                      {isAr ? subtitleAr : subtitleEn}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom WhatsApp CTA Button on Canvas */}
              {enableWhatsAppCta && (
                <div className="relative z-10 w-full pt-2">
                  <div className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between text-[11px] font-bold shadow-lg border border-emerald-400/30">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{isAr ? ctaTextAr : ctaTextEn}</span>
                    </div>
                    {packagePriceUsd && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0">
                        ${packagePriceUsd.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Eye className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'معاينة حية بالحجم الطبيعي للشاشة' : 'Live full-screen 9:16 story preview'}</span>
            </div>
          </div>

          {/* 2. EDITOR CONTROLS (7 Cols on LG) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Error Notification */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: MEDIA SOURCE SELECTOR */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#44200F] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#C4A177]" />
                  <span>{isAr ? 'مصدر الوسائط (صورة أو فيديو)' : 'Media Asset (Photo or Video)'}</span>
                </label>

                {/* Source Tabs */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setMediaSourceTab('upload')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      mediaSourceTab === 'upload' ? 'bg-white text-[#44200F] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {isAr ? 'رفع ملف' : 'Upload File'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaSourceTab('presets')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      mediaSourceTab === 'presets' ? 'bg-white text-[#44200F] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {isAr ? 'معالم جاهزة' : 'Egypt Presets'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaSourceTab('url')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      mediaSourceTab === 'url' ? 'bg-white text-[#44200F] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {isAr ? 'رابط URL' : 'Direct URL'}
                  </button>
                </div>
              </div>

              {/* Subview: File Upload */}
              {mediaSourceTab === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#EDE0CC] hover:border-[#C4A177] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] p-5 rounded-2xl text-center cursor-pointer transition space-y-1.5"
                  >
                    <Upload className="w-7 h-7 text-[#795037] mx-auto" />
                    <p className="font-bold text-xs text-[#44200F]">
                      {uploadedFileName ? uploadedFileName : (isAr ? 'اختر صورة أو فيديو من جهازك' : 'Choose photo or video clip')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'يدعم صور JPG, PNG, WebP وفيديوهات MP4 القصيرة' : 'Supports JPG, PNG, WebP & short MP4 clips'}
                    </p>
                  </div>
                </div>
              )}

              {/* Subview: Presets */}
              {mediaSourceTab === 'presets' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_MEDIA_SAMPLES.map(sample => (
                    <button
                      key={sample.nameEn}
                      type="button"
                      onClick={() => {
                        setMediaUrl(sample.url);
                        setMediaType(sample.type);
                        setDestinationEn(sample.destinationEn);
                        setDestinationAr(sample.destinationAr);
                      }}
                      className={`p-1.5 rounded-xl border text-start transition cursor-pointer flex items-center gap-2 ${
                        mediaUrl === sample.url ? 'border-[#C4A177] bg-amber-50/70 ring-1 ring-[#C4A177]' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <img src={sample.url} alt={sample.nameEn} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 truncate block">
                          {isAr ? sample.nameAr : sample.nameEn}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {isAr ? sample.destinationAr : sample.destinationEn}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Subview: Direct URL */}
              {mediaSourceTab === 'url' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[#C4A177]">
                    <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMediaUrl(val);
                        if (val.match(/\.(mp4|webm)($|\?)/i)) {
                          setMediaType('video');
                        } else {
                          setMediaType('image');
                        }
                      }}
                      placeholder="https://example.com/story-media.jpg"
                      className="w-full bg-transparent border-0 p-0 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{isAr ? 'نوع الوسائط:' : 'Media format:'}</span>
                    <button
                      type="button"
                      onClick={() => setMediaType('image')}
                      className={`px-2 py-0.5 rounded-md font-bold text-xs ${mediaType === 'image' ? 'bg-[#44200F] text-[#C4A177]' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {isAr ? 'صورة' : 'Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('video')}
                      className={`px-2 py-0.5 rounded-md font-bold text-xs ${mediaType === 'video' ? 'bg-[#44200F] text-[#C4A177]' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {isAr ? 'فيديو' : 'Video'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TAB 2: TEXT OVERLAYS & TYPOGRAPHY STYLES */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <label className="text-xs font-bold text-[#44200F] uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{isAr ? 'نصوص القصة والنمط البصري' : 'Story Text & Overlay Styling'}</span>
              </label>

              {/* Title Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'العنوان الرئيسي (عربي)' : 'Headline (Arabic)'}</span>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="رحلة أهرامات الجيزة الخاصة..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'العنوان الرئيسي (إنجليزي)' : 'Headline (English)'}</span>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="VIP Pyramids & Sphinx Expedition..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                  />
                </div>
              </div>

              {/* Subtitle / Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'وصف إضافي (عربي)' : 'Details (Arabic)'}</span>
                  <input
                    type="text"
                    value={subtitleAr}
                    onChange={(e) => setSubtitleAr(e.target.value)}
                    placeholder="شاملة مرشد متخصص واستقبال VIP..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                  />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'وصف إضافي (إنجليزي)' : 'Details (English)'}</span>
                  <input
                    type="text"
                    value={subtitleEn}
                    onChange={(e) => setSubtitleEn(e.target.value)}
                    placeholder="Includes licensed guide & private transport..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                  />
                </div>
              </div>

              {/* Text Style Selector */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">{isAr ? 'نمط الخط والخلفية' : 'Typography & Backdrop Style'}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'luxury-gold' as StoryTextStyle, labelEn: 'Luxury Gold', labelAr: 'ذهبي فاخر' },
                    { id: 'neon' as StoryTextStyle, labelEn: 'Modern Neon', labelAr: 'نيون عصري' },
                    { id: 'editorial' as StoryTextStyle, labelEn: 'Editorial Terracotta', labelAr: 'طين صحراوي' },
                    { id: 'minimal' as StoryTextStyle, labelEn: 'Clean Minimal', labelAr: 'بسيط ناعم' },
                  ].map(style => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTextStyle(style.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        textStyle === style.id ? 'bg-[#44200F] text-[#C4A177] border-[#44200F] shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isAr ? style.labelAr : style.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Positioning: Top, Center, Bottom */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <MoveVertical className="w-3.5 h-3.5 text-[#795037]" />
                  <span>{isAr ? 'موضع النص على القصة' : 'Text Position'}</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'top' as StoryTextPosition, labelEn: 'Top', labelAr: 'أعلى القصة' },
                    { id: 'center' as StoryTextPosition, labelEn: 'Center', labelAr: 'وسط القصة' },
                    { id: 'bottom' as StoryTextPosition, labelEn: 'Bottom', labelAr: 'أسفل القصة' },
                  ].map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setTextPosition(pos.id)}
                      className={`py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        textPosition === pos.id ? 'bg-[#C4A177] text-[#44200F] border-[#C4A177] shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isAr ? pos.labelAr : pos.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TAB 3: WHATSAPP CONVERSION CTA & COMMERCIALS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#44200F] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'زر الحجز الفوري عبر واتساب' : 'WhatsApp Conversion CTA Button'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={enableWhatsAppCta}
                    onChange={(e) => setEnableWhatsAppCta(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <span>{isAr ? 'تفعيل الزر' : 'Enable CTA'}</span>
                </label>
              </div>

              {enableWhatsAppCta && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'نص الزر (عربي)' : 'Button Label (Arabic)'}</span>
                      <input
                        type="text"
                        value={ctaTextAr}
                        onChange={(e) => setCtaTextAr(e.target.value)}
                        placeholder="احجز عبر واتساب..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'نص الزر (إنجليزي)' : 'Button Label (English)'}</span>
                      <input
                        type="text"
                        value={ctaTextEn}
                        onChange={(e) => setCtaTextEn(e.target.value)}
                        placeholder="Inquire via WhatsApp..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'السعر بالدولار الأمريكي (اختياري)' : 'Package Price in USD (Optional)'}</span>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500">
                        <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={packagePriceUsd || ''}
                          onChange={(e) => setPackagePriceUsd(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="1450"
                          className="w-full bg-transparent border-0 p-0 text-xs focus:outline-none font-bold text-slate-800"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'رقم واتساب المنظم' : 'Operator WhatsApp Number'}</span>
                      <input
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+20 100 000 0000"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TAB 4: OPERATOR & DESTINATION ATTRIBUTION */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              <label className="text-xs font-bold text-[#44200F] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{isAr ? 'الوجهة والشركة المنظمة' : 'Destination & Agency Attribution'}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'الشركة المنظمة' : 'Tour Operator'}</span>
                  <select
                    value={selectedAgencyId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedAgencyId(id);
                      const agency = availableAgencies.find(a => a.id === id);
                      if (agency) {
                        setWhatsappNumber(agency.whatsappNumber);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                  >
                    {availableAgencies.map(agency => (
                      <option key={agency.id} value={agency.id}>
                        {isAr ? agency.arabicName : agency.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1">{isAr ? 'اسم الوجهة' : 'Destination Tag'}</span>
                  <input
                    type="text"
                    value={isAr ? destinationAr : destinationEn}
                    onChange={(e) => {
                      if (isAr) setDestinationAr(e.target.value);
                      else setDestinationEn(e.target.value);
                    }}
                    placeholder={isAr ? 'أهرامات الجيزة، الأقصر...' : 'Giza Pyramids, Luxor...'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: PUBLISH STORY & CANCEL */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublish}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#EA580C] via-[#C4A177] to-[#E1306C] hover:opacity-95 text-white text-xs font-black transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{isPublishing ? (isAr ? 'جارِ النشر...' : 'Publishing...') : (isAr ? 'نشر القصة الآن' : 'Publish Story Now')}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
