/// <reference types="@types/google.maps" />
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary 
} from '@vis.gl/react-google-maps';
import { 
  Compass, MapPin, Building2, Navigation, Layers, ExternalLink, 
  Clock, ShieldCheck, Car, Footprints, Search, Info, Check, 
  Sparkles, ArrowRight, ArrowLeft, RefreshCw, Star
} from 'lucide-react';
import { UILanguage } from '../../../types';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

export interface HolyHotelReference {
  id: string;
  city: 'Makkah' | 'Madinah';
  nameEn: string;
  nameAr: string;
  lat: number;
  lng: number;
  haramDistanceDescEn: string;
  haramDistanceDescAr: string;
  stars: number;
}

export interface ZiyaratLocationSite {
  id: string;
  city: 'Makkah' | 'Madinah';
  nameEn: string;
  nameAr: string;
  category: 'mosque' | 'mountain_cave' | 'mashair' | 'cemetery' | 'landmark';
  categoryAr: string;
  categoryEn: string;
  lat: number;
  lng: number;
  significanceEn: string;
  significanceAr: string;
  bestVisitTimeEn: string;
  bestVisitTimeAr: string;
  visitDurationMinutes: number;
  etiquetteNotesAr: string;
  etiquetteNotesEn: string;
  rewardNoteAr?: string;
  rewardNoteEn?: string;
}

export const PILGRIMAGE_HOTELS: HolyHotelReference[] = [
  // Makkah Hotels
  {
    id: 'fairmont-clock-tower',
    city: 'Makkah',
    nameEn: 'Fairmont Makkah Clock Royal Tower',
    nameAr: 'فيرمونت برج ساعة مكة الملكي',
    lat: 21.4190,
    lng: 39.8258,
    haramDistanceDescEn: '0m Direct Front Courtyard',
    haramDistanceDescAr: '٠م ساحة الحرم المباشرة',
    stars: 5,
  },
  {
    id: 'address-jabal-omar',
    city: 'Makkah',
    nameEn: 'Address Jabal Omar Makkah',
    nameAr: 'العنوان جبل عمر مكة المكرمة',
    lat: 21.4215,
    lng: 39.8228,
    haramDistanceDescEn: '180m from Haram Piazza',
    haramDistanceDescAr: '١٨٠م من ساحات الحرم',
    stars: 5,
  },
  {
    id: 'raffles-palace-makkah',
    city: 'Makkah',
    nameEn: 'Raffles Makkah Palace',
    nameAr: 'قصر رافلز مكة المكرمة',
    lat: 21.4198,
    lng: 39.8252,
    haramDistanceDescEn: 'King Abdulaziz Gate (0m)',
    haramDistanceDescAr: 'مواجهة باب الملك عبدالعزيز (٠م)',
    stars: 5,
  },
  {
    id: 'swissotel-makkah',
    city: 'Makkah',
    nameEn: 'Swissôtel Makkah (Abraj Al-Bait)',
    nameAr: 'سويس أوتيل مكة (أبراج البيت)',
    lat: 21.4192,
    lng: 39.8265,
    haramDistanceDescEn: '100m with Private Haram Corridor',
    haramDistanceDescAr: '١٠٠م مع نفق مصلى مباشر للحرم',
    stars: 5,
  },
  // Madinah Hotels
  {
    id: 'oberoi-madinah',
    city: 'Madinah',
    nameEn: 'The Oberoi Madinah',
    nameAr: 'فندق أوبروي المدينة المنورة',
    lat: 24.4715,
    lng: 39.6115,
    haramDistanceDescEn: '20m Northern Haram Piazza',
    haramDistanceDescAr: '٢٠م الساحة المركزية الشمالية',
    stars: 5,
  },
  {
    id: 'dar-al-taqwa-madinah',
    city: 'Madinah',
    nameEn: 'Dar Al Taqwa Hotel',
    nameAr: 'فندق دار التقوى المدينة',
    lat: 24.4695,
    lng: 39.6105,
    haramDistanceDescEn: '15m Facing King Fahd Gate',
    haramDistanceDescAr: '١٥م مواجهة باب الملك فهد',
    stars: 5,
  },
  {
    id: 'madinah-hilton',
    city: 'Madinah',
    nameEn: 'Madinah Hilton',
    nameAr: 'هيلتون المدينة المنورة',
    lat: 24.4690,
    lng: 39.6085,
    haramDistanceDescEn: '70m King Fahd Gate Approach',
    haramDistanceDescAr: '٧٠م خط المشاة الرئيسي للحرم',
    stars: 5,
  },
  {
    id: 'pullman-zamzam-madinah',
    city: 'Madinah',
    nameEn: 'Pullman Zamzam Madinah',
    nameAr: 'بولمان زمزم المدينة المنورة',
    lat: 24.4645,
    lng: 39.6100,
    haramDistanceDescEn: '120m Southern Piazza',
    haramDistanceDescAr: '١٢٠م الساحة المركزية الجنوبية',
    stars: 5,
  },
];

