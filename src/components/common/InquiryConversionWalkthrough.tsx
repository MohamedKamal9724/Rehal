import React, { useState } from 'react';
import { 
  Compass, ArrowRight, ArrowLeft, Check, Sparkles, X, 
  MessageSquare, FileText, Database, ShieldAlert, 
  Eye, Share2, Layers, CheckCircle2, ChevronRight, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Inquiry, Workspace } from '../../types';
import { executiveTransition } from '../../lib/motion';

export interface InquiryConversionWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onStartLiveConversion?: () => void;
}

export const InquiryConversionWalkthrough: React.FC<InquiryConversionWalkthroughProps> = ({
  isOpen,
  onClose,
  workspace,
  onStartLiveConversion,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onStartLiveConversion) {
        onStartLiveConversion();
      }
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto selection:bg-[#C5A059] selection:text-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={executiveTransition}
        className="bg-[#FAF8F5] text-slate-900 border border-[#E5DECF] rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col my-auto"
      >
        {/* Egyptian Luxury Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#111827] text-white flex items-center justify-between border-b border-[#C5A059]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#99772B] text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
              <Compass className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Interactive Tour: Inquiry to Proposal</h3>
                <span className="text-[10px] font-bold text-[#E6C673] bg-[#E6C673]/15 px-2 py-0.5 rounded-sm border border-[#E6C673]/30">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                How RIHAL automates inbound conversion from WhatsApp to multi-city visual proposal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="bg-[#FAF3E0]/70 px-5 sm:px-6 py-2 border-b border-[#EADBB8] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 flex-1">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 flex-1 ${
                  step <= currentStep ? 'bg-[#C5A059]' : 'bg-[#E5DECF]'
                }`}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] font-bold text-[#7A5E20] ms-3 shrink-0">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-5">
          <AnimatePresence mode="wait">
            {/* STEP 1: WhatsApp Inquiry Fast-Triage */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={executiveTransition}
                className="space-y-4"
              >
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#C5A059]" />
                    <span>1. Unstructured Inquiry Intake & Instant Triage</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Paste raw client chats from WhatsApp, email threads, or travel agent inquiries. RIHAL immediately isolates core parameters.
                  </p>
                </div>

                {/* Simulated WhatsApp Chat Message Card */}
                <div className="p-4 bg-white rounded-xl border border-[#E5DECF] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>WhatsApp Inbound · Elena & Thomas Vance</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Today 09:24 AM</span>
                  </div>

                  <div className="bg-[#FAF8F5] p-3 rounded-lg border border-slate-200/80 text-xs text-slate-700 italic leading-relaxed">
                    "Hello! We are looking for a 7-day luxury private tour to Cairo and a Nile cruise starting around Oct 20th. We prefer Marriott Mena House pyramid view and a 5-star cruise like Steigenberger Minerva with a licensed Egyptologist guide. Budget is ~$3,800. Please send bank details as well."
                  </div>

                  {/* Extraction Pills */}
                  <div className="pt-1 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      ✓ Party: 2 Adults
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                      ✓ Route: Cairo + Nile Cruise (7 Days)
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                      ✓ Budget: $3,800 USD
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                      ✓ Tier: 5-Star Luxury
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Interactive Visual Itinerary Timeline */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={executiveTransition}
                className="space-y-4"
              >
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#C5A059]" />
                    <span>2. Interactive Visual Itinerary Timeline in Proposal Builder</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    The proposal builder provides an interactive visual strip organizing multi-city Egyptian itineraries geographically.
                  </p>
                </div>

                {/* Simulated Timeline Visual Preview */}
                <div className="p-4 bg-white rounded-xl border border-[#C5A059]/40 shadow-sm space-y-3 ring-1 ring-[#C5A059]/20">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Multi-City Route Sequence Preview</span>
                    <span className="text-[10px] font-mono text-[#99772B] bg-[#FAF3E0] px-2 py-0.5 rounded border border-[#EADBB8]">
                      Interactive Strip
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-[#E5DECF] bg-[#FAF8F5]">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 mb-1">
                        <span>Day 1–2</span>
                        <span className="text-[#99772B] bg-[#FAF3E0] px-1 rounded">Cairo</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-900">Pyramids & Museum</div>
                      <div className="text-[10px] text-slate-500 mt-1">Marriott Mena House · Mercedes Transfer</div>
                    </div>

                    <div className="p-2.5 rounded-lg border border-[#C5A059] bg-[#FAF3E0]/70">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 mb-1">
                        <span>Day 3–5</span>
                        <span className="text-blue-700 bg-blue-50 px-1 rounded">Nile Cruise</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-900">Luxor to Aswan</div>
                      <div className="text-[10px] text-slate-500 mt-1">Steigenberger Minerva · Full Board</div>
                    </div>

                    <div className="p-2.5 rounded-lg border border-[#E5DECF] bg-[#FAF8F5]">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 mb-1">
                        <span>Day 6–7</span>
                        <span className="text-sky-700 bg-sky-50 px-1 rounded">Aswan & Dep.</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-900">Philae & Departure</div>
                      <div className="text-[10px] text-slate-500 mt-1">Mövenpick Resort · Flight to Cairo</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    💡 Click any day card on the timeline to immediately scroll to its details, view service density, or resequence activities.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Contract Rate Auto-Matching & Margin Floors */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={executiveTransition}
                className="space-y-4"
              >
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#C5A059]" />
                    <span>3. Contract Rate Auto-Pricing & Margin Protection</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    RIHAL instantly matches your contracted supplier rates and prevents sending proposals below your configured minimum gross margin.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E5DECF] space-y-3 shadow-2xs">
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Marriott Mena House (Pyramid Deluxe)</span>
                      <span className="font-mono text-slate-900">$240 net/night</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Steigenberger Minerva (Nile Cruise Cabin)</span>
                      <span className="font-mono text-slate-900">$340 net/night</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-700 font-medium">Licensed Egyptologist Private Guide</span>
                      <span className="font-mono text-slate-900">$125 net/day</span>
                    </div>
                    <div className="py-2 flex items-center justify-between bg-emerald-50/60 -mx-4 px-4 font-bold">
                      <span className="text-emerald-900">Enforced Gross Margin ({workspace.minMarginPercent || 18}%)</span>
                      <span className="text-emerald-800 font-mono">+21.4% Protected Profit</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Client Proposal Delivery */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={executiveTransition}
                className="space-y-4"
              >
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#C5A059]" />
                    <span>4. Luxury Client Proposal Link & 1-Click WhatsApp Share</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Generate an interactive client proposal with bank wire IBANs, day-by-day itineraries, and real-time open tracking telemetry.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E5DECF] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900">Client Link Ready</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Telemetry Tracking Active
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900 text-white rounded-lg flex items-center justify-between text-xs font-mono">
                    <span className="truncate">https://rihal.eg/p/EG-2026-9481</span>
                    <button
                      type="button"
                      className="px-2 py-1 bg-[#C5A059] text-slate-950 font-sans font-bold text-[10px] rounded cursor-pointer ms-2 shrink-0"
                    >
                      Copy Link
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <button
                      type="button"
                      className="flex-1 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Send Directly via WhatsApp</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 bg-white border-t border-[#E5DECF] flex items-center justify-between gap-3 shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 border border-[#CBD5E1] bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer active:scale-[0.985]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Skip Walkthrough
            </button>
          )}

          <div className="flex items-center gap-2">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] hover:from-slate-900 hover:to-slate-800 text-[#E6C673] border border-[#C5A059]/40 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition duration-150 cursor-pointer active:scale-[0.985]"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E6C673]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onStartLiveConversion) onStartLiveConversion();
                  onClose();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#99772B] hover:from-[#E6C673] hover:to-[#C5A059] text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition duration-150 cursor-pointer active:scale-[0.985]"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Try Live Inquiry Conversion</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
