import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import RedirectTrustSheet from './RedirectTrustSheet';
import * as sentimentCapture from '../../util/sentimentCapture';

// Minimal i18n wrapper with stubs for required messages
const TestWrapper = ({ children }) => {
  const messages = {
    'RedirectTrustSheet.heading': 'Shop on {brand}',
    'RedirectTrustSheet.trustCheckout': 'Secure Shopify checkout',
    'RedirectTrustSheet.trustShipping': 'Ships to the US',
    'RedirectTrustSheet.trustReturns': 'Easy returns from {brand}',
    'RedirectTrustSheet.sentimentPrompt': 'How likely to recommend?',
    'RedirectTrustSheet.thumbsUp': 'Thumbs up',
    'RedirectTrustSheet.thumbsDown': 'Thumbs down',
    'RedirectTrustSheet.promptThumbsUp': 'What did you like?',
    'RedirectTrustSheet.promptThumbsDown': 'What could be better?',
    'RedirectTrustSheet.textareaPlaceholder': 'Tell us more...',
    'RedirectTrustSheet.emailLabel': 'Email (optional)',
    'RedirectTrustSheet.emailPlaceholder': 'your@email.com',
    'RedirectTrustSheet.emailError': 'Please enter a valid email address',
    'RedirectTrustSheet.submit': 'Send feedback',
    'RedirectTrustSheet.skip': 'Skip',
    'RedirectTrustSheet.thankYou': 'Thanks for the feedback!',
    'RedirectTrustSheet.continue': 'Continue to {brand}',
    'RedirectTrustSheet.dismissLabel': 'Not now',
    'RedirectTrustSheet.dismissLabelExpanded': 'Close',
    'RedirectTrustSheet.ariaLabel': 'Shop brand routing',
  };
  return (
    <IntlProvider locale="en" messages={messages}>
      {children}
    </IntlProvider>
  );
};

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
    jest.useFakeTimers();
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);
    const continueBtn = screen.getByRole('button', { name: /Continue to Aagghhoo/i });
    // button starts disabled, so advance time to enable it
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    fireEvent.click(continueBtn);
    expect(defaultProps.onContinue).toHaveBeenCalledWith('https://aagghhoo.com/product/1');
    expect(defaultProps.onClose).toHaveBeenCalled();
    jest.useRealTimers();
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

  it('disables Continue button on first show (1.5s delay)', () => {
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);
    const continueBtn = screen.getByRole('button', { name: /Continue to Aagghhoo/i });
    // button should be disabled initially
    expect(continueBtn).toBeDisabled();
  });

  it('enables Continue button after 1.5 seconds', () => {
    jest.useFakeTimers();
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);
    const continueBtn = screen.getByRole('button', { name: /Continue to Aagghhoo/i });
    expect(continueBtn).toBeDisabled();
    // advance time by 1500ms
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    // button should be enabled after the delay
    expect(continueBtn).not.toBeDisabled();
    jest.useRealTimers();
  });

  it('resets button disabled state when sheet closes and reopens', async () => {
    const { rerender } = render(
      <TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>
    );
    const continueBtn = screen.getByRole('button', { name: /Continue to Aagghhoo/i });
    expect(continueBtn).toBeDisabled();
    // close the sheet
    rerender(<TestWrapper><RedirectTrustSheet {...defaultProps} isOpen={false} /></TestWrapper>);
    // reopen it
    rerender(<TestWrapper><RedirectTrustSheet {...defaultProps} isOpen={true} /></TestWrapper>);
    // button should be disabled again
    const reopenedBtn = screen.getByRole('button', { name: /Continue to Aagghhoo/i });
    expect(reopenedBtn).toBeDisabled();
  });
});
