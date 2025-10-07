import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import PartnershipPhilosophy from './PartnershipPhilosophy';

// Mock the components
jest.mock('../../../../components', () => ({
  H2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  H3: ({ children, ...props }) => <h3 {...props}>{children}</h3>
}));

describe('PartnershipPhilosophy', () => {
  it('renders the main title and subtitle', () => {
    render(<PartnershipPhilosophy />);

    expect(screen.getByText('We\'re Not Just a Marketplace. We\'re Your Export Partners.')).toBeInTheDocument();
    expect(screen.getByText('See the difference between traditional marketplace relationships and true partnership')).toBeInTheDocument();
  });

  it('renders comparison section', () => {
    render(<PartnershipPhilosophy />);

    expect(screen.getByText('Traditional Marketplace vs. Mela Partnership')).toBeInTheDocument();
  });

  it('renders all comparison cards', () => {
    render(<PartnershipPhilosophy />);

    expect(screen.getByText('Brands are vendors')).toBeInTheDocument();
    expect(screen.getByText('Brands are equal partners')).toBeInTheDocument();
    expect(screen.getByText('Platform dictates terms')).toBeInTheDocument();
    expect(screen.getByText('We build strategy together')).toBeInTheDocument();
  });

  it('expands comparison details when clicked', () => {
    render(<PartnershipPhilosophy />);

    const firstComparisonButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstComparisonButton);

    expect(screen.getByText('We see you as a strategic partner, not just another supplier. Your success is our success.')).toBeInTheDocument();
  });

  it('collapses comparison details when clicked again', () => {
    render(<PartnershipPhilosophy />);

    const firstComparisonButton = screen.getAllByRole('button')[0];

    // First click to expand
    fireEvent.click(firstComparisonButton);
    expect(screen.getByText('We see you as a strategic partner, not just another supplier. Your success is our success.')).toBeInTheDocument();

    // Second click to collapse
    fireEvent.click(firstComparisonButton);
    expect(screen.queryByText('We see you as a strategic partner, not just another supplier. Your success is our success.')).not.toBeInTheDocument();
  });

  it('renders commitment section', () => {
    render(<PartnershipPhilosophy />);

    expect(screen.getByText('🤝 OUR COMMITMENT TO YOU')).toBeInTheDocument();
    expect(screen.getByText('See Our Commitments')).toBeInTheDocument();
  });

  it('shows commitments when toggle button is clicked', () => {
    render(<PartnershipPhilosophy />);

    const toggleButton = screen.getByText('See Our Commitments');
    fireEvent.click(toggleButton);

    expect(screen.getByText('Your voice shapes platform decisions')).toBeInTheDocument();
    expect(screen.getByText('Transparent communication and data')).toBeInTheDocument();
    expect(screen.getByText('We invest in your success (marketing)')).toBeInTheDocument();
    expect(screen.getByText('Performance-based - no fees unless you make sales')).toBeInTheDocument();
  });

  it('hides commitments when toggle button is clicked again', () => {
    render(<PartnershipPhilosophy />);

    const toggleButton = screen.getByText('See Our Commitments');

    // First click to show
    fireEvent.click(toggleButton);
    expect(screen.getByText('Your voice shapes platform decisions')).toBeInTheDocument();

    // Second click to hide
    const hideButton = screen.getByText('Hide Details');
    fireEvent.click(hideButton);
    expect(screen.queryByText('Your voice shapes platform decisions')).not.toBeInTheDocument();
  });

  it('renders trust section', () => {
    render(<PartnershipPhilosophy />);

    expect(screen.getByText('Partnership Guarantee')).toBeInTheDocument();
    expect(screen.getByText('We succeed only when you succeed')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<PartnershipPhilosophy />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('We\'re Not Just a Marketplace');

    const subHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(subHeadings.length).toBeGreaterThan(0);

    // Check for button accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-expanded');
    });
  });

  it('updates aria-expanded when comparison is opened', () => {
    render(<PartnershipPhilosophy />);

    const firstComparisonButton = screen.getAllByRole('button')[0];

    // Initially collapsed
    expect(firstComparisonButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(firstComparisonButton);
    expect(firstComparisonButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('updates aria-expanded when commitments toggle is opened', () => {
    render(<PartnershipPhilosophy />);

    const toggleButton = screen.getByText('See Our Commitments');

    // Initially collapsed
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('handles keyboard navigation', () => {
    render(<PartnershipPhilosophy />);

    const firstComparisonButton = screen.getAllByRole('button')[0];

    // Focus the button and press Enter
    firstComparisonButton.focus();
    fireEvent.keyDown(firstComparisonButton, { key: 'Enter' });

    expect(screen.getByText('We see you as a strategic partner, not just another supplier. Your success is our success.')).toBeInTheDocument();
  });
});