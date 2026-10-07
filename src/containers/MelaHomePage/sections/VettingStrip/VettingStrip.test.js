import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

jest.mock('../../../../config/configBrands', () => ({
  getAllBrandIds: () => Array.from({ length: 19 }, (_, i) => `brand-${i}`),
}));

jest.mock('../../../../util/analytics/vettingStrip', () => ({
  pushVettingStripView: jest.fn(),
  pushVettingStripClick: jest.fn(),
}));

import VettingStrip from './VettingStrip';
import { pushVettingStripView, pushVettingStripClick } from '../../../../util/analytics/vettingStrip';

const mockMessages = {
  'VettingStrip.brandsVetted': '{count} brands, hand vetted',
  'VettingStrip.cards': 'US cards verified',
  'VettingStrip.howWeVet': 'How we vet →',
};

const TestWrapper = ({ children }) => (
  <IntlProvider locale="en" messages={mockMessages}>
    {children}
  </IntlProvider>
);

describe('VettingStrip', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the live brand count and trust items without a shipping claim', () => {
    render(
      <TestWrapper>
        <VettingStrip />
      </TestWrapper>
    );

    expect(screen.getByText('19 brands, hand vetted')).toBeInTheDocument();
    // The blanket shipping claim was removed (false while a brand is live that does not ship to the US)
    expect(screen.queryByText(/50 states/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ship/i)).not.toBeInTheDocument();
    expect(screen.getByText('US cards verified')).toBeInTheDocument();
    expect(screen.getByText('How we vet →')).toBeInTheDocument();
  });

  it('fires vetting_strip_click and scrolls to the vetting section id on click', () => {
    document.body.innerHTML = '<div id="how-we-vet"></div>';
    const scrollIntoViewMock = jest.fn();
    document.getElementById('how-we-vet').scrollIntoView = scrollIntoViewMock;

    render(
      <TestWrapper>
        <VettingStrip vettingSectionId="how-we-vet" />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('How we vet →'));

    expect(pushVettingStripClick).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('fires vetting_strip_view once when the strip intersects the viewport', () => {
    let capturedCallback;
    const disconnect = jest.fn();
    global.IntersectionObserver = jest.fn(callback => {
      capturedCallback = callback;
      return { observe: jest.fn(), disconnect };
    });

    render(
      <TestWrapper>
        <VettingStrip />
      </TestWrapper>
    );

    capturedCallback([{ isIntersecting: true }]);
    capturedCallback([{ isIntersecting: true }]);

    expect(pushVettingStripView).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalled();
  });
});
