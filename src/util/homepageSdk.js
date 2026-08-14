/**
 * homepageSdk.js
 *
 * The single shared browser SDK instance for the whole app — imported by src/index.js
 * (used as the redux-thunk extraArgument, the same `sdk` every duck's thunks receive)
 * and by MelaHomePage sections that fetch data outside the page's own loadData
 * lifecycle (CategoryShowcase's carousels, the P1.3 editorial modules).
 *
 * Do NOT call createInstance() a second time anywhere else in the browser bundle.
 * With no explicit tokenStore, the SDK defaults to a cookie store keyed only by
 * clientId — two independent SDK client objects sharing that same cookie will race
 * their anonymous-token refreshes against each other and corrupt it, causing
 * "Unknown token type: undefined" errors from the SDK's auth interceptor on
 * essentially every public query.
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
