import { pushSaveToggle } from './savedListings';

describe('pushSaveToggle(params)', () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it('pushes a saved_listing_toggle event with save_source, listing_id and is_saved', () => {
    pushSaveToggle({ source: 'add_to_cart_button', listingId: 'listing-uuid-1', isSaved: true });

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer[0]).toMatchObject({
      event: 'saved_listing_toggle',
      save_source: 'add_to_cart_button',
      listing_id: 'listing-uuid-1',
      is_saved: true,
    });
  });

  it('does not push a `source` key (GA4 reads an event parameter named source as traffic source)', () => {
    pushSaveToggle({ source: 'heart_icon', listingId: 'listing-uuid-2', isSaved: false });

    expect(window.dataLayer[0]).not.toHaveProperty('source');
    expect(window.dataLayer[0].save_source).toBe('heart_icon');
  });

  it('defaults save_source to heart_icon when no source is given', () => {
    pushSaveToggle({ listingId: 'listing-uuid-3', isSaved: true });

    expect(window.dataLayer[0].save_source).toBe('heart_icon');
  });

  it('pushes explicit null for a missing listing id and coerces is_saved to a boolean', () => {
    pushSaveToggle({ source: 'heart_icon' });

    expect(window.dataLayer[0].listing_id).toBeNull();
    expect(window.dataLayer[0].is_saved).toBe(false);
  });
});
