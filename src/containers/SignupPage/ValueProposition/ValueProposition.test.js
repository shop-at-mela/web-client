import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../../util/testHelpers';
import { fakeIntl } from '../../../util/testData';

import ValueProposition from './ValueProposition';

const { screen } = testingLibrary;

describe('ValueProposition', () => {
  describe('Default messaging (no user type)', () => {
    it('renders default value proposition when no user type is provided', () => {
      render(<ValueProposition userType={null} />);

      expect(screen.getByText(/Join our marketplace/i)).toBeInTheDocument();
      expect(screen.getByText(/Connect with authentic Indian products/i)).toBeInTheDocument();
    });

    it('renders default messaging when user type is undefined', () => {
      render(<ValueProposition userType={undefined} />);

      expect(screen.getByText(/Join our marketplace/i)).toBeInTheDocument();
      expect(screen.getByText(/Connect with authentic Indian products/i)).toBeInTheDocument();
    });
  });

  describe('Customer value proposition', () => {
    it('renders customer-specific title and subtitle', () => {
      render(<ValueProposition userType="customer" />);

      expect(screen.getByText(/Never Lose Track of Your Favorites/i)).toBeInTheDocument();
      expect(screen.getByText(/Save and organize the Indian products you love/i)).toBeInTheDocument();
    });

    it('renders customer value points with correct icons and text', () => {
      render(<ValueProposition userType="customer" />);

      // Check for value points text
      expect(screen.getByText(/Heart items to save for later/i)).toBeInTheDocument();
      expect(screen.getByText(/Build your personal wishlist/i)).toBeInTheDocument();
      expect(screen.getByText(/Never forget what you wanted/i)).toBeInTheDocument();

      // Check for correct emojis/icons
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('renders customer social proof', () => {
      render(<ValueProposition userType="customer" />);

      expect(screen.getByText(/XXX+ customers saving their favorites/i)).toBeInTheDocument();
    });

    it('displays all three customer value points', () => {
      render(<ValueProposition userType="customer" />);

      const valuePoints = screen.getAllByText(/Heart items|Build your|Never forget/);
      expect(valuePoints).toHaveLength(3);
    });
  });

  describe('Provider value proposition', () => {
    it('renders provider-specific title and subtitle', () => {
      render(<ValueProposition userType="provider" />);

      expect(screen.getByText(/Sell to US Indian Families/i)).toBeInTheDocument();
      expect(screen.getByText(/Reach customers who value authentic Indian products/i)).toBeInTheDocument();
    });

    it('renders provider value points with correct icons and text', () => {
      render(<ValueProposition userType="provider" />);

      // Check for value points text
      expect(screen.getByText(/Zero listing fees to start/i)).toBeInTheDocument();
      expect(screen.getByText(/Ready US customer base/i)).toBeInTheDocument();
      expect(screen.getByText(/Performance-based growth/i)).toBeInTheDocument();

      // Check for correct emojis/icons
      expect(screen.getByText('💰')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('📈')).toBeInTheDocument();
    });

    it('renders provider social proof', () => {
      render(<ValueProposition userType="provider" />);

      expect(screen.getByText(/YYY+ Indian brands growing their business/i)).toBeInTheDocument();
    });

    it('displays all three provider value points', () => {
      render(<ValueProposition userType="provider" />);

      const valuePoints = screen.getAllByText(/Zero listing|Ready US|Performance-based/);
      expect(valuePoints).toHaveLength(3);
    });
  });

  describe('Animation and styling', () => {
    it('applies correct CSS classes for customer', () => {
      const { container } = render(<ValueProposition userType="customer" />);

      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.valuePoints')).toBeInTheDocument();
      expect(container.querySelector('.socialProof')).toBeInTheDocument();
    });

    it('applies correct CSS classes for provider', () => {
      const { container } = render(<ValueProposition userType="provider" />);

      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.valuePoints')).toBeInTheDocument();
      expect(container.querySelector('.socialProof')).toBeInTheDocument();
    });
  });

  describe('Unknown user type handling', () => {
    it('returns null for unknown user type', () => {
      const { container } = render(<ValueProposition userType="unknown" />);

      expect(container.firstChild).toBeNull();
    });

    it('handles empty string user type', () => {
      const { container } = render(<ValueProposition userType="" />);

      // Should render default content for empty string
      expect(screen.getByText(/Join our marketplace/i)).toBeInTheDocument();
    });
  });

  describe('Responsive design elements', () => {
    it('renders H2 component for titles', () => {
      render(<ValueProposition userType="customer" />);

      // H2 should be rendered as heading level 2
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Never Lose Track/i);
    });

    it('renders value points in proper structure', () => {
      render(<ValueProposition userType="customer" />);

      const valuePointsContainer = screen.getByText(/Heart items to save for later/i).closest('.valuePoint');
      expect(valuePointsContainer).toBeInTheDocument();

      // Should have icon and text elements
      const icon = valuePointsContainer.querySelector('.icon');
      const text = valuePointsContainer.querySelector('.text');
      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure for screen readers', () => {
      render(<ValueProposition userType="customer" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/Never Lose Track of Your Favorites/i);
    });

    it('provides meaningful text content for all value points', () => {
      render(<ValueProposition userType="provider" />);

      // Each value point should have descriptive text
      expect(screen.getByText(/Zero listing fees to start/i)).toBeInTheDocument();
      expect(screen.getByText(/Ready US customer base/i)).toBeInTheDocument();
      expect(screen.getByText(/Performance-based growth/i)).toBeInTheDocument();
    });
  });
});