/* eslint-disable no-console */
/**
 * Harvest the listing IDs shown by the homepage "New from India" module.
 *
 * WHY: the module needs the newest listings across ALL brands with a spread of brands. The
 * Marketplace API has no multi-author filter, so one query sorted by `createdAt` is
 * dominated by whichever brand was ingested last (the newest 100 listings were all one
 * brand on 2026-11-01), and one query per brand on every page view would blow past the
 * ~1 req/sec Dev rate limit. This script does the per-brand queries once, offline, and
 * writes a short ID list into configBrands.js (newFromIndiaListingIds), the same pattern as
 * harvest-bestseller-ids.js. NewFromIndia.js fetches those IDs in ONE query and hides itself
 * if fewer than MIN_FRESH of them are still inside the freshness window.
 *
 * Selection: per brand, the newest listings that have an image and were created within
 * WINDOW_DAYS. Brands are ordered by their newest listing; the first pass takes one listing
 * per brand, the next pass takes second listings (MAX_PER_BRAND), until DISPLAY_COUNT.
 *
 * USAGE (from web-client/):
 *   node -r dotenv/config scripts/harvest-new-from-india-ids.js dotenv_config_path=.env.development
 * Re-run (and paste the output into configBrands.js) after each ingestion batch.
 */

const fs = require('fs');
const path = require('path');
const sharetribeSdk = require('sharetribe-flex-sdk');

const WINDOW_DAYS = 30;
const DISPLAY_COUNT = 8;
const MAX_PER_BRAND = 2;
const REQUEST_DELAY_MS = 1200; // stay under ~1 req/sec

const clientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
if (!clientId) {
  console.error('Missing REACT_APP_SHARETRIBE_SDK_CLIENT_ID (load .env.development) and retry.');
  process.exit(1);
}

// Dev roster = the `development:` array inside allBrandIdsByEnv (public brands only, not the
// admin account that only appears in brandConfigurationsByEnv).
const configSrc = fs.readFileSync(path.resolve(__dirname, '../src/config/configBrands.js'), 'utf8');
const rosterStart = configSrc.indexOf('const allBrandIdsByEnv');
const devStart = configSrc.indexOf('development: [', rosterStart);
const devEnd = configSrc.indexOf('],', devStart);
if (rosterStart === -1 || devStart === -1 || devEnd === -1) {
  console.error('Could not locate allBrandIdsByEnv.development in configBrands.js.');
  process.exit(1);
}
const brandIds = [];
const UUID_RE = /^\s*'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',/gm;
let match;
const rosterSlice = configSrc.slice(devStart, devEnd);
while ((match = UUID_RE.exec(rosterSlice)) !== null) brandIds.push(match[1]);

const sdk = sharetribeSdk.createInstance({ clientId });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const cutoff = Date.now() - WINDOW_DAYS * 86400000;

const harvestBrand = brandId =>
  sdk.listings
    .query({
      author_id: brandId,
      sort: 'createdAt', // newest first (note: '-createdAt' is OLDEST first)
      perPage: 10,
      include: ['images'],
      'fields.listing': ['createdAt'],
      'fields.image': [],
    })
    .then(res =>
      (res.data.data || [])
        .filter(l => (l.relationships?.images?.data || []).length > 0)
        .map(l => ({ id: l.id.uuid, createdAt: new Date(l.attributes.createdAt).getTime() }))
        .filter(l => l.createdAt >= cutoff)
        .slice(0, MAX_PER_BRAND)
    )
    .catch(err => {
      console.warn(`  ! ${brandId}: query failed (${err.status || err.message})`);
      return [];
    });

(async () => {
  console.log(
    `Harvesting new listings (last ${WINDOW_DAYS} days) for ${brandIds.length} brands...\n`
  );
  const perBrand = [];
  for (let i = 0; i < brandIds.length; i += 1) {
    /* eslint-disable no-await-in-loop */
    const listings = await harvestBrand(brandIds[i]);
    if (listings.length > 0) perBrand.push({ brandId: brandIds[i], listings });
    console.log(`  ${brandIds[i]}: ${listings.length} fresh`);
    if (i < brandIds.length - 1) await delay(REQUEST_DELAY_MS);
    /* eslint-enable no-await-in-loop */
  }

  perBrand.sort((a, b) => b.listings[0].createdAt - a.listings[0].createdAt);
  const ids = [];
  for (let pass = 0; pass < MAX_PER_BRAND; pass += 1) {
    perBrand.forEach(({ listings }) => {
      if (listings[pass] && ids.length < DISPLAY_COUNT) ids.push(listings[pass].id);
    });
  }

  const outPath = path.resolve(__dirname, 'harvest-new-from-india-ids.output.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify({ harvestedAt: new Date().toISOString(), ids }, null, 2)
  );
  console.log(`\nWrote ${outPath}\n`);
  console.log('Paste into configBrands.js newFromIndiaListingIdsByEnv.development:\n');
  console.log(`[\n  ${ids.map(id => `'${id}'`).join(',\n  ')},\n]`);
})();
