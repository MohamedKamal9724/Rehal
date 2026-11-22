import { Currency } from '../types';

export type TippingRoleCategory = 
  | 'guide' 
  | 'driver' 
  | 'cruise_crew' 
  | 'meet_assist' 
  | 'felucca' 
  | 'porter' 
  | 'restroom' 
  | 'restaurant';

export interface TippingRoleRule {
  id: TippingRoleCategory;
  title: string;
  arabicTitle: string;
  category: 'core' | 'hospitality' | 'incidental';
  iconName: string;
  whenToTip: string;
  whenToTipArabic: string;
  preferredCurrency: 'USD' | 'EGP' | 'BOTH';
  calculationBasis: 'per_day_group' | 'per_night_cabin' | 'per_event' | 'percent_bill';
  rangeUsd: { min: number; recommended: number; exceptional: number };
  rangeEgp: { min: number; recommended: number; exceptional: number };
  explanation: string;
  etiquetteTips: string[];
}

export const EGYPTIAN_TIPPING_RULES: TippingRoleRule[] = [
  {
    id: 'guide',
    title: 'Licensed Egyptologist Tour Guide',
    arabicTitle: 'مرشد سياحي مرخص',
    category: 'core',
    iconName: 'GraduationCap',
    whenToTip: 'At the end of each touring day, or on the final day if you have the same guide for multiple consecutive days.',
    whenToTipArabic: 'في نهاية يوم الجولة أو في اليوم الأخير مع نفس المرشد',
    preferredCurrency: 'BOTH',
    calculationBasis: 'per_day_group',
    rangeUsd: { min: 20, recommended: 30, exceptional: 45 },
    rangeEgp: { min: 1000, recommended: 1500, exceptional: 2200 },
    explanation: 'Your Egyptologist holds a university degree in ancient Egyptian archaeology and a Ministry of Tourism Syndicate license. Tipping reflects the depth of storytelling, pacing, and personal care provided to your party.',
    etiquetteTips: [
      'Hand the tip folded inside an envelope or discreetly with your right hand at the conclusion of the day.',
      'This amount is per travel group (not per person), though larger groups of 5+ travelers usually offer towards the higher end.',
      'Both crisp US Dollars ($20 / $50 notes) and Egyptian Pounds (EGP) are warmly appreciated.'
    ]
  },
  {
    id: 'driver',
    title: 'Private Chauffeur & Van Driver',
    arabicTitle: 'سائق خاص ومكيف',
    category: 'core',
    iconName: 'Car',
    whenToTip: 'At the end of each day upon dropping you off at your hotel, or upon completing a multi-day regional itinerary.',
    whenToTipArabic: 'عند توصيلكم للفندق في نهاية اليوم',
    preferredCurrency: 'BOTH',
    calculationBasis: 'per_day_group',
    rangeUsd: { min: 10, recommended: 15, exceptional: 25 },
    rangeEgp: { min: 500, recommended: 750, exceptional: 1250 },
    explanation: 'Cairo traffic and long desert highways require immense skill and patience. Your private driver keeps the A/C cooled, guards your luggage during monument visits, and ensures your safety.',
    etiquetteTips: [
      'Tip is given per vehicle/group, not per passenger.',
      'If the driver assisted with heavy baggage or waited patiently through extended visits, acknowledge it.',
      'Egyptian Pounds (EGP) are slightly preferred by drivers for daily fuel and family expenses.'
    ]
  },
  {
    id: 'cruise_crew',
    title: 'Nile Cruise Crew (Pooled Envelope)',
    arabicTitle: 'طاقم الباخرة النيلية (صندوق موحد)',
    category: 'hospitality',
    iconName: 'Ship',
    whenToTip: 'At checkout on the final morning, placed in the official tipping box at the cruise reception desk.',
    whenToTipArabic: 'عند المغادرة صباح اليوم الأخير في صندوق الاستقبال',
    preferredCurrency: 'BOTH',
    calculationBasis: 'per_night_cabin',
    rangeUsd: { min: 10, recommended: 15, exceptional: 20 },
    rangeEgp: { min: 500, recommended: 750, exceptional: 1000 },
    explanation: 'Nile cruisers have 50+ silent crew members behind the scenes (engineers, dishwashers, sailors, galley staff, and housekeepers). Cruisers operate a collective pooled envelope at reception to ensure fair sharing.',
    etiquetteTips: [
      'Do not tip individual waitstaff or cabin stewards daily; use the official reception envelope instead.',
      'Calculated per cabin per night (e.g., a 4-night cruise = 4 x $15 = $60 USD total).',
      'If your cabin steward created delightful towel sculptures and was exceptional, an extra personal 200 EGP directly is a lovely personal touch.'
    ]
  },
  {
    id: 'meet_assist',
    title: 'Airport Meet & Assist Representative',
    arabicTitle: 'مندوب الاستقبال بالمطار',
    category: 'hospitality',
    iconName: 'PlaneTakeoff',
    whenToTip: 'Upon safely handing you over to your private driver and loading your luggage into the vehicle.',
    whenToTipArabic: 'عند توصيلكم لسيارة النقل وتحميل الحقائب',
    preferredCurrency: 'BOTH',
    calculationBasis: 'per_event',
    rangeUsd: { min: 5, recommended: 10, exceptional: 15 },
    rangeEgp: { min: 250, recommended: 500, exceptional: 750 },
    explanation: 'Your airport representative meets you before passport control, assists with fast-track immigration, customs clearance, and luggage cart logistics.',
    etiquetteTips: [
      'Given per group/family arrival.',
      'A $5 - $10 USD or 250 - 500 EGP note is standard.'
    ]
  },
  {
    id: 'felucca',
    title: 'Private Felucca / Nile Boat Captain & Crew',
    arabicTitle: 'قبطان الفلوكة النيلية',
    category: 'hospitality',
    iconName: 'Anchor',
    whenToTip: 'When disembarking at the dock after your sunset or daytime Nile sail.',
    whenToTipArabic: 'عند النزول على الرصيف بعد الجولة',
    preferredCurrency: 'EGP',
    calculationBasis: 'per_event',
    rangeUsd: { min: 3, recommended: 5, exceptional: 10 },
    rangeEgp: { min: 150, recommended: 250, exceptional: 500 },
    explanation: 'Felucca skippers are traditional Nubian or Upper Egyptian sailors who navigate wind and current without engines, offering tea and hospitality.',
    etiquetteTips: [
      'Hand directly to the captain/sailor as you step off.',
      'Egyptian Pounds (EGP 100 - 250) are best.'
    ]
  },
  {
    id: 'porter',
    title: 'Hotel Bellboy & Luggage Porter',
    arabicTitle: 'حمال الحقائب بالفندق',
    category: 'incidental',
    iconName: 'Luggage',
    whenToTip: 'Immediately when your bags are delivered to your hotel room or cabin.',
    whenToTipArabic: 'فور توصيل الحقائب للغرفة',
    preferredCurrency: 'EGP',
    calculationBasis: 'per_event',
    rangeUsd: { min: 1, recommended: 2, exceptional: 3 },
    rangeEgp: { min: 50, recommended: 100, exceptional: 150 },
    explanation: 'Porters transport heavy luggage through sprawling luxury resorts, historic hotels, and cruise gangways.',
    etiquetteTips: [
      'Given in Egyptian Pounds (50 - 100 EGP total for all party bags).',
      'Keep a few crisp 50 EGP bills easily accessible in your pocket.'
    ]
  },
  {
    id: 'restroom',
    title: 'Monument Restroom Attendant / Guard',
    arabicTitle: 'عامل دورات المياه بالآثار',
    category: 'incidental',
    iconName: 'DoorOpen',
    whenToTip: 'Upon entering or exiting archaeological site restrooms, or after receiving paper towels.',
    whenToTipArabic: 'عند استخدام دورة المياه أو استلام المناديل',
    preferredCurrency: 'EGP',
    calculationBasis: 'per_event',
    rangeUsd: { min: 0.5, recommended: 0.5, exceptional: 1 },
    rangeEgp: { min: 10, recommended: 20, exceptional: 30 },
    explanation: 'Restrooms at desert monument sites (Giza, Valley of the Kings) are maintained by site workers who hand paper towels and keep facilities sanitized in extreme heat.',
    etiquetteTips: [
      'Always have small 10 and 20 EGP banknotes ready in your day pack.',
      'Do not use foreign coins (foreign coins cannot be exchanged at Egyptian banks).'
    ]
  },
  {
    id: 'restaurant',
    title: 'Restaurant Waiter & Dining Staff',
    arabicTitle: 'طاقم المطعم والضيافة',
    category: 'hospitality',
    iconName: 'Utensils',
    whenToTip: 'Left on the table in cash after settling your food bill.',
    whenToTipArabic: 'نقداً على الطاولة بعد سداد الفاتورة',
    preferredCurrency: 'EGP',
    calculationBasis: 'percent_bill',
    rangeUsd: { min: 2, recommended: 5, exceptional: 10 },
    rangeEgp: { min: 100, recommended: 200, exceptional: 400 },
    explanation: 'In Egypt, the "12% Service Charge" printed on restaurant bills goes to the business/establishment, rarely reaching the actual waiter. Leaving 5% to 10% in cash directly ensures your server receives gratitude.',
    etiquetteTips: [
      'Even if paying by credit card, leave the tip in cash on the leather folder or table.',
      'In casual cafes or juice shops, rounding up or leaving 20 - 50 EGP is customary.'
    ]
  }
];

