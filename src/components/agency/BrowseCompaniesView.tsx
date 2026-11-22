import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Star, ShieldCheck, MapPin, Globe, Phone, 
  MessageSquare, Users, Truck, Filter, Search, ArrowUpDown, 
  ChevronRight, ExternalLink, Send, Sparkles, Award, ArrowLeft, ArrowRight, X,
  Eye
} from 'lucide-react';
import { AgencyDirectoryItem, UILanguage, Workspace } from '../../types';
import { getAllDirectoryAgencies, syncDirectoryAgenciesFromServer } from '../../lib/agenciesData';
import { buildWhatsAppUrl } from '../../lib/phone';

interface BrowseCompaniesViewProps {
  uiLang: UILanguage;
  currentWorkspace?: Workspace;
  onSelectAgency?: (agency: AgencyDirectoryItem) => void;
  onOpenAgencyShowcase?: (agencyId?: string) => void;
  onBackToApp?: () => void;
  onRequestQuoteFromAgency?: (agency: AgencyDirectoryItem) => void;
}

export const BrowseCompaniesView: React.FC<BrowseCompaniesViewProps> = ({
  uiLang,
  onOpenAgencyShowcase,
  onBackToApp,
  onRequestQuoteFromAgency,
}) => {
  const isAr = uiLang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [agencies, setAgencies] = useState<AgencyDirectoryItem[]>(() => getAllDirectoryAgencies());

  useEffect(() => {
    setAgencies(getAllDirectoryAgencies());
    syncDirectoryAgenciesFromServer()
      .then(list => setAgencies(list))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return agencies.filter(agency => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = agency.name.toLowerCase().includes(q) || agency.arabicName.toLowerCase().includes(q);
        const matchCity = agency.governorates.some(g => g.toLowerCase().includes(q));
        if (!matchName && !matchCity) return false;
      }
      if (selectedGovernorate !== 'all') {
        if (!agency.governorates.some(g => g.toLowerCase().includes(selectedGovernorate.toLowerCase()))) {
          return false;
        }
      }
      return true;
    });
  }, [agencies, searchQuery, selectedGovernorate]);

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EDE0CC] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#44200F]">
              {isAr ? 'دليل شركات السياحة ومنظمي الرحلات' : 'Egypt Tourism Operators & DMC Directory'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#44200F] text-[#C4A177]">
              {filtered.length} {isAr ? 'شركة نشطة' : 'Active'}
            </span>
          </div>
          <p className="text-xs text-[#795037] mt-1">
            {isAr 
              ? 'تصفح قائمة شركات إدارة المقاصد السياحية ومنظمي الرحلات في مصر مع إمكانية استعراض البرامج والتواصل المباشر.'
              : 'Browse active Egyptian Destination Management Companies and tour operators with direct contacts.'}
          </p>
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] border border-[#EDE0CC] text-xs font-semibold rounded-xl transition shrink-0"
          >
            {isAr ? 'رجوع للوحة التحكم' : 'Back to Desk'}
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-[#EDE0CC] rounded-xl flex-1 focus-within:ring-2 focus-within:ring-[#C4A177] focus-within:border-[#C4A177] transition shadow-2xs">
          <Search className="w-4 h-4 text-[#795037] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث باسم الشركة أو المدينة...' : 'Search company or city...'}
            className="w-full bg-transparent border-0 p-0 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(agency => (
          <div 
            key={agency.id} 
            className="bg-white rounded-2xl border border-[#EDE0CC] shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md hover:border-[#C4A177] transition group cursor-pointer"
            onClick={() => onOpenAgencyShowcase?.(agency.id)}
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <img 
                  src={agency.logoUrl} 
                  alt={agency.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-[#EDE0CC] shrink-0 group-hover:scale-105 transition" 
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{agency.rating}</span>
                    <span className="text-slate-400 font-normal">({agency.reviewCount})</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#44200F] group-hover:text-[#795037] transition truncate">
                    {isAr ? (agency.arabicName || agency.name) : agency.name}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'تشغيل معتمد' : 'Active Operator'}</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {isAr ? agency.descriptionAr : agency.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {agency.governorates.slice(0, 3).map(g => (
                  <span key={g} className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#795037] text-[10px] font-medium border border-[#EDE0CC]">{g}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#EDE0CC]" onClick={e => e.stopPropagation()}>
              {/* Profile Details Button */}
              <button
                type="button"
                onClick={() => onOpenAgencyShowcase?.(agency.id)}
                className="w-full py-2 bg-[#FAF7F2] hover:bg-[#EDE0CC] text-[#44200F] border border-[#EDE0CC] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-[#795037]" />
                <span>{isAr ? 'عرض الملف التعريفي والرحلات' : 'View Verified Profile & Trips'}</span>
              </button>

              <div className="flex gap-2">
                <a
                  href={buildWhatsAppUrl(
                    agency.whatsappNumber || agency.contactPhone,
                    isAr ? 'مرحباً، أود الاستفسار عن برامجكم السياحية.' : 'Hello, inquiring about tour packages.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                </a>
                {onRequestQuoteFromAgency && (
                  <button
                    onClick={() => onRequestQuoteFromAgency(agency)}
                    className="flex-1 py-2 bg-[#44200F] hover:bg-[#321609] text-[#C4A177] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'طلب أسعار' : 'Inquire'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
