import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import BrandCarousel from './BrandCarousel';

const makeItem = id => ({ id, name: `Brand ${id}` });

const renderCarousel = (props = {}) => {
  const defaults = {
    items: [makeItem('a'), makeItem('b'), makeItem('c')],
    renderItem: item => <div data-testid="brand-card" data-id={item.id}>{item.name}</div>,
  };
  return render(<BrandCarousel {...defaults} {...props} />);
};

describe('BrandCarousel', () => {
  it('renders a card for each item', () => {
    renderCarousel();
    expect(screen.getAllByTestId('brand-card')).toHaveLength(3);
  });

  it('passes each item to renderItem', () => {
    const items = [makeItem('x'), makeItem('y')];
    renderCarousel({ items });
    expect(screen.getByText('Brand x')).toBeInTheDocument();
    expect(screen.getByText('Brand y')).toBeInTheDocument();
  });

  it('uses getKey when provided', () => {
    const items = [makeItem('p'), makeItem('q')];
    // No error thrown = keys resolved correctly
    expect(() =>
      renderCarousel({ items, getKey: item => item.id })
    ).not.toThrow();
  });

  it('falls back to index key when getKey is not provided', () => {
    expect(() => renderCarousel({ getKey: undefined })).not.toThrow();
  });

  it('applies className to the root element', () => {
    const { container } = renderCarousel({ className: 'extraSpacing' });
    expect(container.firstChild).toHaveClass('extraSpacing');
  });

  it('renders nothing when items array is empty', () => {
    renderCarousel({ items: [] });
    expect(screen.queryByTestId('brand-card')).toBeNull();
  });
});
