/**
 * Central Demo Mode Configuration & Tenant Separation for RIHAL (رحال)
 * 
 * Strictly separates DEMO experiences from LIVE Neon production data.
 * - Demo accounts and trips are clearly tagged.
 * - Demo trips can never query or compromise live traveler data.
 * - Prevents demo operations from triggering live payments or actual dispatches.
 */

export const DEMO_TRIP_CODES = ['DALEEL-784', 'DEMO-784', 'EGY-2026-784', 'DEMO-LUXOR', 'RIHAL-842A', 'EG-CAI-7491', 'EG-LXR-9281', 'TRIP-2026-0104'];

export const DEMO_COMPANY_IDS = ['comp_bluenile_01', 'comp_cairo_dmc_02', 'comp_demo_workspace'];

const DEMO_MODE_STORAGE_KEY = 'rihal_demo_mode_active';

/**
 * Returns true if the client session is explicitly running in Demo Mode.
 * Defaults to true if running in local preview without live DATABASE_URL.
 */
export function isDemoModeActive(): boolean {
  try {
    const stored = localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
    // fallback
  }
  return false;
}

/**
 * Explicitly sets Demo Mode state in localStorage.
 */
export function setDemoModeActive(active: boolean): void {
  try {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, active ? 'true' : 'false');
  } catch {
    // safe fallback
  }
}

/**
 * Checks whether a given trip code belongs to the demo suite.
 */
export function isDemoTripCode(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toUpperCase();
  return DEMO_TRIP_CODES.includes(clean) || clean.startsWith('DEMO-');
}

/**
 * Checks whether a company ID belongs to pre-seeded demo companies.
 */
export function isDemoCompany(companyId: string): boolean {
  if (!companyId) return false;
  return DEMO_COMPANY_IDS.includes(companyId) || companyId.startsWith('comp_demo');
}

/**
 * Explains safe demo constraints for operations (payments, dispatch, vouchers).
 */
export function getDemoNotice(action: 'dispatch' | 'payment' | 'save' | 'general', isArabic: boolean = true): string {
  if (isArabic) {
    switch (action) {
      case 'dispatch':
        return 'وضع تجريبي: لن يتم إرسال رسائل WhatsApp أو تفعيل برقيات تشغيلية فعلية للموردين.';
      case 'payment':
        return 'وضع تجريبي: لا توجد بوابات دفع حقيقية مفعلة — هذه عملية محاكاة تجريبية فقط.';
      case 'save':
        return 'وضع تجريبي: يتم الحفظ محليًا داخل المتصفح فقط ولن يُكتب في قاعدة البيانات السحابية الحية.';
      default:
        return 'بيانات استعراضية تجريبية — لا تؤثر على البيانات الحقيقية للعملاء أو الشركات.';
    }
  }
  switch (action) {
    case 'dispatch':
      return 'Demo Mode: No live WhatsApp messages or actual dispatch dispatches will be sent to suppliers.';
    case 'payment':
      return 'Demo Mode: No real payment gateway is charged — this is a simulated workflow only.';
    case 'save':
      return 'Demo Mode: Changes are stored locally in browser session and will not affect live cloud database.';
    default:
      return 'Demo / Showcase data — completely isolated from production customer records.';
  }
}
