import React, { useState } from 'react';
import { 
  Building2, Lock, Mail, User as UserIcon, ArrowRight, 
  ArrowLeft, Compass, ShieldCheck, Sparkles, Key, 
  Briefcase, Globe, CheckCircle2, AlertCircle, ChevronRight,
  Eye, EyeOff, Loader2, Check, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, UILanguage } from '../../types';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../../services/authService';
import { setDemoModeActive } from '../../lib/demoConfig';
import { RihalLogo } from '../common/RihalLogo';

export interface AuthScreenProps {
  onSignIn: (
    email: string,
    userDetails?: {
      uid?: string;
      name?: string;
      role?: UserRole;
      photoUrl?: string;
      companyId?: string;
      companyName?: string;
      companyArabicName?: string;
      hasCompanyMembership?: boolean;
      memberships?: Array<{ companyId: string; companyName?: string; companyArabicName?: string; role: string; status?: string }>;
      isDemo?: boolean;
    }
  ) => void;
  onCreateAccount: (userData: {
    uid?: string;
    name: string;
    email: string;
    companyName: string;
    companyArabicName?: string;
    companyId?: string;
    hasCompanyMembership?: boolean;
    memberships?: Array<{ companyId: string; companyName?: string; companyArabicName?: string; role: string; status?: string }>;
    photoUrl?: string;
    role?: UserRole;
  }) => void;
  onEnterAsTraveler?: () => void;
  onSignInTraveler?: (email: string, name?: string) => void;
  onEnterGuestCode?: (code: string) => void;
  onBrowseCompanies?: () => void;
  onOpenAgencyShowcase?: (agencyId?: string) => void;
  initialLang?: UILanguage;
  onLangChange?: (lang: UILanguage) => void;
}

