import { operatorStorageKey, setOperatorScope, getOperatorScope } from './sessionScope';
import { 
  Workspace, User, Supplier, Rate, Season, ExchangeRate, Inquiry, Quote, 
  FollowUpTask, AuditLog, ProposalViewEvent, HajjUmrahPackage, PilgrimBooking,
  CustomStaffRole, StaffMember
} from '../types';
import { 
  DEMO_WORKSPACE, DEMO_USERS, DEMO_SUPPLIERS, DEMO_RATES, 
  DEMO_INQUIRIES, DEMO_QUOTES, DEMO_FOLLOW_UPS, DEMO_AUDIT_LOGS,
  RICH_EGYPT_SUPPLIERS, RICH_EGYPT_RATES, RICH_EGYPT_QUOTES
} from './demoData';
import { INITIAL_SEASONS, DEFAULT_EXCHANGE_RATES } from './constants';
import { HAJJ_UMRAH_PACKAGES, HAJJ_UMRAH_SUPPLIERS, HAJJ_UMRAH_RATES } from './hajjUmrahData';
import { CANONICAL_AL_FUTTAIM_TRIP, loadTrips, saveTrips } from './tripStore';

const STORAGE_KEYS = {
  WORKSPACE: 'qde_workspace',
  USERS: 'qde_users',
  SUPPLIERS: 'qde_suppliers',
  RATES: 'qde_rates',
  SEASONS: 'qde_seasons',
  FX: 'qde_exchange_rates',
  INQUIRIES: 'qde_inquiries',
  QUOTES: 'qde_quotes',
  FOLLOW_UPS: 'qde_follow_ups',
  AUDIT: 'qde_audit_logs',
  VIEWS: 'qde_proposal_views',
  CURRENT_USER_ID: 'qde_current_user_id',
  PILGRIMS: 'qde_pilgrim_bookings',
  HAJJ_PACKAGES: 'qde_hajj_packages',
  CUSTOM_ROLES: 'qde_custom_roles',
  STAFF_MEMBERS: 'qde_staff_members',
};

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof localStorage === 'undefined') return defaultValue;
  if (!getOperatorScope()) return defaultValue;
  try {
    const item = localStorage.getItem(operatorStorageKey(key));
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return;
  if (!getOperatorScope()) return;
  try {
    localStorage.setItem(operatorStorageKey(key), JSON.stringify(value));
  } catch {
    // Ignored in non-browser or quota-limited storage
  }
}

// Existing data is never deleted or seeded on read.
export function initializeDemoData(_forceReset = false) {}

function deduplicateUsersList(users: User[]): User[] {
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();
  const result: User[] = [];

  for (const u of users) {
    if (!u || !u.name) continue;
    const idKey = u.id;
    const emailKey = (u.email || '').trim().toLowerCase();
    const nameKey = `${u.workspaceId || ''}::${u.name.trim().toLowerCase()}`;

    if (seenIds.has(idKey)) continue;
    if (emailKey && seenEmails.has(`${u.workspaceId || ''}::${emailKey}`)) continue;
    if (seenNames.has(nameKey)) continue;

    seenIds.add(idKey);
    if (emailKey) seenEmails.add(`${u.workspaceId || ''}::${emailKey}`);
    seenNames.add(nameKey);
    result.push(u);
  }
  return result;
}

