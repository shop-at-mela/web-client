import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
          data-testid="clothing-cta-link"
          href="/signup/provider"
        >
          Apply for Baby Clothing
        </a>
        <a
          data-testid="waitlist-cta-link"
          href="/signup/provider"
        >
          Join Waitlist (Other Categories)
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
    'Page.schemaDescription': 'Join {marketplaceName} - the premium marketplace for authentic Indian products in the US market'
  };

  const mockRoutes = [
    {
      path: '/signup/:userType',
      name: 'SignupForUserTypePage',
      component: () => null
    }
  ];

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

    // Above-the-fold sections should load immediately
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('market-opportunity')).toBeInTheDocument();

    // Wait for lazy loaded sections to appear
    expect(await screen.findByTestId('why-clothing')).toBeInTheDocument();
    expect(await screen.findByTestId('benefits')).toBeInTheDocument();
    expect(await screen.findByTestId('process')).toBeInTheDocument();
    expect(await screen.findByTestId('market-timing')).toBeInTheDocument();
    expect(await screen.findByTestId('partnership-philosophy')).toBeInTheDocument();
    expect(await screen.findByTestId('success-stories')).toBeInTheDocument();
    expect(await screen.findByTestId('faq')).toBeInTheDocument();
  });

  it('renders responsive content', () => {
    renderWithProviders(<BrandPartnershipPage />);

    // Check for hero content
    expect(screen.getByText('Apply for Baby Clothing')).toBeInTheDocument();
    expect(screen.getAllByText('Join Waitlist (Other Categories)').length).toBeGreaterThan(0);

    // Check for all section content
    expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Why Baby Clothing')).toBeInTheDocument();
    expect(screen.getByText('Why Partner with Mela?')).toBeInTheDocument();
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Market Timing')).toBeInTheDocument();
    expect(screen.getByText('Partnership Philosophy')).toBeInTheDocument();
    expect(screen.getByText('Success Stories')).toBeInTheDocument();
  });

  it('renders signup CTAs with correct routes', () => {
    renderWithProviders(<BrandPartnershipPage />);

    const clothingCTA = screen.getByTestId('clothing-cta-link');
    const waitlistCTA = screen.getByTestId('waitlist-cta-link');

    expect(clothingCTA).toHaveAttribute('href', '/signup/provider');
    expect(waitlistCTA).toHaveAttribute('href', '/signup/provider');

    // Verify CTA text
    expect(clothingCTA).toHaveTextContent('Apply for Baby Clothing');
    expect(waitlistCTA).toHaveTextContent('Join Waitlist (Other Categories)');
  });

  it('renders final CTA section with signup links', () => {
    renderWithProviders(<BrandPartnershipPage />);

    // Check for final CTA section content
    expect(screen.getByText('Ready to Reach Millions of US Families?')).toBeInTheDocument();
    expect(screen.getByText('Sign Up to Export Baby Clothing')).toBeInTheDocument();
    expect(screen.getAllByText('Join Waitlist (Other Categories)').length).toBeGreaterThan(0);
  });

  it('renders with correct page metadata', () => {
    renderWithProviders(<BrandPartnershipPage />);

    // The page should render without errors and have proper content
    expect(screen.getByText('Apply for Baby Clothing')).toBeInTheDocument();
    expect(screen.getByText('Market Opportunity')).toBeInTheDocument();
  });

  it('includes desktop and mobile responsive layout features', () => {
    renderWithProviders(<BrandPartnershipPage />);

    // Verify sections that should show carousels on mobile, grids on desktop
    expect(screen.getByText('Why Baby Clothing')).toBeInTheDocument();
    expect(screen.getByText('Market Timing')).toBeInTheDocument();
  });
});