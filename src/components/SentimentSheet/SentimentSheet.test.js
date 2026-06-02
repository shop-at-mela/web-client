import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import SentimentSheet from './SentimentSheet';

const { screen, act } = testingLibrary;

// ── Mock sentimentCapture ─────────────────────────────────────────────────────
// IntlProvider in tests returns the translation key as the display value.
// e.g. formatMessage({ id: 'SentimentSheet.thumbsUp' }) → 'SentimentSheet.thumbsUp'
// All queries below use key strings, not human-readable English.

jest.mock('../../util/sentimentCapture', () => ({
  shouldShowSentiment: jest.fn(() => true),
  markSentimentShown: jest.fn(),
  postSentiment: jest.fn(),
}));

const { shouldShowSentiment, markSentimentShown, postSentiment } =
  require('../../util/sentimentCapture');

// ── Timer setup ───────────────────────────────────────────────────────────────

const SHOW_DELAY = 15_000;
const THANK_YOU_DELAY = 2_500;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  shouldShowSentiment.mockReturnValue(true);
});

afterEach(() => {
  act(() => { jest.runOnlyPendingTimers(); });
  jest.useRealTimers();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const showSheet = () => act(() => { jest.advanceTimersByTime(SHOW_DELAY); });

const clickThumbsUp = () =>
  act(() => { screen.getByRole('button', { name: 'SentimentSheet.thumbsUp' }).click(); });

const clickThumbsDown = () =>
  act(() => { screen.getByRole('button', { name: 'SentimentSheet.thumbsDown' }).click(); });

const clickSubmit = () =>
  act(() => { screen.getByRole('button', { name: 'SentimentSheet.submit' }).click(); });

const clickSkip = () =>
  act(() => { screen.getByRole('button', { name: /SentimentSheet\.skip/i }).click(); });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SentimentSheet', () => {
  describe('initial state', () => {
    it('renders nothing before the 15-second delay', () => {
      render(<SentimentSheet />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not show when shouldShowSentiment returns false', () => {
      shouldShowSentiment.mockReturnValue(false);
      render(<SentimentSheet />);
      showSheet();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('collapsed state', () => {
    it('shows the sheet after 15 seconds', () => {
      render(<SentimentSheet />);
      showSheet();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('calls markSentimentShown when the strip appears', () => {
      render(<SentimentSheet />);
      showSheet();
      expect(markSentimentShown).toHaveBeenCalledTimes(1);
    });

    it('renders thumbs up and thumbs down buttons', () => {
      render(<SentimentSheet />);
      showSheet();
      expect(screen.getByRole('button', { name: 'SentimentSheet.thumbsUp' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'SentimentSheet.thumbsDown' })).toBeInTheDocument();
    });

    it('renders the dismiss button', () => {
      render(<SentimentSheet />);
      showSheet();
      expect(screen.getByRole('button', { name: 'SentimentSheet.dismiss' })).toBeInTheDocument();
    });

    it('removes the dialog when dismiss is clicked', () => {
      render(<SentimentSheet />);
      showSheet();
      act(() => { screen.getByRole('button', { name: 'SentimentSheet.dismiss' }).click(); });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not show the expanded content yet', () => {
      render(<SentimentSheet />);
      showSheet();
      expect(screen.queryByPlaceholderText('SentimentSheet.textareaPlaceholder')).not.toBeInTheDocument();
    });
  });

  describe('expanded state', () => {
    it('shows the textarea after thumbs up', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsUp();
      expect(screen.getByPlaceholderText('SentimentSheet.textareaPlaceholder')).toBeInTheDocument();
    });

    it('shows the textarea after thumbs down', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsDown();
      expect(screen.getByPlaceholderText('SentimentSheet.textareaPlaceholder')).toBeInTheDocument();
    });

    it('shows the email input after thumbs tap', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsUp();
      expect(screen.getByRole('textbox', { name: 'SentimentSheet.emailLabel' })).toBeInTheDocument();
    });

    it('shows Send feedback and Skip buttons', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsUp();
      expect(screen.getByRole('button', { name: 'SentimentSheet.submit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /SentimentSheet\.skip/i })).toBeInTheDocument();
    });

    it('fires postSentiment immediately on thumbs up tap', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsUp();
      expect(postSentiment).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'general_sentiment', response: 'up' })
      );
    });

    it('fires postSentiment immediately on thumbs down tap', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsDown();
      expect(postSentiment).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'general_sentiment', response: 'down' })
      );
    });
  });

  describe('submitted state', () => {
    it('shows the thank-you message after clicking Send feedback', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsUp();
      clickSubmit();
      expect(screen.getByText(/SentimentSheet\.thankYou/)).toBeInTheDocument();
    });

    it('shows the thank-you message after clicking Skip', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsUp();
      clickSkip();
      expect(screen.getByText(/SentimentSheet\.thankYou/)).toBeInTheDocument();
    });

    it('auto-dismisses after 2.5 seconds', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsUp();
      clickSubmit();
      act(() => { jest.advanceTimersByTime(THANK_YOU_DELAY); });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls postSentiment with event: general_sentiment_text on submit', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsDown();
      clickSubmit();
      expect(postSentiment).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'general_sentiment_text', response: 'down' })
      );
    });

    it('does not call general_sentiment_text when Skip is clicked', () => {
      render(<SentimentSheet />);
      showSheet();
      clickThumbsUp();
      clickSkip();
      // Only the initial thumbs call should have fired — no text event on skip
      expect(postSentiment).toHaveBeenCalledTimes(1);
      expect(postSentiment).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'general_sentiment' })
      );
    });
  });
});
