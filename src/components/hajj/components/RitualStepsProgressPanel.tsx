import React, { useState } from 'react';
import { 
  HeartHandshake, CheckCircle2, Circle, Clock, MapPin, 
  Sparkles, Footprints, ShieldCheck, ExternalLink, Compass, 
  Volume2, BookOpen, AlertCircle, Users, Check, ChevronDown, 
  ChevronUp, Award, Layers
} from 'lucide-react';
import { UILanguage } from '../../../types';
import { PilgrimageGroup } from '../HajjUmrahView';
import { SectionHelpTrigger } from '../../common/SectionHelpTrigger';

export interface RitualStepDefinition {
  id: string;
  stepNumber: number;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  pillarCategoryAr: string;
  pillarCategoryEn: string;
  locationNameEn: string;
  locationNameAr: string;
  locationZoneEn: string;
  locationZoneAr: string;
  lat: number;
  lng: number;
  recommendedHoursEn: string;
  recommendedHoursAr: string;
  expectedDurationMinutes: number;
  duaaArabic: string;
  duaaTranslationEn: string;
  duaaAudioCue: string;
  locationSpecificAdviceAr: string[];
  locationSpecificAdviceEn: string[];
  operatorFieldChecklistAr: string[];
  operatorFieldChecklistEn: string[];
  wheelchairAccessAr: string;
  wheelchairAccessEn: string;
}

