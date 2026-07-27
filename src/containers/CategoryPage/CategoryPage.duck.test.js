jest.mock('../SearchPage/SearchPage.duck', () => ({
  loadData: jest.fn(),
}));

jest.mock('../../ducks/marketplaceData.duck', () => ({
  addMarketplaceEntities: jest.fn(payload => ({ type: 'ADD_MARKETPLACE_ENTITIES', payload })),
  getMarketplaceEntities: jest.fn(() => []),
  getListingsById: jest.fn(() => []),
}));

import { loadData as searchPageLoadData } from '../SearchPage/SearchPage.duck';
import {
  getListingsById,
  addMarketplaceEntities,
} from '../../ducks/marketplaceData.duck';
import categoryPageReducer, {
  loadData,
  fetchCategoryBrandTiles,
  getCategoryBrandTiles,
  MAX_CATEGORY_BRAND_TILES,
} from './CategoryPage.duck';

describe('CategoryPage.duck reducer', () => {
  it('has the expected initial state', () => {
    expect(categoryPageReducer(undefined, { type: '@@INIT' })).toEqual({
      brandTileIds: [],
      brandTilesInProgress: false,
    });
  });

  it('sets brandTilesInProgress on request', () => {
    const state = categoryPageReducer(undefined, { type: 'app/CategoryPage/CATEGORY_BRAND_TILES_REQUEST' });
    expect(state.brandTilesInProgress).toBe(true);
  });

  it('stores ids and clears progress on success', () => {
    const state = categoryPageReducer(
      { brandTileIds: [], brandTilesInProgress: true },
      { type: 'app/CategoryPage/CATEGORY_BRAND_TILES_SUCCESS', payload: ['brand-1', 'brand-2'] }
    );
    expect(state).toEqual({ brandTileIds: ['brand-1', 'brand-2'], brandTilesInProgress: false });
  });
});

describe('fetchCategoryBrandTiles', () => {
  const mockDispatch = jest.fn(action => {
    if (typeof action === 'function') return action(mockDispatch, mockGetState, mockSdk);
    return action;
  });
  const mockGetState = jest.fn(() => ({}));
  let mockSdk;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSdk = {
      users: {
        show: jest.fn(({ id }) =>
          Promise.resolve({
            data: {
              data: { id: { uuid: id }, type: 'user', attributes: {} },
              included: [],
            },
          })
        ),
      },
    };
  });

  it('caps requests at MAX_CATEGORY_BRAND_TILES', async () => {
    const brandIds = ['b1', 'b2', 'b3', 'b4', 'b5'];
    await fetchCategoryBrandTiles(brandIds)(mockDispatch, mockGetState, mockSdk);

    expect(mockSdk.users.show).toHaveBeenCalledTimes(MAX_CATEGORY_BRAND_TILES);
  });

  it('dispatches addMarketplaceEntities with merged user data, then success with fetched ids', async () => {
    await fetchCategoryBrandTiles(['b1', 'b2'])(mockDispatch, mockGetState, mockSdk);

    expect(addMarketplaceEntities).toHaveBeenCalledWith({
      data: {
        data: [
          { id: { uuid: 'b1' }, type: 'user', attributes: {} },
          { id: { uuid: 'b2' }, type: 'user', attributes: {} },
        ],
        included: [],
      },
    });

    const successCall = mockDispatch.mock.calls.find(
      ([action]) => action?.type === 'app/CategoryPage/CATEGORY_BRAND_TILES_SUCCESS'
    );
    expect(successCall[0].payload).toEqual(['b1', 'b2']);
  });

  it('resolves with an empty payload and does not call the SDK when given no brand ids', async () => {
    await fetchCategoryBrandTiles([])(mockDispatch, mockGetState, mockSdk);

    expect(mockSdk.users.show).not.toHaveBeenCalled();
    const successCall = mockDispatch.mock.calls.find(
      ([action]) => action?.type === 'app/CategoryPage/CATEGORY_BRAND_TILES_SUCCESS'
    );
    expect(successCall[0].payload).toEqual([]);
  });

  it('drops brands whose fetch fails, without failing the whole batch', async () => {
    mockSdk.users.show = jest.fn(({ id }) =>
      id === 'bad'
        ? Promise.reject(new Error('not found'))
        : Promise.resolve({ data: { data: { id: { uuid: id }, type: 'user', attributes: {} }, included: [] } })
    );

    await fetchCategoryBrandTiles(['bad', 'good'])(mockDispatch, mockGetState, mockSdk);

    const successCall = mockDispatch.mock.calls.find(
      ([action]) => action?.type === 'app/CategoryPage/CATEGORY_BRAND_TILES_SUCCESS'
    );
    expect(successCall[0].payload).toEqual(['good']);
  });
});

describe('getCategoryBrandTiles', () => {
  it('returns an empty array when no tile ids are stored', () => {
    expect(getCategoryBrandTiles({ CategoryPage: { brandTileIds: [] } })).toEqual([]);
  });
});

describe('loadData', () => {
  // `resetMocks: true` (package.json jest config) wipes jest.fn(impl) custom
  // implementations before every test, so mockDispatch's recursive-thunk behavior
  // must be (re-)installed in beforeEach, not just once at describe-body eval time.
  let mockDispatch;
  let mockGetState;
  let mockSdk;

  beforeEach(() => {
    mockSdk = {
      users: {
        show: jest.fn(({ id }) =>
          Promise.resolve({ data: { data: { id: { uuid: id }, type: 'user', attributes: {} }, included: [] } })
        ),
      },
    };
    mockDispatch = jest.fn(action => {
      if (typeof action === 'function') return action(mockDispatch, mockGetState, mockSdk);
      return action;
    });
    searchPageLoadData.mockReturnValue(() => Promise.resolve('search-result'));
  });

  it('extracts distinct brand ids from the resolved listings and fetches their tiles', async () => {
    getListingsById.mockReturnValue([
      { id: { uuid: 'l1' }, author: { id: { uuid: 'brand-a' } } },
      { id: { uuid: 'l2' }, author: { id: { uuid: 'brand-b' } } },
      { id: { uuid: 'l3' }, author: { id: { uuid: 'brand-a' } } }, // duplicate brand
      { id: { uuid: 'l4' } }, // no author
    ]);
    mockGetState = jest.fn(() => ({ SearchPage: { currentPageResultIds: ['l1', 'l2', 'l3', 'l4'] } }));

    const result = await loadData({ level1: 'Fashion' }, '', {})(mockDispatch, mockGetState, mockSdk);

    expect(result).toBe('search-result');
    const tileFetchCall = mockDispatch.mock.calls.find(
      ([action]) => action?.type === 'app/CategoryPage/CATEGORY_BRAND_TILES_REQUEST'
    );
    expect(tileFetchCall).toBeTruthy();
    expect(mockSdk.users.show).toHaveBeenCalledWith(expect.objectContaining({ id: 'brand-a' }));
    expect(mockSdk.users.show).toHaveBeenCalledWith(expect.objectContaining({ id: 'brand-b' }));
  });
});
