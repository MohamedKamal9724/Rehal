import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Sparkles, User, Calendar, Users, MapPin, 
  DollarSign, Globe, Check, ArrowRight, Copy, RefreshCw, X, AlertCircle, Phone, Mail
} from 'lucide-react';
import { Inquiry, ParsedRequirements, ProposalLanguage, Currency, Workspace, GroupComposition } from '../types';
import { parseInquiryWithAi, sanitizeInquiryText } from '../lib/gemini';
import { PROPOSAL_LANGUAGES } from '../lib/constants';
import { ExecutiveModal } from './common/ExecutiveModal';

interface WhatsAppParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onProceedToQuote: (inquiry: Inquiry) => void;
  onSaveInquiry?: (inquiry: Inquiry) => void;
}

const SAMPLE_INQUIRIES = [
  {
    title: 'Luxury Nile Cruise FIT Couple',
    subtitle: 'UK Travelers · 7 Nights · 5-Star Luxury',
    text: `Hello! My name is James Thornton (+44 7911 123456, james.t@outlook.co.uk). My wife and I are planning our anniversary trip to Egypt arriving 2026-11-10 for 8 days. 
We want a 5-star deluxe Nile cruise from Luxor to Aswan, private Egyptologist guide for the Pyramids of Giza and Karnak Temple, and private Mercedes van transfers. 
Our budget is around 4,500 USD for both of us. Please advise on options!`
  },
  {
    title: 'Family Pyramids & Red Sea Resort',
    subtitle: 'German Family · 4 Pax · Cairo & Hurghada',
    text: `Guten Tag! We are a family of 4 (2 adults, 2 kids ages 9 and 12). Planning to arrive in Cairo on 2026-12-18 for 10 days. 
We want 3 nights in Cairo to see the Grand Egyptian Museum and Giza Pyramids, then domestic flights to Hurghada for 7 nights in a 5-star all-inclusive beach resort. 
Looking to pay in EUR, budget around 5,000 EUR. Contact: Stefan Weber, email: stefan.weber@web.de, WhatsApp: +49 170 9876543.`
  },
  {
    title: 'B2B Wholesale Group (8 Pax)',
    subtitle: 'US Travel Agent · 10 Days · Classic Egypt',
    text: `B2B Request from Apex Travel Agency: 
Private group of 8 adults arriving 2026-10-25 for 10 days / 9 nights. 
Itinerary: Cairo (Pyramids, NMEC), Alexandria day trip, domestic flight to Aswan, 4-night 5-star Nile Cruise to Luxor, flight back to Cairo. 
Require English speaking private licensed Egyptologist throughout. Target currency USD. 
Agent Contact: Laura Miller (+1 415 555 2671, laura@apextravel.com). Please quote net DMC with 10% agent commission.`
  }
];

