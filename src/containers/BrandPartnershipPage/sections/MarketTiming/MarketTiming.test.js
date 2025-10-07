import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('First-Mover Advantage')).toBeInTheDocument();
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
    render(<MarketTiming />);

    const nextButton = screen.getByLabelText('Next advantage');
    fireEvent.click(nextButton);

    expect(screen.getByText('Warren Buffett Wisdom')).toBeInTheDocument();
    expect(screen.getByText('Historical proof that uncertainty creates the best opportunities')).toBeInTheDocument();
  });

  it('navigates to previous advantage when prev button is clicked', () => {
    render(<MarketTiming />);

    // First go to next advantage
    const nextButton = screen.getByLabelText('Next advantage');
    fireEvent.click(nextButton);

    // Then go back
    const prevButton = screen.getByLabelText('Previous advantage');
    fireEvent.click(prevButton);

    expect(screen.getByText('First-Mover Advantage')).toBeInTheDocument();
  });

  it('disables prev button on first advantage', () => {
    render(<MarketTiming />);

    const prevButton = screen.getByLabelText('Previous advantage');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last advantage', () => {
    render(<MarketTiming />);

    const nextButton = screen.getByLabelText('Next advantage');

    // Navigate to last advantage (click next 3 times)
    for (let i = 0; i < 3; i++) {
      fireEvent.click(nextButton);
    }

    expect(screen.getByText('Performance-Based Protection')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
  });

  it('allows direct navigation via page indicators', () => {
    render(<MarketTiming />);

    const thirdIndicator = screen.getByLabelText('Go to advantage 3');
    fireEvent.click(thirdIndicator);

    expect(screen.getByText('Building Through Cycles')).toBeInTheDocument();
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
    render(<MarketTiming />);

    const nextButton = screen.getByLabelText('Next advantage');

    // Focus the button and simulate click (keyboard navigation typically triggers click)
    nextButton.focus();
    fireEvent.click(nextButton);

    // Should now be on the second advantage
    expect(screen.getByText('Warren Buffett Wisdom')).toBeInTheDocument();
  });
});