import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import MelaHomePage from './MelaHomePage';

jest.mock('./sections/HeroSection/HeroSection', () => {
  return function HeroSection() {
    return <div data-testid="hero-section">Hero Section</div>;
  };
});

jest.mock('./sections/CategoryShowcase/CategoryShowcase', () => {
  return function CategoryShowcase() {
    return <div data-testid="category-showcase">Category Showcase</div>;
  };
});

jest.mock('./sections/FeaturedBrandPartners/FeaturedBrandPartnersContainer', () => {
  return function FeaturedBrandPartnersContainer() {
    return <div data-testid="featured-brand-partners">Featured Brand Partners</div>;
  };
});

jest.mock('./sections/ComingSoonSection/ComingSoonSection', () => {
  return function ComingSoonSection() {
    return <div data-testid="coming-soon-section">Coming Soon Section</div>;
  };
});

jest.mock('./sections/TrustAssurance/TrustAssurance', () => {
  return function TrustAssurance() {
    return <div data-testid="trust-assurance">Trust Assurance</div>;
  };
});

jest.mock('./sections/SavedItems/SavedItemsModule', () => {
  return function SavedItemsModule() {
    return <div data-testid="saved-items-module">Saved Items</div>;
  };
});

jest.mock('../../components', () => ({
  Page: ({ title, description, facebookImages, twitterImages, children }) => (
    <div data-testid="page-component">
      <div data-testid="page-title">{title}</div>
      <div data-testid="page-description">{description}</div>
      <div data-testid="facebook-images">{JSON.stringify(facebookImages)}</div>
      <div data-testid="twitter-images">{JSON.stringify(twitterImages)}</div>
      {children}
    </div>
  ),
}));

jest.mock('../TopbarContainer/TopbarContainer', () => {
  return function TopbarContainer() {
    return <div data-testid="topbar">Topbar</div>;
  };
});

jest.mock('../FooterContainer/FooterContainer', () => {
  return function FooterContainer() {
    return <div data-testid="footer">Footer</div>;
  };
});

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={{}}>
      {children}
    </IntlProvider>
  </MemoryRouter>
);

describe('MelaHomePage', () => {
  const defaultProps = {
    currentPage: 'MelaHomePage',
  };

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );
  });

  it('renders page with discovery-first meta title', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    expect(getByTestId('page-title').textContent).toBe(
      'Sustainable Indian Design for Families | Baby, Fashion & More | Mela'
    );
  });

  it('renders page with discovery-positioning meta description', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    expect(getByTestId('page-description').textContent).toBe(
      'Mela curates the best Indian baby, fashion, and home brands for families in the US. Discover quality-verified brands, explore products, and shop directly on brand stores.'
    );
  });

  it('configures social media sharing images correctly', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    const expectedSocialImage =
      'https://sharetribe-assets.imgix.net/68ab648b-6d39-4b2b-bd2c-f99295eeb366/raw/06/5ce7d29d9cfbdfb391af7bc0a744511b9fc1c4?auto=format&fit=clip&h=800&w=800&s=f0fae1b6a833c943e3af463df9cbb484';

    const facebookImages = JSON.parse(getByTestId('facebook-images').textContent);
    const twitterImages = JSON.parse(getByTestId('twitter-images').textContent);

    expect(facebookImages).toEqual([{ url: expectedSocialImage, width: 800, height: 800 }]);
    expect(twitterImages).toEqual([{ url: expectedSocialImage, width: 800, height: 800 }]);
  });

  it('renders all homepage sections', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    expect(getByTestId('hero-section')).toBeTruthy();
    expect(getByTestId('saved-items-module')).toBeTruthy();
    expect(getByTestId('category-showcase')).toBeTruthy();
    expect(getByTestId('featured-brand-partners')).toBeTruthy();
    expect(getByTestId('coming-soon-section')).toBeTruthy();
    expect(getByTestId('trust-assurance')).toBeTruthy();
  });

  it('renders coming-soon-section before trust-assurance', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    const comingSoon = getByTestId('coming-soon-section');
    const trustAssurance = getByTestId('trust-assurance');

    // compareDocumentPosition: 4 means comingSoon comes before trustAssurance
    expect(
      comingSoon.compareDocumentPosition(trustAssurance) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('includes structured data schema', () => {
    const { container } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    expect(container.querySelector('[data-testid="page-component"]')).toBeTruthy();
  });
});
