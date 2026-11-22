import React, { useState, useRef, useMemo } from 'react';
import {
  Building2, ShieldCheck, Award, MapPin, Globe, Phone, Mail,
  MessageSquare, Plus, Trash2, Check, ExternalLink, Image as ImageIcon,
  Sparkles, Eye, Users, Truck, Compass, CheckCircle2,
  AlertCircle, Upload, Camera, X, Edit3, Heart, Bookmark,
  DollarSign, Clock, Tag, Play, Send, Share2, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workspace, UILanguage, AgencyPhoto } from '../../types';
import { repository } from '../../lib/storage';
import { loadTrips } from '../../lib/tripStore';
import {
  DestinationStory,
  TravelerFeedPost,
  getAllStories,
  deleteCustomStory,
  getAllFeedPosts,
  saveCustomFeedPost,
  deleteCustomFeedPost,
} from '../../lib/travelerFeedData';
import { TravelerStoryEditorModal } from '../traveler/TravelerStoryEditorModal';
import { TravelerStoryModal } from '../traveler/TravelerStoryModal';

interface AgencyProfileEditorProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onUpdateWorkspace: (updates: Partial<Workspace>) => void;
  onOpenPublicShowcase?: () => void;
  onReloadData?: () => void;
}

const DEFAULT_SAMPLE_PHOTOS: AgencyPhoto[] = [
  {
    id: 'photo-sample-1',
    url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1000&q=85',
    caption: 'Private Sunrise Access at the Great Pyramids of Giza',
    captionAr: 'دخول خاص عند شروق الشمس أمام أهرامات الجيزة',
    category: 'tours',
  },
  {
    id: 'photo-sample-2',
    url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1000&q=85',
    caption: 'Private Luxury Dahabiya Sailing Between Luxor & Aswan',
    captionAr: 'إبحار خاص بالدهبية الملكية الفاخرة بين الأقصر وأسوان',
    category: 'tours',
  },
  {
    id: 'photo-sample-3',
    url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1000&q=85',
    caption: 'Karnak Temple Hypostyle Hall Exclusive Guided Tour',
    captionAr: 'جولة إرشادية خاصة في بهو الأعمدة بمعبد الكرنك',
    category: 'tours',
  },
  {
    id: 'photo-sample-4',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=85',
    caption: 'Red Sea Private Yacht & Coral Reef Snorkeling Charter',
    captionAr: 'يخت خاص ورحلة غوص في شعاب البحر الأحمر المرجانية',
    category: 'hotels',
  },
  {
    id: 'photo-sample-5',
    url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1000&q=85',
    caption: 'VIP Airport Meet & Assist and Mercedes Fleet Dispatch',
    captionAr: 'استقبال VIP بالمطار وأسطول سيارات مرسيدس السياحي الحديث',
    category: 'fleet',
  },
  {
    id: 'photo-sample-6',
    url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1000&q=85',
    caption: 'Cairo Operations Headquarters & Concierge Desk',
    captionAr: 'مقر العمليات الرئيسي ومكتب الكونسيرج في القاهرة',
    category: 'office',
  },
];

const COVER_PRESETS = [
  {
    labelAr: 'أهرامات الجيزة عند الغروب',
    labelEn: 'Pyramids Golden Hour',
    url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1400&q=85',
  },
  {
    labelAr: 'دهبية النيل الفاخرة',
    labelEn: 'Luxury Nile Dahabiya',
    url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1400&q=85',
  },
  {
    labelAr: 'معابد الأقصر والكرنك',
    labelEn: 'Karnak & Luxor Temples',
    url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1400&q=85',
  },
  {
    labelAr: 'شاطئ البحر الأحمر الفيروزي',
    labelEn: 'Red Sea Riviera',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85',
  },
];

const GOVERNORATE_OPTIONS = [
  'Cairo & Giza',
  'Luxor',
  'Aswan & Abu Simbel',
  'Hurghada & Red Sea',
  'Sharm El Sheikh & Sinai',
  'Alexandria & North Coast',
  'Siwa & Western Desert',
];

const LANGUAGE_OPTIONS = [
  'Arabic',
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Russian',
  'Japanese',
];

