import React, { useState, useMemo } from 'react';
import { 
  Hotel, Truck, Landmark, Plane, Ship, Check, 
  Clock, AlertCircle, Search, Filter, Printer, 
  MessageSquare, Mail, Copy, CheckCircle2, ChevronDown,
  Edit2, ExternalLink, QrCode
} from 'lucide-react';
import { TripFile, TripService, ServiceStatus } from '../../lib/tripStore';
import { UILanguage, Workspace } from '../../types';

interface TripServicesTableProps {
  trip: TripFile;
  workspace: Workspace;
  uiLang: UILanguage;
  onUpdateService: (serviceId: string, patch: Partial<TripService>) => void;
  onPrintVoucher: (service: TripService) => void;
  onBatchPrintVouchers?: () => void;
  onOpenServiceQr?: (service: TripService) => void;
}

const SERVICE_STATUSES: ServiceStatus[] = ['To request', 'Requested', 'Confirmed', 'Reconfirmed', 'Cancelled'];

const STATUS_BADGE_STYLE: Record<ServiceStatus, { bg: string; text: string; border: string; dot: string }> = {
  'To request': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  Requested: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  Confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  Reconfirmed: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-500' },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export const TripServicesTable: React.FC<TripServicesTableProps> = ({
  trip,
  workspace,
  uiLang,
  onUpdateService,
  onPrintVoucher,
  onBatchPrintVouchers,
  onOpenServiceQr,
}) => {
  const isAr = uiLang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedServiceForMsg, setSelectedServiceForMsg] = useState<TripService | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Filter services
  const filteredServices = useMemo(() => {
    return trip.services
      .filter(s => {
        if (typeFilter !== 'All') {
          const typeMatch = s.supplierType.toLowerCase().includes(typeFilter.toLowerCase());
          if (!typeMatch) return false;
        }
        if (statusFilter !== 'All' && s.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches = s.serviceName.toLowerCase().includes(q) ||
            s.supplierName.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            (s.confirmationNo || '').toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }, [trip.services, typeFilter, statusFilter, searchQuery]);

  // Statistics
  const total = trip.services.filter(s => s.status !== 'Cancelled').length;
  const confirmed = trip.services.filter(s => s.status === 'Confirmed' || s.status === 'Reconfirmed').length;
  const requested = trip.services.filter(s => s.status === 'Requested').length;
  const toRequest = trip.services.filter(s => s.status === 'To request').length;

  const dayDate = (d: number) => {
    if (!trip.startDate) return `Day ${d}`;
    const x = new Date(trip.startDate);
    x.setDate(x.getDate() + d - 1);
    return isNaN(x.getTime()) 
      ? `Day ${d}` 
      : x.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const getSupplierIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('hotel')) return Hotel;
    if (t.includes('cruise')) return Ship;
    if (t.includes('transfer') || t.includes('car') || t.includes('coach')) return Truck;
    if (t.includes('flight')) return Plane;
    return Landmark;
  };

  const buildConfirmationMessage = (s: TripService) => {
    const isHotel = s.supplierType.toLowerCase().includes('hotel') || s.supplierType.toLowerCase().includes('cruise');
    const roomsText = isHotel && trip.passengers.length > 0
      ? `\nRooming List (${trip.passengers.length} pax):\n` +
        trip.passengers.map((p, idx) => `• ${idx + 1}. ${p.name || 'Guest'} - ${p.type} (${p.room || 'Standard Room'})`).join('\n')
      : '';

    const dietText = trip.passengers.filter(p => p.dietary).map(p => `${p.name}: ${p.dietary}`).join('; ');

    return `Dear ${s.supplierName || 'Reservations Team'},\n\nPlease confirm our group booking from ${workspace.name}:\n\n` +
      `File Number: ${trip.fileNumber}\n` +
      `Group / Lead Guest: ${trip.travelerName} (${trip.passengers.length} Pax)\n` +
      `Service: ${s.serviceName}\n` +
      `City: ${s.city}\n` +
      `Date: ${dayDate(s.dayNumber)} (Day ${s.dayNumber} of tour)\n` +
      (s.confirmationNo ? `Current Conf #: ${s.confirmationNo}\n` : '') +
      (trip.arrival.flight ? `Arrival Flight: ${trip.arrival.flight} at ${trip.arrival.time}\n` : '') +
      (dietText ? `Special Requests / Dietary: ${dietText}\n` : '') +
      roomsText +
      `\n\nKindly confirm availability and return your official confirmation reference code.\n\n` +
      `Best regards,\n${workspace.name} Operations Desk\nPhone / WhatsApp: ${workspace.contactPhone}\nEmail: ${workspace.contactEmail}`;
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isAr ? 'إجمالي الخدمات' : 'Total Services'}
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isAr ? 'في برنامج الرحلة' : 'Across all tour days'}
          </div>
        </div>

        <div className="bg-white border border-emerald-200/90 rounded-2xl p-3.5 shadow-2xs bg-emerald-50/20">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            {isAr ? 'مؤكدة رسمياً' : 'Confirmed'}
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">
            {confirmed}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {total > 0 ? `${Math.round((confirmed / total) * 100)}% of total` : '0%'}
          </div>
        </div>

        <div className="bg-white border border-amber-200/90 rounded-2xl p-3.5 shadow-2xs bg-amber-50/20">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            {isAr ? 'قيد المتابعة والطلب' : 'Pending Reply'}
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1 font-mono">
            {requested}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">
            {isAr ? 'بانتظار رقم التأكيد' : 'Awaiting conf #'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isAr ? 'تحتاج إلى طلب' : 'To Request'}
          </div>
          <div className="text-2xl font-black text-slate-700 mt-1 font-mono">
            {toRequest}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {isAr ? 'لم يرسل الفاوتشر بعد' : 'Not yet dispatched'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1">
            <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالخدمة، المورد، المدينة أو رقم التأكيد...' : 'Search service, supplier, city, or conf #...'}
              className={`w-full text-xs font-medium py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-hidden ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>

          {/* Supplier Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="All">{isAr ? 'كل الفئات' : 'All Categories'}</option>
            <option value="Hotel">{isAr ? 'فنادق' : 'Hotels'}</option>
            <option value="Cruise">{isAr ? 'بواخر نيلية' : 'Nile Cruises'}</option>
            <option value="Transfer">{isAr ? 'انتقالات وسيارات' : 'Transfers'}</option>
            <option value="Sightseeing">{isAr ? 'مزارات ومرشدون' : 'Sightseeing & Guides'}</option>
            <option value="Flight">{isAr ? 'طيران داخلي' : 'Domestic Flights'}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="All">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
            {SERVICE_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenServiceQr && filteredServices.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenServiceQr(filteredServices[0])}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title={isAr ? 'توليد ومسح رموز QR لقسائم الخدمات' : 'Generate & Scan Service Voucher QRs'}
            >
              <QrCode className="w-3.5 h-3.5 text-amber-800" />
              <span>{isAr ? 'رموز QR للقسائم' : 'Voucher QRs'}</span>
            </button>
          )}

          {onBatchPrintVouchers && (
            <button
              type="button"
              onClick={onBatchPrintVouchers}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>{isAr ? 'طباعة مجمعة للقسائم' : 'Batch Print Vouchers'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main High-Density Services Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[920px]">
            <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5 text-center w-14">{isAr ? 'اليوم' : 'Day'}</th>
                <th className="py-3 px-3.5">{isAr ? 'الخدمة والفئة' : 'Service & Category'}</th>
                <th className="py-3 px-3.5">{isAr ? 'اسم المورد' : 'Supplier / Partner'}</th>
                <th className="py-3 px-3.5 w-36">{isAr ? 'حالة التأكيد' : 'Status'}</th>
                <th className="py-3 px-3.5 w-44">{isAr ? 'رقم التأكيد' : 'Confirmation #'}</th>
                <th className="py-3 px-3.5">{isAr ? 'ملاحظات تشغيلية' : 'Operational Note'}</th>
                <th className="py-3 px-3.5 text-right w-28">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredServices.map((service) => {
                const Icon = getSupplierIcon(service.supplierType);
                const badge = STATUS_BADGE_STYLE[service.status] || STATUS_BADGE_STYLE['To request'];

                return (
                  <tr key={service.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Day number */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold flex flex-col items-center justify-center mx-auto text-[11px] border border-slate-200">
                        <span>D{service.dayNumber}</span>
                      </div>
                    </td>

                    {/* Service Name & Category */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                          <Icon className="w-3.5 h-3.5 text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs">
                            {service.serviceName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-600">{service.supplierType}</span>
                            <span>·</span>
                            <span>{service.city}</span>
                            <span>·</span>
                            <span className="font-mono text-slate-400">{dayDate(service.dayNumber)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Supplier Name (Inline Editable) */}
                    <td className="py-3 px-3.5">
                      <input
                        type="text"
                        value={service.supplierName}
                        onChange={e => onUpdateService(service.id, { supplierName: e.target.value })}
                        placeholder="Supplier name"
                        className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden transition"
                      />
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-3.5">
                      <div className="relative">
                        <select
                          value={service.status}
                          onChange={e => onUpdateService(service.id, { status: e.target.value as ServiceStatus })}
                          className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border appearance-none cursor-pointer focus:outline-hidden ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {SERVICE_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-60 ${isAr ? 'left-2.5' : 'right-2.5'}`} />
                      </div>
                    </td>

                    {/* Confirmation # (Inline Editable) */}
                    <td className="py-3 px-3.5">
                      <input
                        type="text"
                        value={service.confirmationNo || ''}
                        onChange={e => onUpdateService(service.id, { confirmationNo: e.target.value })}
                        placeholder="e.g. CAI-9482-CONF"
                        className="w-full font-mono text-xs font-bold px-2.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden transition text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                      />
                    </td>

                    {/* Operational Note */}
                    <td className="py-3 px-3.5">
                      <input
                        type="text"
                        value={service.note || ''}
                        onChange={e => onUpdateService(service.id, { note: e.target.value })}
                        placeholder={isAr ? 'تعليمات، وجبات خاصة، وقت الحضور...' : 'Notes, pickup time, special requests...'}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden transition text-slate-700"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onOpenServiceQr && (
                          <button
                            type="button"
                            onClick={() => onOpenServiceQr(service)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-[#44200F] border border-amber-300 transition cursor-pointer"
                            title={isAr ? 'توليد ومسح رمز QR لقسيمة هذه الخدمة' : 'Generate & scan voucher QR code'}
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#795037]" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedServiceForMsg(service)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 border border-slate-200 transition cursor-pointer"
                          title="Generate Dispatch & WhatsApp Request"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onPrintVoucher(service)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                          title="Print Official A4 Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            {isAr ? 'لا توجد خدمات مطابقة للبحث أو التصفية الحالية.' : 'No services match the current filter or search criteria.'}
          </div>
        )}
      </div>

      {/* Dispatch & Confirmation Request Preview Modal */}
      {selectedServiceForMsg && (() => {
        const messageText = buildConfirmationMessage(selectedServiceForMsg);
        const subject = `Booking Confirmation Request: ${trip.fileNumber} - ${selectedServiceForMsg.serviceName}`;
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(messageText);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                    ✉
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isAr ? 'طلب تأكيد الحجز من المورد' : 'Supplier Booking Confirmation Request'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedServiceForMsg.supplierName || 'Supplier'} · {selectedServiceForMsg.serviceName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedServiceForMsg(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    {isAr ? 'نص الخطاب / رسالة الواتساب الرسمية' : 'Official Dispatch & Request Text'}
                  </label>
                  <textarea
                    readOnly
                    value={messageText}
                    rows={11}
                    className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(messageText);
                        setCopiedMsg(true);
                        setTimeout(() => setCopiedMsg(false), 2000);
                      }}
                      className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedMsg ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy Text')}</span>
                    </button>

                    <a
                      href={`mailto:?subject=${encodedSubject}&body=${encodedBody}`}
                      className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-sky-600" />
                      <span>{isAr ? 'إرسال بالبريد' : 'Open in Email'}</span>
                    </a>

                    <a
                      href={`https://wa.me/?text=${encodedBody}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إرسال واتساب' : 'Dispatch via WhatsApp'}</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedServiceForMsg(null)}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
