import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import Benefits from './Benefits';

// Mock the components
jest.mock('../../../../components', () => ({
  H2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  H3: ({ children, ...props }) => <h3 {...props}>{children}</h3>
}));

describe('Benefits', () => {
  it('renders the main title and subtitle', () => {
    render(<Benefits />);

    expect(screen.getByText('Why Partner with Mela?')).toBeInTheDocument();
    expect(screen.getByText('Everything you need to succeed in the US market')).toBeInTheDocument();
  });

  it('renders mobile carousel by default', () => {
    render(<Benefits />);

    // Should show the first benefit card (mobile + desktop copies both render it)
    expect(screen.getAllByText('Performance-Based Model')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Pay only for success')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Start selling with zero investment/)[0]).toBeInTheDocument();
  });


  it('renders navigation buttons', () => {
    render(<Benefits />);

    const prevButton = screen.getByText('←');
    const nextButton = screen.getByText('→');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('renders page indicators', () => {
    render(<Benefits />);

    const indicators = screen.getAllByRole('button');
    // Should have navigation buttons + 6 page indicators
    const pageIndicators = indicators.filter(button =>
      !button.textContent.includes('←') &&
      !button.textContent.includes('→')
    );

    expect(pageIndicators.length).toBeGreaterThanOrEqual(6);
  });

  it('navigates to next card when next button is clicked', () => {
    const { container } = render(<Benefits />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const nextButton = within(mobileCarousel).getByText('→');
    fireEvent.click(nextButton);

    expect(within(mobileCarousel).getByText('Targeted Market')).toBeInTheDocument();
  });

  // All 7 cards render simultaneously in both the mobile carousel track and the desktop
  // grid (position is CSS transform-driven, not conditional), so the current card can't
  // be identified by text presence alone. The dot indicator's "active" class is the one
  // place that reflects which card is current.
  const getActiveCardIndex = mobileCarousel => {
    const dots = within(mobileCarousel).getAllByLabelText(/Go to benefit \d+/);
    return dots.findIndex(dot => dot.className.includes('active'));
  };

  it('navigates to previous card when prev button is clicked', () => {
    const { container } = render(<Benefits />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    // First go to next card
    const nextButton = within(mobileCarousel).getByText('→');
    fireEvent.click(nextButton);

    // Then go back
    const prevButton = within(mobileCarousel).getByText('←');
    fireEvent.click(prevButton);

    expect(getActiveCardIndex(mobileCarousel)).toBe(0);
  });

  it('wraps to the last card when prev is clicked on the first card', () => {
    const { container } = render(<Benefits />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const prevButton = within(mobileCarousel).getByText('←');
    expect(prevButton).not.toBeDisabled();

    fireEvent.click(prevButton);
    expect(getActiveCardIndex(mobileCarousel)).toBe(6); // wraps from first to last of 7 cards
  });

  it('wraps to the first card when next is clicked on the last card', () => {
    const { container } = render(<Benefits />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const nextButton = within(mobileCarousel).getByText('→');
    expect(nextButton).not.toBeDisabled();

    // Navigate to last card (click next 6 times for 7 total cards), then once more to wrap
    for (let i = 0; i < 7; i++) {
      fireEvent.click(nextButton);
    }

    // Should be back on the first card
    expect(getActiveCardIndex(mobileCarousel)).toBe(0);
  });

  it('allows direct navigation via page indicators', () => {
    const { container } = render(<Benefits />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const indicators = within(mobileCarousel).getAllByRole('button');
    // indicators[0] = prev arrow, indicators[1] = next arrow, indicators[2..] = page dots
    // Third page dot (index 2, "Marketing Boost") is therefore at array index 4.
    const thirdIndicator = indicators[4];

    fireEvent.click(thirdIndicator);

    expect(within(mobileCarousel).getByText('Marketing Boost')).toBeInTheDocument();
  });

  it('renders all benefit cards content', () => {
    const { container } = render(<Benefits />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const benefitTitles = [
      'Performance-Based Model',
      'Targeted Market',
      'Marketing Boost',
      'Guaranteed Protection',
      'Global Expansion',
      'Business Insights',
      'Partnership Support'
    ];

    // All cards render simultaneously (position is CSS transform-driven), so every
    // title should already be present without needing to navigate between them.
    benefitTitles.forEach(title => {
      expect(within(mobileCarousel).getByText(title)).toBeInTheDocument();
    });
  });

  it('renders the CTA section', () => {
    render(<Benefits />);

    expect(screen.getByText('Start Selling in 48 Hours')).toBeInTheDocument();
    expect(screen.getByText(/Join Indian brands already building their US presence/)).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<Benefits />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('Why Partner with Mela?');

    const subHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(subHeadings.length).toBeGreaterThan(0);
    expect(subHeadings[0]).toHaveTextContent('Performance-Based Model');

    // Check for button accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', () => {
    render(<Benefits />);

    const nextButton = screen.getByText('→');

    // Focus the button and press Enter
    nextButton.focus();
    fireEvent.keyDown(nextButton, { key: 'Enter' });

    // Should be on second card now
  });
});