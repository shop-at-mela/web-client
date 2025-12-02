import React from 'react';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { AspectRatioWrapper, ResponsiveImage } from '../../components';

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, {
  loadAfterInitialRendering: 3000,
});

/**
 * Shared listing image component
 * Extracted from ListingCard to be reused across ListingCard, ListingCardMini, etc.
 *
 * @param {Object} props
 * @param {Object} props.listing - Listing entity with images
 * @param {string} props.variant - Image variant prefix (e.g., 'listing-card', 'square-small')
 * @param {string} props.sizes - Responsive sizes attribute for img/srcset
 * @param {boolean} props.lazy - Whether to use lazy loading (default: true)
 * @param {number} props.aspectWidth - Aspect ratio width (default: 1)
 * @param {number} props.aspectHeight - Aspect ratio height (default: 1)
 * @param {string} props.className - Additional CSS class for AspectRatioWrapper
 * @param {string} props.rootClassName - CSS class for the image element itself
 * @param {string} props.alt - Custom alt text (auto-generated if not provided)
 * @param {Object} props.onMouseEnter - Mouse enter handler (for map integration)
 * @param {Object} props.onMouseLeave - Mouse leave handler (for map integration)
 */
export const ListingImage = ({
  listing,
  variant = 'listing-card',
  sizes,
  lazy = true,
  aspectWidth = 1,
  aspectHeight = 1,
  className,
  rootClassName,
  alt,
  onMouseEnter,
  onMouseLeave,
}) => {
  const firstImage =
    listing.images && listing.images.length > 0 ? listing.images[0] : null;

  if (!firstImage) {
    return null;
  }

  // Get variants - prefer variant-specific, fall back to all variants if none match
  const availableVariants = Object.keys(firstImage.attributes?.variants || {});
  const prefixedVariants = availableVariants.filter(k => k.startsWith(variant));
  const variants = prefixedVariants.length > 0 ? prefixedVariants : availableVariants;

  const ImageComponent = lazy ? LazyImage : ResponsiveImage;

  // Generate alt text if not provided
  const altText = alt || `${listing.attributes.title} - organic baby product`;

  // Build props for AspectRatioWrapper, including optional mouse handlers
  const wrapperProps = {
    className,
    width: aspectWidth,
    height: aspectHeight,
  };
  if (onMouseEnter) wrapperProps.onMouseEnter = onMouseEnter;
  if (onMouseLeave) wrapperProps.onMouseLeave = onMouseLeave;

  return (
    <AspectRatioWrapper {...wrapperProps}>
      <ImageComponent
        rootClassName={rootClassName}
        alt={altText}
        image={firstImage}
        variants={variants}
        sizes={sizes}
      />
    </AspectRatioWrapper>
  );
};

export default ListingImage;
