import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import BrandPhotoCard, { deriveWhyLine } from './BrandPhotoCard';

// Isolate from image rendering + routing + brand-slug config.
jest.mock('../ListingImage/ListingImage', () => ({ listing, variant, alt }) => (
  <div
    data-testid="listing-image"
    data-variant={variant}
    data-id={listing?.id?.uuid}
    data-alt={alt}
  />
));

jest.mock('../NamedLink/NamedLink', () => ({ name, params, className, children }) => (
  <a
    data-testid="named-link"
    data-name={name}
    data-params={JSON.stringify(params || {})}
    className={className}
  >
    {children}
  </a>
));

jest.mock('../../config/configBrands', () => ({
  getBrandSlugById: () => 'lucknow-brand',
}));

const product = uuid => ({ id: { uuid }, images: [{ id: { uuid: `${uuid}-img` } }] });

const brand = (publicData = {}) => ({
  id: { uuid: 'brand-1' },
  attributes: {
    profile: { displayName: 'House of Chikankari', bio: 'A story. More text.', publicData },
  },
});

const renderCard = props =>
  render(
    <BrandPhotoCard
      brand={brand({ brandCraft: 'Lucknow chikankari, embroidered by hand' })}
      {...props}
    />
  );

describe('BrandPhotoCard', () => {
  it('renders null when no product has an image', () => {
    const { container } = render(
      <BrandPhotoCard brand={brand()} products={[{ id: { uuid: 'no-img' }, images: [] }]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the brand name and the derived why line (brandCraft)', () => {
    renderCard({ products: [product('a')] });
    expect(screen.getByText('House of Chikankari')).toBeInTheDocument();
    expect(screen.getByText('Lucknow chikankari, embroidered by hand')).toBeInTheDocument();
  });

  it('shows the brand initial chip', () => {
    renderCard({ products: [product('a')] });
    expect(screen.getByText('H')).toBeInTheDocument();
  });

  it('renders one thumbnail per product (capped at 4)', () => {
    renderCard({
      products: [product('a'), product('b'), product('c'), product('d'), product('e')],
    });
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('does not render a filmstrip for a single product', () => {
    renderCard({ products: [product('a')] });
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('swaps the main photo when a thumbnail is hovered', () => {
    const { container } = renderCard({ products: [product('a'), product('b'), product('c')] });
    const mainPhoto = () => container.querySelector('[data-variant="listing-card"]');
    // Initially shows the first product.
    expect(mainPhoto()).toHaveAttribute('data-id', 'a');

    fireEvent.mouseEnter(screen.getAllByRole('tab')[2]);
    expect(mainPhoto()).toHaveAttribute('data-id', 'c');
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('swaps the main photo when a thumbnail is tapped (click)', () => {
    const { container } = renderCard({ products: [product('a'), product('b')] });
    const mainPhoto = () => container.querySelector('[data-variant="listing-card"]');
    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(mainPhoto()).toHaveAttribute('data-id', 'b');
  });

  it('links the card to the brand page', () => {
    renderCard({ products: [product('a')] });
    const links = screen.getAllByTestId('named-link');
    expect(links[0]).toHaveAttribute('data-name', 'BrandPage');
    expect(links[0]).toHaveAttribute('data-params', JSON.stringify({ brandSlug: 'lucknow-brand' }));
  });

  it('deriveWhyLine falls back to the first sentence of bio', () => {
    const b = brand({});
    expect(deriveWhyLine(b)).toBe('A story');
  });
});
