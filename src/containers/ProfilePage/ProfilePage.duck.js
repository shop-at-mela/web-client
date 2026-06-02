import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { PROFILE_PAGE_PENDING_APPROVAL_VARIANT } from '../../util/urlHelpers';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { getBrandIdBySlug } from '../../config/configBrands';

const { UUID } = sdkTypes;

// ================ Async Thunks ================ //

///////////////
// Show User //
///////////////
const showUserPayloadCreator = ({ userId, config }, { dispatch, rejectWithValue, extra: sdk }) => {
  return sdk.users
    .show({
      id: userId,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const userFields = config?.user?.userFields;
      const sanitizeConfig = { userFields };
      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      return response;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const showUserThunk = createAsyncThunk('ProfilePage/showUser', showUserPayloadCreator);

// Backward compatible wrapper for the thunk
export const showUser = (userId, config) => dispatch => {
  return dispatch(showUserThunk({ userId, config }));
};

/////////////////////////
// Query User Listings //
/////////////////////////
const queryUserListingsPayloadCreator = (
  { userId, config, ownProfileOnly = false },
  { dispatch, rejectWithValue, extra: sdk }
) => {
  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  const queryParams = {
    include: ['author', 'images'],
    'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
  };

  const fetchAllPages = async (queryFn, firstPageParams) => {
    const firstResponse = await queryFn({ ...firstPageParams, page: 1, perPage: 100 });
    dispatch(addMarketplaceEntities(firstResponse));
    const { totalPages } = firstResponse.data.meta;
    if (totalPages <= 1) return firstResponse.data.data;

    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(
      remainingPages.map(page => queryFn({ ...firstPageParams, page, perPage: 100 }))
    );
    rest.forEach(r => dispatch(addMarketplaceEntities(r)));
    return [firstResponse, ...rest].flatMap(r => r.data.data);
  };

  const baseParams = ownProfileOnly
    ? { states: ['published'], ...queryParams }
    : { author_id: userId, ...queryParams };
  const queryFn = ownProfileOnly
    ? p => sdk.ownListings.query(p)
    : p => sdk.listings.query(p);

  return fetchAllPages(queryFn, baseParams)
    .then(listings => {
      // Public SDK queries only return published listings; ownListings query
      // is scoped to states:['published']. State check is omitted because
      // the API may not include the state attribute on public responses.
      const listingRefs = listings
        .filter(l => !l.attributes.deleted)
        .map(({ id, type }) => ({ id, type }));
      return { listingRefs };
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const queryUserListingsThunk = createAsyncThunk(
  'ProfilePage/queryUserListings',
  queryUserListingsPayloadCreator
);

// Backward compatible wrapper for the thunk
export const queryUserListings = (userId, config, ownProfileOnly = false) => dispatch => {
  return dispatch(queryUserListingsThunk({ userId, config, ownProfileOnly }));
};

//////////////////////////
// Query User's Reviews //
//////////////////////////
const queryUserReviewsPayloadCreator = ({ userId }, { rejectWithValue, extra: sdk }) => {
  return sdk.reviews
    .query({
      subject_id: userId,
      state: 'public',
      include: ['author', 'author.profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const reviews = denormalisedResponseEntities(response);
      return reviews;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const queryUserReviewsThunk = createAsyncThunk(
  'ProfilePage/queryUserReviews',
  queryUserReviewsPayloadCreator
);

// Backward compatible wrapper for the thunk
export const queryUserReviews = userId => dispatch => {
  return dispatch(queryUserReviewsThunk({ userId }));
};

// ================ Slice ================ //

const initialState = {
  userId: null,
  userListingRefs: [],
  userShowError: null,
  queryListingsError: null,
  reviews: [],
  queryReviewsError: null,
};

const profilePageSlice = createSlice({
  name: 'ProfilePage',
  initialState,
  reducers: {
    setInitialState: () => initialState,
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // showUser cases
      .addCase(showUserThunk.pending, (state, action) => {
        state.userShowError = null;
        state.userId = action.meta.arg.userId;
      })
      .addCase(showUserThunk.fulfilled, state => {
        // No state changes needed on success
      })
      .addCase(showUserThunk.rejected, (state, action) => {
        state.userShowError = storableError(action.payload);
      })
      // queryUserListings cases
      .addCase(queryUserListingsThunk.pending, (state, action) => {
        const userId = action.meta.arg.userId;
        // Empty listings only when user id changes
        state.userListingRefs = userId === state.userId ? state.userListingRefs : [];
        state.queryListingsError = null;
      })
      .addCase(queryUserListingsThunk.fulfilled, (state, action) => {
        state.userListingRefs = action.payload.listingRefs;
      })
      .addCase(queryUserListingsThunk.rejected, (state, action) => {
        state.userListingRefs = [];
        state.queryListingsError = storableError(action.payload);
      })
      // queryUserReviews cases
      .addCase(queryUserReviewsThunk.pending, state => {
        state.queryReviewsError = null;
      })
      .addCase(queryUserReviewsThunk.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(queryUserReviewsThunk.rejected, (state, action) => {
        state.reviews = [];
        state.queryReviewsError = action.payload;
      });
  },
});

export const { setInitialState, setUserId } = profilePageSlice.actions;
export default profilePageSlice.reducer;

// ================ Load data ================ //

const isCurrentUser = (userId, cu) => userId?.uuid === cu?.id?.uuid;

// Shared fetch logic used by both /u/:id and /brands/:brandSlug routes
const loadProfileByUserId = (userId, params, config) => (dispatch, getState, sdk) => {
  const isPreviewForCurrentUser = params.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;
  const currentUser = getState()?.user?.currentUser;
  const fetchCurrentUserOptions = {
    updateHasListings: false,
    updateNotifications: false,
  };

  dispatch(setInitialState());

  if (isPreviewForCurrentUser) {
    return dispatch(fetchCurrentUser(fetchCurrentUserOptions)).then(() => {
      if (isCurrentUser(userId, currentUser) && isUserAuthorized(currentUser)) {
        return Promise.all([
          dispatch(showUser(userId, config)),
          dispatch(queryUserListings(userId, config)),
          dispatch(queryUserReviews(userId)),
        ]);
      } else if (isCurrentUser(userId, currentUser)) {
        // Handle a scenario, where user (in pending-approval state)
        // tries to see their own profile page.
        // => just set userId to state
        return dispatch(setUserId(userId));
      } else {
        return Promise.resolve({});
      }
    });
  }

  const isAuthorized = currentUser && isUserAuthorized(currentUser);
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);
  const canFetchData = !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized);
  const canFetchOwnProfileOnly =
    isPrivateMarketplace &&
    isAuthorized &&
    hasNoViewingRights &&
    isCurrentUser(userId, currentUser);

  if (!canFetchData) {
    return Promise.resolve();
  } else if (canFetchOwnProfileOnly) {
    return Promise.all([
      dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
      dispatch(queryUserListings(userId, config, canFetchOwnProfileOnly)),
      dispatch(setUserId(userId)),
    ]);
  }

  return Promise.all([
    dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
    dispatch(showUser(userId, config)),
    dispatch(queryUserListings(userId, config)),
    dispatch(queryUserReviews(userId)),
  ]);
};

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  // /brands/:brandSlug route — resolve slug to UUID via config, then load normally
  if (params.brandSlug) {
    const uuidString = getBrandIdBySlug(params.brandSlug);
    if (!uuidString) {
      // Slug not found — dispatch error so ProfilePage renders NotFoundPage
      dispatch(setInitialState());
      dispatch(showUserError(storableError({ status: 404 })));
      return Promise.resolve();
    }
    const userId = new UUID(uuidString);
    return dispatch(loadProfileByUserId(userId, params, config));
  }

  const userId = new UUID(params.id);
  return dispatch(loadProfileByUserId(userId, params, config));
};
