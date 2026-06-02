import { storableError } from '../util/errors';
import { addMarketplaceEntities } from './marketplaceData.duck';
import { fetchCurrentUserThunk } from './user.duck';

const CURRENT_USER_SHOW_SUCCESS = fetchCurrentUserThunk.fulfilled.type;

const STORAGE_KEY = 'melaUnsavedItems';
const MAX_SAVED = 200;

// ================ Action types ================ //

export const TOGGLE_SAVE_REQUEST = 'app/savedListings/TOGGLE_SAVE_REQUEST';
export const TOGGLE_SAVE_SUCCESS = 'app/savedListings/TOGGLE_SAVE_SUCCESS';
export const TOGGLE_SAVE_ERROR = 'app/savedListings/TOGGLE_SAVE_ERROR';

export const FETCH_SAVED_LISTINGS_REQUEST = 'app/savedListings/FETCH_SAVED_LISTINGS_REQUEST';
export const FETCH_SAVED_LISTINGS_SUCCESS = 'app/savedListings/FETCH_SAVED_LISTINGS_SUCCESS';
export const FETCH_SAVED_LISTINGS_ERROR = 'app/savedListings/FETCH_SAVED_LISTINGS_ERROR';

export const SET_ANON_SAVED = 'app/savedListings/SET_ANON_SAVED';

// ================ Reducer ================ //

const initialState = {
  // Array of listing UUID strings for authenticated users (synced from privateData)
  savedListingIds: [],
  // Whether we're currently toggling a save (keyed by listing id)
  toggleInProgress: {},
  toggleError: null,

  // Fetched listing entities (for SavedPage and SavedItemsModule)
  fetchInProgress: false,
  fetchError: null,

  // Anonymous saved items: array of { id, title, imageUrl }
  anonSavedItems: [],

};

export default function savedListingsReducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    // Sync saved IDs whenever the current user entity loads (free rider on fetchCurrentUser).
    // Payload is the denormalised user entity (or null when unauthenticated).
    case CURRENT_USER_SHOW_SUCCESS: {
      if (!payload) {
        return state;
      }
      const savedListings = payload?.attributes?.profile?.privateData?.savedListings;
      if (Array.isArray(savedListings)) {
        return { ...state, savedListingIds: savedListings };
      }
      return state;
    }

    case TOGGLE_SAVE_REQUEST:
      return {
        ...state,
        toggleInProgress: { ...state.toggleInProgress, [payload.listingId]: true },
        toggleError: null,
      };
    case TOGGLE_SAVE_SUCCESS:
      return {
        ...state,
        savedListingIds: payload.savedListingIds,
        toggleInProgress: { ...state.toggleInProgress, [payload.listingId]: false },
      };
    case TOGGLE_SAVE_ERROR:
      return {
        ...state,
        // Roll back optimistic update
        savedListingIds: payload.previousIds,
        toggleInProgress: { ...state.toggleInProgress, [payload.listingId]: false },
        toggleError: payload.error,
      };

    case FETCH_SAVED_LISTINGS_REQUEST:
      return { ...state, fetchInProgress: true, fetchError: null };
    case FETCH_SAVED_LISTINGS_SUCCESS:
      return { ...state, fetchInProgress: false };
    case FETCH_SAVED_LISTINGS_ERROR:
      return { ...state, fetchInProgress: false, fetchError: payload };

    case SET_ANON_SAVED:
      return { ...state, anonSavedItems: payload };

    default:
      return state;
  }
}

// ================ Selectors ================ //

export const selectSavedListingIds = state => state.savedListings.savedListingIds;
export const selectIsListingSaved = (state, listingId) =>
  state.savedListings.savedListingIds.includes(listingId) ||
  state.savedListings.anonSavedItems.some(item => item.id === listingId);
export const selectToggleInProgress = (state, listingId) =>
  !!state.savedListings.toggleInProgress[listingId];
export const selectAnonSavedItems = state => state.savedListings.anonSavedItems;

// ================ Action creators ================ //

export const toggleSaveRequest = listingId => ({ type: TOGGLE_SAVE_REQUEST, payload: { listingId } });
export const toggleSaveSuccess = (listingId, savedListingIds) => ({
  type: TOGGLE_SAVE_SUCCESS,
  payload: { listingId, savedListingIds },
});
export const toggleSaveError = (listingId, error, previousIds) => ({
  type: TOGGLE_SAVE_ERROR,
  payload: { listingId, error, previousIds },
});

