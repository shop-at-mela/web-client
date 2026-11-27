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

const variant = (uuid, name, width) => ({ url: `https://img.test/${uuid}/${name}`, width });
const product = (uuid, { portrait = true } = {}) => ({
  id: { uuid },
  images: [
    {
      id: { uuid: `${uuid}-img` },
      attributes: {
        variants: {
          'square-small': variant(uuid, 'square-small', 400),
          'square-small2x': variant(uuid, 'square-small2x', 800),
          ...(portrait
            ? {
                'portrait-card': variant(uuid, 'portrait-card', 480),
                'portrait-card2x': variant(uuid, 'portrait-card2x', 960),
              }
            : {}),
        },
      },
    },
  ],
});
const mainImg = () => screen.getByAltText('House of Chikankari');

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
    renderCard({ products: [product('a'), product('b'), product('c')] });
    // Initially shows the first product.
    expect(mainImg()).toHaveAttribute('src', 'https://img.test/a/square-small');

    fireEvent.mouseEnter(screen.getAllByRole('tab')[2]);
    expect(mainImg()).toHaveAttribute('src', 'https://img.test/c/square-small');
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('swaps the main photo when a thumbnail is tapped (click)', () => {
    renderCard({ products: [product('a'), product('b')] });
    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(mainImg()).toHaveAttribute('src', 'https://img.test/b/square-small');
  });

  it('serves the 4:5 portrait crop to phones and the 4:3 crop above 767px', () => {
    const { container } = renderCard({ products: [product('a')] });
    const source = container.querySelector('picture source');
    expect(source).toHaveAttribute('media', '(max-width: 767px)');
    expect(source.getAttribute('srcset')).toBe(
      'https://img.test/a/portrait-card 480w, https://img.test/a/portrait-card2x 960w'
    );
    expect(mainImg().getAttribute('srcset')).toBe(
      'https://img.test/a/square-small 400w, https://img.test/a/square-small2x 800w'
    );
  });

  it('uses 4:3 for every photo when any thumbnail lacks the portrait crop', () => {
    const { container } = renderCard({
      products: [product('a'), product('b', { portrait: false })],
    });
    expect(container.querySelector('picture source')).toBeNull();
    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(container.querySelector('picture source')).toBeNull();
    expect(mainImg()).toHaveAttribute('src', 'https://img.test/b/square-small');
  });

  it('keeps the 4:3 frame on phones when the listing has no portrait crop', () => {
    const { container } = renderCard({ products: [product('a', { portrait: false })] });
    expect(container.querySelector('picture source')).toBeNull();
    expect(mainImg()).toHaveAttribute('src', 'https://img.test/a/square-small');
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
