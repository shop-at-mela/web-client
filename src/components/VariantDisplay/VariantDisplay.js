import React from 'react';
import css from './VariantDisplay.module.css';

/**
 * VariantDisplay — renders a simple comma-separated list of variant dimensions.
 *
 * Props:
 *   variantsString {string} — e.g. "Size:S,M,L,XL|Color:Red,Blue,Green"
 *
 * Returns null when variantsString is empty, so existing listings with no
 * variant data render nothing (purely additive stop-gap).
 */
const VariantDisplay = ({ variantsString }) => {
  if (!variantsString || typeof variantsString !== 'string' || !variantsString.trim()) {
    return null;
  }

  const dimensions = variantsString
    .split('|')
    .map(part => {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) return null;
      const label = part.substring(0, colonIdx).trim();
      const values = part
        .substring(colonIdx + 1)
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
      return values.length > 0 ? { label, values } : null;
    })
    .filter(Boolean);

  if (dimensions.length === 0) return null;

  return (
    <div className={css.root}>
      {dimensions.map(({ label, values }) => (
        <div key={label} className={css.dimension}>
          <span className={css.label}>{label === 'Size' ? 'Sizes' : label === 'Color' ? 'Colors' : label}:</span>
          <span className={css.values}>{values.join(', ')}</span>
        </div>
      ))}
    </div>
  );
};

export default VariantDisplay;
