import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { ConfigurationProvider } from '../../../../context/configurationContext';
import { RouteConfigurationProvider } from '../../../../context/routeConfigurationContext';
import TopbarMobileMenu from './TopbarMobileMenu';

jest.mock('../../../../components', () => ({
  AvatarLarge: ({ user }) => <div data-testid="avatar">{user?.attributes?.profile?.firstName}</div>,
  ExternalLink: ({ href, children, className }) => <a href={href} className={className}>{children}</a>,
  InlineTextButton: ({ onClick, children }) => <button onClick={onClick}>{children}</button>,
  NamedLink: ({ name, children, className, to }) => (
    <a href={`/${name}`} className={className} data-testid={`link-${name}`}>
      {children}
    </a>
  ),
  NotificationBadge: ({ count }) => <span data-testid="notification-badge">{count}</span>,
}));

const mockRoutes = [
  { path: '/', name: 'LandingPage' },
  { path: '/signup', name: 'SignupPage' },
  { path: '/login', name: 'LoginPage' },
  { path: '/brands', name: 'BrandsPage' },
  { path: '/categories', name: 'CategoriesPage' },
  { path: '/s', name: 'SearchPage' },
  { path: '/inbox/:tab', name: 'InboxPage' },
  { path: '/listings', name: 'ManageListingsPage' },
  { path: '/saved', name: 'SavedPage' },
  { path: '/profile-settings', name: 'ProfileSettingsPage' },
  { path: '/account', name: 'AccountSettingsPage' },
  { path: '/l/new', name: 'NewListingPage' },
];

const mockMessages = {
  'TopbarMobileMenu.heroTitle': 'Discover Quality Indian Brands',
  'TopbarMobileMenu.heroSubtitle': 'Curated baby, home & fashion — quality-verified, shipped to the US',
  'TopbarMobileMenu.createAccount': 'Create Account',
  'TopbarMobileMenu.alreadyMember': 'Already a member?',
  'TopbarMobileMenu.loginLink': 'Log in',
  'TopbarMobileMenu.browseHeader': 'DISCOVER',
  'TopbarMobileMenu.allBrandsLink': 'All Brands',
  'TopbarMobileMenu.babyKidsLink': 'Baby & Kids',
  'TopbarMobileMenu.homeKitchenLink': 'Home & Kitchen',
  'TopbarMobileMenu.fashionLink': 'Fashion',
  'TopbarMobileMenu.allCategoriesLink': 'All Categories',
  'TopbarMobileMenu.partnerHeader': 'LIST YOUR BRAND ON MELA',
  'TopbarMobileMenu.partnerTagline': 'We partner with quality Indian brands to reach diaspora families in the US.',
  'TopbarMobileMenu.startSelling': 'Apply to Partner',
  'TopbarMobileMenu.greeting': 'Hello {displayName}',
  'TopbarMobileMenu.logoutLink': 'Log out',
  'TopbarMobileMenu.browseSection': 'BROWSE',
  'TopbarMobileMenu.accountSection': 'YOUR ACCOUNT',
  'TopbarMobileMenu.savedItemsLink': 'Saved items',
  'TopbarMobileMenu.inboxLink': 'Inbox',
  'TopbarMobileMenu.yourListingsLink': 'Your listings',
  'TopbarMobileMenu.profileSettingsLink': 'Profile settings',
  'TopbarMobileMenu.accountSettingsLink': 'Account settings',
  'TopbarMobileMenu.newListingLink': 'Post a new listing',
};

const mockConfig = { categoryConfiguration: { categories: [] } };

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={mockMessages}>
      <ConfigurationProvider value={mockConfig}>
        <RouteConfigurationProvider value={mockRoutes}>
          {children}
        </RouteConfigurationProvider>
      </ConfigurationProvider>
    </IntlProvider>
  </MemoryRouter>
);

const defaultUnauthProps = {
  isAuthenticated: false,
  currentPage: 'LandingPage',
  inboxTab: 'orders',
  currentUser: null,
  notificationCount: 0,
  customLinks: [],
  onLogout: jest.fn(),
  showCreateListingsLink: true,
};

const mockAuthUser = {
  attributes: {
    profile: {
      firstName: 'Priya',
      displayName: 'Priya S',
    },
  },
};

const defaultAuthProps = {
  ...defaultUnauthProps,
  isAuthenticated: true,
  currentUser: mockAuthUser,
};

