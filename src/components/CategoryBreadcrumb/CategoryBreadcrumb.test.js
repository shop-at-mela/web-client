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
    expect(screen.getByRole('link')).toHaveAttribute('href', '/s');
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

  it('creates correct search links for each category level', () => {
    renderWithProviders(<CategoryBreadcrumb category="Baby Products > Clothing > Organic" />);

    const links = screen.getAllByRole('link');

    // Should have home link and category links (excluding last item which is not a link)
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

      // Last item should not be a link
      expect(screen.getByText('Wide Neck')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Wide Neck' })).not.toBeInTheDocument();
    });
  });

  describe('translation support', () => {
    it('renders home link with translation key', () => {
      renderWithProviders(<CategoryBreadcrumb category="Baby Products" />);

      // The home link should be present (even if showing translation key)
      const homeLink = screen.getAllByRole('link')[0]; // First link should be home
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
});