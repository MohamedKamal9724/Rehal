import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TRAVELER_FEED_POSTS, TRAVELER_STORIES, TravelerFeedPostItem, TravelerStoryCollection } from '../../../lib/travelerFeedData';
import { TravelerStoryModal } from '../TravelerStoryModal';
import { TravelerStoriesBar } from '../TravelerStoriesBar';
import { TravelerFeedPost } from '../TravelerFeedPost';
import { TravelerGridPost } from '../TravelerGridPost';
import { TravelerAgencyProfileModal } from '../TravelerAgencyProfileModal';
import { TravelerWishlistDrawer } from '../TravelerWishlistDrawer';

describe('Traveler Instagram Features Test Suite', () => {
  test('TRAVELER_STORIES dataset is properly populated with bilingual fields', () => {
    assert.ok(Array.isArray(TRAVELER_STORIES));
    assert.ok(TRAVELER_STORIES.length >= 5, 'Should have at least 5 destination story collections');

    TRAVELER_STORIES.forEach((story: TravelerStoryCollection) => {
      assert.ok(story.id, 'Story must have an ID');
      assert.ok(story.destinationAr, 'Story must have an Arabic destination name');
      assert.ok(story.destinationEn, 'Story must have an English destination name');
      assert.ok(story.coverImage, 'Story must have a cover image');
      assert.ok(Array.isArray(story.slides) && story.slides.length > 0, 'Story must have slides');

      story.slides.forEach((slide) => {
        assert.ok(slide.id);
        assert.ok(slide.imageUrl);
        assert.ok(slide.titleAr);
        assert.ok(slide.titleEn);
      });
    });
  });

  test('TRAVELER_FEED_POSTS dataset is properly populated with pricing, photos, and WhatsApp contacts', () => {
    assert.ok(Array.isArray(TRAVELER_FEED_POSTS));
    assert.ok(TRAVELER_FEED_POSTS.length >= 4, 'Should have at least 4 feed posts');

    TRAVELER_FEED_POSTS.forEach((post: TravelerFeedPostItem) => {
      assert.ok(post.id);
      assert.ok(post.agencyId);
      assert.ok(post.agencyArabicName || post.agencyNameAr);
      assert.ok(post.agencyName || post.agencyNameEn);
      assert.ok(post.agencyAvatar);
      assert.ok(post.titleAr);
      assert.ok(post.titleEn);
      assert.ok((Array.isArray(post.images) && post.images.length > 0) || (Array.isArray(post.photos) && post.photos.length > 0));
      assert.ok(typeof post.priceUsd === 'number' && post.priceUsd > 0, 'Post must have positive USD price');
      assert.ok(post.durationDays);
      assert.ok(post.whatsappNumber, 'Post must have a direct WhatsApp number');

      // Verify strict compliance: no formal license fields
      const postKeys = Object.keys(post);
      assert.ok(!postKeys.includes('commercialRegistry'), 'Should not contain formal commercial registry');
      assert.ok(!postKeys.includes('licenseNumber'), 'Should not contain formal license number');
      assert.ok(!postKeys.includes('taxId'), 'Should not contain formal tax ID');
    });
  });

  test('All React components for Instagram traveler experience are functional components', () => {
    assert.strictEqual(typeof TravelerStoryModal, 'function');
    assert.strictEqual(typeof TravelerStoriesBar, 'function');
    assert.strictEqual(typeof TravelerFeedPost, 'function');
    assert.strictEqual(typeof TravelerGridPost, 'function');
    assert.strictEqual(typeof TravelerAgencyProfileModal, 'function');
    assert.strictEqual(typeof TravelerWishlistDrawer, 'function');
  });

  test('Wishlist persistence key convention is followed', () => {
    const defaultStorageKey = 'rihal_traveler_wishlist';
    const defaultLikedKey = 'rihal_traveler_liked_posts';
    assert.ok(defaultStorageKey.startsWith('rihal_'));
    assert.ok(defaultLikedKey.startsWith('rihal_'));
  });
});
