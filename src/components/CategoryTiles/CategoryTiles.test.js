import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

import CategoryTiles, { DEFAULT_CATEGORY_TILES } from './CategoryTiles';

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={{}}>
      {children}
    </IntlProvider>
  </MemoryRouter>
);

const renderTiles = props =>
  render(
    <TestWrapper>
      <CategoryTiles {...props} />
    </TestWrapper>
  );

describe('CategoryTiles', () => {
  it('renders the section title', () => {
    renderTiles();
    expect(screen.getByText('Shop by Category')).toBeInTheDocument();
  });

  it('renders all six default category tiles by label', () => {
    renderTiles();
    DEFAULT_CATEGORY_TILES.forEach(({ label }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('links each tile to its category page', () => {
    renderTiles();
    const fashion = screen.getByText('Fashion').closest('a');
    expect(fashion).toHaveAttribute('href', '/categories/Fashion');

    const baby = screen.getByText('Baby & Kids').closest('a');
    expect(baby).toHaveAttribute('href', '/categories/Baby-Kids');
  });

  it('renders a category glyph (svg) inside each tile', () => {
    const { container } = renderTiles();
    const svgs = container.querySelectorAll('a svg');
    expect(svgs.length).toBe(DEFAULT_CATEGORY_TILES.length);
  });

  it('renders a custom category set when provided', () => {
    renderTiles({ categories: [{ id: 'Fashion', label: 'Just Fashion' }] });
    expect(screen.getByText('Just Fashion')).toBeInTheDocument();
    expect(screen.queryByText('Beauty')).not.toBeInTheDocument();
  });
});
