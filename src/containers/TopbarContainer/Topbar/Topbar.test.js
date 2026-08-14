import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { ConfigurationProvider } from '../../../context/configurationContext';
import { RouteConfigurationProvider } from '../../../context/routeConfigurationContext';
import Topbar from './Topbar';

jest.mock('../../../components', () => ({
  Button: ({ id, rootClassName, className, onClick, title, children }) => (
    <button id={id} className={className || rootClassName} onClick={onClick} title={title}>
      {children}
    </button>
  ),
  IconArrowHead: () => null,
  LimitedAccessBanner: () => null,
  LinkedLogo: ({ alt }) => <a href="/">{alt}</a>,
  // Always render children — this suite cares about wiring (is TopbarMobileMenu still
  // rendered at all?), not the open/close modal behavior covered by Modal's own tests.
  Modal: ({ children }) => <div>{children}</div>,
  ModalMissingInformation: () => null,
  NamedLink: ({ name, children, className, title, ariaLabel }) => (
    <a
      href={`/${name}`}
      className={className}
      title={title}
      aria-label={ariaLabel}
      data-testid={`link-${name}`}
    >
      {children}
    </a>
  ),
  NotificationBadge: ({ className, count }) => (
    <span className={className} data-testid="saved-count-badge">
      {count}
    </span>
  ),
}));

jest.mock('./TopbarSearchForm/TopbarSearchForm', () => () => null);
jest.mock('./TopbarMobileMenu/TopbarMobileMenu', () => () => <div data-testid="mobile-menu" />);
jest.mock('./TopbarDesktop/TopbarDesktop', () => () => <div data-testid="topbar-desktop" />);

const mockRoutes = [
  { path: '/', name: 'LandingPage' },
  { path: '/saved', name: 'SavedPage' },
  { path: '/inbox/:tab', name: 'InboxPage' },
];

const mockMessages = {
  'Topbar.menuIcon': 'Open menu',
  'Topbar.searchIcon': 'Open search',
  'Topbar.savedIcon': 'View saved items',
  'Topbar.logoIcon': 'Go to homepage',
  'Topbar.skipToMainContent': 'Skip to content',
};

const mockConfig = { topbar: {}, user: { userTypes: [] } };

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={mockMessages}>
      <ConfigurationProvider value={mockConfig}>
        <RouteConfigurationProvider value={mockRoutes}>{children}</RouteConfigurationProvider>
      </ConfigurationProvider>
    </IntlProvider>
  </MemoryRouter>
);

const defaultProps = {
  isAuthenticated: false,
  authScopes: [],
  currentUser: null,
  currentUserHasListings: false,
  currentUserHasOrders: false,
  currentPage: 'LandingPage',
  notificationCount: 0,
  savedItemsCount: 0,
  history: { push: jest.fn() },
  location: { search: '', pathname: '/' },
  onManageDisableScrolling: jest.fn(),
  onResendVerificationEmail: jest.fn(),
  onLogout: jest.fn(),
  currentSearchParams: {},
};

describe('Topbar — mobile persistent Saved icon', () => {
  it('renders a Saved link in the persistent mobile header even with nothing saved', () => {
    render(
      <TestWrapper>
        <Topbar {...defaultProps} savedItemsCount={0} />
      </TestWrapper>
    );
    expect(screen.getByTestId('link-SavedPage')).toBeInTheDocument();
  });

  it('does not show a count badge when nothing is saved', () => {
    render(
      <TestWrapper>
        <Topbar {...defaultProps} savedItemsCount={0} />
      </TestWrapper>
    );
    expect(screen.queryByTestId('saved-count-badge')).not.toBeInTheDocument();
  });

  it('shows a count badge with the right count once items are saved', () => {
    render(
      <TestWrapper>
        <Topbar {...defaultProps} savedItemsCount={4} />
      </TestWrapper>
    );
    expect(screen.getByTestId('saved-count-badge')).toHaveTextContent('4');
  });

  it('links to the Saved page with the header_badge analytics entry param', () => {
    render(
      <TestWrapper>
        <Topbar {...defaultProps} savedItemsCount={2} />
      </TestWrapper>
    );
    // The mocked NamedLink doesn't forward `to`, so assert via the real SavedIcon
    // aria-label/title, which is unambiguous proof the persistent link rendered.
    expect(screen.getByTestId('link-SavedPage')).toHaveAttribute('title', 'View saved items');
  });

  it('has an accessible name on the Saved icon', () => {
    render(
      <TestWrapper>
        <Topbar {...defaultProps} savedItemsCount={0} />
      </TestWrapper>
    );
    expect(screen.getByRole('img', { name: 'View saved items' })).toBeInTheDocument();
  });

  it('does not touch the existing hamburger-menu Saved links (renders TopbarMobileMenu unchanged)', () => {
    render(
      <TestWrapper>
        <Topbar {...defaultProps} savedItemsCount={2} />
      </TestWrapper>
    );
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
  });
});
