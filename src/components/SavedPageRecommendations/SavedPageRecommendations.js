import React, { useEffect, useState } from 'react';
import { arrayOf, func, string } from 'prop-types';

import { useIntl } from '../../util/reactIntl';
import { ProductCarousel } from '../../components';
import { denormalisedEntities, updatedEntities } from '../../util/data';
import { pushSavedRecommendationClick } from '../../util/analytics/savedRecommendations';
import sdk from '../../util/homepageSdk';

const DISPLAY_COUNT = 8;
const MAX_PER_BRAND = 2;
// Over-fetch so excludeIds + the per-brand cap still leave enough to fill DISPLAY_COUNT.
const FETCH_POOL_SIZE = 40;

/**
 * Caps `sortedListings` (already sorted by recency) at `maxPerBrand` per author,
 * preserving order, stopping once `limit` items are collected. Same pattern as
 * NewFromIndia.js's capPerBrand — kept as a local copy since the two modules query
 * differently-filtered pools and there's no shared module for this one helper yet.
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
 * SavedPageRecommendations — inspiration-first recs rail for /saved
 * (add-to-cart-restoration-prd.md §14). Modeled on NewFromIndia.js: recency query via
 * the shared homepageSdk instance, denormalised, capped per brand, rendered through
 * ProductCarousel. Excludes anything already saved and self-hides when the filtered
 * result is empty — never renders an empty carousel.
 *
 * `onLoaded(hasItems)` fires once the fetch settles (success or failure) so the host
 * page can fold `recs_shown` onto its own `saved_page_view` analytics event without
 * this component needing to know anything about that event.
 */
const SavedPageRecommendations = ({
  excludeIds = [],
  onLoaded,
  titleId = 'SavedPageRecommendations.title',
  subtitleId = 'SavedPageRecommendations.subtitle',
  className,
}) => {
  const intl = useIntl();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRecommended = async () => {
      try {
        const response = await sdk.listings.query({
          sort: '-createdAt',
          perPage: FETCH_POOL_SIZE,
          include: ['images', 'author'],
          'fields.listing': ['title', 'price', 'publicData', 'createdAt'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
          'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
        });

        if (response?.data) {
          const entities = updatedEntities({}, response.data);
          const refs = response.data.data.map(l => ({ id: l.id, type: 'listing' }));
          const denormalised = denormalisedEntities(entities, refs, false);
          const excludeSet = new Set(excludeIds);
          const notAlreadySaved = denormalised.filter(l => !excludeSet.has(l.id.uuid));
          const capped = capPerBrand(notAlreadySaved, MAX_PER_BRAND, DISPLAY_COUNT);

          if (!cancelled) {
            setListings(capped);
            onLoaded?.(capped.length > 0);
          }
        } else if (!cancelled) {
          onLoaded?.(false);
        }
      } catch {
        // Leave empty — module hides itself; still report back so the host page's
        // analytics doesn't wait forever on a failed fetch.
        if (!cancelled) onLoaded?.(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRecommended();
    return () => {
      cancelled = true;
    };
    // Fetch once per mount, same as NewFromIndia — excludeIds is a snapshot of what
    // was saved when the rail first mounted, not a live-updating filter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoading && listings.length === 0) return null;

  return (
    <div className={className}>
      <ProductCarousel
        title={intl.formatMessage({ id: titleId })}
        subtitle={intl.formatMessage({ id: subtitleId })}
        listings={listings}
        isLoading={isLoading}
        minItems={1}
        showAuthorInfo
        showTrustBadges={false}
        showConversionBadges={false}
        showInrPrice={false}
        onItemClick={listing =>
          pushSavedRecommendationClick(listing.author?.id?.uuid, listing.id.uuid)
        }
      />
    </div>
  );
};

SavedPageRecommendations.propTypes = {
  excludeIds: arrayOf(string),
  onLoaded: func,
  titleId: string,
  subtitleId: string,
  className: string,
};

export default SavedPageRecommendations;
