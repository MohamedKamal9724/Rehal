import React, { useState, useMemo } from 'react';
import { 
  Users, ShieldCheck, Clock, CheckCircle2, 
  Search, ArrowUpDown, ChevronRight,
  TrendingUp, FileText, Compass, MessageSquare, AlertCircle,
  Phone, Mail, X, Check, RefreshCw, Download, FileSpreadsheet, Printer,
  Trophy, Award, Zap, Crown, Medal, Upload, FileUp
} from 'lucide-react';
import { User, Quote, Inquiry, Workspace, UILanguage } from '../../types';
import { TripFile } from '../../lib/tripStore';
import { 
  calculateStaffAnalytics, 
  StaffPerformanceMetric, 
  TopPerformerMetric,
  TimeHorizon,
  generateStaffCsv, 
  generateStaffReportHtml 
} from '../../lib/staffAnalytics';
import { 
  parseStaffCsv, 
  generateStaffImportTemplate, 
  StaffImportResult 
} from '../../lib/staffImport';

interface AdminDashboardViewProps {
  workspace: Workspace;
  currentUser: User;
  users: User[];
  quotes: Quote[];
  trips: TripFile[];
  inquiries: Inquiry[];
  uiLang: UILanguage;
  onReassignFile?: (fileType: 'quote' | 'trip' | 'inquiry', fileId: string, newStaffId: string, newStaffName: string) => void;
  onImportStaff?: (newUsers: User[]) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  workspace,
  currentUser,
  users = [],
  quotes = [],
  trips = [],
  inquiries = [],
  uiLang,
  onReassignFile,
  onImportStaff,
}) => {
  const isAr = uiLang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<'all' | 'sales' | 'operations' | 'busy' | 'available'>('all');
  const [hasUserToggledView, setHasUserToggledView] = useState(false);
  const [topPerformersHorizon, setTopPerformersHorizon] = useState<TimeHorizon>('30d');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [parsedImportResult, setParsedImportResult] = useState<StaffImportResult | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  // Auto-adapt to Cards view on mobile screens to eliminate horizontal scrolling
  React.useEffect(() => {
    const handleResize = () => {
      if (!hasUserToggledView && typeof window !== 'undefined') {
        if (window.innerWidth < 768) {
          setViewMode('cards');
        } else {
          setViewMode('table');
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasUserToggledView]);
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformanceMetric | null>(null);
  const [reassignModalFile, setReassignModalFile] = useState<{
    fileType: 'quote' | 'trip' | 'inquiry';
    fileId: string;
    fileTitle: string;
    currentOwnerName: string;
  } | null>(null);
  const [selectedTargetStaffId, setSelectedTargetStaffId] = useState<string>('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Calculate real-time staff performance analytics
  const summary = useMemo(() => {
    return calculateStaffAnalytics(users, quotes, trips, inquiries);
  }, [users, quotes, trips, inquiries]);

  // Compute active top performers based on selected time horizon (Weekly 7d, Monthly 30d, Quarterly 90d)
  const displayedTopPerformers = useMemo(() => {
    if (summary.getTopPerformersByHorizon) {
      return summary.getTopPerformersByHorizon(topPerformersHorizon);
    }
    return summary.topPerformers30d;
  }, [summary, topPerformersHorizon]);

  // Filter staff members based on search and selected department
  const filteredStaff = useMemo(() => {
    let list = summary.staffMetrics;

    // Filter by department/category
    if (selectedDepartment === 'sales') {
      list = list.filter((s) => s.role === 'Sales Agent' || s.quotesCount > 0);
    } else if (selectedDepartment === 'operations') {
      list = list.filter((s) => s.role === 'Operations' || s.tripsCount > 0);
    } else if (selectedDepartment === 'busy') {
      list = list.filter((s) => s.workloadLoad === 'heavy' || s.workloadLoad === 'moderate');
    } else if (selectedDepartment === 'available') {
      list = list.filter((s) => s.workloadLoad === 'available');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.jobTitleAr.toLowerCase().includes(q) ||
          s.jobTitleEn.toLowerCase().includes(q) ||
          s.currentFocusAr.toLowerCase().includes(q) ||
          s.currentFocusEn.toLowerCase().includes(q)
      );
    }

    return list;
  }, [summary.staffMetrics, selectedDepartment, searchQuery]);

  const handleExecuteReassign = () => {
    if (!reassignModalFile || !selectedTargetStaffId || !onReassignFile) return;
    const targetUser = users.find((u) => u.id === selectedTargetStaffId);
    if (!targetUser) return;

    onReassignFile(
      reassignModalFile.fileType,
      reassignModalFile.fileId,
      targetUser.id,
      targetUser.name
    );

    setReassignModalFile(null);
    setSelectedTargetStaffId('');
  };

  const handleDownloadCsv = () => {
    setIsExportMenuOpen(false);
    const companyName = workspace.arabicName || workspace.name || 'RIHAL';
    const csvContent = generateStaffCsv(summary, companyName, isAr);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `staff-performance-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdfReport = () => {
    setIsExportMenuOpen(false);
    const companyName = workspace.arabicName || workspace.name || 'RIHAL';
    const html = generateStaffReportHtml(summary, companyName, isAr);

    // Open report window with automated print / save to PDF dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      // Fallback via isolated hidden iframe for browser environments with strict popup blockers
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }, 500);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 select-text" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. EXECUTIVE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFD1]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="luxury-icon-box luxury-icon-box-lg luxury-icon-box-espresso">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-serif">
              {isAr ? 'لوحة تحكم وتحليلات الإدارة' : 'Executive Team & Operations Analytics'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isAr
              ? `إشراف ومتابعة أداء الموظفين، نسب الإنجاز، وسرعة العمليات لشركة ${workspace.arabicName || workspace.name}`
              : `Workforce supervision, real-time workload tracking, and operational velocity for ${workspace.name}`}
          </p>
        </div>

        {/* Action Controls: Bulk Import + Download Report + View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto relative">
          {/* Bulk Staff CSV Import Button */}
          <button
            type="button"
            onClick={() => {
              setImportCsvText('');
              setParsedImportResult(null);
              setImportSuccessCount(null);
              setIsImportModalOpen(true);
            }}
            className="h-9 inline-flex items-center gap-1.5 px-3.5 text-xs font-bold rounded-xl bg-white border border-[#E8DFD1] text-[#44200F] hover:bg-orange-50/60 transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
            title={isAr ? 'استيراد موظفين ومرشدين وسائقين عبر ملف CSV' : 'Bulk Import Staff & Tour Guides via CSV'}
          >
            <Upload className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
            <span>{isAr ? 'استيراد كوادر' : 'Import Staff'}</span>
          </button>

          {/* Download Report Button with Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              aria-expanded={isExportMenuOpen}
              className="h-9 inline-flex items-center gap-2 px-3.5 text-xs font-bold rounded-xl bg-[#44200F] text-[#FAF7F2] hover:bg-[#33180B] transition cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#C4A177] shrink-0" />
              <span>{isAr ? 'تحميل التقرير' : 'Download Report'}</span>
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div
                  className={`absolute z-50 mt-1.5 w-60 rounded-xl bg-white border border-[#E8DFD1] shadow-xl py-1.5 text-xs ${
                    isAr ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
                  }`}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-[#F4EFE6] uppercase tracking-wider">
                    {isAr ? 'تصدير إحصائيات الأداء' : 'Export Staff Statistics'}
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-[#FAF7F2] hover:text-[#44200F] transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 text-start">
                      <div className="font-bold">{isAr ? 'ملف إكسل (CSV)' : 'Excel / CSV Spreadsheet'}</div>
                      <div className="text-[10px] text-slate-400">
                        {isAr ? 'بيانات كاملة بنسب الإنجاز وسرعة الرد' : 'Detailed metrics with completion & speed'}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdfReport}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-[#FAF7F2] hover:text-[#44200F] transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#795037] shrink-0" />
                    <div className="flex-1 text-start">
                      <div className="font-bold">{isAr ? 'تقرير إداري رسمي (PDF)' : 'Executive Summary (PDF)'}</div>
                      <div className="text-[10px] text-slate-400">
                        {isAr ? 'تقرير منسق ومُهيأ للطباعة والحفظ' : 'Ready for print, archive, or PDF save'}
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* View Switcher: Table vs Cards (Matched h-9) */}
          <div className="h-9 flex items-center gap-0.5 p-0.5 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setHasUserToggledView(true);
                setViewMode('table');
              }}
              className={`h-full px-3 text-xs font-bold rounded-lg transition cursor-pointer inline-flex items-center whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white text-[#44200F] shadow-2xs border border-[#E8DFD1]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'جدول المتابعة' : 'Data Table'}
            </button>
            <button
              type="button"
              onClick={() => {
                setHasUserToggledView(true);
                setViewMode('cards');
              }}
              className={`h-full px-3 text-xs font-bold rounded-lg transition cursor-pointer inline-flex items-center whitespace-nowrap ${
                viewMode === 'cards'
                  ? 'bg-white text-[#44200F] shadow-2xs border border-[#E8DFD1]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'بطاقات الموظفين' : 'Staff Cards'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS (Strictly Equal Height & Symmetrical Layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-stretch">
        {/* KPI 1: Headcount */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD1] shadow-xs flex flex-col justify-between min-h-[140px] h-full space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate">{isAr ? 'فريق العمل والنشطون' : 'Staff Headcount'}</span>
            <div className="luxury-icon-box luxury-icon-box-md luxury-icon-box-sand shrink-0">
              <Users className="w-4 h-4 text-[#795037]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#44200F] font-mono tabular-nums leading-none">
              {summary.totalStaffCount}
            </span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs shrink-0">
              {isAr ? `${summary.activeStaffCount} نشط` : `${summary.activeStaffCount} active`}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate leading-tight mt-auto">
            {isAr
              ? `${summary.availableStaffCount} موظف متاح لاستلام ملفات جديدة`
              : `${summary.availableStaffCount} staff available for dispatch`}
          </p>
        </div>

        {/* KPI 2: Overall Task Completion Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD1] shadow-xs flex flex-col justify-between min-h-[140px] h-full space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate">{isAr ? 'نسبة إنجاز المهام' : 'Completion Rate'}</span>
            <div className="luxury-icon-box luxury-icon-box-md luxury-icon-box-emerald shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono tabular-nums leading-none">
              {summary.companyCompletionRatePercent}%
            </span>
            <span className="text-xs text-slate-500 font-medium truncate">
              {isAr ? `${summary.totalCompletedFiles} ملف منجز` : `${summary.totalCompletedFiles} done`}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-auto">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.companyCompletionRatePercent}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Operational Turnaround Speed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD1] shadow-xs flex flex-col justify-between min-h-[140px] h-full space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate">{isAr ? 'متوسط سرعة الإنجاز' : 'Turnaround Speed'}</span>
            <div className="luxury-icon-box luxury-icon-box-md luxury-icon-box-amber shrink-0">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#44200F] font-mono tabular-nums leading-none">
              {summary.avgTurnaroundHours}
            </span>
            <span className="text-xs text-slate-600 font-medium truncate">
              {isAr ? 'ساعات / ملف' : 'hrs / file'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium truncate leading-tight mt-auto">
            {isAr ? 'استجابة سريعة متوافقة مع معايير رِحال' : 'High velocity response standards'}
          </p>
        </div>

        {/* KPI 4: Active Workload Files */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD1] shadow-xs flex flex-col justify-between min-h-[140px] h-full space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 truncate">{isAr ? 'الملفات قيد التشغيل' : 'Active Workload'}</span>
            <div className="luxury-icon-box luxury-icon-box-md luxury-icon-box-gold shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#44200F] font-mono tabular-nums leading-none">
              {summary.totalActiveWorkload}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate">
              {isAr ? 'عروض ورحلات' : 'live files'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate leading-tight mt-auto">
            {isAr ? 'موزعة آلياً ومتابعة على مدار الساعة' : 'Actively tracked & supervised'}
          </p>
        </div>
      </div>

      {/* 2.5 TOP PERFORMERS RANKING WITH TIME HORIZONS */}
      {displayedTopPerformers && displayedTopPerformers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8DFD1] shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E8DFD1] bg-gradient-to-r from-[#FAF7F2] via-white to-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="luxury-icon-box luxury-icon-box-lg luxury-icon-box-gold">
                <Trophy className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                    {isAr ? 'الموظفون الأكثر تميزاً' : 'Top Performers Ranking'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#44200F]/10 text-[#44200F] border border-[#44200F]/15">
                    <Clock className="w-2.5 h-2.5" />
                    {topPerformersHorizon === '7d' 
                      ? (isAr ? 'آخر 7 أيام' : 'Last 7 Days')
                      : topPerformersHorizon === '90d'
                      ? (isAr ? 'آخر 90 يوماً' : 'Last 90 Days')
                      : (isAr ? 'آخر 30 يوماً' : 'Last 30 Days')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'تكريم وترتيب فريق العمل الأعلى في نسبة إنجاز المهام والأسرع في زمن الرد والاستجابة التشغيلية'
                    : 'Highlighting staff with the highest task completion rates and fastest operational response times'}
                </p>
              </div>
            </div>

            {/* Time Horizon Segmented Filter */}
            <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl self-start sm:self-auto">
              {(
                [
                  { id: '7d', labelAr: 'أسبوعي (7 أيام)', labelEn: 'Weekly (7d)' },
                  { id: '30d', labelAr: 'شهري (30 يوماً)', labelEn: 'Monthly (30d)' },
                  { id: '90d', labelAr: 'ربع سنوي (90 يوماً)', labelEn: 'Quarterly (90d)' },
                ] as { id: TimeHorizon; labelAr: string; labelEn: string }[]
              ).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setTopPerformersHorizon(h.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    topPerformersHorizon === h.id
                      ? 'bg-white text-[#44200F] shadow-xs border border-[#E8DFD1]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAr ? h.labelAr : h.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Podium / Ranking Grid */}
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayedTopPerformers.slice(0, 3).map((performer) => {
                const isFirst = performer.rank === 1;
                const isSecond = performer.rank === 2;
                const isThird = performer.rank === 3;

                // Match with full staff metric to enable clicking "View Details"
                const fullStaff = summary.staffMetrics.find((s) => s.userId === performer.userId);

                return (
                  <div
                    key={performer.userId}
                    className={`relative rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between border ${
                      isFirst
                        ? 'bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 border-amber-300 ring-1 ring-amber-200/80 shadow-sm'
                        : isSecond
                        ? 'bg-gradient-to-b from-slate-50/80 via-white to-slate-50/30 border-slate-300 shadow-xs'
                        : 'bg-gradient-to-b from-orange-50/50 via-white to-orange-50/20 border-orange-200/80 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Rank Badge & Highlight Tag */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border ${
                            isFirst
                              ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-white border-amber-300'
                              : isSecond
                              ? 'bg-gradient-to-tr from-slate-600 to-slate-400 text-white border-slate-300'
                              : 'bg-gradient-to-tr from-orange-600 to-amber-700 text-white border-orange-300'
                          }`}
                        >
                          {isFirst ? <Crown className="w-3.5 h-3.5" /> : performer.rank}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {isFirst
                            ? (isAr ? 'المركز الأول' : '1st Place')
                            : isSecond
                            ? (isAr ? 'المركز الثاني' : '2nd Place')
                            : (isAr ? 'المركز الثالث' : '3rd Place')}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isFirst
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : isSecond
                            ? 'bg-slate-100 text-slate-800 border border-slate-200'
                            : 'bg-orange-100 text-orange-900 border border-orange-200'
                        }`}
                      >
                        {isAr ? performer.highlightBadgeAr : performer.highlightBadgeEn}
                      </span>
                    </div>

                    {/* Staff Profile Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="luxury-icon-box luxury-icon-box-lg luxury-icon-box-espresso font-bold text-sm">
                        {performer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate font-serif">
                          {performer.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {isAr ? performer.jobTitleAr : performer.jobTitleEn}
                        </p>
                      </div>
                    </div>

                    {/* Dual Core Metrics: Completion Rate + Turnaround Speed - High Contrast Icon Boxes (Strictly Equal Height) */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-[#E8DFD1] shadow-2xs mb-3.5 items-stretch">
                      {/* Metric 1: Completion Rate */}
                      <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#EDE0CC]/60 flex flex-col justify-between min-h-[88px] h-full space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <span className="truncate">{isAr ? 'الإنجاز' : 'Completion'}</span>
                          <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-emerald shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          </div>
                        </div>
                        <div className="text-base sm:text-lg font-black text-emerald-800 font-mono tabular-nums leading-none">
                          {performer.completionRatePercent}%
                        </div>
                        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-auto">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${performer.completionRatePercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Metric 2: Turnaround Speed */}
                      <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#EDE0CC]/60 flex flex-col justify-between min-h-[88px] h-full space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <span className="truncate">{isAr ? 'السرعة' : 'Speed'}</span>
                          <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-amber shrink-0">
                            <Clock className="w-3 h-3 text-amber-700" />
                          </div>
                        </div>
                        <div className="text-base sm:text-lg font-black text-[#44200F] font-mono tabular-nums leading-none">
                          {performer.avgTurnaroundHours}
                          <span className="text-[10px] font-sans font-bold text-slate-500 ms-1">
                            {isAr ? 'س' : 'h'}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold truncate leading-tight mt-auto">
                          {isAr ? performer.speedRatingAr.split('·')[0] : performer.speedRatingEn.split('·')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Profile Action */}
                    <div className="pt-2 border-t border-[#E8DFD1]/60 flex items-center justify-between gap-2 mt-auto">
                      <span className="text-[11px] text-slate-500 font-medium tabular-nums">
                        {isAr
                          ? `${performer.completedFiles30d} من ${performer.totalFiles30d} مهام منجزة (${topPerformersHorizon === '7d' ? '7 أيام' : topPerformersHorizon === '90d' ? '90 يوم' : '30 يوم'})`
                          : `${performer.completedFiles30d}/${performer.totalFiles30d} done in ${topPerformersHorizon}`}
                      </span>
                      {fullStaff && (
                        <button
                          type="button"
                          onClick={() => setSelectedStaff(fullStaff)}
                          className="text-[11px] font-bold text-[#44200F] hover:text-[#795037] hover:underline flex items-center gap-1 cursor-pointer transition"
                        >
                          <span>{isAr ? 'عرض الملف' : 'View Profile'}</span>
                          <ChevronRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. CONTROLS BAR: SEGMENTED FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#E8DFD1] shadow-xs">
        {/* Segmented Department Filters */}
        <div className="luxury-tab-bar flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-nowrap">
          {[
            { id: 'all', labelAr: 'كافة الموظفين', labelEn: 'All Staff', count: summary.totalStaffCount },
            { id: 'sales', labelAr: 'فريق المبيعات', labelEn: 'Sales Desk', count: summary.staffMetrics.filter(s => s.role === 'Sales Agent' || s.quotesCount > 0).length },
            { id: 'operations', labelAr: 'فريق التشغيل', labelEn: 'Operations', count: summary.staffMetrics.filter(s => s.role === 'Operations' || s.tripsCount > 0).length },
            { id: 'busy', labelAr: 'ضغط عمل مرتفع', labelEn: 'High Workload', count: summary.staffMetrics.filter(s => s.workloadLoad === 'heavy').length },
            { id: 'available', labelAr: 'متاح الآن', labelEn: 'Available', count: summary.availableStaffCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDepartment(tab.id as any)}
              className={`h-9 shrink-0 px-3.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                selectedDepartment === tab.id
                  ? 'bg-[#44200F] text-white shadow-xs'
                  : 'bg-[#FAF7F2] hover:bg-[#F2EAE0] text-slate-700'
              }`}
            >
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                selectedDepartment === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'end-3' : 'start-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم، المنصب، أو الملف...' : 'Search by name, role, task...'}
            className={`w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl text-xs py-2 text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#C4A177] focus:ring-1 focus:ring-[#C4A177] ${
              isAr ? 'pe-9 ps-3' : 'ps-9 pe-3'
            }`}
          />
        </div>
      </div>

      {/* 4. MAIN STAFF PRESENTATION: TABLE VIEW OR CARD VIEW */}
      {viewMode === 'table' ? (
        /* HIGH-DENSITY SAAS DATA GRID */
        <div className="bg-white rounded-2xl border border-[#E8DFD1] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-800 text-start border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8DFD1] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 text-start">{isAr ? 'الموظف والدور' : 'Staff Member & Role'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'ما يقوم به الآن (العمل الحالي)' : 'Current Active Focus'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'الملفات المسندة' : 'Assigned Files'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'نسبة الإنجاز' : 'Completion Rate'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'سرعة الإنجاز' : 'Turnaround Speed'}</th>
                  <th className="py-3 px-4 text-center">{isAr ? 'ضغط العمل' : 'Workload'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      {isAr ? 'لم يتم العثور على موظفين مطابقين لخيارات البحث' : 'No staff members match the selected criteria'}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr
                      key={staff.userId}
                      onClick={() => setSelectedStaff(staff)}
                      className="hover:bg-amber-50/40 transition cursor-pointer group"
                    >
                      {/* Name & Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#44200F] text-[#C4A177] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-[#C4A177]/25">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-[#44200F] transition truncate">
                              {staff.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {isAr ? staff.jobTitleAr : staff.jobTitleEn}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* What they are doing right now ("ما يقوم به الآن") */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          {staff.currentFocusType === 'quote' && <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          {staff.currentFocusType === 'trip' && <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          {staff.currentFocusType === 'inquiry' && <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          {staff.currentFocusType === 'idle' && <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <span className="truncate text-xs font-medium" title={isAr ? staff.currentFocusAr : staff.currentFocusEn}>
                            {isAr ? staff.currentFocusAr : staff.currentFocusEn}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Files Count */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                        <div className="flex items-center justify-center gap-1.5 text-[11px]">
                          <span title="عروض الأسعار" className="text-amber-800 font-bold">{staff.quotesCount}q</span>
                          <span className="text-slate-300">/</span>
                          <span title="الرحلات الميدانية" className="text-blue-800 font-bold">{staff.tripsCount}t</span>
                          <span className="text-slate-300">/</span>
                          <span title="استفسارات العملاء" className="text-emerald-800 font-bold">{staff.inquiriesCount}inq</span>
                        </div>
                      </td>

                      {/* Completion Rate (%) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800 tabular-nums">
                            {staff.completionRatePercent}%
                          </span>
                          <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${staff.completionRatePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Turnaround Speed */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {staff.avgTurnaroundHours}h
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium">
                            {isAr ? staff.speedRatingAr.split('·')[0] : staff.speedRatingEn.split('·')[0]}
                          </span>
                        </div>
                      </td>

                      {/* Workload Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          staff.workloadLoad === 'heavy'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : staff.workloadLoad === 'moderate'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : staff.workloadLoad === 'balanced'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isAr ? staff.workloadLoadAr : staff.workloadLoadEn}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end">
                        <span className="inline-flex items-center text-[#44200F] font-bold hover:underline gap-0.5 text-xs">
                          <span>{isAr ? 'تفاصيل' : 'Review'}</span>
                          <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* EXECUTIVE STAFF CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => (
            <div
              key={staff.userId}
              onClick={() => setSelectedStaff(staff)}
              className="p-4 rounded-2xl bg-white border border-[#E8DFD1] hover:border-[#C4A177] shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Header: Avatar, Name, and Workload badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="luxury-icon-box luxury-icon-box-lg luxury-icon-box-espresso font-bold text-sm">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{staff.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {isAr ? staff.jobTitleAr : staff.jobTitleEn}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    staff.workloadLoad === 'heavy'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : staff.workloadLoad === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {isAr ? staff.workloadLoadAr : staff.workloadLoadEn}
                  </span>
                </div>

                {/* What they are doing right now ("ما يقوم به الآن") */}
                <div className="mt-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD1]/80 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#795037] uppercase tracking-wider">
                    <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-sand">
                      <Compass className="w-2.5 h-2.5 text-[#795037]" />
                    </div>
                    <span>{isAr ? 'العمل الجاري تنفيذه الآن:' : 'Current Active Focus:'}</span>
                  </div>
                  <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                    {isAr ? staff.currentFocusAr : staff.currentFocusEn}
                  </p>
                </div>

                {/* Progress & Speed Metrics - Elevated Icon Boxes (Strictly Equal Height) */}
                <div className="grid grid-cols-2 gap-2 mt-3 items-stretch">
                  <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
                    <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-emerald shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <span className="luxury-box-title">
                        {isAr ? 'الإنجاز' : 'Completion'}
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm text-emerald-800 tabular-nums block mt-0.5 leading-none truncate">
                        {staff.completionRatePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="luxury-content-box luxury-content-box-sm h-full shadow-2xs">
                    <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-amber shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <span className="luxury-box-title">
                        {isAr ? 'السرعة' : 'Avg Speed'}
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm text-[#44200F] tabular-nums block mt-0.5 leading-none truncate">
                        {staff.avgTurnaroundHours}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer File Counts & Inspect Link */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px]">
                  {isAr ? `${staff.activeFilesCount} ملفات قيد العمل` : `${staff.activeFilesCount} active files`}
                </span>
                <span className="text-[#44200F] font-bold flex items-center gap-0.5">
                  <span>{isAr ? 'تفاصيل الملفات' : 'Inspect files'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. STAFF DETAIL DRAWER (Inspect specific employee's active files & rebalance workload) */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedStaff(null)}
            className="fixed inset-0 bg-[#1F0C04]/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-s border-[#E8DFD1]">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 bg-[#34180A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="luxury-icon-box luxury-icon-box-lg luxury-icon-box-gold font-bold text-base">
                  {selectedStaff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedStaff.name}</h3>
                  <p className="text-xs text-[#EDE0CC]/80">
                    {isAr ? selectedStaff.jobTitleAr : selectedStaff.jobTitleEn}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[#FAF7F2]">
              {/* Profile & Contact Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8DFD1] space-y-2">
                <div className="text-xs font-bold text-slate-700">{isAr ? 'بيانات الموظف والتواصل' : 'Employee Details'}</div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStaff.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span dir="ltr">{selectedStaff.phone}</span>
                </div>
              </div>

              {/* Current Active Task Banner ("ما يقوم به الآن") */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <div className="luxury-icon-box luxury-icon-box-xs luxury-icon-box-amber">
                    <Clock className="w-3 h-3 text-amber-700" />
                  </div>
                  <span>{isAr ? 'العمل الجاري تنفيذه في اللحظة الحالية:' : 'Current Live Operational Focus:'}</span>
                </div>
                <p className="text-xs font-medium text-slate-800 leading-relaxed">
                  {isAr ? selectedStaff.currentFocusAr : selectedStaff.currentFocusEn}
                </p>
              </div>

              {/* Active Quotes Breakdown */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">
                    {isAr ? `عروض الأسعار المسندة (${selectedStaff.activeQuotes.length})` : `Assigned Quotes (${selectedStaff.activeQuotes.length})`}
                  </h4>
                </div>

                {selectedStaff.activeQuotes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                    {isAr ? 'لا توجد عروض أسعار جارية' : 'No active quotes'}
                  </p>
                ) : (
                  selectedStaff.activeQuotes.map((q) => (
                    <div key={q.id} className="p-3 rounded-xl bg-white border border-[#E8DFD1] flex items-center justify-between gap-3 text-xs shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-gold">
                          <FileText className="w-4 h-4 text-amber-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{q.travelerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {q.quoteNumber} · {q.durationDays} days · {q.status}
                          </div>
                        </div>
                      </div>
                      {onReassignFile && (
                        <button
                          type="button"
                          onClick={() => setReassignModalFile({
                            fileType: 'quote',
                            fileId: q.id,
                            fileTitle: `${q.travelerName} (${q.quoteNumber})`,
                            currentOwnerName: selectedStaff.name
                          })}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer shrink-0"
                        >
                          {isAr ? 'إعادة تعيين' : 'Reassign'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Active Trips Breakdown */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800">
                    {isAr ? `الرحلات والتشغيل الميداني (${selectedStaff.activeTrips.length})` : `Assigned Trips (${selectedStaff.activeTrips.length})`}
                  </h4>
                </div>

                {selectedStaff.activeTrips.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-white rounded-xl border border-dashed border-slate-200 text-center">
                    {isAr ? 'لا توجد رحلات تشغيل جارية' : 'No active field trips'}
                  </p>
                ) : (
                  selectedStaff.activeTrips.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-white border border-[#E8DFD1] flex items-center justify-between gap-3 text-xs shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="luxury-icon-box luxury-icon-box-sm luxury-icon-box-sky">
                          <Compass className="w-4 h-4 text-blue-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{t.travelerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {t.fileNumber} · {t.startDate} · {t.status}
                          </div>
                        </div>
                      </div>
                      {onReassignFile && (
                        <button
                          type="button"
                          onClick={() => setReassignModalFile({
                            fileType: 'trip',
                            fileId: t.id,
                            fileTitle: `${t.travelerName} (${t.fileNumber})`,
                            currentOwnerName: selectedStaff.name
                          })}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition cursor-pointer shrink-0"
                        >
                          {isAr ? 'إعادة تعيين' : 'Reassign'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. REASSIGN WORKLOAD MODAL (Rebalance active files to available staff) */}
      {reassignModalFile && (
        <div className="fixed inset-0 z-60 overflow-hidden flex items-center justify-center p-4">
          <div
            onClick={() => setReassignModalFile(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-[#E8DFD1] space-y-4 z-10" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD1]">
              <h3 className="font-bold text-base text-slate-900">
                {isAr ? 'إعادة تعيين وتوزيع الملف' : 'Reassign Workload File'}
              </h3>
              <button
                type="button"
                onClick={() => setReassignModalFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              {isAr ? (
                <>
                  أنت على وشك نقل ملف: <strong className="text-slate-900">{reassignModalFile.fileTitle}</strong> من الموظف الحالي (<strong className="text-slate-900">{reassignModalFile.currentOwnerName}</strong>) إلى زميل آخر لتسريع التنفيذ وتخفيف ضغط العمل.
                </>
              ) : (
                <>
                  You are reassigning <strong className="text-slate-900">{reassignModalFile.fileTitle}</strong> from <strong className="text-slate-900">{reassignModalFile.currentOwnerName}</strong> to another staff member.
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {isAr ? 'اختر الموظف البديل:' : 'Select Target Staff Member:'}
              </label>
              <select
                value={selectedTargetStaffId}
                onChange={(e) => setSelectedTargetStaffId(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#C4A177]"
              >
                <option value="">{isAr ? '-- اختر موظفاً --' : '-- Choose staff member --'}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.customJobTitleAr || u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DFD1]">
              <button
                type="button"
                onClick={() => setReassignModalFile(null)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={!selectedTargetStaffId}
                onClick={handleExecuteReassign}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#44200F] hover:bg-[#5E3118] text-[#C4A177] transition cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {isAr ? 'تأكيد النقل' : 'Confirm Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. BULK STAFF CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EDE0CC]">
              <div className="flex items-center gap-3">
                <div className="luxury-icon-box luxury-icon-box-lg luxury-icon-box-gold">
                  <FileUp className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                    {isAr ? 'استيراد كوادر وفريق العمل (CSV)' : 'Bulk Staff & Operations Import (CSV)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr
                      ? 'إضافة سريعة للمرشدين السياحيين والسائقين ومسؤولي المبيعات والعمليات دفعة واحدة'
                      : 'Quickly register tour guides, drivers, sales specialists, and operations leads in bulk'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedImportResult(null);
                  setImportSuccessCount(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Notification */}
            {importSuccessCount !== null && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  {isAr
                    ? `تم استيراد ${importSuccessCount} موظفاً وكادراً بنجاح، وتحديث سجلات الإدارة!`
                    : `Successfully imported ${importSuccessCount} staff members into active company records!`}
                </span>
              </div>
            )}

            {/* Template Download & File Upload Area */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-700">
                  {isAr ? 'بيانات ملف الإكسل / CSV:' : 'Spreadsheet CSV Data:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const template = generateStaffImportTemplate(isAr);
                    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = isAr ? 'نموذج_استيراد_كوادر_رحال.csv' : 'rihal_staff_import_template.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[#44200F] hover:text-[#C4A177] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#C4A177]" />
                  <span>{isAr ? 'تحميل نموذج CSV فارغ' : 'Download Sample CSV'}</span>
                </button>
              </div>

              {/* File Upload Selector */}
              <div className="flex items-center gap-3">
                <label className="flex-1 border-2 border-dashed border-[#E8DFD1] hover:border-[#C4A177] rounded-2xl p-4 text-center cursor-pointer transition bg-[#FAF7F2]/50 hover:bg-[#FAF7F2]">
                  <Upload className="w-6 h-6 text-[#795037] mx-auto mb-1" />
                  <span className="text-xs font-bold text-slate-800 block">
                    {isAr ? 'اضغط لاختيار ملف CSV أو اسحبه هنا' : 'Click to browse CSV file or drag & drop'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {isAr ? 'صيغة Comma-Separated Values (.csv)' : 'Standard CSV (.csv, .txt)'}
                  </span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = (evt.target?.result as string) || '';
                        setImportCsvText(content);
                        const parsed = parseStaffCsv(content, workspace.id);
                        setParsedImportResult(parsed);
                        setImportSuccessCount(null);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>
              </div>

              {/* Direct Paste Fallback */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">
                  {isAr ? 'أو الصق محتوى الملف مباشرة:' : 'Or paste CSV raw text directly:'}
                </label>
                <textarea
                  rows={4}
                  value={importCsvText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setImportCsvText(text);
                    if (text.trim()) {
                      const parsed = parseStaffCsv(text, workspace.id);
                      setParsedImportResult(parsed);
                    } else {
                      setParsedImportResult(null);
                    }
                    setImportSuccessCount(null);
                  }}
                  placeholder={
                    isAr
                      ? 'الاسم,البريد الإلكتروني,الدور,الهاتف\nطارق منصور,tarek@example.com,مرشد سياحي,+201002345678'
                      : 'Name,Email,Role,Phone\nTarek Mansour,tarek@example.com,Guide,+201002345678'
                  }
                  className="w-full font-mono text-xs p-3 rounded-xl border border-[#EDE0CC] bg-[#FAF7F2] text-slate-900 outline-none focus:border-[#C4A177]"
                />
              </div>
            </div>

            {/* Validation Preview Table */}
            {parsedImportResult && parsedImportResult.records.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#EDE0CC]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    {isAr ? 'معاينة السجلات المقروءة:' : 'Parsed Records Preview:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                      {isAr ? `${parsedImportResult.validCount} صالح` : `${parsedImportResult.validCount} valid`}
                    </span>
                    {parsedImportResult.invalidCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold text-[10px]">
                        {isAr ? `${parsedImportResult.invalidCount} أخطاء` : `${parsedImportResult.invalidCount} errors`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-[#EDE0CC] bg-white text-xs">
                  <table className="w-full text-start">
                    <thead className="bg-[#FAF7F2] text-[11px] font-bold text-[#44200F] border-b border-[#EDE0CC]">
                      <tr>
                        <th className="p-2 text-start">{isAr ? 'الاسم' : 'Name'}</th>
                        <th className="p-2 text-start">{isAr ? 'البريد' : 'Email'}</th>
                        <th className="p-2 text-start">{isAr ? 'الدور' : 'Role'}</th>
                        <th className="p-2 text-start">{isAr ? 'الهاتف' : 'Phone'}</th>
                        <th className="p-2 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedImportResult.records.map((rec) => (
                        <tr key={rec.id} className={rec.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                          <td className="p-2 font-bold text-slate-900">{rec.name || '—'}</td>
                          <td className="p-2 font-mono text-[11px] text-slate-600">{rec.email || '—'}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF7F2] border border-[#E8DFD1] text-[#44200F]">
                              {rec.role}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-[11px] text-slate-600">{rec.phone || '—'}</td>
                          <td className="p-2">
                            {rec.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                                <Check className="w-3 h-3" />
                                {isAr ? 'جاهز' : 'Ready'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[10px]" title={rec.errors.join(', ')}>
                                <AlertCircle className="w-3 h-3" />
                                {rec.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EDE0CC]">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedImportResult(null);
                  setImportSuccessCount(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                disabled={!parsedImportResult || parsedImportResult.validCount === 0}
                onClick={() => {
                  if (parsedImportResult && parsedImportResult.users.length > 0) {
                    if (onImportStaff) {
                      onImportStaff(parsedImportResult.users);
                    }
                    setImportSuccessCount(parsedImportResult.validCount);
                    setTimeout(() => {
                      setIsImportModalOpen(false);
                      setParsedImportResult(null);
                      setImportSuccessCount(null);
                    }, 1400);
                  }
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#44200F] hover:bg-[#5E3118] text-[#C4A177] transition cursor-pointer disabled:opacity-40 shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `تأكيد استيراد (${parsedImportResult?.validCount || 0}) موظفاً`
                    : `Confirm Import (${parsedImportResult?.validCount || 0}) Staff`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