export interface TippingCalculationParams {
  roleId: TippingRoleCategory;
  groupSize: number; // e.g. 2 adults
  serviceQuality: 'standard' | 'exceptional' | 'above_and_beyond';
  daysCount?: number;
  targetCurrency: Currency;
  exchangeRateUsdToEgp?: number;
}

export interface TippingCalculationResult {
  role: TippingRoleRule;
  amountTargetCurrency: number;
  amountEgp: number;
  amountUsd: number;
  frequencyLabel: string;
  recommendedBanknoteTip: string;
}

export function calculateTippingRecommendation({
  roleId,
  groupSize,
  serviceQuality = 'standard',
  daysCount = 1,
  targetCurrency = 'USD',
  exchangeRateUsdToEgp = 49.5,
}: TippingCalculationParams): TippingCalculationResult {
  const role = EGYPTIAN_TIPPING_RULES.find(r => r.id === roleId) || EGYPTIAN_TIPPING_RULES[0];
  
  // Pick tier
  let tierKey: 'min' | 'recommended' | 'exceptional' = 'recommended';
  if (serviceQuality === 'standard') tierKey = 'min';
  else if (serviceQuality === 'exceptional') tierKey = 'recommended';
  else tierKey = 'exceptional';

  let baseUsd = role.rangeUsd[tierKey];
  let baseEgp = role.rangeEgp[tierKey];

  // Adjust for group size if group is 4 or more pax
  const groupMultiplier = groupSize >= 5 ? 1.35 : groupSize >= 3 ? 1.15 : 1.0;
  baseUsd = Math.round(baseUsd * groupMultiplier);
  baseEgp = Math.round(baseEgp * groupMultiplier / 50) * 50; // rounded to clean 50 EGP

  const totalUsd = baseUsd * Math.max(1, daysCount);
  const totalEgp = baseEgp * Math.max(1, daysCount);

  // Convert to target currency
  let amountTarget = totalUsd;
  if (targetCurrency === 'EGP') {
    amountTarget = totalEgp;
  } else if (targetCurrency === 'EUR') {
    amountTarget = Math.round(totalUsd * 0.92);
  } else if (targetCurrency === 'GBP') {
    amountTarget = Math.round(totalUsd * 0.78);
  }

  let frequencyLabel = 'Per day for your group';
  if (role.calculationBasis === 'per_night_cabin') frequencyLabel = 'Per night for your cabin';
  else if (role.calculationBasis === 'per_event') frequencyLabel = 'Per service';
  else if (role.calculationBasis === 'percent_bill') frequencyLabel = 'Cash on table (5-10%)';

  let recommendedBanknoteTip = `Hand ${totalEgp.toLocaleString()} EGP`;
  if (role.preferredCurrency === 'BOTH') {
    recommendedBanknoteTip = `$${totalUsd} USD or ${totalEgp.toLocaleString()} EGP`;
  }

  return {
    role,
    amountTargetCurrency: amountTarget,
    amountEgp: totalEgp,
    amountUsd: totalUsd,
    frequencyLabel,
    recommendedBanknoteTip,
  };
}

