import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import Process from './Process';

// Mock the components
jest.mock('../../../../components', () => ({
  H2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  H3: ({ children, ...props }) => <h3 {...props}>{children}</h3>
}));

describe('Process', () => {
  it('renders the main title and subtitle', () => {
    render(<Process />);

    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('From application to global sales in 4 simple steps')).toBeInTheDocument();
  });

  it('renders all process steps', () => {
    render(<Process />);

    // Use getAllByText since titles appear in both mobile and desktop versions
    expect(screen.getAllByText('Apply & Get Approved')).toHaveLength(2); // Mobile + Desktop
    expect(screen.getAllByText('Setup Your Store')).toHaveLength(2);
    expect(screen.getAllByText('Start Selling')).toHaveLength(2);
    expect(screen.getAllByText('Grow Together')).toHaveLength(2);
  });

  it('renders step short descriptions', () => {
    render(<Process />);

    expect(screen.getByText('Submit your brand application')).toBeInTheDocument();
    expect(screen.getByText('We help you get online quickly')).toBeInTheDocument();
    expect(screen.getByText('We drive customers to you')).toBeInTheDocument();
    expect(screen.getByText('Scale with our support')).toBeInTheDocument();
  });

  it('renders step numbers and icons', () => {
    render(<Process />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('🏪')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('renders expand/collapse icons', () => {
    render(<Process />);

    const expandIcons = screen.getAllByText('+');
    expect(expandIcons).toHaveLength(4); // One for each step
  });

  it('expands step details when clicked', () => {
    render(<Process />);

    // Find specifically the mobile step button (first one)
    const mobileStepButtons = screen.getAllByText('Apply & Get Approved');
    const firstMobileStepButton = mobileStepButtons[0].closest('button');

    fireEvent.click(firstMobileStepButton);

    // Should show full description and details
    expect(screen.getByText(/Complete our simple application form/)).toBeInTheDocument();
    expect(screen.getAllByText('Brand & product information')).toHaveLength(2); // Mobile + Desktop
    expect(screen.getAllByText('Quality standards verification')).toHaveLength(2);
    expect(screen.getAllByText('Business documentation review')).toHaveLength(2);
    expect(screen.getAllByText('48-hour approval process')).toHaveLength(2);

    // Should show collapse icon
    expect(screen.getByText('−')).toBeInTheDocument();
  });

  it('collapses step details when clicked again', () => {
    render(<Process />);

    const mobileStepButtons = screen.getAllByText('Apply & Get Approved');
    const firstMobileStepButton = mobileStepButtons[0].closest('button');

    // First click to expand
    fireEvent.click(firstMobileStepButton);
    expect(screen.getByText(/Complete our simple application form/)).toBeInTheDocument();

    // Second click to collapse
    fireEvent.click(firstMobileStepButton);
    expect(screen.queryByText(/Complete our simple application form/)).not.toBeInTheDocument();
  });

  it('only allows one step to be expanded at a time', () => {
    render(<Process />);

    const stepButtons = screen.getAllByText('Apply & Get Approved');
    const firstStepButton = stepButtons[0].closest('button');
    const secondStepButtons = screen.getAllByText('Setup Your Store');
    const secondStepButton = secondStepButtons[0].closest('button');

    // Expand first step
    fireEvent.click(firstStepButton);
    expect(screen.getByText(/Complete our simple application form/)).toBeInTheDocument();

    // Expand second step
    fireEvent.click(secondStepButton);
    expect(screen.getByText(/Our team works with you to create/)).toBeInTheDocument();

    // First step should be collapsed
    expect(screen.queryByText(/Complete our simple application form/)).not.toBeInTheDocument();
  });

  it('renders trust section', () => {
    render(<Process />);

    expect(screen.getByText('Zero Risk Start')).toBeInTheDocument();
    expect(screen.getByText('No setup fees • No monthly costs • Performance-based only')).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<Process />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('How It Works');

    // Check for button accessibility
    const stepButtons = screen.getAllByRole('button');
    expect(stepButtons).toHaveLength(4); // One for each step

    stepButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('updates aria-expanded when step is opened', () => {
    render(<Process />);

    const stepButtons = screen.getAllByText('Apply & Get Approved');
    const firstStepButton = stepButtons[0].closest('button');

    // Initially collapsed
    expect(firstStepButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(firstStepButton);
    expect(firstStepButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('handles keyboard navigation', () => {
    render(<Process />);

    const stepButtons = screen.getAllByText('Apply & Get Approved');
    const firstStepButton = stepButtons[0].closest('button');

    // Focus the button and press Enter
    firstStepButton.focus();
    fireEvent.keyDown(firstStepButton, { key: 'Enter' });

    expect(screen.getByText(/Complete our simple application form/)).toBeInTheDocument();
  });

  it('renders all step details correctly', () => {
    render(<Process />);

    const steps = [
      {
        title: 'Apply & Get Approved',
        details: ['Brand & product information', 'Quality standards verification', 'Business documentation review', '48-hour approval process']
      },
      {
        title: 'Setup Your Store',
        details: ['Brand profile creation', 'Product catalog upload', 'US market optimization', 'Quality photography guidance']
      },
      {
        title: 'Start Selling',
        details: ['Targeted marketing campaigns', 'Diaspora family outreach', 'Customer acquisition', 'Performance tracking']
      },
      {
        title: 'Grow Together',
        details: ['Global market expansion', 'Performance optimization', 'Scaling support', 'Long-term partnership']
      }
    ];

    steps.forEach(step => {
      const stepButtons = screen.getAllByText(step.title);
      const stepButton = stepButtons[0].closest('button');
      fireEvent.click(stepButton);

      step.details.forEach(detail => {
        expect(screen.getAllByText(detail)).toHaveLength(2); // Mobile + Desktop
      });

      // Close the step
      fireEvent.click(stepButton);
    });
  });
});