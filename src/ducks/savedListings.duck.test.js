import { toggleSaveListing } from './savedListings.duck';

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
