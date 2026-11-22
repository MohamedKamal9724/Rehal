import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  calculateStaffAnalytics, 
  generateStaffCsv, 
  generateStaffReportHtml 
} from '../staffAnalytics';
import { User, Quote, Inquiry } from '../../types';
import { TripFile } from '../tripStore';

describe('Staff Performance Analytics Engine', () => {
  it('handles empty staff list gracefully without errors', () => {
    const summary = calculateStaffAnalytics([], [], [], []);
    assert.strictEqual(summary.totalStaffCount, 0);
    assert.strictEqual(summary.activeStaffCount, 0);
    assert.strictEqual(summary.companyCompletionRatePercent, 100);
    assert.strictEqual(summary.totalActiveWorkload, 0);
    assert.deepStrictEqual(summary.staffMetrics, []);
  });

  it('computes headcount, completion rate, and current focus accurately', () => {
    const mockUsers: User[] = [
      {
        id: 'u-1',
        workspaceId: 'ws-test',
        name: 'Tarek Mansour',
        email: 'tarek@test.eg',
        role: 'Sales Agent',
        language: 'ar',
        status: 'active',
        customJobTitleAr: 'مسؤول مبيعات أول',
        customJobTitleEn: 'Senior Sales Specialist',
      },
      {
        id: 'u-2',
        workspaceId: 'ws-test',
        name: 'Nour El-Sherif',
        email: 'nour@test.eg',
        role: 'Operations',
        language: 'ar',
        status: 'active',
        customJobTitleAr: 'مشرفة تشغيل رحلات',
        customJobTitleEn: 'Operations Supervisor',
      },
    ];

    const mockQuotes: Partial<Quote>[] = [
      {
        id: 'q-1',
        workspaceId: 'ws-test',
        quoteNumber: 'DAL-2026-001',
        travelerName: 'Alexander Wright',
        status: 'Sent',
        assignedAgentId: 'u-1',
        assignedAgentName: 'Tarek Mansour',
        durationDays: 8,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'q-2',
        workspaceId: 'ws-test',
        quoteNumber: 'DAL-2026-002',
        travelerName: 'Sarah Jenkins',
        status: 'Accepted',
        assignedAgentId: 'u-1',
        assignedAgentName: 'Tarek Mansour',
        durationDays: 5,
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockTrips: Partial<TripFile>[] = [
      {
        id: 'trip-1',
        quoteId: 'q-2',
        fileNumber: 'EG-CAI-7491',
        travelerName: 'Sarah Jenkins',
        assignedOperatorName: 'Nour El-Sherif',
        status: 'Operating',
        startDate: '2026-11-15',
        durationDays: 5,
      },
    ];

    const mockInquiries: Partial<Inquiry>[] = [
      {
        id: 'inq-1',
        workspaceId: 'ws-test',
        travelerName: 'Elena Rostova',
        source: 'WhatsApp',
        status: 'New',
        assignedAgentId: 'u-1',
        assignedAgentName: 'Tarek Mansour',
        receivedAt: new Date().toISOString(),
      },
    ];

    const summary = calculateStaffAnalytics(
      mockUsers,
      mockQuotes as Quote[],
      mockTrips as TripFile[],
      mockInquiries as Inquiry[]
    );

    assert.strictEqual(summary.totalStaffCount, 2);
    assert.strictEqual(summary.activeStaffCount, 2);
    assert.strictEqual(summary.staffMetrics.length, 2);

    const tarek = summary.staffMetrics.find((s) => s.userId === 'u-1');
    assert.ok(tarek);
    assert.strictEqual(tarek.quotesCount, 2);
    assert.strictEqual(tarek.activeFilesCount, 2); // 1 active quote + 1 new inquiry
    assert.strictEqual(tarek.completedFilesCount, 1); // 1 accepted quote
    assert.strictEqual(tarek.completionRatePercent, 33); // 1 completed out of 3 total = 33%
    assert.ok(tarek.currentFocusAr.includes('Alexander Wright') || tarek.currentFocusAr.includes('صياغة'));

    const nour = summary.staffMetrics.find((s) => s.userId === 'u-2');
    assert.ok(nour);
    assert.strictEqual(nour.tripsCount, 1);
    assert.strictEqual(nour.activeFilesCount, 1);
    assert.ok(nour.currentFocusAr.includes('تنسيق وتشغيل') || nour.currentFocusAr.includes('Sarah Jenkins'));
  });

  it('correctly reports speed benchmarks and turnaround hours', () => {
    const mockUsers: User[] = [
      {
        id: 'u-fast',
        workspaceId: 'ws-test',
        name: 'Fast Agent',
        email: 'fast@test.eg',
        role: 'Sales Agent',
        language: 'ar',
        status: 'active',
      },
    ];

    const mockQuotes: Partial<Quote>[] = [
      {
        id: 'q-fast',
        workspaceId: 'ws-test',
        quoteNumber: 'DAL-FAST-01',
        travelerName: 'Fast Guest',
        status: 'Accepted',
        assignedAgentId: 'u-fast',
        assignedAgentName: 'Fast Agent',
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const summary = calculateStaffAnalytics(mockUsers, mockQuotes as Quote[], [], []);
    assert.ok(summary.staffMetrics[0].avgTurnaroundHours <= 2.5);
    assert.strictEqual(summary.staffMetrics[0].speedCategory, 'fast');
  });

  it('generates well-formatted CSV with completion percentages and response times', () => {
    const mockUsers: User[] = [
      {
        id: 'u-1',
        workspaceId: 'ws-test',
        name: 'Kareem Fahmy',
        email: 'kareem@test.eg',
        role: 'Sales Agent',
        language: 'ar',
        status: 'active',
      },
    ];

    const mockQuotes: Partial<Quote>[] = [
      {
        id: 'q-1',
        workspaceId: 'ws-test',
        quoteNumber: 'DAL-2026-99',
        travelerName: 'Sophia Miller',
        status: 'Accepted',
        assignedAgentId: 'u-1',
        assignedAgentName: 'Kareem Fahmy',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const summary = calculateStaffAnalytics(mockUsers, mockQuotes as Quote[], [], []);
    
    // Arabic CSV
    const csvAr = generateStaffCsv(summary, 'شركة النيل للسياحة', true);
    assert.ok(csvAr.includes('الموظف'));
    assert.ok(csvAr.includes('نسبة إنجاز المهام (%)'));
    assert.ok(csvAr.includes('متوسط سرعة الإنجاز (ساعات)'));
    assert.ok(csvAr.includes('Kareem Fahmy'));
    assert.ok(csvAr.includes('100%'));

    // English CSV
    const csvEn = generateStaffCsv(summary, 'Nile Travel', false);
    assert.ok(csvEn.includes('Staff Member'));
    assert.ok(csvEn.includes('Task Completion Rate (%)'));
    assert.ok(csvEn.includes('Avg Turnaround Time (Hours)'));
    assert.ok(csvEn.includes('Kareem Fahmy'));
  });

  it('generates printable HTML report with staff performance metrics', () => {
    const mockUsers: User[] = [
      {
        id: 'u-1',
        workspaceId: 'ws-test',
        name: 'Dalia Mostafa',
        email: 'dalia@test.eg',
        role: 'Operations',
        language: 'ar',
        status: 'active',
      },
    ];

    const summary = calculateStaffAnalytics(mockUsers, [], [], []);
    const html = generateStaffReportHtml(summary, 'رحال ترافيل', true);

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('Dalia Mostafa'));
    assert.ok(html.includes('نسبة إنجاز المهام'));
    assert.ok(html.includes('window.print()'));
  });

  it('accurately ranks top performers over 30 days by task completion rate and response speed', () => {
    const mockUsers: User[] = [
      {
        id: 'u-slow',
        workspaceId: 'ws-test',
        name: 'Slow Agent',
        email: 'slow@test.eg',
        role: 'Sales Agent',
        language: 'ar',
        status: 'active',
        customJobTitleAr: 'مسؤول مبيعات',
      },
      {
        id: 'u-star',
        workspaceId: 'ws-test',
        name: 'Star Agent',
        email: 'star@test.eg',
        role: 'Sales Agent',
        language: 'ar',
        status: 'active',
        customJobTitleAr: 'مسؤول مبيعات متميز',
      },
    ];

    // Star agent has high completion rate (100%) and fast turnaround (1 hr)
    const mockQuotes: Partial<Quote>[] = [
      {
        id: 'q-star-1',
        workspaceId: 'ws-test',
        quoteNumber: 'DAL-STAR-01',
        travelerName: 'VIP Guest',
        status: 'Accepted',
        assignedAgentId: 'u-star',
        assignedAgentName: 'Star Agent',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Slow agent has an in-progress quote and took 7 hours
      {
        id: 'q-slow-1',
        workspaceId: 'ws-test',
        quoteNumber: 'DAL-SLOW-01',
        travelerName: 'Pending Guest',
        status: 'Draft',
        assignedAgentId: 'u-slow',
        assignedAgentName: 'Slow Agent',
        createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const summary = calculateStaffAnalytics(mockUsers, mockQuotes as Quote[], [], []);
    assert.ok(summary.topPerformers30d.length >= 2);

    const firstRank = summary.topPerformers30d[0];
    assert.strictEqual(firstRank.userId, 'u-star');
    assert.strictEqual(firstRank.rank, 1);
    assert.strictEqual(firstRank.completionRatePercent, 100);
    assert.ok(firstRank.avgTurnaroundHours <= 2.5);
    assert.ok(firstRank.highlightBadgeAr.includes('الأعلى') || firstRank.highlightBadgeAr.includes('متميز'));
  });

  it('supports custom time horizons: 7d Weekly, 30d Monthly, 90d Quarterly', () => {
    const mockUsers: User[] = [
      {
        id: 'u-weekly',
        workspaceId: 'ws-test',
        name: 'Weekly Star',
        email: 'weekly@test.eg',
        role: 'Sales Agent',
        language: 'ar',
        status: 'active',
      },
    ];

    const mockQuotes: Partial<Quote>[] = [
      {
        id: 'q-recent',
        workspaceId: 'ws-test',
        travelerName: 'Recent Guest',
        status: 'Accepted',
        assignedAgentId: 'u-weekly',
        assignedAgentName: 'Weekly Star',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
    ];

    const summary = calculateStaffAnalytics(mockUsers, mockQuotes as Quote[], [], []);
    assert.ok(typeof summary.getTopPerformersByHorizon === 'function');

    const top7d = summary.getTopPerformersByHorizon('7d');
    const top30d = summary.getTopPerformersByHorizon('30d');
    const top90d = summary.getTopPerformersByHorizon('90d');

    assert.strictEqual(top7d.length, 1);
    assert.strictEqual(top7d[0].userId, 'u-weekly');
    assert.strictEqual(top30d.length, 1);
    assert.strictEqual(top90d.length, 1);
  });
});
