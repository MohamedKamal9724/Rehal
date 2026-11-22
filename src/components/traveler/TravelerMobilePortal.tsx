import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Camera, Plus, Heart, Bookmark, Share2, Compass, MapPin, Calendar, 
  Clock, Phone, MessageSquare, Hotel, Truck, UserCheck, ShieldCheck, 
  ChevronDown, ChevronUp, ExternalLink, Sparkles, CheckCircle2, ArrowLeft, 
  ArrowRight, FileText, Navigation, Utensils, AlertTriangle, Key, 
  Download, Copy, Check, Image as ImageIcon, X, Eye, Grid3X3, Film, Upload,
  Send, Shield, Award, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TripFile, TripPassenger } from '../../lib/tripStore';
import { UILanguage, Workspace } from '../../types';
import { DestinationStory, StorySlide, loadCustomStories, saveCustomStory } from '../../lib/travelerFeedData';
import { TravelerStoryModal } from './TravelerStoryModal';
import { dispatchTripCodeToWhatsApp } from '../../lib/whatsappDispatch';

interface TravelerMobilePortalProps {
  trip: TripFile;
  passenger?: TripPassenger;
  workspace: Workspace;
  uiLang?: UILanguage;
  onExitPortal?: () => void;
}

interface LiveTripMoment {
  id: string;
  tripId: string;
  imageUrl: string;
  titleEn: string;
  titleAr: string;
  captionEn: string;
  captionAr: string;
  locationEn: string;
  locationAr: string;
  dayNumber: number;
  authorName: string;
  likesCount: number;
  createdAt: string;
}

const PRESET_MOMENT_PHOTOS = [
  {
    titleEn: 'Great Pyramids Golden Hour',
    titleAr: 'سحر الأهرامات وقت الغروب الذهبي',
    locationEn: 'Giza Plateau',
    locationAr: 'هضبة الأهرامات، الجيزة',
    url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=85',
  },
  {
    titleEn: 'Karnak Hypostyle Columns',
    titleAr: 'أعمدة معابد الكرنك الشاهقة',
    locationEn: 'Luxor Temple Complex',
    locationAr: 'مجمع معابد الكرنك، الأقصر',
    url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=85',
  },
  {
    titleEn: 'Private Dahabiya Sailing on Nile',
    titleAr: 'إبحار دهبية النيل الخاصة',
    locationEn: 'River Nile, Aswan',
    locationAr: 'نيل أسوان الخالد',
    url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=85',
  },
  {
    titleEn: 'Mena House Historic Palace View',
    titleAr: 'إطلالة قصر مينا هاوس التاريخي',
    locationEn: 'Marriott Mena House, Cairo',
    locationAr: 'فندق ماريوت مينا هاوس، القاهرة',
    url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=85',
  },
  {
    titleEn: 'Valley of the Kings Exploration',
    titleAr: 'استكشاف وادي الملوك الأسطوري',
    locationEn: 'Theban Necropolis, Luxor',
    locationAr: 'طيبة الغربية، الأقصر',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=85',
  },
  {
    titleEn: 'Red Sea Crystal Waters',
    titleAr: 'مياه البحر الأحمر الفيروزية',
    locationEn: 'Hurghada / Sharm El Sheikh',
    locationAr: 'الغردقة وشرم الشيخ',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85',
  },
];

