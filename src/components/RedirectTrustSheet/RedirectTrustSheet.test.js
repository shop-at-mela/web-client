import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';
import RedirectTrustSheet from './RedirectTrustSheet';
import * as sentimentCapture from '../../util/sentimentCapture';
import enMessages from '../../translations/en.json';

// Minimal i18n wrapper with stubs for required messages
const TestWrapper = ({ children }) => {
  const messages = {
    'RedirectTrustSheet.heading': 'Shop on {brand}',
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
    'RedirectTrustSheet.continueDelayAnnouncement': 'The Continue button will be available in a moment.',
    'RedirectTrustSheet.continueReadyAnnouncement': 'The Continue button is now available.',
  };
  // Trust section strings come from the real en.json so these tests assert exactly what ships
  Object.keys(enMessages)
    .filter(key => /^RedirectTrustSheet\.trust(Checkout|Shipping|Duties)/.test(key))
    .forEach(key => {
      messages[key] = enMessages[key];
    });
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
    expect(screen.getByText(/Secure checkout on Aagghhoo's store · US cards accepted/)).toBeInTheDocument();
    // CTA is always present
    const cta = screen.getByRole('button', { name: /Continue to Aagghhoo/i });
    expect(cta).toBeInTheDocument();
  });

  describe('per-brand shipping and duty lines', () => {
    const lines = props => {
      render(<TestWrapper><RedirectTrustSheet {...defaultProps} {...props} /></TestWrapper>);
      return Array.from(document.querySelectorAll('li')).map(li => li.textContent);
    };

    it('DDU brand (Fizzy Goblet)', () => {
      const items = lines({
        brandName: 'Fizzy Goblet',
        usShipping: { duties: 'ddu', method: 'flat_rate_free_over_threshold', feeUsd: 15, freeOverUsd: 100 },
      });
      expect(items).toContain('🇺🇸 Fizzy Goblet ships to the US');
      expect(items).toContain('🧾 US import duties are paid on delivery');
    });

    it('DDP brand (Nicobar)', () => {
      const items = lines({ brandName: 'Nicobar', usShipping: { duties: 'ddp', method: 'flat_rate' } });
      expect(items).toContain('🇺🇸 Nicobar ships to the US');
      expect(items).toContain('🧾 Nicobar includes US import duties');
    });

    it('DDP brand that adds duties at checkout does not claim they are in the price', () => {
      const items = lines({
        brandName: 'Vilvah Store',
        usShipping: { duties: 'ddp', dutiesCollected: 'at_checkout', method: 'flat_rate' },
      });
      expect(items).toContain('🧾 Vilvah Store adds US import duties at checkout');
    });

    it('unknown duties (Ankid)', () => {
      const items = lines({ brandName: 'Ankid', usShipping: { method: 'flat_rate', feeUsd: 28, feeApprox: true } });
      expect(items).toContain('🇺🇸 Ankid ships to the US');
      expect(items).toContain("🧾 Ankid doesn't say if US duties are included");
    });

    it('no brandUsShipping shows the neutral fallback, never a blanket claim', () => {
      const items = lines({ brandName: 'Isharya', usShipping: null });
      expect(items).toContain('🇺🇸 Isharya sets shipping at its checkout');
      expect(items).toContain("🧾 Isharya doesn't say if US duties are included");
      expect(document.body.textContent).not.toMatch(/ships to the US/i);
    });

    it('method none says the brand does not ship yet and shows no duties line', () => {
      const items = lines({ brandName: 'Pluchi', usShipping: { method: 'none' } });
      expect(items).toContain("🇺🇸 Pluchi doesn't ship to the US yet");
      expect(items.some(i => /duties/i.test(i))).toBe(false);
    });
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

  it('announces the Continue button activation delay via aria-live, then the ready state', () => {
    jest.useFakeTimers();
    render(<TestWrapper><RedirectTrustSheet {...defaultProps} /></TestWrapper>);

    // The announcement text is deferred one tick after mount (screen readers don't
    // announce content already present the moment a live region first mounts).
    act(() => {
      jest.advanceTimersByTime(50);
    });
    const announcement = screen.getByText('The Continue button will be available in a moment.');
    expect(announcement.closest('[aria-live="polite"]')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1550);
    });
    expect(screen.getByText('The Continue button is now available.')).toBeInTheDocument();

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