export interface DayWalletCashSuggestion {
  currency: 'EGP';
  estimatedDayTotalEgp: number;
  denominations: { note: number; count: number; purpose: string }[];
  goldenRule: string;
}

export function getDailyWalletPreparationGuide(hasGuide: boolean, hasDriver: boolean, hasCruise: boolean): DayWalletCashSuggestion {
  let total = 0;
  const denominations: { note: number; count: number; purpose: string }[] = [];

  // Restroom / Incidentals
  denominations.push({ note: 20, count: 4, purpose: 'Monument restrooms & small water purchases' });
  total += 20 * 4;

  // Porters / Cafes
  denominations.push({ note: 50, count: 3, purpose: 'Hotel luggage porters & coffee/juice tips' });
  total += 50 * 3;

  // Driver
  if (hasDriver) {
    denominations.push({ note: 200, count: 3, purpose: 'Private chauffeur daily gratuity (~600 EGP)' });
    total += 200 * 3;
  }

  // Guide
  if (hasGuide) {
    denominations.push({ note: 200, count: 5, purpose: 'Egyptologist guide daily gratuity (~1,000-1,500 EGP or $30 USD)' });
    total += 200 * 5;
  }

  // Cruise
  if (hasCruise) {
    denominations.push({ note: 100, count: 5, purpose: 'Cruise checkout collective envelope share' });
    total += 100 * 5;
  }

  return {
    currency: 'EGP',
    estimatedDayTotalEgp: total,
    denominations,
    goldenRule: 'Always carry a stack of 20 and 50 EGP notes. Egyptian taxi drivers, temple attendants, and local souks rarely have change for 200 EGP banknotes.'
  };
}
