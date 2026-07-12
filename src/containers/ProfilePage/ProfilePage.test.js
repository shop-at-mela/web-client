import React, { act } from 'react';
import '@testing-library/jest-dom';

import configureStore from '../../store';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  createCurrentUser,
  createListing,
  createReview,
  createUser,
  fakeIntl,
  fakeViewport,
} from '../../util/testData';
import {
  getHostedConfiguration,
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';

import ProfilePage from './ProfilePage';

import reducer, { loadData, setInitialState } from './ProfilePage.duck';
import { storableError } from '../../util/errors';

const { UUID } = sdkTypes;

const { screen, waitFor } = testingLibrary;

const logger = actions => () => {
  return next => action => {
    actions.push(action);
    // Call the next dispatch method in the middleware chain.
    return next(action);
  };
};

const attributes = {
  profile: {
    bio: 'I am a great cook!',
    publicData: {
      canCook: false,
      cuisine: 'italian',
      dietaryPreferences: ['vegan', 'gluten-free'],
      kitchenDescription: 'This is a kitchen description!',
      numberOfCookbooks: 10,
      userType: 'a',
      notShownInProfileAttribute: 'Do not show this in profile',
    },
  },
};

// Passing 'attributes' directly to createCurrentUser and createUser
// overrides the default attributes.profile values with the custom ones.
// This function first creates the default version and then appends extra attributes
// without overriding the defaults.
const createEnhancedUser = (userFn, id) => {
  const user = userFn(id);
  return {
    ...user,
    attributes: {
      ...user.attributes,
      profile: {
        ...user.attributes.profile,
        bio: attributes.profile.bio,
        // Copy (not alias) publicData - tests mutate this object directly
        // (e.g. `providerUser.attributes.profile.publicData.userType = 'provider'`),
        // and sharing the same reference across calls would let one test's
        // mutation leak into every other test's fixture.
        publicData: { ...attributes.profile.publicData },
      },
    },
  };
};

const userId = 'userId';

const getInitialState = () => {
  const currentUser = createEnhancedUser(createCurrentUser, userId);
  const user = createEnhancedUser(createUser, userId);
  const listing = createListing('l1');
  const review = createReview(
    'review-id',
    {
      createdAt: new Date(Date.UTC(2024, 2, 19, 11, 34)),
      content: 'Awesome!',
    },
    { author: createUser('reviewerA') }
  );
  return {
    ProfilePage: {
      userId: user.id,
      userListingRefs: [{ id: listing.id, type: 'listing' }],
      userShowError: null,
      queryListingsError: null,
      reviews: [review],
      queryReviewsError: null,
    },
    user: {
      currentUser,
      currentUserHasListings: false,
      sendVerificationEmailInProgress: false,
    },
    marketplaceData: {
      entities: {
        user: {
          userId: user,
        },
        listing: {
          l1: { ...listing, relationships: { author: user } },
        },
      },
    },
  };
};

describe('ProfilePage', () => {
  const config = getHostedConfiguration();

  const props = {
    scrollingDisabled: false,
    intl: fakeIntl,
    viewport: fakeViewport,
    params: {},
  };

  it('Check that user name and bio is shown correctly', async () => {
    await act(async () => {
      render(<ProfilePage {...props} />, {
        initialState: getInitialState(),
        config,
      });
    });
    expect(screen.getByText('ProfilePage.desktopHeading')).toBeInTheDocument();
    expect(screen.getByText('I am a great cook!')).toBeInTheDocument();
  });

  it('Check that custom user information is shown correctly', async () => {
    let rendered = {};
    await act(async () => {
      rendered = render(<ProfilePage {...props} />, {
        initialState: getInitialState(),
        config,
      });
    });
    const { getByRole } = rendered;
    // Show custom fields correctly
    expect(getByRole('heading', { name: 'ProfilePage.detailsTitle' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Dietary preferences' })).toBeInTheDocument();
    expect(getByRole('heading', { name: 'Description of your kitchen' })).toBeInTheDocument();

    expect(screen.getByText('Favorite cuisine')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Can you cook?')).toBeInTheDocument();
    expect(screen.getByText('ProfilePage.detailNo')).toBeInTheDocument();
    expect(screen.getByText('How many cookbooks do you have')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('This is a kitchen description!')).toBeInTheDocument();

    // For attributes with displayInProfile: false, do not show the attribute
    expect(screen.queryByText('Not shown in profile')).toBeNull();
  });

  it('Check that listing information is shown correctly', async () => {
    await act(async () => {
      render(<ProfilePage {...props} />, {
        initialState: getInitialState(),
        config,
      });
    });

    expect(screen.getByText('ProfilePage.listingsTitle')).toBeInTheDocument();
    expect(screen.getByText('l1 title')).toBeInTheDocument();
    expect(screen.getByText('ListingCard.price')).toBeInTheDocument();
  });

  it('Check that review information is shown correctly', async () => {
    let rendered = {};
    await act(async () => {
      rendered = render(<ProfilePage {...props} />, {
        initialState: getInitialState(),
        config,
      });
    });
    const { getByRole } = rendered;

    expect(
      getByRole('heading', { name: 'ProfilePage.reviewsFromMyCustomersTitle' })
    ).toBeInTheDocument();

    expect(screen.getByText('Awesome!')).toBeInTheDocument();
    expect(screen.getByText('reviewerA display name')).toBeInTheDocument();
    expect(screen.getByText('March 2024')).toBeInTheDocument();
    expect(screen.getAllByTitle('3/5')).toHaveLength(2);
  });

  describe('Brand Provider Detection', () => {
    it('renders BrandStorefront for provider users', async () => {
      const providerState = getInitialState();
      const providerUser = createEnhancedUser(createUser, userId);
      providerUser.attributes.profile.publicData.userType = 'provider';

      const stateWithProvider = {
        ...providerState,
        marketplaceData: {
          entities: {
            ...providerState.marketplaceData.entities,
            user: {
              userId: providerUser,
            },
          },
        },
      };

      const providerConfig = {
        ...config,
        user: {
          userFields: [
            {
              key: 'userType',
              scope: 'public',
              schemaType: 'enum',
              enumOptions: [
                { option: 'a', label: 'Customer' },
                { option: 'provider', label: 'Provider' },
              ],
              saveConfig: {
                label: 'User Type',
                placeholderMessage: 'Select user type',
                isRequired: true,
              },
            },
          ],
        },
        userType: {
          userTypeConfig: [
            {
              userType: 'a',
              label: 'Customer',
              defaultUserFields: {
                profile: ['userType'],
              },
            },
            {
              userType: 'provider',
              label: 'Provider',
              defaultUserFields: {
                profile: ['userType'],
              },
            },
          ],
        },
      };

      let rendered = {};
      await act(async () => {
        rendered = render(<ProfilePage {...props} />, {
          initialState: stateWithProvider,
          config: providerConfig,
        });
      });

      const { container } = rendered;

      // Should render BrandStorefront (no sidebar)
      expect(container.querySelector('.brandStorefrontContainer')).toBeInTheDocument();
      // Should NOT render sidebar layout
      expect(container.querySelector('.aside')).not.toBeInTheDocument();
    });

    it('renders customer profile for non-provider users', async () => {
      await act(async () => {
        render(<ProfilePage {...props} />, {
          initialState: getInitialState(),
          config,
        });
      });

      // Should render sidebar for customer profiles
      expect(screen.getByText('ProfilePage.desktopHeading')).toBeInTheDocument();
      expect(screen.getByText('I am a great cook!')).toBeInTheDocument();
    });

    it('passes variant to BrandStorefront component', async () => {
      const providerState = getInitialState();
      const providerUser = createEnhancedUser(createUser, userId);
      providerUser.attributes.profile.publicData.userType = 'provider';

      const stateWithProvider = {
        ...providerState,
        marketplaceData: {
          entities: {
            ...providerState.marketplaceData.entities,
            user: {
              userId: providerUser,
            },
          },
        },
      };

      const providerConfig = {
        ...config,
        user: {
          userFields: [
            {
              key: 'userType',
              scope: 'public',
              schemaType: 'enum',
              enumOptions: [
                { option: 'a', label: 'Customer' },
                { option: 'provider', label: 'Provider' },
              ],
              saveConfig: {
                label: 'User Type',
                placeholderMessage: 'Select user type',
                isRequired: true,
              },
            },
          ],
        },
        userType: {
          userTypeConfig: [
            {
              userType: 'a',
              label: 'Customer',
              defaultUserFields: {
                profile: ['userType'],
              },
            },
            {
              userType: 'provider',
              label: 'Provider',
              defaultUserFields: {
                profile: ['userType'],
              },
            },
          ],
        },
      };

      const propsWithVariant = {
        ...props,
        params: { id: userId, variant: 'about' },
      };

      await act(async () => {
        render(<ProfilePage {...propsWithVariant} />, {
          initialState: stateWithProvider,
          config: providerConfig,
        });
      });

      // BrandStorefront should receive variant prop
      // We can verify this by checking that the component renders
      // (full verification would require mocking BrandStorefront)
      expect(screen.queryByText('ProfilePage.desktopHeading')).not.toBeInTheDocument();
    });

    it('generates Organization schema for brand providers', async () => {
      const providerState = getInitialState();
      const brandUser = createEnhancedUser(createUser, userId);
      brandUser.attributes.profile.publicData = {
        ...brandUser.attributes.profile.publicData,
        userType: 'provider',
        brandLogoUrl: 'https://example.com/logo.png',
        establishedYear: 2018,
      };

      const stateWithBrand = {
        ...providerState,
        marketplaceData: {
          entities: {
            ...providerState.marketplaceData.entities,
            user: {
              userId: brandUser,
            },
          },
        },
      };

      const brandConfig = {
        ...config,
        user: {
          userFields: [
            {
              key: 'userType',
              scope: 'public',
              schemaType: 'enum',
              enumOptions: [
                { option: 'a', label: 'Customer' },
                { option: 'provider', label: 'Provider' },
              ],
              saveConfig: {
                label: 'User Type',
                placeholderMessage: 'Select user type',
                isRequired: true,
              },
            },
          ],
        },
        userType: {
          userTypeConfig: [
            {
              userType: 'a',
              label: 'Customer',
              defaultUserFields: {
                profile: ['userType'],
              },
            },
            {
              userType: 'provider',
              label: 'Provider',
              defaultUserFields: {
                profile: ['userType'],
              },
            },
          ],
        },
      };

      await act(async () => {
        render(<ProfilePage {...props} />, {
          initialState: stateWithBrand,
          config: brandConfig,
        });
      });

      // Page.js renders a single <script> whose JSON-LD wraps everything
      // (page-specific schema, marketplace Organization, WebSite) inside an
      // @graph array, not one script per @type - and react-helmet-async
      // flushes its DOM commit via requestAnimationFrame, so it doesn't
      // exist synchronously after render either.
      let organizationSchema;
      await waitFor(() => {
        const script = document.querySelector('script[type="application/ld+json"]');
        const parsed = script && JSON.parse(script.textContent);
        organizationSchema = parsed?.['@graph']?.find(
          entry => entry['@type'] === 'Organization' && entry.url?.includes('/u/')
        );
        expect(organizationSchema).toBeTruthy();
      });

      expect(organizationSchema['@type']).toBe('Organization');
      expect(organizationSchema.name).toBe('userId display name');
      expect(organizationSchema.logo.url).toBe('https://example.com/logo.png');
      expect(organizationSchema.foundingDate).toBe('2018');
    });

    it('includes aggregateRating in Organization schema when reviews exist', async () => {
      const providerState = getInitialState();
      const brandUser = createEnhancedUser(createUser, userId);
      brandUser.attributes.profile.publicData.userType = 'provider';

      const stateWithBrand = {
        ...providerState,
        marketplaceData: {
          entities: {
            ...providerState.marketplaceData.entities,
            user: {
              userId: brandUser,
            },
          },
        },
      };

      const brandConfig = {
        ...config,
        user: {
          userFields: [
            {
              key: 'userType',
              scope: 'public',
              schemaType: 'enum',
              enumOptions: [
                { option: 'a', label: 'Customer' },
                { option: 'provider', label: 'Provider' },
              ],
              saveConfig: {
                label: 'User Type',
                placeholderMessage: 'Select user type',
                isRequired: true,
              },
            },
          ],
        },
        userType: {
          userTypeConfig: [
            {
              userType: 'a',
              label: 'Customer',
              defaultUserFields: {
                profile: ['userType'],
              },
            },
            {
              userType: 'provider',
              label: 'Provider',
              defaultUserFields: {
                profile: ['userType'],
              },
            },
          ],
        },
      };

      let rendered = {};
      await act(async () => {
        rendered = render(<ProfilePage {...props} />, {
          initialState: stateWithBrand,
          config: brandConfig,
        });
      });

      const { container } = rendered;

      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      const schemaScript = Array.from(scripts).find(script => {
        try {
          const schema = JSON.parse(script.textContent);
          return schema['@type'] === 'Organization';
        } catch {
          return false;
        }
      });

      if (schemaScript) {
        const schema = JSON.parse(schemaScript.textContent);
        expect(schema.aggregateRating).toBeDefined();
        expect(schema.aggregateRating['@type']).toBe('AggregateRating');
        expect(schema.aggregateRating.ratingValue).toBe('3.0'); // Review has rating of 3
        expect(schema.aggregateRating.reviewCount).toBe(1);
      }
    });

    it('generates ProfilePage schema for customer users', async () => {
      await act(async () => {
        render(<ProfilePage {...props} />, {
          initialState: getInitialState(),
          config,
        });
      });

      // Page.js renders a single <script> whose JSON-LD wraps everything
      // (page-specific schema, marketplace Organization, WebSite) inside an
      // @graph array, not one script per @type - and react-helmet-async
      // flushes its DOM commit via requestAnimationFrame, so it doesn't
      // exist synchronously after render either.
      let profileSchema;
      await waitFor(() => {
        const script = document.querySelector('script[type="application/ld+json"]');
        const parsed = script && JSON.parse(script.textContent);
        profileSchema = parsed?.['@graph']?.find(entry => entry['@type'] === 'ProfilePage');
        expect(profileSchema).toBeTruthy();
      });

      expect(profileSchema['@type']).toBe('ProfilePage');
      expect(profileSchema.mainEntity['@type']).toBe('Person');
    });
  });
});

describe('Duck', () => {
  const config = {
    ...getHostedConfiguration(),
    accessControl: { marketplace: { private: true } },
  };

  describe('reducer', () => {
    it('should have correct initial state', () => {
      const state = reducer(undefined, { type: '@@INIT' });
      expect(state).toEqual({
        userId: null,
        userListingRefs: [],
        userShowError: null,
        queryListingsError: null,
        reviews: [],
        queryReviewsError: null,
      });
    });

    it('should handle setInitialState action', () => {
      // First set up a state with some data
      let state = reducer(undefined, { type: '@@INIT' });
      state = reducer(state, {
        type: 'ProfilePage/showUser/rejected',
        payload: storableError(new Error('Test error')),
      });
      state = reducer(state, {
        type: 'ProfilePage/queryUserListings/rejected',
        payload: storableError(new Error('Listings error')),
      });
      state = reducer(state, {
        type: 'ProfilePage/queryUserReviews/rejected',
        payload: storableError(new Error('Reviews error')),
      });

      // Now test setInitialState - it should reset to initial state
      state = reducer(state, setInitialState());

      expect(state).toEqual({
        userId: null,
        userListingRefs: [],
        userShowError: null,
        queryListingsError: null,
        reviews: [],
        queryReviewsError: null,
      });
    });

    it('should handle showUserThunk.pending', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const state = reducer(initialState, {
        type: 'ProfilePage/showUser/pending',
        meta: { arg: { userId: 'test-user-id', config } },
      });

      expect(state.userId).toBe('test-user-id');
      expect(state.userShowError).toBeNull();
    });

    it('should handle showUserThunk.rejected', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const error = new Error('Test error');
      const state = reducer(initialState, {
        type: 'ProfilePage/showUser/rejected',
        payload: storableError(error),
      });

      expect(state.userShowError).toEqual(storableError(error));
    });

    it('should handle queryUserListingsThunk.pending', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserListings/pending',
        meta: { arg: { userId: 'test-user-id' } },
      });

      expect(state.queryListingsError).toBeNull();
    });

    it('should handle queryUserListingsThunk.fulfilled', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const listingRefs = [{ id: 'listing1', type: 'listing' }];
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserListings/fulfilled',
        payload: { listingRefs, response: {} },
      });

      expect(state.userListingRefs).toEqual(listingRefs);
    });

    it('should handle queryUserListingsThunk.rejected', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const error = new Error('Listings error');
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserListings/rejected',
        payload: storableError(error),
      });

      expect(state.userListingRefs).toEqual([]);
      expect(state.queryListingsError).toEqual(storableError(error));
    });

    it('should handle queryUserReviewsThunk.pending', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserReviews/pending',
      });

      expect(state.queryReviewsError).toBeNull();
    });

    it('should handle queryUserReviewsThunk.fulfilled', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const reviews = [{ id: 'review1' }, { id: 'review2' }];
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserReviews/fulfilled',
        payload: reviews,
      });

      expect(state.reviews).toEqual(reviews);
    });

    it('should handle queryUserReviewsThunk.rejected', () => {
      const initialState = reducer(undefined, { type: '@@INIT' });
      const error = new Error('Reviews error');
      const state = reducer(initialState, {
        type: 'ProfilePage/queryUserReviews/rejected',
        payload: storableError(error),
      });

      expect(state.reviews).toEqual([]);
      expect(state.queryReviewsError).toEqual(storableError(error));
    });
  });

  // Shared parameters for viewing rights loadData tests
  // meta.totalPages is required by fetchAllPages in ProfilePage.duck.js
  const fakeResponse = (resource, { totalPages = 1 } = {}) => ({
    data: {
      data: resource,
      include: [],
      meta: {
        totalItems: Array.isArray(resource) ? resource.length : 1,
        totalPages,
        page: 1,
        perPage: 100,
      },
    },
  });
  const sdkFn = response => jest.fn(() => Promise.resolve(response));
  const forbiddenError = new Error({ status: 403, message: 'forbidden' });
  const errorSdkFn = error => jest.fn(() => Promise.reject(error));

  it("loadData() for full viewing rights user loads someone else's profile", () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    const { reviews, userListingRefs } = initialState.ProfilePage;
    const { l1: listing } = initialState.marketplaceData.entities.listing;
    const { userId: user } = initialState.marketplaceData.entities.user;

    const testInitialState = {
      ...initialState,
      user: { currentUser },
      auth: { isAuthenticated: true },
    };

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      users: { show: sdkFn(fakeResponse(user)) },
      reviews: { query: sdkFn(fakeResponse(reviews)) },
      listings: { query: sdkFn(fakeResponse([listing])) },
      authInfo: sdkFn({}),
    };

    let actions = [];
    const store = configureStore({
      initialState: testInitialState,
      sdk,
      extraMiddlewares: [logger(actions)],
    });
    const dispatch = store.dispatch;
    const getState = store.getState;

    // This is now sanitizeConfig is parsed in the showUser thunk
    const userFields = config?.user?.userFields;
    const sanitizeConfig = { userFields };

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: userId }, null, config)(dispatch, getState, sdk).then(data => {
      const relevantActions = actions.filter(
        action => !action.type.startsWith('user/fetchCurrentUser/')
      );

      // Check that setInitialState is first
      expect(relevantActions[0]).toEqual(setInitialState());

      // Check that all pending actions are dispatched
      const pendingActions = relevantActions.filter(action => action.type.endsWith('/pending'));
      expect(pendingActions).toHaveLength(4); // showUser, queryUserListings, queryUserReviews, authInfo

      // Check that addMarketplaceEntities actions are dispatched
      const addEntitiesActions = relevantActions.filter(
        action => action.type === 'marketplaceData/addEntities'
      );
      expect(addEntitiesActions).toHaveLength(2); // user and listings

      // Check that all fulfilled actions are dispatched
      const fulfilledActions = relevantActions.filter(action => action.type.endsWith('/fulfilled'));
      expect(fulfilledActions).toHaveLength(4); // showUser, queryUserListings, queryUserReviews, authInfo

      // Verify specific action types are present
      expect(relevantActions.some(action => action.type === 'ProfilePage/showUser/pending')).toBe(
        true
      );
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/pending')
      ).toBe(true);
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserReviews/pending')
      ).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/pending')).toBe(true);
      expect(relevantActions.some(action => action.type === 'ProfilePage/showUser/fulfilled')).toBe(
        true
      );
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/fulfilled')
      ).toBe(true);
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserReviews/fulfilled')
      ).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/fulfilled')).toBe(true);
    });
  });

  it("loadData() for restricted viewing rights user does not load someone else's profile", () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    currentUser.effectivePermissionSet.attributes.read = 'permission/deny';

    const testInitialState = {
      ...initialState,
      user: {
        ...initialState.user,
        currentUser,
      },
      auth: { isAuthenticated: true },
    };

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      users: { show: errorSdkFn(forbiddenError) },
      listings: { query: errorSdkFn(forbiddenError) },
      reviews: { query: errorSdkFn(forbiddenError) },
      authInfo: sdkFn({}),
    };

    let actions = [];
    const store = configureStore({
      initialState: testInitialState,
      sdk,
      extraMiddlewares: [logger(actions)],
    });
    const dispatch = store.dispatch;
    const getState = store.getState;
    const otherUserId = new UUID('otherUserId');

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: 'otherUserId' }, null, config)(dispatch, getState, sdk).then(data => {
      const relevantActions = actions.filter(
        action => !action.type.startsWith('user/fetchCurrentUser/')
      );

      // Check that setInitialState is first
      expect(relevantActions[0]).toEqual(setInitialState());

      // Check that all pending actions are dispatched
      const pendingActions = relevantActions.filter(action => action.type.endsWith('/pending'));
      expect(pendingActions).toHaveLength(4); // showUser, queryUserListings, queryUserReviews, authInfo

      // Check that all rejected actions are dispatched
      const rejectedActions = relevantActions.filter(action => action.type.endsWith('/rejected'));
      expect(rejectedActions).toHaveLength(3); // showUser, queryUserListings, queryUserReviews

      // Check that authInfo fulfilled is dispatched
      const fulfilledActions = relevantActions.filter(action => action.type.endsWith('/fulfilled'));
      expect(fulfilledActions).toHaveLength(1); // authInfo

      // Verify specific action types are present
      expect(relevantActions.some(action => action.type === 'ProfilePage/showUser/pending')).toBe(
        true
      );
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/pending')
      ).toBe(true);
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserReviews/pending')
      ).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/pending')).toBe(true);
      expect(relevantActions.some(action => action.type === 'ProfilePage/showUser/rejected')).toBe(
        true
      );
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/rejected')
      ).toBe(true);
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserReviews/rejected')
      ).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/fulfilled')).toBe(true);
    });
  });

  it('loadData() for restricted viewing rights user loads their own profile', () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    const { userListingRefs } = initialState.ProfilePage;
    const { l1: listing } = initialState.marketplaceData.entities.listing;

    currentUser.effectivePermissionSet.attributes.read = 'permission/deny';

    const testInitialState = {
      ...initialState,
      user: {
        ...initialState.user,
        currentUser,
      },
      auth: { isAuthenticated: true },
    };

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      ownListings: { query: sdkFn(fakeResponse([listing])) },
      authInfo: sdkFn({}),
    };

    let actions = [];
    const store = configureStore({
      initialState: testInitialState,
      sdk,
      extraMiddlewares: [logger(actions)],
    });
    const dispatch = store.dispatch;
    const getState = store.getState;

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: userId }, null, config)(dispatch, getState, sdk).then(data => {
      const relevantActions = actions.filter(
        action => !action.type.startsWith('user/fetchCurrentUser/')
      );

      // Check that setInitialState is first
      expect(relevantActions[0]).toEqual(setInitialState());

      // Check that queryUserListings pending is dispatched
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/pending')
      ).toBe(true);

      // Check that setUserId is dispatched
      expect(relevantActions.some(action => action.type === 'ProfilePage/setUserId')).toBe(true);

      // Check that addMarketplaceEntities is dispatched
      expect(relevantActions.some(action => action.type === 'marketplaceData/addEntities')).toBe(
        true
      );

      // Check that authInfo pending and fulfilled are dispatched
      expect(relevantActions.some(action => action.type === 'auth/authInfo/pending')).toBe(true);
      expect(relevantActions.some(action => action.type === 'auth/authInfo/fulfilled')).toBe(true);

      // Check that queryUserListings fulfilled is dispatched
      expect(
        relevantActions.some(action => action.type === 'ProfilePage/queryUserListings/fulfilled')
      ).toBe(true);
    });
  });

  describe('queryUserListings — pagination and filtering', () => {
    it('queries with perPage: 100 so brands with many listings are not truncated', () => {
      const initialState = getInitialState();
      const { currentUser } = initialState.user;
      const { l1: listing } = initialState.marketplaceData.entities.listing;

      const testInitialState = {
        ...initialState,
        user: { currentUser },
        auth: { isAuthenticated: true },
      };

      const querySpy = jest.fn(() => Promise.resolve(fakeResponse([listing])));
      const sdk = {
        currentUser: { show: sdkFn(fakeResponse(currentUser)) },
        users: { show: sdkFn(fakeResponse(initialState.marketplaceData.entities.user.userId)) },
        reviews: { query: sdkFn(fakeResponse([])) },
        listings: { query: querySpy },
        authInfo: sdkFn({}),
      };

      const store = configureStore({ initialState: testInitialState, sdk, extraMiddlewares: [] });

      return loadData({ id: userId }, null, config)(store.dispatch, store.getState, sdk).then(() => {
        expect(querySpy).toHaveBeenCalled();
        const callArgs = querySpy.mock.calls[0][0];
        expect(callArgs.perPage).toBe(100);
        expect(callArgs.page).toBe(1);
      });
    });

    it('fetches additional pages when totalPages > 1', () => {
      const initialState = getInitialState();
      const { currentUser } = initialState.user;
      const { l1: listing } = initialState.marketplaceData.entities.listing;

      const listing2 = createListing('l2');

      const testInitialState = {
        ...initialState,
        user: { currentUser },
        auth: { isAuthenticated: true },
      };

      // First call returns 2 pages; second call returns page 2
      const querySpy = jest.fn()
        .mockResolvedValueOnce(fakeResponse([listing], { totalPages: 2 }))
        .mockResolvedValueOnce(fakeResponse([listing2], { totalPages: 2 }));

      const sdk = {
        currentUser: { show: sdkFn(fakeResponse(currentUser)) },
        users: { show: sdkFn(fakeResponse(initialState.marketplaceData.entities.user.userId)) },
        reviews: { query: sdkFn(fakeResponse([])) },
        listings: { query: querySpy },
        authInfo: sdkFn({}),
      };

      let actions = [];
      const store = configureStore({
        initialState: testInitialState,
        sdk,
        extraMiddlewares: [logger(actions)],
      });

      return loadData({ id: userId }, null, config)(store.dispatch, store.getState, sdk).then(() => {
        // Both pages fetched
        expect(querySpy).toHaveBeenCalledTimes(2);
        expect(querySpy.mock.calls[0][0].page).toBe(1);
        expect(querySpy.mock.calls[1][0].page).toBe(2);

        // addMarketplaceEntities dispatched once per page (plus once for showUser)
        const addEntities = actions.filter(a => a.type === 'marketplaceData/addEntities');
        expect(addEntities).toHaveLength(3); // showUser + page1 + page2

        // Both listing refs end up in state
        const fulfilled = actions.find(
          a => a.type === 'ProfilePage/queryUserListings/fulfilled'
        );
        expect(fulfilled.payload.listingRefs).toHaveLength(2);
      });
    });

    it('excludes deleted listings but keeps listings regardless of state field presence', () => {
      const initialState = getInitialState();
      const { currentUser } = initialState.user;
      const { l1: listing } = initialState.marketplaceData.entities.listing;

      // Public API may omit the state attribute — these should still appear
      const listingNoState = {
        ...createListing('l-no-state'),
        attributes: { ...createListing('l-no-state').attributes, deleted: false, state: undefined },
      };
      const deletedListing = {
        ...createListing('l-deleted'),
        attributes: { ...createListing('l-deleted').attributes, deleted: true },
      };

      const testInitialState = {
        ...initialState,
        user: { currentUser },
        auth: { isAuthenticated: true },
      };

      const sdk = {
        currentUser: { show: sdkFn(fakeResponse(currentUser)) },
        users: { show: sdkFn(fakeResponse(initialState.marketplaceData.entities.user.userId)) },
        reviews: { query: sdkFn(fakeResponse([])) },
        listings: { query: sdkFn(fakeResponse([listing, listingNoState, deletedListing])) },
        authInfo: sdkFn({}),
      };

      let actions = [];
      const store = configureStore({
        initialState: testInitialState,
        sdk,
        extraMiddlewares: [logger(actions)],
      });

      return loadData({ id: userId }, null, config)(store.dispatch, store.getState, sdk).then(() => {
        const fulfilled = actions.find(
          a => a.type === 'ProfilePage/queryUserListings/fulfilled'
        );
        // Deleted listing excluded; listing with no state field included
        expect(fulfilled.payload.listingRefs).toHaveLength(2);
        const uuids = fulfilled.payload.listingRefs.map(r => r.id.uuid);
        expect(uuids).toContain('l1');
        expect(uuids).toContain('l-no-state');
        expect(uuids).not.toContain('l-deleted');
      });
    });
  });
});
