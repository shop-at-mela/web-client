import React from 'react';
import { string } from 'prop-types';

import { Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import HeroSection from './sections/HeroSection/HeroSection';
import VettingStrip from './sections/VettingStrip/VettingStrip';
import BrandSpotlight from './sections/BrandSpotlight/BrandSpotlight';
import { OccasionStrip } from './sections/CategoryShowcase/CategoryShowcase';
import CategoryTiles from '../../components/CategoryTiles/CategoryTiles';
import NewFromIndia from './sections/NewFromIndia/NewFromIndia';
import CraftStories from './sections/CraftStories/CraftStories';
import EarnedItsPlaceContainer from './sections/EarnedItsPlace/EarnedItsPlaceContainer';
import TrustAssurance from './sections/TrustAssurance/TrustAssurance';
import SavedItemsModule from './sections/SavedItems/SavedItemsModule';
import FAQSection from './sections/FAQSection/FAQSection';
import { useConfiguration } from '../../context/configurationContext';

import css from './MelaHomePage.module.css';

// Manually maintained "content last reviewed" date — bump this by hand whenever the
// copy below (title/description/FAQ) actually changes. Deliberately not derived from
// any live data (e.g. newest listing), which would be a freshness-spam pattern AI
// answer engines are tuned to discount.
export const HOMEPAGE_LAST_UPDATED = '2026-09-25';

// Single source of truth for the homepage FAQ: rendered as visible copy by
// <FAQSection> below AND used to build the FAQPage JSON-LD in `schema`, so the two
// can never drift apart. Previously these Q&As existed only inside the hidden
// <script type="application/ld+json"> block — invisible to AI answer engines that
// weight visible passages, and to human visitors.
export const FAQ_ITEMS = [
  {
    question: 'Do Indian brands on Mela ship to the United States?',
    answer:
      'Yes. Every brand featured on Mela ships directly to US addresses. Most brands offer standard and express international shipping to all 50 states. Delivery typically takes 7–10 working days for standard shipping.',
  },
  {
    question: 'Can I use my US credit card to shop on Mela?',
    answer:
      "Yes. Mela is a discovery platform — you purchase directly on each brand's own Shopify store, which accepts all major US-issued credit and debit cards including Visa, Mastercard, American Express, and Discover. No special international payment setup is needed.",
  },
  {
    question: 'Are there customs duties or import taxes when ordering from India to the US?',
    answer:
      "Possibly — US import duty rules for personal shipments from India have changed recently, so brands can no longer guarantee a duty-free threshold. Each brand's own checkout will calculate and display any applicable duties or import taxes before you pay, so there are no surprises at your door.",
  },
  {
    question: 'What is the return policy for brands on Mela?',
    answer:
      "Each brand maintains its own return policy, displayed on their store page. Mela vets all partners for fair return terms. Contact the Mela team for help navigating any return.",
  },
  {
    question: 'How long does shipping from India to the US take?',
    answer:
      "Standard international shipping from India to the US takes 7–10 working days. Many brands also offer expedited options (3–7 business days). Exact timelines and costs are shown at checkout on each brand's store.",
  },
];

const MelaHomePage = props => {
  const { currentPage } = props;
  const config = useConfiguration();

  // SEO-optimized meta title targeting primary keywords
  const pageTitle = "Discover India's Most Loved Brands | Fashion, Home, Beauty & Kids | Mela";

  // SEO-optimized meta description with target keywords
  const pageDescription = "Mela is a curated home for proven Indian brands with real export experience. Explore fashion, home, beauty, jewelry, and kids, then buy directly on each brand's own store. Ships to all 50 states.";

  // Reference (not duplicate) the Organization entity Page.js already injects into
  // every page's JSON-LD @graph, so AI engines can attribute this page's editorial
  // content without us inventing a fabricated named author persona.
  const organizationRef = { '@id': `${config.marketplaceRootURL}#organization` };

  // Social sharing image: falls back to the marketplace-wide "Default social media
  // image" set in Sharetribe Console (config.branding.facebookImage / twitterImage,
  // 1.91:1). No per-page override here — the previous one pinned a dev-environment
  // asset URL and a square 800x800 image that rendered poorly in link previews.

  return (
    <Page
      title={pageTitle}
      description={pageDescription}
      published={HOMEPAGE_LAST_UPDATED}
      updated={HOMEPAGE_LAST_UPDATED}
      schema={[
        {
          '@context': 'http://schema.org',
          '@type': 'WebPage',
          name: pageTitle,
          description: 'Curated marketplace for sustainable Indian design — baby clothing, fashion, home goods, and gifts from trusted Indian brands',
          mainEntity: {
            '@type': 'Store',
            name: 'Mela',
            description: 'Sustainable Indian design marketplace for families',
            currenciesAccepted: 'USD',
            areaServed: {
              '@type': 'Country',
              name: 'United States',
            },
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Indian Design & Sustainable Fashion',
              itemListElement: [
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Product',
                    name: 'Organic Baby Clothing',
                    category: 'Baby & Kids'
                  }
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Product',
                    name: 'Indian Fashion',
                    category: 'Fashion'
                  }
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Product',
                    name: 'Indian Home Goods',
                    category: 'Home & Kitchen'
                  }
                }
              ]
            }
          }
        },
        {
          '@context': 'http://schema.org',
          '@type': 'FAQPage',
          author: organizationRef,
          publisher: organizationRef,
          dateModified: HOMEPAGE_LAST_UPDATED,
          mainEntity: FAQ_ITEMS.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ]}
    >
      <TopbarContainer currentSearchParams={{}} />
      <div className={css.root}>
        {/* Hero Section - Product Showcase + Trust Signals */}
        <section className={css.heroSection}>
          <HeroSection />
        </section>

        {/* Vetting Strip - P0.1 compressed trust band, above the first carousel */}
        <VettingStrip vettingSectionId="how-we-vet" />

        {/* FAQ Section — visible counterpart to the FAQPage JSON-LD above. Placed
            high (before the first product module) so AI answer engines and human
            visitors both get a real, quotable passage instead of only hidden
            structured data (GEO fix, 2026-09-25). */}
        <FAQSection items={FAQ_ITEMS} lastUpdated={HOMEPAGE_LAST_UPDATED} />

        {/* Saved Items Module — shows only for authenticated users with saves */}
        <SavedItemsModule />

        {/* Module A: Brand Spotlight — P1.3 revised order, position 3 */}
        <BrandSpotlight />

        {/* Shop by Occasion — moved up from inside CategoryShowcase (P1.3): the
            strongest existing curation, previously buried mid-page */}
        <div className={css.occasionSection}>
          <OccasionStrip config={config} />
        </div>

        {/* Shop by Category — compact category tiles (tightened from the Fashion/Baby
            product carousels to six tap-in entry points; homepage-redesign 2026-07-31) */}
        <section className={css.categorySection}>
          <CategoryTiles />
        </section>

        {/* Module B: New from India — recency as curation */}
        <div className={css.newFromIndiaSection}>
          <NewFromIndia />
        </div>

        {/* Module C: Craft Stories — the craft chips as a discovery surface */}
        <CraftStories />

        {/* Every Brand Here Earned Its Place — image-forward brand proof cards
            (replaces the "Trusted by Parents" FeaturedBrandPartners grid; 2026-07-31) */}
        <section className={css.brandsSection}>
          <EarnedItsPlaceContainer />
        </section>

        {/* Trust & Quality Assurance - Certifications */}
        <section id="how-we-vet" className={css.trustSection}>
          <TrustAssurance />
        </section>
      </div>
      <FooterContainer />
    </Page>
  );
};

MelaHomePage.propTypes = {
  currentPage: string,
};

export default MelaHomePage;