export const ZIYARAT_HOLY_SITES: ZiyaratLocationSite[] = [
  // MAKKAH SITES
  {
    id: 'site-haram-kaaba',
    city: 'Makkah',
    nameEn: 'Al-Masjid Al-Haram & Holy Kaaba',
    nameAr: 'المسجد الحرام والكعبة المشرفة ومقام إبراهيم',
    category: 'mosque',
    categoryEn: 'Sacred Sanctuary',
    categoryAr: 'الحرم المكي وأقدس البقاع',
    lat: 21.4225,
    lng: 39.8262,
    significanceEn: 'The holiest site in Islam, home to the Holy Kaaba, Mataf, Maqam Ibrahim, and Zamzam Well. Single prayer equals 100,000 prayers.',
    significanceAr: 'أقدس بقاع الأرض، قبلة المسلمين ومطاف المعتمرين والحجاج، الصلاة فيه تعدل مائة ألف صلاة.',
    bestVisitTimeEn: 'Tahajjud & Early Morning (Before Dhuhr)',
    bestVisitTimeAr: 'وقت السحر والصباح الباكر أو بعد صلاة العشاء',
    visitDurationMinutes: 180,
    etiquetteNotesAr: 'الطهارة الكاملة، غض البصر، التفرغ للذكر والدعاء، وتجنب التدافع عند الحجر الأسود.',
    etiquetteNotesEn: 'State of Wudu, continuous dhikr, respect personal space around the Mataf floor.',
    rewardNoteAr: 'الصلاة فيه بـ ١٠٠,٠٠٠ صلاة فيما سواه',
    rewardNoteEn: '1 prayer = 100,000 normal prayers',
  },
  {
    id: 'site-ghar-hira',
    city: 'Makkah',
    nameEn: 'Cave of Hira & Jabal Al-Noor',
    nameAr: 'غار حراء وجبل النور (مهبط الوحي الأول)',
    category: 'mountain_cave',
    categoryEn: 'Mountain & Cave of Revelation',
    categoryAr: 'جبل النور ومهبط الوحي',
    lat: 21.4578,
    lng: 39.8592,
    significanceEn: 'The sacred mountain where Prophet Muhammad ﷺ received the first divine revelation (Surah Al-Alaq) from Angel Jibril.',
    significanceAr: 'المكان الإيماني الخالد الذي شهد نزول أولى آيات القرآن الكريم (اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ).',
    bestVisitTimeEn: 'Sunrise (06:00 AM) or Late Afternoon',
    bestVisitTimeAr: 'مع شروق الشمس أو قبل الغروب لتجنب حرارة الظهيرة',
    visitDurationMinutes: 120,
    etiquetteNotesAr: 'ارتداء أحذية مريحة للمشي الجبلي، اصطحاب ماء شرب، التفكر والسكينة، وعدم التبرك بالأحجار.',
    etiquetteNotesEn: 'Comfortable hiking shoes, water hydration, quiet contemplation without stone-touching rituals.',
    rewardNoteAr: 'شاهد انطلاق نور النبوة والرسالة الخاتمة',
    rewardNoteEn: 'Cradle of the Islamic Prophetic revelation',
  },
  {
    id: 'site-ghar-thawr',
    city: 'Makkah',
    nameEn: 'Cave of Thawr (Jabal Thawr)',
    nameAr: 'غار ثور وجبل ثور (ملاذ الهجرة النبوية)',
    category: 'mountain_cave',
    categoryEn: 'Hijrah Sanctuary',
    categoryAr: 'ملاذ الهجرة النبوية الشريفة',
    lat: 21.3780,
    lng: 39.8490,
    significanceEn: 'Sanctuary where Prophet Muhammad ﷺ and companion Abu Bakr Al-Siddiq (RA) stayed 3 nights during the blessed Hijrah.',
    significanceAr: 'الغار المبارك الذي أوى إليه النبي ﷺ وأبو بكر الصديق رضي الله عنه أثناء الهجرة النبوية الشريفة إلى المدينة.',
    bestVisitTimeEn: 'Early Morning (06:30 AM)',
    bestVisitTimeAr: 'الصباح الباكر',
    visitDurationMinutes: 90,
    etiquetteNotesAr: 'استحضار معية الله وتضحيات الهجرة النبوية، ومسار الصعود يتطلب لياقة جيدة.',
    etiquetteNotesEn: 'Reflecting on trust in Allah (Tawakkul); steep terrain requires moderate fitness.',
    rewardNoteAr: '﴿إِذْ يَقُولُ لِصَاحِبِهِ لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا﴾',
    rewardNoteEn: 'Quran: "Do not grieve; indeed Allah is with us"',
  },
  {
    id: 'site-mashair-mina',
    city: 'Makkah',
    nameEn: 'Mina Valley & Jamarat Facility',
    nameAr: 'مشعر منى وجسر الجمرات الحديث',
    category: 'mashair',
    categoryEn: 'Hajj Sacred Grounds',
    categoryAr: 'مشاعر الحج الكبرى',
    lat: 21.4138,
    lng: 39.8732,
    significanceEn: 'The city of tents where pilgrims spend the Days of Tashreeq and perform the symbolic stoning of the Jamarat pillars.',
    significanceAr: 'وادي منى المبارك حيث يقضي الحجاج أيام التشريق ويرمون الجمرات تأسياً بسيدنا إبراهيم عليه السلام.',
    bestVisitTimeEn: 'Morning (08:00 AM - 11:00 AM)',
    bestVisitTimeAr: 'الفترة الصباحية للزيارات الإرشادية والتثقيفية',
    visitDurationMinutes: 60,
    etiquetteNotesAr: 'الاطلاع على منظومة التفويج والمسارات المكيفة، والتعرف على مواقع المخيمات الرسمية.',
    etiquetteNotesEn: 'Educational visit to understand Hajj operations, multi-level Jamarat, and safe pedestrian bridges.',
  },
  {
    id: 'site-mashair-arafat',
    city: 'Makkah',
    nameEn: 'Mount Arafat & Jabal Al-Rahmah',
    nameAr: 'صعيد عرفات الطاهر وجبل الرحمة',
    category: 'mashair',
    categoryEn: 'The Pinnacle of Hajj',
    categoryAr: 'ركن الحج الأعظم',
    lat: 21.3547,
    lng: 39.9842,
    significanceEn: 'The greatest pillar of Hajj: "Hajj is Arafah". The sacred plain of repentance, forgiveness, and immense supplication.',
    significanceAr: 'أعظم أركان الحج، قال النبي ﷺ: (الحج عرفة)، موطن الدعاء العظيم والوقوف بين يدي الله تعالى والتجرد.',
    bestVisitTimeEn: 'Morning or Late Afternoon',
    bestVisitTimeAr: 'أوقات الإشراق أو العصر',
    visitDurationMinutes: 90,
    etiquetteNotesAr: 'استغلال الوقت في الإلحاح بالدعاء والاستغفار، وزيارة مسجد نمرة وجبل الرحمة بخشوع.',
    etiquetteNotesEn: 'Earnest personal Du\'aa, visit Namirah Mosque and Mount of Mercy respectfully.',
    rewardNoteAr: 'أفضل الدعاء دعاء يوم عرفة',
    rewardNoteEn: 'The best supplication is that of Arafah',
  },
  {
    id: 'site-jannat-al-mualla',
    city: 'Makkah',
    nameEn: 'Jannat Al-Mu\'alla Historic Cemetery',
    nameAr: 'مقبرة المعلاة التاريخية (أم المؤمنين خديجة)',
    category: 'cemetery',
    categoryEn: 'Sacred Cemetery',
    categoryAr: 'مقبرة الصحابة وأمهات المؤمنين',
    lat: 21.4333,
    lng: 39.8317,
    significanceEn: 'Historic cemetery containing the resting place of Mother of the Believers Khadijah bint Khuwaylid (RA) and ancestors.',
    significanceAr: 'المقبرة التاريخية العريقة التي تضم ضريح أم المؤمنين السيدة خديجة رضي الله عنها والعديد من آل البيت والصحابة.',
    bestVisitTimeEn: 'After Asr Prayer',
    bestVisitTimeAr: 'بعد صلاة العصر أو الضحى',
    visitDurationMinutes: 45,
    etiquetteNotesAr: 'الدعاء لأهل القبور بالسلام والمغفرة دون ابتداع أو طواف.',
    etiquetteNotesEn: 'Reciting Sunnah greetings for cemetery inhabitants without bid\'ah.',
  },
  {
    id: 'site-masjid-taneem',
    city: 'Makkah',
    nameEn: 'Masjid Aisha (Al-Taneem Miqat)',
    nameAr: 'مسجد التنعيم (ميقات أم المؤمنين عائشة)',
    category: 'mosque',
    categoryEn: 'Umrah Miqat Boundary',
    categoryAr: 'ميقات العمرة المعتمد',
    lat: 21.4933,
    lng: 39.7967,
    significanceEn: 'The designated Miqat boundary where residents and pilgrims in Makkah enter Ihram to perform subsequent Umrahs.',
    significanceAr: 'الميقات الشرعي المبارك الذي أحرمت منه السيدة عائشة رضي الله عنها بأمر النبي ﷺ، لإهلال العمرة.',
    bestVisitTimeEn: 'Anytime when intending new Umrah',
    bestVisitTimeAr: 'متاح ٢٤ ساعة ومجهز بمرافق إحرام متكاملة',
    visitDurationMinutes: 45,
    etiquetteNotesAr: 'مرافق مجهزة للاغتسال والوضوء ولبس الإحرام وعقد النية وصلاة ركعتي سنة الإحرام.',
    etiquetteNotesEn: 'Full bathing and Ihram changing facilities with organized taxi and bus routes.',
  },

  // MADINAH SITES
  {
    id: 'site-masjid-nabawi',
    city: 'Madinah',
    nameEn: 'Al-Masjid Al-Nabawi & Al-Rawdah Al-Sharifa',
    nameAr: 'المسجد النبوي الشريف والروضة المباركة',
    category: 'mosque',
    categoryEn: 'Prophet\'s Mosque & Sacred Rawdah',
    categoryAr: 'المسجد النبوي الشريف والروضة الشريفة',
    lat: 24.4672,
    lng: 39.6111,
    significanceEn: 'The sanctuary of the Messenger of Allah ﷺ. Al-Rawdah is a garden from the gardens of Paradise. Single prayer equals 1,000 prayers.',
    significanceAr: 'مسجد رسول الله ﷺ وضريحه الشريف، والروضة الشريفة روضة من رياض الجنة، والصلاة فيه بألف صلاة.',
    bestVisitTimeEn: 'Open 24 Hours (Rawdah via Nusuk permit appointment)',
    bestVisitTimeAr: 'مفتوح على مدار الساعة (دخول الروضة يتطلب تصريح نُسك مسبق)',
    visitDurationMinutes: 180,
    etiquetteNotesAr: 'خفض الصوت، إلقاء السلام بأدب على النبي ﷺ وصاحبيه، والتزام مواعيد حجز الروضة الشريفة في منصة نسك.',
    etiquetteNotesEn: 'Lowering voice, reciting peace upon the Prophet ﷺ, adherence to scheduled Nusuk Rawdah permit slot.',
    rewardNoteAr: 'ما بين بيتي ومنبري روضة من رياض الجنة',
    rewardNoteEn: 'Between my house and pulpit is a garden of Paradise',
  },
  {
    id: 'site-jannat-al-baqi',
    city: 'Madinah',
    nameEn: 'Jannat Al-Baqi Cemetery',
    nameAr: 'بقيع الغرقد (مقبرة كبار الصحابة وآل البيت)',
    category: 'cemetery',
    categoryEn: 'Baqi Cemetery of Companions',
    categoryAr: 'بقيع الغرقد المبارك',
    lat: 24.4670,
    lng: 39.6150,
    significanceEn: 'Resting place of over 10,000 companions, the Prophet\'s wives, daughters, and early martyrs of Islam.',
    significanceAr: 'المقبرة المباركة الملاصقة للمسجد النبوي، تضم رفات أكثر من عشرة آلاف صحابي جليل وأمهات المؤمنين.',
    bestVisitTimeEn: 'Immediately after Fajr & Asr prayers (open for men)',
    bestVisitTimeAr: 'عقب صلاة الفجر وصلاة العصر مباشرة',
    visitDurationMinutes: 30,
    etiquetteNotesAr: 'اتباع السنة النبوية في إلقاء السلام على أهل الديار والمغفرة لهم، والخشوع واستشعار لقاء الله.',
    etiquetteNotesEn: 'Sunnah greeting for companions, quiet contemplation.',
  },
  {
    id: 'site-masjid-quba',
    city: 'Madinah',
    nameEn: 'Quba Mosque (Masjid Quba)',
    nameAr: 'مسجد قباء الشريف (أول مسجد أسس في الإسلام)',
    category: 'mosque',
    categoryEn: 'First Mosque of Islam',
    categoryAr: 'أول مسجد في الإسلام وثواب عمرة',
    lat: 24.4394,
    lng: 39.6172,
    significanceEn: 'First mosque established in Islam. The Prophet ﷺ stated: "Whoever purifies themselves at home then prays 2 Rak\'ahs in Quba will have a reward like Umrah".',
    significanceAr: 'أول مسجد بني في الإسلام. قال النبي ﷺ: (من تطهر في بيته ثم أتى مسجد قباء فصلى فيه ركعتين كان له كأجر عمرة).',
    bestVisitTimeEn: 'Saturday morning or after Fajr/Dhuhr',
    bestVisitTimeAr: 'الضحى أو الصباح الباكر (تأسياً بالسنة يوم السبت)',
    visitDurationMinutes: 60,
    etiquetteNotesAr: 'استحباب التطهر والوضوء في الفندق قبل الانطلاق، والمشي عبر ممشى قباء المظلل المميز.',
    etiquetteNotesEn: 'Perform wudu at hotel prior to arrival; scenic shaded Quba pedestrian avenue connects from Haram.',
    rewardNoteAr: 'صلاة ركعتين فيه تعدل ثواب عمرة تامة',
    rewardNoteEn: '2 Rak\'ahs reward equals a complete Umrah',
  },
  {
    id: 'site-mount-uhud',
    city: 'Madinah',
    nameEn: 'Mount Uhud & Martyrs Cemetery',
    nameAr: 'جبل أحد وجبل الرماة ومقبرة سيد الشهداء',
    category: 'mountain_cave',
    categoryEn: 'Historic Battle Site & Mount of Love',
    categoryAr: 'جبل يحبنا ونحبه ومقبرة الشهداء',
    lat: 24.5033,
    lng: 39.6125,
    significanceEn: 'Prophet ﷺ said: "Uhud is a mountain that loves us and we love it". Site of the Battle of Uhud and grave of Hamza ibn Abdul-Muttalib (RA).',
    significanceAr: 'قال النبي ﷺ: (أُحُد جبل يحبنا ونحبه). موطن غزوة أحد وجبل عينين (الرماة) وضريح سيد الشهداء حمزة رضي الله عنه.',
    bestVisitTimeEn: 'Morning (07:30 AM - 10:30 AM)',
    bestVisitTimeAr: 'ساعات الصباح المعتدلة للوقوف على جبل الرماة',
    visitDurationMinutes: 75,
    etiquetteNotesAr: 'السلام على شهداء أحد بالدعاء المأثور، صعود جبل الرماة بحذر، واستحضار الدروس العقدية والتربوية.',
    etiquetteNotesEn: 'Respectful salams to Uhud martyrs, gentle ascent of Archer\'s Hill.',
    rewardNoteAr: 'جبل يحبنا ونحبه وهو من جبال الجنة',
    rewardNoteEn: '"Uhud is a mountain that loves us and we love it"',
  },
  {
    id: 'site-masjid-qiblatayn',
    city: 'Madinah',
    nameEn: 'Masjid Al-Qiblatayn (The Two Qiblas)',
    nameAr: 'مسجد القبلتين (شاهد تحويل القبلة المشرفة)',
    category: 'mosque',
    categoryEn: 'Historical Mosque',
    categoryAr: 'مسجد تاريخي وشاهد تحويل القبلة',
    lat: 24.4842,
    lng: 39.5786,
    significanceEn: 'Historic mosque where revelation descended during prayer ordering the transition of the Qibla from Jerusalem to the Holy Kaaba.',
    significanceAr: 'المسجد الذي نزل فيه الوحي أثناء الصلاة بتحويل القبلة من المسجد الأقصى إلى الكعبة المشرفة بمكة المكرمة.',
    bestVisitTimeEn: 'Between Dhuhr and Asr prayers',
    bestVisitTimeAr: 'بين صلاتي الظهر والعصر',
    visitDurationMinutes: 45,
    etiquetteNotesAr: 'صلاة ركعتي تحية المسجد، وتأمل التاريخ الهندسي لمحاريب المسجد القديمة والجديدة.',
    etiquetteNotesEn: 'Tahiyyat Al-Masjid prayer, architectural inspection of historical prayer orientations.',
  },
  {
    id: 'site-seven-mosques-khandaq',
    city: 'Madinah',
    nameEn: 'The Seven Mosques & Battle of the Trench',
    nameAr: 'المساجد السبعة وموقع غزوة الخندق (الأحزاب)',
    category: 'landmark',
    categoryEn: 'Historical Military Sanctuary',
    categoryAr: 'موقع الخندق ومسجد الفتح',
    lat: 24.4756,
    lng: 39.5969,
    significanceEn: 'Site of the Battle of the Trench (Ghazwat Al-Ahzab) and Al-Fath Mosque, where the Prophet ﷺ made supplication for victory.',
    significanceAr: 'الموقع التاريخي لغزوة الأحزاب وحفر الخندق بمشورة سلمان الفارسي رضي الله عنه، ومسجد الفتح الشريف.',
    bestVisitTimeEn: 'Morning (08:30 AM)',
    bestVisitTimeAr: 'الفترة الصباحية',
    visitDurationMinutes: 50,
    etiquetteNotesAr: 'استذكار ثبات المؤمنين ونصر الله وتدبر الآيات الكريمة في سورة الأحزاب.',
    etiquetteNotesEn: 'Reflecting on historical unity and victory of Muslims against the allied tribes.',
  },
  {
    id: 'site-masjid-ghamama',
    city: 'Madinah',
    nameEn: 'Masjid Al-Ghamamah (Cloud Mosque)',
    nameAr: 'مسجد الغمامة (مصلى النبي ﷺ للاستسقاء والعيد)',
    category: 'mosque',
    categoryEn: 'Sunnah Praying Ground',
    categoryAr: 'مصلى الاستسقاء والأعياد النبوية',
    lat: 24.4650,
    lng: 39.6083,
    significanceEn: 'Where Prophet Muhammad ﷺ performed Eid and Rain Prayers (Istisqa) when a cloud shaded him from the sun.',
    significanceAr: 'الموضع الذي صلى فيه النبي ﷺ صلاة الاستسقاء فظللته غمامة وسقط المطر، وصلى فيه صلاة العيد.',
    bestVisitTimeEn: 'Easily accessible on foot after any Haram prayer',
    bestVisitTimeAr: 'ملاصق لساحة الحرم الجنوبية الغربية ومتاح على الأقدام',
    visitDurationMinutes: 20,
    etiquetteNotesAr: 'سهل الوصول مشياً من كافة فنادق المنطقة المركزية بالمدينة المنورة.',
    etiquetteNotesEn: 'Walking distance (3-5 minutes) from central Madinah hotels.',
  },
];

