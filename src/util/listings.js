/**
 * Shared utilities for listing operations.
 */

/**
 * Fisher-Yates shuffle algorithm for randomizing arrays.
 * Properly randomizes an array (unlike sort-based approaches).
 *
 * @param {Array} arr - Array to randomize
 * @param {number} count - Number of items to return (defaults to array length)
 * @returns {Array} Randomized subset of the input array
 */
export const pickRandom = (arr, count) => {
  if (arr.length <= count) return arr;
  const shuffled = [...arr];
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

/**
 * Attach image objects to listings from normalized included data.
 * Required because ListingImage component expects listing.images array.
 *
 * @param {Array} listings - Listing objects with image relationships
 * @param {Array} includedData - Normalized image entities from API response
 * @returns {Array} Listings with images array attached
 */
export const attachImagesToListings = (listings, includedData) => {
  const imageMap = {};

  // Create a map of image IDs to image objects
  (includedData || []).forEach(item => {
    if (item.type === 'image') {
      imageMap[item.id.uuid] = item;
    }
  });

  // Attach images to each listing
  return listings.map(listing => {
    const imageRelationships = listing.relationships?.images?.data || [];
    const images = imageRelationships.map(rel => imageMap[rel.id.uuid]).filter(Boolean);

    return {
      ...listing,
      images: images, // Top-level: required by ListingImage (listing.images[0])
      attributes: {
        ...listing.attributes,
      },
    };
  });
};
