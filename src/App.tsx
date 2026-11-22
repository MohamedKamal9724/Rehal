import React, { useState, useEffect } from 'react';
import { 
  Inquiry, Quote, Rate, Supplier, Season, Workspace, 
  User, FollowUpTask, AuditLog, UILanguage 
} from './types';
import { repository } from './lib/storage';
import { DEFAULT_WORKSPACE } from './lib/demoData';
import { applyCompanyOperatorScope, clearOperatorScope, isBlueNileOrDemoCompanyId } from './lib/sessionScope';
import { clearOnboardingDraft } from './lib/onboardingCalculator';
import { setDemoModeActive } from './lib/demoConfig';
import { registerAgencyInDirectory } from './lib/agenciesData';
import { initCloudSync, saveAgencyToCloud } from './services/dbSync';
import { logoutUser, getStoredSessionProfile, updateOperatorCompanyOnServer, verifyServerSession } from './services/authService';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { RateLibraryView } from './components/RateLibraryView';
import { QuoteBuilderView } from './components/QuoteBuilderView';
import { ProposalViewer } from './components/ProposalViewer';
import { PipelineView } from './components/PipelineView';
import { TripOperationsView } from './components/TripOperationsView';
import { FollowUpsView } from './components/FollowUpsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SubscriptionPlanView } from './components/SubscriptionPlanView';
import { TeamSettingsView } from './components/TeamSettingsView';
import { HajjUmrahView } from './components/hajj/HajjUmrahView';
import { AllModulesView } from './components/AllModulesView';
import { LiveIntelligenceView } from './components/LiveIntelligenceView';
import { OnboardingWizardModal } from './components/onboarding/OnboardingWizardModal';
import { TabTransitionWrapper } from './components/TabTransitionWrapper';
import { AuthScreen } from './components/auth/AuthScreen';
import { WorkspaceOnboardingGate } from './components/onboarding/WorkspaceOnboardingGate';
import { CompanyReadinessBanner } from './components/common/CompanyReadinessBanner';
import { AgencyShowcaseView } from './components/agency/AgencyShowcaseView';
import { BrowseCompaniesView } from './components/agency/BrowseCompaniesView';
import { TravelerMobilePortal } from './components/traveler/TravelerMobilePortal';
import { TourPasscodesManagerView } from './components/operations/TourPasscodesManagerView';
import { FleetTransportationView } from './components/operations/FleetTransportationView';
import { TourGuidesRepsView } from './components/operations/TourGuidesRepsView';
import { HotelRoomingListsView } from './components/operations/HotelRoomingListsView';
import { VouchersDispatchView } from './components/operations/VouchersDispatchView';
import { findTripOrGuestByCode, TripFile, TripPassenger, createTripFromQuote, saveTrips, loadTrips } from './lib/tripStore';
import { SalesWorkspaceView } from './components/SalesWorkspaceView';
import { LibraryWorkspaceView } from './components/LibraryWorkspaceView';
import { PublicTripRequestForm } from './components/portal/PublicTripRequestForm';
import { ClientPortalView } from './components/portal/ClientPortalView';
import { TravelerHubView } from './components/traveler/TravelerHubView';
import { AISupportDrawer } from './components/support/AISupportDrawer';
import { FloatingActionCluster } from './components/common/FloatingActionCluster';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { Compass } from 'lucide-react';
import { 
  UserSessionProfile, 
  canAccessOperatorRealm, 
  createIsolatedTravelerUser,
  resolveTargetRealm
} from './lib/authRealms';

