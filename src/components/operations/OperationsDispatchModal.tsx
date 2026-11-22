import { writeSafePrintDocument } from '../../lib/safePrint';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Printer, MessageSquare, Download, Check, Copy, 
  Search, Shield, Phone, MapPin, Calendar, Clock, 
  Users, Car, Compass, Award, Building2, Ship, Sparkles,
  CheckCircle2, AlertTriangle, ExternalLink, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Workspace, SupplierVoucher, VoucherStatus, VoucherCategory, UILanguage } from '../../types';
import { TripFile } from '../../lib/tripStore';
import { 
  loadVouchersForQuote, 
  saveVouchersForQuote, 
  generateVouchersFromQuote,
  formatWhatsAppDispatchMessage, 
  generatePrintableVoucherHtml, 
  generateBatchVouchersHtml 
} from '../../lib/voucherService';
import { modalBackdropVariants, modalDialogVariants, executiveTransition } from '../../lib/motion';

interface OperationsDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  workspace: Workspace;
  uiLang?: UILanguage;
  tripFile?: Partial<TripFile>;
}

export const OperationsDispatchModal: React.FC<OperationsDispatchModalProps> = ({
  isOpen,
  onClose,
  quote,
  workspace,
  uiLang = 'en',
  tripFile,
}) => {
  const [vouchers, setVouchers] = useState<SupplierVoucher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // WhatsApp dispatch preview state
  const [dispatchTargetVoucher, setDispatchTargetVoucher] = useState<SupplierVoucher | null>(null);
  const [dispatchCopied, setDispatchCopied] = useState(false);

  // Initialize and load vouchers
  useEffect(() => {
    if (isOpen && quote) {
      const loaded = loadVouchersForQuote(quote, tripFile, workspace);
      setVouchers(loaded);
    }
  }, [isOpen, quote?.id]);

  const handleUpdateVoucher = (id: string, patch: Partial<SupplierVoucher>) => {
    const updated = vouchers.map(v => v.id === id ? { ...v, ...patch } : v);
    setVouchers(updated);
    saveVouchersForQuote(quote.id, updated);
  };

  const handleRegenerateAll = () => {
    if (confirm('Re-generate all vouchers from the latest itinerary dates, services, and add-ons? Custom notes will be reset.')) {
      const fresh = generateVouchersFromQuote(quote, tripFile, workspace);
      setVouchers(fresh);
      saveVouchersForQuote(quote.id, fresh);
    }
  };

  const handlePrintSingle = (voucher: SupplierVoucher) => {
    const html = generatePrintableVoucherHtml(voucher, workspace);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please enable pop-ups in your browser to view official printable vouchers.');
      return;
    }
    writeSafePrintDocument(win, html);
    win.document.close();
  };

  const handlePrintAllBatch = () => {
    const html = generateBatchVouchersHtml(vouchers, workspace);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please enable pop-ups in your browser to download and print the operations voucher bundle.');
      return;
    }
    writeSafePrintDocument(win, html);
    win.document.close();
  };

  const handleOpenWhatsAppDispatch = (voucher: SupplierVoucher) => {
    setDispatchTargetVoucher(voucher);
    setDispatchCopied(false);
  };

  const handleSendWhatsApp = (voucher: SupplierVoucher) => {
    const msg = formatWhatsAppDispatchMessage(voucher, workspace);
    const cleanPhone = (voucher.supplierContactPhone || voucher.driverPhone || voucher.guidePhone || '').replace(/\D/g, '');
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    // Mark as Dispatched
    handleUpdateVoucher(voucher.id, { 
      status: voucher.status === 'Draft' ? 'Dispatched' : voucher.status,
      dispatchedAt: new Date().toISOString() 
    });

    window.open(waUrl, '_blank');
  };

  const handleCopyDispatch = (voucher: SupplierVoucher) => {
    const msg = formatWhatsAppDispatchMessage(voucher, workspace);
    navigator.clipboard.writeText(msg);
    setDispatchCopied(true);
    setTimeout(() => setDispatchCopied(false), 2000);
  };

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const matchesCategory = activeCategory === 'all' || v.category === activeCategory;
      const matchesSearch = 
        v.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.driverName && v.driverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.guideName && v.guideName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [vouchers, activeCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'All Operations', count: vouchers.length },
    { id: 'hotel', label: 'Hotels & Resorts', count: vouchers.filter(v => v.category === 'hotel').length },
    { id: 'cruise', label: 'Nile Cruise', count: vouchers.filter(v => v.category === 'cruise').length },
    { id: 'transport', label: 'Private Chauffeurs', count: vouchers.filter(v => v.category === 'transport').length },
    { id: 'guide', label: 'Egyptologist Guides', count: vouchers.filter(v => v.category === 'guide').length },
    { id: 'excursion', label: 'VIP Add-ons', count: vouchers.filter(v => v.category === 'excursion').length },
  ];

  const statusColors: Record<VoucherStatus, string> = {
    'Draft': 'bg-slate-100 text-slate-700 border-slate-300',
    'Dispatched': 'bg-[#f0f6ff] text-[#006ce4] border-[#006ce4]/30',
    'Confirmed': 'bg-[#e8f5e9] text-[#008009] border-emerald-300',
    'Voucher Issued': 'bg-teal-50 text-teal-800 border-teal-300',
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={executiveTransition}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs print:hidden overflow-y-auto"
      >
        <motion.div
          variants={modalDialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={executiveTransition}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#e7e7e7] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#003580] text-white flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#ffb700] border border-white/20">
                <Shield className="w-5 h-5 fill-[#ffb700]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white tracking-tight">
                    1-Click Supplier Vouchers &amp; Operations Dispatch
                  </h3>
                  <span className="text-[10px] font-bold bg-[#ffb700] text-[#00224f] px-2 py-0.5 rounded uppercase tracking-wider">
                    {workspace.name}
                  </span>
                </div>
                <p className="text-xs text-white/70">
                  Itinerary #{quote.quoteNumber} • {quote.travelerName} ({quote.durationDays} Days, {quote.startDate})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintAllBatch}
                className="btn-tactile px-3.5 py-1.5 bg-[#ffb700] hover:bg-[#e6a600] active:bg-[#cc9300] text-[#00224f] rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                title="Print or download all supplier vouchers as a consolidated A4 multi-page document"
              >
                <Printer className="w-4 h-4 text-[#00224f]" />
                <span className="hidden sm:inline">1-Click Print All Vouchers</span>
                <span className="sm:hidden">Print All</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader: Search, Filters, and Stats */}
          <div className="p-4 bg-[#f8f9fa] border-b border-[#e7e7e7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search supplier, city, driver or guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#e7e7e7] rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-[#006ce4]"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleRegenerateAll}
                className="btn-tactile px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#e7e7e7] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                title="Regenerate all vouchers from scratch based on quote days"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#006ce4]" />
                <span>Sync with Itinerary</span>
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="px-4 py-2 bg-white border-b border-[#e7e7e7] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`btn-tactile px-3 py-1 rounded-md text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#003580] text-white shadow-xs'
                    : 'bg-[#f8f9fa] text-slate-600 hover:text-slate-900 hover:bg-[#e7e7e7] border border-[#e7e7e7]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Vouchers Grid List */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-[#f5f5f5]">
            {filteredVouchers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-dashed border-[#e7e7e7] space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">No Vouchers Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No supplier vouchers match the selected filter or search query. Click "Sync with Itinerary" to generate vouchers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredVouchers.map((voucher) => {
                  const CategoryIcon = 
                    voucher.category === 'hotel' ? Building2 :
                    voucher.category === 'cruise' ? Ship :
                    voucher.category === 'transport' ? Car :
                    voucher.category === 'guide' ? Compass : Sparkles;

                  return (
                    <div
                      key={voucher.id}
                      className="card-lift bg-white rounded-xl border border-[#e7e7e7] shadow-xs p-4 flex flex-col justify-between hover:border-[#006ce4]/40 transition space-y-3"
                    >
                      {/* Top Row: Category, City, Ref #, Status */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-[#003580] bg-[#f0f6ff] px-2 py-0.5 rounded border border-[#006ce4]/20 flex items-center gap-1">
                              <CategoryIcon className="w-3 h-3 text-[#006ce4]" />
                              <span>{voucher.category.toUpperCase()}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {voucher.city}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-bold text-[#003580]">
                              {voucher.voucherNumber}
                            </span>
                            <select
                              value={voucher.status}
                              onChange={(e) => handleUpdateVoucher(voucher.id, { status: e.target.value as VoucherStatus })}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-hidden cursor-pointer ${statusColors[voucher.status]}`}
                            >
                              <option value="Draft">Draft</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Voucher Issued">Voucher Issued</option>
                            </select>
                          </div>
                        </div>

                        {/* Service Title & Supplier Name */}
                        <h4 className="font-bold text-sm text-[#1a1a1a] tracking-tight">
                          {voucher.serviceTitle}
                        </h4>
                        <div className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1">
                          <span>Supplier:</span>
                          <span className="text-[#003580]">{voucher.supplierName}</span>
                        </div>

                        {/* Logistics Summary Table */}
                        <div className="mt-3 p-2.5 bg-[#f8f9fa] rounded-lg border border-[#e7e7e7] text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-[#006ce4]" />
                              <span>Service Date:</span>
                            </span>
                            <strong className="text-slate-900 font-mono">
                              {voucher.serviceDate} {voucher.endDate ? `→ ${voucher.endDate}` : ''}
                            </strong>
                          </div>

                          {voucher.pickupTime && (
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pickup Time:</span>
                              </span>
                              <strong className="text-slate-900">{voucher.pickupTime}</strong>
                            </div>
                          )}

                          {voucher.flightDetails && (
                            <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200 flex items-baseline justify-between">
                              <span className="text-slate-500">Flight Coordinates:</span>
                              <strong className="text-[#003580] truncate ml-2">{voucher.flightDetails}</strong>
                            </div>
                          )}

                          {voucher.driverName && (
                            <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200 flex items-center justify-between">
                              <span className="text-slate-500">Driver &amp; Vehicle:</span>
                              <span className="font-semibold">{voucher.driverName} ({voucher.vehicleCategory || 'VIP Van'})</span>
                            </div>
                          )}

                          {voucher.guideName && (
                            <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200 flex items-center justify-between">
                              <span className="text-slate-500">Egyptologist:</span>
                              <span className="font-semibold text-emerald-800">{voucher.guideName} ({voucher.guideLanguage || 'EN'})</span>
                            </div>
                          )}

                          {voucher.roomType && (
                            <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200 flex items-center justify-between">
                              <span className="text-slate-500">Room &amp; Board:</span>
                              <span className="font-semibold">{voucher.roomType} · {voucher.mealPlan || 'BB'}</span>
                            </div>
                          )}
                        </div>

                        {/* Inline Confirmation # & Quick Note */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Supplier Confirmation #"
                            value={voucher.confirmationNumber || ''}
                            onChange={(e) => handleUpdateVoucher(voucher.id, { confirmationNumber: e.target.value })}
                            className="flex-1 px-2.5 py-1 text-xs border border-[#e7e7e7] rounded-md font-mono text-slate-800 bg-white focus:border-[#006ce4] outline-hidden placeholder:font-sans"
                          />
                        </div>
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="pt-3 border-t border-[#e7e7e7] flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500 font-mono">
                          {voucher.paxCount} Guest{voucher.paxCount !== 1 ? 's' : ''} ({voucher.leadGuestName})
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* 1-Click WhatsApp Dispatch */}
                          <button
                            onClick={() => handleOpenWhatsAppDispatch(voucher)}
                            className="btn-tactile px-2.5 py-1.5 bg-[#e8f5e9] hover:bg-[#d4edda] text-[#008009] border border-emerald-300 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            title="Open WhatsApp Dispatch text & quick link"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Print Official Voucher */}
                          <button
                            onClick={() => handlePrintSingle(voucher)}
                            className="btn-tactile px-2.5 py-1.5 bg-[#006ce4] hover:bg-[#0057b8] text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                            title="Print branded official supplier voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Voucher</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-[#e7e7e7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#003580]" />
              <span>
                <strong>{vouchers.length} Total Operations Vouchers</strong> ready for field dispatch. No guest payments handled by field suppliers.
              </span>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handlePrintAllBatch}
                className="btn-tactile px-4 py-2 bg-[#003580] hover:bg-[#00224f] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#ffb700]" />
                <span>1-Click Print All Vouchers (A4 Bundle)</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* WhatsApp Dispatch Drawer / Sub-modal */}
        {dispatchTargetVoucher && (
          <div 
            onClick={(e) => { e.stopPropagation(); setDispatchTargetVoucher(null); }}
            className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-xl w-full p-5 shadow-2xl border border-[#e7e7e7] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#e7e7e7] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#e8f5e9] text-[#008009] flex items-center justify-center border border-emerald-300">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#003580]">
                      WhatsApp Operations Dispatch
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {dispatchTargetVoucher.voucherNumber} • {dispatchTargetVoucher.supplierName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDispatchTargetVoucher(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Pre-Formatted Operational Message (Arabic / English)
                </label>
                <textarea
                  readOnly
                  rows={10}
                  value={formatWhatsAppDispatchMessage(dispatchTargetVoucher, workspace)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden select-all"
                />
                <p className="text-[10px] text-slate-500">
                  This message is formatted for Egyptian suppliers, including exact pickup time, flight coordinates, and the strict DMC billing clause.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyDispatch(dispatchTargetVoucher)}
                  className="btn-tactile px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {dispatchCopied ? <Check className="w-3.5 h-3.5 text-[#008009]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{dispatchCopied ? 'Copied to Clipboard!' : 'Copy Dispatch Text'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDispatchTargetVoucher(null)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSendWhatsApp(dispatchTargetVoucher);
                      setDispatchTargetVoucher(null);
                    }}
                    className="btn-tactile px-4 py-2 bg-[#008009] hover:bg-[#006607] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