// ─── Unauthenticated state ────────────────────────────────────────────────────

describe('TopbarMobileMenu — unauthenticated', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
  });

  it('renders discovery-positioned hero title and subtitle', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
    expect(screen.getByText('Discover Quality Indian Brands')).toBeInTheDocument();
    expect(screen.getByText(/curated baby, home & fashion/i)).toBeInTheDocument();
  });

  it('renders Create Account and Log in links', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('renders DISCOVER section header', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
    expect(screen.getByText('DISCOVER')).toBeInTheDocument();
  });

  it('renders all 5 discover nav links in correct order', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
    const links = ['All Brands', 'Baby & Kids', 'Home & Kitchen', 'Fashion', 'All Categories'];
    links.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders All Brands link pointing to BrandsPage', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
    expect(screen.getByTestId('link-BrandsPage')).toBeInTheDocument();
  });

  it('renders All Categories link pointing to CategoriesPage', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
    expect(screen.getByTestId('link-CategoriesPage')).toBeInTheDocument();
  });

  it('renders partner footer with updated brand partnership copy', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
    expect(screen.getByText('LIST YOUR BRAND ON MELA')).toBeInTheDocument();
    expect(screen.getByText(/we partner with quality indian brands/i)).toBeInTheDocument();
    expect(screen.getByText('Apply to Partner')).toBeInTheDocument();
  });

  it('does not render the empty brand logo placeholders', () => {
    const { container } = render(<TestWrapper><TopbarMobileMenu {...defaultUnauthProps} /></TestWrapper>);
    // featuredBrandsSection with empty logo divs should be gone
    expect(container.querySelector('.brandLogos')).toBeNull();
  });
});

// ─── Authenticated state ──────────────────────────────────────────────────────

describe('TopbarMobileMenu — authenticated', () => {
  it('renders without crashing', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultAuthProps} /></TestWrapper>);
  });

  it('renders greeting with user first name', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultAuthProps} /></TestWrapper>);
    expect(screen.getByText(/hello priya/i)).toBeInTheDocument();
  });

  it('renders BROWSE section header', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultAuthProps} /></TestWrapper>);
    expect(screen.getByText('BROWSE')).toBeInTheDocument();
  });

  it('renders YOUR ACCOUNT section header', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultAuthProps} /></TestWrapper>);
    expect(screen.getByText('YOUR ACCOUNT')).toBeInTheDocument();
  });

  it('renders discovery links in BROWSE section', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultAuthProps} /></TestWrapper>);
    expect(screen.getByText('All Brands')).toBeInTheDocument();
    expect(screen.getByText('Baby & Kids')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('renders Saved items in BROWSE section (not in account section)', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultAuthProps} /></TestWrapper>);
    expect(screen.getByText(/saved items/i)).toBeInTheDocument();
  });

  it('renders account links in YOUR ACCOUNT section', () => {
    render(<TestWrapper><TopbarMobileMenu {...defaultAuthProps} /></TestWrapper>);
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Profile settings')).toBeInTheDocument();
    expect(screen.getByText('Account settings')).toBeInTheDocument();
  });

  it('renders notification badge when notificationCount > 0', () => {
    render(
      <TestWrapper>
        <TopbarMobileMenu {...defaultAuthProps} notificationCount={3} />
      </TestWrapper>
    );
    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
  });

  it('does not render notification badge when notificationCount is 0', () => {
    render(
      <TestWrapper>
        <TopbarMobileMenu {...defaultAuthProps} notificationCount={0} />
      </TestWrapper>
    );
    expect(screen.queryByTestId('notification-badge')).toBeNull();
  });

  it('calls onLogout when Log out is clicked', () => {
    const onLogout = jest.fn();
    render(
      <TestWrapper>
        <TopbarMobileMenu {...defaultAuthProps} onLogout={onLogout} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText('Log out'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders Your listings link when showCreateListingsLink is true', () => {
    render(
      <TestWrapper>
        <TopbarMobileMenu {...defaultAuthProps} showCreateListingsLink={true} />
      </TestWrapper>
    );
    expect(screen.getByText('Your listings')).toBeInTheDocument();
  });

  it('does not render Your listings link when showCreateListingsLink is false', () => {
    render(
      <TestWrapper>
        <TopbarMobileMenu {...defaultAuthProps} showCreateListingsLink={false} />
      </TestWrapper>
    );
    expect(screen.queryByText('Your listings')).toBeNull();
  });
});
