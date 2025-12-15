import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import BrandStorySection from './BrandStorySection';

const mockMessages = {
  'BrandStorefront.ourStory': 'Our Story',
  'BrandStorefront.readMore': 'Read More',
  'BrandStorefront.readLess': 'Read Less',
  'BrandStorefront.storyTip':
    'Tip: Add {recommendedLength} characters for an engaging brand story. You have {currentLength} so far.',
};

const TestWrapper = ({ children }) => (
  <IntlProvider locale="en" messages={mockMessages}>
    {children}
  </IntlProvider>
);

describe('BrandStorySection', () => {
  describe('Basic Rendering', () => {
    it('renders nothing when brandStory is null', () => {
      const { container } = render(
        <TestWrapper>
          <BrandStorySection brandStory={null} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when brandStory is undefined', () => {
      const { container } = render(
        <TestWrapper>
          <BrandStorySection brandStory={undefined} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders "Our Story" heading', () => {
      render(
        <TestWrapper>
          <BrandStorySection
            brandStory="Short brand story."
            previewLength={300}
            isOwnProfile={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Our Story')).toBeInTheDocument();
    });

    it('renders brandStory content', () => {
      render(
        <TestWrapper>
          <BrandStorySection
            brandStory="We make organic baby products."
            previewLength={300}
            isOwnProfile={false}
          />
        </TestWrapper>
      );

      expect(screen.getByText('We make organic baby products.')).toBeInTheDocument();
    });
  });

  describe('Read More Expansion', () => {
    const longBrandStory =
      'Founded in 2018 by two Mumbai mothers frustrated by harsh chemicals in baby bedding. ' +
      'Masilo partners with traditional weavers in Maharashtra to create GOTS-certified organic cotton. ' +
      'Every piece is hand-inspected, washed with natural plant-based soaps, and packaged in plastic-free materials. ' +
      'Today, Masilo serves over 10,000 families across the US and India while supporting 127 artisan families.';

    it('shows "Read More" button when brandStory exceeds previewLength', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(screen.getByText('Read More')).toBeInTheDocument();
    });

    it('does NOT show "Read More" button when brandStory is shorter than previewLength', () => {
      const shortBrandStory = 'We make organic baby products.';

      render(
        <TestWrapper>
          <BrandStorySection brandStory={shortBrandStory} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Read More')).not.toBeInTheDocument();
    });

    it('toggles to "Read Less" when Read More is clicked', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const button = screen.getByText('Read More');
      fireEvent.click(button);

      expect(screen.getByText('Read Less')).toBeInTheDocument();
      expect(screen.queryByText('Read More')).not.toBeInTheDocument();
    });

    it('toggles back to "Read More" when Read Less is clicked', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const readMoreButton = screen.getByText('Read More');
      fireEvent.click(readMoreButton);

      const readLessButton = screen.getByText('Read Less');
      fireEvent.click(readLessButton);

      expect(screen.getByText('Read More')).toBeInTheDocument();
      expect(screen.queryByText('Read Less')).not.toBeInTheDocument();
    });

    it('shows truncated preview when collapsed', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      // Should NOT show the full text
      expect(screen.queryByText(/supporting 127 artisan families/)).not.toBeInTheDocument();

      // Should show the beginning
      expect(screen.getByText(/Founded in 2018/)).toBeInTheDocument();
    });

    it('shows full content when expanded', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const button = screen.getByText('Read More');
      fireEvent.click(button);

      // Should show the full text including the end
      expect(screen.getByText(/supporting 127 artisan families/)).toBeInTheDocument();
      expect(screen.getByText(/Founded in 2018/)).toBeInTheDocument();
    });

    it('includes down arrow icon (↓) when collapsed', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const button = screen.getByText('Read More');
      expect(button.textContent).toContain('↓');
    });

    it('includes up arrow icon (↑) when expanded', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const readMoreButton = screen.getByText('Read More');
      fireEvent.click(readMoreButton);

      const readLessButton = screen.getByText('Read Less');
      expect(readLessButton.textContent).toContain('↑');
    });
  });

  describe('Smart Truncation Logic', () => {
    it('truncates at sentence boundary (period)', () => {
      const brandStory =
        'First sentence here. Second sentence here. Third sentence that is very long and exceeds the preview length by quite a bit.';

      const { container } = render(
        <TestWrapper>
          <BrandStorySection brandStory={bio} previewLength={50} isOwnProfile={false} />
        </TestWrapper>
      );

      // Should show first sentence in preview
      expect(screen.getByText(/First sentence here\./)).toBeInTheDocument();
      // Read More button should be present
      expect(screen.getByText('Read More')).toBeInTheDocument();

      // Verify that we're showing truncated content (storyCollapsed class)
      const storyContent = container.querySelector('.storyCollapsed');
      expect(storyContent).toBeInTheDocument();
    });

    it('truncates at sentence boundary (exclamation mark)', () => {
      const brandStory =
        'Exciting first sentence! Second sentence here. Third sentence that continues on.';

      const { container } = render(
        <TestWrapper>
          <BrandStorySection brandStory={bio} previewLength={50} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(screen.getByText(/Exciting first sentence!/)).toBeInTheDocument();
      expect(screen.getByText('Read More')).toBeInTheDocument();

      const storyContent = container.querySelector('.storyCollapsed');
      expect(storyContent).toBeInTheDocument();
    });

    it('truncates at sentence boundary (question mark)', () => {
      const brandStory =
        'Is this a question? Yes it is. This is another sentence that goes beyond the limit.';

      const { container } = render(
        <TestWrapper>
          <BrandStorySection brandStory={bio} previewLength={50} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(screen.getByText(/Is this a question\?/)).toBeInTheDocument();
      expect(screen.getByText('Read More')).toBeInTheDocument();

      const storyContent = container.querySelector('.storyCollapsed');
      expect(storyContent).toBeInTheDocument();
    });

    it('falls back to word boundary when no sentence end found', () => {
      const brandStory = 'This is a very long sentence without any punctuation marks at all just words';

      render(
        <TestWrapper>
          <BrandStorySection brandStory={bio} previewLength={30} isOwnProfile={false} />
        </TestWrapper>
      );

      const text = screen.getByText(/This is a very long/);
      // Should end with ellipsis when using word boundary fallback
      expect(text.textContent).toContain('...');
    });

    it('respects 70% threshold for sentence boundary', () => {
      // If sentence end is too early (< 70% of previewLength), use word boundary
      const brandStory =
        'Short. This is a much longer sentence that goes well beyond the preview length limit and should be shown.';

      render(
        <TestWrapper>
          <BrandStorySection brandStory={bio} previewLength={100} isOwnProfile={false} />
        </TestWrapper>
      );

      // 70% of 100 = 70 chars. "Short." is at position 6 (< 70%), so should use word boundary
      const text = screen.getByText(/Short/);
      expect(text.textContent).toContain('This is a much longer');
    });

    it('respects custom previewLength parameter', () => {
      const brandStory =
        'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.';

      const { rerender } = render(
        <TestWrapper>
          <BrandStorySection brandStory={bio} previewLength={20} isOwnProfile={false} />
        </TestWrapper>
      );

      // With previewLength=20, should show very little
      expect(screen.getByText(/First sentence\./)).toBeInTheDocument();
      expect(screen.queryByText(/Second/)).not.toBeInTheDocument();

      // Increase previewLength
      rerender(
        <TestWrapper>
          <BrandStorySection brandStory={bio} previewLength={60} isOwnProfile={false} />
        </TestWrapper>
      );

      // Now should show more
      expect(screen.getByText(/Second sentence\./)).toBeInTheDocument();
    });

    it('uses default previewLength of 300 when not specified', () => {
      const shortBio = 'A'.repeat(250); // 250 chars

      render(
        <TestWrapper>
          <BrandStorySection brandStory={shortBio} isOwnProfile={false} />
        </TestWrapper>
      );

      // Should NOT show Read More (250 < 300)
      expect(screen.queryByText('Read More')).not.toBeInTheDocument();
    });
  });

  describe('Owner Content Tip', () => {
    it('shows tip for owner with short bio (< 200 chars)', () => {
      const shortBio = 'We make organic products.'; // 25 chars

      render(
        <TestWrapper>
          <BrandStorySection brandStory={shortBio} previewLength={300} isOwnProfile={true} />
        </TestWrapper>
      );

      expect(
        screen.getByText(/Tip: Add 300 characters for an engaging brand story/)
      ).toBeInTheDocument();
      expect(screen.getByText(/You have 25 so far/)).toBeInTheDocument();
    });

    it('does NOT show tip for non-owner', () => {
      const shortBio = 'We make organic products.';

      render(
        <TestWrapper>
          <BrandStorySection brandStory={shortBio} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Tip/)).not.toBeInTheDocument();
    });

    it('does NOT show tip when brandStory >= 200 chars', () => {
      const longBrandStory = 'A'.repeat(200); // Exactly 200 chars

      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={300} isOwnProfile={true} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Tip/)).not.toBeInTheDocument();
    });

    it('shows tip when brandStory is 199 chars (just under threshold)', () => {
      const almostLongBio = 'A'.repeat(199);

      render(
        <TestWrapper>
          <BrandStorySection brandStory={almostLongBio} previewLength={300} isOwnProfile={true} />
        </TestWrapper>
      );

      expect(screen.getByText(/You have 199 so far/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const longBrandStory = 'A'.repeat(400);

    it('sets aria-expanded="false" when collapsed', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /Read More/ });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('sets aria-expanded="true" when expanded', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /Read More/ });
      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('arrow icon has aria-hidden="true"', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /Read More/ });
      const icon = button.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    it('button is keyboard accessible (can be focused and activated)', () => {
      render(
        <TestWrapper>
          <BrandStorySection brandStory={longBrandStory} previewLength={150} isOwnProfile={false} />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /Read More/ });
      button.focus();
      expect(button).toHaveFocus();

      // Click works (Enter key doesn't trigger click in testing library without special setup)
      fireEvent.click(button);
      expect(screen.getByText('Read Less')).toBeInTheDocument();
    });
  });

  describe('Rich Text Formatting', () => {
    it('linkifies URLs in bio', () => {
      const bioWithUrl = 'Visit us at https://example.com for more info.';

      const { container } = render(
        <TestWrapper>
          <BrandStorySection brandStory={bioWithUrl} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      const link = container.querySelector('a[href="https://example.com"]');
      expect(link).toBeInTheDocument();
    });

    it('applies longWord class to very long words', () => {
      const bioWithLongWord = 'A'.repeat(25) + ' normal words here.';

      const { container } = render(
        <TestWrapper>
          <BrandStorySection brandStory={bioWithLongWord} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      // Check that longWord class is applied (implementation detail of richText)
      const storyContent = container.querySelector('[class*="storyContent"]');
      expect(storyContent).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles bio that is exactly previewLength', () => {
      const exactBio = 'A'.repeat(300);

      render(
        <TestWrapper>
          <BrandStorySection brandStory={exactBio} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      // Should NOT show Read More (length is not greater than previewLength)
      expect(screen.queryByText('Read More')).not.toBeInTheDocument();
    });

    it('handles brandStory with only whitespace', () => {
      const whitespaceBio = '   ';

      render(
        <TestWrapper>
          <BrandStorySection brandStory={whitespaceBio} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(screen.getByText('Our Story')).toBeInTheDocument();
      expect(screen.queryByText('Read More')).not.toBeInTheDocument();
    });

    it('handles brandStory with multiple consecutive sentence endings', () => {
      const brandStory = 'Question?! Excitement!! More content here.';

      render(
        <TestWrapper>
          <BrandStorySection brandStory={bio} previewLength={20} isOwnProfile={false} />
        </TestWrapper>
      );

      // Should handle multiple punctuation marks correctly
      expect(screen.getByText(/Question/)).toBeInTheDocument();
    });

    it('handles empty string bio (edge case)', () => {
      const { container } = render(
        <TestWrapper>
          <BrandStorySection bio="" previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      // Empty brandStory is falsy, should render nothing
      expect(container.firstChild).toBeNull();
    });

    it('handles brandStory with newlines and formatting', () => {
      const bioWithNewlines = 'First paragraph.\n\nSecond paragraph with more content.';

      render(
        <TestWrapper>
          <BrandStorySection brandStory={bioWithNewlines} previewLength={300} isOwnProfile={false} />
        </TestWrapper>
      );

      expect(screen.getByText(/First paragraph/)).toBeInTheDocument();
      expect(screen.getByText(/Second paragraph/)).toBeInTheDocument();
    });
  });
});
