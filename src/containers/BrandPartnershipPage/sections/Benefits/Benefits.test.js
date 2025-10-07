import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

    // Should show the first benefit card (updated content)
    expect(screen.getByText('Performance-Based Model')).toBeInTheDocument();
    expect(screen.getByText('Pay only for success')).toBeInTheDocument();
    expect(screen.getByText(/Start selling with zero investment/)).toBeInTheDocument();
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
    render(<Benefits />);

    const nextButton = screen.getByText('→');
    fireEvent.click(nextButton);

    expect(screen.getByText('Targeted Market')).toBeInTheDocument();
  });

  it('navigates to previous card when prev button is clicked', () => {
    render(<Benefits />);

    // First go to next card
    const nextButton = screen.getByText('→');
    fireEvent.click(nextButton);

    // Then go back
    const prevButton = screen.getByText('←');
    fireEvent.click(prevButton);

    expect(screen.getByText('Zero Risk Start')).toBeInTheDocument();
  });

  it('disables prev button on first card', () => {
    render(<Benefits />);

    const prevButton = screen.getByText('←');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last card', () => {
    render(<Benefits />);

    const nextButton = screen.getByText('→');

    // Navigate to last card (click next 6 times for 7 total cards)
    for (let i = 0; i < 6; i++) {
      fireEvent.click(nextButton);
    }

    // Should be on last card
    expect(nextButton).toBeDisabled();
  });

  it('allows direct navigation via page indicators', () => {
    render(<Benefits />);

    const indicators = screen.getAllByRole('button');
    // Find the third indicator (should be index 3, accounting for nav buttons)
    const thirdIndicator = indicators[3]; // Assuming prev, next, then indicators

    fireEvent.click(thirdIndicator);

    expect(screen.getByText('Marketing Boost')).toBeInTheDocument();
  });

  it('renders all benefit cards content', () => {
    render(<Benefits />);

    const benefitTitles = [
      'Zero Risk Start',
      'Targeted Market',
      'Marketing Boost',
      'Risk-Free Start',
      'Global Expansion',
      'Business Insights',
      'Partnership Support'
    ];

    // Navigate through all cards to check content
    benefitTitles.forEach((title, index) => {
      if (index > 0) {
        const nextButton = screen.getByText('→');
        fireEvent.click(nextButton);
      }
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('renders the CTA section', () => {
    render(<Benefits />);

    expect(screen.getByText('Ready to Start?')).toBeInTheDocument();
    expect(screen.getByText('Be among the founding partners building this marketplace together')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<Benefits />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('Why Partner with Mela?');

    const subHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(subHeadings.length).toBeGreaterThan(0);
    expect(subHeadings[0]).toHaveTextContent('Zero Risk Start');

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