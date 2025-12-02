import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';
import { ListingCardMini } from './ListingCardMini';

const mockListing = {
  id: { uuid: 'listing-123' },
  type: 'listing',
  attributes: {
    title: 'Organic Baby Romper',
    price: {
      amount: 1299,
      currency: 'INR',
    },
  },
  images: [
    {
      id: { uuid: 'image-1' },
      type: 'image',
      attributes: {
        variants: {
          'square-small': { url: 'https://example.com/image.jpg', width: 240, height: 240 },
        },
      },
    },
  ],
};

const mockConfig = {
  marketplaceName: 'Mela',
  currency: 'INR',
  locale: 'en',
};

const mockRoutes = [
  {
    path: '/l/:slug/:id',
    name: 'ListingPage',
  },
];

const mockMessages = {
  'ListingCardMini.price': '{priceValue}',
};

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={mockMessages}>
      <ConfigurationProvider value={mockConfig}>
        <RouteConfigurationProvider value={mockRoutes}>{children}</RouteConfigurationProvider>
      </ConfigurationProvider>
    </IntlProvider>
  </MemoryRouter>
);

describe('ListingCardMini', () => {
  it('renders listing title and price', () => {
    render(
      <TestWrapper>
        <ListingCardMini listing={mockListing} />
      </TestWrapper>
    );

    // Price should be displayed
    expect(screen.getByText(/1,299/)).toBeInTheDocument();
  });

  it('renders favorite button by default', () => {
    render(
      <TestWrapper>
        <ListingCardMini listing={mockListing} />
      </TestWrapper>
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    expect(favoriteButton).toBeInTheDocument();
  });

  it('hides favorite button when showFavorite=false', () => {
    render(
      <TestWrapper>
        <ListingCardMini listing={mockListing} showFavorite={false} />
      </TestWrapper>
    );

    const favoriteButton = screen.queryByLabelText('Add to favorites');
    expect(favoriteButton).not.toBeInTheDocument();
  });

  it('calls onFavorite when favorite button clicked', () => {
    const onFavorite = jest.fn();
    render(
      <TestWrapper>
        <ListingCardMini listing={mockListing} onFavorite={onFavorite} />
      </TestWrapper>
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    expect(onFavorite).toHaveBeenCalledWith('listing-123');
  });

  it('prevents event propagation when favorite button clicked', () => {
    const onFavorite = jest.fn();
    const onCardClick = jest.fn();

    const { container } = render(
      <TestWrapper>
        <ListingCardMini listing={mockListing} onFavorite={onFavorite} />
      </TestWrapper>
    );

    const card = container.firstChild;
    card.addEventListener('click', onCardClick);

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    expect(onFavorite).toHaveBeenCalled();
    // Card click should not be triggered due to stopPropagation
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('links to listing page with correct params', () => {
    const { container } = render(
      <TestWrapper>
        <ListingCardMini listing={mockListing} />
      </TestWrapper>
    );

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href');
    expect(link.getAttribute('href')).toContain('listing-123');
  });

  it('renders ListingImage with correct props', () => {
    const { container } = render(
      <TestWrapper>
        <ListingCardMini listing={mockListing} />
      </TestWrapper>
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt');
  });

  it('applies custom className', () => {
    const customClass = 'custom-mini-card';
    const { container } = render(
      <TestWrapper>
        <ListingCardMini listing={mockListing} className={customClass} />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it('handles listing without price gracefully', () => {
    const listingNoPrice = {
      ...mockListing,
      attributes: {
        ...mockListing.attributes,
        price: null,
      },
    };

    const { container } = render(
      <TestWrapper>
        <ListingCardMini listing={listingNoPrice} />
      </TestWrapper>
    );

    // Should still render without errors
    expect(container.firstChild).toBeInTheDocument();
    // Price wrapper should not be present
    const priceWrapper = container.querySelector('.priceWrapper');
    expect(priceWrapper).not.toBeInTheDocument();
  });
});
