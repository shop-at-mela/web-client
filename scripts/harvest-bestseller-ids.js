/* eslint-disable no-console */
/**
 * One-time helper: harvest each Dev brand's bestseller listing IDs into
 * config-ready `bestsellerProductIds` arrays.
 *
 * WHY: the app used to fire one `listings.query({ author_id, pub_isBestseller })`
 * per brand on every brand-grid load, blowing past Sharetribe's ~1 req/sec Dev
 * rate limit (429s). BrandsPage.duck.js now batch-fetches bestsellers by id when
 * a brand has a cached pool in configBrands.js — this script produces those
 * pools. It queries with the SAME `pub_isBestseller: true` filter the live path
 * uses, so the cached and fallback paths stay semantically identical.
 *
 * USAGE (from web-client/, with the Dev env's SDK client id available):
 *   REACT_APP_SHARETRIBE_SDK_CLIENT_ID=xxxx node scripts/harvest-bestseller-ids.js
 *   # or, if it's already in your .env / .env.development:
 *   node -r dotenv/config scripts/harvest-bestseller-ids.js dotenv_config_path=.env.development
 *
 * It reads the Dev brand UUIDs straight from configBrands.js (the `development`
 * block), queries each brand sequentially with a delay so the harvest itself
 * doesn't trip the rate limit, and writes:
 *   scripts/harvest-bestseller-ids.output.json   (brandId -> [listingIds])
 * plus prints paste-ready snippets. Add each `bestsellerProductIds` array to the
 * matching brand in configBrands.js's `development` block.
 */

const fs = require('fs');
const path = require('path');
const sharetribeSdk = require('sharetribe-flex-sdk');

const POOL_SIZE = 50; // ~40-50 keeps rotation varied and survives listing drift
const REQUEST_DELAY_MS = 1200; // stay under ~1 req/sec while harvesting

const clientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
if (!clientId) {
  console.error(
    'Missing REACT_APP_SHARETRIBE_SDK_CLIENT_ID. Set it in the env (or load your .env.development) and retry.'
  );
  process.exit(1);
}

// --- Read the Dev brand UUIDs from configBrands.js without importing ESM. ---
const configPath = path.resolve(__dirname, '../src/config/configBrands.js');
const configSrc = fs.readFileSync(configPath, 'utf8');

const devStart = configSrc.indexOf('development:');
const prodStart = configSrc.indexOf('production:', devStart);
if (devStart === -1) {
  console.error('Could not locate the `development:` block in configBrands.js.');
  process.exit(1);
}
const devSlice = configSrc.slice(devStart, prodStart === -1 ? undefined : prodStart);

const UUID_KEY_RE = /'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'\s*:/g;
const brandIds = [];
let match;
while ((match = UUID_KEY_RE.exec(devSlice)) !== null) {
  brandIds.push(match[1]);
}

if (brandIds.length === 0) {
  console.error('No brand UUIDs found in the development block.');
  process.exit(1);
}

const sdk = sharetribeSdk.createInstance({ clientId });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const harvestBrand = brandId =>
  sdk.listings
    .query({
      author_id: brandId,
      pub_isBestseller: true,
      perPage: Math.min(POOL_SIZE, 100),
      'fields.listing': [], // ids only — keep the payload tiny
    })
    .then(res => (res.data.data || []).map(l => l.id.uuid).slice(0, POOL_SIZE))
    .catch(err => {
      console.warn(`  ! ${brandId}: query failed (${err.status || err.message})`);
      return [];
    });

(async () => {
  console.log(`Harvesting bestsellers for ${brandIds.length} Dev brands...\n`);
  const result = {};

  for (let i = 0; i < brandIds.length; i += 1) {
    const brandId = brandIds[i];
    /* eslint-disable no-await-in-loop */
    const ids = await harvestBrand(brandId);
    result[brandId] = ids;
    console.log(`  ${brandId}: ${ids.length} bestseller ids`);
    if (i < brandIds.length - 1) await delay(REQUEST_DELAY_MS);
    /* eslint-enable no-await-in-loop */
  }

  const outPath = path.resolve(__dirname, 'harvest-bestseller-ids.output.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`\nWrote ${outPath}\n`);
  console.log('Paste each array into the matching brand in configBrands.js (development block):\n');
  Object.entries(result).forEach(([brandId, ids]) => {
    if (ids.length === 0) return;
    console.log(`// ${brandId}`);
    console.log(`bestsellerProductIds: [\n  ${ids.map(id => `'${id}'`).join(',\n  ')},\n],\n`);
  });
})();
