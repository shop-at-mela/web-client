/**
 * homepageSdk.js
 *
 * Shared marketplace SDK instance for MelaHomePage sections that fetch data outside
 * the page's own loadData lifecycle (CategoryShowcase's carousels, the P1.3 editorial
 * modules). Matches the instantiation pattern in src/index.js; extracted here so each
 * section doesn't create its own duplicate instance.
 */
import { createInstance } from './sdkLoader';
import appSettings from '../config/settings';
import * as apiUtils from './api';

const baseUrl = appSettings.sdk.baseUrl ? { baseUrl: appSettings.sdk.baseUrl } : {};
const assetCdnBaseUrl = appSettings.sdk.assetCdnBaseUrl
  ? { assetCdnBaseUrl: appSettings.sdk.assetCdnBaseUrl }
  : {};

const sdk = createInstance({
  transitVerbose: appSettings.sdk.transitVerbose,
  clientId: appSettings.sdk.clientId,
  secure: appSettings.usingSSL,
  typeHandlers: apiUtils.typeHandlers,
  ...baseUrl,
  ...assetCdnBaseUrl,
});

export default sdk;