export const AgencyProfileEditor: React.FC<AgencyProfileEditorProps> = ({
  workspace,
  uiLang,
  onUpdateWorkspace,
  onOpenPublicShowcase,
  onReloadData,
}) => {
  const isAr = uiLang === 'ar';

  // File input refs
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const photoUploadInputRef = useRef<HTMLInputElement | null>(null);
  const postImageInputRef = useRef<HTMLInputElement | null>(null);

  // Studio Sub-navigation Tab
  const [studioTab, setStudioTab] = useState<'feed' | 'stories' | 'gallery' | 'bio'>('feed');

  // Toast / Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Profile Identity State (strictly sourced from active workspace — zero hardcoded RIHAL/Blue Nile defaults)
  const [name, setName] = useState(workspace.name || '');
  const [arabicName, setArabicName] = useState(workspace.arabicName || '');
  const [logoUrl, setLogoUrl] = useState(workspace.logoUrl || '');
  const [coverImageUrl, setCoverImageUrl] = useState(workspace.coverImageUrl || '');
  const [description, setDescription] = useState(workspace.description || '');
  const [descriptionAr, setDescriptionAr] = useState(workspace.descriptionAr || '');
  const [contactPhone, setContactPhone] = useState(workspace.contactPhone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(workspace.whatsappNumber || workspace.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(workspace.contactEmail || '');
  const [address, setAddress] = useState(workspace.address || '');
  const liveOperationalCounts = useMemo(() => {
    const trips = loadTrips();
    const quotes = repository.getQuotes(workspace.id);
    const suppliers = repository.getSuppliers(workspace.id);
    const expeditions = Math.max(
      workspace.completedTripsCount || 0,
      trips.filter(t => t.status !== 'Cancelled').length,
      quotes.filter(q => q.status === 'Accepted').length
    );
    const paxFromTrips = trips.reduce((s, t) => s + (t.passengers?.length || 0), 0);
    const paxFromQuotes = quotes
      .filter(q => q.status === 'Accepted')
      .reduce((s, q) => s + (q.group?.adults || 0) + (q.group?.children?.length || 0) + (q.group?.infants || 0), 0);
    const travelers = Math.max(workspace.travelersCount || 0, paxFromTrips, paxFromQuotes);
    const guidesSet = new Set<string>();
    trips.forEach(t => { if (t.guideName) guidesSet.add(t.guideName.trim()); });
    suppliers.filter(s => s.type === 'Guide').forEach(s => guidesSet.add(s.name.trim()));
    const fleetSet = new Set<string>();
    trips.forEach(t => { if (t.vehiclePlate) fleetSet.add(t.vehiclePlate.trim()); else if (t.vehicleType) fleetSet.add(t.vehicleType.trim()); });
    suppliers.filter(s => s.type === 'Transport').forEach(s => fleetSet.add(s.name.trim()));
    return {
      expeditions,
      travelers,
      guides: Math.max(workspace.guideRosterCount || 0, guidesSet.size, 1),
      fleet: Math.max(workspace.fleetCount || 0, fleetSet.size, 1),
    };
  }, [workspace]);

  const [foundedYear, setFoundedYear] = useState<number>(workspace.foundedYear || 2014);
  const [guideRosterCount, setGuideRosterCount] = useState<number>(workspace.guideRosterCount || liveOperationalCounts.guides);
  const [fleetCount, setFleetCount] = useState<number>(workspace.fleetCount || liveOperationalCounts.fleet);
  const [coveredDestinations, setCoveredDestinations] = useState<string[]>(
    workspace.coveredDestinations && workspace.coveredDestinations.length > 0
      ? workspace.coveredDestinations
      : ['Cairo & Giza', 'Luxor', 'Aswan & Abu Simbel', 'Hurghada & Red Sea']
  );
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(
    workspace.supportedLanguages && workspace.supportedLanguages.length > 0
      ? workspace.supportedLanguages
      : ['Arabic', 'English', 'Spanish', 'French']
  );

  // Gallery Photos State
  const [galleryPhotos, setGalleryPhotos] = useState<AgencyPhoto[]>(() =>
    workspace.galleryPhotos && workspace.galleryPhotos.length > 0
      ? workspace.galleryPhotos
      : DEFAULT_SAMPLE_PHOTOS
  );
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<'all' | 'tours' | 'fleet' | 'hotels' | 'office'>('all');

  // Photo Add / Edit Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AgencyPhoto | null>(null);
  const [photoFormUrl, setPhotoFormUrl] = useState('');
  const [photoFormCaptionEn, setPhotoFormCaptionEn] = useState('');
  const [photoFormCaptionAr, setPhotoFormCaptionAr] = useState('');
  const [photoFormCategory, setPhotoFormCategory] = useState<'office' | 'fleet' | 'tours' | 'hotels'>('tours');

  // Stories State
  const [stories, setStories] = useState<DestinationStory[]>(() => getAllStories());
  const [storyEditorOpen, setStoryEditorOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<DestinationStory | null>(null);
  const [playingStory, setPlayingStory] = useState<DestinationStory | null>(null);

  // Social Feed Posts State
  const [feedPosts, setFeedPosts] = useState<TravelerFeedPost[]>(() => getAllFeedPosts());
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<TravelerFeedPost | null>(null);
  const [postTitleAr, setPostTitleAr] = useState('');
  const [postTitleEn, setPostTitleEn] = useState('');
  const [postCaptionAr, setPostCaptionAr] = useState('');
  const [postCaptionEn, setPostCaptionEn] = useState('');
  const [postLocationAr, setPostLocationAr] = useState('الأقصر وأسوان، نهر النيل');
  const [postLocationEn, setPostLocationEn] = useState('Luxor & Aswan, River Nile');
  const [postPriceUsd, setPostPriceUsd] = useState<number>(1450);
  const [postDurationDays, setPostDurationDays] = useState<number>(6);
  const [postImages, setPostImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=85',
  ]);
  const [postNewImageUrl, setPostNewImageUrl] = useState('');
  const [postTagsInput, setPostTagsInput] = useState('#NileCruise #LuxuryEgypt #PrivateTravel');
  const [postHighlightsArInput, setPostHighlightsArInput] = useState('فنادق ٥ نجوم فاخرة, مرشد أثري خاص, انتقالات VIP');
  const [postHighlightsEnInput, setPostHighlightsEnInput] = useState('5-Star Luxury Hotels, Private Egyptologist, VIP Transfers');

  // Cover preset picker toggle
  const [showCoverPresets, setShowCoverPresets] = useState(false);

  // Sync changes to Workspace immediately
  const persistWorkspaceChanges = (partial: Partial<Workspace>, customToast?: string) => {
    onUpdateWorkspace(partial);
    if (onReloadData) onReloadData();
    triggerToast(customToast || (isAr ? 'تم حفظ التعديلات وتحديث بروفايل الشركة' : 'Company profile updated and saved'));
  };

  // Handle Direct Cover Upload
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setCoverImageUrl(result);
        persistWorkspaceChanges({ coverImageUrl: result }, isAr ? 'تم تحديث صورة الغلاف بنجاح' : 'Cover photo updated');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Direct Logo / Avatar Upload
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setLogoUrl(result);
        persistWorkspaceChanges({ logoUrl: result }, isAr ? 'تم تحديث شعار وصورة البروفايل بنجاح' : 'Profile avatar updated');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Full Bio & Identity Form
  const handleSaveIdentityForm = (e: React.FormEvent) => {
    e.preventDefault();
    persistWorkspaceChanges({
      name: name.trim() || workspace.name,
      arabicName: arabicName.trim() || name.trim(),
      logoUrl,
      coverImageUrl,
      description,
      descriptionAr,
      contactPhone,
      whatsappNumber,
      contactEmail,
      address,
      foundedYear,
      guideRosterCount,
      fleetCount,
      coveredDestinations,
      supportedLanguages,
      galleryPhotos,
    });
  };

  // Gallery Photo Modal Openers
  const openAddPhotoModal = () => {
    setEditingPhoto(null);
    setPhotoFormUrl('');
    setPhotoFormCaptionAr('');
    setPhotoFormCaptionEn('');
    setPhotoFormCategory('tours');
    setPhotoModalOpen(true);
  };

  const openEditPhotoModal = (photo: AgencyPhoto) => {
    setEditingPhoto(photo);
    setPhotoFormUrl(photo.url);
    setPhotoFormCaptionEn(photo.caption || '');
    setPhotoFormCaptionAr(photo.captionAr || photo.caption || '');
    setPhotoFormCategory(photo.category || 'tours');
    setPhotoModalOpen(true);
  };

  const handleGalleryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setPhotoFormUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveGalleryPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFormUrl.trim()) return;

    const newPhoto: AgencyPhoto = {
      id: editingPhoto ? editingPhoto.id : `photo_${Date.now()}`,
      url: photoFormUrl.trim(),
      caption: photoFormCaptionEn.trim() || photoFormCaptionAr.trim() || 'Company Field Photo',
      captionAr: photoFormCaptionAr.trim() || photoFormCaptionEn.trim() || 'صورة ميدانية للشركة',
      category: photoFormCategory,
    };

    const nextPhotos = editingPhoto
      ? galleryPhotos.map(p => (p.id === editingPhoto.id ? newPhoto : p))
      : [newPhoto, ...galleryPhotos];

    setGalleryPhotos(nextPhotos);
    setPhotoModalOpen(false);
    persistWorkspaceChanges(
      { galleryPhotos: nextPhotos },
      editingPhoto
        ? (isAr ? 'تم تعديل الصورة ووصفها بنجاح' : 'Photo updated successfully')
        : (isAr ? 'تمت إضافة الصورة إلى معرض الشركة' : 'New photo added to company gallery')
    );
  };

  const handleDeleteGalleryPhoto = (photoId: string) => {
    const nextPhotos = galleryPhotos.filter(p => p.id !== photoId);
    setGalleryPhotos(nextPhotos);
    persistWorkspaceChanges(
      { galleryPhotos: nextPhotos },
      isAr ? 'تم حذف الصورة من المعرض' : 'Photo removed from gallery'
    );
  };

  // Feed Post Composer Openers
  const openCreatePostModal = () => {
    setEditingPost(null);
    setPostTitleAr('برنامج الفراعنة وكروز النيل الملكي (٧ أيام)');
    setPostTitleEn('7-Day Royal Pharaohs & Private Nile Cruise');
    setPostCaptionAr('استمتع برحلة استثنائية تجمع بين عظمة أهرامات الجيزة والإبحار الفاخر بين الأقصر وأسوان مع مرشد أثري خاص وانتقالات VIP متكاملة.');
    setPostCaptionEn('Experience an unforgettable journey combining private sunrise access at the Giza Pyramids with a luxury Nile cruise between Luxor and Aswan.');
    setPostLocationAr('القاهرة، الأقصر وأسوان');
    setPostLocationEn('Cairo, Luxor & Aswan');
    setPostPriceUsd(1650);
    setPostDurationDays(7);
    setPostImages([
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=85',
    ]);
    setPostTagsInput('#LuxuryEgypt #NileCruise #PyramidsVIP #Rihal');
    setPostHighlightsArInput('فنادق ٥ نجوم فاخرة, كروز نيلية خاصة, طيران داخلي مشمول, مرشد أثري مرافق');
    setPostHighlightsEnInput('5-Star Luxury Hotels, Private Nile Cruise, Domestic Flights, Private Egyptologist');
    setPostModalOpen(true);
  };

  const openEditPostModal = (post: TravelerFeedPost) => {
    setEditingPost(post);
    setPostTitleAr(post.titleAr);
    setPostTitleEn(post.titleEn);
    setPostCaptionAr(post.captionAr);
    setPostCaptionEn(post.captionEn);
    setPostLocationAr(post.locationAr);
    setPostLocationEn(post.locationEn);
    setPostPriceUsd(post.priceUsd);
    setPostDurationDays(post.durationDays);
    setPostImages(post.images && post.images.length > 0 ? post.images : []);
    setPostTagsInput((post.tags || []).join(' '));
    setPostHighlightsArInput((post.highlightsAr || []).join(', '));
    setPostHighlightsEnInput((post.highlightsEn || []).join(', '));
    setPostModalOpen(true);
  };

  const handlePostImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setPostImages(prev => [...prev, ev.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanImages = postImages.filter(Boolean);
    if (cleanImages.length === 0) {
      cleanImages.push(coverImageUrl);
    }

    const parsedTags = postTagsInput
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    const parsedHighlightsAr = postHighlightsArInput
      .split(/[,،]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const parsedHighlightsEn = postHighlightsEnInput
      .split(/[,،]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const newPost: TravelerFeedPost = {
      id: editingPost ? editingPost.id : `custom_post_${Date.now()}`,
      agencyId: workspace.id,
      agencyName: name.trim() || workspace.name,
      agencyArabicName: arabicName.trim() || name.trim(),
      agencyAvatar: logoUrl,
      agencyRating: workspace.rating || 4.97,
      agencyReviewsCount: workspace.reviewCount || 184,
      whatsappNumber: whatsappNumber || contactPhone || '+201000000000',
      locationEn: postLocationEn.trim() || 'Cairo & Luxor, Egypt',
      locationAr: postLocationAr.trim() || 'القاهرة والأقصر، مصر',
      images: cleanImages,
      titleEn: postTitleEn.trim() || postTitleAr.trim() || 'Signature Egypt Expedition',
      titleAr: postTitleAr.trim() || postTitleEn.trim() || 'رحلة مصرية استثنائية',
      captionEn: postCaptionEn.trim() || postCaptionAr.trim(),
      captionAr: postCaptionAr.trim() || postCaptionEn.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['#EgyptTravel', '#LuxuryTour'],
      priceUsd: Number(postPriceUsd) || 1200,
      durationDays: Number(postDurationDays) || 5,
      likesCount: editingPost ? editingPost.likesCount : 128,
      savesCount: editingPost ? editingPost.savesCount : 45,
      postedTimeAgoEn: editingPost ? editingPost.postedTimeAgoEn : 'Just now',
      postedTimeAgoAr: editingPost ? editingPost.postedTimeAgoAr : 'الآن',
      highlightsEn: parsedHighlightsEn.length > 0 ? parsedHighlightsEn : ['5-Star Stays', 'Private Guide'],
      highlightsAr: parsedHighlightsAr.length > 0 ? parsedHighlightsAr : ['فنادق ٥ نجوم', 'مرشد خاص'],
    };

    saveCustomFeedPost(newPost);
    setFeedPosts(getAllFeedPosts());
    setPostModalOpen(false);
    triggerToast(
      editingPost
        ? (isAr ? 'تم تحديث المنشور بنجاح' : 'Post updated successfully')
        : (isAr ? 'تم نشر البوست في صفحة الشركة وبوابة المسافرين' : 'Post published to company profile & traveler feed')
    );
  };

  const handleDeletePost = (postId: string) => {
    deleteCustomFeedPost(postId);
    setFeedPosts(getAllFeedPosts());
    triggerToast(isAr ? 'تم حذف المنشور' : 'Post removed');
  };

  const filteredGallery = useMemo(() => {
    if (galleryCategoryFilter === 'all') return galleryPhotos;
    return galleryPhotos.filter(p => p.category === galleryCategoryFilter);
  }, [galleryPhotos, galleryCategoryFilter]);

  const toggleDestination = (dest: string) => {
    setCoveredDestinations(prev =>
      prev.includes(dest) ? prev.filter(d => d !== dest) : [...prev, dest]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSupportedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="space-y-6 pb-16" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hidden File Inputs for Instant Uploads */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFileUpload}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoFileUpload}
        className="hidden"
      />

      {/* Floating Toast Confirmation */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#44200F] text-[#FAF7F2] border border-[#C4A177]/50 shadow-xl flex items-center gap-2.5 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          1. SOCIAL MEDIA STYLE INTERACTIVE PROFILE HEADER (COVER + AVATAR + BIO + STATS)
         ========================================================================= */}
      <div className="bg-white rounded-3xl overflow-hidden border border-[#EDE0CC] shadow-sm">
        {/* Interactive Cover Banner */}
        <div className="relative h-52 sm:h-68 md:h-76 bg-[#44200F] group overflow-hidden">
          <img
            src={coverImageUrl}
            alt={isAr ? arabicName : name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30 pointer-events-none" />

          {/* Top Right / Left Cover Edit Controls */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 z-10">
            <span className="px-3 py-1.5 rounded-xl bg-black/55 backdrop-blur-md text-[#FAF7F2] border border-white/15 text-[11px] font-bold inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'استوديو حساب الشركة الاجتماعي' : 'Company Social Profile Studio'}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="h-9 px-3.5 rounded-xl bg-white/95 hover:bg-white text-[#44200F] text-xs font-bold shadow-md transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-[#795037]" />
                <span>{isAr ? 'رفع صورة غلاف' : 'Upload Cover'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCoverPresets(prev => !prev)}
                className="h-9 px-3.5 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 text-xs font-bold backdrop-blur-md transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{isAr ? 'خلفيات جاهزة' : 'Cover Presets'}</span>
              </button>
            </div>
          </div>

          {/* Cover Presets Strip Drawer */}
          <AnimatePresence>
            {showCoverPresets && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-16 inset-x-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#EDE0CC] shadow-xl flex items-center gap-3 overflow-x-auto"
              >
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => {
                      setCoverImageUrl(preset.url);
                      setShowCoverPresets(false);
                      persistWorkspaceChanges({ coverImageUrl: preset.url }, isAr ? 'تم تغيير صورة الغلاف' : 'Cover updated');
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border transition shrink-0 cursor-pointer ${
                      coverImageUrl === preset.url
                        ? 'border-[#44200F] bg-[#FAF7F2]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <img src={preset.url} alt={preset.labelEn} className="w-14 h-9 rounded-lg object-cover" />
                    <span className="text-xs font-bold text-[#44200F] pe-2 whitespace-nowrap">
                      {isAr ? preset.labelAr : preset.labelEn}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCoverPresets(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 ms-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Overlay Headline inside Cover */}
          <div className="absolute bottom-4 inset-x-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
            <div className="flex items-center gap-4">
              {/* Interactive Avatar with Camera Upload Badge */}
              <div className="relative group/avatar shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C] shadow-xl">
                  <img
                    src={logoUrl}
                    alt={name}
                    className="w-full h-full object-cover rounded-[13px] bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#C4A177] border-2 border-white shadow-md flex items-center justify-center transition cursor-pointer"
                  title={isAr ? 'تغيير صورة الحساب / الشعار' : 'Change Profile Photo'}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="text-white space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                    {isAr ? arabicName || name : name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isAr ? 'حساب شركة معتمد' : 'Verified DMC'}</span>
                  </span>
                </div>
                <p className="text-xs text-white/85 font-medium flex items-center gap-2 flex-wrap">
                  <span>@{workspace.slug || 'rihal.egypt'}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>{address}</span>
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Action Buttons on Cover */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setEditingStory(null);
                  setStoryEditorOpen(true);
                }}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#E1306C] hover:opacity-95 text-white text-xs font-extrabold shadow-md transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة ستوري جديدة' : 'Add Story'}</span>
              </button>

              <button
                type="button"
                onClick={openCreatePostModal}
                className="h-9 px-4 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] border border-[#C4A177]/40 text-xs font-extrabold shadow-md transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4 text-[#C4A177]" />
                <span>{isAr ? 'نشر بوست / رحلة' : 'New Post'}</span>
              </button>

              {onOpenPublicShowcase && (
                <button
                  type="button"
                  onClick={onOpenPublicShowcase}
                  className="h-9 px-3.5 rounded-xl bg-white/95 hover:bg-white text-[#44200F] text-xs font-bold shadow-md transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Eye className="w-3.5 h-3.5 text-[#795037]" />
                  <span>{isAr ? 'معاينة كزائر' : 'View Public Page'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Social Bio, Stats & Story Highlights Row */}
        <div className="p-5 sm:p-6 bg-white space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Bio Text & Quick Edit Link */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#795037]">
                  {isAr ? 'النبذة التعريفية (Bio)' : 'Company Bio'}
                </span>
                <button
                  type="button"
                  onClick={() => setStudioTab('bio')}
                  className="text-xs font-bold text-[#44200F] hover:text-[#795037] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#C4A177]" />
                  <span>{isAr ? 'تعديل النبذة والبيانات' : 'Edit Bio & Info'}</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[#1E1B18] leading-relaxed">
                {isAr ? descriptionAr || description : description || descriptionAr}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#795037]">
                <span className="inline-flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-[#C4A177]" />
                  <span>{whatsappNumber}</span>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#C4A177]" />
                  <span>{contactEmail}</span>
                </span>
                <span>·</span>
                <span>{isAr ? `تأسست ${foundedYear}` : `Est. ${foundedYear}`}</span>
              </div>
            </div>

            {/* Operational & Social Metrics Strip (4 Equal Boxes) */}
            <div className="lg:col-span-5 grid grid-cols-4 gap-2.5 items-stretch">
              <div
                onClick={() => setStudioTab('bio')}
                className="bg-[#FAF7F2] hover:bg-[#EDE0CC]/50 p-3 rounded-2xl border border-[#EDE0CC] text-center cursor-pointer transition flex flex-col justify-center"
              >
                <span className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums">
                  {liveOperationalCounts.expeditions}
                </span>
                <span className="text-[11px] font-bold text-[#795037] mt-0.5 whitespace-nowrap">
                  {isAr ? 'رحلة وبعثة' : 'Expeditions'}
                </span>
              </div>

              <div
                onClick={() => setStudioTab('bio')}
                className="bg-[#FAF7F2] hover:bg-[#EDE0CC]/50 p-3 rounded-2xl border border-[#EDE0CC] text-center cursor-pointer transition flex flex-col justify-center"
              >
                <span className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums">
                  {liveOperationalCounts.travelers}
                </span>
                <span className="text-[11px] font-bold text-[#795037] mt-0.5 whitespace-nowrap">
                  {isAr ? 'مسافر' : 'Travelers'}
                </span>
              </div>

              <div
                onClick={() => setStudioTab('bio')}
                className="bg-[#FAF7F2] hover:bg-[#EDE0CC]/50 p-3 rounded-2xl border border-[#EDE0CC] text-center cursor-pointer transition flex flex-col justify-center"
              >
                <span className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums">
                  {guideRosterCount}
                </span>
                <span className="text-[11px] font-bold text-[#795037] mt-0.5 whitespace-nowrap">
                  {isAr ? 'مرشد أثري' : 'Guides'}
                </span>
              </div>

              <div
                onClick={() => setStudioTab('bio')}
                className="bg-[#FAF7F2] hover:bg-[#EDE0CC]/50 p-3 rounded-2xl border border-[#EDE0CC] text-center cursor-pointer transition flex flex-col justify-center"
              >
                <span className="text-lg sm:text-xl font-black text-[#44200F] font-mono tabular-nums">
                  {fleetCount}
                </span>
                <span className="text-[11px] font-bold text-[#795037] mt-0.5 whitespace-nowrap">
                  {isAr ? 'مركبة أسطول' : 'Fleet'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Story Highlights Bar right inside the Profile Header */}
          <div className="pt-4 border-t border-[#EDE0CC]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-extrabold text-[#44200F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C4A177]" />
                <span>{isAr ? 'الستوري النشطة وأبرز اللحظات (Story Highlights)' : 'Active Stories & Highlights'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingStory(null);
                  setStoryEditorOpen(true);
                }}
                className="text-xs font-bold text-[#EA580C] hover:underline cursor-pointer"
              >
                {isAr ? '+ إنشاء ستوري جديدة' : '+ Create New Story'}
              </button>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto py-1 scrollbar-none">
              {/* Add Story Circle */}
              <button
                type="button"
                onClick={() => {
                  setEditingStory(null);
                  setStoryEditorOpen(true);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#C4A177] bg-[#FAF7F2] group-hover:bg-[#EDE0CC]/60 flex items-center justify-center transition">
                  <div className="w-8 h-8 rounded-full bg-[#44200F] text-[#C4A177] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#44200F] whitespace-nowrap">
                  {isAr ? 'ستوري جديدة' : 'New Story'}
                </span>
              </button>

              {/* Existing Stories Circles */}
              {stories.map((st) => (
                <div key={st.id} className="flex flex-col items-center gap-1.5 shrink-0 group relative">
                  <button
                    type="button"
                    onClick={() => setPlayingStory(st)}
                    className="w-16 h-16 p-[2.5px] rounded-full bg-gradient-to-tr from-[#EA580C] via-[#C4A177] to-[#E1306C] flex items-center justify-center shadow-xs group-hover:scale-105 transition cursor-pointer"
                  >
                    <div className="w-full h-full p-[2px] bg-white rounded-full overflow-hidden">
                      <img
                        src={st.coverImage}
                        alt={isAr ? st.destinationAr : st.destinationEn}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </button>
                  <span className="text-[11px] font-bold text-[#44200F] max-w-[74px] truncate">
                    {isAr ? st.destinationAr : st.destinationEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Studio Navigation Tabs (Instagram/Social Profile Style) */}
        <div className="border-t border-[#EDE0CC] bg-[#FAF7F2] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { id: 'feed', icon: LayoutGrid, labelAr: 'المنشورات والرحلات (Feed)', labelEn: 'Social Feed & Posts', count: feedPosts.length },
              { id: 'stories', icon: Sparkles, labelAr: 'استوديو الستوري (Stories)', labelEn: 'Stories Studio', count: stories.length },
              { id: 'gallery', icon: ImageIcon, labelAr: 'ألبوم صور الشركة (Gallery)', labelEn: 'Photo Gallery', count: galleryPhotos.length },
              { id: 'bio', icon: Edit3, labelAr: 'تعديل البيانات والنبذة (Bio)', labelEn: 'Edit Bio & Details' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = studioTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStudioTab(tab.id as any)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs'
                      : 'bg-white text-[#795037] hover:text-[#44200F] border border-[#EDE0CC]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#C4A177]' : 'text-[#795037]'}`} />
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      isActive ? 'bg-[#C4A177] text-[#44200F] font-black' : 'bg-[#FAF7F2] text-[#795037]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: SOCIAL FEED & POSTS MANAGER (CREATE, EDIT, DELETE POSTS)
         ========================================================================= */}
      {studioTab === 'feed' && (
        <div className="space-y-5">
          {/* Quick Post Composer Bar (Like Facebook/Instagram "What's on your mind?") */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EDE0CC] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <img
                src={logoUrl}
                alt={name}
                className="w-11 h-11 rounded-2xl object-cover border border-[#EDE0CC] shrink-0"
              />
              <button
                type="button"
                onClick={openCreatePostModal}
                className="flex-1 h-11 px-4 rounded-2xl bg-[#FAF7F2] hover:bg-[#EDE0CC]/50 border border-[#EDE0CC] text-start text-xs font-semibold text-[#795037] transition cursor-pointer flex items-center justify-between"
              >
                <span>
                  {isAr
                    ? 'انشر برنامجاً سياحياً جديداً، صوراً ميدانية، أو عرضاً خاصاً للمسافرين...'
                    : 'Share a new tour itinerary, field photos, or special package offer...'}
                </span>
                <Camera className="w-4 h-4 text-[#C4A177] shrink-0" />
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openCreatePostModal}
                className="h-10 px-4 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#C4A177]" />
                <span>{isAr ? 'إنشاء منشور جديد' : 'Create Post'}</span>
              </button>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {feedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-[#EDE0CC] overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between h-full group"
              >
                <div>
                  {/* Post Author Header */}
                  <div className="p-4 flex items-center justify-between gap-2 border-b border-[#EDE0CC]/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={post.agencyAvatar || logoUrl}
                        alt={post.agencyName}
                        className="w-9 h-9 rounded-xl object-cover border border-[#EDE0CC] shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-[#44200F] truncate">
                          {isAr ? post.agencyArabicName : post.agencyName}
                        </h4>
                        <span className="text-[11px] text-[#795037] flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#C4A177] shrink-0" />
                          <span className="truncate">{isAr ? post.locationAr : post.locationEn}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditPostModal(post)}
                        className="h-8 px-2.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        title={isAr ? 'تعديل المنشور' : 'Edit Post'}
                      >
                        <Edit3 className="w-3 h-3 text-[#795037]" />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>
                      {post.id.startsWith('custom_post_') && (
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Image */}
                  <div className="h-52 bg-[#44200F] relative overflow-hidden">
                    <img
                      src={post.images[0]}
                      alt={isAr ? post.titleAr : post.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {post.images.length > 1 && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                        1 / {post.images.length} {isAr ? 'صور' : 'Photos'}
                      </span>
                    )}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-white text-[11px] font-bold">
                        {post.durationDays} {isAr ? 'أيام' : 'Days'}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-[#44200F] text-[#FAF7F2] border border-[#C4A177]/50 text-xs font-black font-mono">
                        ${post.priceUsd.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Post Caption & Details */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="text-sm font-extrabold text-[#44200F] line-clamp-1">
                      {isAr ? post.titleAr : post.titleEn}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 h-9">
                      {isAr ? post.captionAr : post.captionEn}
                    </p>

                    {/* Highlights */}
                    <div className="pt-1 flex flex-wrap gap-1.5 text-[11px] text-[#795037]">
                      {(isAr ? post.highlightsAr : post.highlightsEn).slice(0, 3).map((hl, i) => (
                        <span key={i} className="inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{hl}</span>
                          {i < 2 && <span className="mx-0.5 text-[#EDE0CC]">·</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Post Footer Metrics */}
                <div className="px-4 py-3 bg-[#FAF7F2] border-t border-[#EDE0CC] flex items-center justify-between text-xs text-[#795037]">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>{post.likesCount}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5 text-[#C4A177] fill-[#C4A177]" />
                      <span>{post.savesCount}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditPostModal(post)}
                    className="text-xs font-bold text-[#44200F] hover:underline cursor-pointer"
                  >
                    {isAr ? 'تعديل الصور والنص ←' : 'Edit Post & Photos →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: STORIES STUDIO (CREATE, PREVIEW, EDIT & DELETE 9:16 STORIES)
         ========================================================================= */}
      {studioTab === 'stories' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-[#EDE0CC] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-[#44200F] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C4A177]" />
                <span>{isAr ? 'استوديو القصص المصورة والفيديو (Stories 9:16)' : 'Company Stories & Highlights Studio'}</span>
              </h3>
              <p className="text-xs text-[#795037] mt-0.5">
                {isAr
                  ? 'انشر ستوري يومية للرحلات مع نصوص مخصصة وزر حجز مباشر عبر واتساب يظهر لجميع المسافرين.'
                  : 'Create vertical 9:16 photo or video stories with custom typography overlays and direct WhatsApp booking CTAs.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingStory(null);
                setStoryEditorOpen(true);
              }}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#E1306C] hover:opacity-95 text-white text-xs font-extrabold transition inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تصميم ونشر ستوري جديدة' : 'Create New Story'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-stretch">
            {/* Add New Story Card */}
            <button
              type="button"
              onClick={() => {
                setEditingStory(null);
                setStoryEditorOpen(true);
              }}
              className="min-h-[340px] rounded-3xl border-2 border-dashed border-[#C4A177] bg-[#FAF7F2]/70 hover:bg-[#FAF7F2] p-6 flex flex-col items-center justify-center text-center gap-3 transition cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#44200F] text-[#C4A177] flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#44200F]">
                  {isAr ? 'إضافة ستوري جديدة' : 'Add New Story'}
                </h4>
                <p className="text-xs text-[#795037] mt-1 leading-relaxed">
                  {isAr
                    ? 'ارفع صورة أو فيديو قصير وأضف عنواناً وسعراً وزر تواصل واتساب'
                    : 'Upload a photo or short video clip with overlay text and price'}
                </p>
              </div>
            </button>

            {stories.map((story) => {
              const firstSlide = story.slides[0];
              return (
                <div
                  key={story.id}
                  className="bg-white rounded-3xl border border-[#EDE0CC] overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  {/* 9:16 Story Preview Card */}
                  <div
                    onClick={() => setPlayingStory(story)}
                    className="relative h-64 bg-slate-900 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={story.coverImage}
                      alt={isAr ? story.destinationAr : story.destinationEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/50" />

                    {/* Top Badge */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between text-white">
                      <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-[10px] font-bold border border-white/15">
                        {isAr ? story.destinationAr : story.destinationEn}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </span>
                    </div>

                    {/* Bottom Slide Headline */}
                    {firstSlide && (
                      <div className="absolute bottom-3 inset-x-3 text-white space-y-1">
                        {firstSlide.packagePriceUsd && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-[#EA580C] text-white text-[10px] font-black font-mono">
                            ${firstSlide.packagePriceUsd.toLocaleString()}
                          </span>
                        )}
                        <h4 className="font-bold text-xs leading-snug line-clamp-2">
                          {isAr ? firstSlide.titleAr : firstSlide.titleEn}
                        </h4>
                      </div>
                    )}
                  </div>

                  {/* Story Card Controls */}
                  <div className="p-3.5 bg-white flex items-center justify-between gap-2 border-t border-[#EDE0CC]">
                    <button
                      type="button"
                      onClick={() => setPlayingStory(story)}
                      className="h-9 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#795037]" />
                      <span>{isAr ? 'تشغيل' : 'Preview'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStory(story);
                          setStoryEditorOpen(true);
                        }}
                        className="h-9 px-3 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#C4A177]" />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>

                      {story.isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            deleteCustomStory(story.id);
                            setStories(getAllStories());
                            triggerToast(isAr ? 'تم حذف الستوري' : 'Story deleted');
                          }}
                          className="h-9 w-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                          title={isAr ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: COMPANY PHOTO GALLERY (UPLOAD, EDIT CAPTIONS & CATEGORIES)
         ========================================================================= */}
      {studioTab === 'gallery' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-[#EDE0CC] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-[#44200F] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C4A177]" />
                <span>{isAr ? 'ألبوم ومعرض صور الشركة الميداني' : 'Company Media & Field Photo Gallery'}</span>
              </h3>
              <p className="text-xs text-[#795037] mt-0.5">
                {isAr
                  ? 'ارفع وعدّل صور الرحلات، أسطول السيارات، الفنادق، ومقر الشركة لتظهر للمسافرين في صفحتك العامة.'
                  : 'Upload and curate photos of your tours, VIP fleet, partner hotels, and offices.'}
              </p>
            </div>

            <button
              type="button"
              onClick={openAddPhotoModal}
              className="h-10 px-5 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] text-xs font-extrabold transition inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
            >
              <Upload className="w-4 h-4 text-[#C4A177]" />
              <span>{isAr ? 'رفع وإضافة صورة جديدة' : 'Upload New Photo'}</span>
            </button>
          </div>

          {/* Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', labelAr: 'كل الصور', labelEn: 'All Photos' },
              { id: 'tours', labelAr: 'الرحلات والمزارات', labelEn: 'Tours & Monuments' },
              { id: 'fleet', labelAr: 'أسطول النقل السياحي', labelEn: 'Transport Fleet' },
              { id: 'hotels', labelAr: 'الفنادق والدهبيات', labelEn: 'Hotels & Cruises' },
              { id: 'office', labelAr: 'المقر وفريق العمل', labelEn: 'Office & Team' },
            ].map((cat) => {
              const isSelected = galleryCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setGalleryCategoryFilter(cat.id as any)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center justify-center whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#44200F] text-[#FAF7F2] shadow-2xs'
                      : 'bg-white text-[#795037] hover:text-[#44200F] border border-[#EDE0CC]'
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              );
            })}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {filteredGallery.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-3xl border border-[#EDE0CC] overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="h-52 bg-[#44200F] relative overflow-hidden">
                    <img
                      src={photo.url}
                      alt={isAr ? photo.captionAr || photo.caption : photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                      {photo.category === 'tours'
                        ? isAr ? 'رحلات' : 'Tours'
                        : photo.category === 'fleet'
                        ? isAr ? 'الأسطول' : 'Fleet'
                        : photo.category === 'hotels'
                        ? isAr ? 'فنادق وكروز' : 'Hotels'
                        : isAr ? 'المقر' : 'Office'}
                    </span>
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-bold text-[#44200F] leading-snug line-clamp-2 h-9">
                      {isAr ? photo.captionAr || photo.caption : photo.caption}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 bg-[#FAF7F2] border-t border-[#EDE0CC] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditPhotoModal(photo)}
                    className="h-8 px-3 rounded-xl bg-white hover:bg-[#EDE0CC] text-[#44200F] border border-[#EDE0CC] text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#795037]" />
                    <span>{isAr ? 'تعديل الصورة والوصف' : 'Edit Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryPhoto(photo.id)}
                    className="h-8 w-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                    title={isAr ? 'حذف الصورة' : 'Delete Photo'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BIO, IDENTITY & OPERATIONAL CAPABILITIES EDITOR
         ========================================================================= */}
      {studioTab === 'bio' && (
        <form
          onSubmit={handleSaveIdentityForm}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE0CC] shadow-2xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDE0CC]">
            <div>
              <h3 className="text-base font-extrabold text-[#44200F]">
                {isAr ? 'بيانات الحساب والنبذة التعريفية للشركة' : 'Company Bio, Identity & Contact Channels'}
              </h3>
              <p className="text-xs text-[#795037] mt-0.5">
                {isAr
                  ? 'كل ما تكتبه هنا ينعكس فوراً في بروفايل الشركة العام وعروض الأسعار وبوابة المسافرين.'
                  : 'All details saved here immediately update your public showcase, proposals, and traveler feed.'}
              </p>
            </div>

            <button
              type="submit"
              className="h-10 px-6 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] text-xs font-extrabold transition inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C4A177]" />
              <span>{isAr ? 'حفظ كافة التعديلات' : 'Save Profile Changes'}</span>
            </button>
          </div>

          {/* Names & Contacts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'اسم الشركة (بالعربية)' : 'Company Name (Arabic)'}
              </label>
              <input
                type="text"
                value={arabicName}
                onChange={(e) => setArabicName(e.target.value)}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'اسم الشركة (English)' : 'Company Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'رقم واتساب الحجوزات المباشر' : 'Direct WhatsApp Number'}
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'هاتف الطوارئ والعمليات' : 'Operations Phone'}
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'البريد الإلكتروني الرسمي' : 'Official Contact Email'} *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'العنوان والمقر الرئيسي' : 'Headquarters Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177]"
              />
            </div>
          </div>

          {/* Bilingual Bio Textareas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'النبذة التعريفية بالعربية (Bio)' : 'Company Bio (Arabic)'}
              </label>
              <textarea
                rows={4}
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                className="w-full p-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177] leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'النبذة التعريفية بالإنجليزية (Bio EN)' : 'Company Bio (English)'}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A177] leading-relaxed"
              />
            </div>
          </div>

          {/* Operational Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'سنة التأسيس' : 'Founded Year'}
              </label>
              <input
                type="number"
                value={foundedYear}
                onChange={(e) => setFoundedYear(Number(e.target.value))}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'عدد المرشدين المعتمدين' : 'Licensed Guides Count'}
              </label>
              <input
                type="number"
                value={guideRosterCount}
                onChange={(e) => setGuideRosterCount(Number(e.target.value))}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-[#44200F] mb-1.5">
                {isAr ? 'حجم أسطول المركبات' : 'Fleet Vehicles Count'}
              </label>
              <input
                type="number"
                value={fleetCount}
                onChange={(e) => setFleetCount(Number(e.target.value))}
                className="w-full h-10 px-3.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Covered Destinations Multi-Select */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-[#44200F]">
              {isAr ? 'المحافظات والوجهات السياحية المغطاة' : 'Covered Destinations & Regions'}
            </label>
            <div className="flex flex-wrap gap-2">
              {GOVERNORATE_OPTIONS.map((dest) => {
                const active = coveredDestinations.includes(dest);
                return (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => toggleDestination(dest)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-[#44200F] text-[#FAF7F2]'
                        : 'bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC] hover:bg-[#EDE0CC]'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${active ? 'text-[#C4A177]' : 'text-[#795037]'}`} />
                    <span>{dest}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Supported Guide Languages Multi-Select */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-[#44200F]">
              {isAr ? 'لغات الإرشاد السياحي المتوفرة' : 'Supported Tour Guide Languages'}
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const active = supportedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? 'bg-[#44200F] text-[#FAF7F2]'
                        : 'bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC] hover:bg-[#EDE0CC]'
                    }`}
                  >
                    <Globe className={`w-3.5 h-3.5 ${active ? 'text-[#C4A177]' : 'text-[#795037]'}`} />
                    <span>{lang}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#EDE0CC] flex justify-end">
            <button
              type="submit"
              className="h-10 px-6 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] text-xs font-extrabold transition inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C4A177]" />
              <span>{isAr ? 'حفظ وتحديث البروفايل' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          MODAL 1: CREATE / EDIT SOCIAL FEED POST
         ========================================================================= */}
      {postModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 border border-[#EDE0CC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
              <div>
                <h3 className="font-extrabold text-base text-[#44200F]">
                  {editingPost
                    ? isAr ? 'تعديل المنشور والصور' : 'Edit Social Feed Post'
                    : isAr ? 'نشر بوست / برنامج سياحي جديد' : 'Create New Social Feed Post'}
                </h3>
                <p className="text-xs text-[#795037]">
                  {isAr
                    ? 'يظهر هذا المنشور في صفحة حساب الشركة وفي صفحة استكشاف المسافرين'
                    : 'Appears on your company profile grid and the main traveler feed'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPostModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 text-xs">
              {/* Post Photos Manager */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#44200F]">
                    {isAr ? 'صور المنشور (يمكنك رفع أكثر من صورة)' : 'Post Photos (Multi-photo carousel)'}
                  </label>
                  <input
                    ref={postImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePostImageFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => postImageInputRef.current?.click()}
                    className="h-8 px-3 rounded-xl bg-[#44200F] text-[#FAF7F2] text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>{isAr ? 'رفع صورة من جهازك' : 'Upload Photo'}</span>
                  </button>
                </div>

                {/* Thumbnails Row */}
                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                  {postImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-24 h-20 rounded-xl overflow-hidden border border-[#EDE0CC] shrink-0 group">
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPostImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-90 hover:bg-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Image by URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={postNewImageUrl}
                    onChange={(e) => setPostNewImageUrl(e.target.value)}
                    placeholder={isAr ? 'أو الصق رابط صورة مباشر https://...' : 'Or paste image URL https://...'}
                    className="flex-1 h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (postNewImageUrl.trim()) {
                        setPostImages(prev => [...prev, postNewImageUrl.trim()]);
                        setPostNewImageUrl('');
                      }
                    }}
                    className="h-9 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] border border-[#EDE0CC] font-bold cursor-pointer"
                  >
                    {isAr ? 'إضافة الرابط' : 'Add URL'}
                  </button>
                </div>
              </div>

              {/* Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'عنوان المنشور / البرنامج (عربي)' : 'Post Title (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={postTitleAr}
                    onChange={(e) => setPostTitleAr(e.target.value)}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'عنوان المنشور (English)' : 'Post Title (English)'}
                  </label>
                  <input
                    type="text"
                    value={postTitleEn}
                    onChange={(e) => setPostTitleEn(e.target.value)}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                  />
                </div>
              </div>

              {/* Captions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'وصف المنشور والتفاصيل (عربي)' : 'Caption (Arabic)'}
                  </label>
                  <textarea
                    rows={3}
                    value={postCaptionAr}
                    onChange={(e) => setPostCaptionAr(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'وصف المنشور (English)' : 'Caption (English)'}
                  </label>
                  <textarea
                    rows={3}
                    value={postCaptionEn}
                    onChange={(e) => setPostCaptionEn(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                  />
                </div>
              </div>

              {/* Price, Duration & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'السعر للفرد ($)' : 'Price (USD)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={postPriceUsd}
                    onChange={(e) => setPostPriceUsd(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'المدة (أيام)' : 'Duration (Days)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={postDurationDays}
                    onChange={(e) => setPostDurationDays(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'الموقع (عربي)' : 'Location (AR)'}
                  </label>
                  <input
                    type="text"
                    value={postLocationAr}
                    onChange={(e) => setPostLocationAr(e.target.value)}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'الموقع (EN)' : 'Location (EN)'}
                  </label>
                  <input
                    type="text"
                    value={postLocationEn}
                    onChange={(e) => setPostLocationEn(e.target.value)}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                  />
                </div>
              </div>

              {/* Highlights & Hashtags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'مميزات الرحلة (افصل بفاصلة)' : 'Highlights (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={isAr ? postHighlightsArInput : postHighlightsEnInput}
                    onChange={(e) => {
                      if (isAr) setPostHighlightsArInput(e.target.value);
                      else setPostHighlightsEnInput(e.target.value);
                    }}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'الهاشتاجات (Tags)' : 'Hashtags'}
                  </label>
                  <input
                    type="text"
                    value={postTagsInput}
                    onChange={(e) => setPostTagsInput(e.target.value)}
                    className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#EDE0CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-[#EDE0CC] text-[#795037] hover:bg-[#FAF7F2] font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-xl bg-[#44200F] hover:bg-[#321609] text-[#FAF7F2] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#C4A177]" />
                  <span>{editingPost ? (isAr ? 'حفظ التعديلات' : 'Save Post') : (isAr ? 'نشر الآن' : 'Publish Post')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: UPLOAD / EDIT GALLERY PHOTO
         ========================================================================= */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#EDE0CC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
              <h3 className="font-extrabold text-base text-[#44200F]">
                {editingPhoto
                  ? isAr ? 'تعديل الصورة والوصف' : 'Edit Gallery Photo'
                  : isAr ? 'إضافة صورة جديدة لمعرض الشركة' : 'Add Photo to Company Gallery'}
              </h3>
              <button
                type="button"
                onClick={() => setPhotoModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGalleryPhoto} className="space-y-4 text-xs">
              <input
                ref={photoUploadInputRef}
                type="file"
                accept="image/*"
                onChange={handleGalleryFileUpload}
                className="hidden"
              />

              {photoFormUrl ? (
                <div className="relative h-48 rounded-2xl overflow-hidden bg-[#44200F] border border-[#EDE0CC]">
                  <img src={photoFormUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => photoUploadInputRef.current?.click()}
                    className="absolute bottom-3 right-3 h-8 px-3 rounded-xl bg-black/70 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>{isAr ? 'تغيير الصورة' : 'Replace Image'}</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => photoUploadInputRef.current?.click()}
                  className="border-2 border-dashed border-[#C4A177] bg-[#FAF7F2] hover:bg-[#EDE0CC]/40 rounded-2xl p-6 text-center cursor-pointer space-y-2 transition"
                >
                  <Upload className="w-7 h-7 text-[#795037] mx-auto" />
                  <p className="font-bold text-[#44200F]">
                    {isAr ? 'اضغط لرفع صورة من جهازك' : 'Click to upload a photo from your device'}
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#44200F] mb-1">
                  {isAr ? 'أو رابط الصورة المباشر (URL)' : 'Or Direct Image URL'}
                </label>
                <input
                  type="url"
                  value={photoFormUrl}
                  onChange={(e) => setPhotoFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#44200F] mb-1">
                  {isAr ? 'تصنيف الصورة' : 'Photo Category'}
                </label>
                <select
                  value={photoFormCategory}
                  onChange={(e) => setPhotoFormCategory(e.target.value as any)}
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-bold text-[#44200F]"
                >
                  <option value="tours">{isAr ? 'الرحلات والمزارات السياحية' : 'Tours & Monuments'}</option>
                  <option value="fleet">{isAr ? 'أسطول النقل السياحي' : 'Transport Fleet'}</option>
                  <option value="hotels">{isAr ? 'الفنادق والدهبيات النيلية' : 'Hotels & Nile Cruises'}</option>
                  <option value="office">{isAr ? 'المقر وفريق العمل' : 'Office & Team'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#44200F] mb-1">
                  {isAr ? 'وصف الصورة (عربي)' : 'Caption (Arabic)'}
                </label>
                <input
                  type="text"
                  value={photoFormCaptionAr}
                  onChange={(e) => setPhotoFormCaptionAr(e.target.value)}
                  placeholder={isAr ? 'مثال: جولة خاصة بمعبد فيلة في أسوان...' : 'Arabic caption...'}
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-[#44200F] mb-1">
                  {isAr ? 'وصف الصورة (English)' : 'Caption (English)'}
                </label>
                <input
                  type="text"
                  value={photoFormCaptionEn}
                  onChange={(e) => setPhotoFormCaptionEn(e.target.value)}
                  placeholder="e.g. Private sunrise tour at Philae Island..."
                  className="w-full h-9 px-3 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#EDE0CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-[#EDE0CC] text-[#795037] font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-xl bg-[#44200F] text-[#FAF7F2] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#C4A177]" />
                  <span>{isAr ? 'حفظ الصورة' : 'Save Photo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: 9:16 STORY CREATOR / EDITOR STUDIO
         ========================================================================= */}
      <TravelerStoryEditorModal
        isOpen={storyEditorOpen}
        onClose={() => {
          setStoryEditorOpen(false);
          setEditingStory(null);
        }}
        uiLang={uiLang}
        currentWorkspace={workspace}
        initialStory={editingStory}
        onStoryPublished={() => {
          setStories(getAllStories());
          triggerToast(isAr ? 'تم نشر الستوري بنجاح وتحديث شريط القصص!' : 'Story published to company highlights!');
        }}
      />

      {/* =========================================================================
          MODAL 4: FULL-SCREEN STORY PLAYER PREVIEW
         ========================================================================= */}
      <TravelerStoryModal
        story={playingStory}
        isOpen={Boolean(playingStory)}
        onClose={() => setPlayingStory(null)}
        uiLang={uiLang}
      />
    </div>
  );
};

