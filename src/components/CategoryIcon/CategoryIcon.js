import React from 'react';
import classNames from 'classnames';

import css from './CategoryIcon.module.css';

/**
 * CategoryIcon — custom line glyphs for Mela's product categories.
 *
 * India-resonant, single-weight line icons (navy via `currentColor`) that replace
 * generic emoji so the category language reads as an intentional, on-brand set.
 * Keyed by the homepage category id used in both the hero pills
 * (TOP_CATEGORY_PILLS) and CategoryShowcase (ALL_CATEGORIES), so the same glyph
 * can repeat everywhere a category is named.
 *
 * Renders `null` for an unknown id so callers can drop it in safely.
 *
 * @component
 * @param {Object} props
 * @param {string} props.categoryId category id, e.g. 'Baby-Kids', 'Fashion'
 * @param {number} [props.size] pixel size of the square icon (default 20)
 * @param {string} [props.className] extra classes in addition to css.root
 * @param {string} [props.rootClassName] overrides css.root
 * @returns {JSX.Element|null}
 */
const CATEGORY_GLYPHS = {
  // Baby & Kids — rattle
  'Baby-Kids': (
    <>
      <circle cx="8.5" cy="8.5" r="4.5" />
      <path d="M7 7.4h.01M10 6.9h.01" />
      <path d="M11.7 11.7l3.4 3.4" />
      <circle cx="16.9" cy="16.9" r="1.8" />
    </>
  ),
  // Fashion — jutti (upturned curled-toe slipper)
  Fashion: (
    <>
      <path d="M3.5 15.5h11c2.4 0 4-.6 5.2-2 .5-.6 0-1.6-.8-1.6-2.3 0-3.5-.7-4.4-2.2" />
      <path d="M9.7 9.7c-1.3 1.7-3 2.8-4.9 3.1-.8.1-1.3.7-1.3 1.5v1.2" />
    </>
  ),
  // Home & Kitchen — handi (pot)
  'Home-Kitchen': (
    <>
      <path d="M6 9h12" />
      <path d="M7 9c-1.5 0-2.5 2-2.5 5s1.8 5 7.5 5 7.5-2 7.5-5-1-5-2.5-5" />
      <path d="M8 9V7.5C8 6 9.8 5 12 5s4 1 4 2.5V9" />
    </>
  ),
  // Jewelry & Accessories — jhumka (bell earring)
  'Jewelry-Accessories': (
    <>
      <circle cx="12" cy="5" r="1.4" />
      <path d="M12 6.4v2.6" />
      <path d="M8 15c0-3 1.8-6 4-6s4 3 4 6z" />
      <path d="M7.5 15h9" />
      <circle cx="9.5" cy="17.6" r="1" />
      <circle cx="12" cy="18" r="1" />
      <circle cx="14.5" cy="17.6" r="1" />
    </>
  ),
  // Beauty & Wellness — lotus
  'Beauty-Wellness': (
    <>
      <path d="M12 19c-2.4 0-4.2-2.2-4.2-5S12 8.5 12 8.5s4.2 2.7 4.2 5.5S14.4 19 12 19z" />
      <path d="M12 19c-3.4 0-6-1.8-6-4.4 2 0 3.6.8 4.6 2.2" />
      <path d="M12 19c3.4 0 6-1.8 6-4.4-2 0-3.6.8-4.6 2.2" />
    </>
  ),
  // Art & Craft — block-print stamp
  'Art-Craft': (
    <>
      <rect x="5" y="4" width="14" height="8" rx="1.5" />
      <path d="M9 8h.01M12 6.2v3.6M15 8h.01" />
      <path d="M10 12v2.5a2 2 0 002 2 2 2 0 002-2V12" />
      <path d="M6 20h12" />
    </>
  ),
};

const CategoryIcon = props => {
  const { categoryId, size = 20, className, rootClassName } = props;
  const glyph = CATEGORY_GLYPHS[categoryId];

  if (!glyph) {
    return null;
  }

  const classes = classNames(rootClassName || css.root, className);

  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      role="none"
      aria-hidden="true"
    >
      {glyph}
    </svg>
  );
};

export default CategoryIcon;