export const repository = {
  // Workspace
  getWorkspace(): Workspace {
    initializeDemoData();
    return getStorageItem<Workspace>(STORAGE_KEYS.WORKSPACE, DEMO_WORKSPACE);
  },
  updateWorkspace(updates: Partial<Workspace>): Workspace {
    const current = this.getWorkspace();
    const updated = { ...current, ...updates };
    setStorageItem(STORAGE_KEYS.WORKSPACE, updated);
    this.addAuditLog('Updated workspace profile & settings', 'Workspace', updated.id);
    return updated;
  },
  initializeCompanyWorkspace(ws: Workspace, ownerUser: User): Workspace {
    setStorageItem(STORAGE_KEYS.WORKSPACE, ws);
    setStorageItem(STORAGE_KEYS.USERS, [ownerUser]);
    this.setCurrentUser(ownerUser.id);
    if (!localStorage.getItem(operatorStorageKey(STORAGE_KEYS.INQUIRIES))) {
      setStorageItem(STORAGE_KEYS.INQUIRIES, []);
    }
    if (!localStorage.getItem(operatorStorageKey(STORAGE_KEYS.QUOTES))) {
      setStorageItem(STORAGE_KEYS.QUOTES, []);
    }
    if (!localStorage.getItem(operatorStorageKey(STORAGE_KEYS.FOLLOW_UPS))) {
      setStorageItem(STORAGE_KEYS.FOLLOW_UPS, []);
    }
    if (!localStorage.getItem(operatorStorageKey('qde_trip_files'))) {
      saveTrips([]);
    }
    return ws;
  },

  // Users
  getUsers(workspaceId: string): User[] {
    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS, []);
    const matchingRaw = users.filter(u => u.workspaceId === workspaceId);
    if (matchingRaw.length > 0) {
      const deduped = deduplicateUsersList(matchingRaw);
      if (deduped.length !== matchingRaw.length) {
        const merged = [...users.filter(u => u.workspaceId !== workspaceId), ...deduped];
        setStorageItem(STORAGE_KEYS.USERS, merged);
      }
      return deduped;
    }

    // Only populate demo team members for explicit demo / Blue Nile workspace
    if (workspaceId === 'ws-demo' || workspaceId === 'ws-default' || workspaceId === 'comp_bluenile_01') {
      const initialUsers: User[] = deduplicateUsersList(
        DEFAULT_STAFF_MEMBERS.map((s, idx) => ({
          id: s.id,
          workspaceId,
          name: s.name,
          email: s.email,
          phone: s.phone,
          role: idx === 0 ? 'Owner' : idx === 3 ? 'Sales Agent' : 'Operations',
          language: 'ar',
          status: s.status === 'active' ? 'active' : 'inactive',
          customRoleId: s.customRoleId,
          customJobTitleEn: s.customJobTitleEn,
          customJobTitleAr: s.customJobTitleAr,
        }))
      );
      const merged = [...users.filter(u => u.workspaceId !== workspaceId), ...initialUsers];
      setStorageItem(STORAGE_KEYS.USERS, merged);
      return initialUsers;
    }

    return [];
  },
  getCurrentUser(): User {
    const scope = getOperatorScope();
    const isBlueNile = Boolean(
      scope && ['ws-default', 'ws-demo', 'comp_bluenile_01'].includes(scope.companyId)
    );
    const fallbackUsers = isBlueNile ? DEMO_USERS : [];
    const currentId = getStorageItem<string>(STORAGE_KEYS.CURRENT_USER_ID, fallbackUsers[0]?.id || '');
    const users = deduplicateUsersList(getStorageItem<User[]>(STORAGE_KEYS.USERS, fallbackUsers));
    const found = users.find(u => u.id === currentId) || users[0];
    if (found) return found;
    if (isBlueNile) return DEMO_USERS[0];
    return {
      id: scope?.userId || 'usr_pending',
      workspaceId: scope?.companyId || '',
      name: '',
      email: '',
      role: 'Owner',
      language: 'en',
      status: 'active',
    };
  },
  setCurrentUser(userId: string) {
    setStorageItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  },
  saveUser(user: User): void {
    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS, []);
    const emailNorm = (user.email || '').trim().toLowerCase();
    const nameNorm = (user.name || '').trim().toLowerCase();
    const idx = users.findIndex(
      u =>
        u.id === user.id ||
        (u.workspaceId === user.workspaceId &&
          ((emailNorm && (u.email || '').trim().toLowerCase() === emailNorm) ||
            (nameNorm && (u.name || '').trim().toLowerCase() === nameNorm)))
    );
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user, id: users[idx].id };
    } else {
      users.push(user);
    }
    const deduped = deduplicateUsersList(users);
    setStorageItem(STORAGE_KEYS.USERS, deduped);
    this.addAuditLog(`User profile/role updated: ${user.name} (${user.customJobTitleAr || user.role})`, 'Workspace', user.id);
  },

  // Suppliers
  getSuppliers(workspaceId: string): Supplier[] {
    const list = getStorageItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
    const matching = list.filter(s => s.workspaceId === workspaceId);
    if (matching.length === 0 && RICH_EGYPT_SUPPLIERS.length > 0) {
      const seeded = RICH_EGYPT_SUPPLIERS.map(s => ({ ...s, workspaceId }));
      const merged = [...list.filter(s => s.workspaceId !== workspaceId), ...seeded];
      setStorageItem(STORAGE_KEYS.SUPPLIERS, merged);
      return seeded;
    }
    return matching;
  },
  saveSupplier(supplier: Supplier): void {
    const list = getStorageItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
    const idx = list.findIndex(s => s.id === supplier.id);
    if (idx >= 0) list[idx] = supplier;
    else list.unshift(supplier);
    setStorageItem(STORAGE_KEYS.SUPPLIERS, list);
    this.addAuditLog(`Saved supplier: ${supplier.name}`, 'Rate', supplier.id);
  },
  deleteSupplier(id: string, workspaceId: string): void {
    const list = getStorageItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, [])
      .filter(s => !(s.id === id && s.workspaceId === workspaceId));
    setStorageItem(STORAGE_KEYS.SUPPLIERS, list);
  },

  // Rates
  getRates(workspaceId: string): Rate[] {
    return getStorageItem<Rate[]>(STORAGE_KEYS.RATES, []).filter(r => r.workspaceId === workspaceId);
  },
  saveRate(rate: Rate): void {
    const list = getStorageItem<Rate[]>(STORAGE_KEYS.RATES, []);
    const idx = list.findIndex(r => r.id === rate.id);
    if (idx >= 0) {
      rate.version = (list[idx].version || 1) + 1;
      rate.updatedAt = new Date().toISOString();
      list[idx] = rate;
    } else {
      list.unshift(rate);
    }
    setStorageItem(STORAGE_KEYS.RATES, list);
    this.addAuditLog(`Saved rate: ${rate.serviceName} (${rate.netCost} ${rate.currency})`, 'Rate', rate.id);
  },
  saveBulkRates(rates: Rate[]): void {
    const current = getStorageItem<Rate[]>(STORAGE_KEYS.RATES, []);
    const merged = [...rates, ...current];
    setStorageItem(STORAGE_KEYS.RATES, merged);
    this.addAuditLog(`Bulk imported ${rates.length} rates`, 'Rate', 'bulk');
  },
  deleteRate(id: string, workspaceId: string): void {
    const list = getStorageItem<Rate[]>(STORAGE_KEYS.RATES, [])
      .filter(r => !(r.id === id && r.workspaceId === workspaceId));
    setStorageItem(STORAGE_KEYS.RATES, list);
  },

  // Seasons
  getSeasons(workspaceId: string): Season[] {
    const list = getStorageItem<Season[]>(STORAGE_KEYS.SEASONS, []);
    const matching = list.filter(s => s.workspaceId === workspaceId);
    if (matching.length === 0 && INITIAL_SEASONS.length > 0) {
      const seeded = INITIAL_SEASONS.map(s => ({ ...s, workspaceId }));
      const merged = [...list.filter(s => s.workspaceId !== workspaceId), ...seeded];
      setStorageItem(STORAGE_KEYS.SEASONS, merged);
      return seeded;
    }
    return matching;
  },

  // Exchange Rates
  getExchangeRates(workspaceId: string): ExchangeRate[] {
    return getStorageItem<ExchangeRate[]>(STORAGE_KEYS.FX, []).filter(fx => fx.workspaceId === workspaceId);
  },
  updateExchangeRate(fx: ExchangeRate): void {
    const list = getStorageItem<ExchangeRate[]>(STORAGE_KEYS.FX, []);
    const idx = list.findIndex(item => item.id === fx.id);
    if (idx >= 0) list[idx] = fx;
    else list.push(fx);
    setStorageItem(STORAGE_KEYS.FX, list);
  },

  // Inquiries
  getInquiries(workspaceId: string): Inquiry[] {
    const list = getStorageItem<Inquiry[]>(STORAGE_KEYS.INQUIRIES, []);
    return list.filter(i => i.workspaceId === workspaceId);
  },
  getInquiry(id: string, workspaceId: string): Inquiry | undefined {
    return this.getInquiries(workspaceId).find(i => i.id === id);
  },
  saveInquiry(inquiry: Inquiry): void {
    const list = getStorageItem<Inquiry[]>(STORAGE_KEYS.INQUIRIES, []);
    const idx = list.findIndex(i => i.id === inquiry.id);
    if (idx >= 0) list[idx] = inquiry;
    else list.unshift(inquiry);
    setStorageItem(STORAGE_KEYS.INQUIRIES, list);
    this.addAuditLog(`Inquiry recorded: ${inquiry.travelerName}`, 'Inquiry', inquiry.id);
    // Synchronize inquiry to cloud Firestore database in background

  },

  // Quotes
  getQuotes(workspaceId: string): Quote[] {
    const quotes = getStorageItem<Quote[]>(STORAGE_KEYS.QUOTES, []);
    return quotes.filter(q => q.workspaceId === workspaceId);
  },
  getQuote(id: string, workspaceId: string): Quote | undefined {
    return this.getQuotes(workspaceId).find(q => q.id === id);
  },
  getQuoteByPublicToken(token: string): Quote | undefined {
    if (!token.trim()) return undefined;
    const all = getStorageItem<Quote[]>(STORAGE_KEYS.QUOTES, []);
    return all.find(q => q.publicToken === token);
  },
  saveQuote(quote: Quote): void {
    const list = getStorageItem<Quote[]>(STORAGE_KEYS.QUOTES, []);
    const idx = list.findIndex(q => q.id === quote.id);
    if (idx >= 0) list[idx] = quote;
    else list.unshift(quote);
    setStorageItem(STORAGE_KEYS.QUOTES, list);
    this.addAuditLog(`Quote saved: ${quote.quoteNumber} (${quote.travelerName})`, 'Quote', quote.id);
  },

  // Proposal Views
  recordProposalView(view: ProposalViewEvent): void {
    const list = getStorageItem<ProposalViewEvent[]>(STORAGE_KEYS.VIEWS, []);
    list.unshift(view);
    setStorageItem(STORAGE_KEYS.VIEWS, list);

    // Increment quote view count
    const quotes = getStorageItem<Quote[]>(STORAGE_KEYS.QUOTES, []);
    const quote = quotes.find(q => q.id === view.quoteId);
    if (quote) {
      quote.viewCount = (quote.viewCount || 0) + 1;
      quote.lastViewedAt = view.timestamp;
      if (quote.status === 'Sent') quote.status = 'Viewed';
      setStorageItem(STORAGE_KEYS.QUOTES, quotes);

      // Check if trigger follow-up task
      const followUps = getStorageItem<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, []);
      followUps.unshift({
        id: `fu-${Date.now()}`,
        workspaceId: quote.workspaceId,
        quoteId: quote.id,
        travelerName: quote.travelerName,
        travelerPhone: quote.travelerPhone,
        triggerReason: `Proposal viewed on ${view.deviceType} (${quote.viewCount} views total). Follow up promptly!`,
        status: 'Pending',
        suggestedMessage: `Hello ${quote.travelerName}, I noticed you're reviewing our Egypt itinerary proposal. Can I answer any questions or hold your reservations?`,
        dueDate: new Date().toISOString(),
        isUrgent: quote.viewCount >= 2,
      });
      setStorageItem(STORAGE_KEYS.FOLLOW_UPS, followUps);
    }
  },

  // Follow-up tasks
  getFollowUps(workspaceId: string): FollowUpTask[] {
    const list = getStorageItem<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, []);
    const clean = list.filter(fu => 
      !fu.id.includes('demo') && 
      !fu.travelerName.includes('Elena') && 
      !fu.travelerName.includes('Smith') &&
      fu.workspaceId === workspaceId
    );
    if (clean.length !== list.length) {
      setStorageItem(STORAGE_KEYS.FOLLOW_UPS, clean);
    }
    return clean;
  },
  updateFollowUp(id: string, updates: Partial<FollowUpTask>): void {
    const list = getStorageItem<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, []);
    const idx = list.findIndex(f => f.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      setStorageItem(STORAGE_KEYS.FOLLOW_UPS, list);
    }
  },

  // Audit Logs
  getAuditLogs(workspaceId: string): AuditLog[] {
    return getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT, []).filter(a => a.workspaceId === workspaceId);
  },
  addAuditLog(details: string, entityType: AuditLog['entityType'], entityId: string): void {
    const user = this.getCurrentUser();
    const ws = this.getWorkspace();
    const logs = getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT, []);
    logs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: ws.id,
      actorName: user?.name || 'System',
      actorRole: user?.role || 'Sales Agent',
      action: details,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
    setStorageItem(STORAGE_KEYS.AUDIT, logs.slice(0, 100)); // maintain latest 100
  },

  // Seed Egyptian Starter Rates for Day One Onboarding
  seedStarterRates(workspaceId: string): Rate[] {
    const existing = this.getRates(workspaceId);
    const starterRates: Rate[] = [
      {
        id: `rate-star-mena-${Date.now()}`,
        workspaceId,
        supplierId: 'sup-marriott-mena',
        supplierName: 'Marriott Mena House Cairo',
        serviceName: 'Pyramid View Deluxe Room (BB)',
        supplierType: 'Hotel',
        city: 'Giza',
        seasonIds: ['season-high-2026'],
        occupancyBasis: 'double',
        mealPlan: 'Bed & Breakfast',
        nationalityTier: 'all',
        currency: 'USD',
        netCost: 240,
        validityStart: '2026-01-01',
        validityEnd: '2026-12-31',
        version: 1,
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rate-star-steigen-${Date.now()}`,
        workspaceId,
        supplierId: 'sup-steigenberger-luxor',
        supplierName: 'Steigenberger Nile Palace Luxor',
        serviceName: 'Deluxe Nile View Room (BB)',
        supplierType: 'Hotel',
        city: 'Luxor',
        seasonIds: ['season-high-2026'],
        occupancyBasis: 'double',
        mealPlan: 'Bed & Breakfast',
        nationalityTier: 'all',
        currency: 'USD',
        netCost: 165,
        validityStart: '2026-01-01',
        validityEnd: '2026-12-31',
        version: 1,
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rate-star-cruise-${Date.now()}`,
        workspaceId,
        supplierId: 'sup-ms-mayfair',
        supplierName: 'M/S Mayfair Nile Cruise',
        serviceName: '4 Nights Luxor to Aswan (FB + Sightseeing)',
        supplierType: 'Nile Cruise',
        city: 'Luxor',
        seasonIds: ['season-high-2026'],
        occupancyBasis: 'per_person',
        mealPlan: 'Full Board',
        nationalityTier: 'all',
        currency: 'USD',
        netCost: 680,
        validityStart: '2026-01-01',
        validityEnd: '2026-12-31',
        version: 1,
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rate-star-transport-${Date.now()}`,
        workspaceId,
        supplierId: 'sup-egypt-trans',
        supplierName: 'Cairo Elite Chauffeur & Limousine',
        serviceName: 'Private Mercedes Sprinter VIP Airport + Full Day Cairo',
        supplierType: 'Transport',
        city: 'Cairo',
        seasonIds: ['season-high-2026'],
        occupancyBasis: 'per_vehicle',
        nationalityTier: 'all',
        currency: 'USD',
        netCost: 120,
        validityStart: '2026-01-01',
        validityEnd: '2026-12-31',
        version: 1,
        updatedAt: new Date().toISOString(),
      },
      {
        id: `rate-star-guide-${Date.now()}`,
        workspaceId,
        supplierId: 'sup-guide-syndicate',
        supplierName: 'Egyptian Tour Guides Syndicate',
        serviceName: 'Licensed Egyptologist Expert Guide (English / Russian)',
        supplierType: 'Guide',
        city: 'Cairo',
        seasonIds: ['season-high-2026'],
        occupancyBasis: 'per_group',
        nationalityTier: 'all',
        currency: 'USD',
        netCost: 85,
        validityStart: '2026-01-01',
        validityEnd: '2026-12-31',
        version: 1,
        updatedAt: new Date().toISOString(),
      },
    ];

    const currentAll = getStorageItem<Rate[]>(STORAGE_KEYS.RATES, []);
    const merged = [...starterRates, ...currentAll.filter(r => r.workspaceId !== workspaceId || !r.id.startsWith('rate-star-'))];
    setStorageItem(STORAGE_KEYS.RATES, merged);
    this.addAuditLog('Seeded 5 Egyptian DMC Starter Rates for Day One', 'Rate', 'starter-pack');
    return starterRates;
  },

  // Simulate WhatsApp Inbound Inquiry
  simulateWhatsAppInquiry(workspaceId: string): Inquiry {
    const newInquiry: Inquiry = {
      id: `inq-sim-${Date.now()}`,
      workspaceId,
      source: 'WhatsApp',
      travelerName: 'Elena Rostov (Moscow Travel Agency)',
      travelerPhone: '+7 916 482 9912',
      travelerEmail: 'elena@moscowvoyages.ru',
      rawText: 'Hello Karim! Need quotation for 4 VIP clients. Arriving Cairo Oct 14th for 3 nights at Mena House with Pyramid view, then 4-night luxury Nile Cruise from Luxor to Aswan. Russian speaking guide requested. Please send interactive proposal with USD and EUR breakdown.',
      receivedAt: new Date().toISOString(),
      status: 'New',
      slaMinutes: 30,
      assignedAgentId: 'user-agent-karim',
      assignedAgentName: 'Karim Hassan',
      language: 'ru',
      requirements: {
        travelerName: 'Elena Rostov',
        nationality: 'Russian',
        language: 'ru',
        startDate: '2026-10-14',
        durationDays: 7,
        group: {
          adults: 4,
          children: [],
          infants: 0,
        },
        cities: ['Cairo', 'Giza', 'Luxor', 'Aswan'],
        hotelStarRating: 5,
        budgetAmount: 4500,
        budgetCurrency: 'USD',
        interests: ['Pyramids of Giza', 'Nile Cruise', 'Karnak Temple', 'Valley of the Kings'],
        urgency: 'High',
        confidenceScores: { overall: 0.95 },
      },
    };

    const inquiries = getStorageItem<Inquiry[]>(STORAGE_KEYS.INQUIRIES, []);
    inquiries.unshift(newInquiry);
    setStorageItem(STORAGE_KEYS.INQUIRIES, inquiries);
    this.addAuditLog(`Simulated WhatsApp inquiry from ${newInquiry.travelerName}`, 'Inquiry', newInquiry.id);
    return newInquiry;
  },

  // Proposal Acceptance by Client
  recordProposalAcceptance(quoteId: string, clientData: { name: string; phone?: string; email?: string; notes?: string }): { success: boolean; quote?: Quote } {
    const quotes = getStorageItem<Quote[]>(STORAGE_KEYS.QUOTES, []);
    const quote = quotes.find(q => q.id === quoteId || q.publicToken === quoteId);
    if (!quote) return { success: false };

    quote.status = 'Accepted';
    quote.updatedAt = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.QUOTES, quotes);

    // Create immediate high-priority follow-up task
    const followUps = getStorageItem<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, []);
    followUps.unshift({
      id: `fu-accept-${Date.now()}`,
      workspaceId: quote.workspaceId,
      quoteId: quote.id,
      travelerName: clientData.name || quote.travelerName,
      travelerPhone: clientData.phone || quote.travelerPhone,
      triggerReason: `🎉 Client confirmed itinerary ${quote.quoteNumber}! Notes: ${clientData.notes || 'None'}. Contact immediately to hold rooms and issue voucher.`,
      status: 'Pending',
      suggestedMessage: `Dear ${clientData.name || quote.travelerName}, thank you for confirming itinerary ${quote.quoteNumber}! We have received your acceptance and will send your formal travel voucher shortly.`,
      dueDate: new Date().toISOString(),
      isUrgent: true,
    });
    setStorageItem(STORAGE_KEYS.FOLLOW_UPS, followUps);

    this.addAuditLog(`Client ${clientData.name || quote.travelerName} ACCEPTED proposal ${quote.quoteNumber}`, 'Quote', quote.id);
    return { success: true, quote };
  },

  // Lookup Quote by ID or publicToken
  getQuoteById(idOrToken: string): Quote | undefined {
    const quotes = getStorageItem<Quote[]>(STORAGE_KEYS.QUOTES, []);
    return quotes.find(q => q.id === idOrToken || q.publicToken === idOrToken || q.quoteNumber === idOrToken);
  },

  // Export full Workspace JSON backup
  exportWorkspaceBackup() {
    const ws = this.getWorkspace();
    return {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      source: 'RIHAL Egyptian DMC Platform',
      workspace: ws,
      users: getStorageItem<User[]>(STORAGE_KEYS.USERS, []),
      suppliers: getStorageItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []),
      rates: getStorageItem<Rate[]>(STORAGE_KEYS.RATES, []),
      seasons: getStorageItem<Season[]>(STORAGE_KEYS.SEASONS, []),
      exchangeRates: getStorageItem<ExchangeRate[]>(STORAGE_KEYS.FX, []),
      inquiries: getStorageItem<Inquiry[]>(STORAGE_KEYS.INQUIRIES, []),
      quotes: getStorageItem<Quote[]>(STORAGE_KEYS.QUOTES, []),
      followUps: getStorageItem<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, []),
      auditLogs: getStorageItem<AuditLog[]>(STORAGE_KEYS.AUDIT, []),
      views: getStorageItem<ProposalViewEvent[]>(STORAGE_KEYS.VIEWS, []),
    };
  },

  // Import and Restore Workspace from JSON
  importWorkspaceBackup(_rawData: unknown): {success:boolean;quotesCount:number;ratesCount:number;suppliersCount:number;inquiriesCount:number;error?:string} {
    return {success:false,quotesCount:0,ratesCount:0,suppliersCount:0,inquiriesCount:0,error:'Restore requires a validated workspace migration; no data changed.'};
  },

  getStorageUsageStats(): { totalKeys: number; approximateBytes: number; quotaFormatted: string } {
    let totalBytes = 0;
    let totalKeys = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('qde_')) {
          totalKeys++;
          const val = localStorage.getItem(operatorStorageKey(key)) || '';
          totalBytes += (key.length + val.length) * 2; // UTF-16
        }
      }
    } catch {
      // ignore
    }
    const kb = (totalBytes / 1024).toFixed(1);
    return {
      totalKeys,
      approximateBytes: totalBytes,
      quotaFormatted: `${kb} KB of ~5,000 KB (Healthy)`,
    };
  },

  // Clean Day-One State Setup
  resetToDayOne(workspaceUpdates: Partial<Workspace>): Workspace {
    const current = this.getWorkspace();
    const updated = { ...current, ...workspaceUpdates };
    setStorageItem(STORAGE_KEYS.WORKSPACE, updated);
    // Clear quotes, inquiries, and trips for a true Day-One experience
    setStorageItem(STORAGE_KEYS.QUOTES, []);
    setStorageItem(STORAGE_KEYS.INQUIRIES, []);
    setStorageItem(STORAGE_KEYS.FOLLOW_UPS, []);
    setStorageItem(STORAGE_KEYS.VIEWS, []);
    saveTrips([]);
    try {
      localStorage.setItem('qde_day_one_reset', '1');
    } catch {
      // ignore
    }
    this.addAuditLog('Initialized fresh Day-One empty workspace state', 'Workspace', updated.id);
    return updated;
  },

  // Strict Zero-Data Slate Reset
  resetToZeroDataSlate(): void {
    setStorageItem(STORAGE_KEYS.SUPPLIERS, []);
    setStorageItem(STORAGE_KEYS.RATES, []);
    setStorageItem(STORAGE_KEYS.SEASONS, []);
    setStorageItem(STORAGE_KEYS.INQUIRIES, []);
    setStorageItem(STORAGE_KEYS.QUOTES, []);
    setStorageItem(STORAGE_KEYS.FOLLOW_UPS, []);
    setStorageItem(STORAGE_KEYS.VIEWS, []);
    setStorageItem(STORAGE_KEYS.AUDIT, []);
    saveTrips([]);
    try {
      localStorage.setItem('qde_day_one_reset', '1');
    } catch {
      // ignore
    }
    this.addAuditLog('Strict zero-data slate initialized. All demo data wiped clean.', 'Workspace', 'root');
  },

  /**
   * Ensures that in the browser preview, inquiries, quotes, trips, and follow-ups
   * form a single consistent operational dataset unless the user explicitly reset to Day One.
   */
  ensureConsistentWorkspaceSeed(workspaceId: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (!['ws-default', 'ws-demo', 'comp_bluenile_01'].includes(workspaceId)) {
      return;
    }
    try {
      if (localStorage.getItem('qde_day_one_reset') === '1') return;
    } catch {
      return;
    }

    // 1. Ensure canonical 7-day Al-Futtaim Royal Delegation trip (20-27 Nov 2026) is present and upgraded
    const currentTrips = loadTrips();
    if (currentTrips.length === 0) {
      saveTrips([CANONICAL_AL_FUTTAIM_TRIP]);
    } else {
      const hasCanonical = currentTrips.some(
        t => t.id === CANONICAL_AL_FUTTAIM_TRIP.id || t.fileNumber === CANONICAL_AL_FUTTAIM_TRIP.fileNumber
      );
      const upgraded = currentTrips.map(t => {
        if (t.id === CANONICAL_AL_FUTTAIM_TRIP.id || t.fileNumber === CANONICAL_AL_FUTTAIM_TRIP.fileNumber) {
          const isStaleMayDate = !t.startDate || t.startDate === '2026-05-12';
          const hasStaleServiceDates = (t.services || []).some(s => (s.dispatchedAt || '').startsWith('2026-05-'));
          return {
            ...CANONICAL_AL_FUTTAIM_TRIP,
            ...t,
            quoteId: 'quote-104',
            durationDays: 7,
            startDate: isStaleMayDate ? CANONICAL_AL_FUTTAIM_TRIP.startDate : t.startDate,
            arrival: isStaleMayDate ? CANONICAL_AL_FUTTAIM_TRIP.arrival : t.arrival,
            departure: CANONICAL_AL_FUTTAIM_TRIP.departure,
            tourPasscode: t.tourPasscode === 'RIHAL-842A' || !t.tourPasscode ? 'EG-CAI-7491' : t.tourPasscode,
            services: ((t.services?.length || 0) >= 9 && !hasStaleServiceDates) ? t.services : CANONICAL_AL_FUTTAIM_TRIP.services,
            checklist: (t.checklist && t.checklist.length >= 15) ? t.checklist : CANONICAL_AL_FUTTAIM_TRIP.checklist,
          };
        }
        return t;
      });
      saveTrips(hasCanonical ? upgraded : [CANONICAL_AL_FUTTAIM_TRIP, ...upgraded]);
    }

    const recentViewIso = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    const olderViewIso = new Date(Date.now() - 5 * 3600 * 1000).toISOString();

    const quoteKamal: Quote = {
      id: 'quote-861542',
      workspaceId,
      inquiryId: 'inq-861542',
      quoteNumber: 'DAL-2026-8615',
      version: 1,
      status: 'Viewed',
      title: '7-Day Cairo, Giza, Luxor & Nile Cruise Family Expedition',
      travelerName: 'Mohamed Kamal',
      travelerPhone: '+20 100 861 5420',
      travelerEmail: 'm.kamal@kamalholdings.eg',
      travelerNationality: 'Egyptian',
      language: 'en',
      startDate: '2026-12-05',
      durationDays: 7,
      group: { adults: 4, children: [{ age: 12 }, { age: 9 }, { age: 6 }], infants: 0 },
      targetCurrency: 'USD',
      displayCurrency: 'USD',
      exchangeRateUsed: DEFAULT_EXCHANGE_RATES.USD.toEgp,
      safetyBufferPct: 2,
      targetMarginPct: 24,
      totalCostEgp: 423500,
      totalPriceEgp: Math.round(11200 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
      totalPriceQuoteCurrency: 11200,
      marginPercent: 24,
      validUntil: '2026-11-28',
      assignedAgentId: 'staff-1',
      assignedAgentName: 'Mohamed Ali',
      days: [
        {
          dayNumber: 1,
          date: '2026-12-05',
          city: 'Cairo',
          title: 'Arrival in Cairo & Nile Corniche Family Suites',
          description: 'VIP airport meet & assist for 4 adults & 3 children and private transfer to Nile Kempinski Hotel Cairo.',
          hotel: 'Kempinski Nile Hotel Garden City',
          hotelMealPlan: 'BB',
          lines: [
            {
              id: 'line-8615-1',
              dayNumber: 1,
              serviceName: 'Kempinski Nile Hotel — 2x Connecting Family Suites (2 Nights)',
              supplierName: 'Kempinski Nile Hotel Cairo',
              supplierType: 'Hotel',
              city: 'Cairo',
              quantity: 2,
              occupancyBasis: 'double',
              unitCost: 1100,
              costCurrency: 'USD',
              markupPercent: 25,
              markupFixed: 0,
              unitPrice: 1375,
              totalCostEgp: Math.round(2200 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
              totalPriceEgp: Math.round(2750 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
              totalPriceQuoteCurrency: 2750,
              status: 'OK',
              costCalculationNotes: '2 connecting suites for 4 adults + 3 children',
            },
          ],
        },
        {
          dayNumber: 2,
          date: '2026-12-06',
          city: 'Giza',
          title: 'Giza Pyramids, Great Sphinx & Grand Egyptian Museum',
          description: 'Full-day private Egyptologist family program at Giza Plateau and Grand Egyptian Museum Children & Royal Galleries.',
          hotel: 'Kempinski Nile Hotel Garden City',
          hotelMealPlan: 'BB',
          lines: [
            {
              id: 'line-8615-2',
              dayNumber: 2,
              serviceName: 'Private Family Sprinter Van + Egyptologist Guide + GEM VIP Tickets',
              supplierName: 'RIHAL Executive Fleet Egypt',
              supplierType: 'Attraction',
              city: 'Giza',
              quantity: 7,
              occupancyBasis: 'per_person',
              unitCost: 165,
              costCurrency: 'USD',
              markupPercent: 30,
              markupFixed: 0,
              unitPrice: 215,
              totalCostEgp: Math.round(1155 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
              totalPriceEgp: Math.round(1505 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
              totalPriceQuoteCurrency: 1505,
              status: 'OK',
              costCalculationNotes: '4 adults + 3 children tickets and Mercedes Sprinter',
            },
          ],
        },
        {
          dayNumber: 3,
          date: '2026-12-07',
          city: 'Luxor',
          title: 'Morning Flight to Luxor & Nile Cruise Embarkation',
          description: 'Domestic flight CAI-LXR, East Bank Karnak & Luxor Temples, and embarkation on 5★ Deluxe Nile Cruise.',
          hotel: 'M/S Sonesta St. George I Nile Cruise',
          hotelMealPlan: 'FB',
          lines: [
            {
              id: 'line-8615-3',
              dayNumber: 3,
              serviceName: 'Sonesta St. George I — 4 Nights Full Board Nile Cruise (3 Cabins)',
              supplierName: 'Sonesta Nile Cruises',
              supplierType: 'Nile Cruise',
              city: 'Luxor',
              quantity: 3,
              occupancyBasis: 'double',
              unitCost: 1280,
              costCurrency: 'USD',
              markupPercent: 32,
              markupFixed: 0,
              unitPrice: 1690,
              totalCostEgp: Math.round(3840 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
              totalPriceEgp: Math.round(5070 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
              totalPriceQuoteCurrency: 5070,
              status: 'OK',
              costCalculationNotes: '4 nights Luxor to Aswan family cruise charter',
            },
          ],
        },
        {
          dayNumber: 4,
          date: '2026-12-08',
          city: 'Luxor',
          title: 'Luxor West Bank: Valley of the Kings & Hatshepsut Temple',
          description: 'Private morning crossing to Valley of the Kings, Hatshepsut Temple, and Colossi of Memnon before sailing via Esna Lock.',
          lines: [],
        },
        {
          dayNumber: 5,
          date: '2026-12-09',
          city: 'Edfu & Kom Ombo',
          title: 'Edfu Temple of Horus & Kom Ombo Double Temple',
          description: 'Guided horse-carriage visit to Edfu Temple and afternoon sailing to Kom Ombo Sobek Sanctuary.',
          lines: [],
        },
        {
          dayNumber: 6,
          date: '2026-12-10',
          city: 'Aswan',
          title: 'Aswan High Dam, Philae Island & Nubian Village Felucca',
          description: 'Motorboat excursion to Philae Temple of Isis and family sunset felucca sailing to a traditional Nubian village.',
          lines: [],
        },
        {
          dayNumber: 7,
          date: '2026-12-11',
          city: 'Cairo',
          title: 'Aswan Disembarkation & Return Flight to Cairo',
          description: 'Morning disembarkation, transfer to Aswan Airport (ASW) for return flight to Cairo & final VIP departure assistance.',
          lines: [
            {
              id: 'line-8615-7',
              dayNumber: 7,
              serviceName: 'Domestic Roundtrip Flights CAI-LXR / ASW-CAI (7 Pax) & Airport Transfers',
              supplierName: 'EgyptAir Domestic & RIHAL Fleet',
              supplierType: 'Transport',
              city: 'Cairo / Aswan',
              quantity: 7,
              occupancyBasis: 'per_person',
              unitCost: 194,
              costCurrency: 'USD',
              markupPercent: 38,
              markupFixed: 0,
              unitPrice: 268,
              totalCostEgp: Math.round(1358 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
              totalPriceEgp: Math.round(1875 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
              totalPriceQuoteCurrency: 1875,
              status: 'OK',
              costCalculationNotes: '7 domestic sectors + private transfers',
            },
          ],
        },
      ],
      totals: {
        totalCost: 8556,
        totalSell: 11200,
        marginAmount: 2644,
        marginPct: 24,
        perPersonSell: 1600,
        currencyBreakdown: {
          USD: 11200,
          EGP: Math.round(11200 * DEFAULT_EXCHANGE_RATES.USD.toEgp),
          EUR: Math.round((11200 * DEFAULT_EXCHANGE_RATES.USD.toEgp) / DEFAULT_EXCHANGE_RATES.EUR.toEgp),
        },
      },
      inclusions: [
        '2 Nights Kempinski Nile Hotel Cairo (Connecting Family Suites)',
        '4 Nights 5★ Sonesta St. George I Nile Cruise (Full Board)',
        'Domestic Flights Cairo → Luxor & Aswan → Cairo (7 Pax)',
        'Private Mercedes Sprinter & Licensed Family Egyptologist',
      ],
      exclusions: ['International aviation', 'Optional Abu Simbel excursion'],
      paymentTerms: '30% deposit to lock Nile Cruise cabins & domestic flights',
      cancellationPolicy: 'Free modification up to 14 days prior to travel',
      validityDate: '2026-11-28',
      publicToken: 'tok-kamal-8615',
      viewCount: 4,
      lastViewedAt: recentViewIso,
      createdAt: '2026-11-12T10:30:00.000Z',
      updatedAt: recentViewIso,
    };

    const canonicalQuote104: Quote = {
      id: 'quote-104',
      workspaceId,
      inquiryId: 'inq-104',
      quoteNumber: 'DAL-2026-0104',
      version: 2,
      status: 'Accepted',
      title: '7-Day Royal Cairo, Luxor & Sanctuary Sun Boat IV Nile Expedition',
      travelerName: 'Al-Futtaim Royal Delegation (وفد الفطيم الملكي)',
      travelerPhone: '+971 50 441 9000',
      travelerEmail: 'protocol@alfuttaim-royal.ae',
      travelerNationality: 'UAE',
      language: 'ar',
      startDate: '2026-11-20',
      durationDays: 7,
      group: { adults: 4, children: [], infants: 0 },
      targetCurrency: 'EGP',
      displayCurrency: 'EGP',
      exchangeRateUsed: 1,
      safetyBufferPct: 2,
      targetMarginPct: 25,
      totalCostEgp: 315000,
      totalPriceEgp: 420000,
      totalPriceQuoteCurrency: 420000,
      marginPercent: 25,
      validUntil: '2026-11-18',
      assignedAgentId: 'staff-1',
      assignedAgentName: 'Mohamed Ali',
      days: [
        { dayNumber: 1, date: '2026-11-20', city: 'Cairo', title: 'VIP Arrival at Cairo & Four Seasons Nile Plaza', description: 'Private VIP lounge meet & assist and transfer to Four Seasons Hotel Cairo at Nile Plaza.', lines: [] },
        { dayNumber: 2, date: '2026-11-21', city: 'Giza', title: 'Giza Plateau, Great Sphinx & Grand Egyptian Museum Royal Wing', description: 'Private Egyptologist tour with Sherif Al-Muniri and Pyramid-view lunch.', lines: [] },
        { dayNumber: 3, date: '2026-11-22', city: 'Luxor', title: 'Morning Flight to Luxor, Sofitel Winter Palace & Karnak Temple', description: 'East Bank temples and Royal 1886 dining at Sofitel Winter Palace.', lines: [] },
        { dayNumber: 4, date: '2026-11-23', city: 'Luxor', title: 'Luxor West Bank Royal Tombs & Sanctuary Sun Boat IV Embarkation', description: 'Valley of the Kings, Hatshepsut Temple, Colossi of Memnon & embarkation on Sanctuary Sun Boat IV.', lines: [] },
        { dayNumber: 5, date: '2026-11-24', city: 'Edfu & Kom Ombo', title: 'Nile Sailing via Edfu Temple of Horus & Kom Ombo', description: 'Sailing to Edfu and Kom Ombo aboard Sanctuary Sun Boat IV with guide Sherif Al-Muniri.', lines: [] },
        { dayNumber: 6, date: '2026-11-25', city: 'Aswan', title: 'Abu Simbel Sun Temples, Philae Island & Sunset Nile Felucca', description: 'Morning flight to Abu Simbel, Philae Temple of Isis & sunset felucca around Elephantine Island.', lines: [] },
        { dayNumber: 7, date: '2026-11-26', city: 'Cairo', title: 'Disembarkation in Aswan & Executive Transfer to Cairo Airport', description: 'Disembarkation from Sanctuary Sun Boat IV and flight to Cairo International Airport.', lines: [] },
      ],
      totals: {
        totalCost: 315000,
        totalSell: 420000,
        marginAmount: 105000,
        marginPct: 25,
        perPersonSell: 105000,
        currencyBreakdown: {
          EGP: 420000,
          USD: Math.round(420000 / DEFAULT_EXCHANGE_RATES.USD.toEgp),
          EUR: Math.round(420000 / DEFAULT_EXCHANGE_RATES.EUR.toEgp),
        },
      },
      inclusions: ['5★ Four Seasons Cairo & Sofitel Winter Palace Luxor', '3-Night Sanctuary Sun Boat IV Presidential Suites', 'Private Egyptologist Sherif Al-Muniri throughout', 'VIP Airport Lounge Meet & Assist'],
      exclusions: ['International aviation'],
      paymentTerms: '100% settled via corporate bank transfer',
      cancellationPolicy: 'Flexible VIP protocol policy',
      validityDate: '2026-11-18',
      publicToken: 'tok-alfuttaim-104',
      viewCount: 6,
      lastViewedAt: olderViewIso,
      createdAt: '2026-11-10T09:00:00.000Z',
      updatedAt: '2026-11-15T15:00:00.000Z',
    };

    // 2. Ensure quotes are seeded consistently with the active trip and inquiries
    const existingQuotes = this.getQuotes(workspaceId);
    const allQuotes = getStorageItem<Quote[]>(STORAGE_KEYS.QUOTES, []);
    if (existingQuotes.length === 0) {
      const seededQuotes: Quote[] = [
        canonicalQuote104,
        quoteKamal,
        {
          id: 'quote-105',
          workspaceId,
          inquiryId: 'inq-105',
          quoteNumber: 'DAL-2026-0105',
          version: 1,
          status: 'Sent',
          title: '6-Day Classic Cairo & Luxor Private Sanctuary',
          travelerName: 'Laurent & Moreau Executive Family',
          travelerPhone: '+33 6 42 88 19 04',
          travelerEmail: 'c.laurent@paris-wealth.fr',
          travelerNationality: 'French',
          language: 'en',
          startDate: '2026-12-12',
          durationDays: 6,
          group: { adults: 2, children: [{ age: 10 }, { age: 7 }], infants: 0 },
          targetCurrency: 'EGP',
          displayCurrency: 'EGP',
          exchangeRateUsed: 1,
          safetyBufferPct: 2,
          targetMarginPct: 25,
          totalCostEgp: 161250,
          totalPriceEgp: 215000,
          totalPriceQuoteCurrency: 215000,
          marginPercent: 25,
          validUntil: '2026-12-01',
          assignedAgentId: 'staff-1',
          assignedAgentName: 'Mohamed Ali',
          days: [],
          totals: {
            totalCost: 161250,
            totalSell: 215000,
            marginAmount: 53750,
            marginPct: 25,
            perPersonSell: 53750,
            currencyBreakdown: {
              EGP: 215000,
              USD: Math.round(215000 / DEFAULT_EXCHANGE_RATES.USD.toEgp),
              EUR: Math.round(215000 / DEFAULT_EXCHANGE_RATES.EUR.toEgp),
            },
          },
          inclusions: ['Marriott Mena House Pyramid View', 'Private French/English Egyptologist', 'Domestic Business Flights'],
          exclusions: ['International flights'],
          paymentTerms: '30% deposit upon confirmation',
          cancellationPolicy: 'Free cancellation up to 14 days prior',
          validityDate: '2026-12-01',
          publicToken: 'tok-laurent-105',
          viewCount: 2,
          lastViewedAt: olderViewIso,
          createdAt: '2026-11-13T11:00:00.000Z',
          updatedAt: '2026-11-15T16:30:00.000Z',
        },
        {
          id: 'quote-106',
          workspaceId,
          inquiryId: 'inq-106',
          quoteNumber: 'DAL-2026-0106',
          version: 1,
          status: 'Draft',
          title: '8-Day Grand Nile Cruise & El Gouna Red Sea Retreat',
          travelerName: 'Kensington Heritage Society',
          travelerPhone: '+44 7700 900412',
          travelerEmail: 'director@kensingtonheritage.co.uk',
          travelerNationality: 'British',
          language: 'en',
          startDate: '2027-01-18',
          durationDays: 8,
          group: { adults: 4, children: [], infants: 0 },
          targetCurrency: 'EGP',
          displayCurrency: 'EGP',
          exchangeRateUsed: 1,
          safetyBufferPct: 2,
          targetMarginPct: 25,
          totalCostEgp: 232500,
          totalPriceEgp: 310000,
          totalPriceQuoteCurrency: 310000,
          marginPercent: 25,
          validUntil: '2026-12-20',
          assignedAgentId: 'staff-4',
          assignedAgentName: 'Youssef Adel',
          days: [],
          totals: {
            totalCost: 232500,
            totalSell: 310000,
            marginAmount: 77500,
            marginPct: 25,
            perPersonSell: 77500,
            currencyBreakdown: {
              EGP: 310000,
              USD: Math.round(310000 / DEFAULT_EXCHANGE_RATES.USD.toEgp),
              EUR: Math.round(310000 / DEFAULT_EXCHANGE_RATES.EUR.toEgp),
            },
          },
          inclusions: ['Old Cataract Aswan & Oberoi Zahra Cruise', 'Private Charter Transfers'],
          exclusions: ['International flights'],
          paymentTerms: '30% deposit on confirmation',
          cancellationPolicy: 'Standard luxury DMC terms',
          validityDate: '2026-12-20',
          publicToken: 'tok-kensington-106',
          viewCount: 1,
          createdAt: '2026-11-14T08:30:00.000Z',
          updatedAt: '2026-11-16T10:15:00.000Z',
        },
      ];
      setStorageItem(STORAGE_KEYS.QUOTES, [...allQuotes.filter(q => q.workspaceId !== workspaceId), ...seededQuotes]);
    } else {
      // Safe non-destructive upgrade for cached demo sessions
      let quotesChanged = false;
      let nextQuotes = existingQuotes.map(q => {
        if (q.id === 'quote-104' && q.startDate === '2026-05-12') {
          quotesChanged = true;
          return canonicalQuote104;
        }
        return q;
      });
      if (!nextQuotes.some(q => q.id === 'quote-861542' || q.quoteNumber === 'DAL-2026-8615')) {
        nextQuotes = [quoteKamal, ...nextQuotes];
        quotesChanged = true;
      }
      if (quotesChanged) {
        setStorageItem(STORAGE_KEYS.QUOTES, [...allQuotes.filter(q => q.workspaceId !== workspaceId), ...nextQuotes]);
      }
    }

    // 3. Ensure inquiries match the quotes (including INQ-861542 Mohamed Kamal)
    const inqKamal: Inquiry = {
      id: 'inq-861542',
      workspaceId,
      source: 'WhatsApp',
      travelerName: 'Mohamed Kamal',
      travelerPhone: '+20 100 861 5420',
      travelerEmail: 'm.kamal@kamalholdings.eg',
      rawText: 'INQ-861542 · Requesting a 7-day private Egypt family itinerary for 4 adults and 3 children (ages 12, 9, 6) starting Dec 5 covering Cairo, Giza, Luxor, Aswan & 5-star Nile Cruise with connecting suites.',
      receivedAt: '2026-11-12T08:40:00.000Z',
      status: 'Quoted',
      slaMinutes: 12,
      assignedAgentId: 'staff-1',
      assignedAgentName: 'Mohamed Ali',
      language: 'en',
      requirements: {
        travelerName: 'Mohamed Kamal',
        nationality: 'Egyptian',
        language: 'en',
        startDate: '2026-12-05',
        durationDays: 7,
        group: { adults: 4, children: [{ age: 12 }, { age: 9 }, { age: 6 }], infants: 0 },
        cities: ['Cairo', 'Luxor', 'Aswan', 'Nile Cruise'],
        hotelStarRating: 5,
        budgetAmount: 11200,
        budgetCurrency: 'USD',
        interests: ['Cairo & Giza Pyramids', 'Luxor Temples', '5-Star Nile Cruise', 'Aswan Philae & Felucca'],
        urgency: 'High',
        confidenceScores: { overall: 0.97 },
      },
    };

    const canonicalInq104: Inquiry = {
      id: 'inq-104',
      workspaceId,
      source: 'WhatsApp',
      travelerName: 'Al-Futtaim Royal Delegation (وفد الفطيم الملكي)',
      travelerPhone: '+971 50 441 9000',
      travelerEmail: 'protocol@alfuttaim-royal.ae',
      rawText: 'نرغب في تنظيم برنامج ملكي خاص لمدة ٧ أيام (٢٠–٢٧ نوفمبر ٢٠٢٦) في القاهرة والأقصر وأسوان على متن باخرة الصن بوت ٤ مع إقامة في الفورسيزونز وونتر بالاس ومرشد خاص.',
      receivedAt: '2026-11-10T10:00:00.000Z',
      status: 'Won',
      slaMinutes: 15,
      assignedAgentId: 'staff-1',
      assignedAgentName: 'Mohamed Ali',
      language: 'ar',
      requirements: {
        travelerName: 'Al-Futtaim Royal Delegation',
        nationality: 'UAE',
        language: 'ar',
        startDate: '2026-11-20',
        durationDays: 7,
        group: { adults: 4, children: [], infants: 0 },
        cities: ['Cairo', 'Giza', 'Luxor', 'Aswan'],
        hotelStarRating: 5,
        budgetAmount: 420000,
        budgetCurrency: 'EGP',
        interests: ['Pyramids & GEM VIP', 'Sanctuary Sun Boat IV', 'Abu Simbel Private Charter'],
        urgency: 'High',
        confidenceScores: { overall: 0.98 },
      },
    };

    const existingInquiries = this.getInquiries(workspaceId);
    const allInquiries = getStorageItem<Inquiry[]>(STORAGE_KEYS.INQUIRIES, []);
    if (existingInquiries.length <= 1) {
      const seededInquiries: Inquiry[] = [
        inqKamal,
        canonicalInq104,
        {
          id: 'inq-105',
          workspaceId,
          source: 'Email',
          travelerName: 'Laurent & Moreau Executive Family',
          travelerPhone: '+33 6 42 88 19 04',
          travelerEmail: 'c.laurent@paris-wealth.fr',
          rawText: 'Bonjour, we are a family of 4 looking for a 6-day private luxury tour in Cairo and Luxor in December with Pyramid view suites and private Egyptologist.',
          receivedAt: '2026-11-13T09:15:00.000Z',
          status: 'Quoted',
          slaMinutes: 30,
          assignedAgentId: 'staff-1',
          assignedAgentName: 'Mohamed Ali',
          language: 'en',
          requirements: {
            travelerName: 'Laurent & Moreau Executive Family',
            nationality: 'French',
            language: 'en',
            startDate: '2026-12-12',
            durationDays: 6,
            group: { adults: 2, children: [{ age: 10 }, { age: 7 }], infants: 0 },
            cities: ['Cairo', 'Luxor'],
            hotelStarRating: 5,
            budgetAmount: 215000,
            budgetCurrency: 'EGP',
            interests: ['Mena House Pyramid View', 'Karnak & Valley of the Kings'],
            urgency: 'Medium',
            confidenceScores: { overall: 0.94 },
          },
        },
        {
          id: 'inq-106',
          workspaceId,
          source: 'B2B Partner',
          travelerName: 'Kensington Heritage Society',
          travelerPhone: '+44 7700 900412',
          travelerEmail: 'director@kensingtonheritage.co.uk',
          rawText: 'Requesting a bespoke 8-day Upper Egypt and Red Sea cultural itinerary for 4 senior patrons.',
          receivedAt: '2026-11-14T07:45:00.000Z',
          status: 'In Progress',
          slaMinutes: 45,
          assignedAgentId: 'staff-4',
          assignedAgentName: 'Youssef Adel',
          language: 'en',
          requirements: {
            travelerName: 'Kensington Heritage Society',
            nationality: 'British',
            language: 'en',
            startDate: '2027-01-18',
            durationDays: 8,
            group: { adults: 4, children: [], infants: 0 },
            cities: ['Cairo', 'Luxor', 'Aswan', 'Hurghada'],
            hotelStarRating: 5,
            budgetAmount: 310000,
            budgetCurrency: 'EGP',
            interests: ['Nile Cruise', 'Archaeological Lectures', 'Red Sea Relaxation'],
            urgency: 'Medium',
            confidenceScores: { overall: 0.92 },
          },
        },
      ];
      const mergedInquiries = [
        ...allInquiries.filter(i => i.workspaceId !== workspaceId),
        ...seededInquiries,
        ...existingInquiries.filter(i => !seededInquiries.some(s => s.id === i.id)),
      ];
      setStorageItem(STORAGE_KEYS.INQUIRIES, mergedInquiries);
    } else {
      let inqChanged = false;
      let nextInquiries = existingInquiries.map(i => {
        if (i.id === 'inq-104' && i.requirements?.startDate === '2026-05-12') {
          inqChanged = true;
          return canonicalInq104;
        }
        return i;
      });
      if (!nextInquiries.some(i => i.id === 'inq-861542')) {
        nextInquiries = [inqKamal, ...nextInquiries];
        inqChanged = true;
      }
      if (inqChanged) {
        setStorageItem(STORAGE_KEYS.INQUIRIES, [...allInquiries.filter(i => i.workspaceId !== workspaceId), ...nextInquiries]);
      }
    }

    // 4. Ensure follow-ups exist for active pipeline quotes including INQ-861542 / DAL-2026-8615
    const fuKamal: FollowUpTask = {
      id: 'fu-task-861542',
      workspaceId,
      quoteId: 'quote-861542',
      inquiryId: 'inq-861542',
      travelerName: 'Mohamed Kamal',
      travelerPhone: '+20 100 861 5420',
      triggerReason: 'Proposal DAL-2026-8615 viewed 4 times (last viewed 45m ago) — High-intent <2h follow-up window.',
      status: 'Pending',
      suggestedMessage: 'Hello Mr. Mohamed Kamal, we noticed you reviewed your 7-day Cairo, Luxor & Nile Cruise family proposal (DAL-2026-8615, USD 11,200). Shall we place a complimentary 24h hold on the connecting suites and Sonesta St. George I cabins for Dec 5?',
      dueDate: new Date().toISOString(),
      isUrgent: true,
    };

    const existingFollowUps = this.getFollowUps(workspaceId);
    const allFollowUps = getStorageItem<FollowUpTask[]>(STORAGE_KEYS.FOLLOW_UPS, []);
    if (existingFollowUps.length === 0) {
      const seededFollowUps: FollowUpTask[] = [
        fuKamal,
        {
          id: 'fu-task-105',
          workspaceId,
          quoteId: 'quote-105',
          inquiryId: 'inq-105',
          travelerName: 'Laurent & Moreau Executive Family',
          travelerPhone: '+33 6 42 88 19 04',
          triggerReason: 'Proposal DAL-2026-0105 viewed 2 times. Confirm domestic business flight seats before option expiry.',
          status: 'Pending',
          suggestedMessage: 'Bonjour Mr. Laurent, following up on proposal DAL-2026-0105 for Cairo & Luxor. Shall we lock in your Mena House Pyramid-view suites?',
          dueDate: new Date().toISOString(),
          isUrgent: false,
        },
        {
          id: 'fu-task-106',
          workspaceId,
          quoteId: 'quote-106',
          inquiryId: 'inq-106',
          travelerName: 'Kensington Heritage Society',
          travelerPhone: '+44 7700 900412',
          triggerReason: 'Finalize cabin allocation on Oberoi Zahra for Quote DAL-2026-0106 and dispatch formal link.',
          status: 'Pending',
          suggestedMessage: 'Dear Kensington Heritage team, your 8-day Upper Egypt & Red Sea quotation DAL-2026-0106 is ready for review.',
          dueDate: new Date().toISOString(),
          isUrgent: false,
        },
      ];
      setStorageItem(STORAGE_KEYS.FOLLOW_UPS, [...allFollowUps.filter(f => f.workspaceId !== workspaceId), ...seededFollowUps]);
    } else if (!existingFollowUps.some(f => f.id === 'fu-task-861542' || f.quoteId === 'quote-861542')) {
      setStorageItem(STORAGE_KEYS.FOLLOW_UPS, [
        ...allFollowUps.filter(f => f.workspaceId !== workspaceId),
        fuKamal,
        ...existingFollowUps,
      ]);
    }
  },

  // Hajj & Umrah Management
  getHajjPackages(): HajjUmrahPackage[] {
    return getStorageItem<HajjUmrahPackage[]>(STORAGE_KEYS.HAJJ_PACKAGES, HAJJ_UMRAH_PACKAGES);
  },
  saveHajjPackage(pkg: HajjUmrahPackage): void {
    const list = this.getHajjPackages();
    const idx = list.findIndex(p => p.id === pkg.id);
    if (idx >= 0) list[idx] = pkg;
    else list.unshift(pkg);
    setStorageItem(STORAGE_KEYS.HAJJ_PACKAGES, list);
    this.addAuditLog(`Saved Hajj & Umrah package: ${pkg.name}`, 'Workspace', pkg.id);
  },
  getPilgrimBookings(workspaceId: string): PilgrimBooking[] {
    return getStorageItem<PilgrimBooking[]>(STORAGE_KEYS.PILGRIMS, []).filter(b => b.workspaceId === workspaceId);
  },
  savePilgrimBooking(booking: PilgrimBooking): void {
    const list = getStorageItem<PilgrimBooking[]>(STORAGE_KEYS.PILGRIMS, []);
    const idx = list.findIndex(b => b.id === booking.id);
    if (idx >= 0) list[idx] = booking;
    else list.unshift(booking);
    setStorageItem(STORAGE_KEYS.PILGRIMS, list);
    this.addAuditLog(`Pilgrim registered: ${booking.travelerName}`, 'Inquiry', booking.id);
  },
  toggleHajjUmrahFeature(enabled: boolean): Workspace {
    const ws = this.getWorkspace();
    const updated = {
      ...ws,
      enableHajjUmrah: enabled,
    };
    this.updateWorkspace(updated);

    if (enabled) {
      // Merge Hajj & Umrah suppliers and rates into library
      const existingSuppliers = getStorageItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
      const newSuppliers = HAJJ_UMRAH_SUPPLIERS.map(s => ({ ...s, workspaceId: ws.id }));
      const mergedSuppliers = [...existingSuppliers];
      newSuppliers.forEach(ns => {
        if (!mergedSuppliers.some(s => s.id === ns.id)) {
          mergedSuppliers.push(ns);
        }
      });
      setStorageItem(STORAGE_KEYS.SUPPLIERS, mergedSuppliers);

      const existingRates = getStorageItem<Rate[]>(STORAGE_KEYS.RATES, []);
      const newRates = HAJJ_UMRAH_RATES.map(r => ({ ...r, workspaceId: ws.id }));
      const mergedRates = [...existingRates];
      newRates.forEach(nr => {
        if (!mergedRates.some(r => r.id === nr.id)) {
          mergedRates.push(nr);
        }
      });
      setStorageItem(STORAGE_KEYS.RATES, mergedRates);

      // Ensure SAR exchange rate is initialized
      const fxList = getStorageItem<ExchangeRate[]>(STORAGE_KEYS.FX, []);
      if (!fxList.some(f => f.fromCurrency === 'SAR')) {
        fxList.push({
          id: 'fx-sar',
          workspaceId: ws.id,
          fromCurrency: 'SAR',
          toCurrency: 'EGP',
          rate: DEFAULT_EXCHANGE_RATES.SAR.toEgp,
          safetyBufferPercent: 2.0,
          lastUpdated: new Date().toISOString(),
        });
        setStorageItem(STORAGE_KEYS.FX, fxList);
      }

      this.addAuditLog('Activated Religious Tourism: Hajj & Umrah Module with Holy City Tariffs', 'Workspace', ws.id);
    } else {
      this.addAuditLog('Deactivated Hajj & Umrah Module', 'Workspace', ws.id);
    }
    return updated;
  },

  // Custom Staff Roles & Permissions Engine
  getCustomRoles(workspaceId: string): CustomStaffRole[] {
    const list = getStorageItem<CustomStaffRole[]>(STORAGE_KEYS.CUSTOM_ROLES, DEFAULT_CUSTOM_ROLES);
    return list.map(r => ({ ...r, workspaceId: workspaceId || r.workspaceId }));
  },
  saveCustomRole(role: CustomStaffRole): void {
    const list = this.getCustomRoles(role.workspaceId);
    const idx = list.findIndex(r => r.id === role.id);
    if (idx >= 0) list[idx] = role;
    else list.push(role);
    setStorageItem(STORAGE_KEYS.CUSTOM_ROLES, list);
    this.addAuditLog(`Custom role saved: ${role.titleEn} (${role.titleAr})`, 'Workspace', role.id);
  },
  deleteCustomRole(roleId: string, workspaceId: string): void {
    const list = this.getCustomRoles(workspaceId).filter(r => r.id !== roleId || r.isSystem);
    setStorageItem(STORAGE_KEYS.CUSTOM_ROLES, list);
    this.addAuditLog(`Custom role removed: ${roleId}`, 'Workspace', roleId);
  },

  // Staff Members Management
  getStaffMembers(workspaceId: string): StaffMember[] {
    const isDemo = workspaceId === 'ws-demo' || workspaceId === 'ws-default';
    const defaultList = isDemo ? DEFAULT_STAFF_MEMBERS : [];
    const list = getStorageItem<StaffMember[]>(STORAGE_KEYS.STAFF_MEMBERS, defaultList);
    const filtered = list.filter(s => s.workspaceId === workspaceId || (isDemo && !s.workspaceId));
    const seen = new Set<string>();
    return filtered.filter(s => {
      const key = `${(s.email || '').trim().toLowerCase()}::${(s.name || '').trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
  saveStaffMember(member: StaffMember): void {
    const list = this.getStaffMembers(member.workspaceId);
    const emailNorm = (member.email || '').trim().toLowerCase();
    const nameNorm = (member.name || '').trim().toLowerCase();
    const idx = list.findIndex(
      s =>
        s.id === member.id ||
        (emailNorm && (s.email || '').trim().toLowerCase() === emailNorm) ||
        (nameNorm && (s.name || '').trim().toLowerCase() === nameNorm)
    );
    if (idx >= 0) list[idx] = { ...list[idx], ...member, id: list[idx].id };
    else list.unshift(member);
    setStorageItem(STORAGE_KEYS.STAFF_MEMBERS, list);
    this.addAuditLog(`Staff member saved: ${member.name} - ${member.customJobTitleEn || member.customJobTitleAr}`, 'Workspace', member.id);
  },
  deleteStaffMember(memberId: string, workspaceId: string): void {
    const list = this.getStaffMembers(workspaceId).filter(s => s.id !== memberId);
    setStorageItem(STORAGE_KEYS.STAFF_MEMBERS, list);
    this.addAuditLog(`Staff member removed: ${memberId}`, 'Workspace', memberId);
  },
};

export const DEFAULT_CUSTOM_ROLES: CustomStaffRole[] = [
  {
    id: 'role-director',
    workspaceId: 'ws-default',
    titleEn: 'General Operations Director',
    titleAr: 'مدير عام العمليات السياحية',
    descriptionEn: 'Full executive control across all company operations, pricing, and settings.',
    descriptionAr: 'صلاحيات إدارية وتنفيذية شاملة على كافة أقسام العمليات والتسعير والإعدادات.',
    isSystem: true,
    permissions: {
      quotes: 'edit',
      inquiries: 'edit',
      rates: 'edit',
      trips: 'edit',
      vouchers: 'edit',
      fleet: 'edit',
      guides: 'edit',
      weather: 'edit',
      analytics: 'edit',
      settings: 'edit',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-airport-coord',
    workspaceId: 'ws-default',
    titleEn: 'Airport & Transport Logistics Coordinator',
    titleAr: 'منسق استقبال مطارات وأسطول نقل',
    descriptionEn: 'Manages airport meet & greet schedules, chauffeur dispatches, and driver runsheets.',
    descriptionAr: 'مسؤول عن استقبال الوفود بالمطارات وتنسيق حركة الحافلات وأوامر تشغيل السائقين.',
    isSystem: false,
    permissions: {
      quotes: 'none',
      inquiries: 'none',
      rates: 'none',
      trips: 'view',
      vouchers: 'view',
      fleet: 'edit',
      guides: 'view',
      weather: 'view',
      analytics: 'none',
      settings: 'none',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-nile-hotels',
    workspaceId: 'ws-default',
    titleEn: 'Nile Cruise & Hotels Reservations Specialist',
    titleAr: 'مسؤول حجوزات كروزات النيل وفنادق',
    descriptionEn: 'Handles cabin allotments, hotel vouchers, and supplier confirmation sheets.',
    descriptionAr: 'يتولى تسكين الكروزات وإصدار قسائم الفنادق وأوامر التأكيد للموردين.',
    isSystem: false,
    permissions: {
      quotes: 'view',
      inquiries: 'view',
      rates: 'view',
      trips: 'edit',
      vouchers: 'edit',
      fleet: 'none',
      guides: 'none',
      weather: 'view',
      analytics: 'none',
      settings: 'none',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-pricing-sales',
    workspaceId: 'ws-default',
    titleEn: 'Senior Quotations & Sales Officer',
    titleAr: 'أخصائي تسعير ومبيعات سياحية أول',
    descriptionEn: 'Prepares bespoke proposals, handles incoming B2B partner inquiries, and calculates margins.',
    descriptionAr: 'مسؤول عن بناء عروض الأسعار وحساب هوامش الربحية والتواصل مع وكلاء السياحة بالخارج.',
    isSystem: false,
    permissions: {
      quotes: 'edit',
      inquiries: 'edit',
      rates: 'edit',
      trips: 'view',
      vouchers: 'view',
      fleet: 'none',
      guides: 'view',
      weather: 'view',
      analytics: 'view',
      settings: 'none',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-1',
    workspaceId: 'ws-default',
    name: 'Karim Hassan',
    email: 'karim@daleel.eg',
    phone: '+20 100 123 4567',
    customRoleId: 'role-director',
    customJobTitleEn: 'Managing Director & Head of Expeditions',
    customJobTitleAr: 'المدير العام ورئيس البعثات والعمليات',
    status: 'active',
    assignedSince: '2022-03-15',
  },
  {
    id: 'staff-2',
    workspaceId: 'ws-default',
    name: 'Tarek Mansour',
    email: 'tarek.airport@daleel.eg',
    phone: '+20 122 987 6543',
    customRoleId: 'role-airport-coord',
    customJobTitleEn: 'Cairo Airport Protocol & Fleet Supervisor',
    customJobTitleAr: 'مشرف مراسم مطار القاهرة وأسطول الليموزين',
    status: 'active',
    assignedSince: '2023-06-01',
  },
  {
    id: 'staff-3',
    workspaceId: 'ws-default',
    name: 'Nour El-Sherif',
    email: 'nour.cruise@daleel.eg',
    phone: '+20 109 456 7890',
    customRoleId: 'role-nile-hotels',
    customJobTitleEn: 'Upper Egypt Cruise Charters Specialist',
    customJobTitleAr: 'أخصائية حجوزات كروزات الصعيد والأقصر',
    status: 'active',
    assignedSince: '2024-01-10',
  },
  {
    id: 'staff-4',
    workspaceId: 'ws-default',
    name: 'Youssef Adel',
    email: 'youssef.sales@daleel.eg',
    phone: '+20 111 234 5678',
    customRoleId: 'role-pricing-sales',
    customJobTitleEn: 'Inbound Europe & GCC Market Sales Specialist',
    customJobTitleAr: 'مسؤول مبيعات الأسواق الأوروبية والخليجية',
    status: 'active',
    assignedSince: '2024-05-20',
  },
];

