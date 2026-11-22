export interface AgencyTripPhoto {
  url: string;
  captionEn: string;
  captionAr: string;
  location: string;
}

export interface AgencyTripSchedule {
  time: string;
  timeAr: string;
  locationEn: string;
  locationAr: string;
  protocolEn: string;
  protocolAr: string;
}

export interface AgencyTrip {
  id: string;
  agencyId: string;
  titleEn: string;
  titleAr: string;
  category: 'cultural' | 'nile' | 'coastal' | 'desert';
  categoryLabelEn: string;
  categoryLabelAr: string;
  destinations: string[];
  destinationsAr: string[];
  durationEn: string;
  durationAr: string;
  priceUsd: number;
  groupCapacity: string;
  groupCapacityAr: string;
  arrival: AgencyTripSchedule;
  departure: AgencyTripSchedule;
  summaryEn: string;
  summaryAr: string;
  highlightsEn: string[];
  highlightsAr: string[];
  photos: AgencyTripPhoto[];
}

export const AGENCY_TRIPS: AgencyTrip[] = [
  // ==========================================
  // AGENCY 1: RIHAL Egypt Expeditions (Cairo / Nile Luxury)
  // ==========================================
  {
    id: 'trip-rihal-1',
    agencyId: 'agency-dalil-egypt',
    titleEn: '8-Day Pharaohs & Private Dahabiya Nile Charter',
    titleAr: 'رحلة الفراعنة وإبحار الدهبية النيلية الفاخرة (٨ أيام)',
    category: 'nile',
    categoryLabelEn: 'Nile Cruising & Antiquities',
    categoryLabelAr: 'كروزات نيلية وآثار',
    destinations: ['Cairo', 'Giza', 'Luxor', 'Edfu', 'Kom Ombo', 'Aswan'],
    destinationsAr: ['القاهرة', 'الجيزة', 'الأقصر', 'إدفو', 'كوم أمبو', 'أسوان'],
    durationEn: '8 Days / 7 Nights',
    durationAr: '٨ أيام / ٧ ليالٍ',
    priceUsd: 1850,
    groupCapacity: '2 – 16 Travelers',
    groupCapacityAr: '٢ – ١٦ مسافراً',
    arrival: {
      time: '10:30 AM',
      timeAr: '١٠:٣٠ صباحاً',
      locationEn: "Cairo International Airport (CAI) - Terminal 3 VIP Hall",
      locationAr: 'مطار القاهرة الدولي (صالة ٣ - كبار الزوار)',
      protocolEn: 'Fast-track passport control, luggage porterage, and Mercedes V-Class transfer to Zamalek / Pyramids hotel.',
      protocolAr: 'استقبال سريع بصالة كبار الزوار، إنهاء الجوازات، وحافلة مرسيدس خاصة لفندق الإقامة.',
    },
    departure: {
      time: '05:00 PM',
      timeAr: '٠٥:٠٠ مساءً',
      locationEn: "Aswan International Airport (ASW) / Cairo International Airport",
      locationAr: 'مطار أسوان الدولي / العودة لمطار القاهرة الدولي',
      protocolEn: 'Private luggage transfer from Dahabiya charter to airport departure gate with boarding assistance.',
      protocolAr: 'نقل الأمتعة مباشرة من الدهبية النيلية إلى صالة السفر ومساعدة كاملة في وزن الحقائب والتوديع.',
    },
    summaryEn: 'An ultra-exclusive cultural voyage combining sunrise access to Giza Pyramids with 4 nights aboard an intimate 5-star private Dahabiya sailing between Luxor and Aswan.',
    summaryAr: 'رحلة استكشافية تجمع بين الدخول الخاص لأهرامات الجيزة عند الشروق وإبحار هادئ لمدة ٤ ليالٍ على متن دهبية نيلية فاخرة خاصة بين الأقصر وأسوان.',
    highlightsEn: [
      'Private dawn entrance to Giza Pyramids plateau before general tourist crowds',
      '4-Night private sailing on luxury boutique Dahabiya with dedicated private chef',
      'Exclusive permit for Tutankhamun and Seti I tombs in the Valley of the Kings',
      'Sunset candlelit cocktail on the Nile overlooking Philae Temple in Aswan',
    ],
    highlightsAr: [
      'دخول حصري لهضبة الأهرامات فجراً قبل مواعيد الزيارة العامة وتزاحم السياح',
      'إبحار هادئ لمدة ٤ ليالٍ بدهبية نيلية فندقية خاصة مع شيف مصري خاص',
      'تصريح ملكي خاص لزيارة مقبرتي توت عنخ آمون وسيتي الأول بوادي الملوك',
      'أمسية خاصة ومشروبات ترحيبية عند الغروب بإطلالة بانورامية على معبد فيلة',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Dahabiya sailing smoothly along the pristine banks of Upper Egypt',
        captionAr: 'إبحار الدهبية النيلية الخاصة بسكينة وسط طبيعة صعيد مصر الخلابة',
        location: 'River Nile, Luxor to Aswan',
      },
      {
        url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Private morning tour through Karnak Temple hypostyle hall',
        captionAr: 'جولة خاصة بصالة الأعمدة الكبرى بمعبد الكرنك في الأقصر',
        location: 'Karnak Temple, Luxor',
      },
      {
        url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'The Great Pyramids and Sphinx in morning golden light',
        captionAr: 'أهرامات الجيزة وأبو الهول تحت أشعة شمس الصباح الذهبية',
        location: 'Giza Plateau, Greater Cairo',
      },
      {
        url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Philae Temple illuminated at dusk on its island in Aswan',
        captionAr: 'معبد فيلة مضاءً بالكامل فوق جزيرته الساحرة بأسوان',
        location: 'Philae Island, Aswan',
      },
      {
        url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Traditional Nile felucca sailing past the granite cataracts',
        captionAr: 'شراع الفلوكة النيلية التقليدية بالقرب من جزر الشلال الأول',
        location: 'Elephantine Island, Aswan',
      },
    ],
  },
  {
    id: 'trip-rihal-2',
    agencyId: 'agency-dalil-egypt',
    titleEn: '12-Day Royal Dynasties & Grand Egyptian Museum',
    titleAr: 'كنوز السلالات الملكية والمتحف المصري الكبير (١٢ يوماً)',
    category: 'cultural',
    categoryLabelEn: 'Comprehensive Archaeological Expedition',
    categoryLabelAr: 'بعثة أثرية متكاملة',
    destinations: ['Cairo', 'Saqqara', 'Luxor', 'Dendera', 'Abydos', 'Aswan', 'Abu Simbel'],
    destinationsAr: ['القاهرة', 'سقارة', 'الأقصر', 'دندرة', 'أبيدوس', 'أسوان', 'أبو سمبل'],
    durationEn: '12 Days / 11 Nights',
    durationAr: '١٢ يوماً / ١١ ليلة',
    priceUsd: 2490,
    groupCapacity: '4 – 20 Travelers',
    groupCapacityAr: '٤ – ٢٠ مسافراً',
    arrival: {
      time: '11:00 AM',
      timeAr: '١١:٠٠ صباحاً',
      locationEn: "Cairo International Airport (CAI) - Terminal 2",
      locationAr: 'مطار القاهرة الدولي (صالة ٢)',
      protocolEn: 'VIP expedited arrival protocol, meet-and-assist by licensed Egyptologist, transfer to Mena House hotel.',
      protocolAr: 'استقبال فندقي فاخر وإنهاء إجراءات الوصول ونقل بحافلة مرسيدس لفندق مينا هاوس.',
    },
    departure: {
      time: '02:30 PM',
      timeAr: '٠٢:٣٠ ظهراً',
      locationEn: "Cairo International Airport (CAI) - Terminal 2 / 3",
      locationAr: 'مطار القاهرة الدولي (صالة ٢ و ٣)',
      protocolEn: 'Hotel checkout, luggage escort to check-in counter, and commemorative papyrus gift ceremony.',
      protocolAr: 'تسجيل المغادرة من الفندق ومرافقة كاملة لمنطقة الجوازات وتسليم درع تذكاري للمسافرين.',
    },
    summaryEn: 'The definitive deep-dive into Ancient Egypt. Covers the Grand Egyptian Museum, Saqqara Serapeum, Abydos mystery temple, and flights to Abu Simbel.',
    summaryAr: 'المسار الشامل لحضارة مصر القديمة؛ يشمل المتحف الكبير، سرابيوم سقارة، معبد سيتي بأبيدوس، وطيران مباشر لأبو سمبل.',
    highlightsEn: [
      'Full-day curator-guided immersion in the Grand Egyptian Museum (GEM)',
      'Underground chambers of Djoser Step Pyramid and the mystical Serapeum',
      'Chartered flight excursion from Aswan to the colossal temples of Abu Simbel',
      'Expert lectures on hieroglyphics and royal conservation',
    ],
    highlightsAr: [
      'جولة يوم كامل برفقة أمين متحفي متخصص داخل قاعات المتحف المصري الكبير',
      'دخول الغرف السفلية لهرم زوسر المدرج وسرابيوم سقارة الغامض',
      'رحلة طيران شارتر مباشرة من أسوان لمعبدي رمسيس الثاني ونفرتاري بأبو سمبل',
      'محاضرات إرشادية حول الهيروغليفية وأسرار الحفائر والترميم الحديث',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Colossal statues and grand staircase of the archaeological exhibits',
        captionAr: 'التماثيل العملاقة والبهو العظيم للمعارض الأثرية الملكية',
        location: 'Grand Egyptian Museum, Giza',
      },
      {
        url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Saqqara step pyramid and surrounding desert necropolis',
        captionAr: 'هرم زوسر المدرج بسقارة وجبانتها الأثرية التاريخية',
        location: 'Saqqara Necropolis, Giza',
      },
      {
        url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Abu Simbel sun temple carved into the solid mountain sandstone',
        captionAr: 'واجهة معبد أبو سمبل الشامخة المنحوتة في قلب الجبل بأسوان',
        location: 'Abu Simbel, Nubia',
      },
      {
        url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'The monumental West Bank mortuary temples of Luxor',
        captionAr: 'معابد البر الغربي الجنائزية الخالدة بالأقصر',
        location: 'West Bank, Luxor',
      },
    ],
  },
  {
    id: 'trip-rihal-3',
    agencyId: 'agency-dalil-egypt',
    titleEn: '3-Day Cairo Heritage & Saqqara Pyramid Complex',
    titleAr: 'ثلاثية القاهرة التراثية ومجمع سقارة الأثري (٣ أيام)',
    category: 'cultural',
    categoryLabelEn: 'City Break & Heritage',
    categoryLabelAr: 'رحلة قصيرة وتراث',
    destinations: ['Cairo', 'Giza', 'Saqqara', 'Old Cairo'],
    destinationsAr: ['القاهرة', 'الجيزة', 'سقارة', 'مصر القديمة'],
    durationEn: '3 Days / 2 Nights',
    durationAr: '٣ أيام / ليلتان',
    priceUsd: 620,
    groupCapacity: '2 – 10 Travelers',
    groupCapacityAr: '٢ – ١٠ مسافرين',
    arrival: {
      time: '09:00 AM',
      timeAr: '٠٩:٠٠ صباحاً',
      locationEn: "Hotel Pickup or Cairo International Airport",
      locationAr: 'الاستقبال من فندق الإقامة أو مطار القاهرة الدولي',
      protocolEn: 'Direct meeting by private chauffeur and licensed Egyptologist with bottled cold water and welcome dates.',
      protocolAr: 'استقبال فوري بسائق خاص ومرشد أثري مع مياه معدنية وتمر مصري فاخر.',
    },
    departure: {
      time: '06:00 PM',
      timeAr: '٠٦:٠٠ مساءً',
      locationEn: "Cairo International Airport or Central Hotel",
      locationAr: 'مطار القاهرة الدولي أو فندق وسط القاهرة',
      protocolEn: 'Drop-off at departure gates or hotel lobby with farewell dinner recommendation.',
      protocolAr: 'التوصيل لصالة المغادرة أو بهو الفندق مع اقتراحات لأفضل المطاعم التراثية.',
    },
    summaryEn: 'A high-impact short journey featuring Old Cairo churches, Islamic citadel, Sultan Hassan mosque, Saqqara, and private Khan El Khalili artisan walking tour.',
    summaryAr: 'برنامج مكثف لمعالم القاهرة التراثية؛ الكنائس المعلقة، قلعة صلاح الدين، جامع السلطان حسن، وجولة بين حرفيي خان الخليلي.',
    highlightsEn: [
      'Private architectural tour of Mosque-Madrassa of Sultan Hassan',
      'The Hanging Church and Abu Serga crypt where the Holy Family rested',
      'Saqqara tomb paintings of Ti and Mereruka',
      'Bespoke perfume and copper crafting workshops in historic alleys',
    ],
    highlightsAr: [
      'جولة معمارية خاصة بمسجد ومدرسة السلطان حسن درة العمارة الإسلامية',
      'الكنيسة المعلقة ومغارة كنيسة أبي سرجة حيث استقرت العائلة المقدسة',
      'نقوش مقابر تي وميريروكا الزاهية بألوانها الأصلية بسقارة',
      'ورش النحاس والعطور التراثية بحواري القاهرة الفاطمية العتيقة',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Historic Old Cairo lanes and Islamic architecture',
        captionAr: 'أزقة القاهرة التاريخية ومآذنها الإسلامية الشاهقة',
        location: 'Islamic Cairo, Al-Muizz Street',
      },
      {
        url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'The majestic Citadel of Saladin dominating the city skyline',
        captionAr: 'قلعة صلاح الدين الأيوبي تعلو سماء القاهرة التاريخية',
        location: 'Saladin Citadel, Cairo',
      },
      {
        url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Khan el-Khalili market glowing with lanterns and handicrafts',
        captionAr: 'سوق خان الخليلي متألقاً بالفوانيس والمشغولات النحاسية التراثية',
        location: 'Khan el-Khalili, Cairo',
      },
    ],
  },

  // ==========================================
  // AGENCY 2: Karnak Heritage Travel (Luxor / Upper Egypt)
  // ==========================================
  {
    id: 'trip-karnak-1',
    agencyId: 'agency-karnak-heritage',
    titleEn: '5-Day Upper Egypt Royal Temples & Sailing',
    titleAr: 'معابد مصر العليا وإبحار ملوك الفراعنة (٥ أيام)',
    category: 'nile',
    categoryLabelEn: 'Upper Egypt Classic',
    categoryLabelAr: 'كلاسيكيات صعيد مصر',
    destinations: ['Luxor', 'Edfu', 'Kom Ombo', 'Aswan'],
    destinationsAr: ['الأقصر', 'إدفو', 'كوم أمبو', 'أسوان'],
    durationEn: '5 Days / 4 Nights',
    durationAr: '٥ أيام / ٤ ليالٍ',
    priceUsd: 980,
    groupCapacity: '2 – 24 Travelers',
    groupCapacityAr: '٢ – ٢٤ مسافراً',
    arrival: {
      time: '08:30 AM',
      timeAr: '٠٨:٣٠ صباحاً',
      locationEn: "Luxor International Airport (LXR) / Luxor Railway Station",
      locationAr: 'مطار الأقصر الدولي أو محطة قطار الأقصر VIP',
      protocolEn: 'Traditional Upper Egypt welcome, hibiscus drink, transfer directly to cruiser cabin.',
      protocolAr: 'استقبال تراثي صعيدي بمشروب الكركديه الأسواني ونقل مباشر للكابينة على الكروز.',
    },
    departure: {
      time: '04:00 PM',
      timeAr: '٠٤:٠٠ مساءً',
      locationEn: "Aswan International Airport (ASW) / Aswan Railway",
      locationAr: 'مطار أسوان الدولي أو محطة قطار أسوان',
      protocolEn: 'Cruiser checkout, transfer to Aswan airport with departure clearance assistance.',
      protocolAr: 'مغادرة الكروز وتوصيل مباشر لمطار أسوان مع إنهاء كافة الإجراءات.',
    },
    summaryEn: 'Handcrafted Upper Egypt journey with Karnak Heritage family-owned navigation crew. Witness Karnak Temple, Luxor at night, Horus temple at Edfu, and Kom Ombo crocodile shrine.',
    summaryAr: 'رحلة أصيلة في قلب الصعيد مع أقدم عائلات الملاحة النيلية بالأقصر؛ تزور الكرنك، معبد الأقصر ليلاً، حورس بإدفو، وسوبك بكوم أمبو.',
    highlightsEn: [
      'Evening illuminated walk inside Luxor Temple on the Nile Corniche',
      'Horse carriage ride through Edfu town to Temple of Horus',
      'Dual temple of Kom Ombo dedicated to Sobek and Haroeris',
      'Traditional Nubian folkloric musical performance on deck',
    ],
    highlightsAr: [
      'جولة مسائية ساحرة وسط إضاءة أعمدة معبد الأقصر على كورنيش النيل',
      'ركوب الحنطور التقليدي بمدينة إدفو حتى بوابة معبد حورس العظيم',
      'زيارة معبد كوم أمبو المزدوج المكرس للإلهين سوبك وحورس الأكبر',
      'أمسية فلكلورية نوبية مبهجة بالدفوف والأغاني التراثية على سطح السفينة',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Karnak Temple majestic pylons and avenue of ram-headed sphinxes',
        captionAr: 'صروح معبد الكرنك وطريق الكباش المهيب بالأقصر',
        location: 'Karnak Temple, Luxor',
      },
      {
        url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Luxor Temple lit magnificently after sunset',
        captionAr: 'معبد الأقصر متلألئاً بأضوائه المسائية على ضفاف النيل',
        location: 'Luxor Corniche, Luxor',
      },
      {
        url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Edfu temple preserved sandstone walls and towering gates',
        captionAr: 'جدران معبد إدفو الرملية المحفوظة بالكامل وبواباته الشامخة',
        location: 'Edfu, Aswan Governorate',
      },
      {
        url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Sunset reflection along the golden waters of Aswan',
        captionAr: 'انعكاس الغروب الذهبي فوق مياه النيل الهادئة بأسوان',
        location: 'Nile River, Aswan',
      },
    ],
  },
  {
    id: 'trip-karnak-2',
    agencyId: 'agency-karnak-heritage',
    titleEn: '7-Day Luxor Deep Antiquities & Abydos Dendera',
    titleAr: 'أسرار الأقصر العميقة ومعابد أبيدوس ودندرة (٧ أيام)',
    category: 'cultural',
    categoryLabelEn: 'Temple Architecture Specialist',
    categoryLabelAr: 'عمارة ونقوش المعابد',
    destinations: ['Luxor', 'Qena', 'Dendera', 'Abydos', 'West Bank'],
    destinationsAr: ['الأقصر', 'قنا', 'دندرة', 'أبيدوس', 'البر الغربي'],
    durationEn: '7 Days / 6 Nights',
    durationAr: '٧ أيام / ٦ ليالٍ',
    priceUsd: 1280,
    groupCapacity: '2 – 14 Travelers',
    groupCapacityAr: '٢ – ١٤ مسافراً',
    arrival: {
      time: '10:00 AM',
      timeAr: '١٠:٠٠ صباحاً',
      locationEn: "Luxor International Airport (LXR)",
      locationAr: 'مطار الأقصر الدولي',
      protocolEn: 'VIP baggage reception, transfer to historic Winter Palace hotel or boutique Nile villa.',
      protocolAr: 'استقبال خاص للأمتعة ونقل لفندق ونتر بالاس التاريخي أو فيلا نيلية فاخرة.',
    },
    departure: {
      time: '01:00 PM',
      timeAr: '٠١:٠٠ ظهراً',
      locationEn: "Luxor International Airport (LXR)",
      locationAr: 'مطار الأقصر الدولي',
      protocolEn: 'Escort to airport gates with personalized photographic certificate.',
      protocolAr: 'توصيل لبوابات السفر وتسليم شهادة شرفية توثق زيارة مقابر الملوك.',
    },
    summaryEn: 'An archaeological tour focused on the vibrant colors of Hathor Temple in Dendera, the mysterious Osireion of Abydos, and the royal artisan village of Deir el-Medina.',
    summaryAr: 'برنامج أثري استثنائي يركز على سقف حتحور الأزرق الزاهي بدندرة، وأوزيريون أبيدوس الأسطوري، وقرية عمال المقابر بدير المدينة.',
    highlightsEn: [
      'Astronomical ceiling of Dendera Temple glowing with ancient turquoise blue',
      'The sacred subterranean Osireion at Abydos Temple of Seti I',
      'Deir el-Medina painted tombs of Sennedjem and Inherkhau',
      'Private sunrise hot air balloon flight over Valley of the Queens',
    ],
    highlightsAr: [
      'سقف معبد دندرة الفلكي المحتفظ بألوانه الفيروزية الأصلية الساحرة',
      'مبنى الأوزيريون الجوفي الغامض بمعبد الملك سيتي الأول بأبيدوس',
      'مقابر فناني وعمال الفراعنة بدير المدينة (مقبرة سن-نجم وإنحر-خاو)',
      'رحلة منطاد طائر خاصة عند الشروق فوق معابد وادي الملكات بالأقصر',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Hathor-headed columns inside the hypostyle hall of Dendera',
        captionAr: 'أعمدة برؤوس الإلهة حتحور داخل صالة أعمدة معبد دندرة',
        location: 'Dendera Temple, Qena',
      },
      {
        url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Hot air balloons ascending above the Luxor West Bank mountains',
        captionAr: 'مناطيد الهواء الساخن ترتفع في سماء البر الغربي بالأقصر',
        location: 'West Bank, Luxor',
      },
      {
        url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Mortuary Temple of Queen Hatshepsut nestled against cliff faces',
        captionAr: 'معبد الملكة حتشبسوت المعماري الفريد في حضن جبال الدير البحري',
        location: 'Deir el-Bahari, Luxor',
      },
    ],
  },

  // ==========================================
  // AGENCY 3: Memphis Tours Egypt (Giza / Complete Egypt)
  // ==========================================
  {
    id: 'trip-memphis-1',
    agencyId: 'agency-memphis-tours',
    titleEn: '10-Day Complete Grand Egypt Explorer',
    titleAr: 'رحلة مصر الكبرى الشاملة من القاهرة إلى أسوان (١٠ أيام)',
    category: 'cultural',
    categoryLabelEn: 'Grand All-Egypt Itinerary',
    categoryLabelAr: 'شامل كل محافظات مصر',
    destinations: ['Cairo', 'Alexandria', 'Luxor', 'Aswan', 'Hurghada'],
    destinationsAr: ['القاهرة', 'الإسكندرية', 'الأقصر', 'أسوان', 'الغردقة'],
    durationEn: '10 Days / 9 Nights',
    durationAr: '١٠ أيام / ٩ ليالٍ',
    priceUsd: 2200,
    groupCapacity: '2 – 35 Travelers',
    groupCapacityAr: '٢ – ٣٥ مسافراً',
    arrival: {
      time: '11:30 AM',
      timeAr: '١١:٣٠ صباحاً',
      locationEn: "Cairo International Airport (CAI) - Terminal 3",
      locationAr: 'مطار القاهرة الدولي (صالة ٣)',
      protocolEn: 'Airport meet & assist, express luggage tagging, Mercedes coach convoy to Giza hotel.',
      protocolAr: 'استقبال سريع بصالة المطار وإنهاء إجراءات الحقائب ونقل بحافلات مرسيدس للجيزة.',
    },
    departure: {
      time: '06:00 PM',
      timeAr: '٠٦:٠٠ مساءً',
      locationEn: "Hurghada International Airport (HRG) or Cairo Return",
      locationAr: 'مطار الغردقة الدولي أو العودة لمطار القاهرة الدولي',
      protocolEn: 'Resort express checkout, direct flight handover to international terminals.',
      protocolAr: 'تسجيل مغادرة المنتجع الساحلي وتوصيل مباشر لصالة السفر الدولي.',
    },
    summaryEn: 'The full Egyptian spectrum operated by Memphis Tours since 1955. From Alexandria Mediterranean shores to the Pyramids, Nile cruiser, and turquoise Red Sea beach break.',
    summaryAr: 'بانوراما مصرية شاملة تنظمها ممفيس تورز بخبرة منذ عام ١٩٥٥؛ من شواطئ الإسكندرية للأهرامات ثم كروز النيل والاستجمام على البحر الأحمر.',
    highlightsEn: [
      'Mediterranean day excursion to Alexandria Citadel of Qaitbay and Catacombs',
      '3-Night luxury full-board Nile cruise with all monument entrance tickets',
      'Private sunset quad bike desert safari in the Hurghada Red Sea dunes',
      '24/7 dedicated guest concierge and bilingual logistics dispatcher',
    ],
    highlightsAr: [
      'يوم سياحي ساحر بالإسكندرية لقلعة قايتباي ومكتبة الإسكندرية ومقابر كوم الشقافة',
      'إقامة كاملة فاخرة ٣ ليالٍ بكروز النيل شاملة تذاكر جميع المعابد والمزارات',
      'سفاري بيتش باجي خاص عند غروب الشمس بكثبان صحراء الغردقة الشرقية',
      'منسق عمليات مخصص ومرافق للرحلة على مدار ٢٤ ساعة طوال أيام السفر',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'The Citadel of Qaitbay overlooking the blue Mediterranean waters',
        captionAr: 'قلعة قايتباي التاريخية تطل على مياه البحر الأبيض المتوسط بالإسكندرية',
        location: 'Alexandria Harbour, Alexandria',
      },
      {
        url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Nile cruise ship docking near the palm-lined shores',
        captionAr: 'باخرة نيلية فاخرة ترسو بالقرب من جزر النيل الخضراء',
        location: 'Nile Valley, Upper Egypt',
      },
      {
        url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Giza Pyramids towering majestically over the landscape',
        captionAr: 'أهرامات الجيزة الخالدة تعانق الأفق',
        location: 'Giza Necropolis, Cairo',
      },
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Crystal turquoise waters and coral reefs of the Red Sea',
        captionAr: 'المياه الفيروزية والشعاب المرجانية البديعة بالبحر الأحمر',
        location: 'Hurghada Red Sea, Red Sea',
      },
    ],
  },
  {
    id: 'trip-memphis-2',
    agencyId: 'agency-memphis-tours',
    titleEn: '8-Day Pyramids & Red Sea Riviera Escape',
    titleAr: 'الأهرامات واستجمام شواطئ البحر الأحمر (٨ أيام)',
    category: 'coastal',
    categoryLabelEn: 'Culture & Coast',
    categoryLabelAr: 'حضارة واستجمام شاطئي',
    destinations: ['Cairo', 'Giza', 'Hurghada'],
    destinationsAr: ['القاهرة', 'الجيزة', 'الغردقة'],
    durationEn: '8 Days / 7 Nights',
    durationAr: '٨ أيام / ٧ ليالٍ',
    priceUsd: 1650,
    groupCapacity: '2 – 30 Travelers',
    groupCapacityAr: '٢ – ٣٠ مسافراً',
    arrival: {
      time: '10:00 AM',
      timeAr: '١٠:٠٠ صباحاً',
      locationEn: "Cairo International Airport (CAI)",
      locationAr: 'مطار القاهرة الدولي',
      protocolEn: 'Fast-track arrival, direct Mercedes transfer to Cairo hotel, welcome kit.',
      protocolAr: 'استقبال سريع ونقل خاص لفندق القاهرة وحقيبة ترحيبية بالخرائط وجدول الرحلة.',
    },
    departure: {
      time: '02:00 PM',
      timeAr: '٠٢:٠٠ ظهراً',
      locationEn: "Hurghada International Airport (HRG)",
      locationAr: 'مطار الغردقة الدولي',
      protocolEn: 'Direct transfer from luxury coastal resort to Hurghada departure gate.',
      protocolAr: 'توصيل مباشر من المنتجع الشاطئي لصالة المغادرة بمطار الغردقة.',
    },
    summaryEn: 'The perfect balance of world wonders and beachside leisure. 3 days discovering the Pyramids and Cairo museums, followed by 5 days of 5-star all-inclusive Red Sea pampering.',
    summaryAr: 'المعادلة المثالية بين عجائب التاريخ والاستجمام الشاطئي؛ ٣ أيام بالقاهرة والأهرامات تليها ٥ أيام بمنتجع فاخر على شاطئ البحر الأحمر.',
    highlightsEn: [
      'Giza Plateau camel caravan experience overlooking the 9 pyramids viewpoint',
      'Private motorboat excursion to Giftun Island national park for snorkeling',
      '5-Star beach resort all-inclusive dining, private cabanas, and spa credit',
    ],
    highlightsAr: [
      'جولة ركوب الجمال البانورامية بهضبة الأهرامات بإطلالة على الأهرامات التسعة',
      'رحلة لانش بحري خاص لمحمية جزيرة الجفتون للسباحة والسنوركلينج مع الدلافين',
      'إقامة شاملة كلياً بمنتجع شاطئي ٥ نجوم مع كبائن خاصة وخدمات استجمام',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Serene coastal beach resort facing the Red Sea',
        captionAr: 'شاطئ المنتجع الفاخر على البحر الأحمر برماله الذهبية',
        location: 'Hurghada, Red Sea',
      },
      {
        url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Pyramids of Giza rising above the golden sand dunes',
        captionAr: 'أهرامات الجيزة شامخة فوق رمال الصحراء الذهبية',
        location: 'Giza, Greater Cairo',
      },
      {
        url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Snorkelers gliding above pristine Red Sea coral reef gardens',
        captionAr: 'السباحة والسنوركلينج فوق حدائق المرجان النادرة بالبحر الأحمر',
        location: 'Giftun Island, Red Sea',
      },
    ],
  },

  // ==========================================
  // AGENCY 4: Red Sea Oasis Voyages (Hurghada / Safari & Marine)
  // ==========================================
  {
    id: 'trip-redsea-1',
    agencyId: 'agency-red-sea-voyages',
    titleEn: '7-Day Red Sea Private Yacht Charter & Marine Safari',
    titleAr: 'يخوت البحر الأحمر وسفاري الجزر البحرية (٧ أيام)',
    category: 'coastal',
    categoryLabelEn: 'Marine & Yacht Charters',
    categoryLabelAr: 'يخوت وسياحة بحرية',
    destinations: ['Hurghada', 'Giftun Island', 'El Gouna', 'Marsa Alam'],
    destinationsAr: ['الغردقة', 'جزيرة الجفتون', 'الجونة', 'مرسى علم'],
    durationEn: '7 Days / 6 Nights',
    durationAr: '٧ أيام / ٦ ليالٍ',
    priceUsd: 1350,
    groupCapacity: '2 – 18 Travelers',
    groupCapacityAr: '٢ – ١٨ مسافراً',
    arrival: {
      time: '01:00 PM',
      timeAr: '٠١:٠٠ ظهراً',
      locationEn: "Hurghada International Airport (HRG) - VIP Terminal",
      locationAr: 'مطار الغردقة الدولي (الصالة الرئيسية)',
      protocolEn: 'Direct transfer to Hurghada Marina, captain welcome champagne/cocktail, yacht boarding.',
      protocolAr: 'نقل سريع لمارينا الغردقة والترحيب بالمسافرين من قبطان اليخت ومشروب ترحيبي.',
    },
    departure: {
      time: '11:00 AM',
      timeAr: '١١:٠٠ صباحاً',
      locationEn: "Hurghada International Airport (HRG)",
      locationAr: 'مطار الغردقة الدولي',
      protocolEn: 'Disembarkation at marina, transfer to airport departure gate.',
      protocolAr: 'تسجيل النزول من اليخت بالمارينا والتوصيل المباشر لبوابات المطار.',
    },
    summaryEn: 'Private motorized yacht expedition exploring secluded sandbars, dolphin lagoons, El Gouna waterways, and protected coral sanctuaries of the southern Red Sea.',
    summaryAr: 'رحلة يخت فاخر خاص لاكتشاف جزر الجفتون البكر، بحيرات الدلافين الطبيعية، قنوات الجونة، ومحميات مرسى علم البحرية.',
    highlightsEn: [
      'Exclusive private yacht charter with crew, certified dive master, and private chef',
      'Swimming with wild spinner dolphins in their natural open-water reef habitat',
      'Private island barbecue on virgin white sand beaches in Giftun Marine Reserve',
      'Evening cocktails anchored inside El Gouna luxury marina',
    ],
    highlightsAr: [
      'يخت خاص بالكامل مع طاقم بحري معتمد، مدرب غوص دولي، وشيف مأكولات بحرية',
      'السباحة بجانب الدلافين الحرة في بيئتها الطبيعية بمضيق الدولفين ريف',
      'حفل شواء بحري خاص على رمال جزيرة الجفتون البيضاء العذراء',
      'سهرات مسائية راقية باليخت داخل مارينا الجونة الفاخرة',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Private yacht anchored in crystalline turquoise lagoon',
        captionAr: 'يخت بحري فاخر يرسو في مياه فيروزية صافية بالبحر الأحمر',
        location: 'Hurghada Marina, Red Sea',
      },
      {
        url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Wild dolphins playing in the open sea waves',
        captionAr: 'الدلافين تسبح وتمرح في مياه البحر الأحمر المفتوحة',
        location: 'Dolphin House Reef, Red Sea',
      },
      {
        url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Vibrant coral reef teeming with exotic Red Sea marine life',
        captionAr: 'مستعمرات المرجان والأسماك النادرة تحت أعماق البحر الأحمر',
        location: 'Giftun Island Marine Reserve',
      },
      {
        url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Sunset cruising past the lagoons of El Gouna',
        captionAr: 'إبحار ساحر وقت الغروب بين قنوات الجونة المائية',
        location: 'El Gouna, Hurghada',
      },
    ],
  },
  {
    id: 'trip-redsea-2',
    agencyId: 'agency-red-sea-voyages',
    titleEn: '4-Day Eastern Desert Stargazing & Quad Safari',
    titleAr: 'مخيمات النجوم وسفاري الصحراء الشرقية (٤ أيام)',
    category: 'desert',
    categoryLabelEn: 'Desert Safari & Camping',
    categoryLabelAr: 'سفاري ومخيمات صحراوية',
    destinations: ['Hurghada', 'Eastern Desert', 'Bedouin Oasis'],
    destinationsAr: ['الغردقة', 'الصحراء الشرقية', 'واحة البدو'],
    durationEn: '4 Days / 3 Nights',
    durationAr: '٤ أيام / ٣ ليالٍ',
    priceUsd: 540,
    groupCapacity: '2 – 20 Travelers',
    groupCapacityAr: '٢ – ٢٠ مسافراً',
    arrival: {
      time: '03:00 PM',
      timeAr: '٠٣:٠٠ عصراً',
      locationEn: "Hurghada Hotels or Airport Pickup",
      locationAr: 'الاستقبال من فنادق الغردقة أو المطار',
      protocolEn: 'Toyota Land Cruiser 4x4 convoy pickup, Bedouin keffiyeh scarf styling, desert briefing.',
      protocolAr: 'استقبال بسيارات تويوتا لاندكروزر دفع رباعي وتجهيز الشال البدوي وتوجيهات السلامة.',
    },
    departure: {
      time: '12:00 PM',
      timeAr: '١٢:٠٠ ظهراً',
      locationEn: "Hurghada Hotels or Airport",
      locationAr: 'العودة لفنادق الغردقة أو المطار',
      protocolEn: 'Return convoy from desert base camp to hotel lobby with photo album delivery.',
      protocolAr: 'العودة من مخيم الصحراء للفندق مع تسليم ألبوم صور احترافي للرحلة.',
    },
    summaryEn: 'High-octane desert adventure featuring 4x4 dune bashing, quad bikes, professional astronomical telescope stargazing, and traditional underground zarb barbecue.',
    summaryAr: 'مغامرة صحراوية ممتعة بسيارات الدفع الرباعي والبيتش باجي، ورصد فلكي احترافي للنجوم والمجرات عبر التلسكوب، وعشاء الزرب البدوي.',
    highlightsEn: [
      'Quad biking across wind-sculpted golden sand dunes at golden hour',
      'Astronomical deep-sky viewing of Jupiter and Saturn through high-powered telescope',
      'Bedouin herb tea and underground slow-cooked lamb zarb feast',
      'Overnight glamping tents with comfortable bedding beneath unpolluted desert skies',
    ],
    highlightsAr: [
      'قيادة البيتش باجي وسط كثبان الرمال الذهبية الساحرة وقت الغروب',
      'جلسة رصد فلكي بتلسكوبات حديثة لمشاهدة كواكب المشتري وزحل ومجرة درب التبانة',
      'جلسة شاي بالأعشاب البدوية ووجبة عشاء الزرب البدوي المدفون تحت الرمال',
      'مبيت بمخيمات فندقية مكيفة ومجهزة بالكامل تحت سماء الصحراء الصافية',
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Golden sand dunes rolling across the Eastern Desert',
        captionAr: 'كثبان الرمال الذهبية الممتدة في صحراء مصر الشرقية',
        location: 'Eastern Desert, Red Sea',
      },
      {
        url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Bedouin campsite illuminated under the starry night sky',
        captionAr: 'مخيم بدوي مضاء بالمصابيح تحت سماء الليل المرصعة بالنجوم',
        location: 'Bedouin Oasis, Hurghada',
      },
      {
        url: 'https://images.unsplash.com/photo-1544885935-98dd03b09034?auto=format&fit=crop&w=1200&q=80',
        captionEn: 'Convoy of 4x4 Land Cruisers traversing the mountain canyons',
        captionAr: 'قافلة سيارات الدفع الرباعي تعبر وديان الجبال الصحراوية',
        location: 'Red Sea Mountain Trail',
      },
    ],
  },
];

export function getTripsForAgency(agencyId?: string | null): AgencyTrip[] {
  if (!agencyId) {
    return [];
  }
  return AGENCY_TRIPS.filter(t => t.agencyId === agencyId);
}
