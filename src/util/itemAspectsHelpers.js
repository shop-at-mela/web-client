/**
 * Parse Item Aspects string from listing publicData
 * Format: "Field Name|field_id: Display Value|option_value|description; ..."
 *
 * @param {string} itemAspectsString - Raw item aspects string from listing
 * @returns {Array} Array of {key, value, description, fieldId, optionValue} objects
 */
export const parseItemAspects = (itemAspectsString) => {
  if (!itemAspectsString || typeof itemAspectsString !== 'string') {
    return [];
  }

  const result = [];

  try {
    // Split by semicolon to get individual attributes
    const attributes = itemAspectsString
      .split(';')
      .map(attr => attr.trim())
      .filter(attr => attr.length > 0);

    for (const attribute of attributes) {
      // Split by colon to separate field from value
      const colonIndex = attribute.indexOf(':');
      if (colonIndex === -1) continue;

      const fieldPart = attribute.substring(0, colonIndex).trim();
      const valuePart = attribute.substring(colonIndex + 1).trim();

      // Extract field name and field_id from "Field Name|field_id"
      const fieldParts = fieldPart.split('|').map(p => p.trim());
      if (fieldParts.length !== 2) continue;

      const fieldName = fieldParts[0]; // Display name (e.g., "Material")
      const fieldId = fieldParts[1]; // Field ID (e.g., "material")

      // Extract display value, option value, and description from "Display Value|option_value|description"
      const valueParts = valuePart.split('|').map(v => v.trim());
      if (valueParts.length === 0) continue;

      const displayValue = valueParts[0] || ''; // Display value (e.g., "Handspun Handwoven Denim")
      const optionValue = valueParts.length > 1 ? valueParts[1] : ''; // Option value (e.g., "handspun_denim")
      const description = valueParts.length > 2 ? valueParts[2] : ''; // Description/benefit (e.g., "Eco-friendly and artisan-crafted")

      result.push({
        key: fieldName,
        value: displayValue,
        description, // For SEO purposes, not displayed
        fieldId,
        optionValue,
      });
    }
  } catch (error) {
    console.warn('Error parsing item aspects:', error);
    return [];
  }

  return result;
};

/**
 * Get item specifics attributes for display
 * Parses itemAspects string and returns formatted attributes
 *
 * @param {object} publicData - Listing publicData
 * @returns {Array} Array of {key, value} objects for ItemSpecifics component
 */
export const getItemSpecificsAttributes = (publicData) => {
  const attributes = [];

  // Parse itemAspects if available
  if (publicData.itemAspects) {
    const parsedAspects = parseItemAspects(publicData.itemAspects);
    attributes.push(...parsedAspects.map(({ key, value }) => ({ key, value })));
  }

  // Add brand if not already in itemAspects
  if (publicData.brand && !attributes.some(attr => attr.key.toLowerCase() === 'brand')) {
    attributes.unshift({ key: 'Brand', value: publicData.brand });
  }

  // Add SKU if available
  if (publicData.sku) {
    attributes.push({ key: 'SKU', value: publicData.sku });
  }

  return attributes;
};

/**
 * Get SEO-friendly description from item aspects
 * Extracts all descriptions/benefits for SEO purposes
 *
 * @param {object} publicData - Listing publicData
 * @returns {string} Combined descriptions for SEO
 */
export const getItemAspectsForSEO = (publicData) => {
  if (!publicData.itemAspects) {
    return '';
  }

  const parsedAspects = parseItemAspects(publicData.itemAspects);
  const descriptions = parsedAspects
    .filter(aspect => aspect.description)
    .map(aspect => `${aspect.key}: ${aspect.description}`)
    .join('. ');

  return descriptions;
};
