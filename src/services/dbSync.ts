import type { AgencyDirectoryItem, Inquiry } from '../types';
import type { TripFile } from '../lib/tripStore';

export async function initCloudSync(): Promise<void> {}
export async function getAgencyFromCloud(_id: string): Promise<AgencyDirectoryItem | null> { return null; }
export async function getAllAgenciesFromCloud(): Promise<AgencyDirectoryItem[]> { return []; }
export async function getTripByPasscodeFromCloud(_code: string): Promise<TripFile | null> { return null; }

export async function saveAgencyToCloud(_agency: AgencyDirectoryItem): Promise<void> {
  // Graceful no-op when external cloud database is not provisioned; local repository handles persistence
  return Promise.resolve();
}

export async function saveTripToCloud(_trip: TripFile): Promise<void> {
  return Promise.resolve();
}

export async function deleteTripFromCloud(_id: string): Promise<void> {
  return Promise.resolve();
}

export async function saveInquiryToCloud(_inquiry: Inquiry): Promise<void> {
  return Promise.resolve();
}

