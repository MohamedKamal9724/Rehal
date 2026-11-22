import React, { useState } from 'react';
import { 
  Volume2, BookOpen, HeartHandshake, Camera, Compass, 
  Sparkles, Coffee, ShieldCheck, CheckCircle2, Search,
  MessageCircle, HelpCircle, AlertCircle
} from 'lucide-react';
import { UILanguage } from '../../types';

interface TravelEtiquettePhrasebookProps {
  uiLang: UILanguage;
}

interface Phrase {
  id: string;
  arabic: string;
  transliteration: string;
  englishMeaning: string;
  arabicMeaning: string;
  category: 'greetings' | 'souks' | 'transport' | 'dining' | 'courtesy';
  contextEn: string;
  contextAr: string;
}

const PHRASES: Phrase[] = [
  // Greetings & Hospitality
  {
    id: 'grt-1',
    arabic: 'صباح الخير / صباح الفل',
    transliteration: 'Sabah El-Kheir / Sabah El-Fol',
    englishMeaning: 'Good morning / Morning of jasmines (warm Egyptian response)',
    arabicMeaning: 'تحية الصباح المصرية المليئة بالود والترحاب',
    category: 'greetings',
    contextEn: 'Warm morning greeting to hotel staff, felucca captains, or drivers.',
    contextAr: 'التحية الصباحية المعتادة لأطقم الفندق، قادة الفلوكة، والسائقين.'
  },
  {
    id: 'grt-2',
    arabic: 'أهلاً وسهلاً / نورت مصر',
    transliteration: 'Ahlan wa Sahlan / Nawwart Masr',
    englishMeaning: 'Welcome / You have brought light to Egypt',
    arabicMeaning: 'ترحيب حار بالضيف القادم لمصر',
    category: 'greetings',
    contextEn: 'Commonly heard upon arrival; respond with "Benourak" (With your light).',
    contextAr: 'تسمعها كثيراً من المصريين؛ الرد اللطيف عليها هو (بنورك).'
  },
  {
    id: 'grt-3',
    arabic: 'فرصة سعيدة',
    transliteration: 'Forsa Saeeda',
    englishMeaning: 'Pleasure meeting you (Happy opportunity)',
    arabicMeaning: 'سعدت بلقائك والتعرف عليك',
    category: 'greetings',
    contextEn: 'Said when parting ways with someone you just met.',
    contextAr: 'تُقال عند انتهاء الحديث أو توديع شخص تعرفت عليه للتو.'
  },
  {
    id: 'grt-4',
    arabic: 'شكراً جزيلاً',
    transliteration: 'Shokran Gazilan',
    englishMeaning: 'Thank you very much',
    arabicMeaning: 'شكر وامتنان للشخص الآخر',
    category: 'greetings',
    contextEn: 'Universal polite expression of gratitude anywhere in Egypt.',
    contextAr: 'التعبير القياسي عن الشكر والامتنان في أي مكان.'
  },

  // Courtesy & Kindness
  {
    id: 'crt-1',
    arabic: 'تسلم إيدك',
    transliteration: 'Teslam Eedak (m) / Eedik (f)',
    englishMeaning: 'Bless your hands (Thank you for making/handing this)',
    arabicMeaning: 'دعاء بالبركة لليد التي صنعت أو قدمت لك شيئاً',
    category: 'courtesy',
    contextEn: 'Very touching to say to chefs, luggage porters, or artisans.',
    contextAr: 'كلمة محبوبة جداً حين تقال للطاهي، الحمال، أو صانع الحرف اليدوية.'
  },
  {
    id: 'crt-2',
    arabic: 'من فضلك / لو سمحت',
    transliteration: 'Men Fadlak / Law Samaht',
    englishMeaning: 'Please / Excuse me',
    arabicMeaning: 'طلب الشيء بأدب وذوق رفيع',
    category: 'courtesy',
    contextEn: 'Polite preface when asking for directions, assistance, or water.',
    contextAr: 'مقدمة مهذبة عند طلب مساعدة أو توجيه أو ماء.'
  },
  {
    id: 'crt-3',
    arabic: 'ربنا يخليك',
    transliteration: 'Rabbena Yekhaleek',
    englishMeaning: 'May God protect and keep you (Heartfelt thank you)',
    arabicMeaning: 'دعاء مصري أصيل يعبر عن الشكر العميق',
    category: 'courtesy',
    contextEn: 'Warm response to anyone who went out of their way to help you.',
    contextAr: 'رد دافئ لمن قدم لك مساعدة كريمة خارج إطار الواجب.'
  },

  // Souks & Craft Markets
  {
    id: 'sk-1',
    arabic: 'بكام ده؟',
    transliteration: 'Bikam Da?',
    englishMeaning: 'How much is this item?',
    arabicMeaning: 'سؤال عن سعر القطعة المعروضة',
    category: 'souks',
    contextEn: 'Standard inquiry when browsing spices, alabaster, or papyrus.',
    contextAr: 'السؤال الأساسي عند تصفح التوابل، الألباستر، أو ورق البردي.'
  },
  {
    id: 'sk-2',
    arabic: 'شكراً، بس بتفرّج',
    transliteration: 'Shokran, Bas Batfarrag',
    englishMeaning: 'Thank you, just looking around politely',
    arabicMeaning: 'اعتذار لطيف للبائع بأنني أستمتع بالتفرج فقط',
    category: 'souks',
    contextEn: 'Friendly, gentle way to decline aggressive vendors in Khan el-Khalili.',
    contextAr: 'طريقة مهذبة ولطيفة لإبلاغ البائعين أنك تتنزه دون إحراج.'
  },
  {
    id: 'sk-3',
    arabic: 'غالي شوية يا باشا',
    transliteration: 'Ghali Shwaya Ya Basha',
    englishMeaning: 'A bit expensive, respected sir (Warm bargaining opening)',
    arabicMeaning: 'افتتاحية ودية للتفاوض بروح مرحة',
    category: 'souks',
    contextEn: 'Said with a smile when starting gentle friendly price negotiation.',
    contextAr: 'تُقال بابتسامة كمدخل ودي للتفاوض على السعر دون عصبية.'
  },
  {
    id: 'sk-4',
    arabic: 'توكلنا على الله / مبروك',
    transliteration: 'Tawakkalna Ala Allah / Mabrouk',
    englishMeaning: 'We agree on the deal / Congratulations',
    arabicMeaning: 'اتفقنا على السعر ومباركة البيع والشراء',
    category: 'souks',
    contextEn: 'Said when sealing the handshake deal on a handcrafted souvenir.',
    contextAr: 'تُقال عند التوافق التام على الشراء ومصافحة البائع.'
  },

  // Transport & Directions
  {
    id: 'trp-1',
    arabic: 'على جنب هنا لو سمحت',
    transliteration: 'Ala Gamb Hena Law Samaht',
    englishMeaning: 'Pull over to the side here, please',
    arabicMeaning: 'طلب التوقف على جانب الطريق للسائق',
    category: 'transport',
    contextEn: 'Tells the chauffeur or taxi to drop you right beside your destination.',
    contextAr: 'لطلب التوقف عند الوجهة للسائق أو التاكسي.'
  },
  {
    id: 'trp-2',
    arabic: 'على طول / طوالي',
    transliteration: 'Ala Tool / Tawali',
    englishMeaning: 'Straight ahead',
    arabicMeaning: 'السير في خط مستقيم للأمام',
    category: 'transport',
    contextEn: 'Common direction when navigating through old Cairo or Luxor alleys.',
    contextAr: 'الاتجاه للأمام مباشرة عند سؤال المارة في شوارع الأقصر أو القاهرة.'
  },
  {
    id: 'trp-3',
    arabic: 'يمين / شمال',
    transliteration: 'Yemeen / Shemal',
    englishMeaning: 'Right / Left',
    arabicMeaning: 'الاتجاه يميناً أو يساراً',
    category: 'transport',
    contextEn: 'Fundamental directional cues for your driver or walking guide.',
    contextAr: 'إشارات الاتجاه الأساسية عند المشي أو ركوب السيارة.'
  },

  // Dining & Cafés
  {
    id: 'din-1',
    arabic: 'بالهنا والشفا',
    transliteration: 'Belhana Wel-Shefa',
    englishMeaning: 'Bon appétit / With health and delight',
    arabicMeaning: 'تمني الاستمتاع بالوجبة والصحة والعافية',
    category: 'dining',
    contextEn: 'Said by servers when placing food, or by you to dining companions.',
    contextAr: 'يقولها مقدم الطعام عند تقديم الطبق، أو تقولها لرفاقك على المائدة.'
  },
  {
    id: 'din-2',
    arabic: 'الأكل تحفة / تسلم الأيادي',
    transliteration: 'El Akl Tohfa / Teslam El Ayadi',
    englishMeaning: 'The food is magnificent / Bless your culinary hands',
    arabicMeaning: 'مدح كبير لجودة ولذة الطعام',
    category: 'dining',
    contextEn: 'Huge compliment to Egyptian home-style chefs and restaurant cooks.',
    contextAr: 'ثناء رفيع يُسعد الطهاة وأصحاب المطاعم المصرية الأصيلة.'
  },
  {
    id: 'din-3',
    arabic: 'من غير شطة لو سمحت',
    transliteration: 'Men Gheir Shatta Law Samaht',
    englishMeaning: 'No spicy chili pepper, please',
    arabicMeaning: 'طلب الطعام دون فلفل حار أو بهار لاذع',
    category: 'dining',
    contextEn: 'Essential for travelers sensitive to chili when ordering Koshari.',
    contextAr: 'ضرورية للمسافرين الذين لا يفضلون الشطة الحارة عند تناول الكشري.'
  },
  {
    id: 'din-4',
    arabic: 'شاي بالنعناع / كركديه مثلج',
    transliteration: 'Shai Bel-Neana / Karkadeh Motallag',
    englishMeaning: 'Mint tea / Iced hibiscus tea',
    arabicMeaning: 'المشروبات التراثية الأكثر شهرة في مصر',
    category: 'dining',
    contextEn: 'Traditional beverages served in historic cafés like El Fishawy.',
    contextAr: 'أشهر مشروبات الضيافة في المقاهي التراثية مثل مقهى الفيشاوي.'
  }
];

