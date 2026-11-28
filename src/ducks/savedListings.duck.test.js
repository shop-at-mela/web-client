import { toggleSaveListing, fetchSavedListings } from './savedListings.duck';

describe('toggleSaveListing: duties_type on saved_listing_toggle', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.localStorage.clear();
  });

  const run = (state, ...args) => {
    const dispatch = jest.fn();
    const getState = () => state;
    const sdk = { currentUser: { updateProfile: jest.fn(() => Promise.resolve({})) } };
    return toggleSaveListing(...args)(dispatch, getState, sdk);
  };

  const anon = { auth: { isAuthenticated: false } };
  const signedIn = { auth: { isAuthenticated: true }, savedListings: { savedListingIds: [] } };

  it('anonymous save carries the duties type', async () => {
    await run(anon, 'l1', { title: 'T' }, 'add_to_cart_button', 'ddu');
    expect(window.dataLayer[0]).toMatchObject({
      event: 'saved_listing_toggle',
      listing_id: 'l1',
      is_saved: true,
      duties_type: 'ddu',
    });
  });

  it('authenticated save carries the duties type', async () => {
    await run(signedIn, 'l1', { title: 'T' }, 'add_to_cart_button', 'ddp');
    expect(window.dataLayer[0]).toMatchObject({ is_saved: true, duties_type: 'ddp' });
  });

  it('sends null when the caller has no brand profile (heart icon on a card without profile data)', async () => {
    await run(anon, 'l2', { title: 'T' }, 'heart_icon');
    expect(window.dataLayer[0]).toHaveProperty('duties_type', null);
    await run(signedIn, 'l3', { title: 'T' }, 'heart_icon', null);
    expect(window.dataLayer[1]).toHaveProperty('duties_type', null);
  });
});

describe('fetchSavedListings', () => {
  it('defines the custom listing-card image variants it requests', async () => {
    const query = jest.fn(() => Promise.resolve({ data: { data: [], included: [] } }));
    await fetchSavedListings(['l1', 'l2'])(jest.fn(), () => ({}), { listings: { query } });
    const params = query.mock.calls[0][0];
    expect(params['fields.image']).toEqual(['variants.listing-card', 'variants.listing-card-2x']);
    expect(params['imageVariant.listing-card']).toBe('w:400;h:300;fit:crop;q:85;f:auto');
    expect(params['imageVariant.listing-card-2x']).toBe('w:800;h:600;fit:crop;q:85;f:auto');
  });

  it('skips the query when there are no ids', async () => {
    const query = jest.fn();
    await fetchSavedListings([])(jest.fn(), () => ({}), { listings: { query } });
    expect(query).not.toHaveBeenCalled();
  });
});
