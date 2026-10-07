/**
 * ListingTrustChips
 *
 * Displays the brand's "Duties included" chip, certification badges and occasion chips on the
 * listing page.
 * Placed between the product title and ItemSpecifics table for maximum scan visibility.
 *
 * Data sources:
 *   - Duties: the brand's `brandUsShipping` (via the `usShipping` prop). Only a brand that
 *     includes US duties in its prices gets a chip, and it comes first. No chip for any other
 *     state, and never on grid cards (PRD P1.3).
 *   - Certifications: publicData.certification[] (e.g. ['gots_certified', 'non_toxic_dyes'])
 *   - Occasions: parsed from publicData.itemAspects where fieldId === 'occasion'
 *
 * Returns null when no chips to show.
 *
 * Usage:
 *   <ListingTrustChips
 *     certifications={publicData.certification}
 *     itemAspects={publicData.itemAspects}
 *     usShipping={getBrandUsShipping(author)}
 *     brand={publicData.brand}
 *   />
 */

import React from 'react';
import { arrayOf, object, string } from 'prop-types';
import { useIntl } from '../../util/reactIntl';
import { getDutiesTooltip, getShippingTerms } from '../../util/brandShipping';
import { parseItemAspects } from '../../util/itemAspectsHelpers';
import { CERT_LABELS } from '../../util/certificationHelpers';
import InfoTooltip from '../InfoTooltip/InfoTooltip';

import css from './ListingTrustChips.module.css';

// fieldIds from item_aspects that represent occasion/use context
const OCCASION_FIELD_IDS = ['occasion', 'use', 'use_case', 'season'];

const ListingTrustChips = ({ certifications, itemAspects, usShipping, brand }) => {
  const intl = useIntl();

  // "Duties included" chip: fresh DDP data with duties in the prices.
  const brandName = brand || intl.formatMessage({ id: 'BrandShipping.brandFallback' });
  const terms = usShipping ? getShippingTerms(usShipping, brandName, intl) : null;
  const dutiesChips = terms?.dutiesChip
    ? [
        {
          type: 'duties',
          key: 'duties-included',
          label: intl.formatMessage({ id: 'BrandShipping.chipDutiesIncluded' }),
          tooltip: getDutiesTooltip(terms.dutiesState, brandName, intl),
        },
      ]
    : [];

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

  const allChips = [...dutiesChips, ...certChips, ...occasionChips];

  if (allChips.length === 0) return null;

  return (
    <div className={css.root} aria-label="Product trust signals" role="list">
      {allChips.map(chip => (
        <span
          key={chip.key}
          className={chip.type === 'occasion' ? css.occasionChip : css.certChip}
          role="listitem"
        >
          {chip.type === 'occasion' ? 'For: ' : '✓ '}
          {chip.label}
          {chip.tooltip ? (
            <InfoTooltip
              label={intl.formatMessage({ id: 'BrandShipping.tooltipLabelDuties' })}
              className={css.chipTooltip}
            >
              {chip.tooltip}
            </InfoTooltip>
          ) : null}
        </span>
      ))}
    </div>
  );
};

ListingTrustChips.propTypes = {
  certifications: arrayOf(string),
  itemAspects: string,
  usShipping: object,
  brand: string,
};

export default ListingTrustChips;
