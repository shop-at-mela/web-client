import React from 'react';
import '@testing-library/jest-dom';

import { createImage } from '../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';

import ListingImageGallery from './ListingImageGallery';

const { screen, fireEvent } = testingLibrary;

// react-image-gallery drives its own touch/animation internals (setTimeout-based
// slide transitions, DOM measurements) that aren't meaningful in jsdom. We mock
// it down to the props contract ListingImageGallery relies on: `items`,
// `renderItem`, `renderThumbInner`, `renderLeftNav`, `renderRightNav`, and
// `onSlide`. This lets us assert on that contract directly and deterministically,
// which is what actually broke in the mobile-scroll regression (see
// mockCaptureItems below).
const mockCaptureItems = jest.fn();
jest.mock('react-image-gallery', () => {
  const ReactActual = require('react');
  return ReactActual.forwardRef((props, ref) => {
    const { items, renderItem, renderThumbInner, renderLeftNav, renderRightNav, onSlide, showThumbnails } = props;
    mockCaptureItems(items);
    return (
      <div data-testid="mock-image-gallery">
        {renderLeftNav && renderLeftNav(() => onSlide && onSlide(0), false)}
        {renderRightNav && renderRightNav(() => onSlide && onSlide(1), false)}
        {items.map((item, i) => (
          <div key={`slide-${i}`}>{renderItem(item)}</div>
        ))}
        {showThumbnails &&
          items.map((item, i) => <div key={`thumb-${i}`}>{renderThumbInner(item)}</div>)}
      </div>
    );
  });
});

const setViewportWidth = width => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
};

const imageVariants = ['square2x', 'square'];
const thumbnailVariants = ['square'];

describe('ListingImageGallery', () => {
  beforeEach(() => {
    setViewportWidth(1024);
  });

  it('renders an image for each item in the gallery', () => {
    const images = [createImage('image-1'), createImage('image-2'), createImage('image-3')];
    render(
      <ListingImageGallery
        images={images}
        imageVariants={imageVariants}
        thumbnailVariants={thumbnailVariants}
      />
    );

    // TestProvider maps every translation key to itself (see testHelpers.js),
    // so all three images share the same literal alt text here.
    expect(screen.getAllByAltText('ListingImageGallery.imageAltText')).toHaveLength(3);
  });

  it('renders the no-image fallback when there are no images', () => {
    render(
      <ListingImageGallery images={[]} imageVariants={imageVariants} thumbnailVariants={thumbnailVariants} />
    );

    expect(screen.getByText('ResponsiveImage.noImage')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-image-gallery')).not.toBeInTheDocument();
  });

  it('shows dot indicators on mobile viewports with more than one image, and not on desktop', () => {
    const images = [createImage('image-1'), createImage('image-2')];

    setViewportWidth(500);
    const { unmount } = render(
      <ListingImageGallery images={images} imageVariants={imageVariants} thumbnailVariants={thumbnailVariants} />
    );
    expect(screen.getAllByLabelText('ListingImageGallery.dotIndicatorLabel')).toHaveLength(2);
    unmount();

    setViewportWidth(1024);
    render(
      <ListingImageGallery images={images} imageVariants={imageVariants} thumbnailVariants={thumbnailVariants} />
    );
    expect(screen.queryAllByLabelText('ListingImageGallery.dotIndicatorLabel')).toHaveLength(0);
  });

  it('advances the active dot when the gallery reports a slide change', () => {
    const images = [createImage('image-1'), createImage('image-2')];
    setViewportWidth(500);

    render(
      <ListingImageGallery images={images} imageVariants={imageVariants} thumbnailVariants={thumbnailVariants} />
    );

    const [firstDot, secondDot] = screen.getAllByLabelText('ListingImageGallery.dotIndicatorLabel');
    expect(firstDot.className).toMatch(/dotActive/);
    expect(secondDot.className).not.toMatch(/dotActive/);

    // Right nav calls onSlide(1) in our mock, simulating the gallery reporting
    // it moved to the second slide.
    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(firstDot.className).not.toMatch(/dotActive/);
    expect(secondDot.className).toMatch(/dotActive/);
  });

  it('regression: keeps the items array reference stable across a slide-triggered re-render', () => {
    // This is the actual bug: react-image-gallery resets its current slide back
    // to startIndex whenever the `items` prop reference changes. Before the fix,
    // `items` was rebuilt with `.map()` on every render, and `onSlide` triggered
    // a re-render on every swipe, so the gallery reset itself right after every
    // slide (a "glimpse of the next photo, then snap back" loop). `items` must
    // now be memoized so it only changes when the underlying images actually do.
    const images = [createImage('image-1'), createImage('image-2'), createImage('image-3')];

    render(
      <ListingImageGallery images={images} imageVariants={imageVariants} thumbnailVariants={thumbnailVariants} />
    );

    const itemsBeforeSlide = mockCaptureItems.mock.calls[0][0];

    // Simulate the gallery reporting a slide change, which triggers
    // setCurrentIndex and a re-render of ListingImageGallery.
    fireEvent.click(screen.getAllByRole('button')[1]);

    const callsAfterSlide = mockCaptureItems.mock.calls;
    const itemsAfterSlide = callsAfterSlide[callsAfterSlide.length - 1][0];

    expect(itemsAfterSlide).toBe(itemsBeforeSlide);
  });
});
