import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

import { ConfigurationProvider } from '../../../../context/configurationContext';
import CategoryShowcase from './CategoryShowcase';

// Mock NamedLink component
jest.mock('../../../../components/NamedLink/NamedLink', () => {
  return ({ children, className, name, params, ...props }) => (
    <a
      className={className}
      data-testid={`link-${name}`}
      data-params={JSON.stringify(params || {})}
      {...props}
    >
      {children}
    </a>
  );
});

const mockCategoryConfig = [
  {
    "name": "Baby Clothes & Accessories",
    "id": "Baby-Clothes-Accessories",
    "subcategories": [
      {
        "name": "Clothing",
        "id": "Baby-Clothing",
        "subcategories": [
          {
            "name": "Tops & One-Pieces",
            "id": "Baby-Clothing-Tops-One-Pieces",
            "subcategories": []
          },
          {
            "name": "Bottoms",
            "id": "Baby-Clothing-Bottoms",
            "subcategories": []
          },
          {
            "name": "Outerwear & Jackets",
            "id": "Baby-Clothing-Outerwear-Jackets",
            "subcategories": []
          }
        ]
      },
      {
        "name": "Shoes",
        "id": "Baby-Shoes",
        "subcategories": [
          {
            "name": "Booties & First Walkers",
            "id": "Baby-Shoes-Booties-First-Walkers",
            "subcategories": []
          },
          {
            "name": "Sneakers",
            "id": "Baby-Shoes-Sneakers",
            "subcategories": []
          }
        ]
      },
      {
        "name": "Accessories",
        "id": "Baby-Accessories",
        "subcategories": [
          {
            "name": "Bibs",
            "id": "Baby-Accessories-Bibs",
            "subcategories": []
          },
          {
            "name": "Caps & Hats",
            "id": "Baby-Accessories-Caps-Hats",
            "subcategories": []
          }
        ]
      },
      {
        "name": "Toys",
        "id": "Baby-Toys",
        "subcategories": [
          {
            "name": "Plush Toys",
            "id": "Baby-Toys-Plush",
            "subcategories": []
          }
        ]
      }
    ]
  }
];

const renderCategoryShowcase = (config = null) => {
  const defaultConfig = config === null ? {
    categoryConfiguration: {
      categories: mockCategoryConfig,
    },
  } : config;

  return render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={{}}>
        <ConfigurationProvider value={defaultConfig}>
          <CategoryShowcase />
        </ConfigurationProvider>
      </IntlProvider>
    </MemoryRouter>
  );
};

