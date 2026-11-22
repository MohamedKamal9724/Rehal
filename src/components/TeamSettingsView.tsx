import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Settings, Shield, Plus, Mail, Check, 
  Trash2, EyeOff, Eye, FileText, History, Building2, 
  Download, Upload, Database, RefreshCw, FileCheck, 
  HardDrive, CheckCircle2, AlertTriangle, Sparkles, Moon, 
  ShieldCheck, Phone, MapPin, Search, UserCheck, Lock, X,
  Edit3, Briefcase, Copy, Layers, ChevronRight, CheckSquare,
  UserPlus, Compass, ArrowRight, ArrowLeft, ExternalLink, HelpCircle
} from 'lucide-react';
import { 
  User, UserRole, Workspace, AuditLog, UILanguage, 
  CustomStaffRole, StaffMember, PermissionLevel, OperationalSection 
} from '../types';
import { repository } from '../lib/storage';
import { 
  calculateOnboardingProgress, 
  getSavedOnboardingDraft, 
  OnboardingTaskItem 
} from '../lib/onboardingCalculator';
import { CircularProgressIndicator } from './onboarding/CircularProgressIndicator';
import { GuidanceTrigger } from './common/GuidanceTrigger';
import { AgencyProfileEditor } from './agency/AgencyProfileEditor';

interface TeamSettingsViewProps {
  workspace: Workspace;
  currentUser: User;
  users: User[];
  auditLogs: AuditLog[];
  uiLang: UILanguage;
  onUpdateWorkspace: (updates: Partial<Workspace>) => void;
  onSaveUser: (user: User) => void;
  onReloadData?: () => void;
  onOpenPublicShowcase?: () => void;
  onLaunchOnboardingWizard?: () => void;
  initialTab?: 'setup' | 'agency' | 'team' | 'audit';
}

export const SECTIONS_CONFIG: { 
  key: OperationalSection; 
  labelAr: string; 
  labelEn: string; 
  descAr: string; 
  descEn: string; 
}[] = [
  { 
    key: 'quotes', 
    labelAr: 'عروض الأسعار والتسعير', 
    labelEn: 'Quotations & Pricing', 
    descAr: 'بناء وتعديل عروض الأسعار، حساب هوامش الربحية، وتصدير PDF.',
    descEn: 'Draft proposals, adjust margin percentages, and export PDFs.'
  },
  { 
    key: 'inquiries', 
    labelAr: 'صندوق الطلبات والاستفسارات', 
    labelEn: 'Inquiries & Inbox', 
    descAr: 'استقبال وفلترة طلبات الواتساب واستفسارات وكلاء السياحة بالخارج.',
    descEn: 'Process inbound WhatsApp inquiries and B2B partner tour leads.'
  },
  { 
    key: 'rates', 
    labelAr: 'مكتبة أسعار الموردين', 
    labelEn: 'Supplier Rates Library', 
    descAr: 'إدارة عقود الفنادق، الكروزات النيلية، النقل، ورسوم المعالم الأثرية.',
    descEn: 'Manage hotel contracts, Nile cruise rates, vehicles, and monument passes.'
  },
  { 
    key: 'trips', 
    labelAr: 'العمليات الميدانية والوفود', 
    labelEn: 'Field Operations & Tours', 
    descAr: 'متابعة حركة الوفود يوماً بيوم، توقيتات الوصول، ومسار الرحلات.',
    descEn: 'Oversee daily delegation schedules, arrival milestones, and tours.'
  },
  { 
    key: 'vouchers', 
    labelAr: 'قسائم الفنادق وأوامر التشغيل', 
    labelEn: 'Vouchers & Run Sheets', 
    descAr: 'إصدار قسائم الإقامة وتوزيع خطط التحرك على السائقين والمرشدين.',
    descEn: 'Issue accommodation vouchers and operational driver dispatches.'
  },
  { 
    key: 'fleet', 
    labelAr: 'أسطول الحافلات والليموزين', 
    labelEn: 'Transport & Fleet', 
    descAr: 'توزيع المركبات، أرقام اللوحات، وبيانات السائقين المناوبين.',
    descEn: 'Chauffeur assignments, vehicle license plates, and driver contact.'
  },
  { 
    key: 'guides', 
    labelAr: 'سجل المرشدين الأثريين', 
    labelEn: 'Tour Guides Roster', 
    descAr: 'تكليفات المرشدين المرخصين واللغات الأجنبية المعتمدة للمجموعات.',
    descEn: 'Licensed Egyptologist guides roster, language assignments, and contacts.'
  },
  { 
    key: 'weather', 
    labelAr: 'الطقس الحي ومطارات المقاصد', 
    labelEn: 'Live Weather & APIs', 
    descAr: 'متابعة درجات الحرارة الحية في الأقصر، أسوان، البحر الأحمر، وسيناء.',
    descEn: 'Live temperatures, wind conditions, and airport forecasts.'
  },
  { 
    key: 'analytics', 
    labelAr: 'التقارير والإحصائيات التشغيلية', 
    labelEn: 'Operations Analytics', 
    descAr: 'إحصائيات إشغال المجموعات، نسب إغلاق العروض، ووفود الموسم.',
    descEn: 'Conversion ratios, traveler nationality counts, and operational KPIs.'
  },
  { 
    key: 'settings', 
    labelAr: 'بيانات الشركة والملف التشغيلي', 
    labelEn: 'Company Profile & Operations', 
    descAr: 'تعديل بيانات الشركة، قنوات التواصل التشغيلية، الهوية، وإدارة الفريق.',
    descEn: 'Operational profile, contact channels, branding, and team management.'
  },
];

const DEFAULT_PERMISSIONS: Record<OperationalSection, PermissionLevel> = {
  quotes: 'view',
  inquiries: 'view',
  rates: 'none',
  trips: 'view',
  vouchers: 'view',
  fleet: 'none',
  guides: 'none',
  weather: 'view',
  analytics: 'none',
  settings: 'none',
};

