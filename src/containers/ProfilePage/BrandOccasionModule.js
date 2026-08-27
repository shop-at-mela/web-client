import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink, ListingCard } from '../../components';
import {
  OCCASIONS,
  getActiveSeasonOccasion,
} from '../MelaHomePage/sections/CategoryShowcase/CategoryShowcase';

import css from './BrandOccasionModule.module.css';

const DISPLAY_COUNT = 6;
const MIN_TO_SHOW_PANEL = 2;

// publicData.occasion is stored as an array (schema-aware ingestion) or,
// for older listings ingested before the schema was configured, a bare string.
const listingOccasions = listing => {
  const occasions = listing?.attributes?.publicData?.occasion;
  if (Array.isArray(occasions)) return occasions;
  if (typeof occasions === 'string') return [occasions];
  return [];
};

/**
 * "Shop by Occasion" module for the brand storefront (/brands/:brandSlug).
 *
 * Unlike OccasionStrip (homepage/CategoryPage), this doesn't fetch its own data —
 * ProfilePage's loadData already loads the brand's full listing set into props before this
 * renders, so occasion panels are just a client-side filter of listings the page already
 * has. Also unlike OccasionStrip, this doesn't restrict itself to only the 2-3
 * currently-in-season occasions — a brand's off-season inventory (e.g. Karva Chauth pieces
 * browsed in December) is still worth surfacing on their own storefront, since there's no
 * extra fetch cost to showing every qualifying panel. getActiveSeasonOccasion() is used only
 * to rank in-season occasions first among whichever panels already qualify.
 */
const BrandOccasionModule = ({ listings = [], brandUserId }) => {
  const activeOptions = getActiveSeasonOccasion();
  const orderedOccasions = [...OCCASIONS].sort((a, b) => {
    const rankA = activeOptions.indexOf(a.option);
    const rankB = activeOptions.indexOf(b.option);
    const scoreA = rankA === -1 ? activeOptions.length : rankA;
    const scoreB = rankB === -1 ? activeOptions.length : rankB;
    return scoreA - scoreB;
  });

  const panels = orderedOccasions
    .map(occasion => ({
      occasion,
      products: listings
        .filter(listing =>
          listingOccasions(listing).some(tag => occasion.matchValues.includes(tag))
        )
        .slice(0, DISPLAY_COUNT),
    }))
    .filter(panel => panel.products.length >= MIN_TO_SHOW_PANEL);

  if (panels.length === 0) {
    return null;
  }

  return (
    <div className={css.occasionModule}>
      <h3 className={css.title}>
        <FormattedMessage id="BrandStorefront.shopByOccasion" defaultMessage="Shop by Occasion" />
      </h3>

      <div className={css.occasionPanels}>
        {panels.map(({ occasion, products }) => {
          const ctaLabel = occasion.cta;
          const queryParts = {
            pub_occasion: `has_any:${occasion.matchValues.join(',')}`,
            ...(brandUserId ? { author_id: brandUserId } : {}),
          };
          const viewAllSearch = '?' + new URLSearchParams(queryParts).toString();

          const panelColorClass =
            occasion.colorTheme === 'festive' ? css.occasionPanelFestive : css.occasionPanelGifting;
          const ctaColorClass =
            occasion.colorTheme === 'festive' ? css.occasionCtaFestive : css.occasionCtaGifting;

          return (
            <div key={occasion.option} className={`${css.occasionPanel} ${panelColorClass}`}>
              <div className={css.occasionPanelHeader}>
                <h4 className={css.occasionPanelTitle}>{occasion.label}</h4>
              </div>

              <div className={css.productCarousel}>
                {products.map(listing => (
                  <div key={listing.id.uuid} className={css.carouselCard}>
                    <ListingCard
                      listing={listing}
                      showAuthorInfo={false}
                      showTrustBadges={true}
                      showConversionBadges={true}
                      isBestseller={listing.attributes?.publicData?.isBestseller || false}
                      renderSizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                    />
                  </div>
                ))}
              </div>

              <div className={css.occasionCtaRow}>
                <NamedLink
                  name="SearchPage"
                  to={{ search: viewAllSearch }}
                  className={`${css.occasionCta} ${ctaColorClass}`}
                >
                  {ctaLabel} <span className={css.arrow}>→</span>
                </NamedLink>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandOccasionModule;
