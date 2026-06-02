import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import RedirectTrustSheet from './RedirectTrustSheet';
import * as sentimentCapture from '../../util/sentimentCapture';

// Minimal i18n wrapper — uses key as fallback so tests are resilient to copy changes
const TestWrapper = ({ children }) => (
  <IntlProvider locale="en" messages={{}}>
    {children}
  </IntlProvider>
);

const defaultProps = {
  isOpen: true,
  brandName: 'Aagghhoo',
  productUrl: 'https://aagghhoo.com/product/1',
  isVerified: true,
  onContinue: jest.fn(),
  onClose: jest.fn(),
};

jest.mock('../../util/sentimentCapture', () => ({
  ...jest.requireActual('../../util/sentimentCapture'),
  postSentiment: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RedirectTrustSheet', () => {
  it('renders trust section and CTA when open', () => {
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);
    // trust list items
    expect(screen.getByText(/Secure Shopify checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/Ships to the US/i)).toBeInTheDocument();
    // CTA is always present
    const cta = screen.getByRole('button', { name: /Continue to Aagghhoo/i });
    expect(cta).toBeInTheDocument();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TestWrapper><RedirectTrustSheet {...defaultProps} isOpen={false} /></TestWrapper>
    );
    expect(container.firstChild).toBeNull();
  });

  it('expands to free-text section on thumbs up', () => {
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /Thumbs up/i }));
    // expanded state shows a textarea
    expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument();
    expect(sentimentCapture.postSentiment).toHaveBeenCalledWith(
      expect.objectContaining({ response: 'up', brand: 'Aagghhoo' })
    );
  });

  it('calls onContinue with productUrl when CTA is clicked', () => {
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);
    fireEvent.click(screen.getByRole('button', { name: /Continue to Aagghhoo/i }));
    expect(defaultProps.onContinue).toHaveBeenCalledWith('https://aagghhoo.com/product/1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when dismiss button is clicked', () => {
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);
    // dismiss button label is "Not now" in collapsed state
    const dismiss = screen.getByRole('button', { name: /Not now/i });
    fireEvent.click(dismiss);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows email validation error for invalid email before submit', () => {
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);
    // expand
    fireEvent.click(screen.getByRole('button', { name: /Thumbs up/i }));
    // enter invalid email
    const emailInput = screen.getByPlaceholderText(/your@email.com/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /Send feedback/i }));
    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    expect(sentimentCapture.postSentiment).toHaveBeenCalledTimes(1); // only the thumbs post, not the submit
  });
});
