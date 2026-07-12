import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import MarketTiming from './MarketTiming';

// Mock the components
jest.mock('../../../../components', () => ({
  H2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  H3: ({ children, ...props }) => <h3 {...props}>{children}</h3>
}));

describe('MarketTiming', () => {
  it('renders the main title and subtitle', () => {
    render(<MarketTiming />);

    expect(screen.getByText('Why Now? Turning Uncertainty Into Your Competitive Advantage')).toBeInTheDocument();
    expect(screen.getByText(/While others wait for "perfect" conditions/)).toBeInTheDocument();
  });

  it('renders strategic advantages section', () => {
    render(<MarketTiming />);

    expect(screen.getByText('Strategic Advantages of Starting Now')).toBeInTheDocument();
    expect(screen.getAllByText('First-Mover Advantage')[0]).toBeInTheDocument();
  });

  it('renders navigation buttons for advantages', () => {
    render(<MarketTiming />);

    const prevButton = screen.getByLabelText('Previous advantage');
    const nextButton = screen.getByLabelText('Next advantage');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('renders page indicators for advantages', () => {
    render(<MarketTiming />);

    const indicators = screen.getAllByLabelText(/Go to advantage \d+/);
    expect(indicators).toHaveLength(4); // Four advantage points
  });

  it('navigates to next advantage when next button is clicked', () => {
    const { container } = render(<MarketTiming />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const nextButton = within(mobileCarousel).getByLabelText('Next advantage');
    fireEvent.click(nextButton);

    expect(within(mobileCarousel).getByText('Warren Buffett Wisdom')).toBeInTheDocument();
    expect(within(mobileCarousel).getByText('Historical proof that uncertainty creates the best opportunities')).toBeInTheDocument();
  });

  it('navigates to previous advantage when prev button is clicked', () => {
    const { container } = render(<MarketTiming />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    // First go to next advantage
    const nextButton = within(mobileCarousel).getByLabelText('Next advantage');
    fireEvent.click(nextButton);

    // Then go back
    const prevButton = within(mobileCarousel).getByLabelText('Previous advantage');
    fireEvent.click(prevButton);

    expect(within(mobileCarousel).getByText('First-Mover Advantage')).toBeInTheDocument();
  });

  // All 4 advantage cards render simultaneously in the carousel track (position is
  // CSS transform-driven, not conditional), so text presence alone can't confirm which
  // card is current. The dot indicator's "active" class is the one place that does.
  const getActiveAdvantageIndex = mobileCarousel => {
    const dots = within(mobileCarousel).getAllByLabelText(/Go to advantage \d+/);
    return dots.findIndex(dot => dot.className.includes('active'));
  };

  it('wraps to the last advantage when prev is clicked on the first advantage', () => {
    const { container } = render(<MarketTiming />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const prevButton = within(mobileCarousel).getByLabelText('Previous advantage');
    expect(prevButton).not.toBeDisabled();

    fireEvent.click(prevButton);
    expect(getActiveAdvantageIndex(mobileCarousel)).toBe(3); // wraps from first to last of 4 cards
  });

  it('wraps to the first advantage when next is clicked on the last advantage', () => {
    const { container } = render(<MarketTiming />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const nextButton = within(mobileCarousel).getByLabelText('Next advantage');
    expect(nextButton).not.toBeDisabled();

    // Navigate to last advantage (click next 3 times for 4 total), then once more to wrap
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton);
    }

    expect(getActiveAdvantageIndex(mobileCarousel)).toBe(0);
  });

  it('allows direct navigation via page indicators', () => {
    const { container } = render(<MarketTiming />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const thirdIndicator = within(mobileCarousel).getByLabelText('Go to advantage 3');
    fireEvent.click(thirdIndicator);

    expect(within(mobileCarousel).getByText('Building Through Cycles')).toBeInTheDocument();
  });

  it('renders timeline section', () => {
    render(<MarketTiming />);

    expect(screen.getByText('Market Entry Timeline: The Window is Now')).toBeInTheDocument();
    expect(screen.getByText('NOW')).toBeInTheDocument();
    expect(screen.getByText('Opportunity Window')).toBeInTheDocument();
    expect(screen.getByText('⚡ OPTIMAL TIMING')).toBeInTheDocument();
  });

  it('renders global resilience section with updated timeline', () => {
    render(<MarketTiming />);

    expect(screen.getByText('Built for Global Resilience, Not Just US Markets')).toBeInTheDocument();
    expect(screen.getByText('🇺🇸 USA (NOW)')).toBeInTheDocument();
    expect(screen.getByText('🇪🇺 Europe (2026)')).toBeInTheDocument();
    expect(screen.getByText('🇦🇪 Middle East (2026)')).toBeInTheDocument();
    expect(screen.getByText('🇦🇺 Australia (2026)')).toBeInTheDocument();
  });

  it('renders Warren Buffett quote section', () => {
    render(<MarketTiming />);

    expect(screen.getByText('Be fearful when others are greedy, and greedy when others are fearful.')).toBeInTheDocument();
    expect(screen.getByText('— Warren Buffett')).toBeInTheDocument();
    expect(screen.getByText('Now is the time to be greedy for opportunity while others are fearful of uncertainty.')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<MarketTiming />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('Why Now?');

    const subHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(subHeadings.length).toBeGreaterThan(0);

    // Check for button accessibility
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('handles keyboard navigation', () => {
    const { container } = render(<MarketTiming />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const nextButton = within(mobileCarousel).getByLabelText('Next advantage');

    // Focus the button and simulate click (keyboard navigation typically triggers click)
    nextButton.focus();
    fireEvent.click(nextButton);

    // Should now be on the second advantage
    expect(within(mobileCarousel).getByText('Warren Buffett Wisdom')).toBeInTheDocument();
  });
});