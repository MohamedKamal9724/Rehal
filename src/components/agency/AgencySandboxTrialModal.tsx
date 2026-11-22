import React, { useState } from 'react';
import { 
  Sparkles, Check, X, Truck, Users, Calendar, 
  MapPin, Shield, RefreshCw, AlertCircle, Play, Building
} from 'lucide-react';
import { Workspace, UILanguage, Quote } from '../../types';
import { TripFile, TripService, saveTrips, loadTrips, newId } from '../../lib/tripStore';
import { repository } from '../../lib/storage';
import { RoadmapTrip, RoadStopObject } from '../../lib/roadmapTypes';
interface AgencySandboxTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  uiLang: UILanguage;
  onSuccessLoaded?: () => void;
}
export const AgencySandboxTrialModal: React.FC<AgencySandboxTrialModalProps> = () => null;
