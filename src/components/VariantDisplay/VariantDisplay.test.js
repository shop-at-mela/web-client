import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VariantDisplay from './VariantDisplay';

describe('VariantDisplay', () => {
  describe('null / empty cases', () => {
    it('renders nothing when variantsString is empty string', () => {
      const { container } = render(<VariantDisplay variantsString="" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when variantsString is null', () => {
      const { container } = render(<VariantDisplay variantsString={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when variantsString is undefined', () => {
      const { container } = render(<VariantDisplay />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when variantsString is whitespace only', () => {
      const { container } = render(<VariantDisplay variantsString="   " />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when all dimensions have no values', () => {
      const { container } = render(<VariantDisplay variantsString="Size:" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('single dimension', () => {
    it('renders size dimension with label "Sizes:"', () => {
      render(<VariantDisplay variantsString="Size:S,M,L,XL" />);
      expect(screen.getByText('Sizes:')).toBeInTheDocument();
      expect(screen.getByText('S, M, L, XL')).toBeInTheDocument();
    });

    it('renders color dimension with label "Colors:"', () => {
      render(<VariantDisplay variantsString="Color:Red,Blue,Green" />);
      expect(screen.getByText('Colors:')).toBeInTheDocument();
      expect(screen.getByText('Red, Blue, Green')).toBeInTheDocument();
    });

    it('renders unknown dimension label unchanged', () => {
      render(<VariantDisplay variantsString="Material:Cotton,Linen" />);
      expect(screen.getByText('Material:')).toBeInTheDocument();
      expect(screen.getByText('Cotton, Linen')).toBeInTheDocument();
    });

    it('renders single value without trailing comma', () => {
      render(<VariantDisplay variantsString="Size:S" />);
      expect(screen.getByText('S')).toBeInTheDocument();
    });
  });

  describe('multiple dimensions', () => {
    it('renders size and color dimensions', () => {
      render(<VariantDisplay variantsString="Size:S,M,L,XL|Color:Red,Blue,Green" />);
      expect(screen.getByText('Sizes:')).toBeInTheDocument();
      expect(screen.getByText('S, M, L, XL')).toBeInTheDocument();
      expect(screen.getByText('Colors:')).toBeInTheDocument();
      expect(screen.getByText('Red, Blue, Green')).toBeInTheDocument();
    });

    it('renders exactly one row per dimension', () => {
      render(<VariantDisplay variantsString="Size:23,24,25|Color:Ivory,Sage" />);
      const labels = screen.getAllByText(/:/);
      expect(labels).toHaveLength(2);
    });
  });

  describe('parsing edge cases', () => {
    it('trims whitespace from values', () => {
      render(<VariantDisplay variantsString="Size: S , M , L " />);
      expect(screen.getByText('S, M, L')).toBeInTheDocument();
    });

    it('filters out empty values', () => {
      render(<VariantDisplay variantsString="Size:S,,M,,L" />);
      expect(screen.getByText('S, M, L')).toBeInTheDocument();
    });

    it('skips dimension entries that have no colon separator', () => {
      render(<VariantDisplay variantsString="Size:S,M,L|MalformedEntry|Color:Red" />);
      expect(screen.getByText('Sizes:')).toBeInTheDocument();
      expect(screen.getByText('Colors:')).toBeInTheDocument();
      // MalformedEntry has no colon → not rendered
      expect(screen.queryByText('MalformedEntry')).not.toBeInTheDocument();
    });
  });
});
