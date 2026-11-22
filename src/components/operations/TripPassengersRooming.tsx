import React, { useState } from 'react';
import { 
  Users, Hotel, Plus, Trash2, Download, Printer, 
  ShieldAlert, Check, AlertCircle, Sparkles, Utensils, QrCode
} from 'lucide-react';
import { TripFile, TripPassenger, newId } from '../../lib/tripStore';
import { UILanguage } from '../../types';

interface TripPassengersRoomingProps {
  trip: TripFile;
  uiLang: UILanguage;
  onUpdatePassengers: (passengers: TripPassenger[]) => void;
  onExportRoomingCsv: () => void;
  onPrintManifest: () => void;
  onOpenPassengerQr?: (passenger: TripPassenger) => void;
}

export const TripPassengersRooming: React.FC<TripPassengersRoomingProps> = ({
  trip,
  uiLang,
  onUpdatePassengers,
  onExportRoomingCsv,
  onPrintManifest,
  onOpenPassengerQr,
}) => {
  const isAr = uiLang === 'ar';
  const passengers = trip.passengers;

  // Calculate Room Breakdown
  const roomTypesCount = passengers.reduce((acc, p) => {
    const roomStr = (p.room || '').toUpperCase();
    if (roomStr.includes('SGL') || roomStr.includes('SINGLE')) acc.sgl += 1;
    else if (roomStr.includes('TWN') || roomStr.includes('TWIN')) acc.twn += 1;
    else if (roomStr.includes('STE') || roomStr.includes('SUITE')) acc.ste += 1;
    else acc.dbl += 1; // Default DBL
    return acc;
  }, { dbl: 0, sgl: 0, twn: 0, ste: 0 });

  const adults = passengers.filter(p => p.type === 'Adult').length;
  const children = passengers.filter(p => p.type === 'Child').length;
  const infants = passengers.filter(p => p.type === 'Infant').length;
  const specialDietaryCount = passengers.filter(p => !!p.dietary?.trim()).length;

  const handleUpdate = (id: string, patch: Partial<TripPassenger>) => {
    const next = passengers.map(p => p.id === id ? { ...p, ...patch } : p);
    onUpdatePassengers(next);
  };

  const handleAdd = () => {
    const nextRoomNum = Math.ceil((passengers.length + 1) / 2);
    const newPassenger: TripPassenger = {
      id: newId(),
      name: '',
      nationality: passengers[0]?.nationality || '',
      type: 'Adult',
      room: `Room ${nextRoomNum} DBL`,
      dietary: '',
    };
    onUpdatePassengers([...passengers, newPassenger]);
  };

  const handleRemove = (id: string) => {
    onUpdatePassengers(passengers.filter(p => p.id !== id));
  };

  const handleAutoAssignRooms = () => {
    const next = passengers.map((p, idx) => {
      const roomNum = Math.floor(idx / 2) + 1;
      const isEven = idx % 2 === 0;
      return {
        ...p,
        room: `Room ${roomNum} ${isEven ? 'DBL (A)' : 'DBL (B)'}`,
      };
    });
    onUpdatePassengers(next);
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isAr ? 'إجمالي الركاب' : 'Total Passengers'}
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {passengers.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {adults} {isAr ? 'بالغ' : 'Adults'} · {children} {isAr ? 'أطفال' : 'Children'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isAr ? 'توزيع الغرف' : 'Room Allocations'}
          </div>
          <div className="text-sm font-bold text-slate-800 mt-2 flex items-center gap-2 font-mono">
            <span>{Math.ceil(passengers.length / 2)} {isAr ? 'غرفة' : 'Rooms'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            DBL, TWN & SGL configured
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            {isAr ? 'طلبات غذائية خاصة' : 'Dietary Flags'}
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1 font-mono">
            {specialDietaryCount}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">
            {isAr ? 'تحتاج إخطار الفنادق' : 'Notify kitchen teams'}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isAr ? 'إجراءات الكشف' : 'Manifest Export'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={onExportRoomingCsv}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={onPrintManifest}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3 h-3 text-slate-300" />
              <span>{isAr ? 'كشف A4' : 'Print'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {isAr ? 'كشف أسماء الفوج وتوزيع الغرف' : 'Group Passenger Manifest & Rooming List'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoAssignRooms}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isAr ? 'توزيع تلقائي ثنائي' : 'Auto-Allocate Pairs'}</span>
            </button>

            {onOpenPassengerQr && passengers.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenPassengerQr(passengers[0])}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                title={isAr ? 'توليد ومسح رموز QR لبطاقات الركاب' : 'Generate & Print Passenger QR Badges'}
              >
                <QrCode className="w-3.5 h-3.5 text-amber-800" />
                <span>{isAr ? 'رموز QR للركاب' : 'Passenger QRs'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAdd}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? '+ إضافة مسافر' : '+ Add Passenger'}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[760px]">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5 text-center w-12">#</th>
                <th className="py-2.5 px-3.5">{isAr ? 'الاسم كما في جواز السفر' : 'Full Name (as in Passport)'}</th>
                <th className="py-2.5 px-3.5 w-32">{isAr ? 'الفئة' : 'Pax Type'}</th>
                <th className="py-2.5 px-3.5 w-36">{isAr ? 'الجنسية' : 'Nationality'}</th>
                <th className="py-2.5 px-3.5 w-48">{isAr ? 'توزيع الغرفة' : 'Allocated Room'}</th>
                <th className="py-2.5 px-3.5">{isAr ? 'ملاحظات غذائية وخاصة' : 'Dietary / Special Needs'}</th>
                <th className="py-2.5 px-3.5 text-right w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {passengers.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3.5 text-center font-mono text-slate-400 font-bold">
                    {idx + 1}
                  </td>

                  <td className="py-2.5 px-3.5">
                    <input
                      type="text"
                      value={p.name}
                      onChange={e => handleUpdate(p.id, { name: e.target.value })}
                      placeholder="e.g. Johnathan Smith"
                      className="w-full font-bold text-slate-900 px-2.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden"
                    />
                  </td>

                  <td className="py-2.5 px-3.5">
                    <select
                      value={p.type}
                      onChange={e => handleUpdate(p.id, { type: e.target.value as any })}
                      className="w-full font-semibold text-slate-800 px-2.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden"
                    >
                      <option value="Adult">{isAr ? 'بالغ' : 'Adult'}</option>
                      <option value="Child">{isAr ? 'طفل' : 'Child'}</option>
                      <option value="Infant">{isAr ? 'رضيع' : 'Infant'}</option>
                    </select>
                  </td>

                  <td className="py-2.5 px-3.5">
                    <input
                      type="text"
                      value={p.nationality}
                      onChange={e => handleUpdate(p.id, { nationality: e.target.value })}
                      placeholder="e.g. Spanish"
                      className="w-full font-medium text-slate-700 px-2.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden"
                    />
                  </td>

                  <td className="py-2.5 px-3.5">
                    <input
                      type="text"
                      value={p.room}
                      onChange={e => handleUpdate(p.id, { room: e.target.value })}
                      placeholder="Room 1 DBL"
                      className="w-full font-mono text-xs font-bold text-sky-900 px-2.5 py-1.5 bg-sky-50/50 hover:bg-white focus:bg-white border border-sky-200 rounded-lg focus:border-sky-500 focus:outline-hidden"
                    />
                  </td>

                  <td className="py-2.5 px-3.5">
                    <div className="relative">
                      <input
                        type="text"
                        value={p.dietary || ''}
                        onChange={e => handleUpdate(p.id, { dietary: e.target.value })}
                        placeholder={isAr ? 'نباتي، حساسية جلوتين...' : 'e.g. Vegetarian, Gluten-Free, Wheelchair'}
                        className="w-full text-xs text-slate-700 px-2.5 py-1.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden"
                      />
                    </div>
                  </td>

                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    {onOpenPassengerQr && (
                      <button
                        type="button"
                        onClick={() => onOpenPassengerQr(p)}
                        className="p-1.5 rounded-lg text-amber-800 hover:text-amber-950 hover:bg-amber-100/70 transition cursor-pointer inline-flex items-center me-1"
                        title={isAr ? 'توليد ومسح رمز QR خاص بهذا المسافر' : 'Generate personal passenger QR code'}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer inline-flex items-center"
                      title="Remove passenger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {passengers.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isAr ? 'لم تتم إضافة مسافرين حتى الآن. اضغط زر + لإضافة الركاب وتوزيع الغرف.' : 'No passengers added yet. Click + Add Passenger to build the manifest.'}
          </div>
        )}
      </div>

      <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl flex items-start gap-2 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {isAr
            ? 'ملاحظة تشغيلية: تُرسل أسماء الركاب وتوزيع الغرف مباشرة إلى مديري حجوزات الفنادق والباخرة النيلية مع أرقام القسائم. لا يتم تخزين أرقام بطاقات الائتمان أو بيانات الدفع في هذا السجل.'
            : 'Operations Note: Passenger names and room configurations are directly linked to hotel and cruise rooming lists. No credit card or private financial data is processed or stored in this console.'}
        </p>
      </div>
    </div>
  );
};
