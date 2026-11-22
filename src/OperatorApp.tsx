import React, { useState, useEffect } from 'react';
import { UserSessionProfile, canAccessOperatorRealm, VerifiedMembership } from './lib/authRealms';
import { verifyServerSession } from './services/authService';
import { ShieldAlert, ArrowLeft, ArrowRight, User as UserIcon } from 'lucide-react';
import App from './App';

export interface OperatorAppProps {
  sessionProfile?: UserSessionProfile | null;
  onSwitchToTravelerRealm?: () => void;
  onSignOut?: () => void;
}

/**
 * RIHAL — Operator App Realm Boundary
 * 
 * Enforces strict authorization barriers before allowing access to the
 * Tour Operator & DMC Cockpit. Unauthorized travelers are permanently blocked
 * from accessing operator tools, rates, and internal pipelines.
 */
export const OperatorApp: React.FC<OperatorAppProps> = ({
  sessionProfile: propSession,
  onSwitchToTravelerRealm,
}) => {
  const [session, setSession] = useState<UserSessionProfile | null>(propSession || null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(!propSession);

  useEffect(() => {
    if (propSession) {
      setSession(propSession);
      setCheckingAuth(false);
      return;
    }
    verifyServerSession().then((res) => {
      if (res.success && res.user) {
        setSession({
          userId: res.user.uid,
          email: res.user.email,
          name: res.user.displayName,
          role: res.user.role || 'Owner',
          hasCompanyMembership: Boolean(res.hasCompanyMembership),
          memberships: (res.memberships as VerifiedMembership[]) || [],
          activeCompanyId: res.companyId,
          activeCompanyName: res.companyName,
          activeCompanyArabicName: res.companyArabicName,
          companyId: res.companyId,
          companyName: res.companyName,
          companyArabicName: res.companyArabicName,
          isDemo: res.isDemo,
        });
      } else {
        setSession(null);
      }
      setCheckingAuth(false);
    }).catch(() => {
      setSession(null);
      setCheckingAuth(false);
    });
  }, [propSession]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#C4A177]/20 border-t-[#44200F] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#795037]">
            التحقق من تصريح عضوية غرفة العمليات...
          </p>
        </div>
      </div>
    );
  }

  // STRICT AUTHORIZATION GUARD:
  // If user does not have server-verified company membership, BLOCK access completely!
  if (!canAccessOperatorRealm(session)) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-6" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#44200F]">
              غير مصرح بالدخول لغرفة عمليات الشركات
            </h2>
            <p className="text-xs text-[#795037] leading-relaxed">
              هذا الحساب مسجل كمسافر ولا يملك اشتراكاً أو عضوية نشطة في شركة سياحة مسجلة. أدوات التسعير وغرفة العمليات مخصصة للشركات المعتمدة فقط.
            </p>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#EDE0CC] text-start text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#44200F]">
              <UserIcon className="w-3.5 h-3.5 text-[#C4A177]" />
              <span>{session?.name || 'مسافر زائر'}</span>
            </div>
            <div className="text-[11px] text-[#795037]">{session?.email}</div>
          </div>

          <button
            onClick={onSwitchToTravelerRealm || (() => { window.location.href = '/?mode=traveler'; })}
            className="w-full py-3 px-4 bg-[#44200F] hover:bg-[#321609] text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span>العودة لبوابة استكشاف المسافرين</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Render the authenticated operator workspace
  return <App />;
};

export default OperatorApp;
