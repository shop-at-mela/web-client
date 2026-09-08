/**
 * Derives a brand's short "craft" line from its publicData — the same fallback chain
 * used across BrandPhotoCard, BrandSpotlight, CraftStories, and BrandStorefront:
 * brandCraft → brandTagline → first sentence of bio. Not every brand has any of the
 * three; callers should render nothing rather than a placeholder when this is null.
 */
export const deriveBrandCraftLine = brand => {
  const { bio, publicData } = brand?.attributes?.profile || {};
  const firstSentence = bio ? bio.split('.')[0].trim() : '';
  return publicData?.brandCraft || publicData?.brandTagline || firstSentence || null;
};
