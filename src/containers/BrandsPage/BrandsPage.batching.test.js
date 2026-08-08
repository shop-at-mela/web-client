import * as configBrands from '../../config/configBrands';
import { clearBrandProfileCache } from '../../util/brandProfileCache';
import { fetchBestsellersForBrands, fetchBrandProfiles } from './BrandsPage.duck';

const listingsResponse = ids => ({
  data: {
    data: ids.map(uuid => ({ id: { uuid }, type: 'listing', attributes: { title: uuid } })),
    included: [{ id: { uuid: `img-${ids[0]}` }, type: 'image' }],
  },
});

const userResponse = uuid => ({
  data: { data: { id: { uuid }, type: 'user', attributes: {} }, included: [] },
});

describe('BrandsPage rate-limit batching', () => {
  let sdk;

  beforeEach(() => {
    clearBrandProfileCache();
    jest.restoreAllMocks();
    sdk = {
      users: { show: jest.fn(({ id }) => Promise.resolve(userResponse(id))) },
      listings: {
        query: jest.fn(params =>
          Promise.resolve(listingsResponse(params.ids || [`live-${params.author_id}`]))
        ),
      },
    };
  });

  describe('fetchBestsellersForBrands', () => {
    it('batches cached-pool brands into ids queries (no per-brand author_id query)', async () => {
      jest
        .spyOn(configBrands, 'getBestsellerProductIds')
        .mockImplementation(id => (id === 'cached' ? ['l1', 'l2', 'l3'] : []));

      const result = await fetchBestsellersForBrands(sdk, ['cached']);

      // One batched call, keyed by ids — never by author_id for a cached brand.
      expect(sdk.listings.query).toHaveBeenCalledTimes(1);
      const params = sdk.listings.query.mock.calls[0][0];
      expect(params.ids).toEqual(expect.arrayContaining(['l1', 'l2', 'l3']));
      expect(params.author_id).toBeUndefined();
      expect(params.pub_isBestseller).toBeUndefined();

      // Result keeps the { brandId, data, included } seam callers expect.
      const cached = result.find(r => r.brandId === 'cached');
      expect(cached.data.length).toBeGreaterThan(0);
      expect(cached.data.every(l => ['l1', 'l2', 'l3'].includes(l.id.uuid))).toBe(true);
    });

    it('falls back to the live author_id + pub_isBestseller query when no pool', async () => {
      jest.spyOn(configBrands, 'getBestsellerProductIds').mockReturnValue([]);

      const result = await fetchBestsellersForBrands(sdk, ['uncached']);

      expect(sdk.listings.query).toHaveBeenCalledTimes(1);
      const params = sdk.listings.query.mock.calls[0][0];
      expect(params.author_id).toBe('uncached');
      expect(params.pub_isBestseller).toBe(true);
      expect(params.ids).toBeUndefined();
      expect(result.map(r => r.brandId)).toContain('uncached');
    });

    it('mixes both paths: cached brands batched, uncached brands per-author', async () => {
      jest
        .spyOn(configBrands, 'getBestsellerProductIds')
        .mockImplementation(id => (id === 'cached' ? ['l1', 'l2'] : []));

      const result = await fetchBestsellersForBrands(sdk, ['cached', 'uncached']);

      const idsCalls = sdk.listings.query.mock.calls.filter(c => c[0].ids);
      const authorCalls = sdk.listings.query.mock.calls.filter(c => c[0].author_id);
      expect(idsCalls).toHaveLength(1); // one batched query covers all cached brands
      expect(authorCalls).toHaveLength(1); // one per uncached brand
      expect(result.map(r => r.brandId).sort()).toEqual(['cached', 'uncached']);
    });

    it('chunks batched ids to stay within the 100-per-query cap', async () => {
      // 20 brands x 8 buffered ids = 160 ids -> 2 chunks of <=100.
      const brandIds = Array.from({ length: 20 }, (_, i) => `b${i}`);
      jest
        .spyOn(configBrands, 'getBestsellerProductIds')
        .mockImplementation(id => Array.from({ length: 12 }, (_, i) => `${id}-l${i}`));

      await fetchBestsellersForBrands(sdk, brandIds);

      const idsCalls = sdk.listings.query.mock.calls.filter(c => c[0].ids);
      expect(idsCalls.length).toBeGreaterThan(1);
      idsCalls.forEach(([params]) => {
        expect(params.ids.length).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('fetchBrandProfiles', () => {
    it('returns profile docs in input order', async () => {
      const result = await fetchBrandProfiles(sdk, ['a', 'b', 'c']);
      expect(result.map(r => r.data.id.uuid)).toEqual(['a', 'b', 'c']);
    });

    it('deduplicates repeat brand ids via the shared cache', async () => {
      await fetchBrandProfiles(sdk, ['a', 'b']);
      await fetchBrandProfiles(sdk, ['a', 'b']); // second page / remount
      // Each unique brand fetched once despite two passes.
      expect(sdk.users.show).toHaveBeenCalledTimes(2);
    });

    it('substitutes null for a failed brand without failing the batch', async () => {
      sdk.users.show = jest.fn(({ id }) =>
        id === 'bad' ? Promise.reject(new Error('nope')) : Promise.resolve(userResponse(id))
      );
      const result = await fetchBrandProfiles(sdk, ['good', 'bad']);
      expect(result[0].data.id.uuid).toBe('good');
      expect(result[1]).toBeNull();
    });
  });
});
