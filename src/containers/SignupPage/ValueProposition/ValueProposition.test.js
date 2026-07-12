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

      expect(screen.getByText('ValueProposition.default.title')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.default.subtitle')).toBeInTheDocument();
    });

    it('renders default messaging when user type is undefined', () => {
      render(<ValueProposition userType={undefined} />);

      expect(screen.getByText('ValueProposition.default.title')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.default.subtitle')).toBeInTheDocument();
    });
  });

  describe('Customer value proposition', () => {
    it('renders customer-specific title and subtitle', () => {
      render(<ValueProposition userType="customer" />);

      expect(screen.getByText('ValueProposition.customer.title')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.customer.subtitle')).toBeInTheDocument();
    });

    it('renders customer value points with correct icons and text', () => {
      render(<ValueProposition userType="customer" />);

      // Check for value points text
      expect(screen.getByText('ValueProposition.customer.point1')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.customer.point2')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.customer.point3')).toBeInTheDocument();

      // Check for correct emojis/icons
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
      expect(screen.getByText('🔍')).toBeInTheDocument();
    });

    it('does not render customer social proof (feature currently disabled)', () => {
      const { container } = render(<ValueProposition userType="customer" />);

      // The socialProof block is commented out in ValueProposition.js pending
      // finalized copy, so it should not appear in the DOM.
      expect(container.querySelector('.socialProof')).not.toBeInTheDocument();
    });

    it('displays all three customer value points', () => {
      render(<ValueProposition userType="customer" />);

      const valuePoints = screen.getAllByText(/ValueProposition\.customer\.point[123]/);
      expect(valuePoints).toHaveLength(3);
    });
  });

  describe('Provider value proposition', () => {
    it('renders provider-specific title and subtitle', () => {
      render(<ValueProposition userType="provider" />);

      expect(screen.getByText('ValueProposition.provider.title')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.provider.subtitle')).toBeInTheDocument();
    });

    it('renders provider value points with correct icons and text', () => {
      render(<ValueProposition userType="provider" />);

      // Check for value points text
      expect(screen.getByText('ValueProposition.provider.point1')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.provider.point2')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.provider.point3')).toBeInTheDocument();

      // Check for correct emojis/icons
      expect(screen.getByText('💰')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('📈')).toBeInTheDocument();
    });

    it('does not render provider social proof (feature currently disabled)', () => {
      const { container } = render(<ValueProposition userType="provider" />);

      // The socialProof block is commented out in ValueProposition.js pending
      // finalized copy, so it should not appear in the DOM.
      expect(container.querySelector('.socialProof')).not.toBeInTheDocument();
    });

    it('displays all three provider value points', () => {
      render(<ValueProposition userType="provider" />);

      const valuePoints = screen.getAllByText(/ValueProposition\.provider\.point[123]/);
      expect(valuePoints).toHaveLength(3);
    });
  });

  describe('Animation and styling', () => {
    it('applies correct CSS classes for customer', () => {
      const { container } = render(<ValueProposition userType="customer" />);

      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.valuePoints')).toBeInTheDocument();
    });

    it('applies correct CSS classes for provider', () => {
      const { container } = render(<ValueProposition userType="provider" />);

      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.valuePoints')).toBeInTheDocument();
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
      expect(screen.getByText('ValueProposition.default.title')).toBeInTheDocument();
    });
  });

  describe('Responsive design elements', () => {
    it('renders H2 component for titles', () => {
      render(<ValueProposition userType="customer" />);

      // H2 should be rendered as heading level 2
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('ValueProposition.customer.title');
    });

    it('renders value points in proper structure', () => {
      render(<ValueProposition userType="customer" />);

      const valuePointsContainer = screen.getByText('ValueProposition.customer.point1').closest('.valuePoint');
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
      expect(heading).toHaveTextContent('ValueProposition.customer.title');
    });

    it('provides meaningful text content for all value points', () => {
      render(<ValueProposition userType="provider" />);

      // Each value point should have descriptive text
      expect(screen.getByText('ValueProposition.provider.point1')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.provider.point2')).toBeInTheDocument();
      expect(screen.getByText('ValueProposition.provider.point3')).toBeInTheDocument();
    });
  });
});