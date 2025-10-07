import React from 'react';

/**
 * Desktop-only layout utilities for dynamic width management
 * These utilities help detect when OrderPanel constraints should be relaxed
 * and content can expand to use available space.
 *
 * IMPORTANT: All functionality is desktop-only (1024px+) to preserve mobile layout
 */

/**
 * Checks if we're on desktop viewport
 * @returns {boolean} True if viewport is 1024px or wider
 */
export const isDesktopViewport = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
};

/**
 * Desktop-only layout manager for dynamic width allocation
 * Monitors OrderPanel height and adjusts content layout accordingly
 */
export class DesktopLayoutManager {
  constructor() {
    this.observers = new Set();
    this.contentSections = new Set();
    this.orderPanel = null;
    this.isActive = false;

    // Only initialize on desktop
    if (isDesktopViewport()) {
      this.init();
    }

    // Re-check on resize, but only activate/deactivate on desktop threshold
    this.handleResize = this.handleResize.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
    }
  }

  init() {
    this.isActive = true;
    this.setupIntersectionObserver();
  }

  handleResize() {
    const shouldBeActive = isDesktopViewport();

    if (shouldBeActive && !this.isActive) {
      // Crossed into desktop - activate
      this.init();
    } else if (!shouldBeActive && this.isActive) {
      // Crossed out of desktop - deactivate and reset
      this.cleanup();
      this.resetContentSections();
    }
  }

  setupIntersectionObserver() {
    if (!this.isActive) return;

    // Observer for when OrderPanel exits viewport or becomes non-constraining
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.orderPanel) {
            this.handleOrderPanelVisibility(entry);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.5, 1.0]
      }
    );

    // Observer for content sections entering viewport
    this.contentObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.handleContentSectionVisibility(entry);
        });
      },
      {
        root: null,
        rootMargin: '200px 0px',
        threshold: 0
      }
    );
  }

  /**
   * Register OrderPanel element for monitoring
   * @param {HTMLElement} element - OrderPanel DOM element
   */
  registerOrderPanel(element) {
    if (!this.isActive || !element) return;

    this.orderPanel = element;
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  /**
   * Register content section for dynamic width management
   * @param {HTMLElement} element - Content section DOM element
   * @param {Object} options - Configuration options
   * @param {string} options.mode - 'adaptive' or 'fullWidth'
   */
  registerContentSection(element, options = { mode: 'adaptive' }) {
    if (!this.isActive || !element) return;

    const sectionData = { element, options };
    this.contentSections.add(sectionData);

    if (this.contentObserver) {
      this.contentObserver.observe(element);
    }

    // Apply initial classes
    this.applyContentSectionClasses(sectionData);
  }

  handleOrderPanelVisibility(entry) {
    const isOrderPanelConstraining = entry.intersectionRatio > 0.1;

    // Update all content sections based on OrderPanel constraint status
    this.contentSections.forEach(sectionData => {
      this.updateContentSectionWidth(sectionData, !isOrderPanelConstraining);
    });
  }

  handleContentSectionVisibility(entry) {
    // Additional logic can be added here for content-specific behavior
    // For now, rely on OrderPanel constraint detection
  }

  applyContentSectionClasses(sectionData) {
    const { element, options } = sectionData;

    if (options.mode === 'fullWidth') {
      element.classList.add('fullWidthContentSection');
    } else if (options.mode === 'adaptive') {
      element.classList.add('adaptiveWidthContentSection');
    }
  }

  updateContentSectionWidth(sectionData, shouldExpand) {
    const { element, options } = sectionData;

    if (options.mode === 'adaptive') {
      if (shouldExpand) {
        element.classList.add('expandedWidth');
      } else {
        element.classList.remove('expandedWidth');
      }
    }
    // fullWidth sections always stay full width
  }

  resetContentSections() {
    this.contentSections.forEach(sectionData => {
      const { element } = sectionData;
      element.classList.remove('expandedWidth', 'fullWidthContentSection', 'adaptiveWidthContentSection');
    });
  }

  cleanup() {
    this.isActive = false;

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    if (this.contentObserver) {
      this.contentObserver.disconnect();
    }

    this.contentSections.clear();
    this.orderPanel = null;
  }

  destroy() {
    this.cleanup();

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
  }
}

/**
 * React hook for desktop layout management
 * Returns layout manager instance and helper functions
 */
export const useDesktopLayoutManager = () => {
  const [layoutManager] = React.useState(() => new DesktopLayoutManager());

  React.useEffect(() => {
    return () => {
      layoutManager.destroy();
    };
  }, [layoutManager]);

  return {
    registerOrderPanel: (element) => layoutManager.registerOrderPanel(element),
    registerContentSection: (element, options) => layoutManager.registerContentSection(element, options),
    layoutManager,
    isDesktop: isDesktopViewport()
  };
};

// For non-React usage
export default DesktopLayoutManager;