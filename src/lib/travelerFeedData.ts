export type StoryTextStyle = 'luxury-gold' | 'neon' | 'editorial' | 'minimal';
export type StoryTextPosition = 'top' | 'center' | 'bottom';
export type StoryMediaType = 'image' | 'video';

export interface StorySlide {
  id: string;
  imageUrl: string;
  mediaType?: StoryMediaType;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  textStyle?: StoryTextStyle;
  textPosition?: StoryTextPosition;
  agencyId: string;
  agencyNameEn: string;
  agencyNameAr: string;
  whatsappNumber: string;
  packagePriceUsd?: number;
  ctaTextEn?: string;
  ctaTextAr?: string;
}

export interface DestinationStory {
  id: string;
  destinationEn: string;
  destinationAr: string;
  coverImage: string;
  agencyId: string;
  agencyNameEn: string;
  agencyNameAr: string;
  agencyAvatar: string;
  slides: StorySlide[];
  isCustom?: boolean;
  createdAt?: string;
}

export type TravelerStoryCollection = DestinationStory;

const CUSTOM_STORIES_STORAGE_KEY = 'rihal_custom_stories';

export const loadCustomStories = (): DestinationStory[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_STORIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load custom stories from storage:', err);
    return [];
  }
};

export const saveCustomStory = (story: DestinationStory): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadCustomStories();
    const updated = [story, ...existing.filter(s => s.id !== story.id)];
    localStorage.setItem(CUSTOM_STORIES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom story to storage:', err);
  }
};

export const deleteCustomStory = (storyId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadCustomStories();
    const updated = existing.filter(s => s.id !== storyId);
    localStorage.setItem(CUSTOM_STORIES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete custom story:', err);
  }
};

export const getAllStories = (): DestinationStory[] => {
  const custom = loadCustomStories();
  return [...custom, ...DESTINATION_STORIES];
};

export interface TravelerFeedPost {
  id: string;
  agencyId: string;
  agencyName: string;
  agencyArabicName: string;
  agencyAvatar: string;
  agencyRating: number;
  agencyReviewsCount: number;
  whatsappNumber: string;
  locationEn: string;
  locationAr: string;
  images: string[];
  photos?: string[];
  titleEn: string;
  titleAr: string;
  captionEn: string;
  captionAr: string;
  tags: string[];
  hashtags?: string[];
  priceUsd: number;
  durationDays: number;
  durationDaysAr?: string;
  durationDaysEn?: string;
  likesCount: number;
  savesCount: number;
  postedTimeAgoEn: string;
  postedTimeAgoAr: string;
  highlightsEn: string[];
  highlightsAr: string[];
  inclusionsEn?: string[];
  inclusionsAr?: string[];
  city?: string;
  agencyNameEn?: string;
  agencyNameAr?: string;
  isFeatured?: boolean;
}

export type TravelerFeedPostItem = TravelerFeedPost;

const CUSTOM_POSTS_STORAGE_KEY = 'rihal_custom_feed_posts';

export const loadCustomFeedPosts = (): TravelerFeedPost[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_POSTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load custom feed posts from storage:', err);
    return [];
  }
};

export const saveCustomFeedPost = (post: TravelerFeedPost): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadCustomFeedPosts();
    const updated = [post, ...existing.filter(p => p.id !== post.id)];
    localStorage.setItem(CUSTOM_POSTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom feed post to storage:', err);
  }
};

export const deleteCustomFeedPost = (postId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadCustomFeedPosts();
    const updated = existing.filter(p => p.id !== postId);
    localStorage.setItem(CUSTOM_POSTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete custom feed post:', err);
  }
};

export const getAllFeedPosts = (): TravelerFeedPost[] => {
  const custom = loadCustomFeedPosts();
  return [...custom, ...TRAVELER_FEED_POSTS];
};

