import React, { useEffect, useState } from 'react';
import { useIntl } from '../../../../util/reactIntl';
import { ProductCarousel } from '../../../../components';
import { denormalisedEntities, updatedEntities } from '../../../../util/data';
import { pushNewFromIndiaClick } from '../../../../util/analytics/homepageEditorial';
import { newFromIndiaListingIds } from '../../../../config/configBrands';
import sdk from '../../../../util/homepageSdk';

const DISPLAY_COUNT = 8;
const MAX_PER_BRAND = 2;
const FETCH_POOL_SIZE = 30; // over-fetch so the per-brand cap still yields 8 after filtering
// Listings older than this are not "new" (createdAt is the date Mela ingested the listing).
const FRESH_WINDOW_DAYS = 30;
// Below this the section hides rather than show a thin or stale row; 4 fills the phone grid.
const MIN_FRESH_COUNT = 4;

/**
 * Caps `sortedListings` (already sorted by recency) at `maxPerBrand` per author,
 * preserving order, stopping once `limit` items are collected. Recency-order is
 * never reshuffled — items over the per-brand cap are skipped, not reordered.
 */
const capPerBrand = (sortedListings, maxPerBrand, limit) => {
  const countByBrand = {};
  const result = [];
  for (const listing of sortedListings) {
    if (result.length >= limit) break;
    const brandId = listing.author?.id?.uuid || listing.id.uuid;
    const count = countByBrand[brandId] || 0;
    if (count >= maxPerBrand) continue;
    countByBrand[brandId] = count + 1;
    result.push(listing);
  }
  return result;
};

/**
 * Keeps the listings whose id is in `ids`, in the order of `ids`, that were created inside the
 * freshness window. `ids` queries may not return the requested order, and a stale baked list must shrink
 * (and eventually hide the section) instead of showing old listings as new.
 */
const freshInIdOrder = (listings, ids) => {
  const cutoff = Date.now() - FRESH_WINDOW_DAYS * 86400000;
  const position = id => ids.indexOf(id);
  return listings
    .filter(
      l => position(l.id.uuid) !== -1 && new Date(l.attributes?.createdAt).getTime() >= cutoff
    )
    .sort((a, b) => position(a.id.uuid) - position(b.id.uuid));
};

const QUERY_FIELDS = {
  include: ['images', 'author'],
  'fields.listing': ['title', 'price', 'publicData', 'createdAt'],
  'fields.image': ['variants.square-small', 'variants.square-small2x'],
  'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
};

/**
 * Module B: New from India (homepage-editorial-modules.md).
 * Recency as curation: up to 8 of the newest listings across brands, at most 2 per brand, so
 * one ingestion run can't flood the row. The listing ids come from configBrands.js
 * (newFromIndiaListingIds, harvested by scripts/harvest-new-from-india-ids.js); only those
 * from the last FRESH_WINDOW_DAYS are shown, and the section hides below MIN_FRESH_COUNT.
 * With no baked ids it falls back to a live newest-first query (note `sort: 'createdAt'` is
 * newest first in Sharetribe; '-createdAt' is oldest first).
 * Rendered as a 2-column grid on phones (first 4) and 4 columns on desktop (all 8).
 */
const NewFromIndia = () => {
  const intl = useIntl();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRecent = async () => {
      try {
        const useBakedIds = newFromIndiaListingIds.length > 0;
        const response = await sdk.listings.query(
          useBakedIds
            ? {
                ids: newFromIndiaListingIds,
                perPage: newFromIndiaListingIds.length,
                ...QUERY_FIELDS,
              }
            : { sort: 'createdAt', perPage: FETCH_POOL_SIZE, ...QUERY_FIELDS }
        );

        if (response?.data) {
          const entities = updatedEntities({}, response.data);
          const refs = response.data.data.map(l => ({ id: l.id, type: 'listing' }));
          const denormalised = denormalisedEntities(entities, refs, false);

          if (!cancelled) {
            const next = useBakedIds
              ? capPerBrand(
                  freshInIdOrder(denormalised, newFromIndiaListingIds),
                  MAX_PER_BRAND,
                  DISPLAY_COUNT
                )
              : capPerBrand(denormalised, MAX_PER_BRAND, DISPLAY_COUNT);
            setListings(useBakedIds && next.length < MIN_FRESH_COUNT ? [] : next);
          }
        }
      } catch {
        // Leave empty — module hides itself.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && listings.length === 0) return null;

  return (
    <ProductCarousel
      title={intl.formatMessage({ id: 'NewFromIndia.title' })}
      subtitle={intl.formatMessage({ id: 'NewFromIndia.subtitle' })}
      listings={listings}
      isLoading={isLoading}
      minItems={1}
      showAuthorInfo={true}
      showTrustBadges={false}
      showConversionBadges={false}
      showInrPrice={false}
      layout="grid"
      showVariantCount={false}
      onItemClick={listing => pushNewFromIndiaClick(listing.author?.id?.uuid, listing.id.uuid)}
    />
  );
};

export default NewFromIndia;