export const UMRAH_RITUAL_STEPS_CATALOG: RitualStepDefinition[] = [
  {
    id: 'umrah-step-1',
    stepNumber: 1,
    titleEn: 'Ihram & Niyyah at Miqat',
    titleAr: 'الإحرام والنية وتلبية العمرة عند الميقات',
    subtitleEn: 'Sacred state of purity and boundary declaration',
    subtitleAr: 'التجرد لله وإعلان الدخول في النسك من الميقات الشرعي',
    pillarCategoryAr: 'ركن الإحرام الأول',
    pillarCategoryEn: 'Pillar 1: Ihram',
    locationNameEn: 'Miqat Boundary (Air/Land Corridor)',
    locationNameAr: 'الميقات الشرعي (محاذاة رابغ والجحفة أو مسجد التنعيم)',
    locationZoneEn: 'Air Corridor 20m before Miqat / Al-Taneem Mosque (7.5 km)',
    locationZoneAr: 'الممر الجوي قبل الميقات بـ ٢٠ دقيقة أو ميقات التنعيم (٧.٥ كم)',
    lat: 21.4933,
    lng: 39.7967,
    recommendedHoursEn: 'Before flight descent or at departure terminal',
    recommendedHoursAr: 'قبل الهبوط الجوي بـ ٢٠ دقيقة أو في الصباح الباكر',
    expectedDurationMinutes: 45,
    duaaArabic: 'لَبَّيْكَ اللَّهُمَّ عُمْرَةً، لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لا شَرِيكَ لَكَ',
    duaaTranslationEn: 'Here I am, O Allah, intending Umrah. Here I am at Your service, You have no partner. Truly all praise, grace, and sovereignty belong to You.',
    duaaAudioCue: 'Continuous Talbiyah until sighting the Holy Kaaba',
    locationSpecificAdviceAr: [
      'للقادمين جواً: يتم تنبيه الفوج لارتداء ثياب الإحرام من مطار الإقلاع، وعقد النية والتلبية عند إعلان قائد الطائرة بمحاذاة الميقات.',
      'للمعتمرين المقيمين بمكة: يتم التفويج بحافلات الشركة إلى مسجد السيدة عائشة بالتنعيم للإحرام وصلاة ركعتي السنة.',
      'تجنب المحظورات: التنبيه على الرجال بعدم تغطية الرأس أو لبس المخيط، وتجنب الطيب وقص الشعر والأظافر.',
    ],
    locationSpecificAdviceEn: [
      'For air arrivals: Ensure all male pilgrims change into Ihram garments at departure airport; declare Niyyah when pilot announces overflying the Miqat.',
      'For residents in Makkah: Dispatch via air-conditioned buses to Masjid Aisha (Al-Taneem) for wudu and Ihram prayers.',
      'Strict adherence to Ihram restrictions: No stitched clothing or head coverings for men; no perfumed soaps or nail trimming.',
    ],
    operatorFieldChecklistAr: [
      'التأكد من ارتداء جميع الحجاج لأساور المعصم التعريفية الخاصة بالفوج برقم الطوارئ.',
      'توزيع حقائب الإحرام والأكياس القماشية لحفظ الأحذية قبل دخول ساحات الحرم.',
      'التأكيد على هواتف المرشدين الدينيين والمطوف في مجموعة الواتساب الميدانية.',
    ],
    operatorFieldChecklistEn: [
      'Verify all pilgrims wear company wristbands with emergency contacts.',
      'Distribute shoe pouches before entering the Grand Mosque courtyards.',
      'Broadcast lead guide and Mutawwif mobile numbers to the group chat.',
    ],
    wheelchairAccessAr: 'تتوفر مرافق متوافقة لذوي الاحتياجات الخاصة ومسارات مجهزة بميقات التنعيم.',
    wheelchairAccessEn: 'Full ramp access and accessible ablution facilities available at Miqat stations.',
  },
  {
    id: 'umrah-step-2',
    stepNumber: 2,
    titleEn: 'Tawaf Al-Umrah (7 Circuits Around Kaaba)',
    titleAr: 'طواف العمرة (سبعة أشواط حول الكعبة المشرفة)',
    subtitleEn: 'Circumambulation starting at the Black Stone alignment',
    subtitleAr: 'الطواف جاعلاً الكعبة المشرفة عن يساره وصلاة ركعتي الطواف',
    pillarCategoryAr: 'ركن الطواف الثاني',
    pillarCategoryEn: 'Pillar 2: Tawaf',
    locationNameEn: 'The Mataf Floor & Upper Circuits — Al-Masjid Al-Haram',
    locationNameAr: 'صحن المطاف والأدوار المكيفة — المسجد الحرام',
    locationZoneEn: 'Central Sanctuary Mataf Floor (0m) & Mezzanine Electric Cart Deck',
    locationZoneAr: 'صحن المطاف الأرضي ومسار العربات الكهربائية بالدور الأول',
    lat: 21.4225,
    lng: 39.8262,
    recommendedHoursEn: '07:30 AM - 10:30 AM or 11:30 PM - 03:00 AM (Cooler)',
    recommendedHoursAr: 'الضحى (٠٧:٣٠ - ١٠:٣٠ ص) أو منتصف الليل (١١:٣٠ م - ٠٣:٠٠ ص)',
    expectedDurationMinutes: 75,
    duaaArabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ · سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلا إِلَهَ إِلا اللَّهُ، وَاللَّهُ أَكْبَرُ',
    duaaTranslationEn: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.',
    duaaAudioCue: 'Recited between the Yemeni Corner (Rukn Yamani) and Black Stone',
    locationSpecificAdviceAr: [
      'نقطة التجمع: بوابة الملك عبد العزيز (رقم ١) أو بوابة أجياد لتفويج المعتمرين معاً.',
      'كبار السن وذوي الإعاقة: توجيههم لمصاعد جسر أجياد لاستخدام العربات الكهربائية الذكية المعتمدة بالدور الأول.',
      'تجنب الازدحام: عدم التدافع لتقبيل الحجر الأسود، ويكتفي الحاج بالإشارة والتكبير من محاذاة الخط الأخضر/الإضاءة الجدارية.',
      'صلاة ركعتي الطواف: الصلاة خلف مقام إبراهيم إن تيسر أو في أي موضع من رحاب الحرم الشريف ثم شرب ماء زمزم.',
    ],
    locationSpecificAdviceEn: [
      'Group assembly point: King Abdulaziz Gate (Gate 1) or Ajyad Gate for synchronized entry.',
      'Elderly pilgrims: Direct to Ajyad Bridge elevators for smart electric buggies on the 1st Mezzanine floor.',
      'Crowd safety: Do not push towards the Black Stone; wave hand towards the green indicator lights with Bismillah Allahu Akbar.',
      'Pray 2 Rak\'ahs behind Maqam Ibrahim or anywhere in the sanctuary, followed by drinking blessed Zamzam water.',
    ],
    operatorFieldChecklistAr: [
      'رفع الراية الإرشادية الخاصة بالفوج (اللون الذهبي والأسود) لضمان عدم انفصال المعتمرين.',
      'التأكد من اضطباع الرجال (كشف الكتف الأيمن) في طواف العمرة فقط.',
      'حصر عدد المعتمرين عند نهاية الشوط السابع قبل التوجه للمسعى.',
    ],
    operatorFieldChecklistEn: [
      'Hold company colored guidance flag high to prevent pilgrim dispersion.',
      'Ensure male pilgrims perform Idtiba (uncovering right shoulder) for Tawaf circuits.',
      'Headcount confirmation after the 7th circuit prior to proceeding to Safa.',
    ],
    wheelchairAccessAr: 'مسار مخصص بالكامل للعربات الكهربائية بالدور الأول (عربات فردية وثنائية مرخصة).',
    wheelchairAccessEn: 'Dedicated smart electric cart lanes on Mezzanine floor (single & double carts).',
  },
  {
    id: 'umrah-step-3',
    stepNumber: 3,
    titleEn: 'Sa\'i between Safa & Marwah (7 Laps)',
    titleAr: 'السعي بين الصفا والمروة (سبعة أشواط كاملة)',
    subtitleEn: 'Walking in the footsteps of Lady Hajar',
    subtitleAr: 'السعي ابتداءً من جبل الصفا وانتهاءً بجبل المروة',
    pillarCategoryAr: 'ركن السعي الثالث',
    pillarCategoryEn: 'Pillar 3: Sa\'i',
    locationNameEn: 'The Masa\'a Corridor — Grand Mosque Extension',
    locationNameAr: 'المسعى الشريف — المسجد الحرام (مكيف بالكامل)',
    locationZoneEn: 'Corridor connecting Mount Safa and Mount Marwah (3.15 km total)',
    locationZoneAr: 'رواق المسعى الممتد بين جبلي الصفا والمروة بطول إجمالي ٣.١٥ كم',
    lat: 21.4230,
    lng: 39.8270,
    recommendedHoursEn: 'Directly after Tawaf; corridors are fully air-conditioned',
    recommendedHoursAr: 'عقب الطواف مباشرة؛ أروقة المسعى مكيفة وتضم برادات زمزم',
    expectedDurationMinutes: 60,
    duaaArabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ ۖ فَمَنْ حَجَّ الْبَيْتَ أَوِ اعْتَمَرَ فَلَا جُنَاحَ عَلَيْهِ أَن يَطَّوَّفَ بِهِمَا · لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ',
    duaaTranslationEn: 'Indeed, Safa and Marwah are among the symbols of Allah. There is no deity except Allah alone; He fulfilled His promise, granted victory to His servant, and defeated the allied clans alone.',
    duaaAudioCue: 'Recited facing the Kaaba upon ascending Mount Safa and Mount Marwah',
    locationSpecificAdviceAr: [
      'بداية السعي: الصعود على جبل الصفا واستقبال الكعبة والتكبير والدعاء ثلاث مرات.',
      'الأميال الخضراء: الهرولة الخفيفة للرجال فقط بين العلمين الأخضرين، ويمشي النساء بسكينة ووقار.',
      'الأشواط السبعة: من الصفا إلى المروة يُحسب شوطاً أولاً، ومن المروة إلى الصفا شوطاً ثانياً، وتكتمل في المروة.',
      'نقاط زمزم: موزعة كل ٥٠ متراً على طول المسعى لترطيب الحجاج والمعتمرين.',
    ],
    locationSpecificAdviceEn: [
      'Ascend Mount Safa, face the direction of the Holy Kaaba, make Takbeer and heartfelt supplication 3 times.',
      'Green fluorescent lights: Jogging lightly for men only between the two green markers; women walk calmly.',
      '7 Laps: Safa to Marwah is Lap 1; Marwah to Safa is Lap 2; ending completely on Marwah on Lap 7.',
      'Zamzam dispensers stationed every 50 meters along the side corridors for continuous hydration.',
    ],
    operatorFieldChecklistAr: [
      'توجيه المشرفين لمرافقة كبار السن بالمسار الأوسط المخصص للكراسي المتحركة.',
      'التأكد من إتمام المعتمرين للشوط السابع عند قمة المروة دون خطأ في العد.',
      'التجمع النهائي عند ساحة الخروج بباب المروة (بوابة رقم ٢٨).',
    ],
    operatorFieldChecklistEn: [
      'Assign logistics staff to guide elderly members along the central wheelchair corridor.',
      'Verify 7 complete laps ending on Mount Marwah.',
      'Reassemble group at the Marwah courtyard exit (Gate 28).',
    ],
    wheelchairAccessAr: 'مسار أوسط محمي ومكيف ومخصص بالكامل للكراسي المدفوعة والعربات الكهربائية.',
    wheelchairAccessEn: 'Separated central air-conditioned lane dedicated exclusively for wheelchairs and push-carts.',
  },
  {
    id: 'umrah-step-4',
    stepNumber: 4,
    titleEn: 'Halq or Taqseer (Release from Ihram)',
    titleAr: 'الحلق أو التقصير والتحلل المبارك من الإحرام',
    subtitleEn: 'Shaving or trimming hair, completing the Umrah',
    subtitleAr: 'حلق شعر الرأس أو تقصيره، وتمام مناسك العمرة بحمد الله',
    pillarCategoryAr: 'واجب التحلل الرابع',
    pillarCategoryEn: 'Step 4: Release / Tahallul',
    locationNameEn: 'Marwah Plazas & Clock Tower Hygienic Barber Complex',
    locationNameAr: 'صالونات الحلاقة الصحية المعتمدة بساحات المروة وأبراج البيت',
    locationZoneEn: 'Immediate Courtyard Outside Marwah Exit Gate 28',
    locationZoneAr: 'الساحات الخارجية المباشرة عند مخرج باب المروة',
    lat: 21.4240,
    lng: 39.8275,
    recommendedHoursEn: 'Immediately following the completion of Sa\'i at Marwah',
    recommendedHoursAr: 'عقب الانتهاء من شوط السعي السابع بالمروة',
    expectedDurationMinutes: 20,
    duaaArabic: 'الْحَمْدُ لِلَّهِ الَّذِي قَضَى عَنَّا نُسُكَنَا وَتَقَبَّلَ مِنَّا، اللَّهُمَّ زِدْنَا إِيمَانًا وَيَقِينًا وَتَوْفِيقًا، اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ وَالْمُقَصِّرِينَ',
    duaaTranslationEn: 'Praise be to Allah Who has enabled us to fulfill our rites and accepted them from us. O Allah, increase us in faith, conviction, and success. O Allah, forgive those who shave their heads and those who trim.',
    duaaAudioCue: 'Prophetic Du\'aa for pilgrims upon release from Ihram',
    locationSpecificAdviceAr: [
      'الرجال: الحلق بالموس هو الأفضل والأعظم ثواباً (دعا النبي ﷺ للمحلقين ثلاثاً)، أو التقصير من سائر أنحاء الرأس.',
      'النساء: أخذ قدر أنملة (حوالي ١.٥ سم) من أطراف ضفائر الشعر في مكان مستور داخل الفندق أو المصلى.',
      'الصالونات المعتمدة: التنبيه على الحجاج باستخدام الصالونات البلدية المرخصة ذات الأدوات المعقمة ذات الاستخدام الواحد لتفادي العدوى.',
      'التحلل الكامل: عقب الحلق أو التقصير يحل للمعتمر كل ما حُرّم عليه بالإحرام وتتم العمرة مباركة.',
    ],
    locationSpecificAdviceEn: [
      'Men: Halq (shaving head clean) carries the highest spiritual reward; Taqseer (uniform trim from all sides) is permissible.',
      'Women: Trim the length of one fingertip (~1.5 cm) from hair ends in a private sanctuary prayer hall or hotel room.',
      'Licensed barbers: Ensure all pilgrims use municipal-certified barbershops equipped with single-use sterile blades.',
      'Full release: With hair trimming complete, all Ihram restrictions are lifted, concluding the Umrah.',
    ],
    operatorFieldChecklistAr: [
      'مرافقة المعتمرين للصالونات المعتمدة بأسفل أبراج البيت أو ساحة المروة.',
      'تأكيد عودة الفوج للفندق بسلام والاطمئنان على راحة كبار السن.',
      'تسجيل إتمام العمرة رسمياً في سجل عمليات ريحال الميداني.',
    ],
    operatorFieldChecklistEn: [
      'Escort group to certified barbershop complexes beneath Abraj Al-Bait / Marwah Plaza.',
      'Verify safe return of all pilgrims to their assigned hotel rooms.',
      'Log official completion of Umrah rites in the RIHAL operations manifest.',
    ],
    wheelchairAccessAr: 'كافة صالونات ساحة المروة مجهزة بمصاعد ومنحدرات وصول مستوية للكراسي المتحركة.',
    wheelchairAccessEn: 'Elevator and step-free access available to all authorized municipal barbershops.',
  },
];