export const DESTINATION_STORIES: DestinationStory[] = [
  {
    id: 'story-cairo-pyramids',
    destinationEn: 'Giza & Cairo',
    destinationAr: 'القاهرة والجيزة',
    coverImage: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=600&q=80',
    agencyId: 'agency-dalil-egypt',
    agencyNameEn: 'RIHAL Egypt Expeditions',
    agencyNameAr: 'ريحال مصر للرحلات',
    agencyAvatar: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=200&q=80',
    slides: [
      {
        id: 'cai-1',
        imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1080&q=85',
        titleEn: 'Private Sunset at the Great Pyramids',
        titleAr: 'غروب استثنائي عند أهرامات الجيزة',
        subtitleEn: 'Exclusive VIP desert terrace access with licensed Egyptologist guide.',
        subtitleAr: 'دخول خاص للشرفة الصحراوية البانورامية مع مرشد أثري متخصص.',
        agencyId: 'agency-dalil-egypt',
        agencyNameEn: 'RIHAL Egypt Expeditions',
        agencyNameAr: 'ريحال مصر للرحلات',
        whatsappNumber: '+201000000000',
        packagePriceUsd: 1450,
      },
      {
        id: 'cai-2',
        imageUrl: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1080&q=85',
        titleEn: 'Grand Egyptian Museum Private Tour',
        titleAr: 'جولة خاصة في المتحف المصري الكبير',
        subtitleEn: 'Skip the crowds: marvel at the treasures of Tutankhamun with priority access.',
        subtitleAr: 'مسار سريع بدون انتظار لمشاهدة كنوز توت عنخ آمون والبهو العظيم.',
        agencyId: 'agency-dalil-egypt',
        agencyNameEn: 'RIHAL Egypt Expeditions',
        agencyNameAr: 'ريحال مصر للرحلات',
        whatsappNumber: '+201000000000',
        packagePriceUsd: 1850,
      },
    ],
  },
  {
    id: 'story-nile-cruises',
    destinationEn: 'Nile Dahabiyas',
    destinationAr: 'كروزات النيل والدهبيات',
    coverImage: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=600&q=80',
    agencyId: 'agency-nile-crown',
    agencyNameEn: 'Nile Crown Charters',
    agencyNameAr: 'كراون كروز للنيل',
    agencyAvatar: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=200&q=80',
    slides: [
      {
        id: 'nile-1',
        imageUrl: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1080&q=85',
        titleEn: 'Private Dahabiya Sail Between Luxor & Aswan',
        titleAr: 'إبحار خاص بالدهبية الفاخرة بين الأقصر وأسوان',
        subtitleEn: 'Sailing with only 8 cabins, candlelit dinners, and secluded island landings.',
        subtitleAr: 'رحلة حصرية بـ ٨ أجنحة فقط، عشاء على ضوء الشموع، وتوقف في جزر النيل المنعزلة.',
        agencyId: 'agency-nile-crown',
        agencyNameEn: 'Nile Crown Charters',
        agencyNameAr: 'كراون كروز للنيل',
        whatsappNumber: '+201000000000',
        packagePriceUsd: 2600,
      },
      {
        id: 'nile-2',
        imageUrl: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7ee?auto=format&fit=crop&w=1080&q=85',
        titleEn: 'Kom Ombo & Edfu at Dawn',
        titleAr: 'معابد كوم أمبو وإدفو عند الشروق',
        subtitleEn: 'Dock directly at ancient riverside temple gates before daytime heat.',
        subtitleAr: 'رسو مباشر على بوابات المعابد النيلية في الصباح الباكر بأجواء ساحرة.',
        agencyId: 'agency-nile-crown',
        agencyNameEn: 'Nile Crown Charters',
        agencyNameAr: 'كراون كروز للنيل',
        whatsappNumber: '+201000000000',
        packagePriceUsd: 2600,
      },
    ],
  },
  {
    id: 'story-luxor-temples',
    destinationEn: 'Luxor & Thebes',
    destinationAr: 'الأقصر وطيبة',
    coverImage: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80',
    agencyId: 'agency-karnak-heritage',
    agencyNameEn: 'Karnak Heritage Travel',
    agencyNameAr: 'الكرنك للتراث والرحلات',
    agencyAvatar: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=200&q=80',
    slides: [
      {
        id: 'lux-1',
        imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1080&q=85',
        titleEn: 'Hot Air Balloon Over Valley of the Kings',
        titleAr: 'منطاد الأقصر الطائر فوق وادي الملوك',
        subtitleEn: 'Drift at sunrise over Hatshepsut Temple and the Colossi of Memnon.',
        subtitleAr: 'تحليق هادئ مع شروق الشمس فوق معبد حتشبسوت وتمثالي ممنون.',
        agencyId: 'agency-karnak-heritage',
        agencyNameEn: 'Karnak Heritage Travel',
        agencyNameAr: 'الكرنك للتراث والرحلات',
        whatsappNumber: '+201000000000',
        packagePriceUsd: 1100,
      },
    ],
  },
  {
    id: 'story-red-sea',
    destinationEn: 'Red Sea & Dahab',
    destinationAr: 'البحر الأحمر ودهب',
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    agencyId: 'agency-redsea-safari',
    agencyNameEn: 'Red Sea & Sinai Safaris',
    agencyNameAr: 'سفاري البحر الأحمر وسيناء',
    agencyAvatar: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=200&q=80',
    slides: [
      {
        id: 'red-1',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1080&q=85',
        titleEn: 'Blue Hole & Ras Mohammed Coral Reefs',
        titleAr: 'الشعاب المرجانية في رأس محمد والبلوهول',
        subtitleEn: 'World-renowned diving with private marine biologist and yacht tender.',
        subtitleAr: 'غوص احترافي ويخوت خاصة لاستكشاف أشهر محميات البحر الأحمر الطبيعية.',
        agencyId: 'agency-redsea-safari',
        agencyNameEn: 'Red Sea & Sinai Safaris',
        agencyNameAr: 'سفاري البحر الأحمر وسيناء',
        whatsappNumber: '+201000000000',
        packagePriceUsd: 1350,
      },
    ],
  },
  {
    id: 'story-siwa-oasis',
    destinationEn: 'Siwa Oasis',
    destinationAr: 'واحة سيوة',
    coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
    agencyId: 'agency-siwa-eco',
    agencyNameEn: 'Siwa Eco Expeditions',
    agencyNameAr: 'سيوة للاستكشاف البيئي',
    agencyAvatar: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=200&q=80',
    slides: [
      {
        id: 'siwa-1',
        imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=85',
        titleEn: 'Cleopatra Spring & Great Sand Sea',
        titleAr: 'عين كليوباترا وبحر الرمال الأعظم',
        subtitleEn: 'Float in crystal turquoise salt pools and sleep beneath the Milky Way.',
        subtitleAr: 'سباحة في بحيرات الملح الفيروزية ومخيمات بدوية فاخرة تحت نجوم الصحراء.',
        agencyId: 'agency-siwa-eco',
        agencyNameEn: 'Siwa Eco Expeditions',
        agencyNameAr: 'سيوة للاستكشاف البيئي',
        whatsappNumber: '+201000000000',
        packagePriceUsd: 950,
      },
    ],
  },
  {
    id: 'story-abu-simbel',
    destinationEn: 'Abu Simbel & Nubia',
    destinationAr: 'أبو سمبل والنوبة',
    coverImage: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=600&q=80',
    agencyId: 'agency-dalil-egypt',
    agencyNameEn: 'RIHAL Egypt Expeditions',
    agencyNameAr: 'ريحال مصر للرحلات',
    agencyAvatar: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=200&q=80',
    slides: [
      {
        id: 'asw-1',
        imageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1080&q=85',
        titleEn: 'Colossal Temples of Ramesses II',
        titleAr: 'معابد رمسيس الثاني ونفرتاري الشاهقة',
        subtitleEn: 'Private Lake Nasser flight directly to the sun temple gates.',
        subtitleAr: 'طيران خاص مباشر لبحيرة ناصر وزيارة معبد الشمس الأسطوري.',
        agencyId: 'agency-dalil-egypt',
        agencyNameEn: 'RIHAL Egypt Expeditions',
        agencyNameAr: 'ريحال مصر للرحلات',
        whatsappNumber: '+201000000000',
        packagePriceUsd: 1980,
      },
    ],
  },
];

