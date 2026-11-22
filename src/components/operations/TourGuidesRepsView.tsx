import { writeSafePrintDocument } from '../../lib/safePrint';
import React, { useState, useMemo } from 'react';
import { 
  UserCheck, Search, Phone, MessageSquare, Printer, CheckCircle2, 
  Clock, AlertCircle, Plus, Edit3, X, Save, Shield, 
  MapPin, Plane, Users, Globe2, Award, Calendar, ArrowRight, ArrowLeft
} from 'lucide-react';
import { TripFile, loadTrips, saveTrips } from '../../lib/tripStore';
import { Workspace, UILanguage } from '../../types';
import { GuidanceTrigger } from '../common/GuidanceTrigger';

interface TourGuidesRepsViewProps {
  workspace: Workspace;
  uiLang: UILanguage;
  onNavigateToTrips?: () => void;
}

interface GuideAssignment {
  id: string;
  tripId: string;
  fileNumber: string;
  travelerName: string;
  role: 'Egyptologist Guide' | 'Airport Representative';
  name: string;
  phone: string;
  languages: string[];
  licenseNo: string;
  dailyProgram: string;
  meetingPoint: string;
  meetingTime: string;
  paxCount: number;
  flightDetails?: string;
  status: 'Assigned' | 'Briefed' | 'On-Duty' | 'Completed';
  notes?: string;
}

