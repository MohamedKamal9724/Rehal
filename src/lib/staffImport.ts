import { User, UserRole } from '../types';

export interface ParsedStaffRecord {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Agent' | 'Operations' | 'Finance' | 'Supervisor' | 'Guide' | 'Driver';
  phone?: string;
  jobTitle?: string;
  isValid: boolean;
  errors: string[];
}

export interface StaffImportResult {
  records: ParsedStaffRecord[];
  validCount: number;
  invalidCount: number;
  users: User[];
}

/**
 * Maps raw role strings (English or Arabic) to standard system user roles.
 */
export function normalizeStaffRole(rawRole: string): 'Admin' | 'Sales Agent' | 'Operations' | 'Finance' | 'Supervisor' | 'Guide' | 'Driver' {
  const r = (rawRole || '').trim().toLowerCase();
  if (r.includes('guide') || r.includes('مرشد') || r.includes('سياحي')) return 'Guide';
  if (r.includes('driver') || r.includes('chauffeur') || r.includes('سائق') || r.includes('نقل') || r.includes('كابتن')) return 'Driver';
  if (r.includes('sale') || r.includes('بيع') || r.includes('مبيعات') || r.includes('حجز')) return 'Sales Agent';
  if (r.includes('op') || r.includes('عمليات') || r.includes('تشغيل')) return 'Operations';
  if (r.includes('fin') || r.includes('مالي') || r.includes('حسابات')) return 'Finance';
  if (r.includes('super') || r.includes('مشرف')) return 'Supervisor';
  if (r.includes('admin') || r.includes('مدير') || r.includes('مسؤول')) return 'Admin';
  return 'Operations'; // default safe role
}

/**
 * Parses raw CSV content (comma, semicolon, or tab delimited) into validated staff records.
 */
export function parseStaffCsv(csvText: string, workspaceId: string): StaffImportResult {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { records: [], validCount: 0, invalidCount: 0, users: [] };
  }

  // Detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  // Parse header
  const headerCells = firstLine.split(delimiter).map(c => c.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const nameIdx = headerCells.findIndex(h => h.includes('name') || h.includes('اسم'));
  const emailIdx = headerCells.findIndex(h => h.includes('mail') || h.includes('بريد'));
  const roleIdx = headerCells.findIndex(h => h.includes('role') || h.includes('دور') || h.includes('وظيفة'));
  const phoneIdx = headerCells.findIndex(h => h.includes('phone') || h.includes('هاتف') || h.includes('موبايل') || h.includes('جوال'));
  const titleIdx = headerCells.findIndex(h => h.includes('title') || h.includes('مسمى') || h.includes('مهنة'));

  const dataLines = lines.slice(1);
  const records: ParsedStaffRecord[] = [];
  const validUsers: User[] = [];
  const seenEmails = new Set<string>();

  dataLines.forEach((line, index) => {
    // Basic CSV cell split supporting quotes
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        cells.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim().replace(/^["']|["']$/g, ''));

    const rawName = (nameIdx >= 0 ? cells[nameIdx] : cells[0]) || '';
    const rawEmail = (emailIdx >= 0 ? cells[emailIdx] : cells[1]) || '';
    const rawRole = (roleIdx >= 0 ? cells[roleIdx] : cells[2]) || '';
    const rawPhone = phoneIdx >= 0 ? cells[phoneIdx] : cells[3] || '';
    const rawTitle = titleIdx >= 0 ? cells[titleIdx] : cells[4] || '';

    const errors: string[] = [];
    if (!rawName.trim()) {
      errors.push('Name is required');
    }

    const emailTrimmed = rawEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.push('Invalid email format');
    } else if (seenEmails.has(emailTrimmed)) {
      errors.push('Duplicate email in file');
    }

    const normalizedRole = normalizeStaffRole(rawRole);
    const isValid = errors.length === 0;
    if (isValid && emailTrimmed) {
      seenEmails.add(emailTrimmed);
    }

    const id = `u-imp-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;

    const record: ParsedStaffRecord = {
      id,
      name: rawName.trim(),
      email: emailTrimmed,
      role: normalizedRole,
      phone: rawPhone.trim() || undefined,
      jobTitle: rawTitle.trim() || undefined,
      isValid,
      errors,
    };

    records.push(record);

    if (isValid) {
      const systemRole: UserRole =
        record.role === 'Admin' ? 'Admin' :
        record.role === 'Sales Agent' ? 'Sales Agent' :
        'Operations';

      const customTitleEn =
        record.role === 'Guide' ? (record.jobTitle || 'Licensed Egyptologist Guide') :
        record.role === 'Driver' ? (record.jobTitle || 'Private Chauffeur / Driver') :
        record.jobTitle;

      const customTitleAr =
        record.role === 'Guide' ? (record.jobTitle || 'مرشد سياحي مرخص') :
        record.role === 'Driver' ? (record.jobTitle || 'سائق ليموزين ونقل') :
        record.jobTitle;

      validUsers.push({
        id,
        workspaceId,
        name: record.name,
        email: record.email,
        role: systemRole,
        language: 'ar',
        status: 'active',
        phone: record.phone,
        customJobTitleEn: customTitleEn,
        customJobTitleAr: customTitleAr,
      });
    }
  });

  return {
    records,
    validCount: validUsers.length,
    invalidCount: records.length - validUsers.length,
    users: validUsers,
  };
}

/**
 * Generates a standard CSV template for staff import.
 */
export function generateStaffImportTemplate(isAr = false): string {
  if (isAr) {
    return `الاسم,البريد الإلكتروني,الدور,الهاتف,المسمى الوظيفي
طارق منصور,tarek.guide@example.com,مرشد سياحي,+201002345678,كبير المرشدين المرخصين
محمود السيد,mahmoud.driver@example.com,سائق نقل,+201019876543,كابتن ليموزين VIP
مريم الشريف,mariam.sales@example.com,مبيعات وحجوزات,+201023456789,أخصائية عروض أسعار
`;
  }
  return `Name,Email,Role,Phone,Job Title
Tarek Mansour,tarek.guide@example.com,Guide,+201002345678,Lead Egyptologist
Mahmoud El-Sayed,mahmoud.driver@example.com,Driver,+201019876543,VIP Chauffeur
Mariam El-Sherif,mariam.sales@example.com,Sales Agent,+201023456789,Senior Quotation Specialist
`;
}
