/**
 * Item Aspects Parser Utility
 *
 * Parses publicData.itemAspects string into structured data for display and Schema.org integration.
 *
 * Format Support:
 * - Basic: "Material|material: Organic Cotton|organic_cotton"
 * - Benefit-enriched: "Material|material: Organic Cotton|organic_cotton|Soft and breathable, GOTS certified"
 *
 * Multiple attributes separated by semicolons:
 * "Material|material: Organic Cotton|organic_cotton; Age Group|age_group: 0-6 months|0_6_months"
 */

/**
 * Parse itemAspects string into structured object
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @returns {Object} Parsed aspects with field ID as key
 *
 * Example input:
 * "Material|material: Organic Cotton|organic_cotton|Soft and breathable; Age Group|age_group: 0-6 months|0_6_months"
 *
 * Example output:
 * {
 *   material: {
 *     displayKey: 'Material',
 *     fieldId: 'material',
 *     displayValue: 'Organic Cotton',
 *     fieldValue: 'organic_cotton',
 *     benefit: 'Soft and breathable'
 *   },
 *   age_group: {
 *     displayKey: 'Age Group',
 *     fieldId: 'age_group',
 *     displayValue: '0-6 months',
 *     fieldValue: '0_6_months',
 *     benefit: null
 *   }
 * }
 */
export const parseItemAspects = (itemAspectsString) => {
  if (!itemAspectsString || typeof itemAspectsString !== 'string') {
    return {};
  }

  const aspects = {};

  // Split by semicolon to get individual attributes
  const attributes = itemAspectsString.split(';').map(attr => attr.trim()).filter(attr => attr);

  attributes.forEach(attr => {
    if (!attr.includes('|') || !attr.includes(':')) {
      return; // Skip malformed attributes
    }

    // Split by colon to separate key part and value part
    const [keyPart, valuePart] = attr.split(':').map(part => part.trim());

    if (!keyPart || !valuePart) {
      return;
    }

    // Parse key part: "Material|material"
    const keyParts = keyPart.split('|').map(part => part.trim());
    if (keyParts.length < 2) {
      return;
    }

    const [displayKey, fieldId] = keyParts;

    // Parse value part: "Organic Cotton|organic_cotton" or "Organic Cotton|organic_cotton|Benefit text"
    const valueParts = valuePart.split('|').map(part => part.trim());
    if (valueParts.length < 2) {
      return;
    }

    const [displayValue, fieldValue, benefit = null] = valueParts;

    aspects[fieldId] = {
      displayKey,
      fieldId,
      displayValue,
      fieldValue,
      benefit,
    };
  });

  return aspects;
};

/**
 * Get display value for a specific field ID
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @param {string} fieldId - Field ID to retrieve (e.g., 'material', 'age_group')
 * @returns {string|null} Display value or null if not found
 *
 * Example:
 * getDisplayValue("Material|material: Organic Cotton|organic_cotton", "material")
 * // Returns: "Organic Cotton"
 */
export const getDisplayValue = (itemAspectsString, fieldId) => {
  const aspects = parseItemAspects(itemAspectsString);
  return aspects[fieldId]?.displayValue || null;
};

/**
 * Get field value (for filtering) for a specific field ID
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @param {string} fieldId - Field ID to retrieve
 * @returns {string|null} Field value or null if not found
 *
 * Example:
 * getFieldValue("Material|material: Organic Cotton|organic_cotton", "material")
 * // Returns: "organic_cotton"
 */
export const getFieldValue = (itemAspectsString, fieldId) => {
  const aspects = parseItemAspects(itemAspectsString);
  return aspects[fieldId]?.fieldValue || null;
};

/**
 * Get benefit explanation for a specific field ID
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @param {string} fieldId - Field ID to retrieve
 * @returns {string|null} Benefit text or null if not found
 *
 * Example:
 * getBenefit("Material|material: Organic Cotton|organic_cotton|Soft and breathable", "material")
 * // Returns: "Soft and breathable"
 */
export const getBenefit = (itemAspectsString, fieldId) => {
  const aspects = parseItemAspects(itemAspectsString);
  return aspects[fieldId]?.benefit || null;
};

/**
 * Get all display values as simple key-value object
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @returns {Object} Object with display keys and display values
 *
 * Example output:
 * {
 *   'Material': 'Organic Cotton',
 *   'Age Group': '0-6 months',
 *   'Certification': 'GOTS Certified'
 * }
 */
export const getDisplayAspects = (itemAspectsString) => {
  const aspects = parseItemAspects(itemAspectsString);
  const displayAspects = {};

  Object.values(aspects).forEach(aspect => {
    displayAspects[aspect.displayKey] = aspect.displayValue;
  });

  return displayAspects;
};

