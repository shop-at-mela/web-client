import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom';

// Mock the components barrel — BrandCarousel renders its items via renderItem,
// NamedLink renders a plain anchor. Keeps the test free of deep routing deps.
jest.mock('../../../../components', () => ({
  BrandCarousel: ({ items, renderItem, getKey }) => (
    <div data-testid="brand-carousel">
      {items.map(item => (
        <div key={getKey(item)}>{renderItem(item)}</div>
      ))}
    </div>
  ),
  NamedLink: ({ name, className, children }) => (
    <a data-testid="named-link" data-name={name} className={className}>
      {children}
    </a>
  ),
}));

jest.mock('../../../../components/BrandPhotoCard/BrandPhotoCard', () => ({ brand }) => (
  <div data-testid="brand-photo-card" data-brand={brand.id.uuid} />
));

jest.mock('../../../../config/configBrands', () => ({
  getAllBrandIds: () => ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'],
}));

import EarnedItsPlace from './EarnedItsPlace';

const withImage = uuid => ({
  brand: { id: { uuid } },
  products: [{ id: { uuid: `${uuid}-p` }, images: [{ id: { uuid: `${uuid}-img` } }] }],
});

const noImage = uuid => ({
  brand: { id: { uuid } },
  products: [{ id: { uuid: `${uuid}-p` }, images: [] }],
});

const renderSection = props =>
  render(
    <IntlProvider locale="en" messages={{}}>
      <EarnedItsPlace onFetchFeaturedBrands={jest.fn()} {...props} />
    </IntlProvider>
  );

describe('EarnedItsPlace', () => {
  it('renders the title and subtitle', () => {
    renderSection({ brandsWithProducts: [withImage('b1')] });
    expect(screen.getByText('Every Brand Here Earned Its Place')).toBeInTheDocument();
    expect(
      screen.getByText("Not a directory. A decision. Here's the why behind a few.")
    ).toBeInTheDocument();
  });

  it('renders a BrandPhotoCard for each brand that has an image-bearing product', () => {
    renderSection({ brandsWithProducts: [withImage('b1'), withImage('b2')] });
    expect(screen.getAllByTestId('brand-photo-card')).toHaveLength(2);
  });

  it('filters out brands with no image-bearing products', () => {
    renderSection({ brandsWithProducts: [withImage('b1'), noImage('b2')] });
    expect(screen.getAllByTestId('brand-photo-card')).toHaveLength(1);
  });

  it('caps the number of brand cards at six', () => {
    const many = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'].map(withImage);
    renderSection({ brandsWithProducts: many });
    expect(screen.getAllByTestId('brand-photo-card')).toHaveLength(6);
  });

  it('renders the explore-all-brands CTA with the total brand count', () => {
    renderSection({ brandsWithProducts: [withImage('b1')] });
    const cta = screen.getByTestId('named-link');
    expect(cta).toHaveAttribute('data-name', 'BrandsPage');
    expect(cta).toHaveTextContent('Explore All 7 Brands');
  });

  it('renders nothing on fetch error', () => {
    const { container } = renderSection({ brandsWithProducts: [], fetchError: { type: 'error' } });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when loading has finished with no brands', () => {
    const { container } = renderSection({ brandsWithProducts: [], fetchInProgress: false });
    expect(container.firstChild).toBeNull();
  });

  it('fetches on mount when no brands are loaded yet', () => {
    const onFetch = jest.fn();
    renderSection({
      brandsWithProducts: [],
      fetchInProgress: false,
      onFetchFeaturedBrands: onFetch,
    });
    expect(onFetch).toHaveBeenCalledTimes(1);
  });
});
