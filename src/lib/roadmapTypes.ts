export type RoadStopCategory = 'hotel' | 'sightseeing' | 'meal' | 'photo_stop' | 'transfer';

export interface RoadStopObject {
  id: string;
  name: string;
  nameAr?: string;
  category: RoadStopCategory;
  city: string;
  dayNumber: number;
  time?: string; // e.g. "09:00 AM"
  durationMinutes?: number; // e.g. 120
  notes?: string;
  notesAr?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  supplierName?: string;
  photoUrl?: string;
  rating?: number;
  isCustom?: boolean;
}

export interface RoadmapTrip {
  id: string;
  tripName: string;
  travelerGroupName: string;
  paxCount: number;
  startDate: string;
  durationDays: number;
  leadGuideName?: string;
  leadGuidePhone?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  stops: RoadStopObject[];
  createdAt: string;
  updatedAt: string;
  quoteId?: string;
  fileNumber?: string;
}

export interface RoadPalettePreset {
  id: string;
  name: string;
  nameAr: string;
  category: RoadStopCategory;
  city: string;
  defaultDurationMinutes: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  supplierName?: string;
  description?: string;
  descriptionAr?: string;
  iconName?: string;
}
