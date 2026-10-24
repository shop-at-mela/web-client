import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

import CategoryChips from './CategoryChips';
import { DEFAULT_CATEGORY_TILES } from '../CategoryTiles/CategoryTiles';

const renderChips = props =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={{ 'CategoryChips.label': 'Shop by category' }}>
        <CategoryChips {...props} />
      </IntlProvider>
    </MemoryRouter>
  );

describe('CategoryChips', () => {
  it('renders a labelled nav with one chip per default category', () => {
    renderChips();
    expect(screen.getByRole('navigation', { name: 'Shop by category' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(DEFAULT_CATEGORY_TILES.length);
  });

  it('links each chip to its category page', () => {
    renderChips();
    expect(screen.getByRole('link', { name: 'Fashion' })).toHaveAttribute(
      'href',
      '/categories/Fashion'
    );
    expect(screen.getByRole('link', { name: 'Art & Craft' })).toHaveAttribute(
      'href',
      '/categories/Art-Craft'
    );
  });

  it('renders custom categories when passed', () => {
    renderChips({ categories: [{ id: 'Fashion', label: 'Fashion' }] });
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