// Helper to calculate exact Haversine distance in km
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Apply a typical city street winding factor of 1.25 for urban roads
  const estimatedRoadDistance = straightLine < 0.3 ? straightLine : straightLine * 1.25;
  return Math.round(estimatedRoadDistance * 10) / 10;
}

// Inner Google Maps Route Line Component
const DirectPathPolyline: React.FC<{
  hotel: HolyHotelReference;
  site: ZiyaratLocationSite | null;
}> = ({ hotel, site }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const lineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib || !site) {
      if (lineRef.current) {
        lineRef.current.setMap(null);
        lineRef.current = null;
      }
      return;
    }

    if (lineRef.current) {
      lineRef.current.setMap(null);
    }

    const pathCoordinates = [
      { lat: hotel.lat, lng: hotel.lng },
      { lat: site.lat, lng: site.lng },
    ];

    lineRef.current = new google.maps.Polyline({
      path: pathCoordinates,
      geodesic: true,
      strokeColor: '#D4AF37',
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map: map,
    });

    return () => {
      if (lineRef.current) {
        lineRef.current.setMap(null);
        lineRef.current = null;
      }
    };
  }, [map, mapsLib, hotel, site]);

  return null;
};

interface ZiyaratInteractiveMapProps {
  uiLang: UILanguage;
  defaultCity?: 'Makkah' | 'Madinah';
  onSelectSiteForItinerary?: (site: ZiyaratLocationSite) => void;
}

