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
import { useConfiguration } from '../../context/configurationContext';

import css from './MelaHomePage.module.css';

const MelaHomePage = props => {
  const { currentPage } = props;
  const config = useConfiguration();

  // SEO-optimized meta title targeting primary keywords
  const pageTitle = "Discover India's Most Loved Brands | Fashion, Home, Beauty & Kids | Mela";

  // SEO-optimized meta description with target keywords
  const pageDescription = "Mela is a curated home for proven Indian brands with real export experience. Explore fashion, home, beauty, jewelry, and kids, then buy directly on each brand's own store. Ships to all 50 states.";

  // Social media sharing images
  const socialImage = 'https://sharetribe-assets.imgix.net/68ab648b-6d39-4b2b-bd2c-f99295eeb366/raw/06/5ce7d29d9cfbdfb391af7bc0a744511b9fc1c4?auto=format&fit=clip&h=800&w=800&s=f0fae1b6a833c943e3af463df9cbb484';
  const facebookImages = [{ url: socialImage, width: 800, height: 800 }];
  const twitterImages = [{ url: socialImage, width: 800, height: 800 }];

  return (
    <Page
      title={pageTitle}
      description={pageDescription}
      facebookImages={facebookImages}
      twitterImages={twitterImages}
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
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Do Indian brands on Mela ship to the United States?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Every brand featured on Mela ships directly to US addresses. Most brands offer standard and express international shipping to all 50 states. Delivery typically takes 7–10 working days for standard shipping.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I use my US credit card to shop on Mela?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: "Yes. Mela is a discovery platform — you purchase directly on each brand's own Shopify store, which accepts all major US-issued credit and debit cards including Visa, Mastercard, American Express, and Discover. No special international payment setup is needed.",
              },
            },
            {
              '@type': 'Question',
              name: 'Are there customs duties or import taxes when ordering from India to the US?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: "Import duties on personal-use orders under the US de minimis threshold ($800) are typically not charged. For larger orders, applicable duties are the buyer's responsibility. Each brand's checkout will show an estimate where applicable.",
              },
            },
            {
              '@type': 'Question',
              name: 'What is the return policy for brands on Mela?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: "Each brand maintains its own return policy, displayed on their store page. Mela vets all partners for fair return terms. Contact the Mela team for help navigating any return.",
              },
            },
            {
              '@type': 'Question',
              name: 'How long does shipping from India to the US take?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: "Standard international shipping from India to the US takes 7–10 working days. Many brands also offer expedited options (3–7 business days). Exact timelines and costs are shown at checkout on each brand's store.",
              },
            },
          ],
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
        <NewFromIndia />

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