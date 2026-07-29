import { fetchListingsAcrossBrands, PER_BRAND_TIMEOUT_MS } from './bestsellerCarousel';

const makeListing = uuid => ({ id: { uuid }, type: 'listing' });

const respondWith = (data, included = []) =>
  Promise.resolve({ data: { data, included } });

describe('fetchListingsAcrossBrands', () => {
  it('merges pool and included entities across all brands', async () => {
    const sdk = {
      listings: {
        query: jest.fn(params => {
          if (params.author_id === 'brand-a') {
            return respondWith([makeListing('a1')], [{ id: { uuid: 'img-a1' }, type: 'image' }]);
          }
          return respondWith([makeListing('b1')], [{ id: { uuid: 'img-b1' }, type: 'image' }]);
        }),
      },
    };

    const { pool, allIncluded } = await fetchListingsAcrossBrands(
      sdk,
      ['brand-a', 'brand-b'],
      { pub_occasion: 'gifting' },
      2
    );

    expect(pool.map(l => l.id.uuid).sort()).toEqual(['a1', 'b1']);
    expect(allIncluded.map(i => i.id.uuid).sort()).toEqual(['img-a1', 'img-b1']);
  });

  it('queries each brand with author_id and the shared perBrandCount as perPage', async () => {
    const sdk = { listings: { query: jest.fn(() => respondWith([])) } };

    await fetchListingsAcrossBrands(sdk, ['brand-a', 'brand-b'], { pub_occasion: 'gifting' }, 3);

    expect(sdk.listings.query).toHaveBeenCalledWith(
      expect.objectContaining({ author_id: 'brand-a', perPage: 3, pub_occasion: 'gifting' })
    );
    expect(sdk.listings.query).toHaveBeenCalledWith(
      expect.objectContaining({ author_id: 'brand-b', perPage: 3, pub_occasion: 'gifting' })
    );
  });

  it('contributes an empty result for a brand whose query rejects, without failing the batch', async () => {
    const sdk = {
      listings: {
        query: jest.fn(params =>
          params.author_id === 'brand-bad'
            ? Promise.reject(new Error('network error'))
            : respondWith([makeListing('ok1')])
        ),
      },
    };

    const { pool } = await fetchListingsAcrossBrands(sdk, ['brand-bad', 'brand-ok'], {}, 2);

    expect(pool.map(l => l.id.uuid)).toEqual(['ok1']);
  });

  it('does not let a hanging brand query block the batch past the SLA timeout', async () => {
    jest.useFakeTimers();

    const sdk = {
      listings: {
        query: jest.fn(params =>
          params.author_id === 'brand-slow'
            ? new Promise(() => {}) // never resolves
            : respondWith([makeListing('fast1')])
        ),
      },
    };

    const resultPromise = fetchListingsAcrossBrands(sdk, ['brand-slow', 'brand-fast'], {}, 2);

    // Advance past the SLA ceiling; the hanging brand's timeout should fire.
    await jest.advanceTimersByTimeAsync(PER_BRAND_TIMEOUT_MS);

    const { pool } = await resultPromise;

    expect(pool.map(l => l.id.uuid)).toEqual(['fast1']);

    jest.useRealTimers();
  });
});
