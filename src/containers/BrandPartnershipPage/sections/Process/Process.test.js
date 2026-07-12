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

    // Numbers/icons appear in both mobile and desktop copies
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();
    expect(screen.getAllByText('3')[0]).toBeInTheDocument();
    expect(screen.getAllByText('4')[0]).toBeInTheDocument();

    expect(screen.getAllByText('📝')[0]).toBeInTheDocument();
    expect(screen.getAllByText('🏪')[0]).toBeInTheDocument();
    expect(screen.getAllByText('🚀')[0]).toBeInTheDocument();
    expect(screen.getAllByText('📈')[0]).toBeInTheDocument();
  });

  it('renders expand/collapse icons, with the first step expanded by default', () => {
    render(<Process />);

    const expandIcons = screen.getAllByText('+');
    expect(expandIcons).toHaveLength(3); // Steps 2-4 collapsed

    const collapseIcons = screen.getAllByText('−');
    expect(collapseIcons).toHaveLength(1); // Step 1 expanded by default
  });

  it('expands step details when clicked', () => {
    render(<Process />);

    // Step 1 is expanded by default, so click step 2 to exercise expand behavior
    const mobileStepButtons = screen.getAllByText('Setup Your Store');
    const secondMobileStepButton = mobileStepButtons[0].closest('button');

    fireEvent.click(secondMobileStepButton);

    // Should show full description and details. fullDesc also renders unconditionally
    // in the desktop flow, so expanded state means 2 matches (mobile detail + desktop).
    expect(screen.getAllByText(/Our team works with you to create/)).toHaveLength(2);
    expect(screen.getAllByText('Brand profile creation')).toHaveLength(2); // Mobile + Desktop
    expect(screen.getAllByText('Product catalog upload')).toHaveLength(2);
    expect(screen.getAllByText('US market optimization')).toHaveLength(2);
    expect(screen.getAllByText('Quality photography guidance')).toHaveLength(2);

    // Should show collapse icon
    expect(screen.getByText('−')).toBeInTheDocument();
  });

  it('collapses step details when clicked again', () => {
    render(<Process />);

    const mobileStepButtons = screen.getAllByText('Setup Your Store');
    const secondMobileStepButton = mobileStepButtons[0].closest('button');

    // First click to expand (mobile detail + desktop = 2 matches)
    fireEvent.click(secondMobileStepButton);
    expect(screen.getAllByText(/Our team works with you to create/)).toHaveLength(2);

    // Second click to collapse (desktop copy still renders unconditionally)
    fireEvent.click(secondMobileStepButton);
    expect(screen.getAllByText(/Our team works with you to create/)).toHaveLength(1);
  });

  it('only allows one step to be expanded at a time', () => {
    render(<Process />);

    // Step 1 is expanded by default (mobile detail + desktop = 2 matches)
    expect(screen.getAllByText(/Complete our simple application form/)).toHaveLength(2);

    const secondStepButtons = screen.getAllByText('Setup Your Store');
    const secondStepButton = secondStepButtons[0].closest('button');

    // Expand second step
    fireEvent.click(secondStepButton);
    expect(screen.getAllByText(/Our team works with you to create/)).toHaveLength(2);

    // First step should be collapsed (desktop copy still renders unconditionally)
    expect(screen.getAllByText(/Complete our simple application form/)).toHaveLength(1);
  });

  it('has proper accessibility structure', () => {
    render(<Process />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('How It Works');

    // Check for button accessibility
    const stepButtons = screen.getAllByRole('button');
    expect(stepButtons).toHaveLength(4); // One for each step

    // First step is expanded by default; the rest start collapsed
    expect(stepButtons[0]).toHaveAttribute('aria-expanded', 'true');
    stepButtons.slice(1).forEach(button => {
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('updates aria-expanded when step is opened', () => {
    render(<Process />);

    // Step 1 is expanded by default, so use step 2 to exercise the collapsed → expanded transition
    const stepButtons = screen.getAllByText('Setup Your Store');
    const secondStepButton = stepButtons[0].closest('button');

    // Initially collapsed
    expect(secondStepButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(secondStepButton);
    expect(secondStepButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('handles keyboard navigation', () => {
    render(<Process />);

    const stepButtons = screen.getAllByText('Setup Your Store');
    const secondStepButton = stepButtons[0].closest('button');

    // Focus the button and press Enter. jsdom doesn't synthesize a native button's
    // Enter-triggers-click behavior from keyDown alone, so fire the click explicitly.
    secondStepButton.focus();
    fireEvent.keyDown(secondStepButton, { key: 'Enter' });
    fireEvent.click(secondStepButton);

    expect(screen.getAllByText(/Our team works with you to create/)).toHaveLength(2);
  });

  it('renders all step details correctly', () => {
    render(<Process />);

    // Close the default-expanded first step so every step below starts collapsed
    const firstStepButton = screen.getAllByText('Apply & Get Approved')[0].closest('button');
    fireEvent.click(firstStepButton);

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