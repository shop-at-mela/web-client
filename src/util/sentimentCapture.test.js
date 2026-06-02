import {
  shouldShowSentiment,
  markSentimentShown,
  postSentiment,
} from './sentimentCapture';

// jsdom provides a real working sessionStorage — just clear it between tests.
// Attempting to replace it via Object.defineProperty fails silently in jsdom.

beforeEach(() => {
  sessionStorage.clear();
  jest.clearAllMocks();
  process.env.REACT_APP_SENTIMENT_WEBHOOK_URL = 'https://script.google.com/macros/s/TEST/exec';
});

afterEach(() => {
  delete process.env.REACT_APP_SENTIMENT_WEBHOOK_URL;
});

global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

// ── shouldShowSentiment ───────────────────────────────────────────────────────

describe('shouldShowSentiment', () => {
  it('returns true when sentiment has not been shown this session', () => {
    expect(shouldShowSentiment()).toBe(true);
  });

  it('returns false after markSentimentShown has been called', () => {
    markSentimentShown();
    expect(shouldShowSentiment()).toBe(false);
  });

  it('returns false when the session key is already set', () => {
    sessionStorage.setItem('mela_sentiment_shown', '1');
    expect(shouldShowSentiment()).toBe(false);
  });
});

// ── markSentimentShown ────────────────────────────────────────────────────────

describe('markSentimentShown', () => {
  it('sets mela_sentiment_shown in sessionStorage', () => {
    markSentimentShown();
    expect(sessionStorage.getItem('mela_sentiment_shown')).toBe('1');
  });

  it('causes shouldShowSentiment to return false', () => {
    markSentimentShown();
    expect(shouldShowSentiment()).toBe(false);
  });
});

// ── postSentiment ─────────────────────────────────────────────────────────────

describe('postSentiment', () => {
  it('POSTs to the configured webhook URL', async () => {
    await postSentiment({ event: 'general_sentiment', response: 'up' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('https://script.google.com/macros/s/TEST/exec');
  });

  it('sends mode: no-cors and Content-Type: text/plain', async () => {
    await postSentiment({ event: 'general_sentiment', response: 'up' });
    const options = fetch.mock.calls[0][1];
    expect(options.mode).toBe('no-cors');
    expect(options.headers['Content-Type']).toBe('text/plain');
  });

  it('includes the payload fields in the JSON body', async () => {
    await postSentiment({ event: 'general_sentiment', response: 'down', freeText: 'hello' });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.event).toBe('general_sentiment');
    expect(body.response).toBe('down');
    expect(body.freeText).toBe('hello');
  });

  it('always adds timestamp and sessionId to the body', async () => {
    await postSentiment({ event: 'general_sentiment', response: 'up' });
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.timestamp).toBeDefined();
    expect(body.sessionId).toBeDefined();
  });

  it('does nothing when REACT_APP_SENTIMENT_WEBHOOK_URL is not set', async () => {
    delete process.env.REACT_APP_SENTIMENT_WEBHOOK_URL;
    await postSentiment({ event: 'general_sentiment', response: 'up' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not throw when fetch rejects', async () => {
    fetch.mockRejectedValueOnce(new Error('network error'));
    await expect(
      postSentiment({ event: 'general_sentiment', response: 'up' })
    ).resolves.toBeUndefined();
  });
});
