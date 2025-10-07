import React from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';

import css from './TrustAssurance.module.css';

const CERTIFICATIONS = [
  {
    id: 'gots',
    name: 'GOTS Certified',
    logo: '/static/images/cert-gots.png',
    description: 'Global Organic Textile Standard'
  },
  {
    id: 'organic',
    name: 'Organic Cotton',
    logo: '/static/images/cert-organic.png',
    description: 'Certified Organic Materials'
  },
  {
    id: 'safety',
    name: 'Baby Safe',
    logo: '/static/images/cert-safety.png',
    description: 'Child Safety Certified'
  },
  {
    id: 'eco',
    name: 'Eco-Friendly',
    logo: '/static/images/cert-eco.png',
    description: 'Sustainable Manufacturing'
  }
];

const SECURITY_FEATURES = [
  {
    icon: '🔒',
    title: 'Secure Payments',
    description: 'SSL encrypted checkout with trusted payment partners'
  },
  {
    icon: '🚚',
    title: 'Fast Shipping',
    description: 'Free shipping on orders over $50 worldwide'
  },
  {
    icon: '↩️',
    title: 'Easy Returns',
    description: '30-day hassle-free return policy'
  },
  {
    icon: '💬',
    title: '24/7 Support',
    description: 'Expert customer service team always available'
  }
];

const QUALITY_GUARANTEES = [
  {
    title: 'Premium Quality',
    description: 'Every product undergoes rigorous quality testing',
    icon: '✨'
  },
  {
    title: 'Ethically Made',
    description: 'Fair trade partnerships with verified suppliers',
    icon: '🤝'
  },
  {
    title: 'Sustainable',
    description: 'Eco-friendly materials and responsible production',
    icon: '🌱'
  }
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
              defaultMessage="Why Families Trust Mela"
            />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage
              id="MelaHomePage.trustSubtitle"
              defaultMessage="Your peace of mind is our priority - from quality to delivery"
            />
          </p>
        </div>

        {/* Quality Guarantees */}
        <div className={css.guarantees}>
          <h3 className={css.sectionTitle}>
            <FormattedMessage
              id="MelaHomePage.qualityGuarantees"
              defaultMessage="Our Quality Promise"
            />
          </h3>
          <div className={css.guaranteeGrid}>
            {QUALITY_GUARANTEES.map((guarantee, index) => (
              <div key={index} className={css.guaranteeCard}>
                <span className={css.guaranteeIcon}>{guarantee.icon}</span>
                <h4 className={css.guaranteeTitle}>{guarantee.title}</h4>
                <p className={css.guaranteeDescription}>{guarantee.description}</p>
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
                <img
                  src={cert.logo}
                  alt={cert.name}
                  className={css.certLogo}
                />
                <div className={css.certInfo}>
                  <h4 className={css.certName}>{cert.name}</h4>
                  <p className={css.certDescription}>{cert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Features */}
        <div className={css.security}>
          <h3 className={css.sectionTitle}>
            <FormattedMessage
              id="MelaHomePage.securityFeatures"
              defaultMessage="Shopping with Confidence"
            />
          </h3>
          <div className={css.securityGrid}>
            {SECURITY_FEATURES.map((feature, index) => (
              <div key={index} className={css.securityCard}>
                <span className={css.securityIcon}>{feature.icon}</span>
                <div className={css.securityInfo}>
                  <h4 className={css.securityTitle}>{feature.title}</h4>
                  <p className={css.securityDescription}>{feature.description}</p>
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
            <p className={css.serviceDescription}>
              <FormattedMessage
                id="MelaHomePage.customerServiceDescription"
                defaultMessage="Our expert team is ready to help with sizing, product questions, or anything else you need"
              />
            </p>
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