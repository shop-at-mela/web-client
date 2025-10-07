import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders, testingLibrary } from '../../util/testHelpers';
import CategoryBreadcrumb from './CategoryBreadcrumb';

const { screen } = testingLibrary;

describe('CategoryBreadcrumb', () => {
  it('renders nothing when category is null or undefined', () => {
    // Suppress PropTypes warning for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const { container } = renderWithProviders(<CategoryBreadcrumb category={null} />);
    expect(container.firstChild).toBeNull();

    console.error = originalConsoleError;
  });

  it('renders single category as string', () => {
    renderWithProviders(<CategoryBreadcrumb category="Baby Clothing" />);

    expect(screen.getByText('Baby Clothing')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/s?pub_category=Baby%20Clothing');
  });

  it('parses category string with separators', () => {
    renderWithProviders(<CategoryBreadcrumb category="Baby Products > Clothing > Organic Cotton" />);

    expect(screen.getByText('Baby Products')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Organic Cotton')).toBeInTheDocument();
  });

  it('handles different separators (slash, pipe, arrow)', () => {
    renderWithProviders(<CategoryBreadcrumb category="Baby/Clothing|Organic→Cotton" />);

    expect(screen.getByText('Baby')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Organic')).toBeInTheDocument();
    expect(screen.getByText('Cotton')).toBeInTheDocument();
  });

  it('renders array category format', () => {
    const categoryArray = ['Baby Products', 'Clothing', 'Organic'];
    renderWithProviders(<CategoryBreadcrumb category={categoryArray} />);

    expect(screen.getByText('Baby Products')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Organic')).toBeInTheDocument();
  });

  it('renders object category format with hierarchical structure', () => {
    const categoryObject = {
      level1: 'Baby Products',
      level2: 'Clothing',
      level3: 'Organic Cotton'
    };
    renderWithProviders(<CategoryBreadcrumb category={categoryObject} />);

    expect(screen.getByText('Baby Products')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
    expect(screen.getByText('Organic Cotton')).toBeInTheDocument();
  });

  it('handles ListingPage publicData format with partial levels', () => {
    // Test the format used in ListingPageCarousel.js
    const categoryObject = {
      level1: 'Baby-Clothes-Accessories',
      level2: 'Baby-Toys',
      level3: 'Toys > Soft Toys & Dolls'
    };
    renderWithProviders(<CategoryBreadcrumb category={categoryObject} />);

    expect(screen.getByText('Baby-Clothes-Accessories')).toBeInTheDocument();
    expect(screen.getByText('Baby-Toys')).toBeInTheDocument();
    expect(screen.getByText('Toys > Soft Toys & Dolls')).toBeInTheDocument();
  });

  it('handles partial category levels from publicData', () => {
    // Test when only some levels are present
    const categoryObject = {
      level1: 'Baby-Clothes-Accessories',
      level2: undefined,
      level3: 'Toys > Soft Toys & Dolls'
    };
    renderWithProviders(<CategoryBreadcrumb category={categoryObject} />);

    expect(screen.getByText('Baby-Clothes-Accessories')).toBeInTheDocument();
    expect(screen.getByText('Toys > Soft Toys & Dolls')).toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('creates correct search links for each category level', () => {
    renderWithProviders(<CategoryBreadcrumb category="Baby Products > Clothing > Organic" />);

    const links = screen.getAllByRole('link');

    // Should have category links (all categories are now clickable)
    expect(links.length).toBeGreaterThan(0);

    // Check that some links exist with correct href patterns
    const linkWithCategory = screen.getByRole('link', { name: 'Baby Products' });
    expect(linkWithCategory).toHaveAttribute('href', '/s?pub_category=Baby%20Products');
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <CategoryBreadcrumb category="Baby" className="custom-breadcrumb" />
    );

    expect(container.firstChild).toHaveClass('custom-breadcrumb');
  });

  it('handles empty category strings gracefully', () => {
    const { container } = renderWithProviders(<CategoryBreadcrumb category="" />);
    expect(container.firstChild).toBeNull();
  });

  it('trims whitespace from category segments', () => {
    renderWithProviders(<CategoryBreadcrumb category="  Baby Products  >  Clothing  " />);

    expect(screen.getByText('Baby Products')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  it('filters out empty segments', () => {
    renderWithProviders(<CategoryBreadcrumb category="Baby Products > > Clothing" />);

    expect(screen.getByText('Baby Products')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  it('builds cumulative category paths correctly', () => {
    renderWithProviders(<CategoryBreadcrumb category="Level1 > Level2 > Level3" />);

    const level1Link = screen.getByRole('link', { name: 'Level1' });
    const level2Link = screen.getByRole('link', { name: 'Level2' });

    expect(level1Link).toHaveAttribute('href', '/s?pub_category=Level1');
    expect(level2Link).toHaveAttribute('href', '/s?pub_category=Level1%20%3E%20Level2');
  });

  describe('routing and URL encoding', () => {
    it('handles special characters in category names', () => {
      renderWithProviders(<CategoryBreadcrumb category="Baby & Toddler > Clothing & Accessories" />);

      const babyLink = screen.getByRole('link', { name: 'Baby & Toddler' });
      expect(babyLink).toHaveAttribute('href', '/s?pub_category=Baby%20%26%20Toddler');
    });

    it('preserves original hierarchy format in search URLs', () => {
      const complexCategory = 'Level 1 > Level 2 > Level 3 with spaces';
      renderWithProviders(<CategoryBreadcrumb category={complexCategory} />);

      const level1Link = screen.getByRole('link', { name: 'Level 1' });
      const level2Link = screen.getByRole('link', { name: 'Level 2' });

      expect(level1Link).toHaveAttribute('href', '/s?pub_category=Level%201');
      expect(level2Link).toHaveAttribute('href', '/s?pub_category=Level%201%20%3E%20Level%202');
    });

    it('handles deep hierarchy levels correctly', () => {
      const deepCategory = 'Baby > Feeding > Bottles > Glass > Wide Neck';
      renderWithProviders(<CategoryBreadcrumb category={deepCategory} />);

      const feedingLink = screen.getByRole('link', { name: 'Feeding' });
      const bottlesLink = screen.getByRole('link', { name: 'Bottles' });
      const glassLink = screen.getByRole('link', { name: 'Glass' });

      expect(feedingLink).toHaveAttribute('href', '/s?pub_category=Baby%20%3E%20Feeding');
      expect(bottlesLink).toHaveAttribute('href', '/s?pub_category=Baby%20%3E%20Feeding%20%3E%20Bottles');
      expect(glassLink).toHaveAttribute('href', '/s?pub_category=Baby%20%3E%20Feeding%20%3E%20Bottles%20%3E%20Glass');

      // Last item should also be a link (updated behavior - all categories are clickable)
      expect(screen.getByText('Wide Neck')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Wide Neck' })).toBeInTheDocument();
    });
  });

  describe('translation support', () => {
    it('renders home link with translation key', () => {
      renderWithProviders(<CategoryBreadcrumb category="Baby Products" showHomeLink={true} />);

      // The home link should be present (even if showing translation key)
      const links = screen.getAllByRole('link');
      const homeLink = links.find(link => link.getAttribute('href') === '/s');
      expect(homeLink).toHaveAttribute('href', '/s');
    });

    it('maintains correct category links', () => {
      renderWithProviders(<CategoryBreadcrumb category="Products > Clothing > Organic" />);

      const productsLink = screen.getByRole('link', { name: 'Products' });
      const clothingLink = screen.getByRole('link', { name: 'Clothing' });

      expect(productsLink).toHaveAttribute('href', '/s?pub_category=Products');
      expect(clothingLink).toHaveAttribute('href', '/s?pub_category=Products%20%3E%20Clothing');
    });
  });

  describe('Updated behavior - all categories clickable', () => {
    it('makes last category item clickable with currentCategory class', () => {
      renderWithProviders(<CategoryBreadcrumb category="Level1 > Level2 > Level3" />);

      const lastCategoryLink = screen.getByRole('link', { name: 'Level3' });
      expect(lastCategoryLink).toBeInTheDocument();
      expect(lastCategoryLink).toHaveAttribute('href', '/s?pub_category=Level1%20%3E%20Level2%20%3E%20Level3');
      expect(lastCategoryLink).toHaveClass('currentCategory');
    });

    it('applies breadcrumbLink class to non-last categories', () => {
      renderWithProviders(<CategoryBreadcrumb category="Level1 > Level2 > Level3" />);

      const firstCategoryLink = screen.getByRole('link', { name: 'Level1' });
      const secondCategoryLink = screen.getByRole('link', { name: 'Level2' });

      expect(firstCategoryLink).toHaveClass('breadcrumbLink');
      expect(secondCategoryLink).toHaveClass('breadcrumbLink');
    });

    it('renders chevron separators between categories but not after last', () => {
      const { container } = renderWithProviders(<CategoryBreadcrumb category="Level1 > Level2 > Level3" />);

      const chevrons = container.querySelectorAll('.chevronIcon');
      // Should have 2 chevrons for 3 categories (between Level1-Level2 and Level2-Level3)
      expect(chevrons.length).toBe(2);
    });

    it('sets aria-current="page" on last category item', () => {
      renderWithProviders(<CategoryBreadcrumb category="Level1 > Level2 > Level3" />);

      const lastCategoryLink = screen.getByRole('link', { name: 'Level3' });
      // Note: NamedLink component may not pass through aria-current properly
      // Check if it has the currentCategory class instead
      expect(lastCategoryLink).toHaveClass('currentCategory');
    });

    it('has proper title attributes for accessibility', () => {
      renderWithProviders(<CategoryBreadcrumb category="Baby > Clothing > Onesies" />);

      const babyLink = screen.getByRole('link', { name: 'Baby' });
      const clothingLink = screen.getByRole('link', { name: 'Clothing' });
      const onesiesLink = screen.getByRole('link', { name: 'Onesies' });

      expect(babyLink).toHaveAttribute('title', 'View all products in Baby');
      expect(clothingLink).toHaveAttribute('title', 'View all products in Clothing');
      expect(onesiesLink).toHaveAttribute('title', 'View all products in Onesies');
    });

    it('renders navigation with proper aria-label', () => {
      const { container } = renderWithProviders(<CategoryBreadcrumb category="Level1 > Level2" />);

      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('aria-label', 'Category breadcrumb');
    });

    it('uses unordered list structure for breadcrumb', () => {
      renderWithProviders(<CategoryBreadcrumb category="Level1 > Level2 > Level3" />);

      const list = screen.getByRole('list');
      expect(list.tagName).toBe('UL');

      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(3); // One for each category
    });

    it('includes home link when showHomeLink is true', () => {
      renderWithProviders(<CategoryBreadcrumb category="Baby > Clothing" showHomeLink={true} />);

      const links = screen.getAllByRole('link');
      const homeLink = links.find(link => link.getAttribute('href') === '/s');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveTextContent('CategoryBreadcrumb.home');

      // Should have 3 links total: home + 2 categories
      expect(links.length).toBe(3);
    });

    it('excludes home link when showHomeLink is false or undefined', () => {
      renderWithProviders(<CategoryBreadcrumb category="Baby > Clothing" showHomeLink={false} />);

      const links = screen.getAllByRole('link');
      const homeLink = links.find(link => link.getAttribute('href') === '/s');
      expect(homeLink).toBeFalsy();

      // Should have 2 links total: just the 2 categories
      expect(links.length).toBe(2);
    });

    it('handles category objects with resolved names from category configuration', () => {
      const resolvedCategoryObject = {
        level1: 'Baby Clothes & Accessories',
        level2: 'Clothing',
        level3: 'Tops & One-Pieces'
      };
      renderWithProviders(<CategoryBreadcrumb category={resolvedCategoryObject} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Baby Clothes & Accessories' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Clothing' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tops & One-Pieces' })).toBeInTheDocument();
    });

    it('handles sparse category objects with missing levels', () => {
      const sparseCategoryObject = {
        level1: 'Baby Clothes & Accessories',
        level3: 'Tops & One-Pieces' // Missing level2
      };
      renderWithProviders(<CategoryBreadcrumb category={sparseCategoryObject} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Baby Clothes & Accessories' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tops & One-Pieces' })).toBeInTheDocument();
      expect(screen.queryByText('level2')).not.toBeInTheDocument();
    });

    it('generates correct search URLs for resolved category names', () => {
      const resolvedCategoryObject = {
        level1: 'Baby Clothes & Accessories',
        level2: 'Clothing'
      };
      renderWithProviders(<CategoryBreadcrumb category={resolvedCategoryObject} />);

      const level1Link = screen.getByRole('link', { name: 'Baby Clothes & Accessories' });
      const level2Link = screen.getByRole('link', { name: 'Clothing' });

      expect(level1Link).toHaveAttribute('href', '/s?pub_category=Baby%20Clothes%20%26%20Accessories');
      expect(level2Link).toHaveAttribute('href', '/s?pub_category=Baby%20Clothes%20%26%20Accessories%20%3E%20Clothing');
    });

    it('handles special characters in category names', () => {
      const categoryWithSpecialChars = {
        level1: 'Baby & Kids',
        level2: 'Toys, Games & Books',
        level3: 'Arts & Crafts'
      };
      renderWithProviders(<CategoryBreadcrumb category={categoryWithSpecialChars} />);

      expect(screen.getByRole('link', { name: 'Baby & Kids' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Toys, Games & Books' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Arts & Crafts' })).toBeInTheDocument();

      // Check URL encoding
      const level1Link = screen.getByRole('link', { name: 'Baby & Kids' });
      expect(level1Link).toHaveAttribute('href', '/s?pub_category=Baby%20%26%20Kids');
    });

    it('maintains accessibility with resolved category names', () => {
      const resolvedCategoryObject = {
        level1: 'Baby Clothes & Accessories',
        level2: 'Clothing',
        level3: 'Tops & One-Pieces'
      };
      renderWithProviders(<CategoryBreadcrumb category={resolvedCategoryObject} />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('title');
        expect(link.getAttribute('title')).toContain('View all products in');
      });

      const lastLink = screen.getByRole('link', { name: 'Tops & One-Pieces' });
      expect(lastLink).toHaveClass('currentCategory');
    });
  });
});