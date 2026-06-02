import React from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink, CertificationBadge } from '../../../../components';

import css from './TrustAssurance.module.css';

// certification prop values match CertificationBadge / certificationIcons.js keys
const CERTIFICATIONS = [
  { id: 'gots_certified', name: 'GOTS Certified',   description: 'Strict environmental and social standards across every step of textile production — from farm to finished product' },
  { id: 'organic_cotton', name: 'Organic Cotton',   description: 'Grown without toxic pesticides or synthetic fertilizers — gentler on baby skin and the planet' },
  { id: 'oeko_tex',       name: 'OEKO-TEX®',        description: 'Independently tested against 100+ harmful substances. If it passes, it\'s safe enough to put against a newborn\'s skin' },
  { id: 'eco_friendly',   name: 'Eco-Friendly',     description: 'Partners meet verified benchmarks for sustainable materials, production processes, and packaging' },
];

const SECURITY_FEATURES = [
  {
    icon: '🛍️',
    title: 'Shop Directly With the Brand',
    description: "You buy from the brand's own store — not a middleman. Your payment goes straight to them.",
  },
  {
    icon: '📦',
    title: 'Ships Directly to the US',
    description: 'Every brand on Mela ships to US addresses. Orders go straight from the brand to your door — no re-shipping, no intermediaries.',
  },
  {
    icon: '↩️',
    title: 'Brand Return Policies',
    description: "Each partner brand's return policy applies — we help you navigate it",
  },
  // COMMENTED OUT: "Mela Curation Promise" — curation story now lives in section title/heading
  // {
  //   icon: '✅',
  //   title: 'Mela Curation Promise',
  //   description: 'Every brand on Mela is hand-vetted for quality, authenticity, and values',
  // },
  {
    icon: '💳',
    title: 'US Cards Accepted on Brand Stores',
    description: "Each brand's Shopify store accepts US-issued Visa, Mastercard, Amex, and Discover. You pay directly on their store — not on Mela.",
  },
];

const US_SHOPPER_FAQS = [
  {
    question: 'Do Indian brands on Mela ship to the United States?',
    answer: 'Yes. Every brand featured on Mela ships directly to US addresses. Most brands offer standard and express international shipping to all 50 states. Delivery typically takes 7–14 business days for standard shipping.',
  },
  {
    question: 'Can I use my US credit card to shop on Mela?',
    answer: "Yes. Mela is a discovery platform — you purchase directly on each brand's own Shopify store, which accepts all major US-issued credit and debit cards including Visa, Mastercard, American Express, and Discover. No special international payment setup is needed.",
  },
  {
    question: 'Are there customs duties or import taxes when ordering from India to the US?',
    answer: 'The US de minimis exemption — which historically allowed personal-use orders under $800 to clear customs duty-free — is currently under active review by the US government. Recent executive and judicial actions have created uncertainty around this rule, and the policy may change with limited notice. For most orders from Indian brands at typical price points, duties have not been assessed, but we cannot guarantee this will remain the case. Mela recommends checking the latest US Customs and Border Protection (CBP) guidance before placing large orders. Each brand\'s checkout will show a duty estimate where available.',
  },
  {
    question: 'What is the return policy for brands on Mela?',
    answer: "Each brand maintains its own return policy, displayed on their store page. Mela vets all partners for fair return terms. Contact the Mela team for help navigating any return.",
  },
  {
    question: 'How long does shipping from India to the US take?',
    answer: "Standard international shipping from India to the US takes 7–14 business days. Many brands also offer expedited options (3–7 business days). Exact timelines and costs are shown at checkout on each brand's store.",
  },
];

const QUALITY_GUARANTEES = [
  {
    title: 'Proven Track Record',
    description: 'We only list brands with years of happy customers — not just pretty products',
    icon: '✨',
  },
  {
    title: 'Verified Indian Brands',
    description: 'Every brand is India-based and independently verified — no grey-market resellers',
    icon: '🤝',
  },
  {
    title: 'Sustainably Made',
    description: 'Eco-friendly materials, ethical production, and responsible supply chains',
    icon: '🌱',
  },
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
              defaultMessage="Every Brand Here Earned Its Place"
            />
          </h2>
          <p className={css.subtitle}>
            <FormattedMessage
              id="MelaHomePage.trustSubtitle"
              defaultMessage="We do the research so you don't have to."
            />
          </p>
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
                <CertificationBadge
                  certification={cert.id}
                  variant="default"
                  size={40}
                  showTooltip={true}
                  className={css.certLogo}
                />
                <div className={css.certInfo}>
                  <p className={css.certName}>{cert.name}</p>
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
              defaultMessage="Shopping on Brand Sites"
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

        {/* US Shopper FAQ */}
        <div className={css.faqSection}>
          <h3 className={css.sectionTitle}>
            <FormattedMessage
              id="MelaHomePage.usShopperFaqTitle"
              defaultMessage="Shipping & Payment to the US"
            />
          </h3>
          <p className={css.faqSubtitle}>
            <FormattedMessage
              id="MelaHomePage.usShopperFaqSubtitle"
              defaultMessage="Everything you need to know about ordering from Indian brands on Mela"
            />
          </p>
          <div className={css.faqList}>
            {US_SHOPPER_FAQS.map((faq, index) => (
              <div key={index} className={css.faqCard}>
                <h4 className={css.faqQuestion}>{faq.question}</h4>
                <p className={css.faqAnswer}>{faq.answer}</p>
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