import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  searchAndPriceLiveHotels,
  fetchHotelInventory,
  fetchHotelImages,
  buildDirectBookingUrl,
  RAW_EGYPT_HOTEL_INVENTORY,
} from '../../../lib/liveHotelService';
import { HotelSearchEngine } from '../HotelSearchEngine';
import { HotelRoomingListsView } from '../HotelRoomingListsView';

describe('HotelSearchEngine, Google Maps Coordinates & Hotel Image Carousel API', () => {
  it('exports HotelSearchEngine and HotelRoomingListsView as functional components', () => {
    assert.equal(typeof HotelSearchEngine, 'function');
    assert.equal(typeof HotelRoomingListsView, 'function');
  });

  it('includes valid geographic coordinates (lat, lng) for every hotel in the inventory', () => {
    for (const hotel of RAW_EGYPT_HOTEL_INVENTORY) {
      assert.ok(hotel.coordinates, `Hotel ${hotel.id} should have coordinates`);
      assert.equal(typeof hotel.coordinates.lat, 'number');
      assert.equal(typeof hotel.coordinates.lng, 'number');
      assert.ok(hotel.coordinates.lat >= 22 && hotel.coordinates.lat <= 32, 'Latitude within Egypt bounds');
      assert.ok(hotel.coordinates.lng >= 24 && hotel.coordinates.lng <= 36, 'Longitude within Egypt bounds');
    }
  });

  it('returns filtered hotels with live pricing, coordinates, galleryUrls, and directBookingUrl', () => {
    const luxorHotels = searchAndPriceLiveHotels({
      region: 'Luxor',
      checkIn: '2026-11-20',
      checkOut: '2026-11-24',
      mealPlan: 'HB',
    });

    assert.ok(luxorHotels.length > 0, 'Should return Luxor hotels');
    for (const h of luxorHotels) {
      assert.equal(h.regionId, 'Luxor');
      assert.equal(h.nights, 4);
      assert.ok(typeof h.coordinates.lat === 'number' && typeof h.coordinates.lng === 'number');
      assert.ok(Array.isArray(h.galleryUrls) && h.galleryUrls.length >= 4, 'Should include multi-photo carousel');
      assert.ok(Array.isArray(h.roomOptions) && h.roomOptions.length === 3, 'Should include SGL, DBL, SUITE options');
      assert.ok(h.directBookingUrl && h.directBookingUrl.includes('booking.com'), 'Should generate direct booking link');
    }
  });

  it('fetches hotel carousel images asynchronously via fetchHotelImages', async () => {
    const images = await fetchHotelImages('htl_cai_mena_house');
    assert.ok(Array.isArray(images), 'Should return an array of image URLs');
    assert.ok(images.length >= 4, 'Should return at least 4 carousel photos');
    assert.ok(images.every((url) => typeof url === 'string' && url.startsWith('https://')));
  });

  it('resolves fetchHotelInventory asynchronously with fallback support', async () => {
    const result = await fetchHotelInventory({ region: 'Cairo', mealPlan: 'BB' });
    assert.ok(Array.isArray(result.hotels));
    assert.ok(result.hotels.length > 0);
    assert.ok(typeof result.syncedAt === 'string');
  });

  it('builds a valid direct booking URL with check-in, check-out, and guest parameters', () => {
    const sample = RAW_EGYPT_HOTEL_INVENTORY[0];
    const url = buildDirectBookingUrl(sample, '2026-12-01', '2026-12-05', 3, 6);
    assert.ok(url.includes('checkin=2026-12-01'));
    assert.ok(url.includes('checkout=2026-12-05'));
    assert.ok(url.includes('no_rooms=3'));
    assert.ok(url.includes('group_adults=6'));
  });
});
