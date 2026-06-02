import React from 'react';
import { SavedListingButton } from '../../components';
import ListingImageGallery from './ListingImageGallery/ListingImageGallery';

import css from './ListingPage.module.css';

const SectionGallery = props => {
  const { listing, variantPrefix } = props;
  const images = listing.images;
  const listingId = listing?.id?.uuid;
  const title = listing?.attributes?.title || '';
  const firstImage = images?.[0];
  const imageUrl = firstImage?.attributes?.variants?.['listing-card']?.url || '';

  // Use predefined high-quality variants first, then fallback to custom variants
  const imageVariants = ['landscape-crop6x', 'landscape-crop4x', 'landscape-crop2x', 'landscape-crop', 'scaled-xlarge', 'scaled-large'];
  const thumbnailVariants = ['landscape-crop4x', 'landscape-crop2x', 'landscape-crop', 'scaled-large'];
  return (
    <section className={css.productGallery} data-testid="carousel">
      <ListingImageGallery
        images={images}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
      />
      {listingId && (
        <SavedListingButton
          listingId={listingId}
          listingData={{ title, imageUrl }}
          variant="icon"
          className={css.gallerySaveButton}
        />
      )}
    </section>
  );
};

export default SectionGallery;
