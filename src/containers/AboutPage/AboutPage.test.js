import React from 'react';
import '@testing-library/jest-dom';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
} from '../../util/testHelpers';
import { matchPathname } from '../../util/routes';
import AboutPage, { PAGE_TITLE, PAGE_DESCRIPTION } from './AboutPage';

const { screen, waitFor } = testingLibrary;

jest.mock('../TopbarContainer/TopbarContainer', () => () => <div data-testid="topbar" />);
jest.mock('../FooterContainer/FooterContainer', () => () => <div data-testid="footer" />);

describe('AboutPage', () => {
  it('renders one h1 and the page title and description', async () => {
    render(<AboutPage />, { routeConfiguration: getRouteConfiguration() });

    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Indian brands, found for you'
    );
    await waitFor(() => {
      expect(document.title).toBe(PAGE_TITLE);
      expect(document.querySelector('meta[name="description"]')?.content).toBe(PAGE_DESCRIPTION);
    });
  });

  it('names the operator and links the contact email', () => {
    render(<AboutPage />, { routeConfiguration: getRouteConfiguration() });

    expect(screen.getByText(/run by Sanjot Sawhney/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'shopatmela@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:shopatmela@gmail.com'
    );
  });

  it('keeps title and description within search-snippet limits', () => {
    expect(PAGE_TITLE.length).toBeLessThanOrEqual(60);
    expect(PAGE_DESCRIPTION.length).toBeLessThanOrEqual(155);
  });

  it('wins the /p/about route over the CMS page', () => {
    const [match] = matchPathname('/p/about', getRouteConfiguration());
    expect(match.route.name).toBe('AboutPage');
    const [other] = matchPathname('/p/some-other-page', getRouteConfiguration());
    expect(other.route.name).toBe('CMSPage');
  });
});