export const HAJJ_RITUAL_STEPS_CATALOG: RitualStepDefinition[] = [
  {
    id: 'hajj-step-1',
    stepNumber: 1,
    titleEn: 'Day of Tarwiyah in Mina (8th Dhul-Hijjah)',
    titleAr: 'يوم التروية بمشعر منى (٨ ذو الحجة)',
    subtitleEn: 'Departure to Mina tent city in state of Ihram',
    subtitleAr: 'الانطلاق إلى منى بملابس الإحرام وصلاة الظهر والعصر والمغرب والعشاء وفجر ٩',
    pillarCategoryAr: 'سنة يوم التروية',
    pillarCategoryEn: 'Sunnah: Tarwiyah',
    locationNameEn: 'Mina Sacred Valley — Official Tents Zone',
    locationNameAr: 'مشعر منى — مخيمات وفود الشركة الرسمية',
    locationZoneEn: 'Zone 4 / Air-conditioned Mina Tents (6.5 km from Haram)',
    locationZoneAr: 'منطقة ٤ المطورة بمشعر منى (٦.٥ كم عن الحرم)',
    lat: 21.4138,
    lng: 39.8732,
    recommendedHoursEn: 'Morning of 8th Dhul-Hijjah (after Fajr/Sunrise)',
    recommendedHoursAr: 'صباح اليوم الثامن من ذي الحجة بعد شروق الشمس',
    expectedDurationMinutes: 720,
    duaaArabic: 'لَبَّيْكَ حَجًّا، لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لا شَرِيكَ لَكَ',
    duaaTranslationEn: 'Here I am, O Allah, intending Hajj. Here I am at Your service, You have no partner.',
    duaaAudioCue: 'Continuous Hajj Talbiyah during transit to Mina',
    locationSpecificAdviceAr: [
      'التفويج من فنادق مكة عبر المسارات الترددية المعتمدة لقطار المشاعر أو حافلات VIP المكيفة.',
      'المبيت بمنى سنة مؤكدة؛ قصر الصلوات الرباعية ركعتين في أوقاتها دون جمع.',
      'التأكد من كفاية مياه الشرب والوجبات الصحية داخل المخيمات المخصصة.',
    ],
    locationSpecificAdviceEn: [
      'Dispatch from Makkah hotels via dedicated shuttle bus routes or Al-Mashaaer Metro.',
      'Overnight stay in Mina is confirmed Sunnah; shorten four-rak\'ah prayers to two at their appointed times without combining.',
      'Verify tent bed assignments and water replenishment inside allocated camps.',
    ],
    operatorFieldChecklistAr: [
      'توزيع بطاقات نسك الذكية وتأكيد بصمة الدخول لبوابات مخيمات منى.',
      'التأكد من التغذية الكهربائية والتكييف المركزي في خيام الفوج.',
    ],
    operatorFieldChecklistEn: [
      'Scan smart Nusuk cards at Mina camp entry checkpoints.',
      'Inspect climate control and medical supplies in delegation tents.',
    ],
    wheelchairAccessAr: 'مسارات ممهدة وعربات جولف داخلية لنقل كبار السن بين الخيام.',
    wheelchairAccessEn: 'Paved walkways and internal electric golf carts for elderly transport.',
  },
  {
    id: 'hajj-step-2',
    stepNumber: 2,
    titleEn: 'Wuquf at Mount Arafat (9th Dhul-Hijjah)',
    titleAr: 'الوقوف بصعيد عرفات الطاهر (٩ ذو الحجة — ركن الحج الأعظم)',
    subtitleEn: 'The pinnacle of Hajj: "Hajj is Arafah"',
    subtitleAr: 'الوقوف بين يدي الله بعرفات، وصلاة الظهر والعصر جمعاً وقصراً بمسجد نمرة',
    pillarCategoryAr: 'ركن الحج الأعظم',
    pillarCategoryEn: 'Pillar: Greatest Day of Arafah',
    locationNameEn: 'Plains of Mount Arafat & Jabal Al-Rahmah',
    locationNameAr: 'صعيد عرفات الطاهر وجبل الرحمة ومسجد نمرة',
    locationZoneEn: 'Central Arafat Valley (20 km from Holy Makkah)',
    locationZoneAr: 'صعيد عرفات الممتد وجبل الرحمة (٢٠ كم شرق مكة)',
    lat: 21.3547,
    lng: 39.9842,
    recommendedHoursEn: 'From Dhuhr until Sunset of 9th Dhul-Hijjah',
    recommendedHoursAr: 'من زوال الشمس (صلاة الظهر) وحتى غروب شمس يوم عرفة',
    expectedDurationMinutes: 480,
    duaaArabic: 'لا إِلَهَ إِلا اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ · اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    duaaTranslationEn: 'There is no deity except Allah alone without partner. To Him belongs all sovereignty and praise, and He has power over all things.',
    duaaAudioCue: 'The greatest Du\'aa on the Day of Arafah',
    locationSpecificAdviceAr: [
      'التحقق من الوجود داخل حدود عرفات الشرعية الموضحة باللوحات الإرشادية الكبيرة ذات اللون الأصفر.',
      'الجمع والقصر: صلاة الظهر والعصر جمع تقديم بأذان وإقامتين بمسجد نمرة أو داخل الخيام.',
      'التفرغ التام للذكر والاستغفار والدعاء حتى غروب الشمس؛ عدم الانشغال بالصعود الشاق لجبل الرحمة.',
    ],
    locationSpecificAdviceEn: [
      'Confirm positioning within legal boundary markers of Arafat demarcated by large yellow road signs.',
      'Combine and shorten Dhuhr and Asr prayers at Dhuhr time with one Adhan and two Iqamas.',
      'Dedicate the entire afternoon to heartfelt supplication; avoid exhausting climbs up Mount of Mercy in high heat.',
    ],
    operatorFieldChecklistAr: [
      'تجهيز الحافلات لمرحلة الإفاضة إلى مزدلفة قبل أذان المغرب بنصف ساعة.',
      'التأكد من وجود طبيب الحملة وحقائب الإسعاف ومظلات الوقاية من الشمس.',
    ],
    operatorFieldChecklistEn: [
      'Prepare shuttle buses for Nafrah (departure) to Muzdalifah 30 mins before sunset.',
      'Ensure field physician and oral rehydration salts are accessible in every tent.',
    ],
    wheelchairAccessAr: 'خيام مجهزة بكراسي خاصة ومسارات مباشرة لحافلات النقل الترددي.',
    wheelchairAccessEn: 'Fully accessible shaded tents and low-floor shuttle boarding platforms.',
  },
  {
    id: 'hajj-step-3',
    stepNumber: 3,
    titleEn: 'Overnight at Muzdalifah (Night of 10th)',
    titleAr: 'المبيت بمزدلفة وجمع الحصى (ليلة العاشر من ذي الحجة)',
    subtitleEn: 'Combining Maghrib and Isha, gathering pebbles for Jamarat',
    subtitleAr: 'الإفاضة إلى مشعر مزدلفة، وصلاة المغرب والعشاء جمعاً وقصراً، وجمع الحصى',
    pillarCategoryAr: 'واجب المبيت بمزدلفة',
    pillarCategoryEn: 'Wajib: Muzdalifah Night',
    locationNameEn: 'Sacred Grounds of Muzdalifah (Al-Mash\'ar Al-Haram)',
    locationNameAr: 'مشعر مزدلفة والمشعر الحرام',
    locationZoneEn: 'Between Arafat and Mina (9.5 km from Makkah)',
    locationZoneAr: 'بين صعيد عرفات ووادي منى (٩.٥ كم)',
    lat: 21.3850,
    lng: 39.9050,
    recommendedHoursEn: 'From arrival post-sunset until Fajr prayer of 10th (midnight for weak/elderly)',
    recommendedHoursAr: 'عقب وصول الإفاضة بعد الغروب وحتى طلوع فجر يوم النحر',
    expectedDurationMinutes: 360,
    duaaArabic: 'فَإِذَا أَفَضْتُم مِّنْ عَرَفَاتٍ فَاذْكُرُوا اللَّهَ عِندَ الْمَشْعَرِ الْحَرَامِ ۖ وَاذْكُرُوهُ كَمَا هَدَاكُمْ · اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا، وَذَنْبًا مَغْفُورًا',
    duaaTranslationEn: 'When you depart from Arafat, remember Allah at the Sacred Monument. And remember Him as He has guided you.',
    duaaAudioCue: 'Supplication at Al-Mash\'ar Al-Haram Mosque in Muzdalifah',
    locationSpecificAdviceAr: [
      'صلاة المغرب ثلاث ركعات والعشاء ركعتين جمع تأخير فور الوصول لمزدلفة بأذان وإقامتين.',
      'جمع ٧٠ حصاة صغيرة (بحجم حبة الحمص) لرمي الجمرات طوال أيام التشريق.',
      'الرخصة لكبار السن والنساء والمرضى بالإفاضة من مزدلفة بعد منتصف الليل توقياً للزحام.',
    ],
    locationSpecificAdviceEn: [
      'Perform Maghrib (3 rak\'ahs) and Isha (2 rak\'ahs) combined upon arrival with one Adhan and two Iqamas.',
      'Gather small pea-sized pebbles (70 pebbles total) for the upcoming days of Jamarat stoning.',
      'Dispensation for elderly, sick, and women to leave Muzdalifah after midnight to avoid heavy morning crowds.',
    ],
    operatorFieldChecklistAr: [
      'توزيع سجادات النوم الخفيفة وحقائب حفظ الحصى المخصصة للمعتمرين.',
      'تأكيد انطلاق حافلات كبار السن عند الساعة الواحدة صباحاً لتفادي الزحام.',
    ],
    operatorFieldChecklistEn: [
      'Distribute sterile pebble pouches and sleeping mats to all pilgrims.',
      'Coordinate midnight bus departure for elderly and vulnerable cohorts.',
    ],
    wheelchairAccessAr: 'ساحات مفتوحة ممهدة بالقرب من مسارات الحافلات ومحطات قطار المشاعر.',
    wheelchairAccessEn: 'Paved boarding ramps adjacent to Al-Mashaaer Metro station 3.',
  },
  {
    id: 'hajj-step-4',
    stepNumber: 4,
    titleEn: 'Stoning Jamarat Al-Aqaba & Nahr (10th Dhul-Hijjah)',
    titleAr: 'رمي جمرة العقبة الكبرى ونحر الهدي والتحلل الأول',
    subtitleEn: 'Stoning the major pillar with 7 pebbles on Eid morning',
    subtitleAr: 'رمي الجمرة الكبرى بسبع حصيات مع التكبير، ونحر الهدي، والتحلل الأصغر',
    pillarCategoryAr: 'واجبات يوم النحر',
    pillarCategoryEn: 'Day of Eid: Stoning & Sacrifice',
    locationNameEn: 'The Multi-Tier Jamarat Bridge Facility',
    locationNameAr: 'منشأة جسر الجمرات الحديثة بمشعر منى',
    locationZoneEn: 'Jamarat Facility 3rd Floor Air-conditioned Deck',
    locationZoneAr: 'الدور الثالث المكيف بجسر الجمرات',
    lat: 21.4190,
    lng: 39.8680,
    recommendedHoursEn: 'Duha to Afternoon of 10th Dhul-Hijjah (scheduled Nusuk group slot)',
    recommendedHoursAr: 'وقت الضحى وحتى العصر وفق جدول التفويج المعتمد بمنصة نسك',
    expectedDurationMinutes: 90,
    duaaArabic: 'بِسْمِ اللَّهِ، اللَّهُ أَكْبَرُ، رَغْمًا لِلشَّيْطَانِ وَرِضًا لِلرَّحْمَنِ، اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا، وَسَعْيًا مَشْكُورًا، وَذَنْبًا مَغْفُورًا',
    duaaTranslationEn: 'In the name of Allah, Allah is the Greatest, in defiance of Satan and to please the Most Gracious. O Allah, make it an accepted Hajj.',
    duaaAudioCue: 'Takbeer with each thrown pebble: Allahu Akbar',
    locationSpecificAdviceAr: [
      'رمي ٧ حصيات متعاقبات في حوض جمرة العقبة الكبرى فقط في يوم العيد مع التكبير مع كل حصاة.',
      'الالتزام الصارم بالمسار والوقت المخصص للفوج في تطبيق نسك دون مخالفة أوقات الحظر.',
      'عقب الرمي والنحر والحلق يتحلل الحاج التحلل الأول (الأصغر) ويحل له كل شيء إلا النساء.',
    ],
    locationSpecificAdviceEn: [
      'Stone only the major pillar (Jamarat Al-Aqaba) with 7 consecutive pebbles while saying Allahu Akbar with each throw.',
      'Strict adherence to the company\'s assigned time window in the Nusuk dispatch system.',
      'Upon stoning and hair trimming, the first release (Tahallul Asghar) is achieved.',
    ],
    operatorFieldChecklistAr: [
      'التأكد من دفع صكوك الهدي والأضاحي مسبقاً عبر منصة إحسان / مشروع المملكة للإفادة من الهدي.',
      'تنظيم طابور الفوج خلف مرشدين اثنين ومطوف لتفادي التدافع بالجسور.',
    ],
    operatorFieldChecklistEn: [
      'Verify electronic Hajj sacrificial vouchers paid through the official Saudi Project.',
      'Maintain compact dual-guide escort formations across Jamarat pedestrian bridges.',
    ],
    wheelchairAccessAr: 'مسارات كهربائية ومصاعد برجية مباشرة لكافة أدوار منشأة الجمرات.',
    wheelchairAccessEn: 'High-speed elevator towers providing direct wheelchair access to all 5 bridge levels.',
  },
];