export const WhatsAppParserModal: React.FC<WhatsAppParserModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onProceedToQuote,
  onSaveInquiry,
}) => {
  const [rawText, setRawText] = useState(SAMPLE_INQUIRIES[0].text);
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedRequirements | null>(null);

  // Editable parsed fields
  const [leadName, setLeadName] = useState('James Thornton');
  const [leadPhone, setLeadPhone] = useState('+44 7911 123456');
  const [leadEmail, setLeadEmail] = useState('james.t@outlook.co.uk');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [selectedLang, setSelectedLang] = useState<ProposalLanguage>('en');

  // Trigger parsing on initial open or rawText change
  const runParser = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsParsing(true);
    try {
      const result = await parseInquiryWithAi(textToParse, 'en');
      setParsed(result);

      // Extract phone & email via regex heuristics
      const phoneMatch = textToParse.match(/(?:\+|00)[1-9]\d{1,14}|(?:\(\+?\d{1,3}\)\s?)?\d{3,4}[-\s]?\d{3,4}[-\s]?\d{3,4}/);
      if (phoneMatch) setLeadPhone(phoneMatch[0].trim());

      const emailMatch = textToParse.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) setLeadEmail(emailMatch[0].trim());

      if (result.travelerName) {
        setLeadName(result.travelerName);
      } else {
        const nameGuess = textToParse.match(/(?:my name is|contact:|lead:|name:)\s*([A-Za-z\s]{3,30})/i);
        if (nameGuess) setLeadName(nameGuess[1].trim());
      }

      if (result.budgetCurrency) {
        setSelectedCurrency(result.budgetCurrency);
      } else if (/eur|€/i.test(textToParse)) {
        setSelectedCurrency('EUR');
      } else if (/gbp|£/i.test(textToParse)) {
        setSelectedCurrency('GBP');
      } else if (/egp|le\b|ج\.م/i.test(textToParse)) {
        setSelectedCurrency('EGP');
      } else {
        setSelectedCurrency(workspace.defaultCurrency || 'USD');
      }

      if (result.language) {
        setSelectedLang(result.language);
      }
    } catch (e) {
      console.error('Failed to parse inquiry', e);
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runParser(rawText);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplySample = (sample: typeof SAMPLE_INQUIRIES[0]) => {
    setRawText(sample.text);
    runParser(sample.text);
  };

  const buildInquiryObject = (): Inquiry => {
    const id = `inq-${Date.now()}`;
    return {
      id,
      workspaceId: workspace.id,
      travelerName: leadName || 'Valued Guest',
      travelerPhone: leadPhone,
      travelerEmail: leadEmail,
      source: 'WhatsApp',
      rawText,
      status: 'In Progress',
      assignedAgentId: 'usr-1',
      assignedAgentName: 'Karim Mansour',
      receivedAt: new Date().toISOString(),
      language: selectedLang,
      slaMinutes: 120,
      requirements: parsed ? {
        ...parsed,
        travelerName: leadName,
        budgetCurrency: selectedCurrency,
        language: selectedLang,
      } : {
        travelerName: leadName,
        group: { adults: 2, children: [], infants: 0 },
        cities: ['Cairo', 'Giza', 'Luxor'],
        durationDays: 7,
        interests: ['Pyramids of Giza', 'Nile River Cruise'],
        urgency: 'Medium',
        confidenceScores: {},
      },
    };
  };

  const handleConvertToQuote = () => {
    const inquiry = buildInquiryObject();
    if (onSaveInquiry) onSaveInquiry(inquiry);
    onProceedToQuote(inquiry);
    onClose();
  };

  const handleSaveToPipeline = () => {
    const inquiry = buildInquiryObject();
    if (onSaveInquiry) onSaveInquiry(inquiry);
    onClose();
  };

  return (
    <ExecutiveModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      maxHeightClass="max-h-[92vh]"
      icon={<MessageSquare className="w-5 h-5 fill-slate-950" />}
      title="WhatsApp & Email Inquiry Fast-Parser"
      subtitle="Paste raw traveler chats to auto-extract dates, pax counts, destinations & quote lines"
      badge={
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#E6C673] bg-[#E6C673]/15 px-2 py-0.5 rounded-sm border border-[#E6C673]/30">
          RIHAL Engine
        </span>
      }
      bodyClassName="p-5 sm:p-6 space-y-5"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Ready to convert directly to luxury quote proposal</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveToPipeline}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-[#DACFBF] rounded-xl text-xs font-semibold transition duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.985]"
            >
              Save to Pipeline
            </button>
            <button
              type="button"
              onClick={handleConvertToQuote}
              className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-[#111827] to-[#1F2937] hover:from-slate-900 hover:to-slate-800 text-[#E6C673] border border-[#C5A059]/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition duration-150 cursor-pointer active:scale-[0.985]"
            >
              <span>Build Luxury Quote</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E6C673]" />
            </button>
          </div>
        </div>
      }
    >
          
          {/* Standard Inquiry Formats */}
          <div>
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Or click a realistic Egyptian DMC inquiry scenario:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {SAMPLE_INQUIRIES.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplySample(s)}
                  className="text-start p-3 rounded-xl border border-[#E5DECF] bg-white hover:border-[#C5A059] hover:shadow-xs transition cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-slate-900 group-hover:text-[#99772B] transition-colors">
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {s.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Raw Text Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Raw Inquiry Message</span>
                <span className="text-[10px] font-normal text-slate-600">(WhatsApp chat, Instagram DM, or client email)</span>
              </label>
              <button
                onClick={() => runParser(rawText)}
                disabled={isParsing}
                className="text-xs font-semibold text-[#99772B] hover:text-[#7A5E20] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isParsing ? 'animate-spin' : ''}`} />
                <span>Re-parse Text</span>
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                runParser(e.target.value);
              }}
              rows={4}
              placeholder="Paste message text here..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-[#E5DECF] bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
            />
          </div>

          {/* Extraction Results Grid */}
          <div className="bg-white rounded-xl border border-[#E5DECF] p-4.5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-900">Extracted Travel Specifications</span>
              </div>
              <div className="text-[11px] text-slate-600">
                Auto-extracted from message heuristics
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Lead Name */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-[#C5A059]" />
                  <span>Lead Traveler</span>
                </div>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 bg-transparent border-b border-slate-300 focus:border-[#C5A059] outline-hidden"
                  placeholder="e.g. Karim Mansour"
                />
              </div>

              {/* Group Size */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3 text-[#C5A059]" />
                  <span>Group Composition</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {parsed?.group?.adults || 2} Adults
                  {parsed?.group?.children && parsed.group.children.length > 0 && ` · ${parsed.group.children.length} Kids`}
                  <span className="text-[10px] text-slate-600 font-normal ms-1">
                    ({(parsed?.group?.adults || 2) + (parsed?.group?.children?.length || 0)} Total Pax)
                  </span>
                </div>
              </div>

              {/* Duration & Start Date */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-[#C5A059]" />
                  <span>Dates & Duration</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {parsed?.durationDays || 7} Days
                  <span className="text-[10px] text-slate-600 font-normal block truncate">
                    Arrival: {parsed?.startDate || 'Pending confirmation'}
                  </span>
                </div>
              </div>

              {/* Target Currency */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1 mb-1">
                  <DollarSign className="w-3 h-3 text-[#C5A059]" />
                  <span>Quoting Currency</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {(['USD', 'EUR', 'GBP', 'EGP'] as Currency[]).map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCurrency(c)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        selectedCurrency === c
                          ? 'bg-[#111827] text-[#E6C673]'
                          : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Contact details & destinations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Phone & Email */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5] space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Contact Information
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="WhatsApp phone number"
                      className="w-full text-xs text-slate-800 bg-transparent border-b border-slate-200 focus:border-[#C5A059] outline-hidden font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="Traveler email"
                      className="w-full text-xs text-slate-800 bg-transparent border-b border-slate-200 focus:border-[#C5A059] outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Cities & Landmarks */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EAE3D5] space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Egyptian Destinations Detected</span>
                  <span className="text-[10px] font-normal text-slate-600">{parsed?.cities?.length || 0} cities</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(parsed?.cities || ['Cairo', 'Giza', 'Luxor']).map(city => (
                    <span 
                      key={city}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-800 bg-white px-2 py-0.5 rounded-md border border-[#E5DECF]"
                    >
                      <MapPin className="w-3 h-3 text-[#C5A059]" />
                      <span>{city}</span>
                    </span>
                  ))}
                  {parsed?.interests?.map(interest => (
                    <span
                      key={interest}
                      className="inline-flex items-center text-[10px] font-medium text-[#7A5E20] bg-[#FAF3E0] px-2 py-0.5 rounded-md border border-[#EADBB8]"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </ExecutiveModal>
  );
};
