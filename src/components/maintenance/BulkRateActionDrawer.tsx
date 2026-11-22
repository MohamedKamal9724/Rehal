import React, { useState } from 'react';
import { 
  Layers, X, Percent, Calendar, DollarSign, 
  Check, ArrowRight, ShieldAlert, Sparkles 
} from 'lucide-react';
import { Rate, SupplierType } from '../../types';
import { EGYPT_CITIES, SUPPLIER_TYPES } from '../../lib/constants';

interface BulkRateActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rates: Rate[];
  onApplyBulkUpdate: (updatedRates: Rate[]) => void;
}

export const BulkRateActionDrawer: React.FC<BulkRateActionDrawerProps> = ({
  isOpen,
  onClose,
  rates,
  onApplyBulkUpdate,
}) => {
  const [scopeCity, setScopeCity] = useState<string>('Cairo');
  const [scopeType, setScopeType] = useState<string>('Hotel');
  const [actionType, setActionType] = useState<'percent_uplift' | 'fixed_increase' | 'extend_validity'>('percent_uplift');
  
  const [percentValue, setPercentValue] = useState<number>(10);
  const [fixedValue, setFixedValue] = useState<number>(25);
  const [extendUntil, setExtendUntil] = useState<string>('2027-12-31');

  if (!isOpen) return null;

  // Compute targeted rates
  const targetedRates = rates.filter(r => {
    const matchCity = scopeCity === 'All' || r.city.toLowerCase() === scopeCity.toLowerCase();
    const matchType = scopeType === 'All' || r.supplierType === scopeType;
    return matchCity && matchType;
  });

  const handleApply = () => {
    if (targetedRates.length === 0) return;

    const modified: Rate[] = rates.map(r => {
      const isTargeted = (scopeCity === 'All' || r.city.toLowerCase() === scopeCity.toLowerCase()) &&
        (scopeType === 'All' || r.supplierType === scopeType);

      if (!isTargeted) return r;

      let newCost = r.netCost;
      let newEnd = r.validityEnd;

      if (actionType === 'percent_uplift') {
        newCost = Math.round(r.netCost * (1 + percentValue / 100) * 100) / 100;
      } else if (actionType === 'fixed_increase') {
        newCost = Math.round((r.netCost + fixedValue) * 100) / 100;
      } else if (actionType === 'extend_validity') {
        newEnd = extendUntil;
      }

      return {
        ...r,
        netCost: newCost,
        validityEnd: newEnd,
        version: (r.version || 1) + 1,
        updatedAt: new Date().toISOString(),
        notes: `${r.notes || ''} [Bulk updated: ${actionType === 'percent_uplift' ? `+${percentValue}%` : `extended`} on ${new Date().toISOString().split('T')[0]}]`,
      };
    });

    onApplyBulkUpdate(modified);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl border-s border-[#CBD5E1] p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#0F172A]">Batch Rate Rules & Mass Updater</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#64748B]">
            Apply targeted price adjustments or contract validity extensions across multiple supplier contracts simultaneously.
          </p>

          {/* Scope Filters */}
          <div className="p-3.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] space-y-3 text-xs">
            <div className="font-semibold text-gray-900 uppercase tracking-wider text-[11px]">1. Target Scope</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1">Target City</label>
                <select
                  value={scopeCity}
                  onChange={(e) => setScopeCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#CBD5E1] rounded-md text-xs font-semibold bg-white text-gray-900"
                >
                  <option value="All">All Cities</option>
                  {EGYPT_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Service Type</label>
                <select
                  value={scopeType}
                  onChange={(e) => setScopeType(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#CBD5E1] rounded-md text-xs font-semibold bg-white text-gray-900"
                >
                  <option value="All">All Types</option>
                  {SUPPLIER_TYPES.map(st => <option key={st.type} value={st.type}>{st.type}</option>)}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-[#2563EB] font-semibold">
              🎯 Matched: {targetedRates.length} rate contracts in scope
            </div>
          </div>

          {/* Operation Selector */}
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-gray-900 uppercase tracking-wider text-[11px]">2. Mass Operation</div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === 'percent_uplift'}
                  onChange={() => setActionType('percent_uplift')}
                  className="mt-0.5 text-[#2563EB]"
                />
                <div>
                  <div className="font-bold text-gray-900">Percentage Price Uplift / Inflation Index</div>
                  <div className="text-[11px] text-gray-500">Applies a percentage increase (e.g. +10% for Q4 high season or annual renewal).</div>
                  {actionType === 'percent_uplift' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        value={percentValue}
                        onChange={(e) => setPercentValue(parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border rounded text-xs font-bold"
                      />
                      <span className="text-gray-600">% Increase</span>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === 'extend_validity'}
                  onChange={() => setActionType('extend_validity')}
                  className="mt-0.5 text-[#2563EB]"
                />
                <div>
                  <div className="font-bold text-gray-900">Extend Contract Expiration Date</div>
                  <div className="text-[11px] text-gray-500">Extends validity date for all matched contracts to keep rates active for quoting.</div>
                  {actionType === 'extend_validity' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="date"
                        value={extendUntil}
                        onChange={(e) => setExtendUntil(e.target.value)}
                        className="px-2 py-1 border rounded text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Aggregate Impact Preview */}
          <div className="p-3.5 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs space-y-1">
            <span className="font-bold text-blue-900 block">Estimated Rule Impact:</span>
            <p className="text-[11px] leading-relaxed">
              Applying this rule will update <strong>{targetedRates.length} rate contracts</strong> across {scopeCity}. 
              Existing quotes already saved will preserve their snapshot version.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-[#CBD5E1] rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={targetedRates.length === 0}
            onClick={handleApply}
            className="px-4 py-1.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-md text-xs font-semibold shadow-2xs disabled:opacity-50"
          >
            Apply to {targetedRates.length} Rates
          </button>
        </div>
      </div>
    </div>
  );
};