export const TRAVELER_FEED_POSTS: TravelerFeedPost[] = [
  {
    id: 'post-1',
    agencyId: 'agency-dalil-egypt',
    agencyName: 'RIHAL Egypt Expeditions',
    agencyArabicName: 'ريحال مصر للرحلات السياحية',
    agencyAvatar: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=200&q=80',
    agencyRating: 4.97,
    agencyReviewsCount: 184,
    whatsappNumber: '+201000000000',
    locationEn: 'Giza Plateau, Cairo',
    locationAr: 'هضبة الأهرامات، الجيزة',
    images: [
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=85',
    ],
    titleEn: '8-Day Pharaohs & Nile Cruise Deluxe',
    titleAr: 'برنامج الفراعنة وكروز النيل الفاخر (٨ أيام)',
    captionEn: 'Wake up to panoramic views of Khufu from a private suite, board your boutique Nile river yacht in Luxor, and explore the tombs of the Valley of the Kings with private Egyptologists. Includes private Mercedes transfers and priority access.',
    captionAr: 'استيقظ على مشهد الأهرامات البانورامي من جناحك الخاص، ثم ابحر على متن دهبية نيلية راقية بين الأقصر وأسوان مع نخبة من المرشدين الأثريين وسيارات مرسيدس VIP.',
    tags: ['#PyramidsOfGiza', '#NileCruise', '#LuxuryEgypt', '#PrivateTravel', '#Egyptologists'],
    priceUsd: 1850,
    durationDays: 8,
    likesCount: 1248,
    savesCount: 432,
    postedTimeAgoEn: '2 hours ago',
    postedTimeAgoAr: 'منذ ساعتين',
    highlightsEn: ['5-Star Luxury Hotels', 'Private Dahabiya Nile Cruise', 'Domestic Flights Included', '24/7 Operations Concierge'],
    highlightsAr: ['فنادق ٥ نجوم فاخرة', 'كروز نيلية خاصة', 'تذاكر الطيران الداخلي', 'خدمة الكونسيرج ٢٤ ساعة'],
  },
  {
    id: 'post-2',
    agencyId: 'agency-nile-crown',
    agencyName: 'Nile Crown Charters',
    agencyArabicName: 'كراون كروز للنيل والدهبيات',
    agencyAvatar: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=200&q=80',
    agencyRating: 4.95,
    agencyReviewsCount: 98,
    whatsappNumber: '+201000000000',
    locationEn: 'River Nile, Luxor to Aswan',
    locationAr: 'نهر النيل، بين الأقصر وأسوان',
    images: [
      'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1590076215667-875d4ef2d7ee?auto=format&fit=crop&w=1200&q=85',
    ],
    titleEn: '5-Day Private Traditional Dahabiya Sail',
    titleAr: 'إبحار الدهبية الملكية بين الأقصر وأسوان (٥ أيام)',
    captionEn: 'The traditional Egyptian way of sailing the Nile. Pure tranquility with sailcloth unfurled, farm-to-table culinary dinners prepared fresh on board, and stops at remote riverbanks large cruisers can never reach.',
    captionAr: 'الرحلة النيلية الكلاسيكية الأصيلة بشراع هادئ بعيداً عن ضجيج السفن الكبيرة. وجبات طازجة بأيدي طهاة محترفين وزيارات حصرية لمواقع أثرية نائية على ضفاف النيل.',
    tags: ['#Dahabiya', '#NileRiver', '#SlowTravel', '#LuxorToAswan', '#BoutiqueYacht'],
    priceUsd: 2600,
    durationDays: 5,
    likesCount: 894,
    savesCount: 310,
    postedTimeAgoEn: '5 hours ago',
    postedTimeAgoAr: 'منذ ٥ ساعات',
    highlightsEn: ['Max 12 Guests on Board', 'Chef Curated Egyptian Menus', 'Private Temple Access at Sunset', 'Full Crew & Egyptologist'],
    highlightsAr: ['١٢ نزيلاً كحد أقصى', 'قائمة طعام نيلية طازجة', 'زيارات خاصة للمحطات النيلية', 'طاقم ضيافة متكامل'],
  },
  {
    id: 'post-3',
    agencyId: 'agency-karnak-heritage',
    agencyName: 'Karnak Heritage Travel',
    agencyArabicName: 'الكرنك للتراث والرحلات السياحية',
    agencyAvatar: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=200&q=80',
    agencyRating: 4.92,
    agencyReviewsCount: 156,
    whatsappNumber: '+201000000000',
    locationEn: 'Karnak & Luxor Temples',
    locationAr: 'معابد الكرنك والأقصر',
    images: [
      'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=85',
    ],
    titleEn: '4-Day Luxor Antiquities & Sunrise Balloon',
    titleAr: 'آثار الأقصر وشروق المنطاد الطائر (٤ أيام)',
    captionEn: 'Float softly in the morning breeze over the world’s greatest open-air museum. Explore the monumental Hypostyle Hall of Karnak illuminated under starry Egyptian skies, followed by the tombs of King Tut & Nefertari.',
    captionAr: 'حلق في سماء الأقصر مع شروق الشمس وشاهد عظمة طيبة القديمة، ثم تجول في قاعة الأعمدة الكبرى بالكرنك ومقابر وادي الملوك والملكات بمرافقة باحثين أثريين.',
    tags: ['#HotAirBalloon', '#ValleyOfTheKings', '#KarnakTemple', '#AncientEgypt', '#Luxor'],
    priceUsd: 1100,
    durationDays: 4,
    likesCount: 1640,
    savesCount: 521,
    postedTimeAgoEn: '1 day ago',
    postedTimeAgoAr: 'منذ يوم',
    highlightsEn: ['Sunrise Balloon Flight', 'Nefertari Tomb Special Entry', 'Private A/C Chauffeur', 'Luxury Nile-View Hotel'],
    highlightsAr: ['رحلة المنطاد عند الشروق', 'دخول مقبرة نفرتاري الخاصة', 'سيارة وسائق خاص مكيّف', 'فندق مطل على النيل'],
  },
  {
    id: 'post-4',
    agencyId: 'agency-redsea-safari',
    agencyName: 'Red Sea & Sinai Safaris',
    agencyArabicName: 'سفاري البحر الأحمر وسيناء',
    agencyAvatar: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=200&q=80',
    agencyRating: 4.89,
    agencyReviewsCount: 87,
    whatsappNumber: '+201000000000',
    locationEn: 'Hurghada & Ras Mohammed',
    locationAr: 'الغردقة ومحمية رأس محمد',
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85',
    ],
    titleEn: '6-Day Red Sea Coral Dive & Desert Star Camp',
    titleAr: 'غوص البحر الأحمر ومخيم النجوم الصحراوي (٦ أيام)',
    captionEn: 'Crystal turquoise waters meet golden Sinai mountain ridges. Snorkel vibrant coral walls in protected national parks, then venture into desert canyons for Bedouin tea and stargazing around the campfire.',
    captionAr: 'مياه فيروزية تلتقي بجبال سيناء الذهبية. غوص بمحميات رأس محمد وتيران مع رحلات سفاري صحراوية وعشاء بدوي وسهرة فلكية تحت النجوم.',
    tags: ['#RedSea', '#ScubaDiving', '#SinaiDesert', '#RasMohammed', '#Stargazing'],
    priceUsd: 1350,
    durationDays: 6,
    likesCount: 780,
    savesCount: 290,
    postedTimeAgoEn: '2 days ago',
    postedTimeAgoAr: 'منذ يومين',
    highlightsEn: ['PADI Certified Guides', 'Private Yacht Charter', 'Bedouin Stargazing Dinner', 'Beachfront Resort Stay'],
    highlightsAr: ['مرشدين غوص معتمدين', 'يخت بحري خاص', 'عشاء بدوي تحت النجوم', 'منتجع فاخر على الشاطئ'],
  },
  {
    id: 'post-5',
    agencyId: 'agency-siwa-eco',
    agencyName: 'Siwa Eco Expeditions',
    agencyArabicName: 'سيوة للاستكشاف البيئي والمغامرات',
    agencyAvatar: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=200&q=80',
    agencyRating: 4.96,
    agencyReviewsCount: 64,
    whatsappNumber: '+201000000000',
    locationEn: 'Siwa Oasis, Western Desert',
    locationAr: 'واحة سيوة، الصحراء الغربية',
    images: [
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=85',
    ],
    titleEn: '4-Day Siwa Salt Pools & Great Sand Sea 4x4',
    titleAr: 'بحيرات ملح سيوة وبحر الرمال بسيارات الدفع الرباعي (٤ أيام)',
    captionEn: 'The hidden jewel of Egypt’s western frontier. Float weightlessly in hyper-saline sapphire pools, traverse dunes in 4x4 Land Cruisers, and stay in eco-lodges handcrafted with olive wood and salt rock.',
    captionAr: 'جوهرة الصحراء الغربية الساحرة. استرخاء وطفو في بحيرات الملح الفيروزية، تزلج على الرمال، وإقامة في نُزل بيئية مصنوعة من الملح وخشب الزيتون.',
    tags: ['#SiwaOasis', '#SaltLakes', '#GreatSandSea', '#EcoTourism', '#DesertSafari'],
    priceUsd: 950,
    durationDays: 4,
    likesCount: 2150,
    savesCount: 840,
    postedTimeAgoEn: '3 days ago',
    postedTimeAgoAr: 'منذ ٣ أيام',
    highlightsEn: ['Zero-Gravity Salt Springs', 'Dune Bashing & Sandboarding', 'Shali Fortress Exploration', 'Authentic Siwan Cuisine'],
    highlightsAr: ['بحيرات الملح العلاجية', 'سفاري وتزلج على الرمال', 'زيارة قلعة شالي القديمة', 'مأكولات سيوية أصيلة'],
  },
];

export const TRAVELER_STORIES = DESTINATION_STORIES;
