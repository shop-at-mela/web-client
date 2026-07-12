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

  // The subtitle, per-card description, and bottom "affiliate model" note were removed
  // in commit 93fb9113d's "Homepage copy reduction" pass (permanent design polish, not
  // the temporary marketplace-feature hiding covered below).
  it('renders Wishlists & Gift Registry card', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { name: /wishlists & gift registry/i })).toBeInTheDocument();
  });

  it('renders a "Coming Soon" badge on every card', () => {
    render(<ComingSoonSection />);
    const cardTitles = screen.getAllByRole('heading', { level: 3 });
    const badges = screen.getAllByText('Coming Soon');
    expect(badges).toHaveLength(cardTitles.length);
  });

  // The tests below cover the Unified Checkout / Community Reviews / Order Tracking
  // cards, which commit 44f9dbfef commented out with the note "marketplace features
  // incompatible with directory positioning" — the same temporary marketplace-signal
  // hiding as Hero.js (see memory: project_marketplace_ux_temporarily_hidden). Skipped
  // rather than deleted, ready to re-enable when those features return.
  it.skip('renders all 4 feature cards', () => {
    render(<ComingSoonSection />);
    const cardTitles = screen.getAllByRole('heading', { level: 3 });
    expect(cardTitles).toHaveLength(4);
  });

  it.skip('renders Unified Checkout card with correct content', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { name: /unified checkout/i })).toBeInTheDocument();
    expect(
      screen.getByText(/shop from multiple indian brands in one seamless checkout/i)
    ).toBeInTheDocument();
  });

  it.skip('renders Community Reviews card with correct content', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { name: /community reviews/i })).toBeInTheDocument();
    expect(
      screen.getByText(/verified reviews from indian diaspora parents/i)
    ).toBeInTheDocument();
  });

  it.skip('renders Order Tracking card with correct content', () => {
    render(<ComingSoonSection />);
    expect(screen.getByRole('heading', { name: /order tracking/i })).toBeInTheDocument();
    expect(
      screen.getByText(/end-to-end tracking across all your indian brand orders/i)
    ).toBeInTheDocument();
  });
});