export const TravelEtiquettePhrasebook: React.FC<TravelEtiquettePhrasebookProps> = ({
  uiLang
}) => {
  const isAr = uiLang === 'ar';
  const [activeMainTab, setActiveMainTab] = useState<'phrases' | 'etiquette'>('phrases');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'greetings' | 'souks' | 'transport' | 'dining' | 'courtesy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  // Text to speech function
  const speakPhrase = (phrase: Phrase) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    // Speak Arabic text
    const utterance = new SpeechSynthesisUtterance(phrase.arabic);
    utterance.lang = 'ar-EG';
    utterance.rate = 0.85; // Natural deliberate speed for learners
    
    setActiveSpeakingId(phrase.id);
    utterance.onend = () => setActiveSpeakingId(null);
    utterance.onerror = () => setActiveSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const filteredPhrases = PHRASES.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchAr = p.arabic.includes(q);
      const matchTrans = p.transliteration.toLowerCase().includes(q);
      const matchEn = p.englishMeaning.toLowerCase().includes(q);
      const matchArMeaning = p.arabicMeaning.includes(q);
      if (!matchAr && !matchTrans && !matchEn && !matchArMeaning) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner on Sand/Ivory Palette (Pure Clean Surface, Zero Overlays) */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#EDE0CC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-[#EDE0CC] text-[#795037] text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{isAr ? 'قاموس العبارات اليومية وإتيكيت السفر' : 'Bilingual Travel Etiquette & Local Phrasebook'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#44200F]">
              {isAr ? 'مرشد العبارات المصرية وآداب التعامل التراثية' : 'Egyptian Arabic Travel Phrases & Cultural Etiquette'}
            </h2>
            <p className="text-xs sm:text-sm text-[#795037] max-w-2xl leading-relaxed">
              {isAr
                ? 'تعلم أشهر العبارات المصرية اليومية المنطوقة مع طريقة نطقها الصحيحة واستمع إليها بالصوت، بالإضافة لإرشادات احترام التراث والتصوير بالمقابر والمساجد.'
                : 'Essential spoken Egyptian Arabic phrases with phonetic transliteration, audio pronunciation, and respectful cultural guidelines for monuments and markets.'}
            </p>
          </div>

          {/* Tab Switcher - Uniform h-9 */}
          <div className="flex items-center p-1 bg-white rounded-2xl border border-[#EDE0CC] shrink-0 shadow-2xs gap-1">
            <button
              type="button"
              onClick={() => setActiveMainTab('phrases')}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0 ${
                activeMainTab === 'phrases'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-[#795037] hover:bg-[#FAF7F2]'
              }`}
            >
              {isAr ? 'القاموس الصوتي' : 'Spoken Phrases'}
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('etiquette')}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center justify-center whitespace-nowrap shrink-0 ${
                activeMainTab === 'etiquette'
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'text-[#795037] hover:bg-[#FAF7F2]'
              }`}
            >
              {isAr ? 'دليل الإتيكيت والتصوير' : 'Etiquette & Customs'}
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: SPOKEN PHRASES TAB */}
      {activeMainTab === 'phrases' && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن عبارة أو كلمة...' : 'Search words or phrases...'}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] text-xs text-[#44200F] focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Category Filter Pills */}
            <div className="luxury-tab-bar flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar flex-nowrap">
              {[
                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                { id: 'greetings', labelAr: 'التحيات', labelEn: 'Greetings' },
                { id: 'courtesy', labelAr: 'الذوقيات', labelEn: 'Courtesy' },
                { id: 'souks', labelAr: 'الأسواق', labelEn: 'Souks' },
                { id: 'transport', labelAr: 'المواصلات', labelEn: 'Transport' },
                { id: 'dining', labelAr: 'الأكل والمقاهي', labelEn: 'Dining' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap cursor-pointer flex items-center justify-center ${
                    selectedCategory === cat.id
                      ? 'bg-[#44200F] text-[#C4A177]'
                      : 'bg-[#FAF7F2] text-[#795037] hover:bg-[#EDE0CC] border border-[#EDE0CC]'
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Phrases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {filteredPhrases.map(phrase => {
              const isSpeaking = activeSpeakingId === phrase.id;
              return (
                <div
                  key={phrase.id}
                  className="h-full bg-white rounded-2xl p-5 border border-[#EDE0CC] shadow-2xs hover:border-[#C4A177] hover:shadow-sm transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Row: Arabic Text & Audio Play Button */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EDE0CC]">
                      <div className="min-w-0">
                        <div className="text-xl font-extrabold text-[#44200F] leading-snug">
                          {phrase.arabic}
                        </div>
                        <div className="text-xs font-semibold text-[#795037] mt-1 italic font-mono">
                          "{phrase.transliteration}"
                        </div>
                      </div>

                      {/* Listen Button */}
                      <button
                        type="button"
                        onClick={() => speakPhrase(phrase)}
                        className={`p-2.5 rounded-xl transition shrink-0 cursor-pointer ${
                          isSpeaking 
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-[#FAF7F2] text-[#44200F] hover:bg-[#44200F] hover:text-[#C4A177] border border-[#EDE0CC]'
                        }`}
                        title={isAr ? 'استمع للنطق الصحيح' : 'Listen to audio pronunciation'}
                        aria-label="Listen"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Meaning in English & Arabic */}
                    <div className="pt-3 space-y-1">
                      <p className="text-xs font-bold text-slate-800 leading-relaxed">
                        {isAr ? phrase.arabicMeaning : phrase.englishMeaning}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? phrase.englishMeaning : phrase.arabicMeaning}
                      </p>
                    </div>
                  </div>

                  {/* Situational Context Note on Sand Surface */}
                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] text-[11px] text-[#795037] flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#C4A177] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {isAr ? phrase.contextAr : phrase.contextEn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPhrases.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#EDE0CC] p-8">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">
                {isAr ? 'لم نجد عبارات تطابق هذا البحث' : 'No phrases match your search'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CULTURAL ETIQUETTE & CUSTOMS GUIDE */}
      {activeMainTab === 'etiquette' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* CARD 1: PHOTOGRAPHY IN MONUMENTS & TOMBS */}
            <div className="h-full bg-white rounded-2xl p-6 border border-[#EDE0CC] shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#EDE0CC]">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center justify-center text-[#44200F]">
                  <Camera className="w-5 h-5 text-[#C4A177]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#44200F]">
                    {isAr ? 'قواعد التصوير بالمعابد والمقابر الأثرية' : 'Photography at Temples & Ancient Tombs'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {isAr ? 'تعليمات وزارة السياحة والآثار' : 'Ministry of Antiquities Directives'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'التصوير بالهواتف المحمولة مسموح ومجاني داخل أغلب المواقع والمتاحف الأثرية بدون رسوم إضافية.'
                      : 'Personal smartphone photography is free and permitted in most archaeological sites and museums.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'يُحظر تماماً استخدام ضوء الفلاش داخل المقابر الأثرية (مثل وادي الملوك ووادي الملكات) لحماية ألوان الجداريات التاريخية.'
                      : 'Flash photography is strictly prohibited inside tombs (Valley of the Kings/Queens) to protect 3,000-year mineral pigments.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#44200F] shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'يمنع تصوير المنشآت الأمنية أو الكباري أو نقاط التفتيش الشرطية تحت أي ظرف.'
                      : 'Never photograph military facilities, bridges, police checkpoints, or security infrastructure.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#C4A177] shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'استأذن دائماً بابتسامة قبل تصوير الأشخاص أو أصحاب الحرف في الأسواق ("ممكن صورة؟").'
                      : 'Always ask permission politely before taking portraits of locals or artisans ("Momken soora?").'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: SACRED SITES & HISTORICAL MOSQUES */}
            <div className="h-full bg-white rounded-2xl p-6 border border-[#EDE0CC] shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#EDE0CC]">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center justify-center text-[#44200F]">
                  <Compass className="w-5 h-5 text-[#C4A177]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#44200F]">
                    {isAr ? 'آداب زيارة المساجد التاريخية والأماكن التراثية' : 'Etiquette at Historic Mosques & Churches'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {isAr ? 'القاهرة التاريخية ومصر القديمة' : 'Historic Cairo & Coptic Heritage'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'خلع الأحذية عند عتبة المسجد (تتوفر أكياس خفيفة لحمل الحذاء معك أو وضعه بالأرفف المخصصة).'
                      : 'Remove shoes at the mosque threshold (shoe bags are provided or store them in numbered shelves).'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'ارتداء ملابس محتشمة تغطي الكتفين والركبتين للرجال والسيدات، وتغطية الرأس بوشاح خفيف للسيدات عند زيارة مساجد كالأزهر والسلطان حسن.'
                      : 'Modest dress covering shoulders and knees for everyone; women cover their hair with a light scarf in active mosques.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#44200F] shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'تجنب المرور مباشرة أمام المصلين أثناء تأدية الصلاة، وخفض الصوت تقديراً للسكينة والخشوع.'
                      : 'Avoid walking directly in front of worshippers during prayer, and maintain a quiet, respectful voice.'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: HOSPITALITY & TRADITIONS */}
            <div className="h-full bg-white rounded-2xl p-6 border border-[#EDE0CC] shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#EDE0CC]">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center justify-center text-[#44200F]">
                  <Coffee className="w-5 h-5 text-[#C4A177]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#44200F]">
                    {isAr ? 'كرم الضيافة المصرية وتقاليد الشاي' : 'Hospitality & Traditional Tea Offerings'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {isAr ? 'عادات القرى النوبية والأسواق' : 'Nubian Villages & Bazaars'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'قبول كوب الشاي بالنعناع أو الكركديه هو علامة مودة وكرم ضيافة، وليس شرطاً للشراء في المحلات والبازارات.'
                      : 'Accepting a cup of mint tea or karkadeh is an offering of warmth and hospitality, not an obligation to purchase.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'استخدام اليد اليمنى عند تناول الطعام أو إعطاء الأشياء للآخرين وفق العادات التراثية.'
                      : 'Using your right hand when greeting, eating, or handing items to others aligns with local tradition.'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 4: SOUK NEGOTIATION ETHICS */}
            <div className="h-full bg-white rounded-2xl p-6 border border-[#EDE0CC] shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#EDE0CC]">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] flex items-center justify-center text-[#44200F]">
                  <HeartHandshake className="w-5 h-5 text-[#C4A177]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#44200F]">
                    {isAr ? 'فن التعامل اللطيف في الأسواق الشعبية' : 'Art of Gentle Souk Interaction'}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {isAr ? 'خان الخليلي وسوق الأقصر السياحي' : 'Khan el-Khalili & Luxor Bazaars'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'التفاوض في الأسواق هو حوار اجتماعي ودود مبني على الابتسامة وليس صراعاً؛ حافظ على المرح واللباقة.'
                      : 'Bargaining in Egyptian souks is a friendly social interaction built on humor and smiles, never confrontation.'}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isAr 
                      ? 'إذا لم تكن راغباً بالشراء، يمكنك الاعتذار بابتسامة وهدوء بقول "شكراً، بس بتفرّج" وسيمر الأمر بكل احترام.'
                      : 'If not interested, decline with a warm smile and "Shokran, bas batfarrag" (Thank you, just looking).'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
