import React from 'react';
import '@testing-library/jest-dom';
import { renderWithProviders as render, testingLibrary, getRouteConfiguration } from '../../util/testHelpers';
import BrandsPage from './BrandsPage';

const { waitFor } = testingLibrary;

jest.mock('../TopbarContainer/TopbarContainer', () => () => <div data-testid="topbar" />);
jest.mock('../FooterContainer/FooterContainer', () => () => <div data-testid="footer" />);

describe('BrandsPage', () => {
  it('passes its own meta description to the page (not the site-wide default)', async () => {
    render(<BrandsPage />, {
      routeConfiguration: getRouteConfiguration(),
    });

    await waitFor(() => {
      expect(document.querySelector('meta[name="description"]')?.content).toBe(
        'BrandsPage.description'
      );
      expect(document.title).toBe('BrandsPage.title');
    });
  });
});