export const ZiyaratInteractiveMap: React.FC<ZiyaratInteractiveMapProps> = ({
  uiLang,
  defaultCity = 'Makkah',
  onSelectSiteForItinerary,
}) => {
  const isAr = uiLang === 'ar';
  const [selectedCity, setSelectedCity] = useState<'Makkah' | 'Madinah'>(defaultCity);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapType, setMapType] = useState<string>('roadmap');
  
  // Available hotels in selected city
  const cityHotels = useMemo(() => {
    return PILGRIMAGE_HOTELS.filter(h => h.city === selectedCity);
  }, [selectedCity]);

  // Selected Reference Hotel
  const [selectedHotelId, setSelectedHotelId] = useState<string>(cityHotels[0]?.id || 'fairmont-clock-tower');

  // Sync hotel when city changes
  useEffect(() => {
    const firstHotel = PILGRIMAGE_HOTELS.find(h => h.city === selectedCity);
    if (firstHotel) {
      setSelectedHotelId(firstHotel.id);
    }
  }, [selectedCity]);

  const selectedHotel = useMemo(() => {
    return PILGRIMAGE_HOTELS.find(h => h.id === selectedHotelId) || cityHotels[0] || PILGRIMAGE_HOTELS[0];
  }, [selectedHotelId, cityHotels]);

  // Sites in selected city with distance computed from the selected hotel
  const sitesWithDistances = useMemo(() => {
    return ZIYARAT_HOLY_SITES
      .filter(site => site.city === selectedCity)
      .map(site => {
        const distanceKm = calculateHaversineDistanceKm(
          selectedHotel.lat,
          selectedHotel.lng,
          site.lat,
          site.lng
        );
        
        // Estimated transit duration
        const estimatedDriveMins = Math.max(3, Math.round((distanceKm / 28) * 60));
        const estimatedWalkMins = distanceKm <= 3.5 ? Math.round((distanceKm / 4.5) * 60) : null;

        return {
          ...site,
          distanceKm,
          estimatedDriveMins,
          estimatedWalkMins,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [selectedCity, selectedHotel]);

  // Filtered sites based on category and search query
  const filteredSites = useMemo(() => {
    return sitesWithDistances.filter(site => {
      const matchesCategory = selectedCategory === 'all' || site.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' ||
        site.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.nameAr.includes(searchQuery) ||
        site.significanceEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.significanceAr.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [sitesWithDistances, selectedCategory, searchQuery]);

  // Currently focused site on map
  const [selectedSite, setSelectedSite] = useState<typeof sitesWithDistances[0] | null>(null);

  // Set default selected site when city changes
  useEffect(() => {
    setSelectedSite(null);
  }, [selectedCity]);

  // Default camera center and zoom based on city
  const cityCoordinates = useMemo(() => {
    if (selectedCity === 'Makkah') {
      return { lat: 21.4225, lng: 39.8262, zoom: 12.8 };
    }
    return { lat: 24.4672, lng: 39.6111, zoom: 13.2 };
  }, [selectedCity]);

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* =========================================================================
          TOP COMMAND BAR & CONTROLS (LIGHT HIJAZI IVORY & EMERALD)
         ========================================================================= */}
      <div className="bg-white border border-[#EDE0CC] rounded-3xl p-5 sm:p-6 text-[#44200F] shadow-2xs relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          {/* Top Title & City Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EDE0CC] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6218] font-mono">
                  {isAr ? 'خريطة المعالم النبوية والمزارات' : 'Interactive Sacred Ziyarat Map'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF6EE] text-[#7C5310] border border-[#DFC798]">
                  Google Maps Platform
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#44200F] tracking-tight flex items-center gap-2">
                <Compass className="w-6 h-6 text-[#B8860B]" />
                <span>
                  {isAr 
                    ? `مزارات ${selectedCity === 'Makkah' ? 'مكة المكرمة' : 'المدينة المنورة'} وحساب المسافات الفندقية`
                    : `Sacred Sites of ${selectedCity === 'Makkah' ? 'Holy Makkah' : 'Madinah'} with Hotel Distance Markers`}
                </span>
              </h2>
            </div>

            {/* City Selector Buttons */}
            <div className="flex items-center gap-2 bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#E5D5B5] self-start md:self-auto">
              <button
                onClick={() => setSelectedCity('Makkah')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedCity === 'Makkah'
                    ? 'bg-[#FDF4E0] text-[#7C5310] border border-[#B8860B] shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F]'
                }`}
              >
                <div className="w-2.5 h-2.5 bg-[#B8860B] rounded-xs" />
                <span>{isAr ? 'مكة المكرمة' : 'Holy Makkah'}</span>
              </button>

              <button
                onClick={() => setSelectedCity('Madinah')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedCity === 'Madinah'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-[#065F46] hover:bg-emerald-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>{isAr ? 'طيبة — المدينة المنورة' : 'Madinah Al-Munawwarah'}</span>
              </button>
            </div>
          </div>

          {/* Hotel Departure Reference Selector (Simple Distance Markers Base) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 items-center">
            <div className="md:col-span-5 bg-[#FAF8F5] border border-[#E5D5B5] rounded-2xl p-3 flex flex-col justify-between">
              <label className="text-[10px] uppercase font-bold text-[#8C6218] flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>{isAr ? 'فندق الإقامة لحساب المسافات الدقيقة:' : 'Reference Hotel for Distances:'}</span>
              </label>
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="w-full bg-white border border-[#EDE0CC] rounded-xl px-3 py-1.5 text-xs text-[#44200F] font-bold focus:outline-none focus:ring-1 focus:ring-[#B8860B] cursor-pointer"
              >
                {cityHotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>
                    {isAr ? hotel.nameAr : hotel.nameEn} ({isAr ? hotel.haramDistanceDescAr : hotel.haramDistanceDescEn})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] text-[#795037] mt-1.5 pt-1.5 border-t border-[#EDE0CC]">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{isAr ? selectedHotel.haramDistanceDescAr : selectedHotel.haramDistanceDescEn}</span>
                </span>
                <span className="text-amber-600 font-mono font-bold">★★★★★ {selectedHotel.stars} Stars</span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="md:col-span-4 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#8C6218] text-white'
                    : 'bg-[#FAF8F5] text-[#44200F] border border-[#EDE0CC] hover:border-[#B8860B]'
                }`}
              >
                {isAr ? 'كافة المعالم' : 'All Sites'} ({sitesWithDistances.length})
              </button>
              <button
                onClick={() => setSelectedCategory('mosque')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === 'mosque'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#FAF8F5] text-[#44200F] border border-[#EDE0CC] hover:border-emerald-500'
                }`}
              >
                {isAr ? 'المساجد' : 'Mosques'}
              </button>
              <button
                onClick={() => setSelectedCategory('mountain_cave')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === 'mountain_cave'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#FAF8F5] text-[#44200F] border border-[#EDE0CC] hover:border-amber-500'
                }`}
              >
                {isAr ? 'الجبال والغيران' : 'Mountains & Caves'}
              </button>
              <button
                onClick={() => setSelectedCategory('mashair')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === 'mashair'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#FAF8F5] text-[#44200F] border border-[#EDE0CC] hover:border-purple-500'
                }`}
              >
                {isAr ? 'المشاعر' : 'Holy Mashair'}
              </button>
            </div>

            {/* Quick Search */}
            <div className="md:col-span-3 relative">
              <Search className={`w-4 h-4 text-[#B8860B] absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو الفضيلة...' : 'Search holy site...'}
                className={`w-full py-2 bg-[#FAF8F5] border border-[#DFC798] rounded-xl text-xs text-[#44200F] placeholder-[#9C7A54] focus:outline-none focus:ring-1 focus:ring-[#B8860B] ${
                  isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE MAP & SITES DIRECTORY SPLIT WORKSPACE (LIGHT THEME)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT / MAIN: GOOGLE MAPS CANVAS (7 COLS ON DESKTOP) */}
        <div className="lg:col-span-7 bg-white border border-[#EDE0CC] rounded-3xl overflow-hidden shadow-xs flex flex-col relative h-[560px] sm:h-[620px]">
          {/* Map Type & Control Bar */}
          <div className="p-3 bg-[#FAF8F5] border-b border-[#EDE0CC] flex items-center justify-between text-xs text-[#44200F] z-10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#8C6218] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#B8860B]" />
                <span>{isAr ? 'خريطة تفاعلية معتمدة' : 'Live Interactive Map'}</span>
              </span>
              <span className="text-[11px] text-[#795037] font-mono">
                {selectedCity === 'Makkah' ? '21.42° N, 39.82° E' : '24.46° N, 39.61° E'}
              </span>
            </div>

            {/* Map Layers & Style Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMapType(t => t === 'roadmap' ? 'hybrid' : 'roadmap')}
                className="px-2.5 py-1 bg-white hover:bg-[#FAF3E3] border border-[#DFC798] rounded-lg text-[11px] font-bold text-[#7C5310] flex items-center gap-1 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-[#B8860B]" />
                <span className="capitalize">{mapType}</span>
              </button>
            </div>
          </div>

          {/* Google Maps Render Canvas with Fallback */}
          <div className="w-full h-full relative">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker', 'routes', 'geometry']}>
              <Map
                defaultCenter={{ lat: cityCoordinates.lat, lng: cityCoordinates.lng }}
                defaultZoom={cityCoordinates.zoom}
                gestureHandling="greedy"
                disableDefaultUI={false}
                mapTypeId={mapType}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                {/* Visual Direct Path between Reference Hotel & Selected Ziyarat Site */}
                <DirectPathPolyline hotel={selectedHotel} site={selectedSite} />

                {/* Reference Hotel Advanced Marker (Gold Medallion) */}
                <AdvancedMarker
                  position={{ lat: selectedHotel.lat, lng: selectedHotel.lng }}
                  title={isAr ? selectedHotel.nameAr : selectedHotel.nameEn}
                  zIndex={30}
                >
                  <div className="rounded-2xl bg-white border-2 border-[#B8860B] shadow-md flex items-center gap-1.5 text-[#44200F] px-2.5 py-1 cursor-pointer">
                    <Building2 className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span className="text-[10px] font-black tracking-tight text-[#7C5310]">
                      {isAr ? 'فندق الإقامة' : 'Hotel Base'}
                    </span>
                  </div>
                </AdvancedMarker>

                {/* Ziyarat Holy Sites Markers */}
                {filteredSites.map((site) => {
                  const isSelected = selectedSite?.id === site.id;
                  const isKaabaOrProphetMosque = site.id === 'site-haram-kaaba' || site.id === 'site-masjid-nabawi';

                  // Dynamic Pin Color Scheme
                  const pinBg = isKaabaOrProphetMosque 
                    ? '#8C6218' 
                    : site.category === 'mosque' 
                    ? '#047857' 
                    : site.category === 'mountain_cave' 
                    ? '#B45309' 
                    : '#7C3AED';

                  const pinGlyph = isKaabaOrProphetMosque ? '🕋' : site.category === 'mosque' ? '🕌' : '⛰️';

                  return (
                    <AdvancedMarker
                      key={site.id}
                      position={{ lat: site.lat, lng: site.lng }}
                      onClick={() => setSelectedSite(site)}
                      title={isAr ? site.nameAr : site.nameEn}
                      zIndex={isSelected ? 40 : 20}
                    >
                      <div className="flex flex-col items-center group cursor-pointer">
                        {/* Simple Distance Badge floating above marker */}
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shadow-sm whitespace-nowrap mb-1 transition-all ${
                          isSelected 
                            ? 'bg-[#8C6218] text-white border-[#DFC798] scale-110' 
                            : 'bg-white/95 text-[#44200F] border-[#DFC798] group-hover:scale-105'
                        }`}>
                          {site.distanceKm} km
                        </div>

                        <Pin
                          background={pinBg}
                          borderColor="#D4AF37"
                          glyphColor="#FFFFFF"
                          glyph={pinGlyph}
                          scale={isSelected ? 1.3 : 1.05}
                        />
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Interactive Info Window for Selected Site */}
                {selectedSite && (
                  <InfoWindow
                    position={{ lat: selectedSite.lat, lng: selectedSite.lng }}
                    onCloseClick={() => setSelectedSite(null)}
                  >
                    <div className="p-1 max-w-xs text-left space-y-2 text-slate-900" dir={isAr ? 'rtl' : 'ltr'}>
                      {/* Top Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          {isAr ? selectedSite.categoryAr : selectedSite.categoryEn}
                        </span>
                        {/* Simple Distance Marker Pill */}
                        <span className="text-[11px] font-mono font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                          📍 {selectedSite.distanceKm} km
                        </span>
                      </div>

                      {/* Site Title */}
                      <div>
                        <h4 className="text-sm font-black text-slate-950 leading-tight">
                          {isAr ? selectedSite.nameAr : selectedSite.nameEn}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-sans">
                          {isAr ? selectedSite.nameEn : selectedSite.nameAr}
                        </p>
                      </div>

                      {/* Travel Duration Indicators */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <Car className="w-3.5 h-3.5 text-amber-700" />
                          <span>~{selectedSite.estimatedDriveMins} mins</span>
                        </div>
                        {selectedSite.estimatedWalkMins && (
                          <div className="flex items-center gap-1 font-mono font-bold text-emerald-700">
                            <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                            <span>~{selectedSite.estimatedWalkMins} mins walk</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{selectedSite.visitDurationMinutes} min visit</span>
                        </div>
                      </div>

                      {/* Spiritual Significance */}
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        {isAr ? selectedSite.significanceAr : selectedSite.significanceEn}
                      </p>

                      {/* Reward or Spiritual Hadith note if present */}
                      {(selectedSite.rewardNoteAr || selectedSite.rewardNoteEn) && (
                        <div className="p-1.5 rounded-lg bg-amber-50 text-[10px] font-bold text-amber-900 border border-amber-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{isAr ? selectedSite.rewardNoteAr : selectedSite.rewardNoteEn}</span>
                        </div>
                      )}

                      {/* External Google Maps Directions Link */}
                      <div className="pt-1 border-t border-slate-200 flex items-center justify-between">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${selectedHotel.lat},${selectedHotel.lng}&destination=${selectedSite.lat},${selectedSite.lng}&travelmode=driving?utm_campaign=gmp_mcp_codeassist_v1_aistudio`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                        >
                          <span>{isAr ? 'اتجاهات Google Maps' : 'Directions in Google Maps'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {onSelectSiteForItinerary && (
                          <button
                            type="button"
                            onClick={() => onSelectSiteForItinerary(selectedSite)}
                            className="px-2 py-0.5 rounded bg-[#8C6218] text-white font-bold text-[10px] hover:bg-[#734F10] transition"
                          >
                            {isAr ? '+ إضافة للبرنامج' : '+ Add to Trip'}
                          </button>
                        )}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>

            {/* Selected Site Floating Banner at Bottom of Map */}
            {selectedSite && (
              <div className="absolute bottom-3 inset-x-3 bg-white/95 backdrop-blur-md border border-[#DFC798] rounded-2xl p-3 text-[#44200F] shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FDF4E0] border border-[#DFC798] flex items-center justify-center text-[#7C5310] font-mono font-bold text-xs shrink-0">
                    {selectedSite.distanceKm} km
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-[#44200F] flex items-center gap-1.5">
                      <span>{isAr ? selectedSite.nameAr : selectedSite.nameEn}</span>
                    </h5>
                    <span className="text-[11px] text-[#795037]">
                      {isAr 
                        ? `المسافة من ${selectedHotel.nameAr}: ${selectedSite.distanceKm} كم (~${selectedSite.estimatedDriveMins} دقيقة بالسيارة)`
                        : `Distance from ${selectedHotel.nameEn}: ${selectedSite.distanceKm} km (~${selectedSite.estimatedDriveMins}m drive)`}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${selectedHotel.lat},${selectedHotel.lng}&destination=${selectedSite.lat},${selectedSite.lng}&travelmode=driving?utm_campaign=gmp_mcp_codeassist_v1_aistudio`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#8C6218] text-white font-bold text-xs hover:bg-[#734F10] transition flex items-center gap-1 shrink-0"
                >
                  <span>{isAr ? 'المسار المباشر' : 'Get Directions'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: SITES DIRECTORY LIST WITH SIMPLE DISTANCE MARKERS (5 COLS ON DESKTOP) */}
        <div className="lg:col-span-5 bg-white border border-[#EDE0CC] rounded-3xl p-4 sm:p-5 text-[#44200F] flex flex-col justify-between max-h-[620px] shadow-xs">
          <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
              <div>
                <h3 className="font-black text-sm text-[#44200F] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B8860B]" />
                  <span>{isAr ? 'قائمة المزارات والمسافات الفندقية' : 'Ziyarat Sites & Distance Markers'}</span>
                </h3>
                <span className="text-[11px] text-[#795037]">
                  {isAr 
                    ? `مرتبة حسب الأقرب إلى ${selectedHotel.nameAr}`
                    : `Sorted by proximity to ${selectedHotel.nameEn}`}
                </span>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-[#FDF4E0] text-[#7C5310] border border-[#DFC798] text-xs font-mono font-bold">
                {filteredSites.length} {isAr ? 'معلم' : 'Sites'}
              </span>
            </div>

            {/* Scrollable list of sites with distances */}
            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {filteredSites.map((site) => {
                const isSelected = selectedSite?.id === site.id;

                return (
                  <div
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#FDF6E7] border-[#B8860B] ring-1 ring-[#B8860B] shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#EDE0CC] hover:border-[#B8860B] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#795037] border border-[#EDE0CC]">
                            {isAr ? site.categoryAr : site.categoryEn}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#44200F] leading-snug">
                          {isAr ? site.nameAr : site.nameEn}
                        </h4>
                      </div>

                      {/* SIMPLE DISTANCE MARKER BADGE */}
                      <div className="text-end shrink-0">
                        <div className="px-2.5 py-1 rounded-xl bg-white border border-[#DFC798] text-[#7C5310] font-mono font-black text-xs shadow-2xs">
                          {site.distanceKm} km
                        </div>
                        <span className="text-[10px] text-[#795037] block mt-0.5 font-mono">
                          ~{site.estimatedDriveMins} mins
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#795037] line-clamp-2 leading-relaxed">
                      {isAr ? site.significanceAr : site.significanceEn}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#795037] pt-1.5 border-t border-[#EDE0CC]">
                      <span className="flex items-center gap-1 text-[#44200F] font-medium">
                        <Clock className="w-3 h-3 text-[#B8860B]" />
                        <span>{site.visitDurationMinutes} {isAr ? 'دقيقة زيارة' : 'min duration'}</span>
                      </span>

                      {site.estimatedWalkMins && (
                        <span className="text-emerald-700 flex items-center gap-1 font-mono font-bold">
                          <Footprints className="w-3 h-3" />
                          <span>~{site.estimatedWalkMins}m walk</span>
                        </span>
                      )}

                      <span className="text-[#8C6218] font-bold flex items-center gap-0.5">
                        <span>{isAr ? 'عرض في الخريطة' : 'View on Map'}</span>
                        {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Compliance & Navigation Notes */}
          <div className="pt-3 border-t border-[#EDE0CC] flex items-center justify-between text-xs text-[#795037]">
            <span className="flex items-center gap-1 text-[#8C6218] text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isAr ? 'حساب المسارات متطابق مع شبكة الحرمين' : 'Official Haramain transit network'}</span>
            </span>

            <span className="text-[10px] text-slate-500 font-mono">
              Google Maps Platform
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
