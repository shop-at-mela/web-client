/**
 * Helpers for page <title> text: readable category names from URL slugs, and a shared
 * title-length limit. Search results cut titles at about 60 characters.
 */

export const MAX_TITLE_LENGTH = 60;

// Slugs whose readable form is not a plain "A & B" or "A B C" join.
const SLUG_LABEL_OVERRIDES = {
  'Rugs-Floor-Coverings': 'Rugs & Floor Coverings',
};

/**
 * Readable label from a category slug: "Lighting-Outdoor" -> "Lighting & Outdoor".
 * Two-part slugs join with " & ", longer slugs join with spaces. Text that already has a
 * space or no hyphen is returned unchanged.
 *
 * @param {string} slug
 * @returns {string}
 */
export const humanizeCategorySlug = slug => {
  const text = String(slug || '').trim();
  if (!text || /\s/.test(text) || !text.includes('-')) return text;
  if (SLUG_LABEL_OVERRIDES[text]) return SLUG_LABEL_OVERRIDES[text];
  const parts = text.split('-').filter(Boolean);
  return parts.length === 2 ? parts.join(' & ') : parts.join(' ');
};

/**
 * Category label for titles and descriptions. Uses the configured name when it reads as a
 * label; when the configured name is missing or is just the raw slug (the hosted config can
 * carry the slug as the name), falls back to humanizing the slug.
 *
 * @param {string?} configName name from the category config
 * @param {string?} slug category id as it appears in the URL
 * @returns {string}
 */
export const categoryDisplayName = (configName, slug) => {
  const name = String(configName || '').trim();
  if (name && name !== slug && !(/^\S+$/.test(name) && name.includes('-'))) return name;
  return humanizeCategorySlug(name || slug);
};

/**
 * Pick the first candidate title that fits the limit. Candidates run from most to least
 * descriptive. Titles are never cut mid-word; when none fits, the shortest candidate wins.
 *
 * @param {string[]} candidates
 * @param {number} max
 * @returns {string}
 */
export const pickTitleThatFits = (candidates, max = MAX_TITLE_LENGTH) => {
  const usable = candidates.filter(Boolean);
  const fit = usable.find(t => t.length <= max);
  if (fit) return fit;
  return usable.reduce((a, b) => (b.length < a.length ? b : a), usable[0] || '');
};