describe('CategoryShowcase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section header correctly', () => {
    renderCategoryShowcase();

    expect(screen.getByText('Shop by Category')).toBeInTheDocument();
    expect(screen.getByText('Discover our carefully curated collection of sustainable baby fashion')).toBeInTheDocument();
  });

  it('renders categories from level 2 subcategories', () => {
    renderCategoryShowcase();

    // Should show level 2 categories
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Shoes')).toBeInTheDocument();
    expect(screen.getByText('Accessories')).toBeInTheDocument();
    expect(screen.getByText('Toys')).toBeInTheDocument();
  });

  it('displays featured items from level 3 subcategories', () => {
    renderCategoryShowcase();

    // Clothing category should show its subcategories as featured items
    expect(screen.getByText('Tops & One-Pieces')).toBeInTheDocument();
    expect(screen.getByText('Bottoms')).toBeInTheDocument();
    expect(screen.getByText('Outerwear & Jackets')).toBeInTheDocument();

    // Shoes category should show its subcategories
    expect(screen.getByText('Booties & First Walkers')).toBeInTheDocument();
    expect(screen.getByText('Sneakers')).toBeInTheDocument();
  });

  it('sets appropriate badges for different category types', () => {
    renderCategoryShowcase();

    // Clothing should have "Most Popular" badge
    expect(screen.getByText('Most Popular')).toBeInTheDocument();

    // Shoes should have "New Arrivals" badge
    expect(screen.getByText('New Arrivals')).toBeInTheDocument();

    // Accessories should have "Complete Sets" badge
    expect(screen.getByText('Complete Sets')).toBeInTheDocument();
  });

  it('generates correct search links for categories', () => {
    renderCategoryShowcase();

    const clothingLinks = screen.getAllByTestId('link-SearchPage');
    expect(clothingLinks.length).toBeGreaterThan(0);

    // Check that category links have correct params
    const categoryLink = clothingLinks.find(link => {
      const params = JSON.parse(link.getAttribute('data-params') || '{}');
      return params.pub_category === 'Baby-Clothing';
    });
    expect(categoryLink).toBeInTheDocument();
  });

  it('renders view all categories button', () => {
    renderCategoryShowcase();

    // Get all SearchPage links and find the "View All Categories" button
    const searchPageLinks = screen.getAllByTestId('link-SearchPage');
    const viewAllButton = searchPageLinks.find(link =>
      link.textContent.includes('View All Categories')
    );

    expect(viewAllButton).toBeInTheDocument();
    expect(screen.getByText('View All Categories')).toBeInTheDocument();
  });

  it('handles categories without subcategories gracefully', () => {
    const configWithNoSubcategories = {
      categoryConfiguration: {
        categories: [
          {
            "name": "Baby Clothes & Accessories",
            "id": "Baby-Clothes-Accessories",
            "subcategories": [
              {
                "name": "Simple Category",
                "id": "Simple",
                "subcategories": [] // No subcategories
              }
            ]
          }
        ]
      }
    };

    renderCategoryShowcase(configWithNoSubcategories);

    expect(screen.getByText('Simple Category')).toBeInTheDocument();
    // Should show fallback featured items
    expect(screen.getByText('Premium Quality')).toBeInTheDocument();
    expect(screen.getByText('Organic Materials')).toBeInTheDocument();
    expect(screen.getByText('Safe for Baby')).toBeInTheDocument();
  });

  it('renders nothing when no categories are available', () => {
    const emptyConfig = {
      categoryConfiguration: {
        categories: []
      }
    };

    const { container } = renderCategoryShowcase(emptyConfig);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when categoryConfiguration is missing', () => {
    const { container } = renderCategoryShowcase({
      categoryConfiguration: undefined
    });
    expect(container.firstChild).toBeNull();
  });

  it('limits showcase to 4 categories maximum', () => {
    const configWithManyCategories = {
      categoryConfiguration: {
        categories: [
          {
            "name": "Baby Clothes & Accessories",
            "id": "Baby-Clothes-Accessories",
            "subcategories": [
              { "name": "Category 1", "id": "cat1", "subcategories": [] },
              { "name": "Category 2", "id": "cat2", "subcategories": [] },
              { "name": "Category 3", "id": "cat3", "subcategories": [] },
              { "name": "Category 4", "id": "cat4", "subcategories": [] },
              { "name": "Category 5", "id": "cat5", "subcategories": [] },
              { "name": "Category 6", "id": "cat6", "subcategories": [] }
            ]
          }
        ]
      }
    };

    renderCategoryShowcase(configWithManyCategories);

    // Should only show first 4 categories
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    expect(screen.getByText('Category 3')).toBeInTheDocument();
    expect(screen.getByText('Category 4')).toBeInTheDocument();
    expect(screen.queryByText('Category 5')).not.toBeInTheDocument();
    expect(screen.queryByText('Category 6')).not.toBeInTheDocument();
  });

  it('formats category descriptions correctly', () => {
    renderCategoryShowcase();

    // Should generate descriptions from category names
    expect(screen.getByText('Explore our clothing collection')).toBeInTheDocument();
    expect(screen.getByText('Explore our shoes collection')).toBeInTheDocument();
    expect(screen.getByText('Explore our accessories collection')).toBeInTheDocument();
  });

  it('generates image paths based on category IDs', () => {
    renderCategoryShowcase();

    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);

    // Check that image src follows expected pattern
    const clothingImage = images.find(img =>
      img.src.includes('category-baby-clothing.jpg')
    );
    expect(clothingImage).toBeInTheDocument();
  });

  it('shows product count as "View Collection"', () => {
    renderCategoryShowcase();

    const productCounts = screen.getAllByText('View Collection');
    expect(productCounts.length).toBe(4); // Should have 4 categories
  });

  it('uses lazy loading for images after the first two', () => {
    renderCategoryShowcase();

    const images = screen.getAllByRole('img');
    expect(images.length).toBe(4);

    // First two images should be eager loaded
    expect(images[0]).toHaveAttribute('loading', 'eager');
    expect(images[1]).toHaveAttribute('loading', 'eager');

    // Remaining images should be lazy loaded
    expect(images[2]).toHaveAttribute('loading', 'lazy');
    expect(images[3]).toHaveAttribute('loading', 'lazy');
  });
});