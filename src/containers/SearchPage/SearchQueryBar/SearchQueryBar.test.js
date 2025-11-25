import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import SearchQueryBar from './SearchQueryBar';

// Mock icons
jest.mock('../../../components', () => ({
  IconSearch: () => <div data-testid="icon-search">Search Icon</div>,
  IconClose: () => <div data-testid="icon-close">Close Icon</div>,
}));

const mockConfig = {
  search: {
    mainSearch: {
      searchType: 'keywords',
    },
  },
};

const mockConfigLocationSearch = {
  search: {
    mainSearch: {
      searchType: 'location',
    },
  },
};

const renderWithIntl = (component) => {
  const messages = {
    'SearchQueryBar.editSearchAriaLabel': 'Edit search for: {query}',
    'SearchQueryBar.clearSearch': 'Clear search',
  };

  return render(
    <IntlProvider locale="en" messages={messages}>
      {component}
    </IntlProvider>
  );
};

describe('SearchQueryBar', () => {
  const mockOnEdit = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering with keywords', () => {
    it('renders query bar with keyword search', () => {
      renderWithIntl(
        <SearchQueryBar
          keywords="organic baby clothes"
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfig}
        />
      );

      expect(screen.getByText('organic baby clothes')).toBeInTheDocument();
      expect(screen.getByTestId('icon-search')).toBeInTheDocument();
      expect(screen.getByTestId('icon-close')).toBeInTheDocument();
    });

    it('does not render when no keywords provided', () => {
      const { container } = renderWithIntl(
        <SearchQueryBar
          keywords={null}
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfig}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('truncates long keyword queries with ellipsis (via CSS)', () => {
      const longQuery = 'organic cotton baby clothes romper onesie bodysuit newborn infant';

      renderWithIntl(
        <SearchQueryBar
          keywords={longQuery}
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfig}
        />
      );

      const queryText = screen.getByText(longQuery);
      expect(queryText).toBeInTheDocument();
      // CSS will handle truncation with ellipsis
    });
  });

  describe('Rendering with location', () => {
    it('renders query bar with location search', () => {
      renderWithIntl(
        <SearchQueryBar
          keywords={null}
          address="New York, NY"
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfigLocationSearch}
        />
      );

      expect(screen.getByText('New York, NY')).toBeInTheDocument();
      expect(screen.getByTestId('icon-search')).toBeInTheDocument();
      expect(screen.getByTestId('icon-close')).toBeInTheDocument();
    });

    it('does not render when no address provided', () => {
      const { container } = renderWithIntl(
        <SearchQueryBar
          keywords={null}
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfigLocationSearch}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('User interactions', () => {
    it('calls onEdit when query button is clicked', () => {
      renderWithIntl(
        <SearchQueryBar
          keywords="romper"
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfig}
        />
      );

      const queryButton = screen.getByRole('button', { name: /edit search/i });
      fireEvent.click(queryButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onClear when clear button is clicked', () => {
      renderWithIntl(
        <SearchQueryBar
          keywords="romper"
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfig}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for edit button', () => {
      renderWithIntl(
        <SearchQueryBar
          keywords="baby clothes"
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfig}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit search for: baby clothes/i });
      expect(editButton).toBeInTheDocument();
    });

    it('has proper ARIA label for clear button', () => {
      renderWithIntl(
        <SearchQueryBar
          keywords="baby clothes"
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfig}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('CSS classes', () => {
    it('applies custom className when provided', () => {
      const { container } = renderWithIntl(
        <SearchQueryBar
          keywords="test"
          address={null}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          config={mockConfig}
          className="customClass"
        />
      );

      const rootElement = container.firstChild;
      expect(rootElement).toHaveClass('customClass');
    });
  });
});
