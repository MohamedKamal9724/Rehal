import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Square, Luggage, Sun, Compass, Shirt, 
  Sparkles, RefreshCw, AlertTriangle, ShieldCheck, 
  Camera, HeartPulse, Plane, Droplet, Plus, Trash2, CheckCircle2
} from 'lucide-react';
import { UILanguage } from '../../types';

interface SmartTravelPackingGuideProps {
  uiLang: UILanguage;
  onClose?: () => void;
}

interface PackingItem {
  id: string;
  nameEn: string;
  nameAr: string;
  category: 'temples' | 'cruise' | 'coastal' | 'desert' | 'essentials';
  noteEn?: string;
  noteAr?: string;
  isEssential?: boolean;
}

const DEFAULT_ITEMS: PackingItem[] = [
  // 1. Essentials for all travelers
  {
    id: 'ess-1',
    category: 'essentials',
    isEssential: true,
    nameEn: 'Passport & physical photocopies',
    nameAr: 'جواز السفر ونسخ ورقية مصورة منه',
    noteEn: 'Carry printed copies in your daypack, keep physical passport in hotel safe.',
    noteAr: 'احتفظ بنسخ ورقية في حقيبة اليومية، وجواز السفر الأصلي في خزينة الفندق.'
  },
  {
    id: 'ess-2',
    category: 'essentials',
    isEssential: true,
    nameEn: 'Type C / F European 2-pin power adapter',
    nameAr: 'محول كهرباء ثنائي أوروبي (نوع C / F)',
    noteEn: 'Egypt uses standard 220V 50Hz with rounded 2-pin wall outlets.',
    noteAr: 'مصر تستخدم تيار 220 فولت بمخارج جدارية ثنائية دائرية.'
  },
  {
    id: 'ess-3',
    category: 'essentials',
    isEssential: true,
    nameEn: 'Heavy-duty 10,000+ mAh portable power bank',
    nameAr: 'شاحن متنقل سعة 10,000 مللي أمبير أو أكثر',
    noteEn: 'Sunny daylight boosts phone screen brightness and drains battery fast.',
    noteAr: 'سطوع الشمس الشديد يستهلك بطارية الهاتف سريعاً أثناء التصوير.'
  },
  {
    id: 'ess-4',
    category: 'essentials',
    isEssential: true,
    nameEn: 'Prescription medicines with original doctor note',
    nameAr: 'الأدوية الموصوفة مع روشتة الطبيب الأصلية',
    noteEn: 'Keep medications in original packaging with doctor prescription.',
    noteAr: 'احتفظ بالأدوية في عبوتها الأصلية مع الوصفة الطبية الرسمية.'
  },
  {
    id: 'ess-5',
    category: 'essentials',
    isEssential: true,
    nameEn: 'Oral rehydration salts & digestive relief',
    nameAr: 'أملاح معالجة الجفاف وأقراص تنظيف الجهاز الهضمي',
    noteEn: 'Useful for climate adaptation and long sightseeing days under the sun.',
    noteAr: 'ضرورية للتكيف مع حرارة الطقس وأيام التجول الطويلة.'
  },

  // 2. Ancient Temples & Cultural Heritage
  {
    id: 'temp-1',
    category: 'temples',
    isEssential: true,
    nameEn: 'Cushioned rubber-sole walking shoes',
    nameAr: 'أحذية مشي بنعل مطاطي مريح للأرضيات الحجرية',
    noteEn: 'Temple floors (Karnak, Edfu, Philae) and tomb ramps are rough and uneven.',
    noteAr: 'أرضيات المعابد (الكرنك، إدفو، فيلة) ومنحدرات المقابر حجرية وغير مستوية.'
  },
  {
    id: 'temp-2',
    category: 'temples',
    isEssential: true,
    nameEn: 'Wide-brim UPF sun hat & UV400 sunglasses',
    nameAr: 'قبعة شمسية بحواف عريضة ونظارة شمسية UV400',
    noteEn: 'Open courtyards offer little shade between 10:00 and 15:00.',
    noteAr: 'أفنية المعابد المفتوحة لا يوجد بها ظلال كثيرة خلال ساعات الظهيرة.'
  },
  {
    id: 'temp-3',
    category: 'temples',
    isEssential: false,
    nameEn: 'Breathable linen / lightweight cotton shirts & trousers',
    nameAr: 'قمصان وبناطيل من الكتان أو القطن الخفيف الطبيعي',
    noteEn: 'Keeps you cool while respecting modesty at religious and heritage sites.',
    noteAr: 'توفر تهوية ممتازة وتحافظ على الاحتشام المناسب للمعالم التراثية والمساجد.'
  },
  {
    id: 'temp-4',
    category: 'temples',
    isEssential: false,
    nameEn: 'Lightweight cotton scarf / pashmina',
    nameAr: 'شال أو وشاح قطني خفيف',
    noteEn: 'Handy for dust, sun protection, or women entering historical mosques.',
    noteAr: 'متعدد الاستخدامات للحماية من الشمس أو الغبار وتغطية الرأس في المساجد التاريخية.'
  },
  {
    id: 'temp-5',
    category: 'temples',
    isEssential: false,
    nameEn: 'Small pocket flashlight (for dim tomb chambers)',
    nameAr: 'كشاف جيب صغير لإنارة جدران المقابر المظلمة',
    noteEn: 'Helps inspect deep carvings in Valley of the Kings without flash.',
    noteAr: 'يساعد في تأمل النقوش العميقة في وادي الملوك دون استخدام الفلاش الممنوع.'
  },

  // 3. Nile Cruise & River Charters
  {
    id: 'crs-1',
    category: 'cruise',
    isEssential: false,
    nameEn: 'Smart-casual dinner attire for captain banquet',
    nameAr: 'ملابس أنيقة للعشاء واحتفالية القبطان على الكروز',
    noteEn: 'Collared shirt or dinner dress for the evening welcome dinner.',
    noteAr: 'قميص بياقة أو فستان مناسب لعشاء الاستقبال وليالي الكروز.'
  },
  {
    id: 'crs-2',
    category: 'cruise',
    isEssential: false,
    nameEn: 'Light sweater or cardigan for evening deck breezes',
    nameAr: 'سترة أو كارديجان خفيف لنسمات النيل المسائية',
    noteEn: 'River breezes between Luxor and Aswan get pleasantly cool at dusk.',
    noteAr: 'نسمات الإبحار النيلي بين الأقصر وأسوان تصبح منعشة وباردة ليلاً.'
  },
  {
    id: 'crs-3',
    category: 'cruise',
    isEssential: false,
    nameEn: 'Swimsuit & cover-up for the sundeck plunge pool',
    nameAr: 'ملابس سباحة ورداء لتراس التشمس وحمام السباحة النيلي',
    noteEn: 'Cruises have open-air sundecks with plunge pools overlooking river banks.',
    noteAr: 'تتميز الكروزات بتراس مفتوح مع حمام سباحة يطل مباشرة على ضفاف النيل.'
  },
  {
    id: 'crs-4',
    category: 'cruise',
    isEssential: false,
    nameEn: 'Compact binoculars for rural Nile wildlife',
    nameAr: 'منظار مكبر مدمج لمشاهدة الطيور وضفاف القرى النيلية',
    noteEn: 'Great for spotting herons, kingfishers, and farmers along the shores.',
    noteAr: 'رائع لمشاهدة الطيور المهاجرة والحياة اليومية للمزارعين على الضفاف.'
  },

  // 4. Red Sea & Coastal (Hurghada, Sharm, Marsa Alam)
  {
    id: 'cst-1',
    category: 'coastal',
    isEssential: true,
    nameEn: 'Reef-safe mineral sunscreen (Oxybenzone-free)',
    nameAr: 'واقي شمس معدني صديق للشعاب المرجانية',
    noteEn: 'Protects delicate Red Sea corals and marine life.',
    noteAr: 'لحماية البيئة البحرية والشعاب المرجانية الفريدة في البحر الأحمر.'
  },
  {
    id: 'cst-2',
    category: 'coastal',
    isEssential: true,
    nameEn: 'Water shoes with reinforced sole',
    nameAr: 'أحذية مائية بنعل واقٍ للأقدام',
    noteEn: 'Protects against sharp coral fragments and rocky shores.',
    noteAr: 'تحمي القدمين من بقايا الصخور المرجانية والأرضيات الشاطئية الخشنة.'
  },
  {
    id: 'cst-3',
    category: 'coastal',
    isEssential: false,
    nameEn: 'Snorkel mask & anti-fog spray',
    nameAr: 'قناع سنوركلينج وبخاخ مانع لتكثف البخار',
    noteEn: 'While available on boats, personal masks ensure a tight leak-proof seal.',
    noteAr: 'القناع الخاص يضمن إحكام الإغلاق وملاءمة الوجه بشكل مريح.'
  },
  {
    id: 'cst-4',
    category: 'coastal',
    isEssential: false,
    nameEn: 'Waterproof dry bag (10L - 20L)',
    nameAr: 'حقيبة جافة مقاومة للماء (10 - 20 لتر)',
    noteEn: 'Safeguards phones and cameras during speedboat and dive boat rides.',
    noteAr: 'تحمي الهواتف والكاميرات من رذاذ البحر في القوارب السريعة.'
  },

  // 5. Desert Safari & Oases (Siwa, White Desert, Sinai)
  {
    id: 'des-1',
    category: 'desert',
    isEssential: true,
    nameEn: 'Traditional Bedouin cotton shemagh / desert scarf',
    nameAr: 'شماغ أو شال بدوي قطني لحماية الوجه من الرمال',
    noteEn: 'Wraps around mouth, nose, and neck during quad bike and 4x4 dunes.',
    noteAr: 'يحمي الأنف والفم والعنق من رذاذ الرمال أثناء رحلات البيتش باجي وسيارات الدفع الرباعي.'
  },
  {
    id: 'des-2',
    category: 'desert',
    isEssential: true,
    nameEn: 'Warm fleece jacket or thermal layer for night camps',
    nameAr: 'جاكيت صوف دافئ أو ملابس حرارية للتخييم الليلي',
    noteEn: 'Desert temperatures drop drastically after sunset, even in warm seasons.',
    noteAr: 'تنخفض حرارة الصحراء بشدة ليلاً حتى في المواسم المعتدلة.'
  },
  {
    id: 'des-3',
    category: 'desert',
    isEssential: false,
    nameEn: 'High-lumen headlamp with red-light mode',
    nameAr: 'كشاف رأس مضيء مع وضع الإضاءة الحمراء',
    noteEn: 'Leaves hands free at desert camps without ruining stargazing night vision.',
    noteAr: 'يترك اليدين حرتين في المخيم ولا يفسد رؤية النجوم الليلية الساحرة.'
  },
  {
    id: 'des-4',
    category: 'desert',
    isEssential: false,
    nameEn: 'Moisturizing lip balm & deep hydration cream',
    nameAr: 'مرطب شفاه وكريم ترطيب عميق ضد الجفاف',
    noteEn: 'Desert air has ultra-low humidity that rapidly chaps lips and skin.',
    noteAr: 'هواء الصحراء الجاف يسبب تشقق الشفاه والبشرة سريعاً.'
  }
];

