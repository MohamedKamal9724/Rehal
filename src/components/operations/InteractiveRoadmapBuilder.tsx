import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  RoadStopObject, RoadmapTrip, RoadPalettePreset 
} from '../../lib/roadmapTypes';
import { createSampleRoadmapTrip } from '../../lib/roadmapDefaults';
import { RoadCanvasSvg } from './RoadCanvasSvg';
import { RoadObjectPalette } from './RoadObjectPalette';
import { RoadTimelineBar } from './RoadTimelineBar';
import { 
  calculateConsecutiveTourDistanceMatrix 
} from '../../lib/distanceMatrix';
import { GeoPoint } from '../../lib/geoCoordinates';
import { 
  TripFile, TripService, saveTrips, loadTrips, newId 
} from '../../lib/tripStore';
import { Workspace, UILanguage, Quote } from '../../types';
import { 
  Navigation, Users, Calendar, Clock, Truck, Shield, 
  Check, ArrowLeft, Download, Share2, Plus, Sparkles, 
  ChevronRight, AlertCircle, Edit2, Printer
} from 'lucide-react';
import { RoadmapBookletModal } from './RoadmapBookletModal';

interface InteractiveRoadmapBuilderProps {
  workspace: Workspace;
  uiLang: UILanguage;
  initialTrip?: RoadmapTrip | null;
  onClose: () => void;
  onSaveAsTripFile?: (trip: TripFile) => void;
  availableQuotes?: Quote[];
}

