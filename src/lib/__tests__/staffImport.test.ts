import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseStaffCsv, normalizeStaffRole, generateStaffImportTemplate } from '../staffImport';

describe('Staff Import Engine', () => {
  it('normalizes Arabic and English roles correctly', () => {
    assert.strictEqual(normalizeStaffRole('مرشد سياحي'), 'Guide');
    assert.strictEqual(normalizeStaffRole('سائق خاص'), 'Driver');
    assert.strictEqual(normalizeStaffRole('مبيعات'), 'Sales Agent');
    assert.strictEqual(normalizeStaffRole('عمليات وتشغيل'), 'Operations');
    assert.strictEqual(normalizeStaffRole('Lead Guide'), 'Guide');
    assert.strictEqual(normalizeStaffRole('Chauffeur'), 'Driver');
  });

  it('parses valid CSV lines into system User objects with permissions', () => {
    const csv = `Name,Email,Role,Phone,Job Title
Ahmed Sami,ahmed.sami@example.com,Guide,+201001112222,Senior Egyptologist
Fatima Ali,fatima.ali@example.com,Operations,+201003334444,Tour Coordinator
`;
    const res = parseStaffCsv(csv, 'ws-test');
    assert.strictEqual(res.records.length, 2);
    assert.strictEqual(res.validCount, 2);
    assert.strictEqual(res.users.length, 2);
    assert.strictEqual(res.users[0].name, 'Ahmed Sami');
    assert.strictEqual(res.users[0].role, 'Operations');
    assert.strictEqual(res.users[0].customJobTitleEn, 'Senior Egyptologist');
    assert.strictEqual(res.users[1].name, 'Fatima Ali');
    assert.strictEqual(res.users[1].role, 'Operations');
    assert.strictEqual(res.users[1].status, 'active');
  });

  it('detects invalid emails and duplicates', () => {
    const csv = `Name,Email,Role
Valid One,valid1@example.com,Sales
No Email,,Sales
Bad Email,bad-email,Sales
Duplicate One,valid1@example.com,Operations
`;
    const res = parseStaffCsv(csv, 'ws-test');
    assert.strictEqual(res.records.length, 4);
    assert.strictEqual(res.validCount, 1);
    assert.strictEqual(res.invalidCount, 3);
  });

  it('generates downloadable templates for both Arabic and English', () => {
    const en = generateStaffImportTemplate(false);
    const ar = generateStaffImportTemplate(true);
    assert.ok(en.includes('Name,Email,Role'));
    assert.ok(ar.includes('الاسم,البريد الإلكتروني,الدور'));
  });
});
