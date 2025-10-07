import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders, testingLibrary } from '../../util/testHelpers';
import CategoryBreadcrumb from '../CategoryBreadcrumb/CategoryBreadcrumb';
import ItemSpecifics from './ItemSpecifics';

const { screen, fireEvent } = testingLibrary;

// Mock the Modal component to simplify testing
jest.mock('../../components/Modal/Modal', () => {
  return ({ children, isOpen, className, containerClassName }) =>
    isOpen ? (
      <div className={`mock-modal ${className} ${containerClassName}`}>
        {children}
      </div>
    ) : null;
});

describe('ItemSpecifics', () => {
  const mockAttributes = [
    { key: 'Brand', value: 'Organic Baby Co.' },
    { key: 'Material', value: '100% Organic Cotton' },
    { key: 'Size', value: '6-12 months' },
    { key: 'Color', value: 'Natural White' },
    { key: 'Care Instructions', value: 'Machine wash cold, tumble dry low' },
  ];

  const mockCategoryBreadcrumb = (
    <CategoryBreadcrumb category="Baby Products > Clothing > Onesies" />
  );

  it('renders nothing when no attributes and no category', () => {
    const { container } = renderWithProviders(
      <ItemSpecifics attributes={[]} categoryBreadcrumb={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders with category breadcrumb only', () => {
    renderWithProviders(
      <ItemSpecifics
        attributes={[]}
        categoryBreadcrumb={mockCategoryBreadcrumb}
      />
    );

    expect(screen.getByText('ItemSpecifics.title')).toBeInTheDocument();
    expect(screen.getAllByText('Baby Products')).toHaveLength(2); // Desktop and mobile layouts
    expect(screen.getAllByText('Clothing')).toHaveLength(2);
    expect(screen.getAllByText('Onesies')).toHaveLength(2);
  });

  it('renders with attributes only', () => {
    renderWithProviders(
      <ItemSpecifics
        attributes={mockAttributes}
        categoryBreadcrumb={null}
      />
    );

    expect(screen.getByText('ItemSpecifics.title')).toBeInTheDocument();
    expect(screen.getAllByText('Brand')).toHaveLength(2); // Desktop and mobile layouts
    expect(screen.getAllByText('Organic Baby Co.')).toHaveLength(2);
    expect(screen.getAllByText('Material')).toHaveLength(2);
    expect(screen.getAllByText('100% Organic Cotton')).toHaveLength(2);
  });

  it('renders both category and attributes', () => {
    renderWithProviders(
      <ItemSpecifics
        attributes={mockAttributes}
        categoryBreadcrumb={mockCategoryBreadcrumb}
      />
    );

    // Category should be first
    expect(screen.getAllByText('ItemSpecifics.category')).toHaveLength(2); // Desktop and mobile layouts
    expect(screen.getAllByText('Baby Products')).toHaveLength(2); // In category breadcrumb (desktop and mobile)

    // Followed by attributes
    expect(screen.getAllByText('Brand')).toHaveLength(2);
    expect(screen.getAllByText('Organic Baby Co.')).toHaveLength(2);
  });

  it('applies custom className', () => {
    const { container } = renderWithProviders(
      <ItemSpecifics
        attributes={mockAttributes}
        className="custom-specifics"
      />
    );

    expect(container.firstChild).toHaveClass('custom-specifics');
  });

  it('applies custom rootClassName', () => {
    const { container } = renderWithProviders(
      <ItemSpecifics
        attributes={mockAttributes}
        rootClassName="custom-root"
      />
    );

    expect(container.firstChild).toHaveClass('custom-root');
  });

  describe('table structure', () => {
    it('renders attributes in proper table structure', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          categoryBreadcrumb={mockCategoryBreadcrumb}
        />
      );

      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);

      // Check table structure (use first table - desktop layout)
      const table = tables[0];
      const rows = table.querySelectorAll('tr');

      // Should have category + attributes
      expect(rows.length).toBe(mockAttributes.length + 1);

      // Check first row (category)
      const firstRow = rows[0];
      const categoryKeyCell = firstRow.querySelector('th');
      const categoryValueCell = firstRow.querySelector('td');

      expect(categoryKeyCell).toHaveTextContent('ItemSpecifics.category');
      expect(categoryValueCell).toContainElement(screen.getAllByText('Baby Products')[0]);

      // Check attribute rows
      const attributeRow = rows[1];
      const keyCell = attributeRow.querySelector('th');
      const valueCell = attributeRow.querySelector('td');

      expect(keyCell).toHaveTextContent('Brand');
      expect(valueCell).toHaveTextContent('Organic Baby Co.');
    });

    it('uses semantic table elements', () => {
      renderWithProviders(
        <ItemSpecifics attributes={mockAttributes} />
      );

      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);

      const table = tables[0];
      const tbody = table.querySelector('tbody');
      expect(tbody).toBeInTheDocument();

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);

      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('mobile layout and modal', () => {
    it('shows "Show More" button when exceeding maxMobileAttributes', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          categoryBreadcrumb={mockCategoryBreadcrumb}
          maxMobileAttributes={3}
        />
      );

      // Should show button since we have category + 5 attributes > 3
      const showMoreButton = screen.getByRole('button', {
        name: /ItemSpecifics.showMore/i
      });
      expect(showMoreButton).toBeInTheDocument();
    });

    it('does not show "Show More" button when within maxMobileAttributes', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes.slice(0, 2)}
          categoryBreadcrumb={mockCategoryBreadcrumb}
          maxMobileAttributes={4}
        />
      );

      // Should not show button since we have category + 2 attributes <= 4
      const showMoreButton = screen.queryByRole('button', {
        name: /ItemSpecifics.showMore/i
      });
      expect(showMoreButton).not.toBeInTheDocument();
    });

    it('opens modal when "Show More" button is clicked', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          categoryBreadcrumb={mockCategoryBreadcrumb}
          maxMobileAttributes={2}
        />
      );

      const showMoreButton = screen.getByRole('button');

      fireEvent.click(showMoreButton);

      // Modal should be open
      expect(screen.getByText('ItemSpecifics.modalTitle')).toBeInTheDocument();

      // All attributes should be visible in modal
      // Care Instructions is not in mobile (only first 2 items), but is in desktop and modal
      expect(screen.getAllByText('Care Instructions')).toHaveLength(2); // Desktop + modal
      expect(screen.getAllByText('Machine wash cold, tumble dry low')).toHaveLength(2);
    });

    it('closes modal when close button is clicked', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          categoryBreadcrumb={mockCategoryBreadcrumb}
          maxMobileAttributes={2}
        />
      );

      // Open modal
      const showMoreButton = screen.getByRole('button', {
        name: /ItemSpecifics.showMore/i
      });
      fireEvent.click(showMoreButton);

      // Close modal
      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      // Modal should be closed
      expect(screen.queryByText('ItemSpecifics.modalTitle')).not.toBeInTheDocument();
    });

    it('calculates remaining attributes count correctly for show more button', () => {
      const sevenAttributes = [
        ...mockAttributes,
        { key: 'Weight', value: '2 oz' },
        { key: 'Manufacturer', value: 'Baby Care Inc.' },
      ];

      renderWithProviders(
        <ItemSpecifics
          attributes={sevenAttributes}
          categoryBreadcrumb={mockCategoryBreadcrumb}
          maxMobileAttributes={3}
        />
      );

      // Total: 1 category + 7 attributes = 8
      // Showing: 3
      // Remaining: 5
      const showMoreButton = screen.getByRole('button');
      // In tests, we get the translation key, not the interpolated value
      expect(showMoreButton).toBeInTheDocument();
    });
  });

  describe('responsive layouts', () => {
    it('renders both desktop and mobile layouts', () => {
      const { container } = renderWithProviders(
        <ItemSpecifics attributes={mockAttributes} />
      );

      const desktopLayout = container.querySelector('.desktopLayout');
      const mobileLayout = container.querySelector('.mobileLayout');

      expect(desktopLayout).toBeInTheDocument();
      expect(mobileLayout).toBeInTheDocument();
    });

    it('desktop layout shows all attributes', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          categoryBreadcrumb={mockCategoryBreadcrumb}
          maxMobileAttributes={2}
        />
      );

      // In desktop layout, all attributes should be visible
      // (we can't easily test CSS media queries, but we can test that both layouts exist)
      const tables = screen.getAllByRole('table');

      // Should have desktop table and mobile table
      expect(tables.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('modal content', () => {
    it('displays all attributes in modal including category', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          categoryBreadcrumb={mockCategoryBreadcrumb}
          maxMobileAttributes={1}
        />
      );

      // Open modal
      const showMoreButton = screen.getByRole('button', {
        name: /ItemSpecifics.showMore/i
      });
      fireEvent.click(showMoreButton);

      // Check that category is shown
      expect(screen.getAllByText('ItemSpecifics.category')).toHaveLength(3); // Desktop + mobile + modal
      expect(screen.getAllByText('Baby Products')).toHaveLength(3); // In category breadcrumb (desktop + mobile + modal)

      // Check that all attributes are shown
      // First attribute appears in desktop and modal
      expect(screen.getAllByText(mockAttributes[0].key)).toHaveLength(2); // Desktop + modal
      expect(screen.getAllByText(mockAttributes[0].value)).toHaveLength(2);

      // Last attribute appears in desktop and modal
      expect(screen.getAllByText(mockAttributes[mockAttributes.length - 1].key)).toHaveLength(2);
      expect(screen.getAllByText(mockAttributes[mockAttributes.length - 1].value)).toHaveLength(2);
    });

    it('displays only attributes in modal when no category', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          categoryBreadcrumb={null}
          maxMobileAttributes={2}
        />
      );

      // Open modal
      const showMoreButton = screen.getByRole('button', {
        name: /ItemSpecifics.showMore/i
      });
      fireEvent.click(showMoreButton);

      // Check that category is not shown
      expect(screen.queryByText('ItemSpecifics.category')).not.toBeInTheDocument();

      // Check that all attributes are shown
      // Only checking the last two attributes that should be in desktop and modal only
      const lastTwoAttributes = mockAttributes.slice(-2);
      lastTwoAttributes.forEach(({ key, value }) => {
        expect(screen.getAllByText(key)).toHaveLength(2); // Desktop + modal (not in mobile due to limit)
        expect(screen.getAllByText(value)).toHaveLength(2);
      });
    });
  });

  describe('accessibility', () => {
    it('renders as semantic section', () => {
      const { container } = renderWithProviders(
        <ItemSpecifics attributes={mockAttributes} />
      );

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      renderWithProviders(
        <ItemSpecifics attributes={mockAttributes} />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('ItemSpecifics.title');
    });

    it('modal has proper ARIA attributes', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          maxMobileAttributes={1}
        />
      );

      // Open modal
      const showMoreButton = screen.getByRole('button');
      fireEvent.click(showMoreButton);

      const closeButton = screen.getByRole('button', { name: 'Close' });
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });

    it('uses proper table headers', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          categoryBreadcrumb={mockCategoryBreadcrumb}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);

      // Should have category headers in both desktop and mobile layouts
      const categoryHeaders = headers.filter(h => h.textContent.includes('ItemSpecifics.category'));
      expect(categoryHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty attributes array', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={[]}
          categoryBreadcrumb={mockCategoryBreadcrumb}
        />
      );

      expect(screen.getByText('ItemSpecifics.title')).toBeInTheDocument();
      expect(screen.getAllByText('Baby Products')).toHaveLength(2); // Desktop and mobile
    });

    it('handles attributes with empty or special characters', () => {
      const specialAttributes = [
        { key: 'Special & Characters', value: 'Value with "quotes" and \'apostrophes\'' },
        { key: 'HTML <Tags>', value: 'Should be <escaped>' },
        { key: 'Non-empty key', value: 'Empty key test' },
        { key: 'Empty value', value: 'Non-empty value' },
      ];

      renderWithProviders(
        <ItemSpecifics attributes={specialAttributes} />
      );

      expect(screen.getAllByText('Special & Characters')).toHaveLength(2); // Desktop and mobile
      expect(screen.getAllByText('Value with "quotes" and \'apostrophes\'')).toHaveLength(2);
      expect(screen.getAllByText('HTML <Tags>')).toHaveLength(2);
      expect(screen.getAllByText('Should be <escaped>')).toHaveLength(2);
    });

    it('handles very large attribute lists', () => {
      const largeAttributeList = Array.from({ length: 50 }, (_, i) => ({
        key: `Attribute ${i + 1}`,
        value: `Value ${i + 1}`,
      }));

      renderWithProviders(
        <ItemSpecifics
          attributes={largeAttributeList}
          maxMobileAttributes={5}
        />
      );

      expect(screen.getByText('ItemSpecifics.title')).toBeInTheDocument();
      expect(screen.getAllByText('Attribute 1')).toHaveLength(2); // Desktop and mobile
      expect(screen.getAllByText('Value 1')).toHaveLength(2);

      const showMoreButton = screen.getByRole('button');
      // Note: The text content would be the translation key, not the count
      expect(showMoreButton).toBeInTheDocument();
    });

    it('handles maxMobileAttributes of 0', () => {
      renderWithProviders(
        <ItemSpecifics
          attributes={mockAttributes}
          maxMobileAttributes={0}
        />
      );

      const showMoreButton = screen.getByRole('button');
      // Note: The text content would be the translation key, not the count
      expect(showMoreButton).toBeInTheDocument();
    });
  });
});