type MainTab = 'login' | 'register' | 'traveler';
type LoginRole = 'owner' | 'employee';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  onCreateAccount,
  onEnterAsTraveler,
  onSignInTraveler,
  onEnterGuestCode,
  onBrowseCompanies,
  initialLang = 'ar',
  onLangChange,
}) => {
  const [lang, setLang] = useState<UILanguage>(initialLang);
  const isAr = lang === 'ar';

  const handleToggleLang = (newLang: UILanguage) => {
    setLang(newLang);
    if (onLangChange) onLangChange(newLang);
  };

  // Active top-level Tab: 'login' | 'register' | 'traveler'
  const [activeTab, setActiveTab] = useState<MainTab>('login');
  const [loginRole, setLoginRole] = useState<LoginRole>('owner');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Traveler quick form
  const [travelerName, setTravelerName] = useState('');
  const [travelerEmail, setTravelerEmail] = useState('');

  // Booking Code state
  const [guestCode, setGuestCode] = useState('');

  // Loading & error feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Google Login / Sign-up Handler with resilient fallback
  const [blockedPopupUrl, setBlockedPopupUrl] = useState<string | null>(null);

  // Google Login / Sign-up Handler with authentic Google Account Chooser
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    setBlockedPopupUrl(null);
    setIsGoogleLoading(true);

    const chosenRole = activeTab === 'traveler' ? 'Traveler' : (loginRole === 'owner' ? 'Owner' : 'Operations');
    const chosenCompany = companyName.trim();

    try {
      const res = await loginWithGoogle(chosenRole, chosenCompany);
      setIsGoogleLoading(false);

      if (res.success && res.user) {
        if (activeTab === 'register') {
          setDemoModeActive(false);
          const comp = res.companyName || chosenCompany || (isAr ? `شركة ${res.user.displayName} للسياحة` : `${res.user.displayName} Travel & DMC`);
          onCreateAccount({
            uid: res.user.uid,
            name: res.user.displayName,
            email: res.user.email,
            companyName: comp,
            companyArabicName: res.companyArabicName,
            companyId: res.companyId,
            hasCompanyMembership: res.hasCompanyMembership ?? Boolean(res.companyId),
            memberships: res.memberships,
            photoUrl: res.user.photoURL,
            role: 'Owner',
          });
        } else if (activeTab === 'traveler') {
          setDemoModeActive(false);
          if (onSignInTraveler) {
            onSignInTraveler(res.user.email, res.user.displayName);
          } else {
            onSignIn(res.user.email, {
              uid: res.user.uid,
              name: res.user.displayName,
              role: 'Traveler',
              photoUrl: res.user.photoURL,
            });
          }
        } else {
          setDemoModeActive(Boolean(res.isDemo));
          onSignIn(res.user.email, {
            uid: res.user.uid,
            name: res.user.displayName,
            role: (res.user.role as UserRole) || (loginRole === 'owner' ? 'Owner' : 'Operations'),
            photoUrl: res.user.photoURL,
            companyId: res.companyId,
            companyName: res.companyName,
            companyArabicName: res.companyArabicName,
            hasCompanyMembership: res.hasCompanyMembership,
            memberships: res.memberships,
            isDemo: res.isDemo,
          });
        }
        return;
      }

      if (res.error === 'POPUP_BLOCKED' && res.popupUrl) {
        setBlockedPopupUrl(res.popupUrl);
        setErrorMessage(
          isAr
            ? 'قام المتصفح بحظر النافذة المنبثقة لاختيار حساب Google. اضغط على الزر أدناه لفتحها مباشرة.'
            : 'Your browser blocked the popup. Click the button below to open Google Account Chooser.'
        );
        return;
      }

      setErrorMessage(res.error || (isAr ? 'فشل تسجيل الدخول بحساب Google' : 'Failed to sign in with Google'));
    } catch (err: any) {
      setIsGoogleLoading(false);
      setErrorMessage(err?.message || (isAr ? 'حدث خطأ أثناء فتح Google' : 'Error connecting to Google'));
    }
  };

  // Email & Password Sign In Handler
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setErrorMessage(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide email and password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginWithEmail(cleanEmail, password);
      setIsLoading(false);

      if (res.success && res.user) {
        setDemoModeActive(false);
        onSignIn(res.user.email, {
          uid: res.user.uid,
          name: res.user.displayName,
          role: (res.user.role as UserRole) || (loginRole === 'owner' ? 'Owner' : 'Operations'),
          companyId: res.companyId,
          companyName: res.companyName,
          companyArabicName: res.companyArabicName,
          hasCompanyMembership: res.hasCompanyMembership,
          memberships: res.memberships,
          isDemo: false,
        });
        return;
      }

      // Display real security error: never fake a successful login on wrong credentials!
      setErrorMessage(res.error || (isAr ? 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد وكلمة المرور.' : 'Invalid email or password.'));
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || (isAr ? 'تعذر الاتصال بخادم المصادقة.' : 'Failed to connect to authentication server.'));
    }
  };

  // Email & Password Registration Handler
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();
    const cleanCompany = companyName.trim();

    if (!cleanEmail || !password.trim() || !cleanName || !cleanCompany) {
      setErrorMessage(isAr ? 'يرجى إكمال جميع الحقول الإلزامية' : 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setErrorMessage(isAr ? 'كلمة المرور يجب ألا تقل عن 6 خانات' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerWithEmail(cleanName, cleanEmail, password, cleanCompany);
      setIsLoading(false);

      if (res.success && res.user) {
        setDemoModeActive(false);
        onCreateAccount({
          uid: res.user.uid,
          name: res.user.displayName || cleanName,
          email: res.user.email || cleanEmail,
          companyName: res.companyName || cleanCompany,
          companyArabicName: res.companyArabicName,
          companyId: res.companyId,
          hasCompanyMembership: res.hasCompanyMembership ?? Boolean(res.companyId),
          memberships: res.memberships,
          role: 'Owner',
        });
        return;
      }

      setErrorMessage(res.error || (isAr ? 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.' : 'Registration failed. Please try again.'));
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || (isAr ? 'تعذر الاتصال بالخادم لإتمام التسجيل.' : 'Server connection failed during registration.'));
    }
  };

  // Traveler quick email submit
  const handleTravelerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = travelerEmail.trim() || 'traveler@dalil.eg';
    const cleanName = travelerName.trim() || (isAr ? 'مسافر زائر' : 'Guest Traveler');

    if (onSignInTraveler) {
      onSignInTraveler(cleanEmail, cleanName);
    } else {
      onSignIn(cleanEmail, { name: cleanName, role: 'Traveler' });
    }
  };

  // Handle Passcode verification
  const handleVerifyGuestCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = guestCode.trim().toUpperCase();
    if (clean && onEnterGuestCode) {
      onEnterGuestCode(clean);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between selection:bg-[#EDE0CC] selection:text-[#44200F]"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP HEADER & BILINGUAL LANGUAGE SWITCHER */}
      <header className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <RihalLogo variant="wordmark" size="md" isArabic={isAr} />
        </div>

        {/* Language Switcher Bar: AR / EN (Two letters only) */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-[#EDE0CC] shadow-2xs">
          <button
            type="button"
            onClick={() => handleToggleLang('ar')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
              isAr ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs' : 'text-[#795037] hover:text-[#44200F]'
            }`}
            title="العربية (AR)"
          >
            AR
          </button>
          <button
            type="button"
            onClick={() => handleToggleLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
              !isAr ? 'bg-[#44200F] text-[#FAF7F2] shadow-xs' : 'text-[#795037] hover:text-[#44200F]'
            }`}
            title="English (EN)"
          >
            EN
          </button>
        </div>
      </header>

      {/* 2. MAIN AUTH CONTAINER (Company & Operator Focus) */}
      <main className="max-w-md w-full mx-auto px-4 py-4 sm:py-6">
        
        {/* Top Navigation Tabs: Sign In vs Register Agency (Dedicated Company Portal) */}
        <div className="bg-[#EDE0CC]/60 p-1 rounded-2xl flex items-center gap-1 mb-4 shadow-inner border border-[#EDE0CC]">
          {/* Sign In Tab */}
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-[#44200F] shadow-xs border border-[#EDE0CC]'
                : 'text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#C4A177]" />
            <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>

          {/* Register New Agency Tab */}
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-[#44200F] shadow-xs border border-[#EDE0CC]'
                : 'text-[#795037] hover:text-[#44200F]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#C4A177]" />
            <span>{isAr ? 'تسجيل شركة جديدة' : 'Register Agency'}</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          
          {/* ==================== TAB 1: SIGN IN ==================== */}
          {activeTab === 'login' && (
            <motion.div
              key="tab-login"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-serif font-bold text-lg text-slate-900">
                    {isAr ? 'تسجيل الدخول إلى المنظومة' : 'Sign In to Your Workspace'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr ? 'سجل دخولك بواسطة Google أو البريد الإلكتروني' : 'Access your cockpit using Google or work email'}
                  </p>
                </div>
                <span className="text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md font-bold border border-amber-200/80">
                  {isAr ? 'بوابة الشركات' : 'DMC Gate'}
                </span>
              </div>

              {/* Owner / Staff Role Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLoginRole('owner')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    loginRole === 'owner' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? 'مالك شركة سياحة' : 'Agency Owner'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole('employee')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    loginRole === 'employee' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'فريق العمل / العمليات' : 'Operations Staff'}</span>
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. GOOGLE SIGN IN BUTTON */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 font-bold text-xs sm:text-sm text-slate-800 transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {isAr 
                    ? (isGoogleLoading ? 'جاري الاتصال بـ Google...' : 'المتابعة باستخدام Google') 
                    : (isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google')}
                </span>
              </button>

              {/* Blocked popup manual open link */}
              {blockedPopupUrl && (
                <a
                  href={blockedPopupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isAr ? 'اضغط هنا لفتح نافذة اختيار حساب Google' : 'Click here to open Google Account Chooser'}</span>
                </a>
              )}

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-slate-400 shrink-0 font-medium">
                  {isAr ? 'أو بالبريد الإلكتروني' : 'or continue with email'}
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* 2. EMAIL FORM */}
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'البريد الإلكتروني للعمل' : 'Work Email Address'} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={loginRole === 'owner' ? 'owner@agency.com' : 'operations@agency.com'}
                      className="w-full ps-10 pe-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {isAr ? 'كلمة المرور' : 'Password'} *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full ps-10 pe-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>{isAr ? 'تذكرني على هذا الجهاز' : 'Remember me'}</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full min-h-[44px] py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{isAr ? 'جاري التحقق من الحساب...' : 'Signing in...'}</span>
                    </span>
                  ) : (
                    <>
                      <span>{isAr ? 'تسجيل الدخول للمنظومة' : 'Sign In to Cockpit'}</span>
                      {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </form>

              {/* Bottom switch to register */}
              <div className="text-center pt-1">
                <p className="text-xs text-slate-600">
                  {isAr ? 'ليس لديك حساب شركة مسجلة؟' : "Don't have an agency account yet?"}{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
                    className="font-bold text-amber-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <span>{isAr ? 'سجل شركتك الآن (ابدأ مجاناً)' : 'Register Agency Now'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* ==================== TAB 2: REGISTER AGENCY ==================== */}
          {activeTab === 'register' && (
            <motion.div
              key="tab-register"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-serif font-bold text-lg text-slate-900">
                    {isAr ? 'تأسيس وتسجيل شركة سياحة جديدة' : 'Register New Tourism Agency'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr ? 'أنشئ حساب شركتك بواسطة Google أو البريد الرسمي' : 'Create company profile using Google or work email'}
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. GOOGLE SIGN UP BUTTON */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 font-bold text-xs sm:text-sm text-slate-800 transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>
                  {isAr 
                    ? (isGoogleLoading ? 'جاري الاتصال بـ Google...' : 'تسجيل الشركة بواسطة Google') 
                    : (isGoogleLoading ? 'Connecting to Google...' : 'Register Agency with Google')}
                </span>
              </button>

              {/* Blocked popup manual open link */}
              {blockedPopupUrl && (
                <a
                  href={blockedPopupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isAr ? 'اضغط هنا لفتح نافذة اختيار حساب Google' : 'Click here to open Google Account Chooser'}</span>
                </a>
              )}

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-slate-400 shrink-0 font-medium">
                  {isAr ? 'أو التسجيل بالبريد الرسمي' : 'or register with corporate email'}
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* 2. REGISTRATION FORM */}
              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'اسم شركة السياحة الرسمي' : 'Official Agency Legal Name'} *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder={isAr ? 'مثال: شركة أفق النيل للسياحة' : 'e.g. Nile Horizon Travel'}
                      className="w-full ps-10 pe-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'اسمك بالكامل (المالك / المدير العام)' : 'Your Name (Owner / Director)'} *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={isAr ? 'مثال: عباس حسن' : 'e.g. Abbas Hassan'}
                      className="w-full ps-10 pe-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'البريد الإلكتروني للعمل' : 'Work Email Address'} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="owner@agency.com"
                      className="w-full ps-10 pe-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {isAr ? 'كلمة المرور' : 'Password'} *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="•••••••• (6 أحرف فأكثر)"
                      className="w-full ps-10 pe-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full min-h-[44px] py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{isAr ? 'جاري تأسيس الشركة...' : 'Creating Agency...'}</span>
                    </span>
                  ) : (
                    <>
                      <span>{isAr ? 'تأسيس الشركة وبدء تهيئة لوحة التحكم' : 'Create Agency & Launch Cockpit'}</span>
                      {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </form>

              {/* Bottom switch to login */}
              <div className="text-center pt-1">
                <p className="text-xs text-slate-600">
                  {isAr ? 'لديك حساب شركة مسجل بالفعل؟' : 'Already have a registered account?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
                    className="font-bold text-amber-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* ==================== TAB 3: TRAVELER PORTAL ==================== */}
          {activeTab === 'traveler' && (
            <motion.div
              key="tab-traveler"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                    <Compass className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                      {isAr ? 'بوابة المسافر واستكشاف مصر' : 'Traveler & Egypt Explorer'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'تصفح الشركات المعتمدة وتواصل بدون اشتراكات' : 'Browse verified agencies & chat with zero subscription'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                  {isAr ? 'مجاناً للعرض' : '100% Free'}
                </span>
              </div>

              {/* 1. INSTANT 1-CLICK DIRECT ENTRY */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-amber-50/40 border border-emerald-200/80 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      {isAr ? 'تصفح فوري دون تسجيل أو كود' : 'Direct Instant Access'}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {isAr 
                        ? 'ادخل مباشرة وتصفح جميع شركات السياحة المرخصة فئة (أ)، شاهد تقييماتهم، وتواصل عبر واتساب مباشرة.' 
                        : 'Explore all accredited Class-A Egyptian tour operators, check reviews, and contact directly via WhatsApp.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onEnterAsTraveler) onEnterAsTraveler();
                    else if (onBrowseCompanies) onBrowseCompanies();
                    else onSignIn('guest.traveler@dalil.eg', { name: isAr ? 'مسافر زائر' : 'Guest Traveler', role: 'Traveler' });
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Compass className="w-4 h-4" />
                  <span>{isAr ? 'دخول وتصفح الشركات فوراً كمسافر' : 'Enter & Browse Directory Now'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-slate-400 shrink-0 font-medium">
                  {isAr ? 'أو أنشئ حساب مسافر لحفظ رحلاتك' : 'or create a free traveler account'}
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Google Sign in as Traveler */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 font-bold text-xs text-slate-800 transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isAr ? 'المتابعة كمسافر بحساب Google' : 'Continue with Google as Traveler'}</span>
              </button>

              {/* Simple Email Sign in for Traveler */}
              <form onSubmit={handleTravelerSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'اسم المسافر' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={travelerName}
                    onChange={e => setTravelerName(e.target.value)}
                    placeholder={isAr ? 'مثال: أحمد عبد الله' : 'e.g. John Miller'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={travelerEmail}
                    onChange={e => setTravelerEmail(e.target.value)}
                    placeholder="traveler@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'متابعة الدخول كمسافر' : 'Continue as Traveler'}</span>
                </button>
              </form>

              {/* Passcode Quick Input Inside */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-700">
                  <Key className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">
                      {isAr ? 'معك كود حجز أو رمز رحلة سابق؟' : 'Have a Tour or Booking Code?'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {isAr 
                        ? 'أدخل كودك لعرض خط سير رحلتك وقسائم الفنادق ومعلومات السائق مباشرة.' 
                        : 'Enter your code to unlock your live itinerary, vouchers, and driver info.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyGuestCode} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guestCode}
                    onChange={e => setGuestCode(e.target.value.toUpperCase())}
                    placeholder="EG-CAI-7491 / RIHAL-842A"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                  >
                    <span>{isAr ? 'فتح الرحلة' : 'Unlock'}</span>
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full max-w-5xl mx-auto px-4 py-4 text-center text-[11px] text-slate-500 border-t border-slate-200/80">
        <p>
          {isAr 
            ? 'منظومة ريحال (RIHAL) لشركات السياحة والرحلات الفاخرة © 2026 · منصة التشغيل المتكاملة لمنظمي الرحلات في مصر'
            : 'RIHAL Luxury Travel & DMC Operating System © 2026 · Built for Egypt Incoming Tour Operators'}
        </p>
      </footer>
    </div>
  );
};
