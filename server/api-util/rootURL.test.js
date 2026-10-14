const load = env => {
  jest.resetModules();
  const saved = {};
  Object.keys(env).forEach(k => {
    saved[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  });
  const { getRootURL } = require('./rootURL');
  Object.keys(saved).forEach(k => {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  });
  return getRootURL;
};

describe('getRootURL', () => {
  it('keeps the https protocol of REACT_APP_MARKETPLACE_ROOT_URL even if the SSL flag is unset', () => {
    const getRootURL = load({
      REACT_APP_MARKETPLACE_ROOT_URL: 'https://shopatmela.com/',
      REACT_APP_SHARETRIBE_USING_SSL: undefined,
    });
    expect(getRootURL()).toBe('https://shopatmela.com');
    expect(getRootURL({ useDevApiServerPort: true })).toBe('https://shopatmela.com');
  });

  it('keeps an explicit http protocol (local dev) and port', () => {
    const getRootURL = load({
      REACT_APP_MARKETPLACE_ROOT_URL: 'http://localhost:3000',
      REACT_APP_SHARETRIBE_USING_SSL: 'true',
    });
    expect(getRootURL()).toBe('http://localhost:3000');
  });

  it('falls back to the SSL flag when the root URL has no protocol', () => {
    const withSsl = load({
      REACT_APP_MARKETPLACE_ROOT_URL: 'shopatmela.com',
      REACT_APP_SHARETRIBE_USING_SSL: 'true',
    });
    expect(withSsl()).toBe('https://shopatmela.com');
    const withoutSsl = load({
      REACT_APP_MARKETPLACE_ROOT_URL: 'shopatmela.com',
      REACT_APP_SHARETRIBE_USING_SSL: undefined,
    });
    expect(withoutSsl()).toBe('http://shopatmela.com');
  });
});
