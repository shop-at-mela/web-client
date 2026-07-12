import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import WhyClothing from './WhyClothing';

// Mock the components
jest.mock('../../../../components', () => ({
  H2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
  H3: ({ children, ...props }) => <h3 {...props}>{children}</h3>
}));

describe('WhyClothing', () => {
  it('renders the main title and subtitle', () => {
    render(<WhyClothing />);

    expect(screen.getByText('Why Baby Clothing? Because We\'re Proving the Market Together, One Category at a Time.')).toBeInTheDocument();
    expect(screen.getByText('Strategic focus on a proven category with massive demand and cultural significance')).toBeInTheDocument();
  });

  it('renders all pillar cards', () => {
    render(<WhyClothing />);

    // Should show the first pillar by default (mobile + desktop copies both render it)
    expect(screen.getAllByText('Proven Demand')[0]).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<WhyClothing />);

    const prevButton = screen.getByLabelText('Previous pillar');
    const nextButton = screen.getByLabelText('Next pillar');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('renders page indicators', () => {
    render(<WhyClothing />);

    const indicators = screen.getAllByLabelText(/Go to pillar \d+/);
    expect(indicators).toHaveLength(3); // Three pillars
  });

  it('navigates to next pillar when next button is clicked', () => {
    const { container } = render(<WhyClothing />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const nextButton = within(mobileCarousel).getByLabelText('Next pillar');
    fireEvent.click(nextButton);

    expect(within(mobileCarousel).getByText('Clear Value Proposition')).toBeInTheDocument();
    expect(within(mobileCarousel).getByText('Unique designs')).toBeInTheDocument();
  });

  it('navigates to previous pillar when prev button is clicked', () => {
    const { container } = render(<WhyClothing />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    // First go to next pillar
    const nextButton = within(mobileCarousel).getByLabelText('Next pillar');
    fireEvent.click(nextButton);

    // Then go back
    const prevButton = within(mobileCarousel).getByLabelText('Previous pillar');
    fireEvent.click(prevButton);

    expect(within(mobileCarousel).getByText('Proven Demand')).toBeInTheDocument();
    expect(within(mobileCarousel).getByText('Highest search volume')).toBeInTheDocument();
  });

  // All 3 pillar cards render simultaneously in the carousel track (position is CSS
  // transform-driven, not conditional), so text presence alone can't confirm which
  // card is current. The dot indicator's "active" class is the one place that does.
  const getActivePillarIndex = mobileCarousel => {
    const dots = within(mobileCarousel).getAllByLabelText(/Go to pillar \d+/);
    return dots.findIndex(dot => dot.className.includes('active'));
  };

  it('wraps to the last pillar when prev is clicked on the first pillar', () => {
    const { container } = render(<WhyClothing />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const prevButton = within(mobileCarousel).getByLabelText('Previous pillar');
    expect(prevButton).not.toBeDisabled();

    fireEvent.click(prevButton);
    expect(getActivePillarIndex(mobileCarousel)).toBe(2); // wraps from first to last of 3 pillars
  });

  it('wraps to the first pillar when next is clicked on the last pillar', () => {
    const { container } = render(<WhyClothing />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const nextButton = within(mobileCarousel).getByLabelText('Next pillar');
    expect(nextButton).not.toBeDisabled();

    // Navigate to last pillar (click next 2 times for 3 total), then once more to wrap
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(getActivePillarIndex(mobileCarousel)).toBe(0);
  });

  it('allows direct navigation via page indicators', () => {
    const { container } = render(<WhyClothing />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const thirdIndicator = within(mobileCarousel).getByLabelText('Go to pillar 3');
    fireEvent.click(thirdIndicator);

    expect(within(mobileCarousel).getByText('Strategic Partnership')).toBeInTheDocument();
    expect(within(mobileCarousel).getByText('Focused expertise')).toBeInTheDocument();
  });

  it('renders category market insight stats', () => {
    render(<WhyClothing />);

    expect(screen.getByText('Why This Category Works')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Search volume for "Indian baby clothes"')).toBeInTheDocument();
    expect(screen.getByText('Limited')).toBeInTheDocument();
    expect(screen.getByText('Specialized retailers in US')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('International shipping category')).toBeInTheDocument();
  });

  it('renders future vision section', () => {
    render(<WhyClothing />);

    expect(screen.getByText('Start with Baby Clothes, Expand Together')).toBeInTheDocument();
    expect(screen.getByText(/Starting with baby and children's clothing to prove the model, then expanding to home goods and beyond\./)).toBeInTheDocument();
  });

  it('renders updated expansion path', () => {
    render(<WhyClothing />);

    expect(screen.getByText('Baby & Children\'s Clothing (NOW)')).toBeInTheDocument();
    expect(screen.getByText('Home & Lifestyle')).toBeInTheDocument();
    expect(screen.getByText('Other Categories')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<WhyClothing />);

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('Why Baby Clothing?');

    const subHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(subHeadings.length).toBeGreaterThan(0);

    // Check for button accessibility
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('handles keyboard navigation', () => {
    const { container } = render(<WhyClothing />);
    const mobileCarousel = container.querySelector('.mobileCarousel');

    const nextButton = within(mobileCarousel).getByLabelText('Next pillar');

    // Focus the button and press Enter
    nextButton.focus();
    fireEvent.keyDown(nextButton, { key: 'Enter' });

    expect(within(mobileCarousel).getByText('Clear Value Proposition')).toBeInTheDocument();
  });
});