import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import FAQ from './FAQ';

// Mock the components
jest.mock('../../../../components', () => ({
  H2: ({ children, style }) => <h2 style={style}>{children}</h2>,
  H4: ({ children, style }) => <h4 style={style}>{children}</h4>,
}));

describe('FAQ', () => {
  it('renders the FAQ section title', () => {
    render(<FAQ />);
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('renders all tariff-related FAQ questions with featured styling', () => {
    render(<FAQ />);

    // Check new tariff-related questions
    expect(screen.getByText('What about US tariffs on Indian products? Should we wait?')).toBeInTheDocument();
    expect(screen.getByText('How does Mela help navigate regulatory uncertainty?')).toBeInTheDocument();
    expect(screen.getByText('What if trade policies change after we partner?')).toBeInTheDocument();
    expect(screen.getByText('Why should we start now instead of waiting for better times?')).toBeInTheDocument();
  });

  it('renders original FAQ questions', () => {
    render(<FAQ />);

    // Check original questions
    expect(screen.getByText('What commission rates will you charge?')).toBeInTheDocument();
    expect(screen.getByText('How do you ensure brand quality standards?')).toBeInTheDocument();
    expect(screen.getByText('Can we control pricing on your platform?')).toBeInTheDocument();
  });

  it('displays "ADDRESSING CONCERNS" badges for featured questions', () => {
    render(<FAQ />);

    const badges = screen.getAllByText('ADDRESSING CONCERNS');
    expect(badges).toHaveLength(3); // Three featured questions
  });

  it('renders Warren Buffett quote in FAQ answer', () => {
    render(<FAQ />);

    expect(screen.getByText(/Warren Buffett said it best/)).toBeInTheDocument();
    expect(screen.getByText(/Be fearful when others are greedy, and greedy when others are fearful/)).toBeInTheDocument();
  });

  it('addresses tariff uncertainty with key messaging', () => {
    render(<FAQ />);

    expect(screen.getByText(/Tariffs and trade policies are temporary—brand presence is permanent/)).toBeInTheDocument();
    expect(screen.getByText(/first-mover advantage for bold brands/)).toBeInTheDocument();
    expect(screen.getByText(/zero upfront risk/)).toBeInTheDocument();
  });

  it('mentions global expansion strategy', () => {
    render(<FAQ />);

    expect(screen.getByText(/building a global platform beyond just the US market/)).toBeInTheDocument();
    expect(screen.getByText(/expanding globally—reducing dependency on any single market/)).toBeInTheDocument();
    expect(screen.getByText(/Europe, Middle East, and Australia/)).toBeInTheDocument();
  });

  it('emphasizes flexible partnership model', () => {
    render(<FAQ />);

    expect(screen.getByText(/flexible partnership model adapts with market conditions/)).toBeInTheDocument();
    expect(screen.getByText(/No long-term contracts or fixed fees/)).toBeInTheDocument();
    expect(screen.getByText(/performance-based model protects partners/)).toBeInTheDocument();
  });

  it('renders all FAQ answers with correct content', () => {
    render(<FAQ />);

    // Check original answers exist
    expect(screen.getByText(/Commission rates are performance-based/)).toBeInTheDocument();
    expect(screen.getByText(/thorough vetting process/)).toBeInTheDocument();
    expect(screen.getByText(/You maintain full control over pricing/)).toBeInTheDocument();
  });

  it('highlights competitive advantage messaging', () => {
    render(<FAQ />);

    expect(screen.getByText(/While competitors hesitate, you can capture mindshare/)).toBeInTheDocument();
    expect(screen.getByText(/build customer loyalty in the US diaspora market/)).toBeInTheDocument();
    expect(screen.getByText(/minimal competition/)).toBeInTheDocument();
  });
});