interface RitualStepsProgressPanelProps {
  uiLang: UILanguage;
  groups: PilgrimageGroup[];
  onSwitchToZiyaratMap?: () => void;
}

export const RitualStepsProgressPanel: React.FC<RitualStepsProgressPanelProps> = ({
  uiLang,
  groups,
  onSwitchToZiyaratMap,
}) => {
  const isAr = uiLang === 'ar';
  const [selectedRiteType, setSelectedRiteType] = useState<'umrah' | 'hajj'>('umrah');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || 'grp-01');
  const [copiedDuaaId, setCopiedDuaaId] = useState<string | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(
    selectedRiteType === 'umrah' ? 'umrah-step-1' : 'hajj-step-1'
  );

  // Group Progress Storage (State-driven per group)
  const [groupProgress, setGroupProgress] = useState<Record<string, Record<string, boolean>>>({
    'grp-01': { 'umrah-step-1': true, 'umrah-step-2': true, 'umrah-step-3': false, 'umrah-step-4': false },
    'grp-02': { 'umrah-step-1': true, 'umrah-step-2': true, 'umrah-step-3': true, 'umrah-step-4': true },
    'grp-03': { 'umrah-step-1': true, 'umrah-step-2': false, 'umrah-step-3': false, 'umrah-step-4': false },
    'grp-04': { 'umrah-step-1': false, 'umrah-step-2': false, 'umrah-step-3': false, 'umrah-step-4': false },
    'grp-05': { 'umrah-step-1': true, 'umrah-step-2': false, 'umrah-step-3': false, 'umrah-step-4': false },
    'grp-06': { 'umrah-step-1': true, 'umrah-step-2': true, 'umrah-step-3': true, 'umrah-step-4': false },
  });

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];
  const steps = selectedRiteType === 'umrah' ? UMRAH_RITUAL_STEPS_CATALOG : HAJJ_RITUAL_STEPS_CATALOG;

  // Toggle ritual step completed status
  const handleToggleStep = (stepId: string) => {
    setGroupProgress(prev => {
      const currentGroupSteps = prev[selectedGroupId] || {};
      const newStatus = !currentGroupSteps[stepId];
      return {
        ...prev,
        [selectedGroupId]: {
          ...currentGroupSteps,
          [stepId]: newStatus,
        },
      };
    });
  };

  // Calculate completion percentage for currently selected group
  const currentGroupSteps = groupProgress[selectedGroupId] || {};
  const completedCount = steps.filter(s => currentGroupSteps[s.id]).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleCopyDuaa = (duaa: string, id: string) => {
    navigator.clipboard.writeText(duaa);
    setCopiedDuaaId(id);
    setTimeout(() => setCopiedDuaaId(null), 2000);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* =========================================================================
          TOP BANNER: GROUP SELECTOR & PROGRESS COCKPIT (LIGHT HIJAZI IVORY & EMERALD)
         ========================================================================= */}
      <div className="bg-gradient-to-br from-[#FAF8F5] via-[#FFFDF9] to-[#F3ECE1] border border-[#E5D5B5] rounded-3xl p-5 sm:p-7 text-[#44200F] shadow-2xs relative overflow-hidden">
        <div className="relative z-10 space-y-5">
          {/* Top Title & Rite Mode Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EDE0CC] pb-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B8860B]" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#8C6218] uppercase tracking-wider font-mono">
                    {isAr ? 'منظومة متابعة مناسك وأركان الحج والعمرة' : 'Spiritual Rites & Field Execution Tracker'}
                  </span>
                </div>
                <SectionHelpTrigger
                  sectionKey="hajj_rituals"
                  uiLang={uiLang}
                  variant="gold"
                  size="sm"
                  pinned={true}
                  label={isAr ? 'دليل المناسك' : 'Rituals Guide'}
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#44200F] tracking-tight flex items-center gap-2">
                <HeartHandshake className="w-6 h-6 text-[#B8860B]" />
                <span>
                  {isAr 
                    ? `متابعة أركان ومناسك ${selectedRiteType === 'umrah' ? 'العمرة المشرفة' : 'الحج الأكبر'} للأفواج`
                    : `Checklist Guide & Rite Execution for Pilgrimage Groups`}
                </span>
              </h2>
            </div>

            {/* Rite Toggle Buttons (Umrah vs Hajj) */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#E5D5B5] self-start md:self-auto shadow-2xs">
              <button
                onClick={() => setSelectedRiteType('umrah')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedRiteType === 'umrah'
                    ? 'bg-[#FDF4E0] text-[#7C5310] border border-[#B8860B] shadow-2xs'
                    : 'text-[#795037] hover:text-[#44200F]'
                }`}
              >
                <div className="w-2.5 h-2.5 bg-[#B8860B] rounded-xs" />
                <span>{isAr ? 'مناسك العمرة (٤ أركان)' : 'Umrah Rites (4 Pillars)'}</span>
              </button>

              <button
                onClick={() => setSelectedRiteType('hajj')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedRiteType === 'hajj'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-[#065F46] hover:bg-emerald-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>{isAr ? 'مناسك الحج وأيام التشريق' : 'Hajj Journey & Tashreeq'}</span>
              </button>
            </div>
          </div>

          {/* Group Selector and Progress Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Group Selector Card */}
            <div className="md:col-span-5 bg-white border border-[#E5D5B5] rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-[#8C6218] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>{isAr ? 'الفوج وقافلة المعتمرين المستهدفة:' : 'Target Pilgrimage Delegation:'}</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-[#7C5310] bg-[#FDF4E0] px-2 py-0.5 rounded border border-[#DFC798]">
                  {selectedGroup.code}
                </span>
              </div>

              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#EDE0CC] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#44200F] font-bold focus:outline-none focus:ring-1 focus:ring-[#B8860B] cursor-pointer"
              >
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.code} — {isAr ? group.nameAr : group.nameEn} ({group.pilgrimCount} pax)
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-between text-[11px] text-[#795037] pt-1 border-t border-[#EDE0CC]">
                <span className="font-bold text-[#44200F]">
                  {isAr ? selectedGroup.currentHotelAr : selectedGroup.currentHotelEn}
                </span>
                <span className="text-[#8C6218] font-medium">
                  {isAr ? selectedGroup.assignedGuideAr : selectedGroup.assignedGuideEn}
                </span>
              </div>
            </div>

            {/* Completion Gauge Card */}
            <div className="md:col-span-7 bg-white border border-[#E5D5B5] rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-[#44200F] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
                    <span>{isAr ? 'نسبة إنجاز أركان النسك للفوج:' : 'Rites Completion Status:'}</span>
                  </h4>
                  <span className="text-[11px] text-[#795037]">
                    {completedCount} {isAr ? `من أصل ${steps.length} محطات منجزة` : `of ${steps.length} steps marked complete`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#8C6218]">
                    {progressPercent}%
                  </span>
                  {progressPercent === 100 && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? 'تمت بحمد الله' : 'Completed'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Linear Progress Bar */}
              <div className="w-full h-3 bg-[#FAF3E3] rounded-full overflow-hidden border border-[#E5D5B5]">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className={`h-full transition-all duration-500 ${
                    progressPercent === 100 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                      : 'bg-gradient-to-r from-[#8C6218] via-[#B8860B] to-[#D4AF37]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#795037]">
                <span>{isAr ? 'انقر على مربعات الاختيار لتحديث تقدم الفوج ميدانياً' : 'Check items to log real-time ritual progress per group'}</span>
                {onSwitchToZiyaratMap && (
                  <button
                    onClick={onSwitchToZiyaratMap}
                    className="text-[#8C6218] hover:text-[#44200F] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3 h-3 text-[#B8860B]" />
                    <span>{isAr ? 'فتح خريطة المسارات' : 'Open Sanctuary Map'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CHECKLIST-STYLE STEPS ROSTER WITH LOCATION-SPECIFIC ADVICE (LIGHT THEME)
         ========================================================================= */}
      <div className="space-y-4">
        {steps.map((step) => {
          const isCompleted = !!currentGroupSteps[step.id];
          const isExpanded = expandedStepId === step.id;

          return (
            <div
              key={step.id}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isCompleted 
                  ? 'bg-[#F5FBF8] border-emerald-200 shadow-2xs'
                  : 'bg-white border-[#EDE0CC] shadow-2xs'
              }`}
            >
              {/* Step Summary Top Row */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#44200F]">
                <div className="flex items-start sm:items-center gap-3.5">
                  {/* Interactive Checklist Checkbox */}
                  <button
                    onClick={() => handleToggleStep(step.id)}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                      isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-[#FAF6EE] text-[#7C5310] border-[#DFC798] hover:border-[#B8860B]'
                    }`}
                    title={isCompleted ? (isAr ? 'تم الإنجاز - انقر للإلغاء' : 'Completed - click to uncheck') : (isAr ? 'انقر لتأكيد الإنجاز' : 'Click to mark complete')}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="font-mono font-bold text-xs">{step.stepNumber}</span>}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                        isCompleted 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-[#FDF4E0] text-[#7C5310] border border-[#DFC798]'
                      }`}>
                        {isAr ? step.pillarCategoryAr : step.pillarCategoryEn}
                      </span>

                      <span className="text-[11px] text-[#795037] flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-[#B8860B]" />
                        <span>{isAr ? step.locationZoneAr : step.locationZoneEn}</span>
                      </span>
                    </div>

                    <h3 className={`text-sm sm:text-base font-black ${
                      isCompleted ? 'text-emerald-900 line-through opacity-80' : 'text-[#44200F]'
                    }`}>
                      {isAr ? step.titleAr : step.titleEn}
                    </h3>
                  </div>
                </div>

                {/* Right Actions & Expand Accordion */}
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <span className="text-[11px] text-[#795037] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-[#B8860B]" />
                    <span>~{step.expectedDurationMinutes} {isAr ? 'دقيقة' : 'mins'}</span>
                  </span>

                  <button
                    onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DFC798] text-xs font-bold text-[#7C5310] hover:bg-[#FAF3E3] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isAr ? 'الإرشادات الميدانية والموقع' : 'Location Advice & Du\'aa'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* =====================================================================
                  EXPANDABLE LOCATION-SPECIFIC ADVICE & OPERATOR CHECKLIST ACCORDION
                 ===================================================================== */}
              {isExpanded && (
                <div className="p-4 sm:p-6 border-t border-[#EDE0CC] bg-[#FAF8F5] space-y-5 text-[#44200F] animate-in fade-in duration-200">
                  {/* Grid of Location Specs & Guidance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Location & Field Operational Guidance */}
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EDE0CC]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#8C6218]">
                        <Compass className="w-4 h-4 text-[#B8860B]" />
                        <span>{isAr ? 'الإرشادات الميدانية وتفاصيل الموقع الجغرافي:' : 'Location-Specific Field Advice:'}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE0CC] text-[11px] text-[#795037] space-y-1 font-mono">
                        <p className="text-[#44200F] font-bold">{isAr ? step.locationNameAr : step.locationNameEn}</p>
                        <p className="text-[#8C6218] font-bold">{isAr ? step.locationZoneAr : step.locationZoneEn}</p>
                        <p className="text-[#795037]">
                          {isAr ? `أفضل الأوقات الموصى بها: ${step.recommendedHoursAr}` : `Recommended timing: ${step.recommendedHoursEn}`}
                        </p>
                      </div>

                      <ul className="space-y-2 text-xs text-slate-700">
                        {(isAr ? step.locationSpecificAdviceAr : step.locationSpecificAdviceEn).map((advice, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-2 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B] mt-1.5 shrink-0" />
                            <span>{advice}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Wheelchair & Accessibility Alert */}
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                        <Footprints className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-emerald-950">
                            {isAr ? 'مسارات ذوي الإعاقة وكبار السن:' : 'Wheelchair & Buggy Accessibility:'}
                          </span>
                          <span className="text-emerald-800 leading-tight">
                            {isAr ? step.wheelchairAccessAr : step.wheelchairAccessEn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sacred Supplication (Du'aa) & Operator Checklist */}
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EDE0CC] flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#8C6218]">
                            <BookOpen className="w-4 h-4 text-[#B8860B]" />
                            <span>{isAr ? 'الدعاء المأثور عن النبي ﷺ:' : 'Prophetic Supplication (Du\'aa):'}</span>
                          </div>

                          <button
                            onClick={() => handleCopyDuaa(step.duaaArabic, step.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#FDF4E0] border border-[#DFC798] text-[10px] font-bold text-[#7C5310] hover:bg-[#F5E6C4] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-[#B8860B]" />
                            <span>{copiedDuaaId === step.id ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الدعاء' : 'Copy Du\'aa')}</span>
                          </button>
                        </div>

                        {/* Sacred Arabic Text */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAF3E0] via-[#FFFDF8] to-[#F3E5C8] border border-[#DFC798] text-center space-y-1.5">
                          <p className="font-serif text-sm sm:text-base font-bold text-[#44200F] leading-relaxed" dir="rtl">
                            {step.duaaArabic}
                          </p>
                          <span className="text-[10px] text-[#795037] block font-mono">
                            {isAr ? `موطن الدعاء: ${step.duaaAudioCue}` : `Recited: ${step.duaaAudioCue}`}
                          </span>
                        </div>

                        {/* Operator Field Protocol Checklist */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-[#8C6218] block">
                            {isAr ? 'قائمة التحقق للمشرف الميداني:' : 'Operator Field Action Items:'}
                          </span>
                          <div className="space-y-1.5 text-[11px] text-slate-700">
                            {(isAr ? step.operatorFieldChecklistAr : step.operatorFieldChecklistEn).map((item, iIdx) => (
                              <div key={iIdx} className="flex items-start gap-2 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EDE0CC]">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Direction / Map Action Button */}
                      <div className="pt-2 border-t border-[#EDE0CC] flex items-center justify-between text-xs">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${step.lat},${step.lng}?utm_campaign=gmp_mcp_codeassist_v1_aistudio`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#8C6218] hover:text-[#44200F] font-bold flex items-center gap-1"
                        >
                          <span>{isAr ? 'فتح إحداثيات الموقع في Google Maps' : 'Open Location in Google Maps'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleToggleStep(step.id)}
                          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                            isCompleted 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gradient-to-r from-[#8C6218] to-[#B8860B] text-white hover:from-[#734F10] hover:to-[#9A6F1A]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCompleted ? (isAr ? 'تم الإنجاز للفوج' : 'Marked Complete') : (isAr ? 'تأكيد إنجاز الركن' : 'Confirm Step Complete')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
