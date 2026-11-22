import React, { useState, useRef, useMemo } from 'react';
import { 
  RoadStopObject, RoadStopCategory 
} from '../../lib/roadmapTypes';
import { RoadStopMilestoneCard } from './RoadStopMilestoneCard';
import { 
  Hotel, Landmark, Utensils, Camera, Truck, Plus, 
  MapPin, Navigation, Sparkles, Compass, AlertCircle,
  Route as RouteIcon, Clock, ChevronDown, ChevronUp,
  LayoutGrid, ListOrdered
} from 'lucide-react';
import { UILanguage } from '../../types';

interface RoadCanvasSvgProps {
  stops: RoadStopObject[];
  uiLang: UILanguage;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, patch: Partial<RoadStopObject>) => void;
  onMoveStop: (fromIndex: number, toIndex: number) => void;
  onInsertStopAt: (index: number, item: any) => void;
  vehicleProgress?: number; // 0 to 100
  isSimulatingDrive?: boolean;
  distancesToNext?: Record<number, {
    distanceKm: number;
    durationMinutes: number;
    distanceText?: string;
    durationText?: string;
  }>;
}

export const RoadCanvasSvg: React.FC<RoadCanvasSvgProps> = ({
  stops,
  uiLang,
  onRemoveStop,
  onUpdateStop,
  onMoveStop,
  onInsertStopAt,
  vehicleProgress = 0,
  isSimulatingDrive = false,
  distancesToNext = {},
}) => {
  const isAr = uiLang === 'ar';
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [activeDropIndex, setActiveDropIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'highway' | 'timeline'>('highway');

  // SVG Geometry Calculation
  const canvasWidth = 900;
  const cardHeight = 180;
  const canvasHeight = Math.max(760, stops.length * cardHeight + 160);

  // Road geometry with clean separation:
  // Center highway spine gently curves between x=420 and x=480
  // Left cards: x = 20, width = 360 (ends at 380)
  // Right cards: x = 520, width = 360 (starts at 520)
  const stopPoints = useMemo(() => {
    return stops.map((stop, idx) => {
      const isEven = idx % 2 === 0;
      // Gentle curve alternating slightly left/right of center
      const roadX = isEven ? 430 : 470;
      const y = 90 + idx * cardHeight;
      const cardLeft = isEven ? 20 : 520;
      return { roadX, y, stop, idx, isEven, cardLeft };
    });
  }, [stops, cardHeight]);

  // Build SVG path data for the curving road spine
  const roadPathD = useMemo(() => {
    if (stopPoints.length === 0) return '';
    if (stopPoints.length === 1) {
      return `M 450 20 L 450 ${canvasHeight - 20}`;
    }

    let d = `M ${stopPoints[0].roadX} ${Math.max(20, stopPoints[0].y - 70)}`;
    d += ` L ${stopPoints[0].roadX} ${stopPoints[0].y}`;

    for (let i = 0; i < stopPoints.length - 1; i++) {
      const p1 = stopPoints[i];
      const p2 = stopPoints[i + 1];
      const midY = (p1.y + p2.y) / 2;
      // Smooth Bézier curve
      d += ` C ${p1.roadX} ${midY}, ${p2.roadX} ${midY}, ${p2.roadX} ${p2.y}`;
    }

    const last = stopPoints[stopPoints.length - 1];
    d += ` L ${last.roadX} ${last.y + 70}`;
    return d;
  }, [stopPoints, canvasHeight]);

  // Calculate vehicle position along road path using progress percentage
  const vehiclePos = useMemo(() => {
    if (stopPoints.length === 0) return { x: 450, y: 40, angle: 90 };
    if (stopPoints.length === 1) return { x: stopPoints[0].roadX, y: stopPoints[0].y, angle: 90 };

    const fraction = Math.max(0, Math.min(100, vehicleProgress)) / 100;
    const totalLegs = stopPoints.length - 1;
    const legFloat = fraction * totalLegs;
    const legIdx = Math.min(totalLegs - 1, Math.floor(legFloat));
    const legFrac = legFloat - legIdx;

    const from = stopPoints[legIdx];
    const to = stopPoints[legIdx + 1];

    const smoothT = (1 - Math.cos(legFrac * Math.PI)) / 2;
    const x = from.roadX + (to.roadX - from.roadX) * smoothT;
    const y = from.y + (to.y - from.y) * legFrac;

    const dx = to.roadX - from.roadX;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return { x, y, angle };
  }, [stopPoints, vehicleProgress]);

  // Current approaching stop during simulation
  const currentStopName = useMemo(() => {
    if (stops.length === 0) return '';
    const fraction = vehicleProgress / 100;
    const targetIdx = Math.min(stops.length - 1, Math.floor(fraction * stops.length));
    return stops[targetIdx]?.name || '';
  }, [stops, vehicleProgress]);

  // Handle Drag & Drop onto Road
  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (typeof index === 'number') {
      setActiveDropIndex(index);
    }
  };

  const handleDragLeave = () => {
    setActiveDropIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    setActiveDropIndex(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const item = JSON.parse(dataStr);
        const insertIdx = typeof targetIndex === 'number' ? targetIndex : stops.length;
        onInsertStopAt(insertIdx, item);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <div 
      className="relative w-full rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden flex flex-col"
      dir="ltr"
    >
      {/* Top Canvas Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-2xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isAr ? 'خريطة الطريق السياحية والجدول الميداني' : 'Tourist Highway Road Map & Timeline'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {stops.length} {stops.length === 1 ? 'Stop' : 'Stops'}
              </span>
            </div>
            {isSimulatingDrive && currentStopName && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>En route: {currentStopName}</span>
              </p>
            )}
          </div>
        </div>

        {/* View Mode Toggle (Highway vs Timeline) */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('highway')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'highway'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RouteIcon className="w-3.5 h-3.5" />
            <span>{isAr ? 'المسار السريع' : 'Highway Canvas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{isAr ? 'جدول المحطات' : 'Stop Matrix'}</span>
          </button>
        </div>
      </div>

      {/* 1. High-Density Stop Matrix Timeline View */}
      {viewMode === 'timeline' && (
        <div className="p-4 sm:p-6 space-y-3">
          {stops.map((stop, idx) => {
            const dist = distancesToNext[idx];
            return (
              <React.Fragment key={stop.id}>
                <RoadStopMilestoneCard
                  stop={stop}
                  index={idx}
                  totalStops={stops.length}
                  uiLang={uiLang}
                  onRemove={onRemoveStop}
                  onUpdate={onUpdateStop}
                  onMoveUp={idx > 0 ? () => onMoveStop(idx, idx - 1) : undefined}
                  onMoveDown={idx < stops.length - 1 ? () => onMoveStop(idx, idx + 1) : undefined}
                  distanceToNext={dist}
                  isSelected={selectedStopId === stop.id}
                  onSelect={() => setSelectedStopId(stop.id)}
                />

                {idx < stops.length - 1 && (
                  <div className="flex items-center justify-center my-1">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-mono border border-slate-200">
                      <Truck className="w-3 h-3 text-sky-600" />
                      <span>{dist?.distanceText || `${dist?.distanceKm || 25} km`}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{dist?.durationText || `${dist?.durationMinutes || 35} min transit`}</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 2. Visual Highway Canvas View */}
      {viewMode === 'highway' && (
        <div 
          className="relative w-full bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] overflow-x-auto p-4 sm:p-6 shadow-inner"
          onDragOver={e => handleDragOver(e)}
          onDrop={e => handleDrop(e)}
        >
          {/* Canvas Wrapper */}
          <div className="relative mx-auto" style={{ width: canvasWidth, height: canvasHeight }}>
            {/* SVG Highway Vector */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            >
              <defs>
                <linearGradient id="asphaltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                <linearGradient id="shoulderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>

                <filter id="vehicleGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Road Shoulder (Gravel Base) */}
              <path
                d={roadPathD}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="56"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* 2. Main Asphalt Highway */}
              <path
                d={roadPathD}
                fill="none"
                stroke="url(#asphaltGradient)"
                strokeWidth="44"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* 3. Outer Edge Markings */}
              <path
                d={roadPathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="14 10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />

              {/* 4. Dashed Centerline (Highway Yellow) */}
              <path
                d={roadPathD}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3.5"
                strokeDasharray="12 8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Headlights Beam if Simulating */}
              {isSimulatingDrive && (
                <circle
                  cx={vehiclePos.x}
                  cy={vehiclePos.y}
                  r="36"
                  fill="#fef08a"
                  opacity="0.25"
                  filter="url(#vehicleGlow)"
                />
              )}
            </svg>

            {/* Animated Luxury Vehicle Marker */}
            <div
              className="absolute z-25 transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: vehiclePos.x,
                top: vehiclePos.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-amber-400 text-amber-300 flex items-center justify-center shadow-lg shadow-black/40 ring-4 ring-amber-400/25">
                  <Truck className="w-5 h-5 text-amber-400" />
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/95 text-amber-300 text-[9px] font-mono font-bold border border-amber-400/40 shadow-xs flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{isSimulatingDrive ? 'VIP COACH' : 'TOUR BUS'}</span>
                </div>
              </div>
            </div>

            {/* Milestones and Roadside Cards */}
            {stopPoints.map((pt, idx) => {
              const isLeft = pt.isEven;
              const cardWidth = 360;
              const dist = distancesToNext[idx];

              return (
                <React.Fragment key={pt.stop.id}>
                  {/* Pin Marker on the Asphalt Highway */}
                  <div
                    className="absolute z-15 transition-transform hover:scale-110 cursor-pointer"
                    style={{
                      left: pt.roadX,
                      top: pt.y,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => setSelectedStopId(pt.stop.id)}
                  >
                    <div className="relative group">
                      <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-xs flex items-center justify-center border-2 border-white shadow-md">
                        {idx + 1}
                      </div>

                      {/* Connector Line to Roadside Card */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-0.5 bg-slate-400/80 ${
                          isLeft 
                            ? 'right-7 w-12 border-t border-dashed border-slate-500' 
                            : 'left-7 w-12 border-t border-dashed border-slate-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Roadside Stop Card */}
                  <div
                    className="absolute z-10 transition-all duration-200"
                    style={{
                      left: pt.cardLeft,
                      top: pt.y - 45,
                      width: cardWidth,
                    }}
                  >
                    <RoadStopMilestoneCard
                      stop={pt.stop}
                      index={idx}
                      totalStops={stops.length}
                      uiLang={uiLang}
                      onRemove={onRemoveStop}
                      onUpdate={onUpdateStop}
                      onMoveUp={idx > 0 ? () => onMoveStop(idx, idx - 1) : undefined}
                      onMoveDown={idx < stops.length - 1 ? () => onMoveStop(idx, idx + 1) : undefined}
                      distanceToNext={dist}
                      isSelected={selectedStopId === pt.stop.id}
                      onSelect={() => setSelectedStopId(pt.stop.id)}
                    />
                  </div>

                  {/* Mid-Highway Distance Badge & Drop Zone */}
                  {idx < stops.length - 1 && (
                    <div
                      className={`absolute z-20 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border shadow-xs transition-all flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold cursor-pointer ${
                        activeDropIndex === idx + 1
                          ? 'bg-sky-100 border-sky-500 text-sky-800 scale-105 shadow-md'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 hover:border-amber-400'
                      }`}
                      style={{
                        top: (pt.y + stopPoints[idx + 1].y) / 2 - 12,
                      }}
                      onDragOver={e => handleDragOver(e, idx + 1)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, idx + 1)}
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      <span>{dist?.distanceText || `${dist?.distanceKm || 30} km`}</span>
                      <span>·</span>
                      <span>{dist?.durationText || `${dist?.durationMinutes || 40} min`}</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Empty State */}
            {stops.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-white/80 backdrop-blur-xs rounded-2xl border-2 border-dashed border-slate-300 m-8">
                <Truck className="w-12 h-12 text-slate-400 mb-3" />
                <h4 className="text-sm font-bold text-slate-800">
                  {isAr ? 'خريطة الطريق فارغة حالياً' : 'Your Road is Empty'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  {isAr 
                    ? 'اسحب المحطات من الكتالوج الجانبي (فنادق، مزارات أثرية، وجبات) لبدء بناء مسار رحلة الفوج.'
                    : 'Drag objects from the catalog on the left to schedule this group’s itinerary along the road.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
