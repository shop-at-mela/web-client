import React, { useEffect, useState } from 'react';
import { useIntl } from '../../../../util/reactIntl';
import { ProductCarousel } from '../../../../components';
import { denormalisedEntities, updatedEntities } from '../../../../util/data';
import { pushNewFromIndiaClick } from '../../../../util/analytics/homepageEditorial';
import sdk from '../../../../util/homepageSdk';

const DISPLAY_COUNT = 8;
const MAX_PER_BRAND = 2;
const FETCH_POOL_SIZE = 30; // over-fetch so the per-brand cap still yields 8 after filtering

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
 * Module B: New from India (homepage-editorial-modules.md).
 * Recency as curation — the 8 most recent listings across all categories, capped at
 * 2 per brand so one ingestion run can't flood the row. Entirely automatic: no CMS.
 */
const NewFromIndia = () => {
  const intl = useIntl();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRecent = async () => {
      try {
        const response = await sdk.listings.query({
          sort: '-createdAt',
          perPage: FETCH_POOL_SIZE,
          include: ['images', 'author'],
          'fields.listing': ['title', 'price', 'publicData', 'createdAt'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
          'fields.user': ['profile.displayName'],
        });

        if (response?.data) {
          const entities = updatedEntities({}, response.data);
          const refs = response.data.data.map(l => ({ id: l.id, type: 'listing' }));
          const denormalised = denormalisedEntities(entities, refs, false);

          if (!cancelled) {
            setListings(capPerBrand(denormalised, MAX_PER_BRAND, DISPLAY_COUNT));
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
      onItemClick={listing => pushNewFromIndiaClick(listing.author?.id?.uuid, listing.id.uuid)}
    />
  );
};

export default NewFromIndia;
