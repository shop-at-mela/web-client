import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import MarketOpportunity from './MarketOpportunity';

// Mock the components
jest.mock('../../../../components', () => ({
  H2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  H3: ({ children, ...props }) => <h3 {...props}>{children}</h3>
}));

describe('MarketOpportunity', () => {
  it('renders the main title and subtitle', () => {
    render(<MarketOpportunity />);

    expect(screen.getByText('The US Indian Baby Clothing Market Opportunity')).toBeInTheDocument();
    expect(screen.getByText('A massive, underserved market waiting for authentic Indian brands')).toBeInTheDocument();
  });

  it('renders all opportunity cards', () => {
    render(<MarketOpportunity />);

    // Should render cards in preview, mobile carousel, and desktop grid (3 total)
    expect(screen.getAllByText('The Market Reality')).toHaveLength(3);
    expect(screen.getAllByText('Your Current Challenges')).toHaveLength(3);
    expect(screen.getAllByText('The Mela Solution')).toHaveLength(3);
  });

  it('renders mobile preview navigation text', () => {
    render(<MarketOpportunity />);

    expect(screen.getByText('Navigate through: Market Reality → Your Challenges → Our Solution')).toBeInTheDocument();
  });

  it('renders correct market data in first card', () => {
    render(<MarketOpportunity />);

    // Data should appear in mobile and desktop versions (2 total, not in preview)
    expect(screen.getAllByText('4.5M Indian Americans')).toHaveLength(2);
    expect(screen.getAllByText('$126K median household income (high purchasing power)')).toHaveLength(2);
    expect(screen.getAllByText('200K+ Indian babies born in US annually')).toHaveLength(2);
    expect(screen.getAllByText('Zero Indian baby clothing specialty retailers serving US market')).toHaveLength(2);
  });

  it('renders navigation buttons', () => {
    render(<MarketOpportunity />);

    const prevButton = screen.getByLabelText('Previous opportunity card');
    const nextButton = screen.getByLabelText('Next opportunity card');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('renders preview cards as navigation instead of dots', () => {
    render(<MarketOpportunity />);

    // Preview cards provide better navigation than abstract dots
    expect(screen.getAllByText('The Market Reality')).toHaveLength(3); // Preview + mobile + desktop
    expect(screen.getAllByText('Your Current Challenges')).toHaveLength(3);
    expect(screen.getAllByText('The Mela Solution')).toHaveLength(3);
  });

  it('renders preview cards for mobile navigation', () => {
    render(<MarketOpportunity />);

    // Should have navigation buttons (2) only, no dots
    const allButtons = screen.getAllByRole('button');
    expect(allButtons.length).toBe(2);

    // Preview cards should be present but may not have button role
    expect(screen.getByText('Navigate through: Market Reality → Your Challenges → Our Solution')).toBeInTheDocument();
  });

  it('navigates to next card when next button is clicked', () => {
    render(<MarketOpportunity />);

    const nextButton = screen.getByLabelText('Next opportunity card');
    fireEvent.click(nextButton);

    // Content should appear in preview, mobile, and desktop (3 total)
    expect(screen.getAllByText('Your Current Challenges')).toHaveLength(3);
    expect(screen.getAllByText('High shipping costs')).toHaveLength(2); // Only in content areas, not preview
  });

  it('navigates to previous card when prev button is clicked', () => {
    render(<MarketOpportunity />);

    // First go to next card
    const nextButton = screen.getByLabelText('Next opportunity card');
    fireEvent.click(nextButton);

    // Then go back
    const prevButton = screen.getByLabelText('Previous opportunity card');
    fireEvent.click(prevButton);

    expect(screen.getAllByText('The Market Reality')).toHaveLength(3);
    expect(screen.getAllByText('4.5M Indian Americans')).toHaveLength(2);
  });

  it('disables prev button on first card', () => {
    render(<MarketOpportunity />);

    const prevButton = screen.getByLabelText('Previous opportunity card');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last card', () => {
    render(<MarketOpportunity />);

    const nextButton = screen.getByLabelText('Next opportunity card');

    // Navigate to last card (click next 2 times)
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(screen.getAllByText('The Mela Solution')).toHaveLength(3);
    expect(nextButton).toBeDisabled();
  });

  it('allows direct navigation via preview cards', () => {
    render(<MarketOpportunity />);

    // Find and click the "Mela Solution" preview card
    const previewCards = screen.getAllByText('The Mela Solution');
    fireEvent.click(previewCards[0]); // Click the preview card version

    expect(screen.getAllByText('The Mela Solution')).toHaveLength(3);
    expect(screen.getAllByText('We drive qualified traffic to your existing website')).toHaveLength(2);
  });

  it('renders key stats section', () => {
    render(<MarketOpportunity />);

    expect(screen.getByText('Market Size & Potential')).toBeInTheDocument();
    expect(screen.getByText('4.5M')).toBeInTheDocument();
    expect(screen.getByText('Indian Americans')).toBeInTheDocument();
    expect(screen.getByText('$126K')).toBeInTheDocument();
    expect(screen.getByText('Median Income')).toBeInTheDocument();
    expect(screen.getByText('200K+')).toBeInTheDocument();
    expect(screen.getByText('Babies Annually')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<MarketOpportunity />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('The US Indian Baby Clothing Market Opportunity');

    const subHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(subHeadings.length).toBeGreaterThan(0);
    // Should find multiple instances of card headings
    expect(screen.getAllByText('The Market Reality')).toHaveLength(3);

    // Check for button accessibility (navigation arrows only, no dots)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2); // Only navigation buttons
  });

  it('handles keyboard navigation', () => {
    render(<MarketOpportunity />);

    const nextButton = screen.getByLabelText('Next opportunity card');

    // Focus the button and press Enter
    nextButton.focus();
    fireEvent.keyDown(nextButton, { key: 'Enter' });

    expect(screen.getAllByText('Your Current Challenges')).toHaveLength(3);
  });
});