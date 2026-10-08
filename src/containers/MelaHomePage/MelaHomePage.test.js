import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import MelaHomePage, { FAQ_ITEMS, HOMEPAGE_LAST_UPDATED } from './MelaHomePage';
import { ConfigurationProvider } from '../../context/configurationContext';

const mockConfig = {
  marketplaceName: 'Mela',
  marketplaceRootURL: 'https://mela.com',
  branding: { facebookImage: null, twitterImage: null },
};

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
  Page: ({ title, description, facebookImages, twitterImages, schema, children }) => (
    <div data-testid="page-component">
      <script data-testid="page-schema" type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
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
    <ConfigurationProvider value={mockConfig}>
      <IntlProvider locale="en" messages={{}}>
        {children}
      </IntlProvider>
    </ConfigurationProvider>
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
      "Mela is a curated home for proven Indian brands with real export experience. Explore fashion, home, beauty, jewelry, and kids, then buy directly on each brand's own store."
    );
  });

  it('does not set a per-page social image (falls back to the Console branding default)', () => {
    // The homepage intentionally omits facebookImages/twitterImages so the root URL
    // uses the marketplace-wide "Default social media image" from Sharetribe Console
    // (config.branding.facebookImage/twitterImage, 1.91:1) instead of a pinned asset.
    const { getByTestId } = render(
      <TestWrapper>
        <MelaHomePage {...defaultProps} />
      </TestWrapper>
    );

    expect(getByTestId('facebook-images').textContent).toBe('');
    expect(getByTestId('twitter-images').textContent).toBe('');
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

  describe('FAQ copy and structured data', () => {
    const renderPage = () =>
      render(
        <TestWrapper>
          <MelaHomePage {...defaultProps} />
        </TestWrapper>
      );

    it('FAQPage JSON-LD matches the visible FAQ character for character', () => {
      const { getByTestId, container } = renderPage();
      const schema = JSON.parse(getByTestId('page-schema').textContent);
      const faqPage = schema.find(node => node['@type'] === 'FAQPage');
      expect(faqPage.mainEntity).toHaveLength(FAQ_ITEMS.length);

      const visibleQuestions = Array.from(container.querySelectorAll('h3')).map(n => n.textContent);
      const visibleAnswers = Array.from(container.querySelectorAll('h3 + p')).map(n => n.textContent);
      expect(visibleQuestions).toEqual(faqPage.mainEntity.map(q => q.name));
      expect(visibleAnswers).toEqual(faqPage.mainEntity.map(q => q.acceptedAnswer.text));
    });

    it('states the reviewed date as the bumped HOMEPAGE_LAST_UPDATED', () => {
      const { container } = renderPage();
      expect(HOMEPAGE_LAST_UPDATED).toBe('2026-10-06');
      expect(container.textContent).toContain(`Last reviewed ${HOMEPAGE_LAST_UPDATED}`);
    });

    it('makes no blanket shipping or duty claims in the FAQ or meta description', () => {
      const { getByTestId } = renderPage();
      const text = [
        ...FAQ_ITEMS.map(i => `${i.question} ${i.answer}`),
        getByTestId('page-description').textContent,
      ].join(' ');
      expect(text).not.toMatch(/50 states/i);
      expect(text).not.toMatch(/no surprises/i);
      expect(text).not.toMatch(/ships directly/i);
      expect(text).not.toMatch(/vets all partners/i);
    });

    it('uses no dash characters in the FAQ answers', () => {
      FAQ_ITEMS.forEach(item => expect(item.answer).not.toMatch(/[-\u2013\u2014]/));
    });

    it('Q1, Q3 and Q4 use the approved P0 wording', () => {
      expect(FAQ_ITEMS[0].answer).toBe(
        "Shipping costs and delivery times are set by each brand; each brand page shows that brand's US shipping cost and whether its prices include import duties."
      );
      expect(FAQ_ITEMS[2].answer).toBe(
        'It depends on the brand. Some brands include US import duties in their prices. For others, the courier collects duties before delivery. Each brand page and product page says which applies.'
      );
      expect(FAQ_ITEMS[3].answer).toBe(
        "Each brand sets its own return policy, including whether it accepts returns from the US. Check the brand's policy before you buy."
      );
    });
  });
});
