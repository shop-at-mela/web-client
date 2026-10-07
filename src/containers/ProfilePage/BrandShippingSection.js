/**
 * BrandShippingSection
 *
 * "Shipping to the US" section of the brand page Products tab (PRD
 * international-shipping-transparency P1.7). Sits between the Featured row / occasion module
 * and All Products, so it is reachable on brands whose product grid loads on scroll.
 *
 *   - h2, then a 40 to 60 word passage that is always visible and stands alone when quoted
 *   - a collapsed-by-default FAQ using the category page accordion markup
 *   - a byline with the date the brand's terms were last checked, only for fresh data
 *
 * Everything comes from getBrandShippingSection(), the same function ProfilePage uses for the
 * FAQPage JSON-LD, so the structured data equals the visible text. A brand with no data, or
 * stale data, gets a neutral passage and the first FAQ item only.
 */

import React from 'react';
import { object, string } from 'prop-types';
import { useIntl } from '../../util/reactIntl';
import { getBrandShippingSection } from '../../util/brandShipping';

import css from './BrandShippingSection.module.css';

export const BRAND_SHIPPING_SECTION_ID = 'shipping-to-the-us';

const BrandShippingSection = ({ usShipping, brand }) => {
  const intl = useIntl();
  const { passage, faq, byline } = getBrandShippingSection(usShipping, brand, intl);

  return (
    <section
      id={BRAND_SHIPPING_SECTION_ID}
      className={css.root}
      aria-labelledby={`${BRAND_SHIPPING_SECTION_ID}-title`}
    >
      <h2 id={`${BRAND_SHIPPING_SECTION_ID}-title`} className={css.title}>
        {intl.formatMessage({ id: 'BrandShipping.sectionTitle' })}
      </h2>
      <p className={css.passage}>{passage}</p>
      {faq.map(item => (
        <details key={item.id} className={css.faqAccordion}>
          <summary className={css.faqSummary}>
            <h3 className={css.faqQuestion}>{item.question}</h3>
          </summary>
          <p className={css.faqAnswer}>{item.answer}</p>
        </details>
      ))}
      {byline ? <p className={css.byline}>{byline}</p> : null}
    </section>
  );
};

BrandShippingSection.propTypes = {
  usShipping: object,
  brand: string.isRequired,
};

export default BrandShippingSection;
