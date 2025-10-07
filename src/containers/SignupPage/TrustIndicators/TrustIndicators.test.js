import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import { fakeIntl } from '../../../util/testData';

import TrustIndicators from './TrustIndicators';

const { screen } = testingLibrary;

describe('TrustIndicators', () => {
  it('renders all trust indicators', () => {
    render(<TrustIndicators />);

    expect(screen.getByText(/Secure signup/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant access/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified accounts/i)).toBeInTheDocument();
  });

  it('displays correct icons for each indicator', () => {
    render(<TrustIndicators />);

    // Check for security lock icon
    expect(screen.getByText('🔒')).toBeInTheDocument();

    // Check for instant/speed icon
    expect(screen.getByText('⚡')).toBeInTheDocument();

    // Check for verified/checkmark icon
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders indicators in proper container structure', () => {
    const { container } = render(<TrustIndicators />);

    // Should have main container
    expect(container.querySelector('.container')).toBeInTheDocument();

    // Should have indicators wrapper
    expect(container.querySelector('.indicators')).toBeInTheDocument();

    // Should have individual indicator elements
    const indicators = container.querySelectorAll('.indicator');
    expect(indicators).toHaveLength(3);
  });

  it('has proper structure for each indicator', () => {
    const { container } = render(<TrustIndicators />);

    const indicators = container.querySelectorAll('.indicator');

    indicators.forEach(indicator => {
      // Each indicator should have an icon and text
      expect(indicator.querySelector('.icon')).toBeInTheDocument();
      expect(indicator.querySelector('.text')).toBeInTheDocument();
    });
  });

  it('renders icons and text side by side', () => {
    const { container } = render(<TrustIndicators />);

    const firstIndicator = container.querySelector('.indicator');
    const icon = firstIndicator.querySelector('.icon');
    const text = firstIndicator.querySelector('.text');

    // Both elements should exist
    expect(icon).toBeInTheDocument();
    expect(text).toBeInTheDocument();

    // Icon should come before text in DOM order
    expect(icon.nextSibling).toBe(text);
  });

  it('displays meaningful text for accessibility', () => {
    render(<TrustIndicators />);

    // Each trust indicator should have descriptive text
    const secureText = screen.getByText(/Secure signup/i);
    const instantText = screen.getByText(/Instant access/i);
    const verifiedText = screen.getByText(/Verified accounts/i);

    expect(secureText).toBeInTheDocument();
    expect(instantText).toBeInTheDocument();
    expect(verifiedText).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<TrustIndicators />);

    // Check for expected CSS classes
    expect(container.querySelector('.container')).toBeInTheDocument();
    expect(container.querySelector('.indicators')).toBeInTheDocument();
    expect(container.querySelector('.indicator')).toBeInTheDocument();
    expect(container.querySelector('.icon')).toBeInTheDocument();
    expect(container.querySelector('.text')).toBeInTheDocument();
  });

  it('renders consistently without props', () => {
    // TrustIndicators doesn't take props - should always render the same
    const { container: container1 } = render(<TrustIndicators />);
    const { container: container2 } = render(<TrustIndicators />);

    expect(container1.innerHTML).toBe(container2.innerHTML);
  });

  it('has proper semantic structure', () => {
    const { container } = render(<TrustIndicators />);

    // Should use span elements for inline content
    const icons = container.querySelectorAll('.icon');
    const texts = container.querySelectorAll('.text');

    icons.forEach(icon => {
      expect(icon.tagName.toLowerCase()).toBe('span');
    });

    texts.forEach(text => {
      expect(text.tagName.toLowerCase()).toBe('span');
    });
  });

  it('displays trust indicators without any conditional logic', () => {
    // Since TrustIndicators is a simple static component,
    // it should always render all indicators
    render(<TrustIndicators />);

    const indicators = screen.getAllByText(/Secure|Instant|Verified/);
    expect(indicators).toHaveLength(3);
  });

  describe('Icon accessibility', () => {
    it('uses emoji icons that are accessible', () => {
      render(<TrustIndicators />);

      // Emojis should be present and readable
      const lockIcon = screen.getByText('🔒');
      const boltIcon = screen.getByText('⚡');
      const checkIcon = screen.getByText('✓');

      expect(lockIcon).toBeInTheDocument();
      expect(boltIcon).toBeInTheDocument();
      expect(checkIcon).toBeInTheDocument();
    });

    it('pairs icons with descriptive text', () => {
      const { container } = render(<TrustIndicators />);

      // Each icon should be paired with descriptive text
      const secureIndicator = screen.getByText(/Secure signup/i).closest('.indicator');
      expect(secureIndicator.querySelector('.icon')).toHaveTextContent('🔒');

      const instantIndicator = screen.getByText(/Instant access/i).closest('.indicator');
      expect(instantIndicator.querySelector('.icon')).toHaveTextContent('⚡');

      const verifiedIndicator = screen.getByText(/Verified accounts/i).closest('.indicator');
      expect(verifiedIndicator.querySelector('.icon')).toHaveTextContent('✓');
    });
  });
});