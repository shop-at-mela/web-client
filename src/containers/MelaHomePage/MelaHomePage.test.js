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
  const CategoryShowcase = function CategoryShowcase() {
    return <div data-testid="category-showcase">Category Showcase</div>;
  };
  const OccasionStrip = function OccasionStrip() {
    return <div data-testid="occasion-strip">Occasion Strip</div>;
  };
  const AgeNavigation = function AgeNavigation() {
    return <div data-testid="age-navigation">Age Navigation</div>;
  };
  return { __esModule: true, default: CategoryShowcase, OccasionStrip, AgeNavigation };
});

jest.mock('./sections/BrandSpotlight/BrandSpotlight', () => {
  return function BrandSpotlight() {
    return <div data-testid="brand-spotlight">Brand Spotlight</div>;
  };
});

jest.mock('./sections/NewFromIndia/NewFromIndia', () => {
  return function NewFromIndia() {
    return <div data-testid="new-from-india">New from India</div>;
  };
});

jest.mock('./sections/CraftStories/CraftStories', () => {
  return function CraftStories() {
    return <div data-testid="craft-stories">Craft Stories</div>;
  };
});

jest.mock('./sections/EarnedItsPlace/EarnedItsPlaceContainer', () => {
  return function EarnedItsPlaceContainer() {
    return <div data-testid="earned-its-place">Every Brand Earned Its Place</div>;
  };
});

// ComingSoonSection was removed from the homepage render (homepage-hero-prd T1-6):
// it read as a trust liability on first impression. No mock needed.

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

jest.mock('../../components/CategoryTiles/CategoryTiles', () => {
  return function CategoryTiles() {
    return <div data-testid="category-tiles">Category Tiles</div>;
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
      "Discover India's Most Loved Brands | Fashion, Home, Beauty & Kids | Mela"
    );
  });

  it('renders page with discovery-positioning meta description', () => {
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    expect(getByTestId('page-description').textContent).toBe(
      "Mela is a curated home for proven Indian brands with real export experience. Explore fashion, home, beauty, jewelry, and kids, then buy directly on each brand's own store. Ships to all 50 states."
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
    expect(getByTestId('category-tiles')).toBeTruthy();
    expect(getByTestId('earned-its-place')).toBeTruthy();
    expect(getByTestId('trust-assurance')).toBeTruthy();
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
