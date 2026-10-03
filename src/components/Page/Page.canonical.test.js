/**
 * @jest-environment node
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { IntlProvider } from 'react-intl';

import routeConfiguration from '../../routing/routeConfiguration';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';

import Page from './Page';

const config = {
  marketplaceName: 'Mela',
  marketplaceRootURL: 'https://mela.test',
  branding: {},
  address: {},
};
const routes = routeConfiguration({
  searchPage: { variantType: 'map' },
  listingPage: { variantType: 'carousel' },
});

// Mirrors the server path (server/renderer.js -> app.js renderApp): StaticRouter given the
// raw req.url, query string included, and the head collected via HelmetProvider's context.
const renderHeadFor = url => {
  const helmetContext = {};
  renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url} context={{}}>
        <IntlProvider locale="en" messages={{}} onError={() => {}}>
          <ConfigurationProvider value={config}>
            <RouteConfigurationProvider value={routes}>
              <Page title="t" description="d" scrollingDisabled={false}>
                <div />
              </Page>
            </RouteConfigurationProvider>
          </ConfigurationProvider>
        </IntlProvider>
      </StaticRouter>
    </HelmetProvider>
  );
  const { link, meta } = helmetContext.helmet;
  return { link: link.toString(), meta: meta.toString() };
};

describe('Page canonical and og:url (server render)', () => {
  const id = '00000000-0000-0000-0000-000000000000';

  it('omits utm_* from canonical and og:url but keeps other params', () => {
    const { link, meta } = renderHeadFor(`/l/some-slug/${id}?utm_source=x&foo=1`);
    expect(link).toContain(`href="https://mela.test/l/${id}?foo=1"`);
    expect(meta).toContain(`content="https://mela.test/l/${id}?foo=1"`);
    expect(link).not.toContain('utm_');
    expect(meta).not.toContain('utm_');
  });

  it('has a bare canonical when the only params are tracking params', () => {
    const { link, meta } = renderHeadFor(
      `/l/some-slug/${id}?utm_source=pinterest&utm_campaign=a_w1&fbclid=z`
    );
    expect(link).toContain(`href="https://mela.test/l/${id}"`);
    expect(meta).toContain(`content="https://mela.test/l/${id}"`);
  });
});
