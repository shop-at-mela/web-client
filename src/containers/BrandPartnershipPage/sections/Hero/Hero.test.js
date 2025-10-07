import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Hero from './Hero';

// Mock the components
jest.mock('../../../../components', () => ({
  H1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  H3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
  Button: ({ children, onClick, ...props }) => <button onClick={onClick} {...props}>{children}</button>
}));

const mockOnFormClick = jest.fn();

const defaultProps = {
  onFormClick: mockOnFormClick,
  clothingFormUrl: 'https://test-clothing-form.com',
  waitlistFormUrl: 'https://test-waitlist-form.com'
};

describe('Hero', () => {
  beforeEach(() => {
    mockOnFormClick.mockClear();
  });

  it('renders the main hero content', () => {
    render(<Hero {...defaultProps} />);

    expect(screen.getByText('🚀 Founding Partners Program')).toBeInTheDocument();
    expect(screen.getByText('Sell Your Indian Baby Products in the USA')).toBeInTheDocument();
    expect(screen.getByText(/Join Mela's founding partnership program/)).toBeInTheDocument();
  });

  it('renders value propositions', () => {
    render(<Hero {...defaultProps} />);

    expect(screen.getByText('Zero listing fees')).toBeInTheDocument();
    expect(screen.getByText('Ready US customers')).toBeInTheDocument();
    expect(screen.getByText('Performance-based')).toBeInTheDocument();
  });

  it('renders market indicators', () => {
    render(<Hero {...defaultProps} />);

    expect(screen.getByText('4.5M')).toBeInTheDocument();
    expect(screen.getByText('Indian Americans')).toBeInTheDocument();
    expect(screen.getByText('$126K')).toBeInTheDocument();
    expect(screen.getByText('Median income')).toBeInTheDocument();
    expect(screen.getByText('200K+')).toBeInTheDocument();
    expect(screen.getByText('Babies annually')).toBeInTheDocument();
  });


  it('shows baby clothing CTA by default', () => {
    render(<Hero {...defaultProps} />);

    expect(screen.getByText('Apply for Baby Clothing')).toBeInTheDocument();
    expect(screen.getByText('Other categories →')).toBeInTheDocument();
    expect(screen.queryByText('Join Waitlist (Other Categories)')).not.toBeInTheDocument();
  });

  it('handles baby clothing form click', () => {
    render(<Hero {...defaultProps} />);

    const clothingButton = screen.getByText('Apply for Baby Clothing');
    fireEvent.click(clothingButton);

    expect(mockOnFormClick).toHaveBeenCalledWith(
      'https://test-clothing-form.com',
      'clothing_application'
    );
  });

  it('toggles to waitlist view when other categories is clicked', () => {
    render(<Hero {...defaultProps} />);

    const otherCategoriesButton = screen.getByText('Other categories →');
    fireEvent.click(otherCategoriesButton);

    expect(screen.getByText('Join Waitlist (Other Categories)')).toBeInTheDocument();
    expect(screen.getByText('← Back to baby clothing')).toBeInTheDocument();
    expect(screen.queryByText('Apply for Baby Clothing')).not.toBeInTheDocument();
  });

  it('handles waitlist form click', () => {
    render(<Hero {...defaultProps} />);

    // First toggle to waitlist view
    const otherCategoriesButton = screen.getByText('Other categories →');
    fireEvent.click(otherCategoriesButton);

    // Then click the waitlist button
    const waitlistButton = screen.getByText('Join Waitlist (Other Categories)');
    fireEvent.click(waitlistButton);

    expect(mockOnFormClick).toHaveBeenCalledWith(
      'https://test-waitlist-form.com',
      'waitlist_application'
    );
  });

  it('toggles back to baby clothing view when back button is clicked', () => {
    render(<Hero {...defaultProps} />);

    // First toggle to waitlist view
    const otherCategoriesButton = screen.getByText('Other categories →');
    fireEvent.click(otherCategoriesButton);

    // Then click back
    const backButton = screen.getByText('← Back to baby clothing');
    fireEvent.click(backButton);

    expect(screen.getByText('Apply for Baby Clothing')).toBeInTheDocument();
    expect(screen.getByText('Other categories →')).toBeInTheDocument();
    expect(screen.queryByText('Join Waitlist (Other Categories)')).not.toBeInTheDocument();
  });

  it('handles missing onFormClick prop gracefully', () => {
    const propsWithoutCallback = {
      clothingFormUrl: 'https://test-clothing-form.com',
      waitlistFormUrl: 'https://test-waitlist-form.com'
    };

    render(<Hero {...propsWithoutCallback} />);

    const clothingButton = screen.getByText('Apply for Baby Clothing');

    // Should not throw error
    expect(() => {
      fireEvent.click(clothingButton);
    }).not.toThrow();
  });

  it('has proper accessibility structure', () => {
    render(<Hero {...defaultProps} />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Sell Your Indian Baby Products in the USA');

    // Check for button roles
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});