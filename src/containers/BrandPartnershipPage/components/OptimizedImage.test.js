import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import OptimizedImage from './OptimizedImage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn()
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver
});

const defaultProps = {
  src: '/test-image.jpg',
  alt: 'Test image',
  width: 400,
  height: 300
};

describe('OptimizedImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIntersectionObserver.mockClear();
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn()
    });
  });

  describe('Basic Rendering', () => {
    it('renders container div with correct dimensions', () => {
      const { container } = render(<OptimizedImage {...defaultProps} />);

      const containerDiv = container.firstChild;
      expect(containerDiv).toBeInTheDocument();
      expect(containerDiv).toHaveStyle({
        width: '400px',
        height: '300px'
      });
    });

    it('applies custom className when provided', () => {
      const { container } = render(
        <OptimizedImage {...defaultProps} className="custom-image-class" />
      );

      expect(container.firstChild).toHaveClass('custom-image-class');
    });

    it('uses auto dimensions when width/height not provided', () => {
      const propsWithoutDimensions = { ...defaultProps };
      delete propsWithoutDimensions.width;
      delete propsWithoutDimensions.height;

      const { container } = render(<OptimizedImage {...propsWithoutDimensions} />);

      const containerDiv = container.firstChild;
      expect(containerDiv).toHaveStyle({
        width: 'auto',
        height: 'auto'
      });
    });
  });

  describe('Priority Loading', () => {
    it('renders image immediately when priority is true', () => {
      render(<OptimizedImage {...defaultProps} priority={true} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByAltText('Test image')).toBeInTheDocument();
    });

    it('sets loading="eager" when priority is true', () => {
      render(<OptimizedImage {...defaultProps} priority={true} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('does not set up IntersectionObserver when priority is true', () => {
      render(<OptimizedImage {...defaultProps} priority={true} />);

      expect(mockIntersectionObserver).not.toHaveBeenCalled();
    });
  });

  describe('Lazy Loading', () => {
    it('sets up IntersectionObserver for lazy loading by default', () => {
      render(<OptimizedImage {...defaultProps} />);

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    });

    it('does not render image initially without priority', () => {
      render(<OptimizedImage {...defaultProps} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders image after intersection observer triggers', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();

      // Simulate intersection
      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });
    });

    it('sets loading="lazy" for non-priority images', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} />);

      // Simulate intersection
      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  describe('WebP Support', () => {
    it('generates WebP source for supported formats', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} src="/test-image.jpg" />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const picture = screen.getByRole('img').closest('picture');
        const webpSource = picture.querySelector('source[type="image/webp"]');
        expect(webpSource).toBeInTheDocument();
        expect(webpSource).toHaveAttribute('srcSet', '/test-image.webp');
      });
    });

    it('uses original src for WebP images', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} src="/test-image.webp" />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const picture = screen.getByRole('img').closest('picture');
        const webpSource = picture.querySelector('source[type="image/webp"]');
        expect(webpSource).toHaveAttribute('srcSet', '/test-image.webp');
      });
    });

    it('uses original src for external URLs', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} src="https://example.com/image.jpg" />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const picture = screen.getByRole('img').closest('picture');
        const webpSource = picture.querySelector('source[type="image/webp"]');
        expect(webpSource).toHaveAttribute('srcSet', 'https://example.com/image.jpg');
      });
    });

    it('handles different image formats correctly', async () => {
      const formats = [
        { src: '/test.jpg', expected: '/test.webp' },
        { src: '/test.jpeg', expected: '/test.webp' },
        { src: '/test.png', expected: '/test.webp' },
        { src: '/test.JPG', expected: '/test.webp' },
        { src: '/test.PNG', expected: '/test.webp' }
      ];

      for (const format of formats) {
        let intersectionCallback;
        mockIntersectionObserver.mockImplementation((callback) => {
          intersectionCallback = callback;
          return {
            observe: jest.fn(),
            disconnect: jest.fn(),
            unobserve: jest.fn()
          };
        });

        const { unmount } = render(<OptimizedImage {...defaultProps} src={format.src} />);

        intersectionCallback([{ isIntersecting: true }]);

        await waitFor(() => {
          const picture = screen.getByRole('img').closest('picture');
          const webpSource = picture.querySelector('source[type="image/webp"]');
          expect(webpSource).toHaveAttribute('srcSet', format.expected);
        });

        unmount();
      }
    });
  });

  describe('Loading States', () => {
    it('shows loading placeholder initially', () => {
      const { container } = render(<OptimizedImage {...defaultProps} priority={true} />);

      // Check for shimmer loading placeholder
      const loadingDiv = container.querySelector('div[style*="shimmer"]');
      expect(loadingDiv).toBeInTheDocument();
    });

    it('removes loading placeholder after image loads', async () => {
      const { container } = render(<OptimizedImage {...defaultProps} priority={true} />);

      const img = screen.getByRole('img');

      // Initially has loading placeholder
      let loadingDiv = container.querySelector('div[style*="shimmer"]');
      expect(loadingDiv).toBeInTheDocument();

      // Simulate image load
      fireEvent.load(img);

      await waitFor(() => {
        loadingDiv = container.querySelector('div[style*="shimmer"]');
        expect(loadingDiv).not.toBeInTheDocument();
      });
    });

    it('transitions opacity on image load', async () => {
      render(<OptimizedImage {...defaultProps} priority={true} />);

      const img = screen.getByRole('img');

      // Initially has opacity 0
      expect(img).toHaveStyle({ opacity: '0' });

      // Simulate image load
      fireEvent.load(img);

      await waitFor(() => {
        expect(img).toHaveStyle({ opacity: '1' });
      });
    });

    it('changes background color after load', async () => {
      const { container } = render(<OptimizedImage {...defaultProps} priority={true} />);

      const containerDiv = container.firstChild;
      const img = screen.getByRole('img');

      // Initially has gray background
      expect(containerDiv).toHaveStyle({ backgroundColor: '#f0f0f0' });

      // Simulate image load
      fireEvent.load(img);

      await waitFor(() => {
        expect(containerDiv).toHaveStyle({ backgroundColor: 'transparent' });
      });
    });
  });

  describe('Image Attributes', () => {
    it('sets correct image attributes', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', '/test-image.jpg');
        expect(img).toHaveAttribute('alt', 'Test image');
        expect(img).toHaveAttribute('width', '400');
        expect(img).toHaveAttribute('height', '300');
        expect(img).toHaveAttribute('decoding', 'async');
      });
    });

    it('passes through additional props to img element', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(
        <OptimizedImage
          {...defaultProps}
          data-testid="custom-image"
          title="Custom title"
        />
      );

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('data-testid', 'custom-image');
        expect(img).toHaveAttribute('title', 'Custom title');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing src gracefully', () => {
      const propsWithoutSrc = { ...defaultProps };
      delete propsWithoutSrc.src;

      expect(() => {
        render(<OptimizedImage {...propsWithoutSrc} priority={true} />);
      }).not.toThrow();
    });

    it('handles empty src gracefully', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} src="" />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const picture = screen.getByRole('img').closest('picture');
        const webpSource = picture.querySelector('source[type="image/webp"]');
        expect(webpSource).toHaveAttribute('srcSet', '');
      });
    });

    it('handles IntersectionObserver not being available', () => {
      // Temporarily remove IntersectionObserver
      const originalIO = window.IntersectionObserver;
      delete window.IntersectionObserver;

      expect(() => {
        render(<OptimizedImage {...defaultProps} />);
      }).toThrow();

      // Restore IntersectionObserver
      window.IntersectionObserver = originalIO;
    });
  });

  describe('Cleanup', () => {
    it('disconnects IntersectionObserver on unmount', () => {
      const mockDisconnect = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        disconnect: mockDisconnect,
        unobserve: jest.fn()
      });

      const { unmount } = render(<OptimizedImage {...defaultProps} />);

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('disconnects observer after intersection', async () => {
      const mockDisconnect = jest.fn();
      let intersectionCallback;

      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: mockDisconnect,
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} />);

      // Simulate intersection
      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('includes CSS keyframes for shimmer animation', () => {
      const { container } = render(<OptimizedImage {...defaultProps} priority={true} />);

      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
      expect(style.textContent).toContain('@keyframes shimmer');
      expect(style.textContent).toContain('background-position');
    });

    it('uses responsive image styling', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveStyle({
          width: '100%',
          height: 'auto'
        });
      });
    });

    it('has smooth transitions for loading states', async () => {
      const { container } = render(<OptimizedImage {...defaultProps} priority={true} />);

      const containerDiv = container.firstChild;
      const img = screen.getByRole('img');

      expect(containerDiv).toHaveStyle({ transition: 'background-color 0.3s ease' });
      expect(img).toHaveStyle({ transition: 'opacity 0.3s ease' });
    });
  });

  describe('Accessibility', () => {
    it('maintains alt text for screen readers', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      render(<OptimizedImage {...defaultProps} alt="Descriptive alt text" />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAccessibleName('Descriptive alt text');
      });
    });

    it('handles missing alt text gracefully', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      const propsWithoutAlt = { ...defaultProps };
      delete propsWithoutAlt.alt;

      render(<OptimizedImage {...propsWithoutAlt} />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very large dimensions', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
          width={9999}
          height={9999}
        />
      );

      const containerDiv = container.firstChild;
      expect(containerDiv).toHaveStyle({
        width: '9999px',
        height: '9999px'
      });
    });

    it('handles string dimensions', () => {
      const { container } = render(
        <OptimizedImage
          {...defaultProps}
          width="100%"
          height="50vh"
        />
      );

      const containerDiv = container.firstChild;
      expect(containerDiv).toHaveStyle({
        width: '100%',
        height: '50vh'
      });
    });

    it('handles complex file names', async () => {
      let intersectionCallback;
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
          unobserve: jest.fn()
        };
      });

      const complexSrc = '/path/to/image-with-dashes_and_underscores.complex.ext.jpg';
      render(<OptimizedImage {...defaultProps} src={complexSrc} />);

      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const picture = screen.getByRole('img').closest('picture');
        const webpSource = picture.querySelector('source[type="image/webp"]');
        expect(webpSource).toHaveAttribute('srcSet', '/path/to/image-with-dashes_and_underscores.complex.ext.webp');
      });
    });
  });

  describe('Integration', () => {
    it('works correctly when used multiple times on the same page', () => {
      render(
        <div>
          <OptimizedImage {...defaultProps} src="/image1.jpg" alt="Image 1" />
          <OptimizedImage {...defaultProps} src="/image2.jpg" alt="Image 2" priority={true} />
          <OptimizedImage {...defaultProps} src="/image3.jpg" alt="Image 3" />
        </div>
      );

      // Priority image should be visible immediately
      expect(screen.getByAltText('Image 2')).toBeInTheDocument();

      // Non-priority images should not be visible initially
      expect(screen.queryByAltText('Image 1')).not.toBeInTheDocument();
      expect(screen.queryByAltText('Image 3')).not.toBeInTheDocument();
    });
  });
});