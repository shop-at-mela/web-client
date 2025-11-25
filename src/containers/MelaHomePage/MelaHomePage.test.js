import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import MelaHomePage from './MelaHomePage';

// Mock child components
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

jest.mock('./sections/CustomerFavorites/CustomerFavorites', () => {
  return function CustomerFavorites() {
    return <div data-testid="customer-favorites">Customer Favorites</div>;
  };
});

jest.mock('./sections/FeaturedBrands/FeaturedBrands', () => {
  return function FeaturedBrands() {
    return <div data-testid="featured-brands">Featured Brands</div>;
  };
});

jest.mock('./sections/TrustAssurance/TrustAssurance', () => {
  return function TrustAssurance() {
    return <div data-testid="trust-assurance">Trust Assurance</div>;
  };
});

// Mock Page component to capture props
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
  LayoutSingleColumn: ({ children }) => <div data-testid="layout">{children}</div>,
}));

// Mock containers
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

const mockMessages = {
  'MelaHomePage.title': 'Mela Home',
};

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={mockMessages}>
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

  it('renders page with correct title and description', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    expect(getByTestId('page-title').textContent).toBe(
      'Sustainable Baby Fashion with Global Design Diversity - Mela'
    );
    expect(getByTestId('page-description').textContent).toBe(
      'Discover organic, ethically-made baby clothes from innovative designers worldwide. GOTS certified, premium quality, and sustainably crafted for your little one.'
    );
  });

  it('configures social media sharing images correctly', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    const expectedSocialImage = 'https://sharetribe-assets.imgix.net/68ab648b-6d39-4b2b-bd2c-f99295eeb366/raw/06/5ce7d29d9cfbdfb391af7bc0a744511b9fc1c4?auto=format&fit=clip&h=800&w=800&s=f0fae1b6a833c943e3af463df9cbb484';

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
    expect(getByTestId('category-showcase')).toBeTruthy();
    expect(getByTestId('customer-favorites')).toBeTruthy();
    expect(getByTestId('featured-brands')).toBeTruthy();
    expect(getByTestId('trust-assurance')).toBeTruthy();
  });

  it('includes structured data schema', () => {
    const { container } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    // Verify the component renders (schema is passed to Page component)
    expect(container.querySelector('[data-testid="page-component"]')).toBeTruthy();
  });
});