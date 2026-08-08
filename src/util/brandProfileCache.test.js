import {
  showBrandProfileDoc,
  clearBrandProfileCache,
  BRAND_PROFILE_CACHE_TTL_MS,
} from './brandProfileCache';

const makeDoc = id => ({ data: { id: { uuid: id }, type: 'user' }, included: [] });

const makeSdk = impl => ({ users: { show: jest.fn(impl) } });

describe('brandProfileCache', () => {
  beforeEach(() => {
    clearBrandProfileCache();
    jest.restoreAllMocks();
  });

  it('returns the profile document (response.data) on success', async () => {
    const sdk = makeSdk(({ id }) => Promise.resolve({ data: makeDoc(id) }));
    const doc = await showBrandProfileDoc(sdk, 'brand-1');
    expect(doc).toEqual(makeDoc('brand-1'));
    expect(sdk.users.show).toHaveBeenCalledTimes(1);
  });

  it('requests the shared profile field set (profile, metadata, profileImage)', async () => {
    const sdk = makeSdk(({ id }) => Promise.resolve({ data: makeDoc(id) }));
    await showBrandProfileDoc(sdk, 'brand-1');
    const params = sdk.users.show.mock.calls[0][0];
    expect(params.id).toBe('brand-1');
    expect(params.include).toContain('profileImage');
    expect(params['fields.user']).toEqual(expect.arrayContaining(['profile', 'metadata']));
  });

  it('deduplicates concurrent + repeat calls for the same brand within TTL', async () => {
    const sdk = makeSdk(({ id }) => Promise.resolve({ data: makeDoc(id) }));
    // Two concurrent calls share one in-flight promise.
    const [a, b] = await Promise.all([
      showBrandProfileDoc(sdk, 'brand-1'),
      showBrandProfileDoc(sdk, 'brand-1'),
    ]);
    // A later repeat hits the resolved cache.
    const c = await showBrandProfileDoc(sdk, 'brand-1');
    expect(a).toBe(b);
    expect(c).toEqual(makeDoc('brand-1'));
    expect(sdk.users.show).toHaveBeenCalledTimes(1);
  });

  it('fetches distinct brands separately', async () => {
    const sdk = makeSdk(({ id }) => Promise.resolve({ data: makeDoc(id) }));
    await Promise.all([showBrandProfileDoc(sdk, 'a'), showBrandProfileDoc(sdk, 'b')]);
    expect(sdk.users.show).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures — a later call retries', async () => {
    const sdk = makeSdk(
      jest
        .fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce({ data: makeDoc('brand-1') })
    );
    await expect(showBrandProfileDoc(sdk, 'brand-1')).rejects.toThrow('boom');
    const doc = await showBrandProfileDoc(sdk, 'brand-1');
    expect(doc).toEqual(makeDoc('brand-1'));
    expect(sdk.users.show).toHaveBeenCalledTimes(2);
  });

  it('re-fetches after the TTL window elapses', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1_000_000);
    const sdk = makeSdk(({ id }) => Promise.resolve({ data: makeDoc(id) }));

    await showBrandProfileDoc(sdk, 'brand-1');
    expect(sdk.users.show).toHaveBeenCalledTimes(1);

    // Advance past the TTL.
    nowSpy.mockReturnValue(1_000_000 + BRAND_PROFILE_CACHE_TTL_MS + 1);
    await showBrandProfileDoc(sdk, 'brand-1');
    expect(sdk.users.show).toHaveBeenCalledTimes(2);
  });

  it('resolves null when the response has no data', async () => {
    const sdk = makeSdk(() => Promise.resolve({}));
    await expect(showBrandProfileDoc(sdk, 'brand-1')).resolves.toBeNull();
  });
});
