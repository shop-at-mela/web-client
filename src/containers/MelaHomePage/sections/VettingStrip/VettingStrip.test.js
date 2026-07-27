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
  'VettingStrip.shipping': 'Ship to all 50 states',
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

  it('renders the live brand count and static trust items', () => {
    render(
      <TestWrapper>
        <VettingStrip />
      </TestWrapper>
    );

    expect(screen.getByText('19 brands, hand vetted')).toBeInTheDocument();
    expect(screen.getByText('Ship to all 50 states')).toBeInTheDocument();
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
