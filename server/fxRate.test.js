const { getInrToUsdRate, resetForTest } = require('./fxRate');

const okResponse = rate => ({ ok: true, json: async () => ({ rates: { USD: rate } }) });

describe('getInrToUsdRate', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    resetForTest();
    jest.spyOn(require('./log'), 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('returns the live rate and reuses it', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(0.0106));
    expect(await getInrToUsdRate()).toBe(0.0106);
    expect(await getInrToUsdRate()).toBe(0.0106);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns null, not a hard-coded rate, when no rate has been fetched', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down'));
    expect(await getInrToUsdRate()).toBeNull();
  });

  it('rejects a malformed response', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse('0.01'));
    expect(await getInrToUsdRate()).toBeNull();
  });

  it('keeps the last good rate when a refresh fails', async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse(0.0106));
    await getInrToUsdRate();
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 13 * 60 * 60 * 1000);
    global.fetch = jest.fn().mockRejectedValue(new Error('down'));
    expect(await getInrToUsdRate()).toBe(0.0106);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
