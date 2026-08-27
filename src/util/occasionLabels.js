/**
 * occasionLabels.js
 *
 * Slug→label lookup for occasion values, shared by OccasionStrip (CategoryShowcase.js),
 * GiftingPage, and ListingCard's occasion chips. Lives outside the components/containers
 * import graph deliberately: CategoryShowcase.js imports the `components` barrel (for
 * ProductCarousel), which re-exports ListingCard — so if ListingCard imported this lookup
 * from CategoryShowcase.js directly, it would create a
 * components/index.js → CategoryShowcase.js → components/index.js → ListingCard.js
 * circular import. Sourced from configListing.js's `occasion` + `gift_occasion` enumOptions
 * (the single source of truth per gifting-festival-traffic-prd.md's data-flow reference)
 * rather than duplicated here. CategoryShowcase.js re-exports this for discoverability.
 */
import { listingFields } from '../config/configListing';

const buildOccasionLabelMap = () => {
  const map = {};
  ['occasion', 'gift_occasion'].forEach(key => {
    const field = listingFields.find(f => f.key === key);
    (field?.enumOptions || []).forEach(({ option, label }) => {
      if (!(option in map)) map[option] = label;
    });
  });
  return map;
};

export const OCCASION_LABELS = buildOccasionLabelMap();

export const getOccasionLabel = slug => OCCASION_LABELS[slug] || slug;