export const TeamSettingsView: React.FC<TeamSettingsViewProps> = ({
  workspace,
  currentUser,
  users = [],
  auditLogs = [],
  uiLang,
  onUpdateWorkspace,
  onSaveUser,
  onReloadData,
  onOpenPublicShowcase,
  onLaunchOnboardingWizard,
  initialTab = 'agency'
}) => {
  const isAr = uiLang === 'ar';
  const [activeTab, setActiveTab] = useState<'setup' | 'agency' | 'team' | 'audit'>(initialTab);
  const [teamSubTab, setTeamSubTab] = useState<'staff' | 'roles'>('staff');
  const [setupTaskFilter, setSetupTaskFilter] = useState<'all' | 'incomplete' | 'completed' | 'skipped'>('all');

  // Synchronize activeTab if parent navigates specifically to a tab
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Evaluate task-based onboarding score dynamically from real workspace & draft data
  const onboardingDraft = useMemo(() => getSavedOnboardingDraft(), [workspace]);
  const onboardingScore = useMemo(() => {
    return calculateOnboardingProgress(onboardingDraft, workspace);
  }, [onboardingDraft, workspace]);

  // Agency profile state
  const [name, setName] = useState(workspace.name || '');
  const [arabicName, setArabicName] = useState(workspace.arabicName || '');
  const [phone, setPhone] = useState(workspace.contactPhone || '');
  const [whatsapp, setWhatsapp] = useState(workspace.whatsappNumber || '');
  const [email, setEmail] = useState(workspace.contactEmail || '');
  const [address, setAddress] = useState(workspace.address || '');
  const [description, setDescription] = useState(workspace.description || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Custom Roles state from repository
  const [customRoles, setCustomRoles] = useState<CustomStaffRole[]>(() => {
    return repository.getCustomRoles(workspace.id);
  });

  const deduplicateTeamList = (list: User[]): User[] => {
    const seenEmails = new Set<string>();
    const seenNames = new Set<string>();
    const result: User[] = [];
    for (const u of list) {
      if (!u) continue;
      const emailKey = (u.email || '').trim().toLowerCase();
      const nameKey = (u.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (emailKey && seenEmails.has(emailKey)) continue;
      if (nameKey && seenNames.has(nameKey)) continue;
      if (emailKey) seenEmails.add(emailKey);
      if (nameKey) seenNames.add(nameKey);
      result.push(u);
    }
    return result;
  };

  // Team users state - populated with users prop or repository (deduplicated)
  const [teamUsers, setTeamUsers] = useState<User[]>(() => {
    const list = users && users.length > 0 ? users : repository.getUsers(workspace.id);
    return deduplicateTeamList(list);
  });

  // Keep teamUsers synchronized if parent updates users prop
  useEffect(() => {
    if (users && users.length > 0) {
      setTeamUsers(deduplicateTeamList(users));
    }
  }, [users]);

  // Transient saved confirmation banner/toast
  const [savedUserId, setSavedUserId] = useState<string | null>(null);

  // Search in team
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Permissions preview modal
  const [previewingUser, setPreviewingUser] = useState<User | null>(null);

  // User Add / Edit Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('Operations');
  const [userCustomRoleId, setUserCustomRoleId] = useState<string>('');
  const [userCustomJobTitleAr, setUserCustomJobTitleAr] = useState('');
  const [userCustomJobTitleEn, setUserCustomJobTitleEn] = useState('');
  const [userStatus, setUserStatus] = useState<'active' | 'invited' | 'inactive'>('active');

  // Role Creation / Editing Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomStaffRole | null>(null);
  const [roleTitleAr, setRoleTitleAr] = useState('');
  const [roleTitleEn, setRoleTitleEn] = useState('');
  const [roleDescAr, setRoleDescAr] = useState('');
  const [roleDescEn, setRoleDescEn] = useState('');
  const [rolePermissions, setRolePermissions] = useState<Record<OperationalSection, PermissionLevel>>(DEFAULT_PERMISSIONS);

  // Audit filter state
  const [auditSearch, setAuditSearch] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkspace({
      name,
      arabicName,
      contactPhone: phone,
      whatsappNumber: whatsapp,
      contactEmail: email,
      address,
      description,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // ASSIGN CUSTOM ROLE VIA DROPDOWN (Direct inline mapping & persistence)
  const handleAssignRoleToUser = (u: User, newRoleId: string) => {
    const matchedRole = customRoles.find(r => r.id === newRoleId);
    const updatedUser: User = {
      ...u,
      customRoleId: newRoleId || undefined,
      customJobTitleAr: matchedRole ? matchedRole.titleAr : u.customJobTitleAr,
      customJobTitleEn: matchedRole ? matchedRole.titleEn : u.customJobTitleEn,
    };

    repository.saveUser(updatedUser);
    onSaveUser(updatedUser);
    setTeamUsers(prev => prev.map(item => item.id === updatedUser.id ? updatedUser : item));
    setSavedUserId(u.id);
    setTimeout(() => setSavedUserId(null), 2500);
  };

  // UPDATE CUSTOM JOB TITLE FREELY (As requested: "هو اللي هيكتب اسمه الوظيفي")
  const handleUpdateUserJobTitle = (u: User, titleAr: string, titleEn: string) => {
    const updatedUser: User = {
      ...u,
      customJobTitleAr: titleAr,
      customJobTitleEn: titleEn,
    };
    repository.saveUser(updatedUser);
    onSaveUser(updatedUser);
    setTeamUsers(prev => prev.map(item => item.id === updatedUser.id ? updatedUser : item));
  };

  // TOGGLE USER STATUS
  const handleToggleUserStatus = (u: User) => {
    const nextStatus: User['status'] = u.status === 'active' ? 'inactive' : 'active';
    const updatedUser: User = {
      ...u,
      status: nextStatus,
    };
    repository.saveUser(updatedUser);
    onSaveUser(updatedUser);
    setTeamUsers(prev => prev.map(item => item.id === updatedUser.id ? updatedUser : item));
  };

  // OPEN USER ADD/EDIT MODAL
  const handleOpenUserModal = (u?: User) => {
    if (u) {
      setEditingUser(u);
      setUserName(u.name);
      setUserEmail(u.email);
      setUserPhone(u.phone || '');
      setUserRole(u.role);
      setUserCustomRoleId(u.customRoleId || '');
      setUserCustomJobTitleAr(u.customJobTitleAr || '');
      setUserCustomJobTitleEn(u.customJobTitleEn || '');
      setUserStatus(u.status || 'active');
    } else {
      setEditingUser(null);
      setUserName('');
      setUserEmail('');
      setUserPhone('');
      setUserRole('Operations');
      setUserCustomRoleId(customRoles[0]?.id || '');
      setUserCustomJobTitleAr('');
      setUserCustomJobTitleEn('');
      setUserStatus('active');
    }
    setUserModalOpen(true);
  };

  // SAVE USER FROM MODAL
  const handleSaveUserFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    const matchedRole = customRoles.find(r => r.id === userCustomRoleId);
    const userToSave: User = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      workspaceId: workspace.id,
      name: userName.trim(),
      email: userEmail.trim(),
      phone: userPhone.trim(),
      role: userRole,
      language: uiLang,
      status: userStatus,
      customRoleId: userCustomRoleId || undefined,
      customJobTitleAr: userCustomJobTitleAr.trim() || (matchedRole ? matchedRole.titleAr : ''),
      customJobTitleEn: userCustomJobTitleEn.trim() || (matchedRole ? matchedRole.titleEn : ''),
    };

    repository.saveUser(userToSave);
    onSaveUser(userToSave);
    setTeamUsers(prev => {
      const exists = prev.some(item => item.id === userToSave.id);
      if (exists) return prev.map(item => item.id === userToSave.id ? userToSave : item);
      return [...prev, userToSave];
    });
    setUserModalOpen(false);
  };

  // DELETE USER
  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert(isAr ? 'لا يمكن حذف الحساب الحالي المسجل دخولك به' : 'You cannot delete your own active account');
      return;
    }
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا العضو من فريق العمل؟' : 'Remove this team member?')) {
      const updated = teamUsers.filter(u => u.id !== userId);
      try {
        localStorage.setItem('qde_users', JSON.stringify(updated));
      } catch {}
      setTeamUsers(updated);
    }
  };

  // OPEN ROLE MODAL
  const handleOpenRoleModal = (role?: CustomStaffRole) => {
    if (role) {
      setEditingRole(role);
      setRoleTitleAr(role.titleAr);
      setRoleTitleEn(role.titleEn);
      setRoleDescAr(role.descriptionAr || '');
      setRoleDescEn(role.descriptionEn || '');
      setRolePermissions({ ...role.permissions });
    } else {
      setEditingRole(null);
      setRoleTitleAr('');
      setRoleTitleEn('');
      setRoleDescAr('');
      setRoleDescEn('');
      setRolePermissions({ ...DEFAULT_PERMISSIONS });
    }
    setRoleModalOpen(true);
  };

  // SAVE ROLE
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitleAr.trim() && !roleTitleEn.trim()) return;

    const roleToSave: CustomStaffRole = {
      id: editingRole ? editingRole.id : `role-custom-${Date.now()}`,
      workspaceId: workspace.id,
      titleAr: roleTitleAr.trim() || roleTitleEn.trim(),
      titleEn: roleTitleEn.trim() || roleTitleAr.trim(),
      descriptionAr: roleDescAr.trim(),
      descriptionEn: roleDescEn.trim(),
      isSystem: editingRole ? editingRole.isSystem : false,
      permissions: rolePermissions,
      createdAt: editingRole ? editingRole.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    repository.saveCustomRole(roleToSave);
    const updated = repository.getCustomRoles(workspace.id);
    setCustomRoles(updated);
    setRoleModalOpen(false);
  };

  // DELETE ROLE
  const handleDeleteRole = (roleId: string) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا الدور الوظيفي؟' : 'Delete this custom role?')) {
      repository.deleteCustomRole(roleId, workspace.id);
      const updated = repository.getCustomRoles(workspace.id);
      setCustomRoles(updated);
    }
  };

  // Filter users by search query
  const filteredUsers = teamUsers.filter(u => {
    if (!staffSearchQuery.trim()) return true;
    const q = staffSearchQuery.toLowerCase().trim();
    const role = customRoles.find(r => r.id === u.customRoleId);
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.customJobTitleAr && u.customJobTitleAr.includes(q)) ||
      (u.customJobTitleEn && u.customJobTitleEn.toLowerCase().includes(q)) ||
      (role && (role.titleAr.includes(q) || role.titleEn.toLowerCase().includes(q))) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const filteredLogs = auditLogs.filter(log => 
    !auditSearch.trim() || 
    log.action.toLowerCase().includes(auditSearch.toLowerCase()) || 
    log.entityType.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EDE0CC] shadow-xs">
        <GuidanceTrigger
          sectionKey={activeTab === 'team' ? 'team' : 'settings'}
          uiLang={uiLang}
          pinned={true}
          size="sm"
          label={isAr ? 'دليل الإعدادات' : 'Settings Guide'}
        />
        <div className="ltr:pr-14 rtl:pl-14">
          <h1 className="text-xl font-extrabold text-[#44200F]">
            {isAr ? 'إدارة الشركة وفريق العمل والصلاحيات' : 'Company Governance, Staff & Permissions'}
          </h1>
          <p className="text-xs text-[#795037] mt-1">
            {isAr 
              ? 'تخصيص المسميات الوظيفية بحرية كاملة، وتوزيع مستويات العرض والتحرير على كل قسم تشغيلي.'
              : 'Customize job titles freely and assign granular view or edit permissions per operational section.'}
          </p>
        </div>


        {/* Tab Switcher Pills - Strictly Equal Height & Non-Wrapping on Mobile */}
        <div className="luxury-tab-bar p-1 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`luxury-nav-pill ${
              activeTab === 'setup'
                ? 'luxury-nav-pill-active'
                : 'luxury-nav-pill-inactive'
            }`}
          >
            <div className="luxury-nav-pill-icon">
              <Compass className="w-4 h-4 text-[#C4A177]" />
            </div>
            <span className="whitespace-nowrap">{isAr ? 'دليل الإعداد والجاهزية' : 'Company Setup'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              onboardingScore.percentage === 100 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-[#EDE0CC] text-[#44200F]'
            }`}>
              {onboardingScore.percentage}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agency')}
            className={`luxury-nav-pill ${
              activeTab === 'agency'
                ? 'luxury-nav-pill-active'
                : 'luxury-nav-pill-inactive'
            }`}
          >
            <div className="luxury-nav-pill-icon">
              <Building2 className="w-4 h-4 text-[#C4A177]" />
            </div>
            <span className="whitespace-nowrap">{isAr ? 'هوية وبيانات الشركة' : 'Company Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`luxury-nav-pill ${
              activeTab === 'team'
                ? 'luxury-nav-pill-active'
                : 'luxury-nav-pill-inactive'
            }`}
          >
            <div className="luxury-nav-pill-icon">
              <Users className="w-4 h-4 text-[#C4A177]" />
            </div>
            <span className="whitespace-nowrap">{isAr ? 'الموظفين والأدوار المخصصة' : 'Staff & Custom Roles'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EDE0CC] text-[#44200F]">
              {teamUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`luxury-nav-pill ${
              activeTab === 'audit'
                ? 'luxury-nav-pill-active'
                : 'luxury-nav-pill-inactive'
            }`}
          >
            <div className="luxury-nav-pill-icon">
              <History className="w-4 h-4 text-[#C4A177]" />
            </div>
            <span className="whitespace-nowrap">{isAr ? 'سجل العمليات' : 'Audit Trail'}</span>
          </button>
        </div>
      </div>

      {/* TAB 0: COMPANY SETUP & READINESS DASHBOARD */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* Hero Readiness Cockpit Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE0CC] shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <CircularProgressIndicator 
                  percentage={onboardingScore.percentage}
                  size="lg"
                  isArabic={isAr}
                  completedTasks={onboardingScore.completedTasks}
                  totalTasks={onboardingScore.totalTasks}
                  sublabel={isAr ? 'نسبة جاهزية الشركة' : 'Readiness Score'}
                />

                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC]">
                    <Sparkles className="w-3.5 h-3.5 text-[#C4A177]" />
                    <span>{isAr ? 'نظام احتساب الجاهزية الحقيقي' : 'Real Task-Based Evaluator'}</span>
                  </div>
                  <h2 className="text-xl font-black text-[#44200F]">
                    {isAr ? 'جاهزية الشركة ومساحة العمل التشغيلية' : 'Company Setup & Workspace Readiness'}
                  </h2>
                  <p className="text-xs text-[#795037] leading-relaxed">
                    {isAr
                      ? 'يتم احتساب النسبة المئوية بدقة من خلال المهام المنجزة فعلياً داخل مساحة العمل (بيانات الاتصال، تكوين الفريق، مصفوفة الصلاحيات، وتفضيلات التسعير) لضمان سرعة إطلاق العمليات.'
                      : 'Readiness percentage is calculated strictly from completed operational setup milestones (contact channels, staff assignments, permission matrix, and pricing rules).'}
                  </p>
                </div>
              </div>

              {/* Relaunch Wizard Button */}
              {onLaunchOnboardingWizard && (
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={onLaunchOnboardingWizard}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#44200F] text-[#FAF7F2] hover:bg-[#795037] text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Compass className="w-4 h-4 text-[#C4A177]" />
                    <span>{isAr ? 'فتح معالج الإعداد التفاعلي (7 خطوات)' : 'Launch Guided Setup Wizard'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick KPI Counters — Equal Height Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#EDE0CC]/60 text-xs items-stretch">
              <div className="h-full p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] flex flex-col justify-between">
                <div className="text-[11px] text-[#795037] font-semibold">{isAr ? 'المهام الإلزامية' : 'Required Tasks'}</div>
                <div className="text-base font-black text-[#44200F] mt-0.5 tabular-nums">
                  {onboardingScore.requiredCompleted} / {onboardingScore.totalRequired}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  {onboardingScore.allRequiredDone ? (isAr ? '✓ مكتملة بالكامل' : '✓ 100% Complete') : (isAr ? `متبقي ${onboardingScore.missingRequiredCount}` : `${onboardingScore.missingRequiredCount} pending`)}
                </div>
              </div>

              <div className="h-full p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] flex flex-col justify-between">
                <div className="text-[11px] text-[#795037] font-semibold">{isAr ? 'المهام الاختيارية' : 'Optional Tasks'}</div>
                <div className="text-base font-black text-[#44200F] mt-0.5 tabular-nums">
                  {onboardingScore.optionalCompleted} / {onboardingScore.totalOptional}
                </div>
                <div className="text-[10px] text-[#795037] mt-1">
                  {isAr ? 'تحسينات واجهة وملف' : 'Showcase extras'}
                </div>
              </div>

              <div className="h-full p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] flex flex-col justify-between">
                <div className="text-[11px] text-[#795037] font-semibold">{isAr ? 'فريق العمل المسجل' : 'Staff Members'}</div>
                <div className="text-base font-black text-[#44200F] mt-0.5 tabular-nums">
                  {teamUsers.length} {isAr ? 'أعضاء' : 'Members'}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  {customRoles.length} {isAr ? 'أدوار مخصصة' : 'custom roles'}
                </div>
              </div>

              <div className="h-full p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] flex flex-col justify-between">
                <div className="text-[11px] text-[#795037] font-semibold">{isAr ? 'حالة الدليل العام' : 'Public Directory'}</div>
                <div className="text-sm font-black text-amber-800 mt-0.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>{isAr ? 'قيد المراجعة' : 'Under Review'}</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  {isAr ? 'لوحة التحكم مفعلة 100%' : 'Dashboard 100% unlocked'}
                </div>
              </div>
            </div>
          </div>

          {/* Task Filtering & List Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EDE0CC] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#44200F]">
                  {isAr ? 'قائمة مهام الإعداد المنهجية (7 خطوات)' : 'Setup Task Milestones & Breakdown'}
                </h3>
                <p className="text-xs text-[#795037] mt-0.5">
                  {isAr
                    ? 'يمكنك استكمال أي خطوة مباشرة من هنا أو التنقل للقسم المخصص لها بضغطة زر واحدة.'
                    : 'Complete any missing item right here or jump directly to its relevant management section.'}
                </p>
              </div>

              {/* Task Filter Buttons - Equal Height & Single Line */}
              <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] rounded-xl border border-[#EDE0CC] shrink-0 text-xs font-semibold overflow-x-auto no-scrollbar max-w-full">
                <button
                  type="button"
                  onClick={() => setSetupTaskFilter('all')}
                  className={`h-8.5 px-3 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center ${
                    setupTaskFilter === 'all'
                      ? 'bg-[#44200F] text-[#FAF7F2]'
                      : 'text-[#795037] hover:text-[#44200F]'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'} ({onboardingScore.totalTasks})
                </button>
                <button
                  type="button"
                  onClick={() => setSetupTaskFilter('incomplete')}
                  className={`h-8.5 px-3 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center ${
                    setupTaskFilter === 'incomplete'
                      ? 'bg-[#44200F] text-[#FAF7F2]'
                      : 'text-[#795037] hover:text-[#44200F]'
                  }`}
                >
                  {isAr ? 'المتبقي' : 'Incomplete'} ({onboardingScore.tasks.filter(t => !t.isCompleted && !t.isSkipped).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSetupTaskFilter('completed')}
                  className={`h-8.5 px-3 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center ${
                    setupTaskFilter === 'completed'
                      ? 'bg-[#44200F] text-[#FAF7F2]'
                      : 'text-[#795037] hover:text-[#44200F]'
                  }`}
                >
                  {isAr ? 'المكتمل' : 'Completed'} ({onboardingScore.completedTasks})
                </button>
                <button
                  type="button"
                  onClick={() => setSetupTaskFilter('skipped')}
                  className={`h-8.5 px-3 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center ${
                    setupTaskFilter === 'skipped'
                      ? 'bg-[#44200F] text-[#FAF7F2]'
                      : 'text-[#795037] hover:text-[#44200F]'
                  }`}
                >
                  {isAr ? 'تم تخطيه' : 'Skipped'} ({onboardingScore.tasks.filter(t => t.isSkipped).length})
                </button>
              </div>
            </div>

            {/* Tasks Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {onboardingScore.tasks
                .filter(task => {
                  if (setupTaskFilter === 'completed') return task.isCompleted;
                  if (setupTaskFilter === 'incomplete') return !task.isCompleted && !task.isSkipped;
                  if (setupTaskFilter === 'skipped') return task.isSkipped;
                  return true;
                })
                .map(task => {
                  const isDone = task.isCompleted;
                  const isSkipped = task.isSkipped;
                  return (
                    <div 
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[160px] h-full ${
                        isDone 
                          ? 'bg-emerald-50/20 border-emerald-200' 
                          : isSkipped 
                            ? 'bg-slate-50 border-slate-200 opacity-80' 
                            : 'bg-[#FAF7F2] border-[#EDE0CC] hover:border-[#C4A177]'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Header badges */}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md font-bold bg-[#EDE0CC] text-[#44200F]">
                              {isAr ? `خطوة ${task.stepNumber}` : `Step ${task.stepNumber}`}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                              task.isRequired 
                                ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {task.isRequired ? (isAr ? 'إلزامي' : 'Required') : (isAr ? 'اختياري' : 'Optional')}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{isAr ? 'مكتمل' : 'Done'}</span>
                              </span>
                            ) : isSkipped ? (
                              <span className="font-semibold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-md text-[10px]">
                                {isAr ? 'تم التخطي' : 'Skipped'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>{isAr ? 'بحاجة للإكمال' : 'Pending'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Task Title & Description */}
                        <div>
                          <div className="text-xs font-bold text-[#44200F] truncate">
                            {isAr ? task.labelAr : task.labelEn}
                          </div>
                          <p className="text-[11px] text-[#795037] mt-0.5 leading-snug line-clamp-2 h-9">
                            {isAr ? task.descriptionAr : task.descriptionEn}
                          </p>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 mt-3 border-t border-[#EDE0CC]/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isAr ? `الوزن النسبي: ${task.weight}%` : `Weight: ${task.weight}%`}
                        </span>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1.5">
                          {task.category === 'company' && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('agency')}
                              className="text-[11px] font-bold text-[#44200F] hover:text-[#795037] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isAr ? 'تعديل البيانات' : 'Edit Info'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {task.category === 'team' && (
                            <button
                              type="button"
                              onClick={() => { setActiveTab('team'); setTeamSubTab('staff'); }}
                              className="text-[11px] font-bold text-[#44200F] hover:text-[#795037] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isAr ? 'إدارة الفريق' : 'Manage Team'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {task.category === 'use_cases' && (
                            <button
                              type="button"
                              onClick={() => { setActiveTab('agency'); }}
                              className="text-[11px] font-bold text-[#44200F] hover:text-[#795037] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isAr ? 'تخصيص الأنشطة' : 'Workflows'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}

                          {task.category === 'profile' && onOpenPublicShowcase && (
                            <button
                              type="button"
                              onClick={onOpenPublicShowcase}
                              className="text-[11px] font-bold text-[#44200F] hover:text-[#795037] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isAr ? 'معاينة العرض العام' : 'Showcase Preview'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}

                          {onLaunchOnboardingWizard && (!isDone || isSkipped) && (
                            <button
                              type="button"
                              onClick={onLaunchOnboardingWizard}
                              className="text-[11px] font-bold text-[#C4A177] hover:text-[#44200F] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isAr ? 'فتح في المعالج' : 'Open in Wizard'}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Legal Exemption Assurance Banner */}
          <div className="p-4 bg-[#FAF7F2] border border-[#EDE0CC] rounded-2xl flex items-start gap-3 text-xs text-[#795037]">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#44200F]">
                {isAr ? 'إعفاء تشغيلي من المستندات الحكومية' : 'Zero Government Red-Tape Policy'}
              </div>
              <p className="text-[11px] text-[#795037] mt-0.5 leading-relaxed">
                {isAr
                  ? 'منصة رحال تكتفي بالبيانات التشغيلية الأساسية لبدء بناء عروض الأسعار وتشغيل الوفود. لا نطلب السجل التجاري أو الرقم الضريبي أو رخصة وزارة السياحة كشرط لإتمام الإعداد أو استخدام لوحة التحكم.'
                  : 'RIHAL strictly relies on operational data to draft quotes and dispatch delegations. Commercial registration numbers, tax IDs, and tourism ministry certificates are not required to unlock your workspace.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: AGENCY PROFILE & SOCIAL MEDIA STUDIO */}
      {activeTab === 'agency' && (
        <AgencyProfileEditor
          workspace={workspace}
          uiLang={uiLang}
          onUpdateWorkspace={onUpdateWorkspace}
          onOpenPublicShowcase={onOpenPublicShowcase}
          onReloadData={onReloadData}
        />
      )}

      {/* TAB 2: STAFF & CUSTOM ROLES ENGINE */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Sub Navigation Bar: User Management Table vs Custom Roles Matrix */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2] p-4 rounded-3xl border border-[#EDE0CC]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTeamSubTab('staff')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  teamSubTab === 'staff'
                    ? 'bg-[#44200F] text-[#C4A177] shadow-xs'
                    : 'bg-white text-[#795037] hover:bg-[#EDE0CC] border border-[#EDE0CC]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول إدارة الموظفين وصلاحيات الفريق' : 'Team Members & Role Assignments'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EDE0CC] text-[#44200F] font-mono">
                  {teamUsers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTeamSubTab('roles')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  teamSubTab === 'roles'
                    ? 'bg-[#44200F] text-[#C4A177] shadow-xs'
                    : 'bg-white text-[#795037] hover:bg-[#EDE0CC] border border-[#EDE0CC]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isAr ? 'المسميات الوظيفية ومصفوفة الصلاحيات' : 'Custom Roles & Permission Matrix'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EDE0CC] text-[#44200F] font-mono">
                  {customRoles.length}
                </span>
              </button>
            </div>

            {/* Quick Action Button */}
            {teamSubTab === 'staff' ? (
              <button
                type="button"
                onClick={() => handleOpenUserModal()}
                className="px-4 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة عضو جديد وتحديد دوره' : 'Add Team Member'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenRoleModal()}
                className="px-4 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إنشاء مسمى وظيفي وصلاحيات جديدة' : 'Create Custom Role'}</span>
              </button>
            )}
          </div>

          {/* SUB-VIEW 1: USER MANAGEMENT TABLE WITH CUSTOM ROLE DROPDOWN COLUMN */}
          {teamSubTab === 'staff' && (
            <div className="space-y-4">
              {/* Search Bar & Stats Header */}
              <div className="bg-white p-4 rounded-2xl border border-[#EDE0CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={staffSearchQuery}
                    onChange={e => setStaffSearchQuery(e.target.value)}
                    placeholder={isAr ? 'ابحث بالاسم أو المسمى الوظيفي أو البريد...' : 'Search team by name, title, or email...'}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#EDE0CC] text-xs text-[#44200F] focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center gap-3 text-xs text-[#795037]">
                  <span className="font-medium">
                    {isAr ? `إجمالي أعضاء الفريق: ${filteredUsers.length}` : `Team Members: ${filteredUsers.length}`}
                  </span>
                  <span className="text-[#EDE0CC]">•</span>
                  <span className="font-medium">
                    {isAr ? `الأدوار المخصصة المتاحة: ${customRoles.length}` : `Available Roles: ${customRoles.length}`}
                  </span>
                </div>
              </div>

              {/* USER MANAGEMENT TABLE */}
              <div className="bg-white rounded-3xl border border-[#EDE0CC] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#EDE0CC] text-[#795037] font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4 text-start">{isAr ? 'عضو فريق العمل' : 'Team Member'}</th>
                        <th className="py-3.5 px-4 text-start">{isAr ? 'الدور الأساسي' : 'System Role'}</th>
                        <th className="py-3.5 px-4 text-start min-w-[280px]">
                          <span className="flex items-center gap-1.5 text-[#44200F]">
                            <Shield className="w-3.5 h-3.5 text-[#C4A177]" />
                            <span>{isAr ? 'الدور الوظيفي المخصص (مصفوفة الصلاحيات)' : 'Assigned Custom Role'}</span>
                          </span>
                        </th>
                        <th className="py-3.5 px-4 text-start min-w-[200px]">
                          <span className="flex items-center gap-1.5 text-[#44200F]">
                            <Briefcase className="w-3.5 h-3.5 text-[#C4A177]" />
                            <span>{isAr ? 'المسمى الوظيفي المكتوب' : 'Custom Job Title'}</span>
                          </span>
                        </th>
                        <th className="py-3.5 px-4 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                        <th className="py-3.5 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE0CC]/60">
                      {filteredUsers.map(u => {
                        const assignedRole = customRoles.find(r => r.id === u.customRoleId);
                        const isMe = currentUser.id === u.id;
                        
                        // Calculate active view & edit counts
                        let editCount = 0;
                        let viewCount = 0;
                        if (assignedRole) {
                          Object.values(assignedRole.permissions).forEach(lvl => {
                            if (lvl === 'edit') editCount++;
                            else if (lvl === 'view') viewCount++;
                          });
                        }

                        return (
                          <tr key={u.id} className="hover:bg-[#FAF7F2]/50 transition group">
                            {/* Member details */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#44200F] text-[#C4A177] font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[#44200F] text-xs truncate">{u.name}</span>
                                    {isMe && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-[#EDE0CC] text-[#44200F] text-[9px] font-bold">
                                        {isAr ? 'أنت' : 'You'}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-500 block truncate font-mono">{u.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Base Role */}
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] font-bold text-[11px] inline-block">
                                {u.role}
                              </span>
                            </td>

                            {/* DROPDOWN COLUMN: ASSIGN CUSTOM ROLE */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={u.customRoleId || ''}
                                    onChange={(e) => handleAssignRoleToUser(u, e.target.value)}
                                    className="w-full px-3 py-1.5 bg-[#FAF7F2] hover:bg-white focus:bg-white border border-[#EDE0CC] rounded-xl text-xs font-bold text-[#44200F] focus:outline-none focus:ring-1 focus:ring-[#C4A177] cursor-pointer shadow-2xs transition"
                                  >
                                    <option value="">{isAr ? '— بدون دور مخصص —' : '— No Custom Role —'}</option>
                                    {customRoles.map(cr => (
                                      <option key={cr.id} value={cr.id}>
                                        {isAr ? cr.titleAr : cr.titleEn} {cr.isSystem ? `(${isAr ? 'رئيسي' : 'System'})` : ''}
                                      </option>
                                    ))}
                                  </select>

                                  {savedUserId === u.id && (
                                    <span className="shrink-0 flex items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-200 animate-pulse">
                                      <Check className="w-3 h-3 me-0.5" />
                                      <span>{isAr ? 'تم الحفظ' : 'Saved'}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Permissions Summary Badges */}
                                {assignedRole ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <Edit3 className="w-2.5 h-2.5" />
                                      <span>{editCount} {isAr ? 'أقسام تحرير' : 'Edit'}</span>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
                                      <Eye className="w-2.5 h-2.5" />
                                      <span>{viewCount} {isAr ? 'أقسام عرض' : 'View'}</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewingUser(u)}
                                      className="text-[10px] font-bold text-[#795037] hover:text-[#44200F] hover:underline cursor-pointer"
                                    >
                                      {isAr ? 'عرض المصفوفة' : 'View Matrix'}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic block">
                                    {isAr ? 'اختر دوراً لمنح صلاحيات تشغيلية' : 'Select a role to grant section access'}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Manager Freely Typed Custom Job Title */}
                            <td className="py-3.5 px-4">
                              <input
                                type="text"
                                value={isAr ? (u.customJobTitleAr || '') : (u.customJobTitleEn || u.customJobTitleAr || '')}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateUserJobTitle(
                                    u, 
                                    isAr ? val : (u.customJobTitleAr || val), 
                                    isAr ? (u.customJobTitleEn || val) : val
                                  );
                                }}
                                placeholder={isAr ? 'اكتب المسمى الوظيفي هنا...' : 'Type custom job title...'}
                                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] hover:bg-white focus:bg-white border border-[#EDE0CC] rounded-xl text-xs text-[#44200F] font-semibold focus:outline-none focus:ring-1 focus:ring-[#C4A177] transition"
                              />
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition inline-flex items-center gap-1 cursor-pointer ${
                                  u.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                }`}
                                title={isAr ? 'اضغط لتغيير الحالة' : 'Toggle status'}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span>{u.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق' : 'Inactive')}</span>
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-end">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenUserModal(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#44200F] hover:bg-[#FAF7F2] transition cursor-pointer"
                                  title={isAr ? 'تعديل بيانات الحساب' : 'Edit member'}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title={isAr ? 'حذف العضو' : 'Remove member'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 bg-white p-8">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">
                      {isAr ? 'لا يوجد أعضاء يطابقون عبارة البحث' : 'No team members match your search'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: CUSTOM ROLES & PERMISSIONS MATRIX */}
          {teamSubTab === 'roles' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customRoles.map(role => {
                  const assignedCount = teamUsers.filter(u => u.customRoleId === role.id).length;
                  return (
                    <div
                      key={role.id}
                      className="bg-white rounded-2xl p-5 border border-[#EDE0CC] shadow-2xs space-y-4 hover:border-[#C4A177] transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Title & Actions */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EDE0CC]">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm text-[#44200F]">
                                {isAr ? role.titleAr : role.titleEn}
                              </h3>
                              {role.isSystem && (
                                <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#795037] border border-[#EDE0CC] text-[10px] font-bold">
                                  {isAr ? 'دور رئيسي' : 'System Role'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#795037] mt-0.5">
                              {isAr ? role.titleEn : role.titleAr}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenRoleModal(role)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#44200F] hover:bg-[#FAF7F2] transition cursor-pointer"
                              title={isAr ? 'تعديل الصلاحيات' : 'Edit permissions'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {!role.isSystem && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title={isAr ? 'حذف الدور' : 'Delete role'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {(role.descriptionAr || role.descriptionEn) && (
                          <p className="text-xs text-slate-500 pt-2 leading-relaxed">
                            {isAr ? role.descriptionAr : role.descriptionEn}
                          </p>
                        )}

                        {/* Detailed Permission Matrix Breakdown */}
                        <div className="pt-3 space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {isAr ? 'تفاصيل الصلاحيات على الأقسام:' : 'Section Access Breakdown:'}
                          </span>

                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {SECTIONS_CONFIG.map(sec => {
                              const perm = role.permissions[sec.key] || 'none';
                              return (
                                <div
                                  key={sec.key}
                                  className={`p-2 rounded-xl border flex items-center justify-between text-[11px] h-10 min-h-[40px] ${
                                    perm === 'edit'
                                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-bold'
                                      : perm === 'view'
                                      ? 'bg-sky-50/60 border-sky-200 text-sky-900 font-medium'
                                      : 'bg-[#FAF7F2]/60 border-[#EDE0CC] text-slate-400'
                                  }`}
                                >
                                  <span className="truncate">{isAr ? sec.labelAr : sec.labelEn}</span>
                                  <span className="text-[10px] uppercase font-bold shrink-0 ps-1">
                                    {perm === 'edit' ? (isAr ? 'تحرير' : 'Edit') : perm === 'view' ? (isAr ? 'عرض' : 'View') : (isAr ? 'مغلق' : 'None')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-3 border-t border-[#EDE0CC] flex items-center justify-between text-[11px] text-slate-500">
                        <span>{assignedCount} {isAr ? 'موظفين معينين بهذا الدور' : 'team members assigned'}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(role)}
                          className="font-bold text-[#44200F] hover:text-[#795037] flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAr ? 'تعديل المصفوفة' : 'Configure Matrix'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900">{isAr ? 'سجل العمليات والنشاط التشغيلي' : 'Local Operational Audit Log'}</h3>
              <p className="text-[11px] text-slate-500">{isAr ? 'متابعة التعديلات الميدانية على عروض الأسعار والتعريفات' : 'Track rate changes, quote drafts, and profile adjustments'}</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className={`w-3.5 h-3.5 text-slate-400 absolute inset-y-0 my-auto ${isAr ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder={isAr ? 'بحث في السجل...' : 'Search logs...'}
                className={`w-full py-1.5 ${isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'} bg-slate-50 border border-slate-200 rounded-xl text-xs`}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <History className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-medium text-slate-800 block">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.entityType} • ID: {log.entityId}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  {isAr ? 'لا توجد أنشطة مطابقة للبحث' : 'No matching audit records'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT TEAM USER */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#EDE0CC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#44200F]">
                  {editingUser 
                    ? (isAr ? 'تعديل بيانات العضو والصلاحيات' : 'Edit Team Member') 
                    : (isAr ? 'إضافة عضو جديد وتخصيص صلاحياته' : 'Add New Team Member')}
                </h3>
                <span className="text-[11px] text-[#795037]">
                  {isAr ? 'اكتب المسمى الوظيفي بحرية وحدد نموذج الصلاحيات المخصص' : 'Type custom job title and assign role template'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setUserModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserFromModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'اسم العضو بالكامل' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder={isAr ? 'أحمد الشناوي' : 'Ahmed El-Shenawy'}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    placeholder="ahmed.ops@rihal.eg"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'الدور الأساسي بالنظام' : 'System Role'} *
                  </label>
                  <select
                    value={userRole}
                    onChange={e => setUserRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl font-bold text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                  >
                    <option value="Owner">{isAr ? 'مالك (Owner)' : 'Owner'}</option>
                    <option value="Admin">{isAr ? 'مدير نظام (Admin)' : 'Admin'}</option>
                    <option value="Sales Agent">{isAr ? 'مسؤول مبيعات (Sales Agent)' : 'Sales Agent'}</option>
                    <option value="Operations">{isAr ? 'عمليات وتشغيل (Operations)' : 'Operations'}</option>
                    <option value="Viewer">{isAr ? 'مراقب (Viewer)' : 'Viewer'}</option>
                  </select>
                </div>
              </div>

              {/* MANAGER FREELY TYPES CUSTOM JOB TITLE */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#44200F]">
                  <Briefcase className="w-4 h-4 text-[#C4A177]" />
                  <span>{isAr ? 'المسمى الوظيفي المخصص (يكتبه المدير بحرية)' : 'Custom Job Title (Freely Written by Manager)'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#795037] mb-1">
                      {isAr ? 'المسمى الوظيفي بالعربية' : 'Job Title in Arabic'}
                    </label>
                    <input
                      type="text"
                      value={userCustomJobTitleAr}
                      onChange={e => setUserCustomJobTitleAr(e.target.value)}
                      placeholder={isAr ? 'مثال: منسق استقبال مطارات وحركة' : 'e.g. منسق استقبال مطار'}
                      className="w-full px-3 py-2 bg-white border border-[#EDE0CC] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#795037] mb-1">
                      {isAr ? 'المسمى الوظيفي بالإنجليزية' : 'Job Title in English'}
                    </label>
                    <input
                      type="text"
                      value={userCustomJobTitleEn}
                      onChange={e => setUserCustomJobTitleEn(e.target.value)}
                      placeholder="e.g. Cairo Airport Meet & Greet Specialist"
                      className="w-full px-3 py-2 bg-white border border-[#EDE0CC] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                    />
                  </div>
                </div>
              </div>

              {/* ROLE TEMPLATE SELECTION DROPDOWN */}
              <div>
                <label className="block font-bold text-[#44200F] mb-1">
                  {isAr ? 'الدور الوظيفي المخصص (مصفوفة الصلاحيات)' : 'Assigned Role Permissions Template'}
                </label>
                <select
                  value={userCustomRoleId}
                  onChange={e => {
                    const newId = e.target.value;
                    setUserCustomRoleId(newId);
                    const matched = customRoles.find(r => r.id === newId);
                    if (matched) {
                      if (!userCustomJobTitleAr) setUserCustomJobTitleAr(matched.titleAr);
                      if (!userCustomJobTitleEn) setUserCustomJobTitleEn(matched.titleEn);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl text-xs font-bold text-[#44200F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                >
                  <option value="">{isAr ? '— بدون دور مخصص —' : '— No Custom Role —'}</option>
                  {customRoles.map(r => (
                    <option key={r.id} value={r.id}>
                      {isAr ? r.titleAr : r.titleEn} - ({isAr ? r.titleEn : r.titleAr})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-[#44200F] mb-1">
                  {isAr ? 'حالة الحساب' : 'Account Status'}
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="userStatus"
                      checked={userStatus === 'active'}
                      onChange={() => setUserStatus('active')}
                      className="text-[#44200F] focus:ring-[#C4A177]"
                    />
                    <span className="font-bold text-emerald-800">{isAr ? 'نشط (Active)' : 'Active'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="userStatus"
                      checked={userStatus === 'inactive'}
                      onChange={() => setUserStatus('inactive')}
                      className="text-[#44200F] focus:ring-[#C4A177]"
                    />
                    <span className="text-slate-500">{isAr ? 'معلق مؤقتاً (Inactive)' : 'Inactive'}</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EDE0CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE0CC] text-[#795037] hover:bg-[#FAF7F2] font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  {editingUser 
                    ? (isAr ? 'حفظ التعديلات' : 'Save Changes') 
                    : (isAr ? 'إضافة العضو' : 'Add Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PREVIEW PERMISSION MATRIX FOR USER */}
      {previewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#EDE0CC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#44200F]">
                  {isAr ? `مصفوفة الصلاحيات: ${previewingUser.name}` : `Permission Matrix: ${previewingUser.name}`}
                </h3>
                <span className="text-[11px] text-[#795037]">
                  {isAr 
                    ? (previewingUser.customJobTitleAr || previewingUser.customJobTitleEn || previewingUser.role)
                    : (previewingUser.customJobTitleEn || previewingUser.customJobTitleAr || previewingUser.role)}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setPreviewingUser(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const role = customRoles.find(r => r.id === previewingUser.customRoleId);
              if (!role) {
                return (
                  <div className="p-6 text-center text-xs text-slate-500">
                    {isAr ? 'لا يوجد دور وظيفي مخصص لهذا العضو حالياً.' : 'No custom role assigned to this member currently.'}
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EDE0CC] flex items-center justify-between text-xs">
                    <span className="text-[#795037]">{isAr ? 'نموذج الدور المعتمد:' : 'Assigned Role Template:'}</span>
                    <span className="font-bold text-[#44200F]">{isAr ? role.titleAr : role.titleEn}</span>
                  </div>

                  <div className="space-y-1.5">
                    {SECTIONS_CONFIG.map(sec => {
                      const lvl = role.permissions[sec.key] || 'none';
                      return (
                        <div
                          key={sec.key}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            lvl === 'edit'
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-bold'
                              : lvl === 'view'
                              ? 'bg-sky-50/60 border-sky-200 text-sky-900 font-medium'
                              : 'bg-[#FAF7F2]/60 border-[#EDE0CC] text-slate-400'
                          }`}
                        >
                          <div>
                            <span className="block">{isAr ? sec.labelAr : sec.labelEn}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{isAr ? sec.descAr : sec.descEn}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold shrink-0 ps-2">
                            {lvl === 'edit' ? (isAr ? 'تحرير كامل' : 'Edit') : lvl === 'view' ? (isAr ? 'عرض فقط' : 'View') : (isAr ? 'مغلق' : 'None')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-[#EDE0CC] flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewingUser(null)}
                className="px-5 py-2 bg-[#44200F] text-[#C4A177] rounded-xl text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE / EDIT CUSTOM ROLE TEMPLATE WITH 10-SECTION PERMISSION MATRIX */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-[#EDE0CC] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EDE0CC] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#44200F]">
                  {editingRole 
                    ? (isAr ? 'تعديل مصفوفة الصلاحيات للدور' : 'Configure Custom Role & Permissions') 
                    : (isAr ? 'إنشاء مسمى وظيفي وصلاحيات جديدة' : 'Create Custom Role & Permission Matrix')}
                </h3>
                <span className="text-xs text-[#795037]">
                  {isAr 
                    ? 'حدد اسم الدور واضبط صلاحيات كل قسم تشغيلي (مغلق / عرض فقط / تحرير كامل)' 
                    : 'Set custom job title and configure section-by-section access'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setRoleModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              {/* Role Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'اسم المسمى الوظيفي (بالعربية)' : 'Job Title in Arabic'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleTitleAr}
                    onChange={e => setRoleTitleAr(e.target.value)}
                    placeholder={isAr ? 'مثال: مسؤول حجوزات كروزات وفنادق' : 'e.g. مسؤول حجوزات'}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#44200F] mb-1">
                    {isAr ? 'اسم المسمى الوظيفي (بالإنجليزية)' : 'Job Title in English'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleTitleEn}
                    onChange={e => setRoleTitleEn(e.target.value)}
                    placeholder="e.g. Nile Cruise & Hotel Reservation Specialist"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#44200F] mb-1">
                  {isAr ? 'وصف المهام والمسؤوليات' : 'Role Description & Scope'}
                </label>
                <input
                  type="text"
                  value={roleDescAr}
                  onChange={e => setRoleDescAr(e.target.value)}
                  placeholder={isAr ? 'يتولى تسكين الكروزات وإصدار قسائم الفنادق وأوامر التأكيد للموردين...' : 'Responsible for cruise berths, vouchers...'}
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#EDE0CC] rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A177]"
                />
              </div>

              {/* 10-SECTION GRANULAR PERMISSION MATRIX */}
              <div className="pt-2 border-t border-[#EDE0CC] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-[#44200F]">
                    {isAr ? 'مصفوفة التحكم في صلاحيات الأقسام (10 أقسام تشغيلية):' : 'Granular Permissions Matrix (10 Operational Sections):'}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" /> {isAr ? 'مغلق' : 'None'}</span>
                    <span className="flex items-center gap-1 text-sky-800 font-bold"><Eye className="w-3 h-3 text-sky-600" /> {isAr ? 'عرض فقط' : 'View'}</span>
                    <span className="flex items-center gap-1 text-emerald-800 font-bold"><Edit3 className="w-3 h-3 text-emerald-600" /> {isAr ? 'تحرير كامل' : 'Edit'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {SECTIONS_CONFIG.map(sec => {
                    const currentLevel = rolePermissions[sec.key] || 'none';
                    return (
                      <div
                        key={sec.key}
                        className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-[#44200F] block text-xs">
                            {isAr ? sec.labelAr : sec.labelEn}
                          </span>
                          <span className="text-[11px] text-[#795037] block mt-0.5">
                            {isAr ? sec.descAr : sec.descEn}
                          </span>
                        </div>

                        {/* 3-Segment Tactile Selector */}
                        <div className="flex items-center bg-white p-1 rounded-xl border border-[#EDE0CC] shrink-0 self-end sm:self-center shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setRolePermissions(prev => ({ ...prev, [sec.key]: 'none' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              currentLevel === 'none'
                                ? 'bg-slate-200 text-slate-800 shadow-2xs'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Lock className="w-3 h-3" />
                            <span>{isAr ? 'مغلق' : 'None'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRolePermissions(prev => ({ ...prev, [sec.key]: 'view' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              currentLevel === 'view'
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : 'text-sky-800 hover:text-sky-950'
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isAr ? 'عرض فقط' : 'View'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRolePermissions(prev => ({ ...prev, [sec.key]: 'edit' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              currentLevel === 'edit'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-emerald-800 hover:text-emerald-950'
                            }`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isAr ? 'تحرير كامل' : 'Edit'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EDE0CC] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#EDE0CC] text-[#795037] hover:bg-[#FAF7F2] font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  {isAr ? 'حفظ المسمى والصلاحيات' : 'Save Role & Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
