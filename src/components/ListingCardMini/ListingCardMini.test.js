import React from 'react';
import '@testing-library/jest-dom';
import { waitFor } from '@testing-library/react';

import { renderWithProviders as render } from '../../util/testHelpers';
import { createUser, createListing } from '../../util/testData';

import { ListingCardMini } from './ListingCardMini';

// Base listing — no INR data
const listing = createListing('listing1', {}, { author: createUser('user1') });

// Listing with an actual image, for tests that need the <img> to render.
// (createListing's default has no `images`, so ListingImage returns null.)
const listingWithImage = createListing(
  'listing6',
  {},
  {
    author: createUser('user1'),
    images: [
      {
        id: { uuid: 'image-1' },
        type: 'image',
        attributes: {
          variants: {
            'square-small': { url: 'https://example.com/image-small.jpg', width: 240, height: 240 },
          },
        },
      },
    ],
  }
);

// Listing with INR equivalent price in publicData
const listingWithINR = createListing(
  'listing2',
  { publicData: { priceInINR: 2499 } },
  { author: createUser('user1') }
);

// Listing with INR zero (falsy — should not show INR line)
const listingWithZeroINR = createListing(
  'listing3',
  { publicData: { priceInINR: 0 } },
  { author: createUser('user1') }
);

describe('ListingCardMini', () => {
  it('renders without crashing', () => {
    const { container } = render(<ListingCardMini listing={listing} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders the USD price', () => {
    const { container } = render(<ListingCardMini listing={listing} />);
    // Price wrapper should be present (listing has default Money(5500, 'USD'))
    const priceWrapper = container.querySelector('[class*="priceWrapper"]');
    expect(priceWrapper).toBeInTheDocument();
  });

  it('links to the listing page', () => {
    const { container } = render(<ListingCardMini listing={listing} />);
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toContain('listing1');
  });

  it('shows the save button by default', () => {
    const { container } = render(<ListingCardMini listing={listing} />);
    const saveBtn = container.querySelector('[class*="saveButton"]');
    expect(saveBtn).toBeInTheDocument();
  });

  it('hides the save button when showSave=false', () => {
    const { container } = render(<ListingCardMini listing={listing} showSave={false} />);
    const saveBtn = container.querySelector('[class*="saveButton"]');
    expect(saveBtn).not.toBeInTheDocument();
  });

  it('applies a custom className', () => {
    const { container } = render(
      <ListingCardMini listing={listing} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies the fit/crop class directly to the img element (not just its wrapper)', async () => {
    // Regression test: css.image must reach the <img> itself via rootClassName,
    // otherwise object-fit/object-position never apply and mismatched-aspect
    // photos show grey letterbox padding instead of a centered, cropped fill.
    // ListingImage's lazy path only renders once its wrapper reports a nonzero
    // clientWidth/clientHeight (see util/uiHelpers.js) — jsdom has no layout
    // engine, so stub those like ListingImage.test.js does.
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 240,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 240,
    });

    try {
      const { container } = render(<ListingCardMini listing={listingWithImage} />);
      const img = await waitFor(() => {
        const el = container.querySelector('img');
        expect(el).toBeInTheDocument();
        return el;
      });
      expect(img).toHaveClass('image');
    } finally {
      delete HTMLElement.prototype.clientWidth;
      delete HTMLElement.prototype.clientHeight;
    }
  });

  it('renders without price gracefully', () => {
    const noPrice = createListing(
      'listing4',
      { price: null },
      { author: createUser('user1') }
    );
    const { container } = render(<ListingCardMini listing={noPrice} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  describe('INR equivalent price', () => {
    it('shows INR price line when priceInINR is in publicData', () => {
      const { getByText } = render(<ListingCardMini listing={listingWithINR} />);
      // The INR span renders ~{formattedINRPrice} inline (no FormattedMessage)
      expect(getByText(/~/)).toBeInTheDocument();
    });

    it('INR price line contains the formatted amount', () => {
      const { getByText } = render(<ListingCardMini listing={listingWithINR} />);
      // 2499 formatted — digits should appear regardless of currency symbol
      expect(getByText(/~/).textContent).toMatch(/2[,.]?499/);
    });

    it('does not show INR price line when priceInINR is absent', () => {
      const { queryByText } = render(<ListingCardMini listing={listing} />);
      expect(queryByText(/~/)).not.toBeInTheDocument();
    });

    it('does not show INR price line when priceInINR is zero', () => {
      const { queryByText } = render(<ListingCardMini listing={listingWithZeroINR} />);
      expect(queryByText(/~/)).not.toBeInTheDocument();
    });

    it('does not show INR price line when publicData is empty', () => {
      const noPublicData = createListing(
        'listing5',
        { publicData: {} },
        { author: createUser('user1') }
      );
      const { queryByText } = render(<ListingCardMini listing={noPublicData} />);
      expect(queryByText(/~/)).not.toBeInTheDocument();
    });
  });
});
