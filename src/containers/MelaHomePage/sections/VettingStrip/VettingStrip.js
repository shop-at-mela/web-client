import React, { useEffect, useRef } from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { getAllBrandIds } from '../../../../config/configBrands';
import { pushVettingStripView, pushVettingStripClick } from '../../../../util/analytics/vettingStrip';

import css from './VettingStrip.module.css';

/**
 * VettingStrip — P0.1 compressed trust band, directly under the hero and before the
 * first product carousel. Reuses no new claims: brand count is read live from
 * configBrands.js so it can never drift the way the old hero copy did.
 *
 * @param {Object} props
 * @param {string} [props.vettingSectionId] - id of the "How We Vet" section to smooth-scroll to
 */
const VettingStrip = ({ vettingSectionId = 'how-we-vet' }) => {
  const rootRef = useRef(null);
  const hasFiredView = useRef(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !rootRef.current) return undefined;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !hasFiredView.current) {
          hasFiredView.current = true;
          pushVettingStripView();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  const handleHowWeVetClick = e => {
    e.preventDefault();
    pushVettingStripClick();
    document.getElementById(vettingSectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const brandCount = getAllBrandIds().length;

  return (
    <section className={css.root} ref={rootRef}>
      <span className={css.item}>
        <span className={css.check}>✓</span>{' '}
        <FormattedMessage id="VettingStrip.brandsVetted" values={{ count: brandCount }} />
      </span>
      <span className={css.item}>
        <span className={css.check}>✓</span>{' '}
        <FormattedMessage id="VettingStrip.shipping" />
      </span>
      <span className={css.item}>
        <span className={css.check}>✓</span>{' '}
        <FormattedMessage id="VettingStrip.cards" />
      </span>
      <a className={css.how} href={`#${vettingSectionId}`} onClick={handleHowWeVetClick}>
        <FormattedMessage id="VettingStrip.howWeVet" />
      </a>
    </section>
  );
};

export default VettingStrip;
