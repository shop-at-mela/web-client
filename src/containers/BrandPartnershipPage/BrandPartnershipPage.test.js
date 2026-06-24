import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import BrandPartnershipPage from './BrandPartnershipPage';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';

// Mock the section components
jest.mock('./sections/Hero/Hero', () => {
  return function MockHero() {
    return (
      <div data-testid="hero">
        <a
          data-testid="contact-cta-link"
          href="mailto:shopatmela@gmail.com"
        >
          Contact Us to Partner
        </a>
      </div>
    );
  };
});

jest.mock('./sections/MarketOpportunity/MarketOpportunity', () => {
  return function MockMarketOpportunity() {
    return <div data-testid="market-opportunity">Market Opportunity</div>;
  };
});

jest.mock('./sections/WhyClothing/WhyClothing', () => {
  return function MockWhyClothing() {
    return <div data-testid="why-clothing">Why Baby Clothing</div>;
  };
});

jest.mock('./sections/Benefits/Benefits', () => {
  return function MockBenefits() {
    return <div data-testid="benefits">Why Partner with Mela?</div>;
  };
});

jest.mock('./sections/Process/Process', () => {
  return function MockProcess() {
    return <div data-testid="process">How It Works</div>;
  };
});

jest.mock('./sections/MarketTiming/MarketTiming', () => {
  return function MockMarketTiming() {
    return <div data-testid="market-timing">Market Timing</div>;
  };
});

jest.mock('./sections/PartnershipPhilosophy/PartnershipPhilosophy', () => {
  return function MockPartnershipPhilosophy() {
    return <div data-testid="partnership-philosophy">Partnership Philosophy</div>;
  };
});

jest.mock('./sections/SuccessStories/SuccessStories', () => {
  return function MockSuccessStories() {
    return <div data-testid="success-stories">Success Stories</div>;
  };
});

jest.mock('./sections/FAQ/FAQ', () => () => <div data-testid="faq">FAQ</div>);

// Mock containers
jest.mock('../TopbarContainer/TopbarContainer', () => {
  return function MockTopbarContainer() {
    return <div data-testid="topbar">Topbar</div>;
  };
});

jest.mock('../FooterContainer/FooterContainer', () => {
  return function MockFooterContainer() {
    return <div data-testid="footer">Footer</div>;
  };
});

const mockConfig = {
  branding: {
    facebookImage: 'https://test-facebook-image.com/image.jpg'
  }
};

const mockStore = createStore(() => ({}));

const renderWithProviders = (component) => {
  const messages = {
    'Page.schemaTitle': 'Partner with {marketplaceName}',
    'Page.schemaDescription': 'Discover authentic Indian baby brands and products.',
  };

  const mockRoutes = [];

  return render(
    <HelmetProvider>
      <Provider store={mockStore}>
        <BrowserRouter>
          <IntlProvider locale="en" messages={messages}>
            <ConfigurationProvider value={mockConfig}>
              <RouteConfigurationProvider value={mockRoutes}>
                {component}
              </RouteConfigurationProvider>
            </ConfigurationProvider>
          </IntlProvider>
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  );
};

describe('BrandPartnershipPage', () => {

  it('renders all sections', async () => {
    renderWithProviders(<BrandPartnershipPage />);

    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('market-opportunity')).toBeInTheDocument();

    expect(await screen.findByTestId('why-clothing')).toBeInTheDocument();
    expect(await screen.findByTestId('benefits')).toBeInTheDocument();
    expect(await screen.findByTestId('process')).toBeInTheDocument();
    expect(await screen.findByTestId('market-timing')).toBeInTheDocument();
    expect(await screen.findByTestId('partnership-philosophy')).toBeInTheDocument();
    expect(await screen.findByTestId('success-stories')).toBeInTheDocument();
    expect(await screen.findByTestId('faq')).toBeInTheDocument();
  });

  it('renders hero contact CTA with mailto link', () => {
    renderWithProviders(<BrandPartnershipPage />);

    const contactCta = screen.getByTestId('contact-cta-link');
    expect(contactCta).toHaveAttribute('href', 'mailto:shopatmela@gmail.com');
    expect(contactCta).toHaveTextContent('Contact Us to Partner');
  });

  it('renders final CTA section with contact link', () => {
    renderWithProviders(<BrandPartnershipPage />);

    expect(screen.getByText('Ready to Reach US Families?')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();

    const finalCtaLink = screen.getByText('Contact Us').closest('a');
    expect(finalCtaLink).toHaveAttribute('href', 'mailto:shopatmela@gmail.com');
  });

  it('renders responsive section content', () => {
    renderWithProviders(<BrandPartnershipPage />);

    expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Why Baby Clothing')).toBeInTheDocument();
    expect(screen.getByText('Why Partner with Mela?')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Market Timing')).toBeInTheDocument();
    expect(screen.getByText('Partnership Philosophy')).toBeInTheDocument();
    expect(screen.getByText('Success Stories')).toBeInTheDocument();
  });

  it('does not contain provider signup links', () => {
    renderWithProviders(<BrandPartnershipPage />);

    const links = document.querySelectorAll('a[href*="signup/provider"]');
    expect(links.length).toBe(0);
  });
});