export const TravelerMobilePortal: React.FC<TravelerMobilePortalProps> = ({
  trip,
  passenger,
  workspace,
  uiLang: initialUiLang = 'en',
  onExitPortal,
}) => {
  const [uiLang, setUiLang] = useState<UILanguage>(initialUiLang);
  const isAr = uiLang === 'ar';

  // Instagram-style primary tab navigation: moments feed vs itinerary vs stays & vouchers vs team
  const [activePortalTab, setActivePortalTab] = useState<'moments' | 'itinerary' | 'vouchers' | 'team'>('moments');
  const [feedLayout, setFeedLayout] = useState<'grid' | 'feed'>('grid');
  const [expandedDay, setExpandedDay] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Story Viewer state
  const [activeStory, setActiveStory] = useState<DestinationStory | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);

  // Expanded Photo Modal state
  const [selectedPhotoMoment, setSelectedPhotoMoment] = useState<LiveTripMoment | null>(null);

  // Operational "Add Moment / Story" Modal state
  const [isAddMomentModalOpen, setIsAddMomentModalOpen] = useState(false);
  const [momentTitle, setMomentTitle] = useState('');
  const [momentCaption, setMomentCaption] = useState('');
  const [momentLocation, setMomentLocation] = useState('Giza Plateau, Cairo');
  const [momentDay, setMomentDay] = useState<number>(1);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(PRESET_MOMENT_PHOTOS[0].url);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [addToHighlights, setAddToHighlights] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Likes and bookmarks state
  const [likedMomentIds, setLikedMomentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`rihal_liked_moments_${trip.id}`);
      return saved ? JSON.parse(saved) : ['mom-1', 'mom-2'];
    } catch {
      return ['mom-1', 'mom-2'];
    }
  });

  const [savedMomentIds, setSavedMomentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`rihal_saved_moments_${trip.id}`);
      return saved ? JSON.parse(saved) : ['mom-1'];
    } catch {
      return ['mom-1'];
    }
  });

  // Live Trip Moments (initialized with realistic highlights for this trip)
  const [tripMoments, setTripMoments] = useState<LiveTripMoment[]>(() => {
    const storageKey = `rihal_trip_moments_${trip.id}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return [
      {
        id: 'mom-1',
        tripId: trip.id,
        imageUrl: PRESET_MOMENT_PHOTOS[0].url,
        titleEn: 'Great Pyramids VIP Arrival',
        titleAr: 'الوصول واستكشاف أهرامات الجيزة',
        captionEn: 'First glimpse of the Great Pyramids with our licensed Egyptologist guide. Truly majestic!',
        captionAr: 'أولى اللحظات الساحرة أمام أهرامات الجيزة بصحبة مرشدنا السياحي المعتمد. عظمة تفوق الوصف!',
        locationEn: 'Giza Plateau, Cairo',
        locationAr: 'هضبة الأهرامات، الجيزة',
        dayNumber: 1,
        authorName: trip.guideName || workspace.name,
        likesCount: 142,
        createdAt: '2026-11-15T14:30:00Z',
      },
      {
        id: 'mom-2',
        tripId: trip.id,
        imageUrl: PRESET_MOMENT_PHOTOS[1].url,
        titleEn: 'Karnak Temples & Hypostyle Hall',
        titleAr: 'بهو الأعمدة الشاهقة بمعابد الكرنك',
        captionEn: 'Walking among 134 towering sandstone columns in Thebes. The afternoon light is magical.',
        captionAr: 'جولة تاريخية بين 134 عموداً شاهقاً في طيبة عاصمة مصر القديمة. إضاءة الغروب ساحرة للغاية.',
        locationEn: 'Karnak Complex, Luxor',
        locationAr: 'معابد الكرنك، الأقصر',
        dayNumber: 2,
        authorName: trip.travelerName,
        likesCount: 98,
        createdAt: '2026-11-16T11:00:00Z',
      },
      {
        id: 'mom-3',
        tripId: trip.id,
        imageUrl: PRESET_MOMENT_PHOTOS[2].url,
        titleEn: 'Sunset Sailing on the Nile',
        titleAr: 'إبحار الغروب الساحر فوق مياه النيل',
        captionEn: 'Tea and authentic local hospitality onboard our private Nile cruiser heading south.',
        captionAr: 'جلسة شاي أصيلة مع الضيافة المصرية على متن دهبية النيل الخاصة متجهين جنوباً.',
        locationEn: 'River Nile, Aswan',
        locationAr: 'نيل أسوان، مصر',
        dayNumber: 3,
        authorName: trip.guideName || 'RIHAL Concierge',
        likesCount: 215,
        createdAt: '2026-11-17T17:15:00Z',
      },
      {
        id: 'mom-4',
        tripId: trip.id,
        imageUrl: PRESET_MOMENT_PHOTOS[3].url,
        titleEn: 'Historic Mena House Suite View',
        titleAr: 'إطلالة جناح قصر مينا هاوس التاريخي',
        captionEn: 'Waking up to breakfast on the terrace overlooking the Khufu Pyramid.',
        captionAr: 'صباح ساحر وتناول الإفطار في الشرفة المطلة مباشرة على هرم خوفو الأكبر.',
        locationEn: 'Marriott Mena House, Giza',
        locationAr: 'مينا هاوس، الجيزة',
        dayNumber: 1,
        authorName: passenger?.name || trip.travelerName,
        likesCount: 184,
        createdAt: '2026-11-15T09:00:00Z',
      },
      {
        id: 'mom-5',
        tripId: trip.id,
        imageUrl: PRESET_MOMENT_PHOTOS[4].url,
        titleEn: 'Valley of the Kings Royal Tombs',
        titleAr: 'مقابر الفراعنة الملكية بوادي الملوك',
        captionEn: 'Vivid pharaonic pigments preserved for 3,000+ years deep inside the mountains.',
        captionAr: 'ألوان ونقوش فرعونية بديعة محتفظة ببريقها منذ أكثر من 3000 عام في قلب الجبل.',
        locationEn: 'West Bank, Luxor',
        locationAr: 'البر الغربي، الأقصر',
        dayNumber: 4,
        authorName: trip.guideName || 'Lead Egyptologist',
        likesCount: 129,
        createdAt: '2026-11-18T10:45:00Z',
      },
      {
        id: 'mom-6',
        tripId: trip.id,
        imageUrl: PRESET_MOMENT_PHOTOS[5].url,
        titleEn: 'Red Sea Azure Waters',
        titleAr: 'مياه البحر الأحمر الفيروزية النقية',
        captionEn: 'Relaxing after our historical tour with warm sunshine and vibrant coral reefs.',
        captionAr: 'استرخاء فاخر بعد الجولات الأثرية وسط أشعة الشمس الذهبية وشعاب البحر الأحمر.',
        locationEn: 'Red Sea Resort',
        locationAr: 'منتجع البحر الأحمر',
        dayNumber: 6,
        authorName: trip.travelerName,
        likesCount: 167,
        createdAt: '2026-11-20T12:00:00Z',
      },
    ];
  });

  // Save moments locally whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(`rihal_trip_moments_${trip.id}`, JSON.stringify(tripMoments));
    } catch {}
  }, [tripMoments, trip.id]);

  // Destination Highlights / Stories Bar items (Instagram-Style Circles)
  const storiesList = useMemo<DestinationStory[]>(() => {
    // Trip-specific story highlights
    return [
      {
        id: `story_pyramids_${trip.id}`,
        destinationEn: 'Pyramids VIP',
        destinationAr: 'أهرامات الجيزة',
        coverImage: PRESET_MOMENT_PHOTOS[0].url,
        agencyId: workspace.id,
        agencyNameEn: workspace.name,
        agencyNameAr: workspace.arabicName || workspace.name,
        agencyAvatar: workspace.logoUrl || PRESET_MOMENT_PHOTOS[0].url,
        slides: [
          {
            id: 'slide_p_1',
            imageUrl: PRESET_MOMENT_PHOTOS[0].url,
            titleEn: 'VIP Pyramids & Great Sphinx',
            titleAr: 'جولة أهرامات الجيزة وأبو الهول الخاصة',
            subtitleEn: 'Exclusive private access with our expert Egyptologist',
            subtitleAr: 'استكشاف خاص بأرقى معايير الضيافة مع المرشد المعتمد',
            textStyle: 'luxury-gold',
            textPosition: 'bottom',
            agencyId: workspace.id,
            agencyNameEn: workspace.name,
            agencyNameAr: workspace.arabicName || workspace.name,
            whatsappNumber: workspace.whatsappNumber || '+201000000000',
          },
          {
            id: 'slide_p_2',
            imageUrl: PRESET_MOMENT_PHOTOS[3].url,
            titleEn: 'Historic Mena House Check-in',
            titleAr: 'إقامة تاريخية في ماريوت مينا هاوس',
            subtitleEn: 'Palatial heritage overlooking the Great Pyramid',
            subtitleAr: 'أجنحة ملكية فاخرة بإطلالة مباشرة على هرم خوفو',
            textStyle: 'editorial',
            textPosition: 'bottom',
            agencyId: workspace.id,
            agencyNameEn: workspace.name,
            agencyNameAr: workspace.arabicName || workspace.name,
            whatsappNumber: workspace.whatsappNumber || '+201000000000',
          },
        ],
      },
      {
        id: `story_luxor_${trip.id}`,
        destinationEn: 'Luxor & Thebes',
        destinationAr: 'معابد الأقصر',
        coverImage: PRESET_MOMENT_PHOTOS[1].url,
        agencyId: workspace.id,
        agencyNameEn: workspace.name,
        agencyNameAr: workspace.arabicName || workspace.name,
        agencyAvatar: workspace.logoUrl || PRESET_MOMENT_PHOTOS[1].url,
        slides: [
          {
            id: 'slide_l_1',
            imageUrl: PRESET_MOMENT_PHOTOS[1].url,
            titleEn: 'Karnak Hypostyle Hall',
            titleAr: 'بهو أعمدة الكرنك المهيبة',
            subtitleEn: 'The largest religious complex built in the ancient world',
            subtitleAr: 'أكبر مجمع ديني شيده الإنسان في التاريخ القديم',
            textStyle: 'luxury-gold',
            textPosition: 'bottom',
            agencyId: workspace.id,
            agencyNameEn: workspace.name,
            agencyNameAr: workspace.arabicName || workspace.name,
            whatsappNumber: workspace.whatsappNumber || '+201000000000',
          },
          {
            id: 'slide_l_2',
            imageUrl: PRESET_MOMENT_PHOTOS[4].url,
            titleEn: 'Valley of the Kings Royal Tombs',
            titleAr: 'مقابر وادي الملوك الملكية',
            subtitleEn: 'Unrivaled pharaonic wall paintings preserved for millenia',
            subtitleAr: 'نقوش فرعونية نادرة ومقابر الفراعنة العظماء',
            textStyle: 'editorial',
            textPosition: 'bottom',
            agencyId: workspace.id,
            agencyNameEn: workspace.name,
            agencyNameAr: workspace.arabicName || workspace.name,
            whatsappNumber: workspace.whatsappNumber || '+201000000000',
          },
        ],
      },
      {
        id: `story_nile_${trip.id}`,
        destinationEn: 'Nile Sailing',
        destinationAr: 'إبحار النيل',
        coverImage: PRESET_MOMENT_PHOTOS[2].url,
        agencyId: workspace.id,
        agencyNameEn: workspace.name,
        agencyNameAr: workspace.arabicName || workspace.name,
        agencyAvatar: workspace.logoUrl || PRESET_MOMENT_PHOTOS[2].url,
        slides: [
          {
            id: 'slide_n_1',
            imageUrl: PRESET_MOMENT_PHOTOS[2].url,
            titleEn: 'Private Nile Cruiser Sailing',
            titleAr: 'إبحار فاخر على ضفاف النيل الخالد',
            subtitleEn: 'Gourmet dining on the sun deck between Luxor and Aswan',
            subtitleAr: 'أرقى تجارب الطعام والاسترخاء بين الأقصر وأسوان',
            textStyle: 'luxury-gold',
            textPosition: 'bottom',
            agencyId: workspace.id,
            agencyNameEn: workspace.name,
            agencyNameAr: workspace.arabicName || workspace.name,
            whatsappNumber: workspace.whatsappNumber || '+201000000000',
          },
        ],
      },
      {
        id: `story_redsea_${trip.id}`,
        destinationEn: 'Red Sea Oasis',
        destinationAr: 'سحر البحر الأحمر',
        coverImage: PRESET_MOMENT_PHOTOS[5].url,
        agencyId: workspace.id,
        agencyNameEn: workspace.name,
        agencyNameAr: workspace.arabicName || workspace.name,
        agencyAvatar: workspace.logoUrl || PRESET_MOMENT_PHOTOS[5].url,
        slides: [
          {
            id: 'slide_r_1',
            imageUrl: PRESET_MOMENT_PHOTOS[5].url,
            titleEn: 'Turquoise Waters & Coral Reefs',
            titleAr: 'شواطئ فيروزية وشعاب مرجانية نادرة',
            subtitleEn: 'Year-round sunshine and world-class diving',
            subtitleAr: 'شمس مشرقة وتجارب بحرية استثنائية',
            textStyle: 'neon',
            textPosition: 'bottom',
            agencyId: workspace.id,
            agencyNameEn: workspace.name,
            agencyNameAr: workspace.arabicName || workspace.name,
            whatsappNumber: workspace.whatsappNumber || '+201000000000',
          },
        ],
      },
    ];
  }, [trip.id, workspace]);

  const guestName = passenger?.name || trip.travelerName || 'Guest';
  const masterCode = trip.tourPasscode || trip.fileNumber;
  const personalCode = passenger?.personalCode || masterCode;

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleToggleLike = (id: string) => {
    setLikedMomentIds((prev) => {
      const isLiked = prev.includes(id);
      const updated = isLiked ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem(`rihal_liked_moments_${trip.id}`, JSON.stringify(updated));
      } catch {}

      setTripMoments((moments) =>
        moments.map((m) =>
          m.id === id ? { ...m, likesCount: m.likesCount + (isLiked ? -1 : 1) } : m
        )
      );
      return updated;
    });
  };

  const handleToggleSave = (id: string) => {
    setSavedMomentIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem(`rihal_saved_moments_${trip.id}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Handle uploading/adding a live story moment from the operational drawer
  const handlePublishNewMoment = () => {
    if (!selectedPhotoUrl) return;

    const newMoment: LiveTripMoment = {
      id: `mom_${Date.now()}`,
      tripId: trip.id,
      imageUrl: selectedPhotoUrl,
      titleEn: momentTitle.trim() || 'Unforgettable Egypt Moment',
      titleAr: momentTitle.trim() || 'لحظة استثنائية من أرض الحضارة',
      captionEn: momentCaption.trim() || 'Capturing the timeless beauty of Egypt during our tour.',
      captionAr: momentCaption.trim() || 'توثيق أجمل ذكريات ومعالم مصر الخالدة خلال برنامج الرحلة.',
      locationEn: momentLocation.trim() || 'Cairo, Egypt',
      locationAr: momentLocation.trim() || 'القاهرة، مصر',
      dayNumber: momentDay,
      authorName: trip.guideName || guestName,
      likesCount: 1,
      createdAt: new Date().toISOString(),
    };

    setTripMoments((prev) => [newMoment, ...prev]);

    // If marked to add to story highlights, create a custom story slide
    if (addToHighlights) {
      const newSlide: StorySlide = {
        id: `slide_${Date.now()}`,
        imageUrl: selectedPhotoUrl,
        titleEn: newMoment.titleEn,
        titleAr: newMoment.titleAr,
        subtitleEn: newMoment.captionEn,
        subtitleAr: newMoment.captionAr,
        textStyle: 'luxury-gold',
        textPosition: 'bottom',
        agencyId: workspace.id,
        agencyNameEn: workspace.name,
        agencyNameAr: workspace.arabicName || workspace.name,
        whatsappNumber: workspace.whatsappNumber || '+201000000000',
      };

      const newStory: DestinationStory = {
        id: `custom_trip_story_${Date.now()}`,
        destinationEn: newMoment.locationEn,
        destinationAr: newMoment.locationAr,
        coverImage: selectedPhotoUrl,
        agencyId: workspace.id,
        agencyNameEn: workspace.name,
        agencyNameAr: workspace.arabicName || workspace.name,
        agencyAvatar: workspace.logoUrl || selectedPhotoUrl,
        slides: [newSlide],
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      saveCustomStory(newStory);
    }

    // Reset and close modal
    setIsAddMomentModalOpen(false);
    setMomentTitle('');
    setMomentCaption('');
    setUploadedFileName('');
  };

  // Schedule metadata helper for Itinerary tab — complete 7-Day Cairo, Luxor & Aswan program
  const guideDisplayName = trip.guideName || (isAr ? 'أ. شريف المنيري (Sherif Al-Muniri)' : 'Sherif Al-Muniri (أ. شريف المنيري)');
  const getDaySchedule = (dayNum: number) => {
    switch (dayNum) {
      case 1:
        return {
          titleEn: 'Arrival in Cairo & Four Seasons Nile Plaza Check-in',
          titleAr: 'الوصول لمطار القاهرة واستلام الأجنحة بفندق فورسيزونز نايل بلازا',
          city: 'Cairo',
          hotelEn: 'Four Seasons Hotel Cairo at Nile Plaza',
          hotelAr: 'فندق فورسيزونز القاهرة نايل بلازا (Four Seasons Nile Plaza)',
          voucherCode: 'FS-CAI-88412 · CAI-VIP-302',
          guideName: guideDisplayName,
          times: [
            { time: '10:30', titleEn: 'VIP Lounge Meet & Assist at Cairo International Airport (CAI)', titleAr: 'استقبال كبار الزوار بصالة VIP في مطار القاهرة الدولي' },
            { time: '11:30', titleEn: 'Private Mercedes-Benz V-Class Transfer to Corniche El Nil', titleAr: 'انتقال خاص بمرسيدس V-Class إلى كورنيش النيل بجاردن سيتي' },
            { time: '14:00', titleEn: 'Royal Nile View Suite Check-in at Four Seasons Cairo', titleAr: 'تسكين مبكر بأجنحة النيل الملكية في فندق فورسيزونز القاهرة' },
            { time: '19:30', titleEn: 'Welcome Nile Dinner & Program Briefing with Guide Sherif Al-Muniri', titleAr: 'عشاء ترحيبي مطل على النيل ومراجعة البرنامج مع المرشد أ. شريف المنيري' },
          ],
          meals: isAr ? 'عشاء ترحيبي فاخر بإطلالة على النيل' : 'Welcome Nile-View Gala Dinner',
          tips: isAr ? 'تم تأكيد التسكين المبكر وضيافة التمر العربي مع المرشد أ. شريف المنيري.' : 'Early suite check-in and VIP amenities are pre-confirmed with your Egyptologist Sherif Al-Muniri.',
        };
      case 2:
        return {
          titleEn: 'Giza Plateau, Great Sphinx & Grand Egyptian Museum (GEM)',
          titleAr: 'هضبة أهرامات الجيزة، أبو الهول والجناح الملكي بالمتحف المصري الكبير',
          city: 'Cairo / Giza',
          hotelEn: 'Four Seasons Hotel Cairo at Nile Plaza',
          hotelAr: 'فندق فورسيزونز القاهرة نايل بلازا (Four Seasons Nile Plaza)',
          voucherCode: 'GEM-VIP-114 · FS-CAI-88412',
          guideName: guideDisplayName,
          times: [
            { time: '08:30', titleEn: 'Private Departure with Egyptologist Sherif Al-Muniri to Giza Plateau', titleAr: 'الانطلاق صباحاً مع المرشد أ. شريف المنيري إلى هضبة أهرامات الجيزة' },
            { time: '09:30', titleEn: 'Great Pyramids of Khufu, Khafre & Private Sphinx Enclosure Access', titleAr: 'زيارة خاصة لأهرامات خوفو وخفرع ومنطقة تمثال أبو الهول' },
            { time: '13:00', titleEn: 'Reserved Pyramid-View VIP Lunch at 9 Pyramids Lounge', titleAr: 'غداء فاخر بإطلالة بانورامية على الأهرامات في 9 Pyramids Lounge' },
            { time: '15:30', titleEn: 'Private Curator Tour of Grand Egyptian Museum (GEM) Royal Galleries', titleAr: 'جولة خاصة بالقاعات الملكية وكنوز توت عنخ آمون بالمتحف المصري الكبير' },
          ],
          meals: isAr ? 'إفطار بالفورسيزونز وغداء بانورامي بالأهرامات' : 'Breakfast at Four Seasons & Pyramid-View VIP Lunch',
          tips: isAr ? 'تصاريح الدخول الإلكترونية المسبقة للمتحف المصري الكبير وهضبة الجيزة صادرة برقم GEM-VIP-114.' : 'Pre-paid VIP entry permits for Giza and GEM are issued under voucher GEM-VIP-114.',
        };
      case 3:
        return {
          titleEn: 'Flight to Luxor, Sofitel Winter Palace & East Bank Temples',
          titleAr: 'الطيران إلى الأقصر، قصر وونتر بالاس التاريخي ومعابد الكرنك والأقصر',
          city: 'Luxor (East Bank)',
          hotelEn: 'Sofitel Winter Palace Luxor',
          hotelAr: 'فندق سوفيتيل وونتر بالاس الأقصر (Sofitel Winter Palace)',
          voucherCode: 'SWP-LXR-55109 · LXR-KRK-409',
          guideName: guideDisplayName,
          times: [
            { time: '07:30', titleEn: 'VIP Airport Transfer & Morning Flight MS 062 to Luxor', titleAr: 'انتقال خاص للمطار ورحلة مصر للطيران الصباحية MS 062 إلى الأقصر' },
            { time: '12:30', titleEn: 'Check-in at Historic Royal Wing — Sofitel Winter Palace Luxor', titleAr: 'استلام الأجنحة بالجناح الملكي التاريخي في فندق سوفيتيل وونتر بالاس الأقصر' },
            { time: '15:30', titleEn: 'Karnak Temple Complex, Hypostyle Hall & Avenue of Sphinxes', titleAr: 'جولة معابد الكرنك، بهو الأعمدة العظيم وطريق الكباش مع أ. شريف المنيري' },
            { time: '18:30', titleEn: 'Illuminated Luxor Temple Tour & 1886 Royal Dining Dinner', titleAr: 'زيارة معبد الأقصر تحت الإضاءة الليلية وعشاء ملكي بمطعم 1886' },
          ],
          meals: isAr ? 'إفطار وعشاء ملكي بمطعم 1886 في وونتر بالاس' : 'Breakfast & Royal 1886 Fine Dining Dinner at Winter Palace',
          tips: isAr ? 'أمسية خاصة بحنطور ملكي على كورنيش الأقصر وعشاء رسمي في مطعم 1886 الساعة 8:30 مساءً.' : 'Includes evening horse-drawn caleche promenade and reserved table at 1886 Restaurant.',
        };
      case 4:
        return {
          titleEn: 'Luxor West Bank (Valley of the Kings, Hatshepsut, Colossi) & Sun Boat IV Embarkation',
          titleAr: 'البر الغربي بالأقصر (وادي الملوك، حتشبسوت، ممنون) والتسكين على كروز الصن بوت ٤',
          city: 'Luxor (West Bank & Nile)',
          hotelEn: 'Sanctuary Sun Boat IV (Presidential Nile Suites)',
          hotelAr: 'الباخرة الفاخرة سانكتشواري صن بوت ٤ (Sanctuary Sun Boat IV)',
          voucherCode: 'SSB-NILE-4402',
          guideName: guideDisplayName,
          times: [
            { time: '07:30', titleEn: 'Cross the Nile to Luxor West Bank with Guide Sherif Al-Muniri', titleAr: 'التحرك صباحاً إلى البر الغربي للأقصر برفقة المرشد أ. شريف المنيري' },
            { time: '08:15', titleEn: 'Valley of the Kings (Royal Tombs of Tutankhamun & Seti I VIP Entry)', titleAr: 'زيارة وادي الملوك ودخول خاص لمقبرتي الملك توت عنخ آمون وسيتي الأول' },
            { time: '10:30', titleEn: 'Mortuary Temple of Queen Hatshepsut at Deir el-Bahari & Colossi of Memnon', titleAr: 'زيارة معبد الملكة حتشبسوت بالدير البحري وتمثالي ممنون العملاقين' },
            { time: '12:30', titleEn: 'VIP Embarkation on 5★ Sanctuary Sun Boat IV & Gourmet Welcome Lunch', titleAr: 'الصعود والتسكين بالأجنحة الرئاسية على متن الباخرة Sanctuary Sun Boat IV وغداء ترحيبي' },
            { time: '19:30', titleEn: 'Captain’s Welcome Cocktail Reception & Nile Dinner Aboard Sun Boat IV', titleAr: 'حفل استقبال القبطان وعشاء فاخر على متن الباخرة سانكتشواري صن بوت ٤' },
          ],
          meals: isAr ? 'إفطار، غداء وعشاء كامل (Full Board+) على متن الصن بوت ٤' : 'Full Board Gourmet Dining (Breakfast, Lunch & Dinner) on Sanctuary Sun Boat IV',
          tips: isAr ? 'تذاكر الدخول الخاصة لمقبرة سيتي الأول وتوت عنخ آمون مرفقة مع المرشد أ. شريف المنيري (قسيمة SSB-NILE-4402).' : 'VIP tomb tickets for Seti I and Tutankhamun are held by your guide Sherif Al-Muniri (Voucher SSB-NILE-4402).',
        };
      case 5:
        return {
          titleEn: 'Nile Sailing Luxor to Aswan via Edfu (Temple of Horus) & Kom Ombo',
          titleAr: 'إبحار نيلي من الأقصر لأسوان عبر هاويس إسنا ومعبدي إدفو وكوم أمبو',
          city: 'Nile River · Edfu & Kom Ombo',
          hotelEn: 'Sanctuary Sun Boat IV (Sailing to Aswan)',
          hotelAr: 'الباخرة سانكتشواري صن بوت ٤ (Sanctuary Sun Boat IV)',
          voucherCode: 'SSB-SAIL-5503',
          guideName: guideDisplayName,
          times: [
            { time: '08:00', titleEn: 'Morning Arrival in Edfu & Private Golf Buggy to Temple of Horus', titleAr: 'الوصول لمدينة إدفو والانتقال بعربات خاصة لزيارة معبد الإله حورس المكتمل' },
            { time: '11:30', titleEn: 'Scenic Nile Sailing Southward & Upper Deck Egyptian Afternoon Tea', titleAr: 'استئناف الإبحار النيلي جنوباً مع شاي الأصيل على السطح البانورامي للباخرة' },
            { time: '16:30', titleEn: 'Sunset Visit to Kom Ombo Double Temple (Sobek & Haroeris) & Crocodile Museum', titleAr: 'زيارة معبد كوم أمبو المزدوج عند الغروب ومتحف التماسيح المحنطة مع أ. شريف المنيري' },
            { time: '20:30', titleEn: 'Egyptian Heritage Banquet & Music Evening Aboard Sanctuary Sun Boat IV', titleAr: 'عشاء تراثي مصري فاخر وأمسية نيلية على متن الباخرة الصن بوت ٤' },
          ],
          meals: isAr ? 'إقامة كاملة شاملة الإفطار والغداء وشاي الأصيل والعشاء' : 'Full Board + Afternoon Deck Tea & Heritage Gala Dinner',
          tips: isAr ? 'استمتع بمشاهدة عبور الباخرة وتمتّع بالشرح التاريخي مع أ. شريف المنيري على سطح Sanctuary Sun Boat IV.' : 'Enjoy panoramic deck views during sailing and live commentary by Sherif Al-Muniri.',
        };
      case 6:
        return {
          titleEn: 'Aswan Royal Program: Abu Simbel Temples, Philae Island & Sunset Felucca',
          titleAr: 'برنامج أسوان الملكي: معابد أبو سمبل، جزيرة فيلة وجولة فلوكة الغروب',
          city: 'Aswan & Abu Simbel',
          hotelEn: 'Sanctuary Sun Boat IV (Aswan Private Mooring)',
          hotelAr: 'الباخرة سانكتشواري صن بوت ٤ — مرسى أسوان الخاص',
          voucherCode: 'ASW-VIP-6604',
          guideName: guideDisplayName,
          times: [
            { time: '06:30', titleEn: 'Private Morning Flight to Abu Simbel & Great Sun Temples of Ramesses II & Nefertari', titleAr: 'رحلة طيران صباحية خاصة إلى أبو سمبل وزيارة معبدي رمسيس الثاني والملكة نفرتاري' },
            { time: '12:30', titleEn: 'Return to Sanctuary Sun Boat IV in Aswan for Nile-View Lunch', titleAr: 'العودة إلى الباخرة Sanctuary Sun Boat IV في أسوان لتناول الغداء' },
            { time: '14:30', titleEn: 'Private Motorboat to Agilkia Island & Temple of Isis at Philae', titleAr: 'جولة بقارب خاص إلى جزيرة أجيلكيا وزيارة معبد إيزيس في فيلة مع أ. شريف المنيري' },
            { time: '17:00', titleEn: 'Private Sunset Nile Felucca Sail Around Elephantine Island & Botanical Gardens', titleAr: 'إبحار بفلوكة شراع ملكية خاصة وقت الغروب حول جزيرة الفنتين وحديقة النباتات' },
            { time: '20:30', titleEn: 'Captain’s Farewell Royal Gala Dinner Aboard Sanctuary Sun Boat IV', titleAr: 'عشاء الوداع الملكي على متن الباخرة الفاخرة سانكتشواري صن بوت ٤' },
          ],
          meals: isAr ? 'إفطار، غداء وعشاء الوداع الملكي على متن الصن بوت ٤' : 'Breakfast, Nile Lunch & Captain’s Farewell Gala Dinner',
          tips: isAr ? 'جميع تصاريح الطيران والزيارة الخاصة لأبو سمبل وفيلة وفلوكة الغروب مؤكدة برقم ASW-VIP-6604.' : 'All private Abu Simbel aviation, Philae boat charter, and sunset felucca permits confirmed under ASW-VIP-6604.',
        };
      default:
        return {
          titleEn: 'Disembarkation in Aswan & Executive Transfer to Cairo International Airport',
          titleAr: 'مغادرة الباخرة في أسوان والانتقال الخاص لمطار القاهرة الدولي للعودة',
          city: 'Aswan / Cairo (CAI)',
          hotelEn: 'Sanctuary Sun Boat IV Disembarkation · Cairo VIP Terminal',
          hotelAr: 'مغادرة الباخرة الصن بوت ٤ · صالة كبار الزوار بمطار القاهرة',
          voucherCode: 'CAI-DEP-7705',
          guideName: guideDisplayName,
          times: [
            { time: '08:00', titleEn: 'Final Gourmet Breakfast Overlooking the Aswan Nile Cataract', titleAr: 'الإفطار الأخير على متن الباخرة Sanctuary Sun Boat IV بإطلالة على جنادل أسوان' },
            { time: '09:00', titleEn: 'Smooth VIP Disembarkation & Private Mercedes Transfer to Aswan Airport (ASW)', titleAr: 'إجراءات مغادرة سلسة وانتقال خاص بمرسيدس V-Class إلى مطار أسوان' },
            { time: '11:15', titleEn: 'Domestic Business Class Flight MS 085 from Aswan to Cairo (CAI)', titleAr: 'رحلة درجة رجال الأعمال MS 085 من أسوان إلى مطار القاهرة الدولي' },
            { time: '16:30', titleEn: 'VIP First Class Lounge Hospitality & Fast-Track Passport Protocol at CAI', titleAr: 'استراحة بصالة الدرجة الأولى وإنهاء إجراءات السفر السريعة بمطار القاهرة' },
            { time: '19:45', titleEn: 'International Departure on Flight EK 924 with Fond Farewell from RIHAL & Sherif Al-Muniri', titleAr: 'الإقلاع الدولي على متن رحلة طيران الإمارات EK 924 وتوديع الوفد من فريق رِحال وأ. شريف المنيري' },
          ],
          meals: isAr ? 'إفطار فاخر على متن الباخرة وضيافة صالة الدرجة الأولى بالمطار' : 'Gourmet Cruise Breakfast & First-Class Airport Lounge Hospitality',
          tips: isAr ? 'فريق مراسم المطار وكابتن محمود المصري وأ. شريف المنيري في مرافقتكم حتى بوابة الطائرة (قسيمة CAI-DEP-7705).' : 'Our airport VIP protocol team, Capt. Mahmoud El-Masry, and guide Sherif Al-Muniri escort you all the way to boarding (CAI-DEP-7705).',
        };
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans pb-28 selection:bg-amber-100"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. Instagram-Styled Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EDE0CC] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onExitPortal && (
            <button
              type="button"
              onClick={onExitPortal}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-[#44200F] active:scale-95 transition cursor-pointer"
              title={isAr ? 'خروج من بوابة المسافر' : 'Exit Concierge'}
            >
              {isAr ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
          )}

          {/* Social Handle Header */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-[#44200F] tracking-tight">
              @{guestName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'traveler'}
            </span>
            <ShieldCheck className="w-4 h-4 text-[#C4A177] shrink-0" />
            <span className="text-[10px] text-amber-900 font-extrabold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 shadow-2xs tracking-wider">
              VIP
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Operational Add Moment / Story Button */}
          <button
            type="button"
            onClick={() => setIsAddMomentModalOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-[#44200F] via-[#5C2D16] to-[#44200F] text-white text-xs font-bold shadow-xs hover:opacity-95 active:scale-95 transition cursor-pointer"
            title={isAr ? 'إضافة ستوري أو صورة للرحلة' : 'Add Story or Moment to Trip'}
          >
            <Camera className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
            <span className="hidden sm:inline">{isAr ? 'نشر لحظة' : 'Add Moment'}</span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setUiLang((prev) => (prev === 'en' ? 'ar' : 'en'))}
            className="h-8 px-2.5 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] hover:bg-[#F2EAE0] transition cursor-pointer shadow-2xs"
          >
            {isAr ? 'EN' : 'عربي'}
          </button>

          {/* 24/7 WhatsApp Concierge */}
          <button
            type="button"
            onClick={() => dispatchTripCodeToWhatsApp({ trip, passenger, workspace, uiLang })}
            className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center justify-center transition cursor-pointer shadow-2xs"
            title={isAr ? 'مشاركة وتواصل عبر واتساب' : 'WhatsApp Concierge'}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
          </button>
        </div>
      </header>

      {/* 2. Instagram Profile Header Card */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
        <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs p-4 sm:p-5">
          {/* Top Row: Avatar + Stats */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar with Instagram Gradient Story Ring */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (storiesList.length > 0) {
                    setActiveStory(storiesList[0]);
                    setActiveStoryIndex(0);
                  }
                }}
                className="w-18 h-18 sm:w-22 sm:h-22 p-[3px] rounded-full bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C] shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer group"
                title={isAr ? 'اضغط لعرض الستوريز الخاصة بالرحلة' : 'Tap to view trip stories'}
              >
                <div className="w-full h-full p-[2.5px] bg-white rounded-full overflow-hidden">
                  <img
                    src={PRESET_MOMENT_PHOTOS[0].url}
                    alt={guestName}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </button>

              {/* Add Story Badge Button on Avatar */}
              <button
                type="button"
                onClick={() => setIsAddMomentModalOpen(true)}
                className="absolute bottom-0 end-0 w-6 h-6 rounded-full bg-[#44200F] text-[#C4A177] border-2 border-white flex items-center justify-center shadow-xs cursor-pointer hover:scale-110 transition-transform"
                title={isAr ? 'إضافة ستوري جديدة' : 'Add new story'}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>

            {/* Profile Statistics (Instagram Style: Days / Moments / Status with Guaranteed Equal Height & Width) */}
            <div className="flex-1 grid grid-cols-3 gap-2 text-center items-stretch">
              <div className="luxury-metric-tile bg-gradient-to-b from-white to-[#FAF7F2] border border-[#EDE0CC] shadow-2xs hover:border-[#C4A177]/60 transition-all">
                <div className="flex items-center justify-center gap-1 text-[#795037] mb-1">
                  <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-sand shrink-0">
                    <Calendar className="w-2.5 h-2.5 text-[#C4A177]" />
                  </div>
                  <span className="font-mono font-black text-sm sm:text-base text-[#44200F] leading-none">
                    {trip.durationDays || 8}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block truncate w-full">
                  {isAr ? 'أيام الرحلة' : 'Days'}
                </span>
              </div>

              <div className="luxury-metric-tile bg-gradient-to-b from-white to-[#FAF7F2] border border-[#EDE0CC] shadow-2xs hover:border-[#C4A177]/60 transition-all">
                <div className="flex items-center justify-center gap-1 text-[#795037] mb-1">
                  <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-sand shrink-0">
                    <Camera className="w-2.5 h-2.5 text-[#C4A177]" />
                  </div>
                  <span className="font-mono font-black text-sm sm:text-base text-[#44200F] leading-none">
                    {tripMoments.length}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block truncate w-full">
                  {isAr ? 'لحظة موثقة' : 'Moments'}
                </span>
              </div>

              <div className="luxury-metric-tile bg-gradient-to-b from-white to-[#FAF7F2] border border-[#EDE0CC] shadow-2xs hover:border-[#C4A177]/60 transition-all">
                <div className="flex items-center justify-center gap-1 text-emerald-700 mb-1">
                  <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-emerald shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm leading-none">
                    {trip.status === 'Operating' ? (isAr ? 'جارية' : 'Live') : (isAr ? 'مؤكدة' : 'Active')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block truncate w-full">
                  {isAr ? 'الحالة' : 'Status'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Bio Section */}
          <div className="mt-4 space-y-2 text-start">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 font-serif leading-tight">
                {guestName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs shrink-0">
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                <span>{isAr ? 'برنامج VIP مخصص' : 'VIP Private Tour'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr ? (
                <>
                  رحلة كبار الزوار الاستكشافية في مصر مع{' '}
                  <strong className="text-[#44200F] font-bold">
                    @{workspace?.arabicName || workspace?.name || 'مكتب رحال للسفر'}
                  </strong>
                  . القاهرة · أهرامات الجيزة · معابد الأقصر وطيبة · كروز النيل الخالد 🇪🇬✨
                </>
              ) : (
                <>
                  Exclusive cultural expedition in Egypt hosted by{' '}
                  <strong className="text-[#44200F] font-bold">@{workspace?.name || 'RIHAL Travel Desk'}</strong>. Cairo, Giza Pyramids, Luxor Temples & Nile Cruise 🇪🇬✨
                </>
              )}
            </p>

            {/* Passcode Chip & Rooming Info - Equal-Height Structured Luxury Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs items-stretch">
              <button
                type="button"
                onClick={() => handleCopyCode(personalCode)}
                className="luxury-content-box luxury-content-box-sm h-full justify-between cursor-pointer hover:bg-[#F2EAE0] transition group shadow-2xs"
                title={isAr ? 'اضغط لنسخ كود الدخول' : 'Click to copy access passcode'}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-amber shrink-0 group-hover:scale-105 transition-transform">
                    <Key className="w-3.5 h-3.5 text-amber-800" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden text-start">
                    <span className="luxury-box-title">
                      {isAr ? 'كود الرحلة' : 'Passcode'}
                    </span>
                    <span className="font-mono font-black text-xs text-[#44200F] truncate block mt-0.5">
                      {personalCode}
                    </span>
                  </div>
                </div>
                <div className="ms-1 text-slate-400 group-hover:text-[#44200F] shrink-0">
                  {copiedCode === personalCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>

              {passenger?.room ? (
                <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
                  <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sand shrink-0">
                    <Hotel className="w-3.5 h-3.5 text-[#795037]" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden text-start">
                    <span className="luxury-box-title">
                      {isAr ? 'الغرفة' : 'Room'}
                    </span>
                    <span className="luxury-box-value">
                      {passenger.room}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
                  <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sand shrink-0">
                    <Hotel className="w-3.5 h-3.5 text-[#795037]" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden text-start">
                    <span className="luxury-box-title">
                      {isAr ? 'الإقامة' : 'Accommodation'}
                    </span>
                    <span className="luxury-box-value">
                      5★ Luxury Suite
                    </span>
                  </div>
                </div>
              )}

              {trip.guideName ? (
                <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
                  <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-emerald shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden text-start">
                    <span className="luxury-box-title">
                      {isAr ? 'المرشد السياحي' : 'Tour Guide'}
                    </span>
                    <span className="luxury-box-value">
                      {trip.guideName}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
                  <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-emerald shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden text-start">
                    <span className="luxury-box-title">
                      {isAr ? 'المرشد' : 'Tour Guide'}
                    </span>
                    <span className="luxury-box-value">
                      {isAr ? 'مرشد معتمد' : 'Licensed Guide'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Row (Clean High-Contrast Icon Action Boxes) */}
            <div className="grid grid-cols-3 gap-2 pt-2.5">
              <button
                type="button"
                onClick={() => setIsAddMomentModalOpen(true)}
                className="py-2 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#44200F] via-[#5C2D16] to-[#44200F] text-[#FAF7F2] font-bold text-xs shadow-xs hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
                <span className="whitespace-nowrap">{isAr ? '+ إضافة ستوري' : '+ Add Story'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePortalTab('itinerary')}
                className={`py-2 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePortalTab === 'itinerary'
                    ? 'bg-[#44200F] text-[#C4A177] border-[#44200F] shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#44200F] border-[#EDE0CC] shadow-2xs'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
                <span className="whitespace-nowrap">{isAr ? 'البرنامج' : 'Roadmap'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePortalTab('vouchers')}
                className={`h-10 px-2.5 sm:px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePortalTab === 'vouchers'
                    ? 'bg-[#44200F] text-[#C4A177] border-[#44200F] shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#44200F] border-[#EDE0CC] shadow-2xs'
                }`}
              >
                <Hotel className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
                <span className="whitespace-nowrap">{isAr ? 'القسائم' : 'Vouchers'}</span>
              </button>
            </div>

            {/* Live Today's Highlight & Next Stop Interactive Concierge Strip */}
            <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#44200F] via-[#532814] to-[#321609] text-white border border-[#C4A177]/30 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C4A177]">
                    {isAr ? `الآن · اليوم ${expandedDay || 1} من الرحلة` : `Live Companion · Day ${expandedDay || 1} of ${trip.durationDays || 7}`}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-200 border border-white/10 whitespace-nowrap">
                  ☀️ 26°C · {getDaySchedule(expandedDay || 1).city}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    {isAr ? getDaySchedule(expandedDay || 1).titleAr : getDaySchedule(expandedDay || 1).titleEn}
                  </div>
                  <div className="text-[11px] text-[#EDE0CC] truncate mt-0.5">
                    {isAr ? 'المحطة القادمة:' : 'Next Stop:'}{' '}
                    <strong className="text-[#C4A177] font-mono">
                      {getDaySchedule(expandedDay || 1).times[0]?.time}
                    </strong>{' '}
                    — {isAr ? getDaySchedule(expandedDay || 1).times[0]?.titleAr : getDaySchedule(expandedDay || 1).times[0]?.titleEn}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivePortalTab('itinerary')}
                    className="h-8 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                  >
                    <Compass className="w-3 h-3 text-[#C4A177] shrink-0" />
                    <span>{isAr ? 'جدول اليوم' : 'Day Plan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePortalTab('team')}
                    className="h-8 px-2.5 rounded-xl bg-[#C4A177] hover:bg-[#b59066] text-[#44200F] text-[11px] font-extrabold transition inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3 shrink-0" />
                    <span>{isAr ? 'المرشد' : 'Guide'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Instagram-Style Stories / Highlights Carousel (Right Below Profile) */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs p-3.5">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C4A177]" />
              <span>{isAr ? 'أبرز القصص ومعالم الرحلة (Highlights)' : 'Trip Highlights & Stories'}</span>
            </span>
            <span className="text-[10px] text-[#795037] font-semibold">
              {storiesList.length} {isAr ? 'قصص' : 'Stories'}
            </span>
          </div>

          <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto py-1 px-1 scrollbar-none touch-pan-x">
            {/* Story 0: Add New Story Highlight */}
            <button
              type="button"
              onClick={() => setIsAddMomentModalOpen(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
            >
              <div className="w-15 h-15 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-[#C4A177] hover:border-[#44200F] bg-[#FAF7F2] flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 shadow-2xs">
                <Plus className="w-6 h-6 text-[#795037] group-hover:text-[#44200F]" />
              </div>
              <span className="text-[11px] font-bold text-[#44200F] truncate w-18 text-center leading-tight">
                {isAr ? '+ ستوري' : '+ Story'}
              </span>
            </button>

            {/* Existing Story Circles */}
            {storiesList.map((story, idx) => (
              <button
                key={story.id}
                type="button"
                onClick={() => {
                  setActiveStory(story);
                  setActiveStoryIndex(idx);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
              >
                {/* Gradient Ring */}
                <div className="w-15 h-15 sm:w-16 sm:h-16 p-[2px] rounded-full bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C] shadow-xs flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
                  <div className="w-full h-full p-[2px] bg-white rounded-full overflow-hidden">
                    <img
                      src={story.coverImage}
                      alt={isAr ? story.destinationAr : story.destinationEn}
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-800 truncate w-18 text-center leading-tight">
                  {isAr ? story.destinationAr : story.destinationEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Instagram Segmented Tab Bar (Moments / Roadmap / Stays / Team - Responsive Icon Boxes) */}
      <div className="sticky top-[53px] z-30 bg-[#FAF8F5]/95 backdrop-blur-md px-4 py-2 border-b border-[#EDE0CC]/80">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-1 shadow-xs border border-[#EDE0CC] grid grid-cols-4 gap-1 text-center">
          <button
            type="button"
            onClick={() => setActivePortalTab('moments')}
            className={`py-2 px-1 sm:px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-[11px] sm:text-xs font-bold leading-none ${
              activePortalTab === 'moments'
                ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <Grid3X3 className="w-4 h-4 shrink-0 text-[#C4A177]" />
            <span className="truncate">{isAr ? 'اللحظات' : 'Moments'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('itinerary')}
            className={`py-2 px-1 sm:px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-[11px] sm:text-xs font-bold leading-none ${
              activePortalTab === 'itinerary'
                ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0 text-[#C4A177]" />
            <span className="truncate">{isAr ? 'البرنامج' : 'Roadmap'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('vouchers')}
            className={`py-2 px-1 sm:px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-[11px] sm:text-xs font-bold leading-none ${
              activePortalTab === 'vouchers'
                ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <Hotel className="w-4 h-4 shrink-0 text-[#C4A177]" />
            <span className="truncate">{isAr ? 'الفنادق' : 'Stays'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('team')}
            className={`py-2 px-1 sm:px-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer text-[11px] sm:text-xs font-bold leading-none ${
              activePortalTab === 'team'
                ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAF7F2]'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0 text-[#C4A177]" />
            <span className="truncate">{isAr ? 'الفريق' : 'Team'}</span>
          </button>
        </div>
      </div>

      {/* 5. Main Body Content Area */}
      <main className="max-w-2xl mx-auto px-4 pt-2 space-y-4">
        {/* TAB 1: MOMENTS FEED / INSTAGRAM PHOTO GRID */}
        {activePortalTab === 'moments' && (
          <div className="space-y-3">
            {/* Feed Layout Toggle (Grid vs Full Cards) */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#C4A177]" />
                <span>{isAr ? 'معرض صور ولحظات الرحلة' : 'Trip Photo Gallery & Moments'}</span>
              </span>

              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#EDE0CC]">
                <button
                  type="button"
                  onClick={() => setFeedLayout('grid')}
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                    feedLayout === 'grid' ? 'bg-[#44200F] text-[#C4A177]' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={isAr ? 'شبكة صور مربعة' : 'Grid Layout'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFeedLayout('feed')}
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                    feedLayout === 'feed' ? 'bg-[#44200F] text-[#C4A177]' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={isAr ? 'بطاقات مفصلة' : 'Feed Cards'}
                >
                  <Film className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid View (Like Instagram Profile Photo Grid) */}
            {feedLayout === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {tripMoments.map((moment) => {
                  const isLiked = likedMomentIds.includes(moment.id);
                  return (
                    <div
                      key={moment.id}
                      onClick={() => setSelectedPhotoMoment(moment)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-[#EDE0CC] cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={moment.imageUrl}
                        alt={isAr ? moment.titleAr : moment.titleEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Day Pill on Thumbnail */}
                      <span className="absolute top-2 start-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                        {isAr ? `اليوم ${moment.dayNumber}` : `Day ${moment.dayNumber}`}
                      </span>

                      {/* Hover Overlay with Likes */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white font-bold text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-white text-white" />
                          <span>{moment.likesCount}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feed Cards View (Instagram Stream) */}
            {feedLayout === 'feed' && (
              <div className="space-y-4">
                {tripMoments.map((moment) => {
                  const isLiked = likedMomentIds.includes(moment.id);
                  const isSaved = savedMomentIds.includes(moment.id);

                  return (
                    <article
                      key={moment.id}
                      className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs overflow-hidden"
                    >
                      {/* Post Header */}
                      <div className="p-3.5 flex items-center justify-between border-b border-[#EDE0CC]/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#44200F] text-[#C4A177] font-bold text-xs flex items-center justify-center shrink-0">
                            {moment.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              {moment.authorName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#C4A177]" />
                              <span>{isAr ? moment.locationAr : moment.locationEn}</span>
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC]">
                          {isAr ? `اليوم ${moment.dayNumber}` : `Day ${moment.dayNumber}`}
                        </span>
                      </div>

                      {/* Post Media */}
                      <div 
                        onClick={() => setSelectedPhotoMoment(moment)}
                        className="relative aspect-4/3 sm:aspect-16/10 bg-slate-900 cursor-pointer overflow-hidden group"
                      >
                        <img
                          src={moment.imageUrl}
                          alt={isAr ? moment.titleAr : moment.titleEn}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>

                      {/* Post Actions Bar */}
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleLike(moment.id)}
                              className="text-slate-700 hover:text-rose-600 transition cursor-pointer active:scale-125"
                              aria-label="Like"
                            >
                              <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPhotoMoment(moment)}
                              className="text-slate-700 hover:text-slate-900 transition cursor-pointer"
                              aria-label="Comment"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => dispatchTripCodeToWhatsApp({ trip, passenger, workspace, uiLang })}
                              className="text-slate-700 hover:text-emerald-600 transition cursor-pointer"
                              aria-label="Share"
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleSave(moment.id)}
                            className="text-slate-700 hover:text-[#44200F] transition cursor-pointer active:scale-110"
                            aria-label="Save"
                          >
                            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-[#44200F] text-[#44200F]' : ''}`} />
                          </button>
                        </div>

                        {/* Likes counter */}
                        <div className="text-xs font-bold text-slate-900">
                          {moment.likesCount} {isAr ? 'إعجاب' : 'likes'}
                        </div>

                        {/* Caption & Title */}
                        <div className="text-xs text-slate-800 leading-relaxed">
                          <strong className="text-[#44200F] font-bold me-1.5">
                            {isAr ? moment.titleAr : moment.titleEn}:
                          </strong>
                          <span>{isAr ? moment.captionAr : moment.captionEn}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DAY-BY-DAY OPERATIONAL ITINERARY */}
        {activePortalTab === 'itinerary' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#C4A177] shrink-0" />
                <span>{isAr ? 'جدول ومسار الأيام المعتمد' : 'Official Day-by-Day Roadmap'}</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#44200F]">
                {trip.durationDays} {isAr ? 'أيام' : 'Days'}
              </span>
            </div>

            {Array.from({ length: Math.max(trip.durationDays || 7, 7) }, (_, i) => i + 1).map((dayNum) => {
              const schedule = getDaySchedule(dayNum);
              const isExpanded = expandedDay === dayNum;

              return (
                <div 
                  key={dayNum}
                  className="bg-white rounded-2xl border border-[#EDE0CC] shadow-xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedDay(isExpanded ? 0 : dayNum)}
                    className="w-full p-4 flex items-center justify-between text-start cursor-pointer hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#44200F] to-[#60331A] text-[#C4A177] flex flex-col items-center justify-center shrink-0 shadow-xs border border-[#C4A177]/30">
                        <span className="text-[9px] uppercase tracking-wider text-[#C4A177]/90 font-bold leading-none">DAY</span>
                        <span className="text-sm font-black text-white leading-none mt-0.5">{dayNum}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                          {isAr ? schedule.titleAr : schedule.titleEn}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#C4A177] shrink-0" />
                            <span>{schedule.city}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 text-[#44200F] font-semibold">
                            <Hotel className="w-3 h-3 text-[#795037] shrink-0" />
                            <span>{isAr ? schedule.hotelAr : schedule.hotelEn}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#EDE0CC] font-mono text-[10px] font-bold text-[#795037]">
                            #{schedule.voucherCode}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 text-xs">
                      {/* Accommodation, Guide & Voucher Metadata Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center gap-2">
                          <Hotel className="w-4 h-4 text-[#795037] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">{isAr ? 'الإقامة / الباخرة' : 'Hotel / Cruise'}</span>
                            <span className="font-bold text-[#44200F] text-[11px] block truncate">{isAr ? schedule.hotelAr : schedule.hotelEn}</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-[#795037] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">{isAr ? 'المرشد المرافق' : 'Assigned Guide'}</span>
                            <span className="font-bold text-[#44200F] text-[11px] block truncate">{schedule.guideName}</span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-emerald-700 block font-bold uppercase">{isAr ? 'رقم القسيمة المؤكدة' : 'Issued Voucher #'}</span>
                            <span className="font-mono font-bold text-emerald-950 text-[11px] block truncate">{schedule.voucherCode}</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Items */}
                      <div className="space-y-2 border-s-2 border-[#C4A177]/40 ms-2 ps-3 my-2">
                        {schedule.times.map((item, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -start-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#C4A177] ring-4 ring-white" />
                            <span className="font-mono font-bold text-[#44200F] text-[11px] block">{item.time}</span>
                            <span className="text-slate-700 font-medium text-xs block">{isAr ? item.titleAr : item.titleEn}</span>
                          </div>
                        ))}
                      </div>

                      {/* Meals & Tips Icon Box */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white to-[#FAF7F2] border border-[#EDE0CC] space-y-2 text-xs shadow-2xs">
                        <div className="flex items-center gap-2 font-bold text-[#44200F]">
                          <div className="w-6 h-6 rounded-lg bg-amber-100/70 flex items-center justify-center shrink-0 text-[#795037]">
                            <Utensils className="w-3.5 h-3.5" />
                          </div>
                          <span>
                            {isAr ? 'الوجبات المقررة:' : 'Included Meals:'}{' '}
                            <span className="font-semibold text-slate-700">{schedule.meals}</span>
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-600 bg-white/80 p-2.5 rounded-xl border border-[#EDE0CC]/60 leading-relaxed text-[11px]">
                          <span className="text-amber-600 shrink-0 text-xs mt-0.5">💡</span>
                          <span>{schedule.tips}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: STAYS & OFFICIAL VOUCHERS */}
        {activePortalTab === 'vouchers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Hotel className="w-4 h-4 text-[#C4A177] shrink-0" />
                <span>{isAr ? 'قسائم الفنادق والنايل كروز والخدمات المؤكدة' : 'Verified Hotel, Cruise & Service Vouchers'}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                {isAr ? 'مؤكدة ومعتمدة' : 'Confirmed'}
              </span>
            </div>

            {/* Hotel & Cruise Stays List (dates derived dynamically from trip.startDate) */}
            {(() => {
              const baseStart = trip.startDate || '2026-11-20';
              const addDaysIso = (offset: number): string => {
                const d = new Date(`${baseStart}T00:00:00Z`);
                if (Number.isNaN(d.getTime())) return baseStart;
                d.setUTCDate(d.getUTCDate() + offset);
                return d.toISOString().slice(0, 10);
              };
              const stays = [
                {
                  nameEn: 'Four Seasons Hotel Cairo at Nile Plaza',
                  nameAr: 'فندق فورسيزونز القاهرة نايل بلازا (Four Seasons Cairo)',
                  city: 'Cairo (Days 1–2)',
                  checkIn: addDaysIso(0),
                  checkOut: addDaysIso(2),
                  roomType: '2x Royal Nile View Suites (King + Twin)',
                  confirmationNo: 'FS-CAI-88412',
                  note: isAr ? 'إفطار فاخر وخدمة المساعد الشخصي والتسكين المبكر مؤكدة بالكامل' : 'Gourmet Breakfast, Private Butler & Early VIP Check-in Confirmed',
                },
                {
                  nameEn: 'Sofitel Winter Palace Luxor',
                  nameAr: 'فندق سوفيتيل وونتر بالاس التاريخي، الأقصر',
                  city: 'Luxor East Bank (Day 3)',
                  checkIn: addDaysIso(2),
                  checkOut: addDaysIso(3),
                  roomType: '2x Historic Royal Wing Suites',
                  confirmationNo: 'SWP-LXR-55109',
                  note: isAr ? 'إقامة شاملة الإفطار وعشاء ملكي بمطعم 1886 التاريخي' : 'Includes Royal Breakfast & 1886 Fine Dining Dinner Reservation',
                },
                {
                  nameEn: 'Sanctuary Sun Boat IV — Luxury Nile Cruise',
                  nameAr: 'الباخرة الفاخرة سانكتشواري صن بوت ٤ (Sanctuary Sun Boat IV)',
                  city: 'Luxor • Edfu • Kom Ombo • Aswan (Days 4–7)',
                  checkIn: addDaysIso(3),
                  checkOut: trip.departure?.date || addDaysIso(trip.durationDays || 7),
                  roomType: '2x Presidential Nile Deck Suites',
                  confirmationNo: 'SSB-NILE-4402',
                  note: isAr ? 'إقامة كاملة (Full Board+) شاملة المزارات الخاصة مع المرشد أ. شريف المنيري' : 'Full Board Gourmet Charter + Private Excursions with Guide Sherif Al-Muniri',
                },
              ];
              return stays.map((hotel, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 font-serif">
                      {isAr ? hotel.nameAr : hotel.nameEn}
                    </h3>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
                      <span>{hotel.city}</span>
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-[10px] shadow-2xs shrink-0">
                    {isAr ? 'قسيمة مؤكدة' : 'Voucher Issued'}
                  </span>
                </div>

                {/* Voucher Confirmation Strip Icon Box */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] border border-[#EDE0CC] flex items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0 text-[#795037] shadow-2xs">
                      <Hotel className="w-4 h-4 text-[#795037]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider leading-none">
                        {isAr ? 'رقم التأكيد الفندقي' : 'Confirmation Number'}
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm text-[#44200F] tracking-wide block mt-0.5 truncate">
                        {hotel.confirmationNo}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(hotel.confirmationNo)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#EDE0CC] font-bold text-xs text-[#44200F] flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer shadow-2xs group shrink-0"
                  >
                    {copiedCode === hotel.confirmationNo ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span className="text-emerald-700">{isAr ? 'تم النسخ' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#C4A177] group-hover:text-[#44200F]" />
                        <span>{isAr ? 'نسخ' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Check-in and Check-out Paired Icon Boxes (Strictly Equal Height) */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-0.5 items-stretch">
                  <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
                    <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sand shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-[#795037]" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <span className="luxury-box-title">
                        {isAr ? 'تاريخ الدخول' : 'Check-in'}
                      </span>
                      <strong className="luxury-box-value font-mono">{hotel.checkIn}</strong>
                    </div>
                  </div>

                  <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
                    <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sand shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-[#795037]" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <span className="luxury-box-title">
                        {isAr ? 'تاريخ المغادرة' : 'Check-out'}
                      </span>
                      <strong className="luxury-box-value font-mono">{hotel.checkOut}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{hotel.note}</span>
                </div>
                </div>
              ));
            })()}

            {/* Additional Issued Operational Vouchers from Trip Services */}
            {(trip.services || []).filter(s => s.confirmationNo && !['FS-CAI-88412', 'SWP-LXR-55109', 'SSB-NILE-4402'].includes(s.confirmationNo)).length > 0 && (
              <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-[#44200F]">
                    {isAr ? 'قسائم الانتقالات والمزارات الخاصة الصادرة' : 'Issued Touring, Aviation & VIP Transfer Vouchers'}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-[#795037]">
                    {guideDisplayName}
                  </span>
                </div>
                <div className="space-y-2">
                  {(trip.services || [])
                    .filter(s => s.confirmationNo && !['FS-CAI-88412', 'SWP-LXR-55109', 'SSB-NILE-4402'].includes(s.confirmationNo))
                    .map((svc) => (
                      <div key={svc.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#795037] uppercase block">
                            {isAr ? `اليوم ${svc.dayNumber} • ${svc.city}` : `Day ${svc.dayNumber} • ${svc.city}`}
                          </span>
                          <span className="font-bold text-slate-900 block truncate">{svc.serviceName}</span>
                          <span className="text-[11px] text-slate-500 block truncate">{svc.supplierName}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-white border border-[#EDE0CC] font-mono font-bold text-[11px] text-[#44200F] shrink-0">
                          {svc.confirmationNo}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Traveler VIP Pocket Reference: Egypt Tipping & Quick Reference Card */}
            <div className="bg-gradient-to-b from-white to-[#FAF7F2] rounded-3xl border border-[#EDE0CC] shadow-xs p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-amber shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#44200F]">
                      {isAr ? 'دليل المسافر السريع: الإكراميات والطوارئ' : 'VIP Pocket Guide: Tipping & Concierge Desk'}
                    </h4>
                    <p className="text-[11px] text-[#795037]">
                      {isAr ? 'إرشادات معتمدة لرحلة مريحة وسلسة في مصر' : 'Curated etiquette & 24/7 operational support'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs items-stretch">
                <div className="luxury-content-box luxury-content-box-sm h-full">
                  <div className="min-w-0 flex-1">
                    <span className="luxury-box-title">{isAr ? 'المرشد السياحي' : 'Egyptologist Guide'}</span>
                    <span className="luxury-box-value font-mono">$15–$20 / day</span>
                  </div>
                </div>
                <div className="luxury-content-box luxury-content-box-sm h-full">
                  <div className="min-w-0 flex-1">
                    <span className="luxury-box-title">{isAr ? 'السائق الخاص' : 'VIP Chauffeur'}</span>
                    <span className="luxury-box-value font-mono">$8–$12 / day</span>
                  </div>
                </div>
                <div className="luxury-content-box luxury-content-box-sm h-full col-span-2 sm:col-span-1">
                  <div className="min-w-0 flex-1">
                    <span className="luxury-box-title">{isAr ? 'خط طوارئ العمليات' : '24/7 Duty Desk'}</span>
                    <span className="luxury-box-value font-mono">{workspace.contactPhone || '+20 100 123 4567'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FIELD TEAM & TRANSPORTATION */}
        {activePortalTab === 'team' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#C4A177] shrink-0" />
                <span>{isAr ? 'فريق العمل الميداني والمركبة' : 'Assigned Guide & Chauffeur'}</span>
              </span>
            </div>

            {/* Guide Card with Polished Icon Boxes */}
            <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#44200F] to-[#60331A] text-[#C4A177] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs border border-[#C4A177]/40">
                  <UserCheck className="w-7 h-7 text-[#C4A177]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 font-serif truncate">
                      {trip.guideName || 'Dr. Tarek Mansour'}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-[#C4A177] shrink-0" />
                  </div>
                  <span className="text-xs text-slate-500 block font-medium">
                    {isAr ? 'مرشد سياحي مصري مرخص' : 'Licensed Egyptologist Tour Guide'}
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EDE0CC] text-[11px] text-[#795037] font-semibold mt-1">
                    <span>🌐 {isAr ? `اللغات: ${trip.guideLanguage || 'الإنجليزية، العربية'}` : `Languages: ${trip.guideLanguage || 'English, Arabic'}`}</span>
                  </div>
                </div>
              </div>

              {trip.guidePhone && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 items-stretch">
                  <a
                    href={`tel:${trip.guidePhone}`}
                    className="h-10 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#44200F] font-bold text-xs flex items-center justify-center gap-2 border border-[#EDE0CC] transition shadow-2xs cursor-pointer group"
                  >
                    <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-sand shrink-0 group-hover:scale-105 transition-transform">
                      <Phone className="w-2.5 h-2.5 text-[#795037]" />
                    </div>
                    <span className="truncate">{isAr ? 'اتصال مباشر' : 'Call Guide'}</span>
                  </a>

                  <a
                    href={`https://wa.me/${trip.guidePhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-300 transition shadow-2xs cursor-pointer group"
                  >
                    <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-emerald shrink-0 group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-2.5 h-2.5 text-emerald-700" />
                    </div>
                    <span className="truncate">WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Chauffeur Card with Polished Icon Boxes */}
            <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-xs p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#44200F] to-[#60331A] text-[#C4A177] font-bold text-sm flex items-center justify-center shrink-0 shadow-xs border border-[#C4A177]/40">
                  <Truck className="w-7 h-7 text-[#C4A177]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 font-serif truncate">
                      {trip.driverName || 'Captain Ahmed El-Sayed'}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <span className="text-xs text-slate-500 block font-medium truncate">
                    {isAr ? 'كابتن وسائق خاص معتمد' : 'Professional VIP Chauffeur'}
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EDE0CC] text-[11px] font-mono font-bold text-[#44200F] mt-1 max-w-full">
                    <span className="truncate">{trip.vehicleType || 'Mercedes Sprinter VIP'} {trip.vehiclePlate ? `(${trip.vehiclePlate})` : ''}</span>
                  </div>
                </div>
              </div>

              {trip.driverPhone && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 items-stretch">
                  <a
                    href={`tel:${trip.driverPhone}`}
                    className="h-10 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#44200F] font-bold text-xs flex items-center justify-center gap-2 border border-[#EDE0CC] transition shadow-2xs cursor-pointer group"
                  >
                    <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-sand shrink-0 group-hover:scale-105 transition-transform">
                      <Phone className="w-2.5 h-2.5 text-[#795037]" />
                    </div>
                    <span className="truncate">{isAr ? 'اتصال بالسائق' : 'Call Driver'}</span>
                  </a>

                  <a
                    href={`https://wa.me/${trip.driverPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-300 transition shadow-2xs cursor-pointer group"
                  >
                    <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-emerald shrink-0 group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-2.5 h-2.5 text-emerald-700" />
                    </div>
                    <span className="truncate">WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 6. Story Modal Player (Full-Screen Instagram Story Player) */}
      <TravelerStoryModal
        story={activeStory}
        isOpen={Boolean(activeStory)}
        onClose={() => setActiveStory(null)}
        uiLang={uiLang}
        onSelectNextStory={() => {
          if (activeStoryIndex < storiesList.length - 1) {
            const nextIdx = activeStoryIndex + 1;
            setActiveStoryIndex(nextIdx);
            setActiveStory(storiesList[nextIdx]);
          } else {
            setActiveStory(null);
          }
        }}
        onSelectPrevStory={() => {
          if (activeStoryIndex > 0) {
            const prevIdx = activeStoryIndex - 1;
            setActiveStoryIndex(prevIdx);
            setActiveStory(storiesList[prevIdx]);
          }
        }}
      />

      {/* 7. Expanded Photo Moment Modal */}
      {selectedPhotoMoment && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={() => setSelectedPhotoMoment(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Image */}
            <div className="relative aspect-4/3 bg-black">
              <img
                src={selectedPhotoMoment.imageUrl}
                alt={isAr ? selectedPhotoMoment.titleAr : selectedPhotoMoment.titleEn}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedPhotoMoment(null)}
                className="absolute top-3 end-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer hover:bg-black/80 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-3 text-start">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">
                    {isAr ? selectedPhotoMoment.titleAr : selectedPhotoMoment.titleEn}
                  </h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>{isAr ? selectedPhotoMoment.locationAr : selectedPhotoMoment.locationEn}</span>
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC]">
                  {isAr ? `اليوم ${selectedPhotoMoment.dayNumber}` : `Day ${selectedPhotoMoment.dayNumber}`}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {isAr ? selectedPhotoMoment.captionAr : selectedPhotoMoment.captionEn}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[#EDE0CC] text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleLike(selectedPhotoMoment.id)}
                  className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-rose-600 transition cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${likedMomentIds.includes(selectedPhotoMoment.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{selectedPhotoMoment.likesCount} {isAr ? 'إعجاب' : 'likes'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => dispatchTripCodeToWhatsApp({ trip, passenger, workspace, uiLang })}
                  className="flex items-center gap-1 text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Operational "Add Story / Moment" Modal */}
      {isAddMomentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE0CC]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C] p-0.5 flex items-center justify-center shadow-xs">
                  <div className="w-full h-full rounded-[14px] bg-[#44200F] flex items-center justify-center">
                    <Camera className="w-4 h-4 text-[#C4A177]" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 font-serif">
                    {isAr ? 'نشر لحظة أو ستوري في الرحلة' : 'Publish Story / Live Moment'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'إضافة صورة لمعرض المسافر وشريط الستوريز' : 'Post real-time photo to traveler feed & stories'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMomentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Selection Tabs: Preset vs Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {isAr ? 'اختر صورة من معالم الرحلة أو ارفع من جهازك:' : 'Select Photo from Tour or Upload:'}
              </label>

              {/* Upload file trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadedFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    if (evt.target?.result) {
                      setSelectedPhotoUrl(evt.target.result as string);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl border border-dashed border-[#C4A177] hover:bg-[#FAF7F2] text-xs font-bold text-[#44200F] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[#795037]" />
                  <span>{uploadedFileName ? uploadedFileName : (isAr ? 'رفع صورة من الجهاز' : 'Upload Device Photo')}</span>
                </button>
              </div>

              {/* Curated Presets Grid */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {PRESET_MOMENT_PHOTOS.map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => {
                      setSelectedPhotoUrl(p.url);
                      setMomentTitle(isAr ? p.titleAr : p.titleEn);
                      setMomentLocation(isAr ? p.locationAr : p.locationEn);
                    }}
                    className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                      selectedPhotoUrl === p.url ? 'border-[#C4A177] ring-2 ring-[#C4A177]/40' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.titleEn} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Title, Caption, Day */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'عنوان اللحظة:' : 'Moment Title:'}
                </label>
                <input
                  type="text"
                  value={momentTitle}
                  onChange={(e) => setMomentTitle(e.target.value)}
                  placeholder={isAr ? 'غروب النيل الساحر...' : 'Nile Sunset Bliss...'}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-slate-900 outline-none focus:border-[#C4A177]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'الوصف والانطباع:' : 'Caption & Details:'}
                </label>
                <textarea
                  rows={2}
                  value={momentCaption}
                  onChange={(e) => setMomentCaption(e.target.value)}
                  placeholder={isAr ? 'لحظة تاريخية لا تُنسى في حضرة الفراعنة...' : 'A memorable milestone during our journey...'}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-slate-900 outline-none focus:border-[#C4A177]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAr ? 'رقم اليوم بالبرنامج:' : 'Day Number:'}
                  </label>
                  <select
                    value={momentDay}
                    onChange={(e) => setMomentDay(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-slate-900 outline-none focus:border-[#C4A177]"
                  >
                    {Array.from({ length: trip.durationDays || 7 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {isAr ? `اليوم ${d}` : `Day ${d}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAr ? 'المعلم والمدينة:' : 'Location Tag:'}
                  </label>
                  <input
                    type="text"
                    value={momentLocation}
                    onChange={(e) => setMomentLocation(e.target.value)}
                    placeholder="Giza Pyramids"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs text-slate-900 outline-none focus:border-[#C4A177]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={addToHighlights}
                  onChange={(e) => setAddToHighlights(e.target.checked)}
                  className="w-4 h-4 text-[#44200F] rounded-md focus:ring-[#C4A177]"
                />
                <span>{isAr ? 'إدراج أيضاً في شريط الستوريز أعلى البروفايل' : 'Also feature in Top Story Highlights'}</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDE0CC]">
              <button
                type="button"
                onClick={() => setIsAddMomentModalOpen(false)}
                className="h-10 px-4 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handlePublishNewMoment}
                className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#44200F] via-[#5C2D16] to-[#44200F] text-[#C4A177] hover:opacity-95 transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'نشر اللحظة الآن' : 'Publish Moment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Fixed Mobile Thumb-Zone Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE0CC] px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 gap-1 items-stretch">
          <button
            type="button"
            onClick={() => setActivePortalTab('moments')}
            className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
              activePortalTab === 'moments'
                ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                : 'text-[#795037] hover:bg-[#FAF7F2]'
            }`}
          >
            <Grid3X3 className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'اللحظات' : 'Moments'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('itinerary')}
            className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
              activePortalTab === 'itinerary'
                ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                : 'text-[#795037] hover:bg-[#FAF7F2]'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'البرنامج' : 'Roadmap'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddMomentModalOpen(true)}
            className="min-h-[46px] rounded-xl bg-gradient-to-r from-[#EA580C] to-[#E1306C] text-white flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span className="truncate max-w-full px-1">{isAr ? '+ ستوري' : '+ Story'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('vouchers')}
            className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
              activePortalTab === 'vouchers'
                ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                : 'text-[#795037] hover:bg-[#FAF7F2]'
            }`}
          >
            <Hotel className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'الفنادق' : 'Stays'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('team')}
            className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition cursor-pointer ${
              activePortalTab === 'team'
                ? 'bg-[#44200F] text-[#C4A177] shadow-2xs'
                : 'text-[#795037] hover:bg-[#FAF7F2]'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full px-1">{isAr ? 'الفريق' : 'Team'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
