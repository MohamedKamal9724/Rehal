import React, { useState, useEffect } from 'react';
import { 
  Compass, Inbox, FileText, Kanban, Database, Clock, 
  BarChart3, Users, Settings, Search, RotateCcw, 
  Menu, X, CreditCard, ChevronDown, Check, LogOut, 
  Sparkles, Plane, Moon, Truck, UserCheck, Hotel, 
  Receipt, Layers, ExternalLink, Globe2, CloudSun, Building, Key,
  User as UserIcon, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { TabTransitionWrapper } from './TabTransitionWrapper';
import { UILanguage, User, UserRole, Workspace, Inquiry, Quote, FollowUpTask } from '../types';
import { repository } from '../lib/storage';
import { UI_TRANSLATIONS, setDocumentDirection } from '../lib/i18n';
import { RihalLogo } from './common/RihalLogo';
import { MessageBotDuotoneIcon } from './common/FarisAvatarIcon';
import { UserSessionProfile } from '../lib/authRealms';
import { NotificationCenter } from './common/NotificationCenter';

interface LayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string, subTab?: string) => void;
  uiLang: UILanguage;
  setUiLang: (lang: UILanguage) => void;
  onOpenNewInquiry: () => void;
  onOpenNewQuote: () => void;
  onSignOut?: () => void;
  onOpenOnboarding?: () => void;
  workspace?: Workspace;
  currentUser?: User;
  banner?: React.ReactNode;
  sessionProfile?: UserSessionProfile | null;
  onSwitchToTravelerRealm?: () => void;
  inquiries?: Inquiry[];
  quotes?: Quote[];
  followUps?: FollowUpTask[];
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  setCurrentTab,
  uiLang,
  setUiLang,
  onOpenNewInquiry,
  onOpenNewQuote,
  onSignOut,
  workspace,
  currentUser: propCurrentUser,
  banner,
  sessionProfile,
  onSwitchToTravelerRealm,
  inquiries,
  quotes,
  followUps,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const activeWs = workspace || repository.getWorkspace();
  const storedUser = repository.getCurrentUser();
  const currentUser: User = propCurrentUser && propCurrentUser.email
    ? propCurrentUser
    : sessionProfile
      ? {
          ...storedUser,
          id: sessionProfile.userId || storedUser.id,
          workspaceId: activeWs.id,
          name: sessionProfile.name || storedUser.name,
          email: sessionProfile.email || storedUser.email,
          role: (sessionProfile.role as UserRole) || storedUser.role,
        }
      : storedUser;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const shouldReduceMotion = Boolean(useReducedMotion());
  const isAr = uiLang === 'ar';

  // Approved RIHAL Brand Palette Tokens
  const brandPrimary = activeWs?.brandColors?.primary || '#44200F';
  const brandAccent = activeWs?.brandColors?.accent || '#795037';
  const brandGold = activeWs?.brandColors?.gold || '#C4A177';

  const actualInquiries = inquiries || repository.getInquiries(activeWs.id);
  const pendingInquiriesCount = actualInquiries.filter(i => i.status === 'New' || i.status === 'In Progress').length;
  const actualFollowUps = followUps || repository.getFollowUps(activeWs.id);
  const pendingFollowupsCount = actualFollowUps.filter(f => !f.done && f.status !== 'Completed').length;
  const actualQuotes = quotes || repository.getQuotes(activeWs.id);

  const handleTabSelect = (tabId: string, subTab?: string) => {
    setCurrentTab(tabId, subTab);
    setMobileMenuOpen(false);
  };

  const t = (key: string) => UI_TRANSLATIONS[uiLang]?.[key] || key;

  useEffect(() => {
    setDocumentDirection(uiLang);
  }, [uiLang]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  interface NavItem {
    id: string;
    subTab?: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    count?: number;
    urgent?: boolean;
    badge?: string;
    badgeColor?: string;
  }

  interface NavGroup {
    id: 'home' | 'sales' | 'trips' | 'library' | 'company' | 'hajj_umrah';
    groupEn: string;
    groupAr: string;
    items: NavItem[];
  }

  const userRole = sessionProfile?.role || currentUser?.role || 'Admin';

  const rawNavGroups: NavGroup[] = [
    {
      id: 'home',
      groupEn: 'Home',
      groupAr: 'الرئيسية والعمليات',
      items: [
        { id: 'dashboard', label: isAr ? 'لوحة العمليات اليومية' : 'Home', icon: Compass },
      ],
    },
    {
      id: 'sales',
      groupEn: 'Sales',
      groupAr: 'المبيعات والعقود',
      items: [
        { 
          id: 'inbox', 
          label: isAr ? 'صندوق الوارد والطلبات' : 'Inquiries', 
          icon: Inbox, 
          count: pendingInquiriesCount > 0 ? pendingInquiriesCount : undefined 
        },
        { id: 'quotes', label: isAr ? 'صانع عروض الأسعار' : 'Quotes', icon: FileText },
        { id: 'pipeline', label: isAr ? 'مسار الصفقات' : 'Pipeline', icon: Kanban },
        { 
          id: 'followups', 
          label: isAr ? 'متابعات العملاء والمهام' : 'Follow-ups', 
          icon: Clock, 
          count: pendingFollowupsCount > 0 ? pendingFollowupsCount : undefined, 
          urgent: pendingFollowupsCount > 0 
        },
      ],
    },
    {
      id: 'trips',
      groupEn: 'Trips',
      groupAr: 'الرحلات والتشغيل',
      items: [
        { id: 'trips', subTab: 'overview', label: isAr ? 'إدارة وتشغيل الرحلات' : 'Trips', icon: Plane },
        { 
          id: 'passcodes', 
          label: isAr ? 'أكواد الدخول للرحلات' : 'Trip Access Codes', 
          icon: Key,
          badge: isAr ? 'أكواد' : 'Codes',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300' 
        },
        { id: 'trips_fleet', label: isAr ? 'حركة النقل والسيارات' : 'Fleet & Transportation', icon: Truck },
        { id: 'trips_guides', label: isAr ? 'المرشدون وممثلو المطارات' : 'Tour Guides & Reps', icon: UserCheck },
        { 
          id: 'trips_rooming', 
          label: isAr ? 'الفنادق الحية وكشوف التسكين' : 'Live Hotels & Rooming', 
          icon: Hotel,
          badge: isAr ? 'مباشر' : 'Live',
          badgeColor: 'bg-amber-50 text-[#44200F] border-[#C4A177]'
        },
        { id: 'trips_vouchers', label: isAr ? 'أوامر وقسائم التشغيل' : 'Vouchers & Dispatch', icon: Receipt },
      ],
    },
    {
      id: 'hajj_umrah' as const,
      groupEn: 'Hajj & Umrah Sector',
      groupAr: 'قطاع الحج والعمرة',
      items: [
        { 
          id: 'hajj_umrah', 
          label: isAr ? 'بوابة الحج والعمرة ونُسك' : 'Hajj & Umrah Hub', 
          icon: Moon, 
          badge: 'Nusuk',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        },
      ],
    },
    {
      id: 'library',
      groupEn: 'Library',
      groupAr: 'المكتبة والأسعار',
      items: [
        { id: 'library', label: isAr ? 'مكتبة الأسعار والموردين' : 'Rates & Suppliers', icon: Database },
        { id: 'analytics', label: isAr ? 'التقارير والأرباح' : 'Reports', icon: BarChart3 },
      ],
    },
    {
      id: 'company',
      groupEn: 'Company',
      groupAr: 'الشركة وفريق العمل',
      items: [
        { 
          id: 'admin_dashboard', 
          label: isAr ? 'لوحة تحكم وتحليلات الإدارة' : 'Admin & Staff Analytics', 
          icon: ShieldCheck,
          badge: isAr ? 'إدارة' : 'Admin',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
        },
        { 
          id: 'agency_showcase', 
          label: isAr ? 'بروفايل الشركة والستوري' : 'Company Profile & Studio', 
          icon: Building,
          badge: isAr ? 'استوديو' : 'Studio',
          badgeColor: 'bg-gradient-to-r from-amber-50 to-orange-50 text-[#EA580C] border-orange-300 font-bold'
        },
        { id: 'team', label: isAr ? 'فريق العمل والصلاحيات' : 'Team & Permissions', icon: Users },
        { 
          id: 'support', 
          label: isAr ? 'فارس · مساعد رِحال' : 'Faris · Operations Advisor', 
          icon: MessageBotDuotoneIcon,
          badge: isAr ? 'فارس' : 'Faris',
          badgeColor: 'bg-[#44200F] text-[#C4A177] border-[#C4A177]/40 font-bold'
        },
        { id: 'plan', label: isAr ? 'باقة الاشتراك' : 'Subscription Plan', icon: CreditCard },
        { id: 'live_apis', label: isAr ? 'المعلومات الحية والطقس' : 'Live Intelligence', icon: CloudSun },
      ],
    },
  ];

  // Role-Aware Navigation Filtering
  const isCompanyAdmin = userRole === 'Owner' || userRole === 'Admin';

  const navGroups = rawNavGroups
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        if (item.id === 'admin_dashboard') {
          return isCompanyAdmin;
        }
        return true;
      }),
    }))
    .filter(g => {
      if (userRole === 'Sales Agent') {
        return g.id === 'home' || g.id === 'sales' || g.id === 'trips' || g.id === 'hajj_umrah';
      }
      if (userRole === 'Operations') {
        return g.id === 'home' || g.id === 'trips' || g.id === 'library' || g.id === 'hajj_umrah';
      }
      if (userRole === 'Viewer' || (userRole as string) === 'Finance') {
        return g.id === 'home' || g.id === 'library';
      }
      return true; // Owner and Admin see all
    });

  // Helper to find current tab label
  const allItems = navGroups.flatMap(g => g.items);
  const currentItem = allItems.find(i => i.id === currentTab);
  const currentTabLabel = currentItem?.label || (isAr ? 'لوحة القيادة' : 'Dashboard');

  // Search Results for Command Palette
  const filteredNavItems = searchQuery.trim() 
    ? allItems.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.includes(searchQuery.toLowerCase()))
    : allItems;

  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row bg-[#faf7f2] text-slate-900 antialiased font-sans"
      style={{
        '--brand-primary': brandPrimary,
        '--brand-accent': brandAccent,
        '--brand-gold': brandGold,
      } as React.CSSProperties}
    >
      {/* Mobile Drawer Backdrop Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#44200F]/60 backdrop-blur-xs z-35 md:hidden cursor-pointer"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Modern Sidebar with Mediterranean Deep Navy & Ivory Canvas */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#eae5dc] flex flex-col transition-transform duration-200 ease-out shadow-xs
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Brand header */}
        <div className="h-16 px-4 flex items-center justify-between bg-white border-b border-[#eae5dc]">
          <div className="flex items-center gap-2">
            <RihalLogo 
              variant="compact" 
              isArabic={isAr} 
              size="md" 
              onClick={() => handleTabSelect('dashboard')}
            />
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="md:hidden text-slate-400 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace identifier card */}
        <div className="px-3 py-3 border-b border-[#f2eee6]">
          <div 
            className="px-3 py-2.5 rounded-xl bg-[#faf7f2] border border-[#eae5dc] flex items-center justify-between shadow-2xs"
            style={{
              borderInlineStartWidth: '3px',
              borderInlineStartColor: brandGold,
            }}
          >
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate">
                {activeWs.arabicName && isAr ? activeWs.arabicName : (activeWs.name || (isAr ? 'مساحة العمل' : 'Workspace'))}
              </div>
              <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-slate-600">{isAr ? 'مساحة العمل مفعلة' : 'Active Workspace'}</span>
              </div>
            </div>
            <button
              onClick={() => handleTabSelect('agency_showcase')}
              title={isAr ? 'بروفايل الشركة والستوري' : 'Company Profile & Studio'}
              className="p-1 transition hover:opacity-80 cursor-pointer"
              style={{ color: brandAccent }}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Search Trigger */}
        <div className="px-3 py-2.5 border-b border-[#EDE0CC] bg-[#FAF7F2]/60">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#EDE0CC]/20 border border-[#EDE0CC] text-xs text-[#795037] transition cursor-pointer shadow-2xs group"
            title={isAr ? 'البحث السريع (Ctrl + K)' : 'Quick Search (⌘K)'}
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform text-[#795037]" />
              <span className="truncate text-[11px] text-[#795037]">{t('topbar.search_placeholder')}</span>
            </div>
            <kbd className="text-[10px] bg-[#FAF7F2] border border-[#EDE0CC] rounded px-1.5 py-0.2 text-[#795037] font-mono shrink-0">⌘K</kbd>
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin">
          {navGroups.map(group => (
            <div key={group.groupEn} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {isAr ? group.groupAr : group.groupEn}
              </div>
              {group.items.map(item => {
                const Icon = item.icon;
                const normalizedCurrent =
                  currentTab === 'rates' ? 'library' :
                  currentTab === 'settings' ? 'agency_showcase' :
                  currentTab === 'sales' ? 'inbox' : currentTab;
                const isActive = normalizedCurrent === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id, item.subTab)}
                    style={isActive ? {
                      backgroundColor: `${brandPrimary}0E`,
                      borderColor: `${brandGold}60`,
                      color: brandPrimary,
                    } : undefined}
                    className={`
                      relative w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer
                      ${isActive 
                        ? 'font-bold border shadow-2xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#faf7f2] font-medium'}
                    `}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon 
                        style={isActive ? { color: brandGold } : undefined}
                        className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-105' : 'text-slate-400'}`} 
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ms-1">
                      {item.count && (
                        <span 
                          style={isActive ? { backgroundColor: brandPrimary, color: '#ffffff' } : undefined}
                          className={`
                            text-[10px] font-bold px-1.5 py-0.2 rounded-full
                            ${isActive 
                              ? '' 
                              : item.urgent ? 'bg-orange-500 text-white font-extrabold shadow-xs shadow-orange-500/30' : 'bg-slate-200 text-slate-700'}
                          `}
                        >
                          {item.count}
                        </span>
                      )}

                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Switch to Traveler Realm */}
        {onSwitchToTravelerRealm && (
          <div className="p-2 border-t border-[#EDE0CC] bg-[#FAF7F2]">
            <button
              type="button"
              onClick={onSwitchToTravelerRealm}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#44200F] bg-white hover:bg-[#FAF7F2] border border-[#EDE0CC] transition cursor-pointer shadow-2xs group"
              title={isAr ? 'الانتقال إلى بوابة المسافرين' : 'Switch to Traveller Portal'}
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#C4A177] group-hover:rotate-45 transition-transform" />
                <span>{isAr ? 'بوابة المسافرين' : 'Traveller Portal'}</span>
              </div>
              <span className="text-[10px] text-[#795037] bg-[#EDE0CC]/60 px-1.5 py-0.5 rounded font-mono">⇄</span>
            </button>
          </div>
        )}

        {/* Bottom User Profile */}
        <div className="p-3 border-t border-[#eae5dc] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-xs shrink-0"
              style={{
                backgroundColor: brandPrimary,
                color: brandGold,
              }}
            >
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name || 'Tour Operator'}</div>
              <div className="text-[10px] text-slate-500">{currentUser.role || 'Operator Admin'}</div>
            </div>
          </div>
          {onSignOut && (
            <button
              title={isAr ? 'تسجيل الخروج' : 'Sign Out'}
              onClick={onSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0 bg-[#faf7f2]">
        {/* Top Header Bar - Fixed Header that does not change direction with languages */}
        <header 
          dir="ltr" 
          className="fixed top-0 left-0 md:left-64 right-0 z-30 h-14 sm:h-16 bg-white/95 backdrop-blur-md text-[#2A1409] border-b border-[#EDE0CC] px-3 sm:px-6 flex items-center justify-between shadow-2xs"
        >
          {/* Fixed Left Zone: Navigation trigger & Prominent Logo on Mobile / Breadcrumb on Desktop */}
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            {/* Hamburger Menu Toggle (Mobile) - Standardized height h-9 w-9 */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-9 w-9 flex items-center justify-center text-[#795037] hover:text-[#44200F] hover:bg-orange-50/60 rounded-xl transition shrink-0 cursor-pointer"
              title={isAr ? 'فتح القائمة الرئيسية' : 'Open Main Menu'}
              aria-label={isAr ? 'فتح القائمة الرئيسية' : 'Open Main Menu'}
            >
              <Menu className="w-5 h-5 text-[#44200F]" />
            </button>

            {/* Mobile: Wordmark */}
            <div className="md:hidden flex items-center gap-2">
              <RihalLogo 
                variant="compact" 
                size="md" 
                isArabic={isAr} 
                onClick={() => handleTabSelect('dashboard')}
              />
            </div>

            {/* Desktop: Clean Minimal Breadcrumb (Fixed LTR order, standardized h-9 height) */}
            <div className="hidden md:flex items-center gap-2 h-9 text-xs" dir="ltr">
              <button
                type="button"
                onClick={() => handleTabSelect('dashboard')}
                className="font-bold tracking-tight text-sm text-[#44200F] hover:text-orange-700 hover:underline transition-colors cursor-pointer text-start"
                title={isAr ? 'العودة إلى لوحة العمليات الرئيسية' : 'Return to main dashboard'}
              >
                {activeWs.arabicName && isAr ? activeWs.arabicName : (activeWs.name || (isAr ? 'مساحة العمل' : 'Workspace'))}
              </button>
              <span className="text-[#C4A177]">/</span>
              <span 
                className="font-bold truncate text-xs px-2.5 py-1 rounded-lg border shadow-2xs bg-[#FAF7F2] border-[#EDE0CC] text-[#44200F]"
              >
                {currentTabLabel}
              </span>
            </div>
          </div>


          {/* End: Actions, Language Switcher (AR/EN), and User Account Menu - ALL EQUAL HEIGHT h-9 */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Primary Action Button (+ Quote) - Standardized height h-9 with warm vibrant orange hover */}
            <button
              onClick={onOpenNewQuote}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer whitespace-nowrap active:scale-95 bg-gradient-to-r from-[#44200F] via-[#56220e] to-[#44200F] hover:to-[#ea580c] text-[#FAF7F2] border border-orange-500/30 hover:border-orange-400"
              title={isAr ? 'إنشاء عرض أسعار جديد' : 'Create New Quote'}
            >
              <FileText className="w-3.5 h-3.5 text-orange-300" />
              <span>{isAr ? '+ عرض جديد' : '+ Quote'}</span>
            </button>

            {/* Language Switcher: AR / EN - Standardized height h-9 */}
            <div 
              className="flex items-center h-9 bg-[#FAF7F2] p-0.5 rounded-xl border border-[#EDE0CC] text-xs font-bold shadow-2xs"
              title={isAr ? 'تغيير لغة النظام' : 'Change Interface Language'}
            >
              <button
                type="button"
                onClick={() => setUiLang('ar')}
                className={`h-full px-2 sm:px-2.5 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isAr 
                    ? 'bg-gradient-to-b from-[#44200F] to-[#5a2711] text-[#FAF7F2] ring-1 ring-orange-400/50 shadow-2xs font-extrabold' 
                    : 'text-[#795037] hover:text-orange-950 hover:bg-orange-50/50'
                }`}
                title="العربية (AR)"
              >
                AR
              </button>
              <button
                type="button"
                onClick={() => setUiLang('en')}
                className={`h-full px-2 sm:px-2.5 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isAr 
                    ? 'bg-gradient-to-b from-[#44200F] to-[#5a2711] text-[#FAF7F2] ring-1 ring-orange-400/50 shadow-2xs font-extrabold' 
                    : 'text-[#795037] hover:text-orange-950 hover:bg-orange-50/50'
                }`}
                title="English (EN)"
              >
                EN
              </button>
            </div>

            {/* Operator Notification Center Bell Dropdown - Standardized height h-9 */}
            <NotificationCenter
              workspaceId={activeWs?.id}
              inquiries={actualInquiries}
              quotes={actualQuotes}
              followUps={actualFollowUps}
              uiLang={uiLang}
              onNavigateTab={handleTabSelect}
            />

            {/* User Account Trigger & Dropdown Menu - Standardized height h-9 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 h-9 px-1.5 sm:px-2.5 rounded-xl bg-white hover:bg-orange-50/40 border border-[#EDE0CC] hover:border-orange-300 text-[#44200F] transition shadow-2xs cursor-pointer active:scale-95"
                title={isAr ? 'حساب المستخدم' : 'User Account'}
                aria-expanded={userMenuOpen}
                aria-label={isAr ? 'قائمة حساب المستخدم' : 'User account menu'}
              >
                <div 
                  className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-xs font-black shadow-2xs shrink-0 bg-[#44200F] text-orange-400 ring-1 ring-orange-400/30"
                >
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden md:inline text-xs font-bold text-[#44200F] max-w-[110px] truncate">
                  {currentUser.name || (isAr ? 'المسؤول' : 'Account')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#795037] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Account Dropdown Menu */}
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="fixed right-3 top-15 sm:top-auto sm:absolute sm:right-0 sm:mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-[#EDE0CC] p-2.5 z-50 text-xs"
                    >
                      {/* User Info Header */}
                      <div className="px-3 py-2.5 border-b border-[#EDE0CC]/80 mb-1 bg-[#FAF7F2]/60 rounded-xl">
                        <div className="font-bold text-sm text-[#44200F] truncate">
                          {currentUser.name || 'Tour Operator Admin'}
                        </div>
                        <div className="text-[11px] text-[#795037] truncate mt-0.5">
                          {currentUser.email || activeWs.contactEmail || ''}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>{activeWs.arabicName && isAr ? activeWs.arabicName : (activeWs.name || (isAr ? 'مساحة العمل' : 'Workspace'))}</span>
                        </div>
                      </div>

                      {/* Quick Navigation Items */}
                      <div className="space-y-0.5 py-1">
                        {onSwitchToTravelerRealm && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              onSwitchToTravelerRealm();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[#44200F] hover:bg-amber-100/60 font-bold transition cursor-pointer text-start bg-amber-50/80 border border-amber-200/80 mb-1.5"
                          >
                            <div className="flex items-center gap-2.5">
                              <Compass className="w-4 h-4 text-[#795037]" />
                              <span>{isAr ? 'الانتقال إلى بوابة المسافرين' : 'Switch to Traveller Hub'}</span>
                            </div>
                            <span className="text-[10px] bg-[#44200F] text-[#FAF7F2] px-1.5 py-0.5 rounded font-mono">Portal</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleTabSelect('agency_showcase');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#44200F] hover:bg-[#FAF7F2] font-semibold transition cursor-pointer text-start"
                        >
                          <Building className="w-4 h-4 text-[#795037]" />
                          <span>{isAr ? 'بروفايل الشركة والستوري' : 'Company Profile & Studio'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleTabSelect('team');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#44200F] hover:bg-[#FAF7F2] font-semibold transition cursor-pointer text-start"
                        >
                          <Users className="w-4 h-4 text-[#795037]" />
                          <span>{isAr ? 'فريق العمل والصلاحيات' : 'Team & Permissions'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleTabSelect('all_modules');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#44200F] hover:bg-[#FAF7F2] font-semibold transition cursor-pointer text-start"
                        >
                          <Layers className="w-4 h-4 text-[#795037]" />
                          <span>{isAr ? 'خريطة الأقسام والمنظومة' : 'All Modules Directory'}</span>
                        </button>
                      </div>

                      {/* Sign Out */}
                      {onSignOut && (
                        <div className="border-t border-[#EDE0CC]/80 pt-1 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              onSignOut();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer text-start"
                          >
                            <LogOut className="w-4 h-4 text-rose-500" />
                            <span>{isAr ? 'تسجيل الخروج' : 'Sign Out'}</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Fixed Header Spacer to prevent content underlap */}
        <div className="h-14 sm:h-16 shrink-0" aria-hidden="true" />

        {banner}


        {/* Content Viewport */}
        <main className="flex-1 p-2.5 sm:p-5 md:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto min-h-[calc(100vh-4rem)] flex flex-col relative overflow-x-hidden">
          <TabTransitionWrapper activeKey={currentTab} minHeight="calc(100vh - 8rem)">
            {children}
          </TabTransitionWrapper>
        </main>

        {/* Mobile Bottom Navigation Bar - Polished Touch Targets for 5 Primary Areas */}
        <nav 
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#EDE0CC] shadow-lg px-2 py-1.5 flex items-center justify-around"
        >
          {([
            { id: 'dashboard', label: isAr ? 'الرئيسية' : 'Home', icon: Compass },
            { id: 'sales', label: isAr ? 'المبيعات' : 'Sales', icon: Inbox, count: pendingInquiriesCount > 0 ? pendingInquiriesCount : undefined },
            { id: 'trips', label: isAr ? 'الرحلات' : 'Trips', icon: Plane },
            { id: 'library', label: isAr ? 'المكتبة' : 'Library', icon: Database },
            { id: 'team', label: isAr ? 'الشركة' : 'Company', icon: Building },
          ] as { id: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; count?: number }[]).map(item => {
            const Icon = item.icon;
            const isActive = 
              item.id === 'dashboard' ? currentTab === 'dashboard' :
              item.id === 'sales' ? (currentTab === 'sales' || currentTab === 'quotes' || currentTab === 'inbox' || currentTab === 'pipeline' || currentTab === 'followups') :
              item.id === 'trips' ? (currentTab === 'trips' || currentTab.startsWith('trips_') || currentTab === 'passcodes') :
              item.id === 'library' ? (currentTab === 'library' || currentTab === 'rates' || currentTab === 'analytics') :
              (currentTab === 'team' || currentTab === 'company' || currentTab === 'settings' || currentTab === 'plan' || currentTab === 'agency_showcase');

            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`
                  relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[48px]
                  ${isActive ? 'font-bold text-[#44200F]' : 'text-[#795037] hover:text-[#44200F]'}
                `}
              >
                <div className="relative">
                  <Icon 
                    className="w-5 h-5 transition-transform" 
                    style={isActive ? { color: '#44200F', transform: 'scale(1.1)' } : { color: '#795037' }} 
                  />
                  {item.count && (
                    <span 
                      className="absolute -top-1.5 -right-2 text-[#FAF7F2] bg-[#44200F] text-[9px] font-bold px-1 py-0.2 rounded-full min-w-[14px] text-center shadow-xs"
                    >
                      {item.count}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight leading-none ${isActive ? 'font-black text-[#44200F]' : 'text-[#795037]'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#C4A177] mt-0.5"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Command Palette Modal (Ctrl+K) */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-start justify-center pt-24 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            >
              <div className="p-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder={isAr ? 'ابحث عن أي قسم، عرض سعر، مسافر، فندق، أو مورد...' : 'Search modules, quotes, travelers, hotels, or suppliers...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs outline-hidden text-slate-900 placeholder:text-slate-400 bg-transparent"
                />
                <button onClick={() => setCommandPaletteOpen(false)} className="text-[10px] text-slate-400 hover:text-slate-600 font-mono px-1.5 py-0.5 rounded bg-slate-100">
                  ESC
                </button>
              </div>

              <div className="p-2 max-h-72 overflow-y-auto space-y-1 text-xs text-slate-700">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                  {isAr ? 'أقسام المنظومة' : 'Operating Modules'}
                </div>
                {filteredNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabSelect(item.id, item.subTab);
                        setCommandPaletteOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl text-start transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-800">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
