import React, { useState } from 'react';
import { 
  HeartHandshake, Sparkles, CheckCircle2, ChevronRight, 
  ChevronLeft, Info, BookOpen, Volume2, ShieldCheck, Footprints,
  Compass, Award
} from 'lucide-react';
import { UILanguage } from '../../../types';
import { UMRAH_RITUAL_STEPS } from '../../../lib/hajjUmrahData';

interface UmrahRitualGuideProps {
  uiLang: UILanguage;
}

export const UmrahRitualGuide: React.FC<UmrahRitualGuideProps> = ({ uiLang }) => {
  const isAr = uiLang === 'ar';
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [copiedDuaaIndex, setCopiedDuaaIndex] = useState<number | null>(null);

  const handleCopyDuaa = (duaa: string, index: number) => {
    navigator.clipboard.writeText(duaa);
    setCopiedDuaaIndex(index);
    setTimeout(() => setCopiedDuaaIndex(null), 2000);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Spiritual Hero Header - Kaaba Noir & Gold */}
      <div className="bg-gradient-to-r from-[#08080A] via-[#141419] to-[#08080A] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden text-white shadow-xl">
        {/* Subtle Arch Silhouette Background */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="#D4AF37">
            <path d="M100 10 C 60 40 40 80 40 130 L 40 200 L 160 200 L 160 130 C 160 80 140 40 100 10 Z" />
          </svg>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] mb-1.5">
                <HeartHandshake className="w-4 h-4 text-[#D4AF37]" />
                <span>{isAr ? 'الدليل الفقهي والتنفيذي لمناسك العمرة' : 'Authentic Step-by-Step Umrah Guide'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isAr ? 'مناسك العمرة المشرفة والأدعية المأثورة' : 'Umrah Rituals & Authentic Supplications'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                {isAr 
                  ? 'دليل شرعي وميداني متكامل للمشرفين والمرشدين الدينيين والمعتمرين، يوضح أركان العمرة الأربعة بالتسلسل الصحيح مع الأدعية النبوية والنصائح التشغيلية الميدانية.'
                  : 'Comprehensive ritual and operational handbook detailing the four pillars of Umrah with authentic prophetic Du\'aa and practical operator field tips.'}
              </p>
            </div>

            {/* Quick Step Indicator */}
            <div className="flex items-center gap-1.5 bg-[#121215] p-1.5 rounded-2xl border border-[#D4AF37]/30 self-start sm:self-auto shadow-inner">
              {UMRAH_RITUAL_STEPS.map((step, idx) => (
                <button
                  key={step.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    activeStepIndex === idx
                      ? 'bg-black text-[#F5E08F] border border-[#D4AF37]/60 shadow-xs ring-1 ring-[#D4AF37]/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={isAr ? step.titleAr : step.titleEn}
                >
                  {step.step}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Interactive Steps Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {UMRAH_RITUAL_STEPS.map((step, idx) => {
          const isSelected = activeStepIndex === idx;
          return (
            <button
              key={step.step}
              onClick={() => setActiveStepIndex(idx)}
              className={`text-start p-4 rounded-2xl border transition relative overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-[#44200F] text-[#FAF7F2] border-[#C4A177] shadow-md'
                  : 'bg-white text-[#44200F] border-[#EDE0CC] hover:bg-[#FAF7F2]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-[#D4AF37] text-[#181411]' : 'bg-[#EDE0CC] text-[#44200F]'
                }`}>
                  {isAr ? `الركن ٠${step.step}` : `Pillar 0${step.step}`}
                </span>
                {isSelected && <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />}
              </div>

              <h3 className={`text-xs sm:text-sm font-extrabold leading-tight ${
                isSelected ? 'text-white' : 'text-[#44200F]'
              }`}>
                {isAr ? step.titleAr : step.titleEn}
              </h3>

              <p className={`text-[11px] mt-1 line-clamp-1 ${
                isSelected ? 'text-[#EDE0CC]' : 'text-[#795037]'
              }`}>
                {isAr ? step.subtitleAr : step.subtitleEn}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Step Detailed Showcase with Islamic Arch Aesthetic */}
      {(() => {
        const activeStep = UMRAH_RITUAL_STEPS[activeStepIndex];
        return (
          <div className="bg-white rounded-3xl border border-[#EDE0CC] shadow-sm overflow-hidden">
            {/* Step Banner with Islamic Arch Motifs */}
            <div className="bg-gradient-to-r from-[#181411] via-[#2A1E17] to-[#181411] text-[#FAF7F2] p-6 sm:p-7 relative border-b border-[#D4AF37]/30">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D4AF37] via-[#EDE0CC] to-[#D4AF37]"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Step number badge in Islamic Arch shape */}
                  <div className="w-12 h-14 bg-gradient-to-b from-[#D4AF37] to-[#AA822A] text-[#181411] font-black rounded-t-2xl rounded-b-lg flex flex-col items-center justify-center shadow-md shrink-0">
                    <span className="text-[9px] uppercase font-bold tracking-widest">{isAr ? 'ركن' : 'Step'}</span>
                    <span className="text-xl font-mono leading-none">{activeStep.step}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#D4AF37] font-semibold">
                        {isAr ? activeStep.subtitleAr : activeStep.subtitleEn}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {isAr ? activeStep.titleAr : activeStep.titleEn}
                    </h3>
                  </div>
                </div>

                {/* Prev / Next controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    disabled={activeStepIndex === 0}
                    onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition cursor-pointer"
                    title={isAr ? 'الركن السابق' : 'Previous Step'}
                  >
                    {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                  <button
                    disabled={activeStepIndex === UMRAH_RITUAL_STEPS.length - 1}
                    onClick={() => setActiveStepIndex(prev => Math.min(UMRAH_RITUAL_STEPS.length - 1, prev + 1))}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition cursor-pointer"
                    title={isAr ? 'الركن التالي' : 'Next Step'}
                  >
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Detailed Explanation */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#795037]">
                  {isAr ? 'كيفية أداء النسك والشروط الشرعية:' : 'Ritual Performance Instructions:'}
                </h4>
                <p className="text-sm sm:text-base text-[#44200F] leading-relaxed">
                  {isAr ? activeStep.descAr : activeStep.descEn}
                </p>
              </div>

              {/* Calligraphic Prophetic Du'aa Showcase Card */}
              {activeStep.duaa && (
                <div className="bg-gradient-to-b from-[#FAF7F2] to-[#EDE0CC]/40 rounded-2xl border-2 border-[#C4A177]/50 p-6 relative shadow-xs">
                  {/* Decorative gold top crest */}
                  <div className="flex items-center justify-between mb-3 border-b border-[#C4A177]/30 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#AA822A]" />
                      <span className="text-xs font-bold text-[#44200F]">
                        {isAr ? 'الدعاء والذكر المأثور المسنون' : 'Authentic Prophetic Supplication'}
                      </span>
                      <span className="text-[10px] text-[#795037] px-2 py-0.5 rounded-full bg-white/80 border border-[#EDE0CC]">
                        {activeStep.audioCue}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyDuaa(activeStep.duaa, activeStep.step)}
                      className="text-xs font-bold text-[#795037] hover:text-[#44200F] px-2.5 py-1 rounded-lg bg-white border border-[#EDE0CC] hover:bg-[#FAF7F2] transition cursor-pointer"
                    >
                      {copiedDuaaIndex === activeStep.step 
                        ? (isAr ? 'تم النسخ بنجاح' : 'Copied!') 
                        : (isAr ? 'نسخ الذكر' : 'Copy Du\'aa')}
                    </button>
                  </div>

                  {/* Rich Arabic calligraphy style text */}
                  <p className="text-base sm:text-lg md:text-xl font-serif text-[#181411] text-center py-4 leading-loose tracking-wide font-medium" dir="rtl">
                    « {activeStep.duaa} »
                  </p>
                </div>
              )}

              {/* Practical Operator Field Tip */}
              <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-4 sm:p-5 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-950 block">
                    {isAr ? 'توجيه تشغيلي وإرشادي لشركات السياحة والمشرفين:' : 'Operator Field Tip for Tour Leaders:'}
                  </span>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {isAr ? activeStep.tipsAr : activeStep.tipsEn}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Summary Grid of All 4 Steps */}
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#EDE0CC] p-6 space-y-4">
        <h3 className="text-sm font-black text-[#44200F]">
          {isAr ? 'مصفوفة الترتيب الإيماني لمناسك العمرة الكاملة' : 'Sequential Pilgrimage Matrix'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {UMRAH_RITUAL_STEPS.map((s) => (
            <div key={s.step} className="bg-white p-4 rounded-2xl border border-[#EDE0CC] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#44200F] text-[#D4AF37] text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
                <span className="text-xs font-bold text-[#44200F]">{isAr ? s.titleAr : s.titleEn}</span>
              </div>
              <p className="text-[11px] text-[#795037] leading-relaxed line-clamp-3">
                {isAr ? s.descAr : s.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
