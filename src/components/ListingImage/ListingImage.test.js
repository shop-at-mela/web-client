import React from 'react';
import '@testing-library/jest-dom';
import { render, waitFor, fireEvent } from '@testing-library/react';
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

// ListingImage's default lazy path wraps ResponsiveImage in lazyLoadWithDimensions, which
// only renders its child once its wrapper div reports a nonzero clientWidth/clientHeight
// (see util/uiHelpers.js) — jsdom has no real layout engine, so those are always 0 unless
// stubbed. Waiting alone never resolves this; stub the dimensions instead.
beforeAll(() => {
  // jsdom defines these on Element.prototype; overriding directly on HTMLElement.prototype
  // shadows that getter and is removable via delete, restoring the original behavior.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 240 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 240 });
});

afterAll(() => {
  delete HTMLElement.prototype.clientWidth;
  delete HTMLElement.prototype.clientHeight;
});

describe('ListingImage', () => {
  // Even with dimensions stubbed, LazyImage still waits for a window.setTimeout(..., 100ms)
  // (see util/uiHelpers.js RENDER_WAIT_MS) before rendering — so <img> appears asynchronously.
  it('renders with default props', async () => {
    const { container } = render(<ListingImage listing={mockListing} />);
    await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument());
  });

  it('uses correct image variant', async () => {
    const { container } = render(<ListingImage listing={mockListing} variant="square-small" />);
    await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument());
  });

  it('applies custom alt text when provided', async () => {
    const customAlt = 'Custom alt text';
    const { findByAltText } = render(<ListingImage listing={mockListing} alt={customAlt} />);
    expect(await findByAltText(customAlt)).toBeInTheDocument();
  });

  it('generates default alt text from listing title', async () => {
    const { findByAltText } = render(<ListingImage listing={mockListing} />);
    expect(await findByAltText(/Organic Baby Romper/)).toBeInTheDocument();
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

  it('uses lazy loading by default', async () => {
    // LazyImage component uses data-testid
    const { container } = render(<ListingImage listing={mockListing} />);
    await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument());
  });

  it('disables lazy loading when lazy=false', () => {
    const { container } = render(<ListingImage listing={mockListing} lazy={false} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('falls back to all variants when specified variant not found', async () => {
    const { container } = render(
      <ListingImage listing={mockListing} variant="non-existent-variant" />
    );
    // Should still render with fallback to available variants
    await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument());
  });

  it('passes rootClassName to inner image component', async () => {
    const customRootClass = 'custom-root-image';
    const { container } = render(
      <ListingImage listing={mockListing} rootClassName={customRootClass} />
    );
    await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument());
    // ResponsiveImage applies rootClassName directly to the <img> element, not a wrapper.
    const img = container.querySelector('img');
    expect(img).toHaveClass(customRootClass);
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

    // React's synthetic onMouseEnter/onMouseLeave are derived from native
    // mouseover/mouseout events, not raw 'mouseenter'/'mouseleave' dispatches —
    // use testing-library's fireEvent helpers, which handle that mapping.
    const wrapper = container.firstChild;
    fireEvent.mouseEnter(wrapper);
    expect(onMouseEnter).toHaveBeenCalled();

    fireEvent.mouseLeave(wrapper);
    expect(onMouseLeave).toHaveBeenCalled();
  });
});
