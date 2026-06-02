import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComingSoonSection from './ComingSoonSection';

describe('ComingSoonSection', () => {
  it('renders without crashing', () => {
    render(<ComingSoonSection />);
  });

  it('renders the section heading', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { level: 2, name: /more coming to mela/i })).toBeInTheDocument();
  });

  it('renders the section subheading', () => {
    render(<ComingSoonSection />);
    expect(
      screen.getByText(/we're building the complete shopping experience/i)
    ).toBeInTheDocument();
  });

  it('renders all 4 feature cards', () => {
    render(<ComingSoonSection />);
    const cardTitles = screen.getAllByRole('heading', { level: 3 });
    expect(cardTitles).toHaveLength(4);
  });

  it('renders Unified Checkout card with correct content', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { name: /unified checkout/i })).toBeInTheDocument();
    expect(
      screen.getByText(/shop from multiple indian brands in one seamless checkout/i)
    ).toBeInTheDocument();
  });

  it('renders Community Reviews card with correct content', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { name: /community reviews/i })).toBeInTheDocument();
    expect(
      screen.getByText(/verified reviews from indian diaspora parents/i)
    ).toBeInTheDocument();
  });

  it('renders Order Tracking card with correct content', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { name: /order tracking/i })).toBeInTheDocument();
    expect(
      screen.getByText(/end-to-end tracking across all your indian brand orders/i)
    ).toBeInTheDocument();
  });

  it('renders Wishlists & Gift Registry card with correct content', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { name: /wishlists & gift registry/i })).toBeInTheDocument();
    expect(
      screen.getByText(/curate lists for baby showers, diwali gifting/i)
    ).toBeInTheDocument();
  });

  it('renders a "Coming Soon" badge on every card', () => {
    render(<ComingSoonSection />);
    const badges = screen.getAllByText('Coming Soon');
    expect(badges).toHaveLength(4);
  });

  it('renders the honest affiliate model note', () => {
    render(<ComingSoonSection />);
    expect(
      screen.getByText(/checkout happens on each brand's own shopify store/i)
    ).toBeInTheDocument();
  });
});