/**
 * Convert itemAspects to Schema.org additionalProperty format
 * Optimized for AI agent parsing (ChatGPT, Claude, Gemini, Perplexity)
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @param {boolean} includeBenefits - Whether to include benefit descriptions
 * @returns {Array} Array of Schema.org PropertyValue objects
 *
 * Example output:
 * [
 *   {
 *     '@type': 'PropertyValue',
 *     'name': 'Material',
 *     'value': 'Organic Cotton',
 *     'description': 'Soft and breathable, GOTS certified for baby\'s sensitive skin'
 *   },
 *   {
 *     '@type': 'PropertyValue',
 *     'name': 'Age Group',
 *     'value': '0-6 months'
 *   }
 * ]
 */
export const getAspectsForSchema = (itemAspectsString, includeBenefits = true) => {
  const aspects = parseItemAspects(itemAspectsString);
  const propertyValues = [];

  Object.values(aspects).forEach(aspect => {
    const property = {
      '@type': 'PropertyValue',
      name: aspect.displayKey,
      value: aspect.displayValue,
    };

    // Add benefit as description if available and requested
    if (includeBenefits && aspect.benefit) {
      property.description = aspect.benefit;
    }

    propertyValues.push(property);
  });

  return propertyValues;
};

/**
 * Filter aspects by field IDs
 * Useful for displaying only specific attributes
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @param {Array<string>} fieldIds - Array of field IDs to include
 * @returns {Object} Filtered aspects object
 *
 * Example:
 * filterAspects(itemAspectsString, ['material', 'certification'])
 * // Returns only material and certification aspects
 */
export const filterAspects = (itemAspectsString, fieldIds = []) => {
  const allAspects = parseItemAspects(itemAspectsString);
  const filtered = {};

  fieldIds.forEach(fieldId => {
    if (allAspects[fieldId]) {
      filtered[fieldId] = allAspects[fieldId];
    }
  });

  return filtered;
};

/**
 * Get aspects with benefits only
 * Useful for Schema.org integration where only benefit-enriched attributes matter
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @returns {Object} Aspects that have benefit explanations
 *
 * Example:
 * getAspectsWithBenefits(itemAspectsString)
 * // Returns only: { material: {...}, certification: {...} }
 * // Excludes: age_group, color (no benefits)
 */
export const getAspectsWithBenefits = (itemAspectsString) => {
  const allAspects = parseItemAspects(itemAspectsString);
  const withBenefits = {};

  Object.entries(allAspects).forEach(([fieldId, aspect]) => {
    if (aspect.benefit) {
      withBenefits[fieldId] = aspect;
    }
  });

  return withBenefits;
};

/**
 * Format aspects for display in UI table
 *
 * @param {string} itemAspectsString - The itemAspects string from publicData
 * @param {boolean} showBenefits - Whether to include benefits in output
 * @returns {Array<Object>} Array of objects with label and value
 *
 * Example output:
 * [
 *   { label: 'Material', value: 'Organic Cotton', tooltip: 'Soft and breathable' },
 *   { label: 'Age Group', value: '0-6 months', tooltip: null }
 * ]
 */
export const formatAspectsForDisplay = (itemAspectsString, showBenefits = false) => {
  const aspects = parseItemAspects(itemAspectsString);
  const displayArray = [];

  Object.values(aspects).forEach(aspect => {
    const item = {
      label: aspect.displayKey,
      value: aspect.displayValue,
    };

    if (showBenefits && aspect.benefit) {
      item.tooltip = aspect.benefit;
    }

    displayArray.push(item);
  });

  return displayArray;
};

/**
 * Validate itemAspects string format
 *
 * @param {string} itemAspectsString - The itemAspects string to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 *
 * Example:
 * validateItemAspects("Material|material: Organic Cotton|organic_cotton")
 * // Returns: { isValid: true, errors: [] }
 */
export const validateItemAspects = (itemAspectsString) => {
  const result = {
    isValid: true,
    errors: [],
  };

  if (!itemAspectsString) {
    result.isValid = false;
    result.errors.push('itemAspects string is empty or null');
    return result;
  }

  if (typeof itemAspectsString !== 'string') {
    result.isValid = false;
    result.errors.push('itemAspects must be a string');
    return result;
  }

  const attributes = itemAspectsString.split(';').map(attr => attr.trim()).filter(attr => attr);

  if (attributes.length === 0) {
    result.isValid = false;
    result.errors.push('No valid attributes found');
    return result;
  }

  attributes.forEach((attr, index) => {
    if (!attr.includes('|')) {
      result.errors.push(`Attribute ${index + 1}: Missing pipe separator in "${attr}"`);
      result.isValid = false;
    }

    if (!attr.includes(':')) {
      result.errors.push(`Attribute ${index + 1}: Missing colon separator in "${attr}"`);
      result.isValid = false;
    }

    const [keyPart, valuePart] = attr.split(':');

    if (keyPart) {
      const keyParts = keyPart.split('|');
      if (keyParts.length < 2) {
        result.errors.push(`Attribute ${index + 1}: Key part must have format "Display|fieldId"`);
        result.isValid = false;
      }
    }

    if (valuePart) {
      const valueParts = valuePart.split('|');
      if (valueParts.length < 2) {
        result.errors.push(`Attribute ${index + 1}: Value part must have format "Display|value" or "Display|value|benefit"`);
        result.isValid = false;
      }
    }
  });

  return result;
};