export default function App() {
  // Bilingual state: defaults to Arabic with complete English support
  const [uiLang, setUiLang] = useState<UILanguage>(() => {
    try {
      const saved = localStorage.getItem('daleel_ui_lang');
      if (saved === 'ar' || saved === 'en') return saved;
      return 'ar';
    } catch {
      return 'ar';
    }
  });

  const handleSetUiLang = (lang: UILanguage) => {
    setUiLang(lang);
    try {
      localStorage.setItem('daleel_ui_lang', lang);
    } catch {
      // safe fallback
    }
  };

  // Storage state (restore active company scope first so newly registered agencies stay strictly isolated)
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    const storedAuth = getStoredSessionProfile();
    if (storedAuth?.hasCompanyMembership && storedAuth.companyId && storedAuth.user?.role !== 'Traveler') {
      applyCompanyOperatorScope(storedAuth.companyId, storedAuth.user?.uid);
      setDemoModeActive(false);
      const ws = repository.getWorkspace();
      if (isBlueNileOrDemoCompanyId(ws.id) || isBlueNileOrDemoCompanyId(storedAuth.companyId)) {
        repository.ensureConsistentWorkspaceSeed(ws.id);
      }
      return ws;
    }
    clearOperatorScope();
    setDemoModeActive(false);
    return DEFAULT_WORKSPACE;
  });
  const [currentUser, setCurrentUser] = useState<User>(() => repository.getCurrentUser());
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => workspace.id === 'unconfigured' ? [] : repository.getInquiries(workspace.id));
  const [quotes, setQuotes] = useState<Quote[]>(() => workspace.id === 'unconfigured' ? [] : repository.getQuotes(workspace.id));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => workspace.id === 'unconfigured' ? [] : repository.getSuppliers(workspace.id));
  const [rates, setRates] = useState<Rate[]>(() => workspace.id === 'unconfigured' ? [] : repository.getRates(workspace.id));
  const [seasons, setSeasons] = useState<Season[]>(() => workspace.id === 'unconfigured' ? [] : repository.getSeasons(workspace.id));
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(() => workspace.id === 'unconfigured' ? [] : repository.getFollowUps(workspace.id));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => workspace.id === 'unconfigured' ? [] : repository.getAuditLogs(workspace.id));

  // Determine current tab from URL if specified
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t === 'quotes' || t === 'builder') return 'quotes';
      if (t === 'trips' || t === 'operations') return 'trips';
      if (t === 'pipeline') return 'pipeline';
      if (t === 'rates') return 'rates';
      if (t === 'inbox') return 'inbox';
      if (t === 'hajj_umrah' || t === 'umrah' || t === 'hajj') return 'hajj_umrah';
      if (t === 'live_apis' || t === 'live_intel' || t === 'weather') return 'live_apis';
      if (t === 'all_modules' || t === 'modules') return 'all_modules';
      if (t === 'agency_showcase' || t === 'agency' || t === 'showcase') return 'agency_showcase';
      if (t === 'browse_companies' || t === 'browse' || t === 'directory') return 'browse_companies';
      if (t === 'passcodes' || t === 'codes') return 'passcodes';
      if (t === 'trips_fleet' || t === 'fleet') return 'trips_fleet';
      if (t === 'trips_guides' || t === 'guides') return 'trips_guides';
      if (t === 'trips_rooming' || t === 'rooming') return 'trips_rooming';
      if (t === 'trips_vouchers' || t === 'vouchers') return 'trips_vouchers';
      if (t === 'public_inquire' || t === 'inquire' || t === 'plan') return 'public_inquire';
      if (t === 'client_portal' || t === 'portal') return 'client_portal';
      if (t === 'support' || t === 'ai_support' || t === 'help') return 'support';
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [activePortalToken, setActivePortalToken] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('portal') || params.get('ref') || null;
    } catch {
      return null;
    }
  });

  const [quotaExceeded, setQuotaExceeded] = useState(false);
  useEffect(() => {
    const handleQuotaError = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaError);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaError);
  }, []);

  const [isVisitorInquire, setIsVisitorInquire] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('inquire') || params.get('tab') === 'public_inquire';
    } catch {
      return false;
    }
  });

  const [isAgencyViewActive, setIsAgencyViewActive] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      return view === 'agency' || view === 'showcase';
    } catch {
      return false;
    }
  });

  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('agencyId') || params.get('agency') || null;
    } catch {
      return null;
    }
  });

  const [activeGuestTrip, setActiveGuestTrip] = useState<{ trip: TripFile; passenger?: TripPassenger } | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code') || params.get('passcode');
      if (code) {
        return findTripOrGuestByCode(code);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isBrowseCompaniesActive, setIsBrowseCompaniesActive] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      return view === 'browse' || view === 'companies' || view === 'directory';
    } catch {
      return false;
    }
  });

  // Authenticated Session Profile (hydrated from stored session, then re-verified by server)
  const [sessionProfile, setSessionProfile] = useState<UserSessionProfile | null>(() => {
    const storedAuth = getStoredSessionProfile();
    if (!storedAuth || !storedAuth.success || !storedAuth.user) return null;
    return {
      userId: storedAuth.user.uid || storedAuth.user.email,
      email: storedAuth.user.email,
      name: storedAuth.user.displayName || 'User',
      role: storedAuth.user.role || 'Owner',
      companyId: storedAuth.companyId,
      companyName: storedAuth.companyName,
      companyArabicName: storedAuth.companyArabicName,
      hasCompanyMembership: Boolean(storedAuth.hasCompanyMembership),
      memberships: (storedAuth.memberships || []).map(m => ({
        companyId: m.companyId,
        companyName: m.companyName || storedAuth.companyName || m.companyId,
        companyArabicName: m.companyArabicName || storedAuth.companyArabicName,
        role: m.role,
        status: m.status,
      })),
      isDemo: Boolean(storedAuth.isDemo),
    };
  });

  // Application Mode: 'operator' (B2B DMC Desk) vs 'traveler' (View-only Traveler & Company Discovery Hub)
  const [appMode, setAppMode] = useState<'operator' | 'traveler'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'traveler' || mode === 'operator') return mode;
    } catch {}
    const storedAuth = getStoredSessionProfile();
    if (storedAuth?.hasCompanyMembership && storedAuth.companyId && storedAuth.user?.role !== 'Traveler') {
      return 'operator';
    }
    return 'traveler';
  });
  const [isOperatorSupportDrawerOpen, setIsOperatorSupportDrawerOpen] = useState<boolean>(false);

  const [operationSubTab, setOperationSubTab] = useState<'overview' | 'vouchers' | 'services' | 'passengers' | 'checklist' | 'log'>('overview');
  const [salesSubTab, setSalesSubTab] = useState<'inbox' | 'quotes' | 'pipeline' | 'followups'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t === 'quotes' || t === 'builder') return 'quotes';
      if (t === 'pipeline') return 'pipeline';
      if (t === 'followups') return 'followups';
      return 'inbox';
    } catch {
      return 'inbox';
    }
  });
  const [librarySubTab, setLibrarySubTab] = useState<'rates' | 'suppliers' | 'seasons' | 'fx'>('rates');

  const handleConfirmQuoteToTrip = (quote: Quote) => {
    try {
      const existingTrips = loadTrips();
      const newTrip = createTripFromQuote(quote, existingTrips.length + 1);
      const nextTrips = [newTrip, ...existingTrips.filter(t => t.id !== newTrip.id)];
      saveTrips(nextTrips);
      handleUpdateQuoteStatus(quote.id, 'Accepted');
      setCurrentTab('trips');
    } catch {
      setCurrentTab('trips');
    }
  };

  const handleNavigateTab = (tab: string, subTab?: string) => {
    setIsAgencyViewActive(false);
    setIsBrowseCompaniesActive(false);
    setIsVisitorInquire(false);
    setActiveGuestTrip(null);

    // Sales Workspace & Subtabs
    if (tab === 'sales') {
      if (subTab) setSalesSubTab(subTab as any);
      setCurrentTab(subTab || 'sales');
      return;
    }
    if (tab === 'inbox' || tab === 'quotes' || tab === 'pipeline' || tab === 'followups') {
      setSalesSubTab(tab as any);
      setCurrentTab(tab);
      return;
    }

    // Library & Tariffs
    if (tab === 'library') {
      if (subTab) setLibrarySubTab(subTab as any);
      setCurrentTab(subTab || 'library');
      return;
    }
    if (tab === 'rates' || tab === 'suppliers' || tab === 'seasons') {
      setLibrarySubTab(tab as any);
      setCurrentTab(tab);
      return;
    }

    // Trips & Logistics
    if (tab === 'trips') {
      if (subTab) setOperationSubTab(subTab as any);
      setCurrentTab('trips');
      return;
    }
    if (tab === 'passcodes' || tab === 'codes') {
      setCurrentTab('passcodes');
      return;
    }
    if (tab === 'trips_fleet') {
      setCurrentTab('trips_fleet');
      return;
    }
    if (tab === 'trips_guides') {
      setCurrentTab('trips_guides');
      return;
    }
    if (tab === 'trips_rooming') {
      setCurrentTab('trips_rooming');
      return;
    }
    if (tab === 'trips_vouchers') {
      setCurrentTab('trips_vouchers');
      return;
    }

    // Hajj & Umrah
    if (tab === 'hajj_umrah' || tab === 'umrah' || tab === 'hajj') {
      setCurrentTab('hajj_umrah');
      return;
    }

    if (tab === 'live_apis' || tab === 'live_intel') {
      setCurrentTab('live_apis');
      return;
    }

    if (tab === 'public_inquire') {
      setCurrentTab('public_inquire');
      return;
    }
    if (tab === 'client_portal') {
      setCurrentTab('client_portal');
      return;
    }
    if (subTab) {
      setOperationSubTab(subTab as any);
    }
    setCurrentTab(tab);
  };
  
  // Journey state: 'auth' | 'onboarding' | 'app'
  const [journeyState, setJourneyState] = useState<'auth' | 'onboarding' | 'app'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const j = params.get('journey');
      if (j === 'auth' || j === 'onboarding' || j === 'app') return j;
      if (params.has('portal') || params.has('code') || params.has('passcode') || params.has('quoteId') || params.has('inquire') || params.has('tab')) {
        return 'app';
      }
      const saved = localStorage.getItem('daleel_journey_state');
      if (saved === 'app' || saved === 'auth') return saved;
      return 'auth';
    } catch {
      return 'auth';
    }
  });

  const [pendingOnboardingUser, setPendingOnboardingUser] = useState<{
    uid?: string;
    name: string;
    email: string;
    companyName: string;
    companyArabicName?: string;
    companyId?: string;
    hasCompanyMembership?: boolean;
    memberships?: Array<{ companyId: string; companyName?: string; companyArabicName?: string; role: string; status?: string }>;
    photoUrl?: string;
    role?: any;
  } | null>(null);

  // Proposal preview mode (when traveler or operator views proposal or concierge)
  const [activeProposalQuote, setActiveProposalQuote] = useState<Quote | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const qId = params.get('quoteId') || params.get('proposal');
      if (view === 'client' || view === 'concierge' || view === 'proposal' || qId) {
        if (qId) {
          const found = repository.getQuoteById(qId);
          if (found) return found;
        }
        const ws = repository.getWorkspace();
        const allQuotes = repository.getQuotes(ws.id);
        if (allQuotes.length > 0) return allQuotes[0];
        return null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isClientModeActive, setIsClientModeActive] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const qId = params.get('quoteId') || params.get('proposal');
      return view === 'client' || view === 'concierge' || !!qId;
    } catch {
      return false;
    }
  });

  // In-app modal onboarding wizard state
  const [onboardingWizardOpen, setOnboardingWizardOpen] = useState<boolean>(false);
  const [isGuidedOnboardingActive, setIsGuidedOnboardingActive] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'setup' | 'agency' | 'team' | 'audit'>('agency');

  // Selected inquiry to quote flow
  const [activeInquiryForQuote, setActiveInquiryForQuote] = useState<Inquiry | undefined>(undefined);

  // Deep-link parameter detection
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const tab = params.get('tab');
      const qId = params.get('quoteId') || params.get('proposal');
      const journey = params.get('journey');

      if (journey === 'auth' || journey === 'onboarding' || journey === 'app') {
        setJourneyState(journey);
      }

      const mode = params.get('mode');
      if (mode === 'operator' || mode === 'traveler') {
        setAppMode(mode);
      }

      const code = params.get('code') || params.get('passcode');
      if (code) {
        const found = findTripOrGuestByCode(code);
        if (found) setActiveGuestTrip(found);
      }

      if (view === 'browse' || view === 'companies' || view === 'directory') {
        setIsBrowseCompaniesActive(true);
      } else if (view === 'agency' || view === 'showcase') {
        setIsAgencyViewActive(true);
      } else if (view === 'client' || view === 'concierge' || view === 'proposal' || qId) {
        let found = qId ? repository.getQuoteById(qId) : undefined;
        if (!found) {
          const allQuotes = repository.getQuotes(workspace.id);
          found = allQuotes.length > 0 ? allQuotes[0] : undefined;
        }
        if (found) {
          setActiveProposalQuote(found);
          setIsClientModeActive(view === 'client' || view === 'concierge' || !!qId);
        }
      } else if (tab) {
        if (tab === 'quotes' || tab === 'builder') setCurrentTab('quotes');
        else if (tab === 'trips' || tab === 'operations') setCurrentTab('trips');
        else if (tab === 'pipeline') setCurrentTab('pipeline');
        else if (tab === 'rates') setCurrentTab('rates');
        else if (tab === 'inbox') setCurrentTab('inbox');
        else if (tab === 'hajj_umrah' || tab === 'umrah' || tab === 'hajj') setCurrentTab('hajj_umrah');
        else if (tab === 'agency_showcase' || tab === 'agency' || tab === 'showcase') setCurrentTab('agency_showcase');
        else if (tab === 'browse_companies' || tab === 'browse' || tab === 'directory') setCurrentTab('browse_companies');
        else if (tab === 'passcodes' || tab === 'codes') setCurrentTab('passcodes');
        else if (tab === 'setup' || tab === 'readiness') {
          setSettingsInitialTab('setup');
          setCurrentTab('settings');
        }
        else if (tab === 'dashboard') setCurrentTab('dashboard');
      }
    } catch {
      // safe fallback
    }
  }, [workspace.id]);

  // Sync state helper
  const reloadData = () => {
    const ws = repository.getWorkspace();
    if (isBlueNileOrDemoCompanyId(ws.id)) {
      repository.ensureConsistentWorkspaceSeed(ws.id);
    }
    setWorkspace(ws);
    setCurrentUser(repository.getCurrentUser());
    if (ws.id === 'unconfigured') {
      setInquiries([]);
      setQuotes([]);
      setSuppliers([]);
      setRates([]);
      setSeasons([]);
      setFollowUps([]);
      setAuditLogs([]);
      return;
    }
    setInquiries(repository.getInquiries(ws.id));
    setQuotes(repository.getQuotes(ws.id));
    setSuppliers(repository.getSuppliers(ws.id));
    setRates(repository.getRates(ws.id));
    setSeasons(repository.getSeasons(ws.id));
    setFollowUps(repository.getFollowUps(ws.id));
    setAuditLogs(repository.getAuditLogs(ws.id));
  };

  // Initialize Cloud Database Synchronization and verify server session on startup
  useEffect(() => {
    initCloudSync().then(() => {
      reloadData();
    }).catch(() => {});

    verifyServerSession().then(authRes => {
      if (authRes && authRes.success && authRes.user) {
        const isBlueNile = isBlueNileOrDemoCompanyId(authRes.companyId);
        const profile: UserSessionProfile = {
          userId: authRes.user.uid || authRes.user.email,
          email: authRes.user.email,
          name: authRes.user.displayName || 'User',
          role: authRes.user.role || 'Owner',
          companyId: authRes.companyId,
          companyName: authRes.companyName,
          companyArabicName: authRes.companyArabicName,
          hasCompanyMembership: Boolean(authRes.hasCompanyMembership),
          memberships: (authRes.memberships || []).map(m => ({
            companyId: m.companyId,
            companyName: m.companyName || authRes.companyName || m.companyId,
            companyArabicName: m.companyArabicName || authRes.companyArabicName,
            role: m.role,
            status: m.status,
          })),
          isDemo: false,
        };
        setDemoModeActive(false);
        setSessionProfile(profile);
        if (profile.hasCompanyMembership && profile.companyId && profile.role !== 'Traveler') {
          applyCompanyOperatorScope(profile.companyId, profile.userId);
          if (!isBlueNile && repository.getWorkspace().id === 'unconfigured') {
            const ownerUser: User = {
              id: profile.userId,
              workspaceId: profile.companyId,
              name: profile.name,
              email: profile.email,
              role: (profile.role as any) || 'Owner',
              language: uiLang,
              status: 'active',
            };
            const restoredWs: Workspace = {
              ...DEFAULT_WORKSPACE,
              id: profile.companyId,
              name: profile.companyName || '',
              arabicName: profile.companyArabicName || '',
              slug: (profile.companyName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              defaultLanguage: 'ar',
              defaultCurrency: 'EGP',
              contactEmail: profile.email,
              isDemo: false,
              isDataReadinessComplete: false,
              createdAt: new Date().toISOString(),
            };
            repository.initializeCompanyWorkspace(restoredWs, ownerUser);
          } else if (isBlueNile) {
            const currentBlueNileWs = repository.getWorkspace();
            if (currentBlueNileWs.id === 'unconfigured' || !currentBlueNileWs.name) {
              repository.updateWorkspace({
                id: 'ws-default',
                name: profile.companyName || 'Blue Nile Expeditions SAE',
                arabicName: profile.companyArabicName || 'النيل الأزرق للسياحة والرحلات ش.م.م',
                slug: 'blue-nile-expeditions',
                defaultLanguage: 'ar',
                defaultCurrency: 'EGP',
                contactEmail: profile.email,
                isDemo: false,
                isDataReadinessComplete: true,
                createdAt: currentBlueNileWs.createdAt || new Date().toISOString(),
              });
            }
          }
          reloadData();
          try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('mode') !== 'traveler') {
              setAppMode('operator');
            }
          } catch {
            setAppMode('operator');
          }
        } else {
          clearOperatorScope();
          setAppMode('traveler');
        }
      }
    }).catch(() => {});
  }, []);

  // Auth flow handlers - NO window.location.assign reloads!
  const handleSignIn = (
    email: string,
    userDetails?: {
      uid?: string;
      name?: string;
      role?: any;
      photoUrl?: string;
      companyId?: string;
      companyName?: string;
      companyArabicName?: string;
      hasCompanyMembership?: boolean;
      memberships?: Array<{ companyId: string; companyName?: string; companyArabicName?: string; role: string; status?: string }>;
      isDemo?: boolean;
    }
  ) => {
    const isTraveler = userDetails?.role === 'Traveler';
    const hasMembership = Boolean(userDetails?.hasCompanyMembership && userDetails?.companyId && !isTraveler);
    const isBlueNile = isBlueNileOrDemoCompanyId(userDetails?.companyId);
    setDemoModeActive(false);

    const activeUid = userDetails?.uid || `user_${Date.now()}`;
    if (hasMembership && userDetails?.companyId) {
      applyCompanyOperatorScope(userDetails.companyId, activeUid);
      const existingWs = repository.getWorkspace();
      if (isBlueNile) {
        if (existingWs.id === 'unconfigured' || !existingWs.name) {
          repository.updateWorkspace({
            id: 'ws-default',
            name: userDetails.companyName || 'Blue Nile Expeditions SAE',
            arabicName: userDetails.companyArabicName || 'النيل الأزرق للسياحة والرحلات ش.م.م',
            slug: 'blue-nile-expeditions',
            defaultLanguage: 'ar',
            defaultCurrency: 'EGP',
            contactEmail: email,
            isDemo: false,
            isDataReadinessComplete: true,
            createdAt: existingWs.createdAt || new Date().toISOString(),
          });
        }
      } else if (existingWs.id === 'unconfigured' || existingWs.id !== userDetails.companyId) {
        const restoredWs: Workspace = {
          ...DEFAULT_WORKSPACE,
          id: userDetails.companyId,
          name: userDetails.companyName || existingWs.name || '',
          arabicName: userDetails.companyArabicName || '',
          slug: (userDetails.companyName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          defaultLanguage: 'ar',
          defaultCurrency: 'EGP',
          contactEmail: email,
          isDemo: false,
          isDataReadinessComplete: Boolean(userDetails.companyName),
          createdAt: new Date().toISOString(),
        };
        const ownerUser: User = {
          id: activeUid,
          workspaceId: userDetails.companyId,
          name: userDetails.name || email.split('@')[0],
          email,
          role: userDetails.role || 'Owner',
          language: uiLang,
          status: 'active',
          avatarUrl: userDetails.photoUrl,
        };
        repository.initializeCompanyWorkspace(restoredWs, ownerUser);
      }
    }

    const activeWsId = hasMembership && userDetails?.companyId ? userDetails.companyId : repository.getWorkspace().id;
    const profile: UserSessionProfile = {
      userId: activeUid,
      email,
      name: userDetails?.name || 'User',
      role: isTraveler ? 'Traveler' : (userDetails?.role || 'Owner'),
      companyId: userDetails?.companyId,
      companyName: userDetails?.companyName,
      companyArabicName: userDetails?.companyArabicName,
      hasCompanyMembership: hasMembership,
      memberships: (userDetails?.memberships && userDetails.memberships.length > 0)
        ? userDetails.memberships.map(m => ({
            companyId: m.companyId,
            companyName: m.companyName || userDetails?.companyName || m.companyId,
            companyArabicName: m.companyArabicName || userDetails?.companyArabicName,
            role: m.role,
            status: m.status,
          }))
        : (userDetails?.companyId
            ? [{
                companyId: userDetails.companyId,
                companyName: userDetails.companyName || userDetails.companyId,
                companyArabicName: userDetails.companyArabicName,
                role: userDetails.role || 'Owner',
                status: 'active',
              }]
            : []),
      isDemo: false,
    };
    setSessionProfile(profile);

    if (userDetails?.name || email) {
      const users = repository.getUsers(activeWsId);
      let matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!matched) {
        matched = {
          id: activeUid,
          workspaceId: isTraveler ? 'traveler-realm' : activeWsId,
          name: userDetails?.name || email.split('@')[0],
          email,
          role: userDetails?.role || 'Owner',
          language: uiLang,
          status: 'active',
          avatarUrl: userDetails?.photoUrl,
        };
        repository.saveUser(matched);
      }
      repository.setCurrentUser(matched.id);
    }

    reloadData();
    if (isTraveler || !profile.hasCompanyMembership) {
      setAppMode('traveler');
    } else {
      setAppMode('operator');
      setCurrentTab('dashboard');
    }
    setJourneyState('app');
    try {
      localStorage.setItem('daleel_journey_state', 'app');
    } catch {}
  };

  const handleSignInTraveler = (email: string, name?: string) => {
    setDemoModeActive(false);
    const travelerUser = createIsolatedTravelerUser(email, name, uiLang);
    repository.saveUser(travelerUser);
    repository.setCurrentUser(travelerUser.id);
    const travelerProfile: UserSessionProfile = {
      userId: travelerUser.id,
      email: travelerUser.email,
      name: travelerUser.name,
      role: 'Traveler',
      hasCompanyMembership: false,
      memberships: [],
    };
    setSessionProfile(travelerProfile);
    reloadData();
    setAppMode('traveler');
    setJourneyState('app');
    try {
      localStorage.setItem('daleel_journey_state', 'app');
    } catch {}
  };

  const handleEnterAsTraveler = () => {
    setDemoModeActive(false);
    clearOperatorScope();
    const travelerProfile: UserSessionProfile = {
      userId: `traveler_anon_${Date.now()}`,
      email: 'traveler@guest.local',
      name: uiLang === 'ar' ? 'مسافر زائر' : 'Guest Traveler',
      role: 'Traveler',
      hasCompanyMembership: false,
      memberships: [],
    };
    setSessionProfile(travelerProfile);
    setAppMode('traveler');
    setJourneyState('app');
    try {
      localStorage.setItem('daleel_journey_state', 'app');
    } catch {}
  };

  const handleCreateAccount = (userData: {
    uid?: string;
    name: string;
    email: string;
    companyName: string;
    companyArabicName?: string;
    companyId?: string;
    hasCompanyMembership?: boolean;
    memberships?: Array<{ companyId: string; companyName?: string; companyArabicName?: string; role: string; status?: string }>;
    photoUrl?: string;
    role?: any;
  }) => {
    const companyId = userData.companyId || `comp_${Date.now()}`;
    const uid = userData.uid || `user-owner-${Date.now()}`;

    setDemoModeActive(false);
    applyCompanyOperatorScope(companyId, uid);
    clearOnboardingDraft();

    const slug = (userData.companyName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const freshWs: Workspace = {
      ...DEFAULT_WORKSPACE,
      id: companyId,
      name: userData.companyName,
      arabicName: userData.companyArabicName || '',
      slug,
      defaultLanguage: 'ar',
      defaultCurrency: 'EGP',
      contactEmail: userData.email,
      subscriptionPlan: 'Solo',
      isDemo: false,
      isDataReadinessComplete: false,
      createdAt: new Date().toISOString(),
    };

    const ownerUser: User = {
      id: uid,
      workspaceId: companyId,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'Owner',
      language: uiLang,
      status: 'active',
      avatarUrl: userData.photoUrl,
    };

    repository.initializeCompanyWorkspace(freshWs, ownerUser);

    const newProfile: UserSessionProfile = {
      userId: uid,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'Owner',
      companyId,
      companyName: userData.companyName,
      companyArabicName: userData.companyArabicName || '',
      hasCompanyMembership: userData.hasCompanyMembership ?? true,
      memberships: (userData.memberships && userData.memberships.length > 0)
        ? userData.memberships.map(m => ({
            ...m,
            companyName: m.companyName || userData.companyName,
          }))
        : [{
            companyId,
            companyName: userData.companyName,
            companyArabicName: userData.companyArabicName || '',
            role: 'Owner',
            status: 'active',
          }],
      isDemo: false,
    };

    setSessionProfile(newProfile);
    setPendingOnboardingUser({ ...userData, uid, companyId, role: 'Owner' });
    reloadData();
    setJourneyState('onboarding');
    try {
      localStorage.setItem('daleel_journey_state', 'onboarding');
    } catch {}
  };

  const handleSignOut = () => {
    logoutUser().catch(() => {});
    clearOperatorScope();
    setDemoModeActive(false);
    setPendingOnboardingUser(null);
    setSessionProfile(null);
    setWorkspace(DEFAULT_WORKSPACE);
    setInquiries([]);
    setQuotes([]);
    setFollowUps([]);
    setJourneyState('auth');
    try {
      localStorage.setItem('daleel_journey_state', 'auth');
    } catch {}
  };

  // Mandatory Onboarding Gate Completion
  const handleGateComplete = (data: {
    workspaceData: Partial<Workspace>;
    activateStarterTariffs: boolean;
    customRates?: Rate[];
    destinationAction?: 'inquiry' | 'quote' | 'dashboard';
    publicProfileSkipped?: boolean;
  }) => {
    const existingWs = repository.getWorkspace();
    const effectiveCompanyId =
      existingWs.id !== 'unconfigured'
        ? existingWs.id
        : (pendingOnboardingUser?.companyId || sessionProfile?.companyId || `comp_${Date.now()}`);

    const saved = repository.updateWorkspace({
      ...data.workspaceData,
      id: effectiveCompanyId,
      defaultLanguage: existingWs.defaultLanguage || 'ar',
      defaultCurrency: existingWs.defaultCurrency || 'EGP',
      isDataReadinessComplete: true,
    });
    setWorkspace(saved);

    if (data.activateStarterTariffs) {
      repository.seedStarterRates(saved.id);
    } else if (data.customRates && data.customRates.length > 0) {
      data.customRates.forEach(r => repository.saveRate({ ...r, workspaceId: saved.id }));
    }

    const activeOwnerId = pendingOnboardingUser?.uid || sessionProfile?.userId || `user-owner-${Date.now()}`;
    const ownerName = pendingOnboardingUser?.name || sessionProfile?.name || repository.getCurrentUser()?.name || 'Agency Owner';
    const ownerEmail = pendingOnboardingUser?.email || sessionProfile?.email || saved.contactEmail || '';
    const ownerUser: User = {
      id: activeOwnerId,
      workspaceId: saved.id,
      name: ownerName,
      email: ownerEmail,
      role: (pendingOnboardingUser?.role || sessionProfile?.role || 'Owner') as any,
      language: uiLang,
      status: 'active',
      avatarUrl: pendingOnboardingUser?.photoUrl,
    };
    repository.saveUser(ownerUser);
    repository.setCurrentUser(ownerUser.id);

    const isDemoCompany = isBlueNileOrDemoCompanyId(saved.id);
    setSessionProfile(prev => ({
      userId: ownerUser.id,
      email: ownerEmail || prev?.email || '',
      name: ownerName,
      role: (prev?.role && prev.role !== 'Traveler') ? prev.role : 'Owner',
      companyId: saved.id,
      companyName: saved.name || prev?.companyName,
      companyArabicName: saved.arabicName || prev?.companyArabicName,
      hasCompanyMembership: true,
      memberships: (prev?.memberships && prev.memberships.length > 0)
        ? prev.memberships.map(m =>
            m.companyId === saved.id
              ? { ...m, companyName: saved.name || m.companyName, companyArabicName: saved.arabicName || m.companyArabicName }
              : m
          )
        : [{
            companyId: saved.id,
            companyName: saved.name || 'Agency',
            companyArabicName: saved.arabicName,
            role: 'Owner',
            status: 'active',
          }],
      isDemo: Boolean(prev?.isDemo || isDemoCompany),
    }));
    setPendingOnboardingUser(null);

    updateOperatorCompanyOnServer({
      name: saved.name,
      arabicName: saved.arabicName,
      contactEmail: saved.contactEmail,
      contactPhone: saved.contactPhone,
      description: saved.description,
      logoUrl: saved.logoUrl,
      coverImageUrl: saved.coverImageUrl,
      publishToDirectory: !data.publicProfileSkipped,
    }).catch(() => {});

    if (!data.publicProfileSkipped && saved.name) {
      registerAgencyInDirectory({
        id: saved.id,
        name: saved.name,
        arabicName: saved.arabicName || saved.name,
        slug: saved.slug,
        logoUrl: saved.logoUrl,
        coverImageUrl: saved.coverImageUrl,
        address: saved.address || 'Cairo, Egypt',
        addressAr: saved.address || 'القاهرة، مصر',
        governorates: saved.coveredDestinations || ['Cairo', 'Giza', 'Luxor', 'Aswan'],
        supportedLanguages: saved.supportedLanguages || ['Arabic', 'English'],
        guideRosterCount: saved.guideRosterCount || 1,
        fleetCount: 1,
        foundedYear: saved.foundedYear || new Date().getFullYear(),
        description: saved.description,
        descriptionAr: saved.descriptionAr || saved.description,
        whatsappNumber: saved.whatsappNumber || saved.contactPhone,
        contactPhone: saved.contactPhone,
        contactEmail: '',
        brandColors: saved.brandColors,
        isVerified: true,
        isDemo: false,
      });
    }

    reloadData();
    setAppMode('operator');
    setJourneyState('app');

    // Route to user's chosen destination action
    if (data.destinationAction === 'inquiry') {
      setSalesSubTab('inbox');
      setCurrentTab('inbox');
    } else if (data.destinationAction === 'quote') {
      setSalesSubTab('quotes');
      setCurrentTab('quotes');
    } else {
      setCurrentTab('dashboard');
    }

    try {
      localStorage.setItem('daleel_journey_state', 'app');
    } catch {}
  };

  const handleSaveWorkspaceDirect = (updated: Partial<Workspace>) => {
    const saved = repository.updateWorkspace(updated);
    setWorkspace(saved);
    saveAgencyToCloud({
      id: saved.id,
      name: saved.name,
      arabicName: saved.arabicName || '',
      slug: saved.slug || 'daleel-egypt',
      logoUrl: saved.logoUrl || '',
      coverImageUrl: saved.coverImageUrl || '',
      tourismLicenseNumber: saved.tourismLicenseNumber || '',
      licenseClass: 'Class A',
      commercialRegistry: saved.commercialRegistry || '',
      taxRegistrationNumber: saved.taxRegistrationNumber || '',
      address: saved.address || '',
      addressAr: saved.address || '',
      governorates: saved.coveredDestinations || ['Cairo', 'Giza', 'Luxor', 'Aswan'],
      supportedLanguages: saved.supportedLanguages || ['English', 'Spanish'],
      minGroupPax: saved.minGroupPax || 2,
      maxGroupPax: saved.maxGroupPax || 50,
      guideRosterCount: saved.guideRosterCount || 10,
      fleetCount: 12,
      foundedYear: saved.foundedYear || 2018,
      description: saved.description || '',
      descriptionAr: saved.descriptionAr || '',
      whatsappNumber: saved.whatsappNumber || '',
      contactPhone: saved.contactPhone || '',
      contactEmail: saved.contactEmail || '',
      brandColors: saved.brandColors || { primary: '#44200F', accent: '#795037', gold: '#C4A177' },
      isVerified: false,
      rating: 0,
      reviewCount: 0,
    } as any).catch(() => {});
    reloadData();
  };

  const handleActivateStarterRates = () => {
    repository.seedStarterRates(workspace.id);
    reloadData();
  };

  const handleSimulateInquiry = () => {
    const inq = repository.simulateWhatsAppInquiry(workspace.id);
    reloadData();
    setActiveInquiryForQuote(inq);
  };

  const handleSaveInquiry = (inq: Inquiry) => {
    repository.saveInquiry(inq);
    reloadData();
  };

  const handleProceedToQuote = (inq: Inquiry) => {
    setActiveInquiryForQuote(inq);
    setCurrentTab('quotes');
  };

  const handleSaveQuote = (quote: Quote) => {
    repository.saveQuote(quote);
    reloadData();
  };

  const handleUpdateQuoteStatus = (quoteId: string, status: Quote['status']) => {
    const target = quotes.find(q => q.id === quoteId);
    if (target) {
      const updated = { ...target, status, updatedAt: new Date().toISOString() };
      repository.saveQuote(updated);
      if (status === 'Accepted') {
        const existingTrips = loadTrips();
        if (!existingTrips.some(t => t.quoteId === updated.id)) {
          const nextTrip = createTripFromQuote(updated, existingTrips.length + 1);
          saveTrips([nextTrip, ...existingTrips]);
        }
      }
      reloadData();
    }
  };

  const handleSaveRate = (rate: Rate) => {
    repository.saveRate(rate);
    reloadData();
  };

  const handleDeleteRate = (id: string) => {
    repository.deleteRate(id, workspace.id);
    reloadData();
  };

  const handleSaveSupplier = (supplier: Supplier) => {
    repository.saveSupplier(supplier);
    reloadData();
  };

  const handleUpdateWorkspace = (updates: Partial<Workspace>) => {
    repository.updateWorkspace(updates);
    reloadData();
  };

  const handleSaveUser = (user: User) => {
    repository.saveUser(user);
    reloadData();
  };

  const handleImportStaff = (newUsers: User[]) => {
    newUsers.forEach((u) => repository.saveUser(u));
    reloadData();
  };

  const handleReassignWorkloadFile = (
    fileType: 'quote' | 'trip' | 'inquiry',
    fileId: string,
    newStaffId: string,
    newStaffName: string
  ) => {
    if (fileType === 'quote') {
      const target = quotes.find(q => q.id === fileId);
      if (target) {
        const updated = {
          ...target,
          assignedAgentId: newStaffId,
          assignedAgentName: newStaffName,
          updatedAt: new Date().toISOString(),
        };
        repository.saveQuote(updated);
      }
    } else if (fileType === 'inquiry') {
      const target = inquiries.find(inq => inq.id === fileId);
      if (target) {
        const updated = {
          ...target,
          assignedAgentId: newStaffId,
          assignedAgentName: newStaffName,
        };
        repository.saveInquiry(updated);
      }
    } else if (fileType === 'trip') {
      const currentTrips = loadTrips();
      const nextTrips = currentTrips.map((t) => {
        if (t.id === fileId) {
          return {
            ...t,
            assignedOperatorName: newStaffName,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      saveTrips(nextTrips);
    }
    reloadData();
  };

  const handleUpdateFollowUp = (id: string, updates: Partial<FollowUpTask>) => {
    repository.updateFollowUp(id, updates);
    reloadData();
  };

  const handleOpenAgencyShowcase = (agencyId?: string) => {
    setSelectedAgencyId(agencyId || null);
    setIsAgencyViewActive(true);
    if (window.history?.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'agency');
      if (agencyId) {
        url.searchParams.set('agencyId', agencyId);
      } else {
        url.searchParams.delete('agencyId');
      }
      window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}`);
    }
  };

  // If viewing a proposal (Operator Preview or Client Mode)
  if (activeProposalQuote) {
    return (
      <ProposalViewer
        quote={activeProposalQuote}
        workspace={workspace}
        isClientView={isClientModeActive}
        trackView={isClientModeActive}
        onConfirmTrip={handleConfirmQuoteToTrip}
        onBackToApp={() => {
          setActiveProposalQuote(null);
          setIsClientModeActive(false);
          if (window.history?.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            url.searchParams.delete('quoteId');
            window.history.replaceState({}, '', url.pathname);
          }
          reloadData();
        }}
        onQuoteUpdated={(updated) => {
          setActiveProposalQuote(updated);
          reloadData();
        }}
      />
    );
  }

  // If client view is opened without a quote
  if (isClientModeActive && !activeProposalQuote) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white border border-[#EDE0CC] rounded-2xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#44200F] text-[#C4A177] flex items-center justify-center mx-auto shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#44200F]">Itinerary Proposal Link</h2>
          <p className="text-xs text-slate-600">
            No active proposal found for this link. Please check your link or contact your tour specialist at {workspace.name}.
          </p>
          <button
            onClick={() => {
              setIsClientModeActive(false);
              setJourneyState('app');
              setCurrentTab('quotes');
            }}
            className="btn-tactile px-4 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
          >
            Go to Tour Operator Desk
          </button>
        </div>
      </div>
    );
  }

  // If public or direct agency showcase page is requested
  if (isAgencyViewActive) {
    return (
      <AgencyShowcaseView
        workspace={workspace}
        uiLang={uiLang}
        agencyId={selectedAgencyId}
        onBackToApp={() => {
          setIsAgencyViewActive(false);
          setSelectedAgencyId(null);
          if (window.history?.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            url.searchParams.delete('agencyId');
            url.searchParams.delete('agency');
            window.history.replaceState({}, '', url.pathname);
          }
          reloadData();
        }}
        onNavigateToQuotes={() => {
          setIsAgencyViewActive(false);
          setSelectedAgencyId(null);
          setCurrentTab('quotes');
        }}
        onNavigateToSettings={() => {
          setIsAgencyViewActive(false);
          setSelectedAgencyId(null);
          setCurrentTab('settings');
        }}
        onReloadData={reloadData}
        onSelectAnotherAgency={(id) => setSelectedAgencyId(id)}
      />
    );
  }

  // If a traveler entered their personal/tour passcode
  if (activeGuestTrip) {
    return (
      <TravelerMobilePortal
        trip={activeGuestTrip.trip}
        passenger={activeGuestTrip.passenger}
        workspace={workspace}
        uiLang={uiLang}
        onExitPortal={() => {
          setActiveGuestTrip(null);
          if (window.history?.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            url.searchParams.delete('passcode');
            window.history.replaceState({}, '', url.pathname);
          }
        }}
      />
    );
  }

  // If browsing companies marketplace/directory full screen
  if (isBrowseCompaniesActive) {
    return (
      <div className="min-h-screen bg-[#faf8f5] p-3 sm:p-6 max-w-7xl mx-auto">
        <BrowseCompaniesView
          uiLang={uiLang}
          currentWorkspace={workspace}
          onBackToApp={() => {
            setIsBrowseCompaniesActive(false);
            if (window.history?.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('view');
              window.history.replaceState({}, '', url.pathname);
            }
          }}
          onOpenAgencyShowcase={(id) => {
            setIsBrowseCompaniesActive(false);
            handleOpenAgencyShowcase(id);
          }}
          onRequestQuoteFromAgency={() => {
            setIsBrowseCompaniesActive(false);
            setIsAgencyViewActive(true);
          }}
        />
      </div>
    );
  }

  // Standalone Public Traveler Inquiry Form (Direct link / QR code)
  if (isVisitorInquire) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-8 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl">
          <PublicTripRequestForm
            workspace={workspace}
            uiLang={uiLang}
            onSubmitInquiry={(newInquiry) => {
              repository.saveInquiry(newInquiry);
              setInquiries(prev => [newInquiry, ...prev.filter(i => i.id !== newInquiry.id)]);
              setIsVisitorInquire(false);
              if (window.history?.replaceState) {
                const url = new URL(window.location.href);
                url.searchParams.delete('inquire');
                window.history.replaceState({}, '', url.pathname);
              }
            }}
            onClose={() => {
              setIsVisitorInquire(false);
              if (window.history?.replaceState) {
                const url = new URL(window.location.href);
                url.searchParams.delete('inquire');
                window.history.replaceState({}, '', url.pathname);
              }
            }}
          />
        </div>
      </div>
    );
  }

  // Standalone Interactive Live Trip Status & Guest Portal (Direct token link / QR code)
  if (activePortalToken) {
    return (
      <ClientPortalView
        quotes={quotes}
        workspace={workspace}
        uiLang={uiLang}
        initialToken={activePortalToken}
        onBack={() => {
          setActivePortalToken(null);
          if (window.history?.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete('portal');
            url.searchParams.delete('ref');
            window.history.replaceState({}, '', url.pathname);
          }
        }}
      />
    );
  }

  // STEP 1: AUTH SCREEN (Login / Register / Traveler Access with Arabic & English)
  if (journeyState === 'auth') {
    return (
      <AuthScreen
        initialLang={uiLang}
        onLangChange={handleSetUiLang}
        onSignIn={handleSignIn}
        onCreateAccount={handleCreateAccount}
        onEnterAsTraveler={handleEnterAsTraveler}
        onSignInTraveler={handleSignInTraveler}
        onEnterGuestCode={(code) => {
          const match = findTripOrGuestByCode(code);
          if (match) {
            setActiveGuestTrip(match);
          }
        }}
        onBrowseCompanies={() => {
          setAppMode('traveler');
          setJourneyState('app');
          try {
            localStorage.setItem('daleel_journey_state', 'app');
          } catch {}
        }}
        onOpenAgencyShowcase={(id) => handleOpenAgencyShowcase(id)}
      />
    );
  }

  // Dedicated Full-Page Guided Onboarding (when relaunched from setup tab or settings)
  if (isGuidedOnboardingActive) {
    return (
      <WorkspaceOnboardingGate
        key={`guided-${workspace.id}`}
        initialCompanyName={workspace.name || ''}
        initialEmail={workspace.contactEmail || ''}
        initialLang={uiLang}
        onCancel={() => setIsGuidedOnboardingActive(false)}
        onComplete={(data) => {
          handleGateComplete(data);
          setIsGuidedOnboardingActive(false);
        }}
      />
    );
  }

  // STEP 2: WORKSPACE SETUP GATE (MANDATORY STEP-BY-STEP GATE BEFORE DASHBOARD ACCESS)
  if (journeyState === 'onboarding') {
    return (
      <WorkspaceOnboardingGate
        key={`onboarding-${pendingOnboardingUser?.companyId || workspace.id}`}
        initialCompanyName={
          pendingOnboardingUser?.companyName ||
          (workspace.id !== 'unconfigured' && !isBlueNileOrDemoCompanyId(workspace.id) ? workspace.name : '')
        }
        initialEmail={
          pendingOnboardingUser?.email ||
          (workspace.id !== 'unconfigured' && !isBlueNileOrDemoCompanyId(workspace.id) ? workspace.contactEmail : '')
        }
        initialLang={uiLang}
        onCancel={() => setJourneyState('auth')}
        onComplete={handleGateComplete}
      />
    );
  }

  // STEP 3: STRICT REALM AUTHORIZATION GUARD
  // A regular traveller must NEVER see operator tools unless the authenticated server session proves active company membership
  const isOperatorAuthorized = canAccessOperatorRealm(sessionProfile);

  if (appMode === 'traveler' || !isOperatorAuthorized) {
    return (
      <TravelerHubView
        uiLang={uiLang}
        onSetUiLang={handleSetUiLang}
        currentUser={currentUser}
        currentWorkspace={workspace}
        quotes={quotes}
        hasCompanyMembership={isOperatorAuthorized}
        companyName={
          (uiLang === 'ar' && (sessionProfile?.companyArabicName || workspace.arabicName))
            ? (sessionProfile?.companyArabicName || workspace.arabicName)
            : (sessionProfile?.companyName || workspace.name)
        }
        onOpenGuestPasscode={(code) => {
          const match = findTripOrGuestByCode(code);
          if (match) {
            setActiveGuestTrip(match);
          }
        }}
        onOpenPortalToken={(token) => {
          setActivePortalToken(token);
        }}
        onOpenAgencyShowcase={(agencyId) => {
          handleOpenAgencyShowcase(agencyId);
        }}
        onRequestQuoteFromAgency={(_agency) => {
          setIsVisitorInquire(true);
        }}
        onSwitchToOperatorDesk={isOperatorAuthorized ? () => {
          setAppMode('operator');
          setCurrentTab('dashboard');
        } : undefined}
        onSignInTraveler={handleSignInTraveler}
        onSignOut={handleSignOut}
      />
    );
  }

  // STEP 4: DMC OPERATOR VIEWPORT (Restricted to verified company members)
  return (
    <div className="flex flex-col min-h-screen">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 text-amber-900 flex items-center justify-between shadow-sm z-50 sticky top-0">
          <div>
            <h3 className="font-semibold text-sm">Google Maps Quota Exhausted</h3>
            <p className="text-xs mt-1">
              The shared demo key has reached its daily quota limit. To restore full functionality, prompt the agent to <strong>&quot;Upgrade to a Google Cloud project for Maps&quot;</strong> or manually configure your own <code className="bg-amber-100 px-1 py-0.5 rounded">GOOGLE_MAPS_API_KEY</code> in the environment settings.
            </p>
          </div>
        </div>
      )}
      <Layout
        key={`${workspace.id}-${currentUser.id}`}
        workspace={workspace}
        currentUser={currentUser}
        currentTab={currentTab}
        setCurrentTab={handleNavigateTab}
        uiLang={uiLang}
        setUiLang={handleSetUiLang}
        onOpenNewInquiry={() => setCurrentTab('inbox')}
        onOpenNewQuote={() => {
          setActiveInquiryForQuote(undefined);
          setCurrentTab('quotes');
        }}
        onSignOut={handleSignOut}
        onOpenOnboarding={() => setJourneyState('onboarding')}
        sessionProfile={sessionProfile}
        onSwitchToTravelerRealm={() => setAppMode('traveler')}
        inquiries={inquiries}
        quotes={quotes}
        followUps={followUps}
        banner={
          <CompanyReadinessBanner
            workspace={workspace}
            rates={rates}
            suppliers={suppliers}
            onSaveWorkspace={handleSaveWorkspaceDirect}
            onActivateStarterRates={handleActivateStarterRates}
            onNavigateToSettings={() => setCurrentTab('settings')}
            uiLang={uiLang}
          />
        }
      >
        <TabTransitionWrapper activeKey={currentTab} minHeight="calc(100vh - 7rem)">
          {currentTab === 'dashboard' && (
            <DashboardView
              workspace={workspace}
              inquiries={inquiries}
              quotes={quotes}
              uiLang={uiLang}
              onNavigateTab={handleNavigateTab}
              onSelectInquiry={handleProceedToQuote}
              onSelectQuote={(quote: Quote) => setActiveProposalQuote(quote)}
              onOpenNewInquiry={() => setCurrentTab('inbox')}
              onSimulateInquiry={handleSimulateInquiry}
              onOpenOnboarding={() => setJourneyState('onboarding')}
            />
          )}

          {/* 2. SALES WORKSPACE (Inquiry Inbox, Quote Builder, Pipeline, Follow-ups) */}
          {(currentTab === 'sales' || currentTab === 'inbox' || currentTab === 'quotes' || currentTab === 'pipeline' || currentTab === 'followups') && (
            <SalesWorkspaceView
              workspace={workspace}
              currentUser={currentUser}
              inquiries={inquiries}
              quotes={quotes}
              rates={rates}
              followUps={followUps}
              uiLang={uiLang}
              activeSubTab={
                currentTab === 'inbox' || currentTab === 'quotes' || currentTab === 'pipeline' || currentTab === 'followups'
                  ? currentTab
                  : salesSubTab
              }
              initialInquiry={activeInquiryForQuote}
              onNavigateSubTab={(subTab) => {
                setSalesSubTab(subTab);
                setCurrentTab(subTab);
              }}
              onSelectInquiryForQuote={handleProceedToQuote}
              onConfirmQuoteToTrip={handleConfirmQuoteToTrip}
              onOpenNewInquiry={() => {
                setSalesSubTab('inbox');
                setCurrentTab('sales');
              }}
              onOpenNewQuote={() => {
                setActiveInquiryForQuote(undefined);
                setSalesSubTab('quotes');
                setCurrentTab('sales');
              }}
              onViewProposal={(quote: Quote) => {
                setActiveProposalQuote(quote);
              }}
              onSaveQuote={handleSaveQuote}
              onSaveInquiry={handleSaveInquiry}
              onUpdateQuoteStatus={handleUpdateQuoteStatus}
              onUpdateFollowUp={handleUpdateFollowUp}
            />
          )}

          {/* 3. REUSABLE OPERATIONAL LIBRARY (Rates & Tariffs, Suppliers, Seasons, Currencies) */}
          {(currentTab === 'library' || currentTab === 'rates') && (
            <LibraryWorkspaceView
              workspace={workspace}
              currentUser={currentUser}
              suppliers={suppliers}
              rates={rates}
              seasons={seasons}
              uiLang={uiLang}
              activeSubTab={librarySubTab}
              onNavigateSubTab={(subTab) => {
                setLibrarySubTab(subTab);
                setCurrentTab('library');
              }}
              onSaveRate={handleSaveRate}
              onDeleteRate={handleDeleteRate}
              onSaveSupplier={handleSaveSupplier}
            />
          )}

          {currentTab === 'trips' && (
            <TripOperationsView
              workspace={workspace}
              quotes={quotes}
              uiLang={uiLang}
              initialSubTab={operationSubTab}
              onNavigateTab={handleNavigateTab}
            />
          )}

          {currentTab === 'trips_fleet' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <FleetTransportationView
                workspace={workspace}
                uiLang={uiLang}
                onNavigateToTrips={() => setCurrentTab('trips')}
              />
            </div>
          )}

          {currentTab === 'trips_guides' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <TourGuidesRepsView
                workspace={workspace}
                uiLang={uiLang}
                onNavigateToTrips={() => setCurrentTab('trips')}
              />
            </div>
          )}

          {currentTab === 'trips_rooming' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <HotelRoomingListsView
                workspace={workspace}
                uiLang={uiLang}
                onNavigateToTrips={() => setCurrentTab('trips')}
              />
            </div>
          )}

          {currentTab === 'trips_vouchers' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <VouchersDispatchView
                workspace={workspace}
                uiLang={uiLang}
                quotes={quotes}
              />
            </div>
          )}

          {currentTab === 'hajj_umrah' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <HajjUmrahView
                workspace={workspace}
                currentUser={currentUser}
                uiLang={uiLang}
                onToggleHajjUmrah={() => {}}
                onProceedToQuote={(quote: Quote) => {
                  handleSaveQuote(quote);
                  setActiveProposalQuote(quote);
                }}
                onNavigateTab={handleNavigateTab}
              />
            </div>
          )}

          {(currentTab === 'live_apis' || currentTab === 'live_intel') && (
            <div className="p-4 sm:p-6 bg-[#FAF7F2] min-h-[calc(100vh-8rem)]">
              <LiveIntelligenceView
                workspace={workspace}
                uiLang={uiLang}
                onNavigateToQuotes={() => setCurrentTab('quotes')}
                onNavigateToTrips={() => setCurrentTab('trips')}
              />
            </div>
          )}

          {currentTab === 'all_modules' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <AllModulesView
                workspace={workspace}
                uiLang={uiLang}
                quotes={quotes}
                inquiries={inquiries}
                onNavigateTab={handleNavigateTab}
                onOpenNewQuote={() => setCurrentTab('quotes')}
                onOpenNewInquiry={() => setCurrentTab('inbox')}
              />
            </div>
          )}

          {currentTab === 'passcodes' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <TourPasscodesManagerView
                workspace={workspace}
                uiLang={uiLang}
                onOpenTravelerPortal={(trip, passenger) => {
                  setActiveGuestTrip({ trip, passenger });
                }}
                onBackToApp={() => setCurrentTab('trips')}
              />
            </div>
          )}

          {currentTab === 'agency_showcase' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <AgencyShowcaseView
                workspace={workspace}
                uiLang={uiLang}
                agencyId={selectedAgencyId}
                onBackToApp={() => {
                  setSelectedAgencyId(null);
                  setCurrentTab('dashboard');
                }}
                onNavigateToQuotes={() => {
                  setSelectedAgencyId(null);
                  setCurrentTab('quotes');
                }}
                onNavigateToSettings={() => {
                  setSelectedAgencyId(null);
                  setCurrentTab('settings');
                }}
                onReloadData={reloadData}
                onSelectAnotherAgency={(id) => setSelectedAgencyId(id)}
              />
            </div>
          )}

          {currentTab === 'browse_companies' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <BrowseCompaniesView
                uiLang={uiLang}
                currentWorkspace={workspace}
                onBackToApp={() => setCurrentTab('dashboard')}
                onOpenAgencyShowcase={(id) => handleOpenAgencyShowcase(id)}
                onRequestQuoteFromAgency={() => setCurrentTab('quotes')}
              />
            </div>
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              workspace={workspace}
              quotes={quotes}
              inquiries={inquiries}
              uiLang={uiLang}
            />
          )}

          {currentTab === 'plan' && (
            <SubscriptionPlanView
              workspace={workspace}
              uiLang={uiLang}
              onUpdateWorkspace={handleUpdateWorkspace}
            />
          )}

          {currentTab === 'admin_dashboard' && (
            <AdminDashboardView
              workspace={workspace}
              currentUser={currentUser}
              users={repository.getUsers(workspace.id)}
              quotes={quotes}
              trips={loadTrips()}
              inquiries={inquiries}
              uiLang={uiLang}
              onReassignFile={handleReassignWorkloadFile}
              onImportStaff={handleImportStaff}
            />
          )}

          {currentTab === 'team' && (
            <TeamSettingsView
              workspace={workspace}
              currentUser={currentUser}
              users={repository.getUsers(workspace.id)}
              auditLogs={auditLogs}
              uiLang={uiLang}
              onSaveUser={handleSaveUser}
              onUpdateWorkspace={handleUpdateWorkspace}
              onOpenPublicShowcase={() => handleOpenAgencyShowcase(workspace.id)}
              onLaunchOnboardingWizard={() => setIsGuidedOnboardingActive(true)}
              initialTab="team"
            />
          )}

          {currentTab === 'settings' && (
            <TeamSettingsView
              workspace={workspace}
              currentUser={currentUser}
              users={repository.getUsers(workspace.id)}
              auditLogs={auditLogs}
              uiLang={uiLang}
              onSaveUser={handleSaveUser}
              onUpdateWorkspace={handleUpdateWorkspace}
              onOpenPublicShowcase={() => handleOpenAgencyShowcase(workspace.id)}
              onLaunchOnboardingWizard={() => setIsGuidedOnboardingActive(true)}
              initialTab={settingsInitialTab}
            />
          )}

          {currentTab === 'public_inquire' && (
            <div className="p-4 sm:p-6 bg-[#faf7f2] min-h-[calc(100vh-8rem)]">
              <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0f2035]">
                    {uiLang === 'ar' ? 'نموذج طلب وتفصيل الرحلات للزوار (Public B2C Wizard)' : 'Public Traveler Inquiry Wizard (B2C)'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {uiLang === 'ar'
                      ? 'هذا النموذج مخصص لعملاء وزوار الموقع لتفصيل رحلاتهم وحساب فئات الجنسيات والمواسم واستلام كود المتابعة'
                      : 'Interactive client trip request wizard with automated nationality tiers and instant booking reference'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('inbox')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                >
                  {uiLang === 'ar' ? 'العودة لصندوق الوارد' : 'Back to Inbox'}
                </button>
              </div>
              <PublicTripRequestForm
                workspace={workspace}
                uiLang={uiLang}
                onSubmitInquiry={(newInquiry) => {
                  repository.saveInquiry(newInquiry);
                  setInquiries(prev => [newInquiry, ...prev.filter(i => i.id !== newInquiry.id)]);
                  setCurrentTab('inbox');
                }}
                onClose={() => setCurrentTab('inbox')}
              />
            </div>
          )}

          {currentTab === 'client_portal' && (
            <ClientPortalView
              quotes={quotes}
              workspace={workspace}
              uiLang={uiLang}
              initialToken={activePortalToken || undefined}
              onBack={() => setCurrentTab('quotes')}
            />
          )}

          {currentTab === 'support' && (
            <div className="bg-[#FAF8F5] -m-2.5 sm:-m-5 md:-m-6 min-h-[calc(100vh-5rem)]">
              <AISupportDrawer
                isOpen={true}
                onClose={() => setCurrentTab('dashboard')}
                uiLang={uiLang}
                userRole="operator"
                isFullPageView={true}
                onNavigateToTab={(tab) => handleNavigateTab(tab)}
                trips={loadTrips()}
                quotes={quotes}
                inquiries={inquiries}
                workspace={workspace}
              />
            </div>
          )}
        </TabTransitionWrapper>

        {/* Coordinated Floating Action Cluster (Faris + Quick Guidance Help) */}
        {currentTab !== 'support' && (
          <FloatingActionCluster
            uiLang={uiLang}
            currentTab={currentTab}
            onOpenSupport={() => setIsOperatorSupportDrawerOpen(true)}
            isSupportOpen={isOperatorSupportDrawerOpen}
            onNavigateTab={(tab) => handleNavigateTab(tab)}
            userRole="operator"
          />
        )}

        {/* Operator Slide-Over Support Drawer */}
        {currentTab !== 'support' && (
          <AISupportDrawer
            isOpen={isOperatorSupportDrawerOpen}
            onClose={() => setIsOperatorSupportDrawerOpen(false)}
            uiLang={uiLang}
            userRole="operator"
            trips={loadTrips()}
            quotes={quotes}
            inquiries={inquiries}
            workspace={workspace}
            onNavigateToTab={(tab) => {
              setIsOperatorSupportDrawerOpen(false);
              handleNavigateTab(tab);
            }}
          />
        )}

        {/* Modal Wizard (delegates to canonical onboarding) */}
        <OnboardingWizardModal
          isOpen={onboardingWizardOpen}
          onClose={() => setOnboardingWizardOpen(false)}
          workspace={workspace}
          onSaveWorkspace={handleUpdateWorkspace}
          onOpenCanonicalOnboarding={() => setJourneyState('onboarding')}
          onLaunchFirstQuote={() => {
            const sampleInq = inquiries[0];
            if (sampleInq) {
              handleProceedToQuote(sampleInq);
            } else {
              setCurrentTab('quotes');
            }
          }}
        />
      </Layout>
    </div>
  );
}
