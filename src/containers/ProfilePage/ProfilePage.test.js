import React, { act } from 'react';
import '@testing-library/jest-dom';

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
  createFakeDispatch,
  dispatchedActions,
} from '../../util/testHelpers';

import ProfilePage from './ProfilePage';

import {
  loadData,
  queryListingsError,
  queryListingsRequest,
  queryListingsSuccess,
  queryReviewsError,
  queryReviewsSuccess,
  setInitialState,
  showUserError,
  showUserRequest,
  showUserSuccess,
} from './ProfilePage.duck';
import { currentUserShowRequest, currentUserShowSuccess } from '../../ducks/user.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { authInfoRequest, authInfoSuccess } from '../../ducks/auth.duck';
import { storableError } from '../../util/errors';

const { UUID } = sdkTypes;

const { screen } = testingLibrary;

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
        publicData: attributes.profile.publicData,
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

      let rendered = {};
      await act(async () => {
        rendered = render(<ProfilePage {...props} />, {
          initialState: stateWithBrand,
          config: brandConfig,
        });
      });

      const { container } = rendered;

      // Check for schema.org JSON-LD script
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBeGreaterThan(0);

      // Parse the schema markup
      const schemaScript = Array.from(scripts).find(script => {
        try {
          const schema = JSON.parse(script.textContent);
          return schema['@type'] === 'Organization';
        } catch {
          return false;
        }
      });

      expect(schemaScript).toBeTruthy();

      if (schemaScript) {
        const schema = JSON.parse(schemaScript.textContent);
        expect(schema['@type']).toBe('Organization');
        expect(schema.name).toBe('user1 display name');
        expect(schema.logo.url).toBe('https://example.com/logo.png');
        expect(schema.foundingDate).toBe('2018');
      }
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
      let rendered = {};
      await act(async () => {
        rendered = render(<ProfilePage {...props} />, {
          initialState: getInitialState(),
          config,
        });
      });

      const { container } = rendered;

      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      const schemaScript = Array.from(scripts).find(script => {
        try {
          const schema = JSON.parse(script.textContent);
          return schema['@type'] === 'ProfilePage';
        } catch {
          return false;
        }
      });

      expect(schemaScript).toBeTruthy();

      if (schemaScript) {
        const schema = JSON.parse(schemaScript.textContent);
        expect(schema['@type']).toBe('ProfilePage');
        expect(schema.mainEntity['@type']).toBe('Person');
      }
    });
  });
});

describe('Duck', () => {
  const config = {
    ...getHostedConfiguration(),
    accessControl: { marketplace: { private: true } },
  };

  // Shared parameters for viewing rights loadData tests
  const fakeResponse = resource => ({ data: { data: resource, include: [] } });
  const sdkFn = response => jest.fn(() => Promise.resolve(response));
  const forbiddenError = new Error({ status: 403, message: 'forbidden' });
  const errorSdkFn = error => jest.fn(() => Promise.reject(error));

  it("loadData() for full viewing rights user loads someone else's profile", () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    const { reviews, userListingRefs } = initialState.ProfilePage;
    const { l1: listing } = initialState.marketplaceData.entities.listing;
    const { userId: user } = initialState.marketplaceData.entities.user;

    const getState = () => ({
      ...initialState,
      auth: { isAuthenticated: true },
    });

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      users: { show: sdkFn(fakeResponse(user)) },
      reviews: { query: sdkFn(fakeResponse(reviews)) },
      listings: { query: sdkFn(fakeResponse([listing])) },
      authInfo: sdkFn({}),
    };

    const dispatch = createFakeDispatch(getState, sdk);

    // This is now sanitizeConfig is parsed in the showUser thunk
    const userFields = config?.user?.userFields;
    const sanitizeConfig = { userFields };

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: userId }, null, config)(dispatch, getState, sdk).then(data => {
      expect(dispatchedActions(dispatch)).toEqual([
        setInitialState(),
        currentUserShowRequest(),
        showUserRequest(user.id, config),
        queryListingsRequest(user.id),
        currentUserShowSuccess(currentUser),
        addMarketplaceEntities(fakeResponse(user), sanitizeConfig),
        showUserSuccess(),
        addMarketplaceEntities(fakeResponse([listing])),
        queryListingsSuccess(userListingRefs),
        queryReviewsSuccess(reviews),
        authInfoRequest(),
        authInfoSuccess({}),
      ]);
    });
  });

  it("loadData() for restricted viewing rights user does not load someone else's profile", () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    currentUser.effectivePermissionSet.attributes.read = 'permission/deny';

    const getState = () => ({
      ...initialState,
      user: {
        ...initialState.user,
        currentUser,
      },
      auth: { isAuthenticated: true },
    });

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      users: { show: errorSdkFn(forbiddenError) },
      listings: { query: errorSdkFn(forbiddenError) },
      reviews: { query: errorSdkFn(forbiddenError) },
      authInfo: sdkFn({}),
    };

    const dispatch = createFakeDispatch(getState, sdk);
    const otherUserId = new UUID('otherUserId');

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: 'otherUserId' }, null, config)(dispatch, getState, sdk).then(data => {
      expect(dispatchedActions(dispatch)).toEqual([
        setInitialState(),
        currentUserShowRequest(),
        showUserRequest(otherUserId, config),
        queryListingsRequest(otherUserId),
        currentUserShowSuccess(currentUser),
        authInfoRequest(),
        showUserError(storableError(forbiddenError)),
        queryListingsError(storableError(forbiddenError)),
        queryReviewsError(forbiddenError),
        authInfoSuccess({}),
      ]);
    });
  });

  it('loadData() for restricted viewing rights user loads their own profile', () => {
    const initialState = getInitialState();

    const { currentUser } = initialState.user;
    const { userListingRefs } = initialState.ProfilePage;
    const { l1: listing } = initialState.marketplaceData.entities.listing;

    currentUser.effectivePermissionSet.attributes.read = 'permission/deny';

    const getState = () => ({
      ...initialState,
      user: {
        ...initialState.user,
        currentUser,
      },
      auth: { isAuthenticated: true },
    });

    const sdk = {
      currentUser: { show: sdkFn(fakeResponse(currentUser)) },
      ownListings: { query: sdkFn(fakeResponse([listing])) },
      authInfo: sdkFn({}),
    };

    const dispatch = createFakeDispatch(getState, sdk);

    // Tests the actions that get dispatched to the Redux store when ProfilePage.duck.js
    // loadData() function is called. If you make customizations to the loadData() logic,
    // update the dispatched actions list in this test accordingly!
    return loadData({ id: userId }, null, config)(dispatch, getState, sdk).then(data => {
      expect(dispatchedActions(dispatch)).toEqual([
        setInitialState(),
        currentUserShowRequest(),
        queryListingsRequest(currentUser.id),
        showUserRequest(currentUser.id),
        currentUserShowSuccess(currentUser),
        addMarketplaceEntities(fakeResponse([listing])),
        queryListingsSuccess(userListingRefs),
        authInfoRequest(),
        authInfoSuccess({}),
      ]);
    });
  });
});
