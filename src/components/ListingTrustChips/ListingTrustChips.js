/**
 * ListingTrustChips
 *
 * Displays certification badges and occasion chips on the listing page.
 * Placed between the product title and ItemSpecifics table for maximum scan visibility.
 *
 * Data sources (both already in publicData — no new pipeline work):
 *   - Certifications: publicData.certification[] (e.g. ['gots_certified', 'non_toxic_dyes'])
 *   - Occasions: parsed from publicData.itemAspects where fieldId === 'occasion'
 *
 * Returns null when no chips to show.
 *
 * Usage:
 *   <ListingTrustChips
 *     certifications={publicData.certification}
 *     itemAspects={publicData.itemAspects}
 *   />
 */

import React from 'react';
import { arrayOf, string } from 'prop-types';
import { parseItemAspects } from '../../util/itemAspectsHelpers';
import { CERT_LABELS } from '../../util/certificationHelpers';
import css from './ListingTrustChips.module.css';

// fieldIds from item_aspects that represent occasion/use context
const OCCASION_FIELD_IDS = ['occasion', 'use', 'use_case', 'season'];

const ListingTrustChips = ({ certifications, itemAspects }) => {
  // Build certification chips
  const certChips = (certifications || [])
    .filter(cert => CERT_LABELS[cert])
    .map(cert => ({ type: 'cert', key: cert, label: CERT_LABELS[cert] }));

  // Parse occasion chips from item_aspects
  const occasionChips = itemAspects
    ? parseItemAspects(itemAspects)
        .filter(aspect => OCCASION_FIELD_IDS.includes(aspect.fieldId))
        .map(aspect => ({ type: 'occasion', key: `occasion-${aspect.optionValue}`, label: aspect.value }))
    : [];

  const allChips = [...certChips, ...occasionChips];

  if (allChips.length === 0) return null;

  return (
    <div className={css.root} aria-label="Product trust signals" role="list">
      {allChips.map(chip => (
        <span
          key={chip.key}
          className={chip.type === 'cert' ? css.certChip : css.occasionChip}
          role="listitem"
        >
          {chip.type === 'cert' ? '✓ ' : 'For: '}{chip.label}
        </span>
      ))}
    </div>
  );
};

ListingTrustChips.propTypes = {
  certifications: arrayOf(string),
  itemAspects: string,
};

export default ListingTrustChips;
