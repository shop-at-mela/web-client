import React from 'react';
import { string } from 'prop-types';

import { Page, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import HeroSection from './sections/HeroSection/HeroSection';
import CategoryShowcase from './sections/CategoryShowcase/CategoryShowcase';
import CustomerFavorites from './sections/CustomerFavorites/CustomerFavorites';
import FeaturedBrands from './sections/FeaturedBrands/FeaturedBrands';
import TrustAssurance from './sections/TrustAssurance/TrustAssurance';

import css from './MelaHomePage.module.css';

const MelaHomePage = props => {
  const { currentPage } = props;

  const pageTitle = 'Sustainable Baby Fashion with Global Design Diversity - Mela';

  return (
    <Page
      title={pageTitle}
      description="Discover organic, ethically-made baby clothes from innovative designers worldwide. GOTS certified, premium quality, and sustainably crafted for your little one."
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        name: pageTitle,
        description: 'Sustainable baby fashion marketplace featuring organic cotton baby clothes and accessories from trusted global brands',
        mainEntity: {
          '@type': 'Store',
          name: 'Mela',
          description: 'Sustainable baby fashion marketplace',
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Baby Clothing & Accessories',
            itemListElement: [
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Product',
                  name: 'Organic Baby Clothing',
                  category: 'Baby Fashion'
                }
              }
            ]
          }
        }
      }}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
      <div className={css.root}>
        {/* Hero Section - Product Showcase + Trust Signals */}
        <section className={css.heroSection}>
          <HeroSection />
        </section>

        {/* Category Showcase - Clear Product Navigation */}
        <section className={css.categorySection}>
          <CategoryShowcase />
        </section>

        {/* Customer Favorites - Social Proof + Bestsellers */}
        <section className={css.favoritesSection}>
          <CustomerFavorites />
        </section>

        {/* Featured Brands - Simple Partner Highlight */}
        <section className={css.brandsSection}>
          <FeaturedBrands />
        </section>

        {/* Trust & Quality Assurance - Certifications */}
        <section className={css.trustSection}>
          <TrustAssurance />
        </section>
      </div>
      </LayoutSingleColumn>
    </Page>
  );
};

MelaHomePage.propTypes = {
  currentPage: string,
};

export default MelaHomePage;