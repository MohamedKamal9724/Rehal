import React, { useState } from 'react';
import { 
  Database, Building2, Calendar, ShieldCheck, 
  Plus, Search, Filter, Layers, DollarSign, ArrowUpRight
} from 'lucide-react';
import { Workspace, User, Supplier, Rate, Season, UILanguage } from '../types';
import { RateLibraryView } from './RateLibraryView';
import { SectionHelpTrigger } from './common/SectionHelpTrigger';

export interface LibraryWorkspaceViewProps {
  workspace: Workspace;
  currentUser: User;
  suppliers: Supplier[];
  rates: Rate[];
  seasons: Season[];
  uiLang: UILanguage;
  activeSubTab?: 'rates' | 'suppliers' | 'seasons' | 'fx';
  onNavigateSubTab?: (subTab: 'rates' | 'suppliers' | 'seasons' | 'fx') => void;
  onSaveRate: (rate: Rate) => void;
  onDeleteRate: (id: string) => void;
  onSaveSupplier: (supplier: Supplier) => void;
}

export const LibraryWorkspaceView: React.FC<LibraryWorkspaceViewProps> = ({
  workspace,
  currentUser,
  suppliers,
  rates,
  seasons,
  uiLang,
  activeSubTab = 'rates',
  onNavigateSubTab,
  onSaveRate,
  onDeleteRate,
  onSaveSupplier,
}) => {
  const isAr = uiLang === 'ar';
  const [subTab, setSubTab] = useState<'rates' | 'suppliers' | 'seasons' | 'fx'>(activeSubTab);

  const handleSubTabChange = (t: 'rates' | 'suppliers' | 'seasons' | 'fx') => {
    setSubTab(t);
    if (onNavigateSubTab) onNavigateSubTab(t);
  };

  return (
    <div className="space-y-6">
      {/* 1. LIBRARY HEADER & EDUCATIONAL OVERVIEW */}
      <div className="relative bg-white rounded-2xl border border-[#EDE0CC] p-4 sm:p-5 shadow-xs">
        <SectionHelpTrigger
          sectionKey={subTab === 'suppliers' ? 'suppliers' : 'rates'}
          uiLang={uiLang}
          size="sm"
          pinned={true}
          label={isAr ? 'دليل التعريفات' : 'Tariff Guide'}
          onNavigateTab={(tab) => {
            if (tab === 'rates' || tab === 'suppliers' || tab === 'seasons') {
              handleSubTabChange(tab as any);
            }
          }}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EDE0CC]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#795037]">
                {isAr ? 'قاعدة الموارد المشتركة' : 'Reusable Operations Library'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#44200F] mt-0.5">
              {isAr ? 'مكتبة الأسعار والموردين' : 'Rates & Operational Library'}
            </h1>
            <p className="text-xs text-[#795037] mt-0.5">
              {isAr
                ? 'الأصول والتعاقدات التي تعيد الشركة استخدامها عند بناء عروض الأسعار والرحلات: الفنادق، النقل، المرشدين، ورسوم المعالم.'
                : 'Things your company reuses when building trips: contracted hotel rates, vehicles, tour guides, and seasons.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="h-9 text-xs font-bold px-3 rounded-xl bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] inline-flex items-center whitespace-nowrap shrink-0">
              {rates.length} {isAr ? 'تعريفة مسجلة' : 'Contracted Rates'}
            </span>
            <span className="h-9 text-xs font-bold px-3 rounded-xl bg-[#FAF7F2] text-[#44200F] border border-[#EDE0CC] inline-flex items-center whitespace-nowrap shrink-0">
              {suppliers.length} {isAr ? 'مورد معتمد' : 'Suppliers'}
            </span>
          </div>
        </div>

        {/* Sub-tabs Selection - Strictly Equal Height & Non-Wrapping on Mobile */}
        <div className="pt-3 luxury-tab-bar">
          <button
            type="button"
            onClick={() => handleSubTabChange('rates')}
            className={`luxury-nav-pill ${
              subTab === 'rates'
                ? 'luxury-nav-pill-active'
                : 'luxury-nav-pill-inactive'
            }`}
          >
            <div className="luxury-nav-pill-icon">
              <Database className="w-4 h-4 text-[#C4A177]" />
            </div>
            <span className="whitespace-nowrap">{isAr ? 'الأسعار والتعاقدات' : 'Rates & Tariffs'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabChange('suppliers')}
            className={`luxury-nav-pill ${
              subTab === 'suppliers'
                ? 'luxury-nav-pill-active'
                : 'luxury-nav-pill-inactive'
            }`}
          >
            <div className="luxury-nav-pill-icon">
              <Building2 className="w-4 h-4 text-[#C4A177]" />
            </div>
            <span className="whitespace-nowrap">{isAr ? 'الموردون والشركاء' : 'Suppliers & Partners'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabChange('seasons')}
            className={`luxury-nav-pill ${
              subTab === 'seasons'
                ? 'luxury-nav-pill-active'
                : 'luxury-nav-pill-inactive'
            }`}
          >
            <div className="luxury-nav-pill-icon">
              <Calendar className="w-4 h-4 text-[#C4A177]" />
            </div>
            <span className="whitespace-nowrap">{isAr ? 'المواسم وهوامش الأمان' : 'Seasons & Margins'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabChange('fx')}
            className={`luxury-nav-pill ${
              subTab === 'fx'
                ? 'luxury-nav-pill-active'
                : 'luxury-nav-pill-inactive'
            }`}
          >
            <div className="luxury-nav-pill-icon">
              <DollarSign className="w-4 h-4 text-[#C4A177]" />
            </div>
            <span className="whitespace-nowrap">{isAr ? 'العملات وهوامش الصرف' : 'Currencies & FX'}</span>
          </button>
        </div>
      </div>

      {/* 2. EMBEDDED RATE LIBRARY VIEW WITH SPECIFIC ACTIVE TAB */}
      <RateLibraryView
        workspace={workspace}
        currentUser={currentUser}
        suppliers={suppliers}
        rates={rates}
        seasons={seasons}
        uiLang={uiLang}
        onSaveRate={onSaveRate}
        onDeleteRate={onDeleteRate}
        onSaveSupplier={onSaveSupplier}
        initialTab={subTab}
      />
    </div>
  );
};

export default LibraryWorkspaceView;