export const SmartTravelPackingGuide: React.FC<SmartTravelPackingGuideProps> = ({
  uiLang,
  onClose
}) => {
  const isAr = uiLang === 'ar';
  const [activeCategory, setActiveCategory] = useState<'all' | 'essentials' | 'temples' | 'cruise' | 'coastal' | 'desert'>('all');
  
  // Stored state for checked items
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rihal_packing_checked');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom user items
  const [customItems, setCustomItems] = useState<{ id: string; name: string }[]>(() => {
    try {
      const saved = localStorage.getItem('rihal_packing_custom');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newCustomItemText, setNewCustomItemText] = useState('');

  // Persist checked items
  useEffect(() => {
    try {
      localStorage.setItem('rihal_packing_checked', JSON.stringify(checkedIds));
    } catch {}
  }, [checkedIds]);

  // Persist custom items
  useEffect(() => {
    try {
      localStorage.setItem('rihal_packing_custom', JSON.stringify(customItems));
    } catch {}
  }, [customItems]);

  const toggleItem = (id: string) => {
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomItemText.trim()) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      name: newCustomItemText.trim()
    };
    setCustomItems(prev => [...prev, newItem]);
    setCheckedIds(prev => [...prev, newItem.id]);
    setNewCustomItemText('');
  };

  const removeCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(i => i.id !== id));
    setCheckedIds(prev => prev.filter(i => i !== id));
  };

  const resetChecklist = () => {
    if (window.confirm(isAr ? 'هل تود إعادة تعيين القائمة وإلغاء تحديد الأغراض؟' : 'Reset all checked items?')) {
      setCheckedIds([]);
    }
  };

  const categories = [
    { id: 'all', labelAr: 'جميع المستلزمات', labelEn: 'All Items', icon: Luggage },
    { id: 'essentials', labelAr: 'الأساسيات الإلزامية', labelEn: 'Trip Essentials', icon: ShieldCheck },
    { id: 'temples', labelAr: 'المعابد والآثار', labelEn: 'Temples & Heritage', icon: Compass },
    { id: 'cruise', labelAr: 'كروز النيل', labelEn: 'Nile Cruise', icon: Shirt },
    { id: 'coastal', labelAr: 'البحر الأحمر والشواطئ', labelEn: 'Red Sea & Coast', icon: Droplet },
    { id: 'desert', labelAr: 'السفاري والصحراء', labelEn: 'Desert & Safari', icon: Sun },
  ];

  const displayedItems = DEFAULT_ITEMS.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const totalVisibleCount = displayedItems.length + (activeCategory === 'all' ? customItems.length : 0);
  const checkedVisibleCount = displayedItems.filter(i => checkedIds.includes(i.id)).length + 
    (activeCategory === 'all' ? customItems.filter(i => checkedIds.includes(i.id)).length : 0);
  
  const percentage = totalVisibleCount > 0 ? Math.round((checkedVisibleCount / totalVisibleCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner on Clean Beige Surface (Zero Overlays) */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#EDE0CC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-[#EDE0CC] text-[#795037] text-xs font-bold">
              <Luggage className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'دليل الاستعداد الميداني وتجهيز الحقيبة' : 'Smart Field Preparation & Packing Guide'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#44200F]">
              {isAr ? 'قائمة تجهيز الحقائب التفاعلية لرحلات مصر' : 'Interactive Egyptian Expedition Packing Checklist'}
            </h2>
            <p className="text-xs sm:text-sm text-[#795037] max-w-2xl leading-relaxed">
              {isAr
                ? 'قائمة عملية ومحدثة ميدانياً تناسب طبيعة المناخ المصري، خصوصية المعابد، رحلات النيل، والسفاري. حدد الأغراض التي وضعتها بحقيبتك لتتأكد من عدم نسيان أي غرض أساسي.'
                : 'Field-tested recommendations tailored for Egypt’s unique climates, temple stone surfaces, Nile charters, and desert terrain. Check off items as you pack.'}
            </p>
          </div>

          {/* Reset and Progress Indicator */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] shadow-2xs text-center shrink-0 min-w-[160px]">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              {isAr ? 'نسبة جاهزية الحقيبة' : 'Packing Progress'}
            </span>
            <div className="text-2xl font-black text-[#44200F] font-mono">
              {percentage}%
            </div>
            <span className="text-[10px] text-[#795037] font-medium block mt-0.5">
              {checkedVisibleCount} / {totalVisibleCount} {isAr ? 'غرض منجز' : 'packed'}
            </span>
            <div className="w-full bg-[#FAF7F2] h-2 rounded-full mt-2.5 overflow-hidden border border-[#EDE0CC]">
              <div 
                className="bg-[#44200F] h-full transition-all duration-300 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="luxury-tab-bar flex items-center gap-2 pt-6 overflow-x-auto no-scrollbar flex-nowrap">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`h-10 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#44200F] text-[#C4A177] shadow-xs'
                    : 'bg-white text-[#795037] hover:bg-[#EDE0CC] border border-[#EDE0CC]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? cat.labelAr : cat.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Checklist Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {displayedItems.map(item => {
          const isChecked = checkedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`h-full p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                isChecked
                  ? 'bg-[#FAF7F2]/60 border-[#EDE0CC] opacity-75'
                  : 'bg-white border-[#EDE0CC] hover:border-[#C4A177] shadow-2xs hover:shadow-sm'
              }`}
            >
              <button
                type="button"
                className={`mt-0.5 p-1 rounded-lg transition shrink-0 ${
                  isChecked
                    ? 'bg-[#44200F] text-[#C4A177]'
                    : 'border border-[#EDE0CC] text-slate-300 hover:border-[#795037]'
                }`}
              >
                {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-bold ${isChecked ? 'line-through text-slate-400' : 'text-[#44200F]'}`}>
                    {isAr ? item.nameAr : item.nameEn}
                  </span>
                  {item.isEssential && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      {isAr ? 'أساسي جداً' : 'Essential'}
                    </span>
                  )}
                </div>

                {(item.noteEn || item.noteAr) && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {isAr ? item.noteAr : item.noteEn}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Custom Items Added by Traveler */}
        {activeCategory === 'all' && customItems.map(cItem => {
          const isChecked = checkedIds.includes(cItem.id);
          return (
            <div
              key={cItem.id}
              onClick={() => toggleItem(cItem.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                isChecked
                  ? 'bg-[#FAF7F2]/60 border-[#EDE0CC] opacity-75'
                  : 'bg-white border-[#EDE0CC] hover:border-[#C4A177] shadow-2xs'
              }`}
            >
              <button
                type="button"
                className={`mt-0.5 p-1 rounded-lg transition shrink-0 ${
                  isChecked ? 'bg-[#44200F] text-[#C4A177]' : 'border border-[#EDE0CC] text-slate-300'
                }`}
              >
                {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${isChecked ? 'line-through text-slate-400' : 'text-[#44200F]'}`}>
                    {cItem.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomItem(cItem.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title={isAr ? 'حذف' : 'Remove'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-[#795037] font-medium block mt-0.5">
                  {isAr ? 'غرض شخصي مضاف' : 'Personal Custom Item'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Item Form */}
      <div className="p-4 bg-white rounded-2xl border border-[#EDE0CC] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <form onSubmit={addCustomItem} className="flex-1 w-full flex items-center gap-2">
          <input
            type="text"
            value={newCustomItemText}
            onChange={(e) => setNewCustomItemText(e.target.value)}
            placeholder={isAr ? 'أضف غرضاً إضافياً خاصاً بك (مثل: عدسات لاصقة، كتاب للقراءة...)' : 'Add custom personal item (e.g. contact lenses, reading book...)'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#EDE0CC] bg-[#FAF7F2] text-xs text-[#44200F] focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة' : 'Add'}</span>
          </button>
        </form>

        <button
          type="button"
          onClick={resetChecklist}
          className="text-xs text-slate-500 hover:text-[#44200F] font-bold flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-[#FAF7F2] transition shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعادة ضبط القائمة' : 'Reset Checklist'}</span>
        </button>
      </div>

      {/* Official Egyptian Travel Regulatory Advisories Card */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 border border-[#EDE0CC] space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <h3 className="text-sm font-bold text-[#44200F]">
            {isAr ? 'إرشادات وضوابط السفر الرسمية في مصر' : 'Official Egyptian Travel & Customs Regulations'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs items-stretch">
          <div className="h-full bg-white p-4 rounded-2xl border border-[#EDE0CC] space-y-1.5 flex flex-col">
            <span className="font-bold text-[#44200F] block">
              {isAr ? '🚫 حظر الطائرات المسيرة (الدرون)' : '🚫 Civilian Drones Strict Ban'}
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {isAr 
                ? 'يمنع القانون المصري إدخال طائرات الدرون بدون تصريح رسمي مسبق من وزارة الدفاع.' 
                : 'Civilian drones are strictly prohibited from entering Egypt without defense clearance.'}
            </p>
          </div>

          <div className="h-full bg-white p-4 rounded-2xl border border-[#EDE0CC] space-y-1.5 flex flex-col">
            <span className="font-bold text-[#44200F] block">
              {isAr ? '⚡ الكهرباء والمقابس' : '⚡ 220V European Plugs'}
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {isAr 
                ? 'الكهرباء 220 فولت بمقابس ثنائية دائرية معتادة (Europlug Type C).' 
                : 'Standard 220V 50Hz with standard European two-round-pin sockets.'}
            </p>
          </div>

          <div className="h-full bg-white p-4 rounded-2xl border border-[#EDE0CC] space-y-1.5 flex flex-col">
            <span className="font-bold text-[#44200F] block">
              {isAr ? '✈️ أوزان الطيران الداخلي' : '✈️ Domestic Flight Luggage'}
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {isAr 
                ? 'مصر للطيران للطيران الداخلي تسمح بحقيبة 23 كجم + حقيبة يد 8 كجم.' 
                : 'EgyptAir domestic flights allow 23kg checked bag + 8kg cabin bag per passenger.'}
            </p>
          </div>

          <div className="h-full bg-white p-4 rounded-2xl border border-[#EDE0CC] space-y-1.5 flex flex-col">
            <span className="font-bold text-[#44200F] block">
              {isAr ? '🚰 مياه الشرب' : '🚰 Drinking Bottled Water'}
            </span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {isAr 
                ? 'يُنصح دائماً بشرب المياه المعدنية المعبأة المتوفرة بكثرة (صافي، بركة، داساني).' 
                : 'Drink bottled mineral water (Dasani, Baraka, Safi, Nestlé) during long touring days.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
