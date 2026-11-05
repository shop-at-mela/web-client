import { types as sdkTypes } from './sdkLoader';

const { Money } = sdkTypes;

// The module holds the seeded rate, so each test gets a fresh copy.
const load = () => {
  let mod;
  jest.isolateModules(() => {
    // Same isolated copy of React for the hook and the renderer
    mod = { ...require('./liveInrRate'), ...require('@testing-library/react/pure') };
  });
  return mod;
};

describe('liveInrRate', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  describe('getDisplayMoney', () => {
    const stored = new Money(4651, 'USD');

    it('converts INR-sourced listings at the given rate, ignoring the stored price', () => {
      const { getDisplayMoney } = load();
      expect(getDisplayMoney(stored, { priceInINR: 3860 }, 0.0105).amount).toBe(4053);
    });

    it('never falls back to the stored price for an INR-sourced listing', () => {
      const { getDisplayMoney } = load();
      expect(getDisplayMoney(stored, { priceInINR: 3860 }, null)).toBeNull();
    });

    it('returns the stored price for listings sourced in USD', () => {
      const { getDisplayMoney } = load();
      expect(getDisplayMoney(stored, {}, null)).toBe(stored);
      expect(getDisplayMoney(stored, undefined, 0.0105)).toBe(stored);
    });
  });

  describe('useLiveInrToUsdRate', () => {
    it('starts from the seeded rate without fetching, so hydration matches the server', async () => {
      global.fetch = jest.fn();
      const { setInitialInrToUsdRate, useLiveInrToUsdRate, renderHook, waitFor } = load();
      setInitialInrToUsdRate(0.0105);
      const { result } = renderHook(() => useLiveInrToUsdRate());
      expect(result.current).toBe(0.0105);
      await waitFor(() => expect(result.current).toBe(0.0105));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('ignores localStorage on first render, then uses the live rate', async () => {
      window.localStorage.setItem(
        'melaLiveInrUsdRate',
        JSON.stringify({ rate: 0.0111, fetchedAt: Date.now() })
      );
      const { useLiveInrToUsdRate, renderHook, waitFor } = load();
      const { result } = renderHook(() => useLiveInrToUsdRate());
      expect(result.current).toBeNull();
      await waitFor(() => expect(result.current).toBe(0.0111));
    });

    it('stays null when no live rate can be fetched', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('down'));
      const { getLiveInrToUsdRate, useLiveInrToUsdRate, renderHook } = load();
      const { result } = renderHook(() => useLiveInrToUsdRate());
      await expect(getLiveInrToUsdRate()).resolves.toBeNull();
      expect(result.current).toBeNull();
    });

    it('ignores an invalid seeded rate', () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('down'));
      const { setInitialInrToUsdRate, useLiveInrToUsdRate, renderHook, waitFor } = load();
      setInitialInrToUsdRate(undefined);
      const { result } = renderHook(() => useLiveInrToUsdRate());
      expect(result.current).toBeNull();
    });
  });
});
