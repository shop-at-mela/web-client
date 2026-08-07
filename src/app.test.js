import React, { act } from 'react';
import ReactDOMClient from 'react-dom/client';
import { getHostedConfiguration } from './util/testHelpers';
import { ClientApp } from './app';
import configureStore from './store';

// The "/" route lazily loads MelaHomePage (via @loadable/component), which imports
// CategoryShowcase.js → homepageSdk.js. homepageSdk.js calls createInstance() at
// module load time, which crashes with "clientId must be provided" in the test env
// (no REACT_APP_SHARETRIBE_SDK_CLIENT_ID). Because that crash happens inside the
// loadable() dynamic import rather than a top-level test import, it doesn't fail
// the suite outright — it rejects the chunk's load promise, which left the
// component stuck retrying indefinitely and the test hanging past its 5000ms
// timeout. Stub only createInstance; keep the rest of sdkLoader real.
jest.mock('./util/sdkLoader', () => {
  const actual = jest.requireActual('./util/sdkLoader');
  return {
    ...actual,
    createInstance: jest.fn(() => ({
      listings: { query: jest.fn() },
    })),
  };
});

const jsdomScroll = window.scroll;
beforeAll(() => {
  // Mock window.scroll - otherwise, Jest/JSDOM will print a not-implemented error.
  window.scroll = () => {};
});

afterAll(() => {
  window.scroll = jsdomScroll;
});

describe('Application - JSDOM environment', () => {
  it('renders the LandingPage without crashing', async () => {
    window.google = { maps: {} };

    // LandingPage gets rendered and it calls hostedAsset > fetchPageAssets > sdk.assetByVersion
    const pageData = {
      data: {
        sections: [],
        _schema: './schema.json',
      },
      meta: {
        version: 'bCsMYVYVawc8SMPzZWJpiw',
      },
    };
    const resolvePageAssetCall = () => Promise.resolve({ data: pageData, status: 200 });
    const fakeSdk = { assetByVersion: resolvePageAssetCall, assetByAlias: resolvePageAssetCall };
    const store = configureStore({ initialState: {}, sdk: fakeSdk });
    const div = document.createElement('div');
    const root = ReactDOMClient.createRoot(div);

    await act(async () => {
      root.render(<ClientApp store={store} hostedConfig={getHostedConfiguration()} />);
    });
    delete window.google;
  });
});
