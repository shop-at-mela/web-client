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

const SECURITY_FEATURES = [
  {
    icon: '🛍️',
    title: 'Shop Directly With the Brand',
  },
  {
    icon: '📦',
    title: 'Ships Directly to the US',
    description: 'Orders ship straight from the brand to your US address.',
  },
  {
    icon: '↩️',
    title: 'Brand Return Policies',
  },
  {
    icon: '💳',
    title: 'US Cards Accepted on Brand Stores',
    description: 'Visa, Mastercard, Amex, and Discover accepted.',
  },
];

const QUALITY_GUARANTEES = [
  { title: 'Proven Track Record', icon: '✨' },
  { title: 'Verified Indian Brands', icon: '🤝' },
  { title: 'Sustainably Made', icon: '🌱' },
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
                <h4 className={css.guaranteeTitle}>{guarantee.title}</h4>
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
                  <h4 className={css.securityTitle}>{feature.title}</h4>
                  {feature.description && (
                    <p className={css.securityDescription}>{feature.description}</p>
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