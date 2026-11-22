import { Workspace, Rate, Supplier } from '../types';
import { validateEgyptianPhone } from './phone';

export interface MissingFieldItem {
  id: string;
  category: 'Company Identity' | 'Contact & Channels' | 'Location & Overview';
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  severity: 'critical' | 'important';
}

export interface WorkspaceReadinessReport {
  completionScore: number; // 0 - 100%
  isReady: boolean;
  criticalMissingCount: number;
  missingFields: MissingFieldItem[];
  completedFields: string[];
}

/**
 * Audits a Workspace to verify standard operational company profile fields
 * are completed. Does NOT require tax IDs, commercial registration numbers,
 * tourism licenses, bank wires, or government documents.
 */
export function auditWorkspaceReadiness(
  workspace: Workspace,
  _rates: Rate[] = [],
  _suppliers: Supplier[] = []
): WorkspaceReadinessReport {
  const missing: MissingFieldItem[] = [];
  const completed: string[] = [];

  // Required Field 1: Company Name (English / Primary)
  if (workspace.name && workspace.name.trim() && workspace.name !== 'unconfigured') {
    completed.push('name');
  } else {
    missing.push({
      id: 'name',
      category: 'Company Identity',
      label: 'Company Name (English)',
      labelAr: 'اسم الشركة بالإنجليزية',
      description: 'Official trading name shown on itineraries, client quotes, and proposals.',
      descriptionAr: 'الاسم التجاري للشركة المطبوع على عروض الأسعار والبرامج السياحية.',
      severity: 'critical',
    });
  }

  // Optional Field 2: Arabic Name (fallback to English name if omitted)
  if (workspace.arabicName && workspace.arabicName.trim()) {
    completed.push('arabicName');
  } else {
    missing.push({
      id: 'arabicName',
      category: 'Company Identity',
      label: 'Arabic Company Name (Optional)',
      labelAr: 'اسم الشركة بالعربية (اختياري)',
      description: 'Optional Arabic brand name; English name is displayed automatically when omitted.',
      descriptionAr: 'الاسم العربي الاختياري للشركة؛ يظهر الاسم الإنجليزي تلقائياً عند تركه فارغاً.',
      severity: 'important',
    });
  }

  // Required Field 3: Operations & Booking Email
  if (
    workspace.contactEmail &&
    workspace.contactEmail.trim() &&
    workspace.contactEmail.includes('@') &&
    workspace.contactEmail !== 'operations@egyptdmc.com'
  ) {
    completed.push('contactEmail');
  } else {
    missing.push({
      id: 'contactEmail',
      category: 'Contact & Channels',
      label: 'Operations & Booking Email',
      labelAr: 'البريد الإلكتروني للعمليات والحجوزات',
      description: 'Primary email where partner requests and proposal approvals are received.',
      descriptionAr: 'البريد الإلكتروني المخصص لتلقي طلبات الحجز وتأكيدات العملاء.',
      severity: 'critical',
    });
  }

  // Required Field 4: Official WhatsApp / Phone Number
  const primaryWa = (workspace.whatsappNumber || workspace.contactPhone || '').trim();
  if (primaryWa && validateEgyptianPhone(primaryWa).valid) {
    completed.push('whatsappNumber');
  } else {
    missing.push({
      id: 'whatsappNumber',
      category: 'Contact & Channels',
      label: 'Operations WhatsApp Number',
      labelAr: 'رقم واتساب التشغيل المباشر',
      description: 'Direct WhatsApp communication channel for travelers and B2B partners.',
      descriptionAr: 'رقم الواتساب المباشر للتواصل السريع مع المسافرين ووكلاء السياحة.',
      severity: 'critical',
    });
  }

  // Optional Field 5: Headquarters Phone
  const hqPhone = (workspace.contactPhone || workspace.whatsappNumber || '').trim();
  if (hqPhone && validateEgyptianPhone(hqPhone).valid) {
    completed.push('contactPhone');
  } else {
    missing.push({
      id: 'contactPhone',
      category: 'Contact & Channels',
      label: 'Headquarters Contact Phone',
      labelAr: 'هاتف المقر الرئيسي',
      description: 'Direct phone line for operations desk and emergency tour support.',
      descriptionAr: 'خط الهاتف المباشر لإدارة العمليات والدعم الميداني للأفواج.',
      severity: 'important',
    });
  }

  // Optional Field 6: Operating Address / Location
  if (workspace.address && workspace.address.trim()) {
    completed.push('address');
  } else {
    missing.push({
      id: 'address',
      category: 'Location & Overview',
      label: 'Headquarters Office Address',
      labelAr: 'عنوان المقر الرئيسي',
      description: 'Office physical address or primary operations city in Egypt.',
      descriptionAr: 'العنوان الفعلي للشركة أو مدينة المقر الرئيسي في مصر.',
      severity: 'important',
    });
  }

  // Optional Field 7: Company Overview / Bio
  if (workspace.description && workspace.description.trim()) {
    completed.push('description');
  } else {
    missing.push({
      id: 'description',
      category: 'Location & Overview',
      label: 'Company Overview & Bio',
      labelAr: 'نبذة عن الشركة والخدمات',
      description: 'Short profile introducing your agency specialties and fleet to partners.',
      descriptionAr: 'نبذة تعريفية مختصرة عن تخصصات الشركة وخدماتها لشركاء السياحة.',
      severity: 'important',
    });
  }

  const totalFields = 7;
  const completedCount = completed.length;
  const completionScore = Math.round((completedCount / totalFields) * 100);
  const criticalMissing = missing.filter(m => m.severity === 'critical');

  return {
    completionScore,
    isReady: criticalMissing.length === 0,
    criticalMissingCount: criticalMissing.length,
    missingFields: missing,
    completedFields: completed,
  };
}