export const InteractiveRoadmapBuilder: React.FC<InteractiveRoadmapBuilderProps> = ({
  workspace,
  uiLang,
  initialTrip,
  onClose,
  onSaveAsTripFile,
  availableQuotes = [],
}) => {
  const isAr = uiLang === 'ar';

  // Roadmap State
  const [trip, setTrip] = useState<RoadmapTrip>(() => initialTrip || createSampleRoadmapTrip());
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = all days
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [showMetaEditModal, setShowMetaEditModal] = useState(false);
  const [showBookletModal, setShowBookletModal] = useState(false);

  // Tour Drive Simulation State
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [vehicleProgress, setVehicleProgress] = useState(0); // 0 to 100
  const [driveSpeed, setDriveSpeed] = useState(1); // 1x or 2x
  const simulationTimerRef = useRef<any>(null);

  // Group Details Form State for modal
  const [metaGroupName, setMetaGroupName] = useState(trip.travelerGroupName);
  const [metaPaxCount, setMetaPaxCount] = useState(trip.paxCount);
  const [metaStartDate, setMetaStartDate] = useState(trip.startDate);
  const [metaGuideName, setMetaGuideName] = useState(trip.leadGuideName || '');
  const [metaDriverName, setMetaDriverName] = useState(trip.driverName || '');
  const [metaVehicleType, setMetaVehicleType] = useState(trip.vehicleType || '');

  // Filtered stops based on selected day
  const displayedStops = useMemo(() => {
    if (selectedDay === 0) return trip.stops;
    return trip.stops.filter(s => s.dayNumber === selectedDay);
  }, [trip.stops, selectedDay]);

  // Distance Matrix calculation state for consecutive road stops
  const [distancesToNext, setDistancesToNext] = useState<Record<number, {
    distanceKm: number;
    durationMinutes: number;
    distanceText?: string;
    durationText?: string;
  }>>({});
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState(0);

  // Automatically recalculate distances between consecutive stops
  useEffect(() => {
    if (displayedStops.length < 2) {
      setDistancesToNext({});
      setTotalDistanceKm(0);
      setTotalDurationMinutes(0);
      return;
    }

    const geoPoints: GeoPoint[] = displayedStops.map(s => ({
      name: s.name,
      nameAr: s.nameAr,
      city: s.city,
      type: s.category === 'hotel' ? 'hotel' : s.category === 'sightseeing' ? 'sightseeing' : 'transfer',
      lat: s.coordinates.lat,
      lng: s.coordinates.lng,
    }));

    calculateConsecutiveTourDistanceMatrix(geoPoints, 'driving')
      .then(result => {
        if (result && result.legs) {
          const dict: Record<number, any> = {};
          result.legs.forEach((leg, idx) => {
            dict[idx] = {
              distanceKm: leg.distanceKm,
              durationMinutes: leg.durationMinutes,
              distanceText: leg.distanceText,
              durationText: leg.durationText,
            };
          });
          setDistancesToNext(dict);
          setTotalDistanceKm(result.totalDistanceKm);
          setTotalDurationMinutes(result.totalDurationMinutes);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });
  }, [displayedStops]);

  // Vehicle Simulation Loop
  useEffect(() => {
    if (isSimulatingDrive) {
      simulationTimerRef.current = setInterval(() => {
        setVehicleProgress(prev => {
          if (prev >= 100) {
            setIsSimulatingDrive(false);
            return 100;
          }
          return Math.min(100, prev + 1.2 * driveSpeed);
        });
      }, 50);
    } else {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    }

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, [isSimulatingDrive, driveSpeed]);

  // Handlers for managing road stops
  const handleRemoveStop = (id: string) => {
    setTrip(prev => ({
      ...prev,
      stops: prev.stops.filter(s => s.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateStop = (id: string, patch: Partial<RoadStopObject>) => {
    setTrip(prev => ({
      ...prev,
      stops: prev.stops.map(s => s.id === id ? { ...s, ...patch } : s),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleMoveStop = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= trip.stops.length || toIndex >= trip.stops.length) return;
    const nextStops = [...trip.stops];
    const [moved] = nextStops.splice(fromIndex, 1);
    nextStops.splice(toIndex, 0, moved);
    setTrip(prev => ({
      ...prev,
      stops: nextStops,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddStopFromPreset = (preset: RoadPalettePreset | Partial<RoadStopObject>) => {
    const isPreset = 'defaultDurationMinutes' in preset;
    const newStop: RoadStopObject = {
      id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: preset.name || 'New Tour Stop',
      nameAr: preset.nameAr,
      category: preset.category || 'sightseeing',
      city: preset.city || 'Cairo',
      dayNumber: selectedDay > 0 ? selectedDay : 1,
      time: '11:00 AM',
      durationMinutes: isPreset ? preset.defaultDurationMinutes : (preset.durationMinutes || 60),
      notes: isPreset ? (preset.description || '') : (preset.notes || ''),
      notesAr: isPreset ? (preset.descriptionAr || '') : (preset.notesAr || ''),
      coordinates: preset.coordinates || { lat: 30.0444, lng: 31.2357 },
      supplierName: preset.supplierName,
    };

    setTrip(prev => ({
      ...prev,
      stops: [...prev.stops, newStop],
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleInsertStopAt = (targetIndex: number, item: any) => {
    const newStop: RoadStopObject = {
      id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: item.name || 'Inserted Road Stop',
      nameAr: item.nameAr,
      category: item.category || 'sightseeing',
      city: item.city || 'Cairo',
      dayNumber: selectedDay > 0 ? selectedDay : 1,
      time: '12:00 PM',
      durationMinutes: item.defaultDurationMinutes || 60,
      notes: item.description || '',
      coordinates: item.coordinates || { lat: 30.0444, lng: 31.2357 },
      supplierName: item.supplierName,
    };

    setTrip(prev => {
      const nextStops = [...prev.stops];
      nextStops.splice(targetIndex, 0, newStop);
      return {
        ...prev,
        stops: nextStops,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAddDay = () => {
    setTrip(prev => ({
      ...prev,
      durationDays: prev.durationDays + 1,
      updatedAt: new Date().toISOString(),
    }));
    setSelectedDay(trip.durationDays + 1);
  };

  // Convert roadmap into an official TripFile for Trip Operations
  const handleSaveToTripOperations = () => {
    const existingTrips = loadTrips();

    // Map road stops into TripServices
    const services: TripService[] = trip.stops.map(stop => ({
      id: newId(),
      dayNumber: stop.dayNumber,
      serviceName: stop.name,
      supplierName: stop.supplierName || 'Egyptian Local Partner',
      supplierType: stop.category === 'hotel' ? 'Hotel' : stop.category === 'sightseeing' ? 'Guide' : 'Transport',
      city: stop.city,
      status: 'Confirmed',
      confirmationNo: `CONF-RD-${Math.floor(1000 + Math.random() * 9000)}`,
      note: stop.notes || `${stop.time ? `At ${stop.time}` : ''} (~${stop.durationMinutes || 60}m)`,
    }));

    const tripFile: TripFile = {
      id: trip.id.startsWith('roadmap-') ? `trip-${trip.id.replace('roadmap-', '')}` : trip.id,
      quoteId: trip.quoteId || `quote-${Date.now()}`,
      fileNumber: trip.fileNumber || `EGY-ROAD-${Date.now().toString().slice(-4)}`,
      travelerName: trip.travelerGroupName,
      startDate: trip.startDate,
      durationDays: trip.durationDays,
      status: 'Operating',
      arrival: {
        flight: 'MS 780',
        date: trip.startDate,
        time: '10:00 AM',
        airport: 'Cairo International Airport (CAI)',
        meetAndAssist: true,
      },
      departure: {
        flight: 'MS 781',
        date: new Date(new Date(trip.startDate).getTime() + (trip.durationDays - 1) * 86400000).toISOString().slice(0, 10),
        time: '04:00 PM',
        airport: 'Cairo International Airport (CAI)',
      },
      guideName: trip.leadGuideName || 'Tarek Mansour',
      guidePhone: trip.leadGuidePhone || '+20 100 892 4112',
      guideLanguage: 'English / Spanish',
      driverName: trip.driverName || 'Captain Hisham Zaki',
      driverPhone: trip.driverPhone || '+20 122 341 9885',
      vehicleType: trip.vehicleType || 'Mercedes-Benz Travego VIP Luxury Coach',
      vehiclePlate: trip.vehiclePlate || 'ق هـ ر 8492',
      emergencyContact: workspace.contactPhone || '+20 100 000 0000',
      services,
      passengers: Array.from({ length: trip.paxCount }, (_, i) => ({
        id: `pax-${i + 1}`,
        name: `Traveler ${i + 1} (${trip.travelerGroupName.split(' ')[0]})`,
        nationality: 'Spain',
        type: 'Adult',
        room: `Room ${101 + Math.floor(i / 2)}`,
        dietary: i === 0 ? 'Vegetarian' : '',
      })),
      checklist: [
        { id: 'chk-1', label: 'Roadmap stops confirmed with tourist group', done: true },
        { id: 'chk-2', label: 'Coach vehicle and Egyptologist guide briefed', done: true },
        { id: 'chk-3', label: 'Hotel rooming list dispatched', done: true },
        { id: 'chk-4', label: 'Entrance tickets & timed entry secured', done: true },
      ],
      log: [
        { id: 'log-1', at: new Date().toISOString(), text: `Scheduled road map created with ${trip.stops.length} tour stops across ${trip.durationDays} days.` },
      ],
      updatedAt: new Date().toISOString(),
    };

    // Save and persist
    const updated = [tripFile, ...existingTrips.filter(t => t.id !== tripFile.id)];
    saveTrips(updated);

    if (onSaveAsTripFile) {
      onSaveAsTripFile(tripFile);
    }

    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3500);
  };

  const handleSaveMetaEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrip(prev => ({
      ...prev,
      travelerGroupName: metaGroupName,
      paxCount: Number(metaPaxCount) || 10,
      startDate: metaStartDate,
      leadGuideName: metaGuideName,
      driverName: metaDriverName,
      vehicleType: metaVehicleType,
      updatedAt: new Date().toISOString(),
    }));
    setShowMetaEditModal(false);
  };

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Navigation & Action Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer shrink-0"
            title={isAr ? 'رجوع' : 'Back to Trips'}
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                <Truck className="w-3 h-3 text-amber-700" />
                <span>{isAr ? 'خريطة الطريق التفاعلية' : 'Interactive Road Map'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {trip.fileNumber || 'EGY-ROAD-2026'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {trip.travelerGroupName}
              </h2>
              <button
                type="button"
                onClick={() => setShowMetaEditModal(true)}
                className="p-1 text-slate-400 hover:text-sky-600 transition cursor-pointer"
                title={isAr ? 'تعديل بيانات المجموعة' : 'Edit Group Details'}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <strong>{trip.paxCount}</strong> {isAr ? 'مسافر' : 'tourists'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{trip.startDate} ({trip.durationDays} {isAr ? 'أيام' : 'days'})</span>
              </span>
              {trip.leadGuideName && (
                <>
                  <span>·</span>
                  <span>Guide: {trip.leadGuideName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
          <button
            type="button"
            onClick={() => setShowBookletModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            title="Download printable luxury A4 tour booklet and PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'كتيب الرحلة A4 / PDF' : 'Tour Booklet & PDF'}</span>
          </button>

          {isSavedSuccess && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'تم الحفظ في ملفات الرحلات!' : 'Saved to Trip Operations!'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveToTripOperations}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'حفظ كملف رحلة في العمليات' : 'Save as Operations Trip File'}</span>
          </button>
        </div>
      </div>

      {/* Synchronized Timeline & Stats Bar */}
      <RoadTimelineBar
        stops={trip.stops}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onAddDay={handleAddDay}
        totalDays={trip.durationDays}
        uiLang={uiLang}
        isSimulatingDrive={isSimulatingDrive}
        onToggleSimulate={() => setIsSimulatingDrive(!isSimulatingDrive)}
        onResetSimulate={() => {
          setIsSimulatingDrive(false);
          setVehicleProgress(0);
        }}
        driveSpeed={driveSpeed}
        onChangeSpeed={setDriveSpeed}
        totalDistanceKm={totalDistanceKm}
        totalDurationMinutes={totalDurationMinutes}
      />

      {/* Main Split Grid: Left = Palette, Right = Curving Highway Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Draggable Object Palette */}
        <div className="lg:col-span-4 h-[720px] sticky top-4">
          <RoadObjectPalette
            uiLang={uiLang}
            onAddStop={handleAddStopFromPreset}
            selectedDay={selectedDay > 0 ? selectedDay : 1}
          />
        </div>

        {/* Right Side: The Interactive Curving Highway Canvas */}
        <div className="lg:col-span-8 space-y-3">
          <RoadCanvasSvg
            stops={displayedStops}
            uiLang={uiLang}
            onRemoveStop={handleRemoveStop}
            onUpdateStop={handleUpdateStop}
            onMoveStop={handleMoveStop}
            onInsertStopAt={handleInsertStopAt}
            vehicleProgress={vehicleProgress}
            isSimulatingDrive={isSimulatingDrive}
            distancesToNext={distancesToNext}
          />
        </div>
      </div>

      {/* Group Details Edit Modal */}
      {showMetaEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                {isAr ? 'تعديل بيانات المجموعة والرحلة' : 'Edit Tourist Group & Trip Details'}
              </h4>
              <button
                type="button"
                onClick={() => setShowMetaEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMetaEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  {isAr ? 'اسم وفد / مجموعة السياح' : 'Tourist Group Name'}
                </label>
                <input
                  type="text"
                  value={metaGroupName}
                  onChange={e => setMetaGroupName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isAr ? 'عدد المسافرين (Pax)' : 'Passengers Count (Pax)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={metaPaxCount}
                    onChange={e => setMetaPaxCount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isAr ? 'تاريخ بدء الرحلة' : 'Tour Start Date'}
                  </label>
                  <input
                    type="date"
                    value={metaStartDate}
                    onChange={e => setMetaStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isAr ? 'المرشد السياحي المرافق' : 'Tour Guide Name'}
                  </label>
                  <input
                    type="text"
                    value={metaGuideName}
                    onChange={e => setMetaGuideName(e.target.value)}
                    placeholder="Tarek Mansour"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    {isAr ? 'السائق المعين' : 'Assigned Driver'}
                  </label>
                  <input
                    type="text"
                    value={metaDriverName}
                    onChange={e => setMetaDriverName(e.target.value)}
                    placeholder="Captain Hisham Zaki"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  {isAr ? 'نوع المركبة / الحافلة' : 'Vehicle / Coach Type'}
                </label>
                <input
                  type="text"
                  value={metaVehicleType}
                  onChange={e => setMetaVehicleType(e.target.value)}
                  placeholder="Mercedes Sprinter VIP / Luxury Coach"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMetaEditModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white"
                >
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Traveler Tour Booklet & Road Map PDF Modal */}
      {showBookletModal && (
        <RoadmapBookletModal
          isOpen={showBookletModal}
          onClose={() => setShowBookletModal(false)}
          trip={trip}
          workspace={workspace}
          uiLang={uiLang}
        />
      )}
    </div>
  );
};
