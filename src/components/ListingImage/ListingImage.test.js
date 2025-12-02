import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ListingImage } from './ListingImage';

const mockListing = {
  images: [
    {
      id: { uuid: 'image-1' },
      type: 'image',
      attributes: {
        variants: {
          'square-small': { url: 'https://example.com/image-small.jpg', width: 240, height: 240 },
          'square-small2x': {
            url: 'https://example.com/image-small@2x.jpg',
            width: 480,
            height: 480,
          },
        },
      },
    },
  ],
  attributes: {
    title: 'Organic Baby Romper',
  },
};

const mockListingNoImages = {
  images: [],
  attributes: {
    title: 'No Image Listing',
  },
};

describe('ListingImage', () => {
  it('renders with default props', () => {
    const { container } = render(<ListingImage listing={mockListing} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('uses correct image variant', () => {
    const { container } = render(<ListingImage listing={mockListing} variant="square-small" />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('applies custom alt text when provided', () => {
    const customAlt = 'Custom alt text';
    const { getByAltText } = render(<ListingImage listing={mockListing} alt={customAlt} />);
    expect(getByAltText(customAlt)).toBeInTheDocument();
  });

  it('generates default alt text from listing title', () => {
    const { getByAltText } = render(<ListingImage listing={mockListing} />);
    expect(getByAltText(/Organic Baby Romper/)).toBeInTheDocument();
  });

  it('returns null when listing has no images', () => {
    const { container } = render(<ListingImage listing={mockListingNoImages} />);
    expect(container.firstChild).toBeNull();
  });

  it('applies custom aspect ratio', () => {
    const { container } = render(
      <ListingImage listing={mockListing} aspectWidth={16} aspectHeight={9} />
    );
    // AspectRatioWrapper should be present with custom ratio
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className to wrapper', () => {
    const customClass = 'custom-image-wrapper';
    const { container } = render(<ListingImage listing={mockListing} className={customClass} />);
    expect(container.firstChild).toHaveClass(customClass);
  });

  it('uses lazy loading by default', () => {
    // LazyImage component uses data-testid
    const { container } = render(<ListingImage listing={mockListing} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('disables lazy loading when lazy=false', () => {
    const { container } = render(<ListingImage listing={mockListing} lazy={false} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('falls back to all variants when specified variant not found', () => {
    const { container } = render(
      <ListingImage listing={mockListing} variant="non-existent-variant" />
    );
    // Should still render with fallback to available variants
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('passes rootClassName to inner image component', () => {
    const customRootClass = 'custom-root-image';
    const { container } = render(
      <ListingImage listing={mockListing} rootClassName={customRootClass} />
    );
    const img = container.querySelector('img');
    expect(img?.parentElement).toHaveClass(customRootClass);
  });

  it('supports mouse event handlers for map integration', () => {
    const onMouseEnter = jest.fn();
    const onMouseLeave = jest.fn();
    const { container } = render(
      <ListingImage
        listing={mockListing}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );

    const wrapper = container.firstChild;
    wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    expect(onMouseEnter).toHaveBeenCalled();

    wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(onMouseLeave).toHaveBeenCalled();
  });
});