export const fetchSavedListingsRequest = () => ({ type: FETCH_SAVED_LISTINGS_REQUEST });
export const fetchSavedListingsSuccess = () => ({ type: FETCH_SAVED_LISTINGS_SUCCESS });
export const fetchSavedListingsError = error => ({
  type: FETCH_SAVED_LISTINGS_ERROR,
  payload: storableError(error),
});

export const setAnonSaved = items => ({ type: SET_ANON_SAVED, payload: items });

// ================ localStorage helpers (anon saves) ================ //

const readLocalItems = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeLocalItems = items => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const clearLocalSaves = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// ================ Thunks ================ //

/**
 * Toggle save/unsave for an authenticated user.
 * Optimistically updates local state; rolls back on API error.
 */
export const toggleSaveListing = (listingId, listingData) => (dispatch, getState, sdk) => {
  const state = getState();
  const isAuthenticated = state.auth.isAuthenticated;

  if (!isAuthenticated) {
    // Anonymous user: persist to localStorage and nudge
    const current = readLocalItems();
    const alreadySaved = current.some(item => item.id === listingId);
    let updated;
    if (alreadySaved) {
      updated = current.filter(item => item.id !== listingId);
    } else {
      const newItem = {
        id: listingId,
        title: listingData?.title || '',
        imageUrl: listingData?.imageUrl || '',
      };
      updated = [...current, newItem];
    }
    writeLocalItems(updated);
    dispatch(setAnonSaved(updated));
    return Promise.resolve();
  }

  const previousIds = state.savedListings.savedListingIds;
  const isSaved = previousIds.includes(listingId);
  const updatedIds = isSaved
    ? previousIds.filter(id => id !== listingId)
    : previousIds.length >= MAX_SAVED
    ? previousIds // cap reached — no-op (UI shows cap message)
    : [...previousIds, listingId];

  // Optimistic update
  dispatch(toggleSaveRequest(listingId));
  dispatch(toggleSaveSuccess(listingId, updatedIds));

  return sdk.currentUser
    .updateProfile({ privateData: { savedListings: updatedIds } })
    .then(() => {
      // Confirmed — nothing more to do (already optimistically updated)
    })
    .catch(e => {
      // Roll back
      dispatch(toggleSaveError(listingId, storableError(e), previousIds));
    });
};

/**
 * Fetch listing entities for a set of IDs (used by SavedPage and SavedItemsModule).
 * Stores results into marketplaceData entities via addMarketplaceEntities.
 */
export const fetchSavedListings = listingIds => (dispatch, getState, sdk) => {
  if (!listingIds || listingIds.length === 0) {
    return Promise.resolve();
  }

  dispatch(fetchSavedListingsRequest());

  return sdk.listings
    .query({
      ids: listingIds,
      include: ['images', 'author'],
      'fields.image': ['variants.listing-card', 'variants.listing-card-2x'],
      'fields.listing': ['title', 'price', 'publicData', 'state'],
      perPage: Math.min(listingIds.length, 200),
    })
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(fetchSavedListingsSuccess());
    })
    .catch(e => {
      dispatch(fetchSavedListingsError(e));
    });
};

/**
 * After login/signup: migrate any localStorage items into the user's privateData.
 * Merges with any items already saved on the server (server wins on conflicts).
 */
export const migrateLocalSavesToProfile = () => (dispatch, getState, sdk) => {
  const localItems = readLocalItems();
  if (localItems.length === 0) return Promise.resolve();

  const localIds = localItems.map(item => item.id);
  const existingIds = getState().savedListings.savedListingIds;

  // Merge: local items first, then existing (deduplicate), respect cap
  const merged = Array.from(new Set([...localIds, ...existingIds])).slice(0, MAX_SAVED);

  if (merged.length === existingIds.length && merged.every((id, i) => id === existingIds[i])) {
    // Nothing new to write
    clearLocalSaves();
    dispatch(setAnonSaved([]));
    return Promise.resolve();
  }

  return sdk.currentUser
    .updateProfile({ privateData: { savedListings: merged } })
    .then(() => {
      dispatch(toggleSaveSuccess('migration', merged));
      clearLocalSaves();
      dispatch(setAnonSaved([]));
    })
    .catch(e => {
      // Non-fatal: local items stay in localStorage for next login attempt
      console.error('Failed to migrate local saves to profile', e);
    });
};

/**
 * Load anon items from localStorage into Redux on app boot (client only).
 */
export const initAnonSaved = () => dispatch => {
  const items = readLocalItems();
  if (items.length > 0) {
    dispatch(setAnonSaved(items));
  }
};
