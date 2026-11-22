import { 
  Workspace, User, Supplier, Rate, Inquiry, Quote, FollowUpTask, AuditLog 
} from '../types';

export const DEFAULT_WORKSPACE: Workspace = {
 id: 'unconfigured', name: '', slug: '', brandColors: {primary:'#44200F',accent:'#795037',gold:'#C4A177'},
 defaultLanguage:'ar', defaultCurrency:'EGP', hideNetCostsFromAgents:true,
 minMarginPercent:0, requireApprovalBelowMinMargin:true, defaultProposalTheme:'modern',quoteValidityDays:7,
 contactEmail:'',contactPhone:'',whatsappNumber:'',paymentInstructionsText:'',
 subscriptionPlan:'Solo', monthlyQuoteLimit:0,aiCreditsLimit:0,aiCreditsUsed:0,
 enableHajjUmrah:true,isDataReadinessComplete:false,createdAt:''
};

export const DEMO_WORKSPACE = DEFAULT_WORKSPACE;

export const DEFAULT_USERS: User[] = [{id:'unauthenticated',workspaceId:'unconfigured',name:'',email:'',role:'Viewer',language:'ar',status:'active'}];
export const DEMO_USERS = DEFAULT_USERS;

// Clean Slate: strictly empty arrays for all business operational entities
export const DEMO_SUPPLIERS: Supplier[] = [];
export const DEMO_RATES: Rate[] = [];
export const DEMO_INQUIRIES: Inquiry[] = [];
export const DEMO_QUOTES: Quote[] = [];
export const DEMO_FOLLOW_UPS: FollowUpTask[] = [];
export const DEMO_AUDIT_LOGS: AuditLog[] = [];

export const RICH_EGYPT_SUPPLIERS: Supplier[] = [];
export const RICH_EGYPT_RATES: Rate[] = [];
export const RICH_EGYPT_QUOTES: Quote[] = [];
