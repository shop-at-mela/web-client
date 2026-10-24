import React from 'react';
import { string } from 'prop-types';
import { FormattedMessage } from '../../../../util/reactIntl';
import NamedLink from '../../../../components/NamedLink/NamedLink';

import css from './HowWeVet.module.css';

const POINT_IDS = ['HowWeVet.point1', 'HowWeVet.point2', 'HowWeVet.point3'];

/**
 * HowWeVet — homepage declutter v3 (2026-10-24). One navy band with three numbered points
 * and a link to the About page's "What we check" section. Replaces TrustAssurance (the
 * certification cards and "Need help?" block) on the homepage.
 *
 * Keeps the `how-we-vet` id: VettingStrip's "How we vet" link scrolls here.
 *
 * @param {Object} props
 * @param {string} [props.id] section id, the VettingStrip scroll target
 */
const HowWeVet = ({ id = 'how-we-vet' }) => (
  <section id={id} className={css.root} aria-labelledby={`${id}-title`}>
    <div className={css.inner}>
      <h2 id={`${id}-title`} className={css.title}>
        <FormattedMessage id="HowWeVet.title" />
      </h2>
      <ol className={css.points}>
        {POINT_IDS.map(pointId => (
          <li key={pointId} className={css.point}>
            <FormattedMessage id={pointId} />
          </li>
        ))}
      </ol>
      <NamedLink name="AboutPage" to={{ hash: '#about-check' }} className={css.link}>
        <FormattedMessage id="HowWeVet.moreLink" />
      </NamedLink>
    </div>
  </section>
);

HowWeVet.propTypes = {
  id: string,
};

export default HowWeVet;
