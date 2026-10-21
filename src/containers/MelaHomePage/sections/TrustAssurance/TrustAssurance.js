import React from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink, CertificationBadge } from '../../../../components';

import css from './TrustAssurance.module.css';

// certification prop values match CertificationBadge / certificationIcons.js keys
const CERTIFICATIONS = [
  { id: 'gots_certified', name: 'GOTS Certified' },
  { id: 'organic_cotton', name: 'Organic Cotton' },
  { id: 'oeko_tex',       name: 'OEKO-TEX®' },
  { id: 'eco_friendly',   name: 'Eco-Friendly' },
];

// Copy lives in en.json (TrustAssurance.*). Brands ship and take payment, Mela does neither,
// and card acceptance has not been checked per brand, so no tile may claim it.
const SECURITY_FEATURES = [
  { icon: '🛍️', titleId: 'TrustAssurance.shopDirectTitle' },
  {
    icon: '📦',
    titleId: 'TrustAssurance.shippingTitle',
    descriptionId: 'TrustAssurance.shippingDescription',
  },
  { icon: '↩️', titleId: 'TrustAssurance.returnsTitle' },
  {
    icon: '💳',
    titleId: 'TrustAssurance.cardsTitle',
    descriptionId: 'TrustAssurance.cardsDescription',
  },
];

const QUALITY_GUARANTEES = [
  { titleId: 'TrustAssurance.trackRecordTitle', icon: '✨' },
  { titleId: 'TrustAssurance.handVettedTitle', icon: '🤝' },
  { titleId: 'TrustAssurance.sustainableTitle', icon: '🌱' },
];

const TrustAssurance = () => {
  return (
    <div className={css.trust}>
      <div className={css.container}>
        {/* Section Header */}
        <div className={css.header}>
          <h2 className={css.title}>
            <FormattedMessage
              id="MelaHomePage.trustTitle"
              defaultMessage="Shop with Confidence"
            />
          </h2>
        </div>

        {/* Quality Guarantees */}
        <div className={css.guarantees}>
          <h3 className={css.sectionTitle}>
            <FormattedMessage
              id="MelaHomePage.qualityGuarantees"
              defaultMessage="How We Vet Every Brand"
            />
          </h3>
          <div className={css.guaranteeGrid}>
            {QUALITY_GUARANTEES.map((guarantee, index) => (
              <div key={index} className={css.guaranteeCard}>
                <span className={css.guaranteeIcon}>{guarantee.icon}</span>
                <h4 className={css.guaranteeTitle}>
                  <FormattedMessage id={guarantee.titleId} />
                </h4>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className={css.certifications}>
          <h3 className={css.sectionTitle}>
            <FormattedMessage
              id="MelaHomePage.certifications"
              defaultMessage="Safety & Sustainability Certifications"
            />
          </h3>
          <div className={css.certGrid}>
            {CERTIFICATIONS.map((cert) => (
              <div key={cert.id} className={css.certCard}>
                <CertificationBadge
                  certification={cert.id}
                  variant="default"
                  size={40}
                  showTooltip={true}
                  className={css.certLogo}
                />
                <p className={css.certName}>{cert.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Features */}
        <div className={css.security}>
          <h3 className={css.sectionTitle}>
            <FormattedMessage
              id="MelaHomePage.securityFeatures"
              defaultMessage="Shopping on Brand Sites"
            />
          </h3>
          <div className={css.securityGrid}>
            {SECURITY_FEATURES.map((feature, index) => (
              <div key={index} className={css.securityCard}>
                <span className={css.securityIcon}>{feature.icon}</span>
                <div className={css.securityInfo}>
                  <h4 className={css.securityTitle}>
                    <FormattedMessage id={feature.titleId} />
                  </h4>
                  {feature.descriptionId && (
                    <p className={css.securityDescription}>
                      <FormattedMessage id={feature.descriptionId} />
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Service CTA */}
        <div className={css.customerService}>
          <div className={css.serviceContent}>
            <h3 className={css.serviceTitle}>
              <FormattedMessage
                id="MelaHomePage.customerServiceTitle"
                defaultMessage="Need Help? We're Here for You"
              />
            </h3>
            <div className={css.serviceButtons}>
              <NamedLink
                name="ContactDetailsPage"
                className={css.contactButton}
              >
                <FormattedMessage
                  id="MelaHomePage.contactUs"
                  defaultMessage="Contact Us"
                />
              </NamedLink>
              <NamedLink
                name="SearchPage"
                className={css.helpButton}
              >
                <FormattedMessage
                  id="MelaHomePage.helpCenter"
                  defaultMessage="Help Center"
                />
              </NamedLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustAssurance;