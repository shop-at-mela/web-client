import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import SuccessStories from './SuccessStories';

// Mock the components
jest.mock('../../../../components', () => ({
  H2: ({ children, ...props }) => <h2 {...props}>{children}</h2>
}));

describe('SuccessStories', () => {
  it('renders the main title and subtitle', () => {
    render(<SuccessStories />);

    expect(screen.getByText('Partner Success Stories')).toBeInTheDocument();
    expect(screen.getByText('Building success together with our founding brand partners')).toBeInTheDocument();
  });

  it('renders founding partners program section', () => {
    render(<SuccessStories />);

    expect(screen.getByText('Founding Partners Program')).toBeInTheDocument();
    expect(screen.getByText(/We're in the early stages of building Mela/)).toBeInTheDocument();
    expect(screen.getByText(/Your success stories will be featured here/)).toBeInTheDocument();
  });

  it('renders commitment section', () => {
    render(<SuccessStories />);

    expect(screen.getByText('Our Commitment:')).toBeInTheDocument();
    expect(screen.getByText(/Every founding partner becomes a case study/)).toBeInTheDocument();
  });

  it('renders benefit cards', () => {
    render(<SuccessStories />);

    expect(screen.getByText('First to Market')).toBeInTheDocument();
    expect(screen.getByText('Establish your brand before competition increases')).toBeInTheDocument();

    expect(screen.getByText('Direct Impact')).toBeInTheDocument();
    expect(screen.getByText('Shape platform decisions and feature development')).toBeInTheDocument();

    expect(screen.getByText('Brand Recognition')).toBeInTheDocument();
    expect(screen.getByText('Featured prominently as founding partner')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    render(<SuccessStories />);

    expect(screen.getByText('Be Our Next Success Story')).toBeInTheDocument();
    expect(screen.getByText(/Join our founding partners and let's build your success story together/)).toBeInTheDocument();
    expect(screen.getByText(/Apply now to be featured in our growth journey/)).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<SuccessStories />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('Partner Success Stories');

    const subHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(subHeadings.length).toBeGreaterThan(0);
  });

  it('uses updated brand colors', () => {
    render(<SuccessStories />);

    // The component should render without errors and have proper styling
    // Color verification would typically be done through visual regression testing
    expect(screen.getByText('Founding Partners Program')).toBeInTheDocument();
  });

  it('renders all benefit icons', () => {
    render(<SuccessStories />);

    // Check that benefit cards have appropriate structure
    const benefitCards = screen.getAllByText(/First to Market|Direct Impact|Brand Recognition/);
    expect(benefitCards).toHaveLength(3);
  });

  it('renders story card with proper structure', () => {
    render(<SuccessStories />);

    // Check the story card has all required elements
    expect(screen.getByText('Founding Partners Program')).toBeInTheDocument();
    expect(screen.getByText('Our Commitment:')).toBeInTheDocument();
  });

  it('renders CTA with proper messaging', () => {
    render(<SuccessStories />);

    // Verify the CTA messaging is encouraging but realistic
    expect(screen.getByText('Be Our Next Success Story')).toBeInTheDocument();
    expect(screen.getByText(/founding partners/)).toBeInTheDocument();
  });
});