export const TourGuidesRepsView: React.FC<TourGuidesRepsViewProps> = ({
  workspace,
  uiLang,
  onNavigateToTrips,
}) => {
  const isAr = uiLang === 'ar';
  const [trips, setTrips] = useState<TripFile[]>(() => loadTrips());
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<GuideAssignment | null>(null);

  // Convert trips into concrete Guide & Rep assignments
  const assignments: GuideAssignment[] = useMemo(() => {
    const list: GuideAssignment[] = [];

    trips.forEach(t => {
      // Egyptologist Guide Assignment
      const guideName = t.guideName || '';
      const guideLang = t.guideLanguage || '';
      const languages = guideLang ? guideLang.split(/[,/&]/).map(s => s.trim()).filter(Boolean) : [];

      list.push({
        id: `guide-${t.id}`,
        tripId: t.id,
        fileNumber: t.fileNumber,
        travelerName: t.travelerName,
        role: 'Egyptologist Guide',
        name: guideName || (isAr ? 'لم يُعيّن مرشد بعد' : 'Guide not assigned'),
        phone: t.guidePhone || '',
        languages: languages.length ? languages : (guideName ? ['English'] : []),
        licenseNo: t.guideLicense || '',
        dailyProgram: t.services.find(s => s.supplierType.toLowerCase().includes('excursion') || s.serviceName.toLowerCase().includes('pyramid') || s.serviceName.toLowerCase().includes('karnak'))?.serviceName || 'Giza Pyramids Plateau, Sphinx & Grand Egyptian Museum (GEM)',
        meetingPoint: 'Hotel Lobby Reception',
        meetingTime: '08:30 AM',
        paxCount: t.passengers?.length || 4,
        status: t.status === 'Operating' ? 'On-Duty' : (guideName ? 'Briefed' : 'Assigned'),
        notes: t.tourPasscode ? `Tour Passcode: ${t.tourPasscode}` : '',
      });

      // Airport Rep Assignment for Arrivals
      if (t.arrival && t.arrival.flight) {
        list.push({
          id: `rep-${t.id}`,
          tripId: t.id,
          fileNumber: t.fileNumber,
          travelerName: t.travelerName,
          role: 'Airport Representative',
          name: t.airportRepName || (isAr ? 'مندوب المطار (قيد التكليف)' : 'Airport Representative (Unassigned)'),
          phone: t.airportRepPhone || '',
          languages: ['Arabic', 'English'],
          licenseNo: '',
          dailyProgram: `Meet & Assist inside Immigration Hall, Luggage Carousel & Customs clearance`,
          meetingPoint: `${t.arrival.airport || 'Cairo Airport (CAI)'} - Arrivals Gate`,
          meetingTime: t.arrival.time || '14:30',
          paxCount: t.passengers?.length || 4,
          flightDetails: `${t.arrival.flight} (${t.arrival.time})`,
          status: 'Assigned',
          notes: `Signboard: "${t.travelerName.split(' ')[0]} Family - ${workspace.name}"`,
        });
      }
    });

    return list;
  }, [trips, isAr, workspace.name]);

  // Filtered
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (roleFilter !== 'All' && a.role !== roleFilter) return false;
      if (langFilter !== 'All' && !a.languages.some(l => l.toLowerCase().includes(langFilter.toLowerCase()))) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          a.name.toLowerCase().includes(q) ||
          a.licenseNo.toLowerCase().includes(q) ||
          a.fileNumber.toLowerCase().includes(q) ||
          a.travelerName.toLowerCase().includes(q) ||
          a.dailyProgram.toLowerCase().includes(q) ||
          a.languages.some(l => l.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [assignments, roleFilter, langFilter, searchQuery]);

  // KPIs
  const stats = useMemo(() => {
    const total = assignments.length;
    const guides = assignments.filter(a => a.role === 'Egyptologist Guide').length;
    const reps = assignments.filter(a => a.role === 'Airport Representative').length;
    const onDuty = assignments.filter(a => a.status === 'On-Duty').length;
    return { total, guides, reps, onDuty };
  }, [assignments]);

  // WhatsApp Guide Itinerary Dispatch
  const sendGuideWhatsApp = (a: GuideAssignment) => {
    const text = isAr
      ? `*خطاب تكليف وبرنامج تشغيل مرشد سياحي - ${workspace.name}*\n` +
        `----------------------------------------\n` +
        `🏛️ *المرشد / المندوب:* ${a.name} (${a.licenseNo})\n` +
        `📁 *رقم الفوج / الملف:* ${a.fileNumber}\n` +
        `👥 *اسم الضيف / الفوج:* ${a.travelerName} (${a.paxCount} ركاب)\n` +
        `🗣️ *اللغة:* ${a.languages.join(' / ')}\n` +
        `🕒 *موعد ومكان اللقاء:* ${a.meetingTime} - ${a.meetingPoint}\n` +
        `🏛️ *برنامج اليوم:* ${a.dailyProgram}\n` +
        (a.flightDetails ? `✈️ *بيانات الرحلة:* ${a.flightDetails}\n` : '') +
        (a.notes ? `📝 *تعليمات خاصة:* ${a.notes}\n` : '') +
        `----------------------------------------\n` +
        `📞 *هاتف غرفة العمليات:* ${workspace.contactPhone || '+20 100 249 1000'}\n` +
        `نتمنى لكم جولة موفقة مع ضيوفنا الكرام.`
      : `*OFFICIAL TOUR GUIDE BRIEFING & ITINERARY - ${workspace.name}*\n` +
        `----------------------------------------\n` +
        `🏛️ *Guide / Rep:* ${a.name} (${a.licenseNo})\n` +
        `📁 *File Reference:* ${a.fileNumber}\n` +
        `👥 *Group / Guest:* ${a.travelerName} (${a.paxCount} Pax)\n` +
        `🗣️ *Spoken Language:* ${a.languages.join(' / ')}\n` +
        `🕒 *Meeting Time & Place:* ${a.meetingTime} - ${a.meetingPoint}\n` +
        `🏛️ *Daily Program:* ${a.dailyProgram}\n` +
        (a.flightDetails ? `✈️ *Flight Details:* ${a.flightDetails}\n` : '') +
        (a.notes ? `📝 *Special Notes:* ${a.notes}\n` : '') +
        `----------------------------------------\n` +
        `📞 *Operations Hotline:* ${workspace.contactPhone || '+20 100 249 1000'}\n` +
        `Have an exceptional touring day with our guests.`;

    const cleanPhone = (a.phone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Official Syndicate & Ministry Guide Assignment Letter Print
  const printAssignmentLetter = (a: GuideAssignment) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const title = `Guide-Letter-${a.licenseNo}-${a.fileNumber}`;
    writeSafePrintDocument(w, `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}">
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
          .header { border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 4px; }
          .subtitle { text-align: center; font-size: 12px; color: #475569; }
          .badge { display: inline-block; background: #0f172a; color: white; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; }
          .card-title { font-weight: bold; font-size: 12px; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #e2e8f0; }
          .row-label { color: #64748b; font-size: 11px; }
          .row-val { font-weight: bold; }
          .full-box { border: 2px solid #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 20px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; }
          .stamp-box { width: 140px; height: 90px; border: 2px dashed #94a3b8; border-radius: 6px; margin: 8px auto 0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin:0; font-size: 16px;">${workspace.name}</h2>
            ${workspace.contactPhone ? `<div style="font-size: 11px; color: #475569;">Operations Desk: <b>${workspace.contactPhone}</b></div>` : ''}
            ${workspace.contactEmail ? `<div style="font-size: 11px; color: #475569;">Email: <b>${workspace.contactEmail}</b></div>` : ''}
          </div>
          <div style="text-align: right;">
            <div class="badge">خطاب تكليف إرشاد سياحي معتمد</div>
            <div style="font-size: 11px; margin-top: 4px; font-weight: bold;">Official Tour Guide Assignment</div>
            <div style="font-size: 11px; color: #64748b;">Ref: MOT-GD-${Date.now().toString().slice(-6)}</div>
          </div>
        </div>

        <div class="title">${isAr ? 'خطاب تكليف مرشد سياحي / مندوب مطار' : 'OFFICIAL TOUR GUIDE ASSIGNMENT LETTER'}</div>
        <div class="subtitle">${isAr ? 'موجه إلى السادة مسؤولي تفتيش الآثار وشرطة السياحة بمواقع الزيارات والمطارات' : 'Addressed to Egyptian Supreme Council of Antiquities & Tourism Police Checkpoints'}</div>

        <div class="grid" style="margin-top: 20px;">
          <div class="card">
            <div class="card-title">${isAr ? 'بيانات المرشد / المندوب' : 'GUIDE / REPRESENTATIVE DETAILS'}</div>
            <div class="row"><span class="row-label">${isAr ? 'الاسم بالكامل' : 'Full Name'}:</span><span class="row-val">${a.name}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'رقم الترخيص / النقابة' : 'License / Syndicate No.'}:</span><span class="row-val" style="color:#0284c7;">${a.licenseNo}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'اللغات المعتمدة' : 'Languages'}:</span><span class="row-val">${a.languages.join(', ')}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'رقم الهاتف' : 'Mobile Phone'}:</span><span class="row-val">${a.phone}</span></div>
          </div>

          <div class="card">
            <div class="card-title">${isAr ? 'بيانات الفوج السياحي' : 'TOUR GROUP PARTICULAR'}</div>
            <div class="row"><span class="row-label">${isAr ? 'رقم ملف التشغيل' : 'File Number'}:</span><span class="row-val" style="font-family: monospace;">${a.fileNumber}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'اسم الفوج / الضيف' : 'Group Name'}:</span><span class="row-val">${a.travelerName}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'عدد أفراد الفوج' : 'Pax Count'}:</span><span class="row-val">${a.paxCount} ${isAr ? 'أفراد' : 'Pax'}</span></div>
            <div class="row"><span class="row-label">${isAr ? 'موعد اللقاء' : 'Meeting Time'}:</span><span class="row-val">${a.meetingTime}</span></div>
          </div>
        </div>

        <div class="full-box">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #0f172a;">${isAr ? 'المواقع والمعالم الأثرية المكلف بها' : 'ARCHAEOLOGICAL SITES & DAILY ITINERARY'}</div>
          <div style="font-size: 14px; font-weight: bold; color: #0369a1;">${a.dailyProgram}</div>
          <div style="margin-top: 8px; font-size: 12px;"><b>${isAr ? 'نقطة الانطلاق' : 'Meeting Point'}:</b> ${a.meetingPoint}</div>
          ${a.notes ? `<div style="margin-top: 8px; font-size: 11px; color: #475569; background: #f1f5f9; padding: 6px; border-radius: 4px;"><b>${isAr ? 'تعليمات' : 'Notes'}:</b> ${a.notes}</div>` : ''}
        </div>

        <div class="footer">
          <div>
            <div><b>${isAr ? 'مدير قطاع السياحة المستجلبة' : 'Tour Operations Director'}</b></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${workspace.name}</div>
            <div class="stamp-box">Official Company Stamp</div>
          </div>
          <div>
            <div><b>${isAr ? 'توقيع المرشد المستلم' : 'Guide Signature'}</b></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Receipt & Code of Ethics</div>
            <div style="margin-top: 40px; border-bottom: 1px solid #94a3b8; width: 140px;"></div>
          </div>
          <div>
            <div><b>${isAr ? 'ختم مفتش الموقع / المطار' : 'Antiquities Inspector Seal'}</b></div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Site Entry Check</div>
            <div class="stamp-box">Site Ticket Desk</div>
          </div>
        </div>

        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  // Handle save
  const handleSaveAssignment = () => {
    if (!editingAssignment) return;
    const targetTrip = trips.find(t => t.id === editingAssignment.tripId);
    if (targetTrip) {
      const updatedTrip: TripFile = {
        ...targetTrip,
        guideName: editingAssignment.name,
        guidePhone: editingAssignment.phone,
        guideLanguage: editingAssignment.languages.join(' / '),
        updatedAt: new Date().toISOString(),
      };
      const nextTrips = trips.map(t => t.id === targetTrip.id ? updatedTrip : t);
      setTrips(nextTrips);
      saveTrips(nextTrips);
    }
    setIsEditModalOpen(false);
    setEditingAssignment(null);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#172033] via-[#1e2d4a] to-[#172033] text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <GuidanceTrigger
          sectionKey="trips_workspace"
          uiLang={uiLang}
          variant="gold"
          pinned={true}
          size="sm"
          label={isAr ? 'دليل الإرشاد' : 'Guides Guide'}
        />
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 ltr:pr-14 rtl:pl-14">

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-400/20 text-violet-300 border border-violet-400/30">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'نقابة المرشدين السياحيين وممثلو المطارات' : 'Egyptologist Guides & Airport Reps Desk'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {isAr ? 'المرشدون السياحيون وممثلو المطارات' : 'Tour Guides & Airport Representatives'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isAr
                ? 'تعيين وإحاطة المرشدين المرخصين من وزارة السياحة والآثار وممثلي المطارات. إرسال البرامج اليومية وقوائم الأسماء عبر واتساب، وطباعة خطابات التكليف الرسمية لمفتشي الآثار.'
                : 'Manage licensed Egyptian Egyptologists and airport representatives. Dispatch daily monument itineraries and guest manifests via WhatsApp, and generate formal assignment letters for archaeological sites.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToTrips && (
              <button
                onClick={onNavigateToTrips}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-2 cursor-pointer border border-white/10"
              >
                <span>{isAr ? 'العودة لملفات الأفواج' : 'Back to Trip Files'}</span>
                {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Live Counters (Strictly Equal Height) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 items-stretch">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between min-h-[82px] h-full">
            <div className="text-xs text-slate-300 font-medium truncate">{isAr ? 'إجمالي التكليفات' : 'Total Assignments'}</div>
            <div className="text-2xl font-black text-white mt-1 leading-none">{stats.total}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between min-h-[82px] h-full">
            <div className="text-xs text-violet-300 font-medium truncate">{isAr ? 'مرشدو آثار معتمدون' : 'Licensed Egyptologists'}</div>
            <div className="text-2xl font-black text-violet-400 mt-1 leading-none">{stats.guides}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between min-h-[82px] h-full">
            <div className="text-xs text-amber-300 font-medium truncate">{isAr ? 'مندوبو استقبال مطارات' : 'Airport Reps on Duty'}</div>
            <div className="text-2xl font-black text-amber-400 mt-1 leading-none">{stats.reps}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between min-h-[82px] h-full">
            <div className="text-xs text-emerald-300 font-medium flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">{isAr ? 'في الجولة الميدانية' : 'On-Duty Now'}</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1 leading-none">{stats.onDuty}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث باسم المرشد، رقم الترخيص، اللغة، الفوج، أو المعلم الأثري...' : 'Search by guide name, license number, language, group, or monument...'}
            className="w-full ps-10 pe-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="All">{isAr ? 'جميع الأدوار' : 'All Roles'}</option>
            <option value="Egyptologist Guide">{isAr ? 'مرشد سياحي (Egyptologist)' : 'Egyptologist Guide'}</option>
            <option value="Airport Representative">{isAr ? 'مندوب مطار (Airport Rep)' : 'Airport Representative'}</option>
          </select>

          {/* Language Filter */}
          <select
            value={langFilter}
            onChange={e => setLangFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="All">{isAr ? 'جميع اللغات' : 'All Languages'}</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish / Español</option>
            <option value="German">German / Deutsch</option>
            <option value="French">French / Français</option>
            <option value="Italian">Italian / Italiano</option>
            <option value="Russian">Russian</option>
            <option value="Arabic">Arabic / عربي</option>
          </select>
        </div>
      </div>

      {/* Assignments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssignments.map(a => {
          const isGuide = a.role === 'Egyptologist Guide';
          return (
            <div 
              key={a.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Card Top Header */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`luxury-icon-box luxury-icon-box-sm ${isGuide ? 'luxury-icon-box-purple' : 'luxury-icon-box-amber'}`}>
                      {isGuide ? <UserCheck className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-slate-500 block leading-none">
                        {a.fileNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[170px] block mt-0.5">
                        {a.travelerName}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    a.status === 'On-Duty'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {a.status}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3.5">
                  {/* Guide Profile Box */}
                  <div className="p-3 rounded-xl bg-violet-50/40 border border-violet-100/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs">{a.name}</div>
                      {a.licenseNo ? (
                        <span className="text-[10px] font-mono font-bold bg-white text-violet-700 px-2 py-0.5 rounded border border-violet-200">
                          {a.licenseNo}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isAr ? 'بدون ترخيص مسجل' : 'No license'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {a.languages.map(l => (
                        <span key={l} className="px-2 py-0.5 rounded-md bg-white text-[10px] font-semibold text-slate-700 border border-slate-200">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Program / Assignment Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                      <span className="font-semibold leading-snug">{a.dailyProgram}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 ps-5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{a.meetingTime}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{a.paxCount} {isAr ? 'أفراد' : 'Pax'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Meeting location */}
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-150 flex items-center justify-between">
                    <span className="truncate"><b>{isAr ? 'اللقاء:' : 'Meet:'}</b> {a.meetingPoint}</span>
                    <a
                      href={`tel:${a.phone}`}
                      className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition ms-2 shrink-0"
                      title={isAr ? 'اتصال مباشر' : 'Call'}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {a.notes && (
                    <div className="text-[10px] text-slate-500 bg-amber-50/70 p-2 rounded-lg border border-amber-100 leading-tight">
                      <b>{isAr ? 'ملاحظة:' : 'Note:'}</b> {a.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2">
                <button
                  onClick={() => sendGuideWhatsApp(a)}
                  className="px-2 py-2 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                  title={isAr ? 'إرسال البرنامج وقائمة الضيوف عبر الواتساب' : 'Send WhatsApp Itinerary & Manifest'}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                </button>

                <button
                  onClick={() => printAssignmentLetter(a)}
                  className="px-2 py-2 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                  title={isAr ? 'طباعة خطاب تكليف رسمي معتمد A4' : 'Print A4 Assignment Letter'}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'خطاب A4' : 'Letter A4'}</span>
                </button>

                <button
                  onClick={() => {
                    setEditingAssignment(a);
                    setIsEditModalOpen(true);
                  }}
                  className="px-2 py-2 rounded-xl text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center gap-1 transition cursor-pointer"
                  title={isAr ? 'تعديل أو تعيين مرشد' : 'Edit Guide Assignment'}
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'تعديل' : 'Edit'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {isAr ? 'لا توجد تكليفات إرشاد أو مندوبين حالياً' : 'No guide or rep assignments scheduled yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isAr 
              ? 'عند تسجيل رحلات جديدة وتحديد مواعيد الجولات أو رحلات الطيران، ستظهر مهام المرشدين ومندوبي المطار هنا تلقائياً.'
              : 'Guide assignments and airport representative tasks will appear here automatically as trips and excursions are scheduled.'}
          </p>
        </div>
      )}

      {/* Edit Guide Modal */}
      {isEditModalOpen && editingAssignment && (
        <div className="fixed inset-0 z-50 bg-[#0f2035]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">
                  {isAr ? 'تعديل بيانات المرشد السياحي / المندوب' : 'Edit Guide / Rep Assignment'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAr ? 'اسم المرشد السياحي / المندوب' : 'Guide / Representative Name'}
                </label>
                <input
                  type="text"
                  value={editingAssignment.name}
                  onChange={e => setEditingAssignment({ ...editingAssignment, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAr ? 'رقم الهاتف (واتساب)' : 'Phone Number (WhatsApp)'}
                </label>
                <input
                  type="text"
                  value={editingAssignment.phone}
                  onChange={e => setEditingAssignment({ ...editingAssignment, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAr ? 'رقم ترخيص النقابة / التصريح' : 'Syndicate License No.'}
                  </label>
                  <input
                    type="text"
                    value={editingAssignment.licenseNo}
                    onChange={e => setEditingAssignment({ ...editingAssignment, licenseNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isAr ? 'اللغات المعتمدة' : 'Spoken Languages'}
                  </label>
                  <input
                    type="text"
                    value={editingAssignment.languages.join(', ')}
                    onChange={e => setEditingAssignment({ 
                      ...editingAssignment, 
                      languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                    })}
                    placeholder="English, Spanish"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {isAr ? 'حالة التكليف' : 'Assignment Status'}
                </label>
                <select
                  value={editingAssignment.status}
                  onChange={e => setEditingAssignment({ ...editingAssignment, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="Assigned">Assigned (تم التعيين)</option>
                  <option value="Briefed">Briefed (تم تسليم البرنامج)</option>
                  <option value="On-Duty">On-Duty (في الجولة الميدانية الآن)</option>
                  <option value="Completed">Completed (مكتمل)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveAssignment}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-700 hover:bg-violet-800 text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ التكليف' : 'Save Assignment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
