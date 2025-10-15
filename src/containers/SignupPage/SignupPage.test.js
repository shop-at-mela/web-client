import React from 'react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { fakeIntl } from '../../util/testData';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';

import { SignupPageComponent } from './SignupPage';

const { screen, waitFor, userEvent, fireEvent } = testingLibrary;

// Mock NamedLink component
jest.mock('../../components/NamedLink/NamedLink', () => {
  return ({ children, className, name, ...props }) => (
    <a
      className={className}
      data-testid={`link-${name}`}
      {...props}
    >
      {children}
    </a>
  );
});

const noop = () => null;

const mockProps = {
  authInProgress: false,
  currentUser: null,
  isAuthenticated: false,
  scrollingDisabled: false,
  signupError: null,
  submitSignup: jest.fn(),
  onManageDisableScrolling: noop,

  // Router props
  location: {
    pathname: '/signup',
    state: null,
    search: ''
  },
  params: {},

  // Config context - mocked via provider
};

const mockConfig = {
  marketplaceName: 'Test Marketplace',
  user: {
    userFields: [],
    userTypes: [
      { userType: 'customer', label: 'Customer' },
      { userType: 'provider', label: 'Provider' }
    ]
  },
  branding: {
    brandImage: null
  }
};

const mockRouteConfiguration = [
  { path: '/signup', exact: true, name: 'SignupPage' },
  { path: '/login', exact: true, name: 'LoginPage' },
  { path: '/', exact: true, name: 'LandingPage' },
];

// Mock context providers
const TestWrapper = ({ children, config = mockConfig }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={{
      'SignupPage.alreadyHaveAccount': 'Already have an account?',
      'SignupPage.loginLinkText': 'Log in',
      'SignupPage.schemaTitle': 'Sign up - Test Marketplace',
      'SignupPage.schemaDescription': 'Join Test Marketplace today',
      'ValueProposition.customer.title': 'Never Lose Track of Your Favorites',
      'ValueProposition.customer.subtitle': 'Heart items to save for later',
      'ValueProposition.customer.point1': 'Heart items to save for later',
      'ProviderCTA.title': 'Want to sell products instead?',
      'ProviderCTA.buttonText': 'Sign up as a Brand',
      'TrustIndicators.secure': 'Secure signup',
      'TrustIndicators.instant': 'Instant access',
      'TrustIndicators.verified': 'Verified accounts',
    }}>
      <ConfigurationProvider value={config}>
        <RouteConfigurationProvider value={mockRouteConfiguration}>
          {children}
        </RouteConfigurationProvider>
      </ConfigurationProvider>
    </IntlProvider>
  </MemoryRouter>
);

describe('SignupPage', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('Customer signup flow (default)', () => {
    it('renders customer signup by default', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      // Should show customer value proposition
      expect(screen.getByText(/Never Lose Track of Your Favorites/i)).toBeInTheDocument();
      expect(screen.getByText(/Heart items to save for later/i)).toBeInTheDocument();

      // Should show provider CTA at bottom
      expect(screen.getByText(/Want to sell products instead/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign up as a Brand/i)).toBeInTheDocument();

      // Should NOT show back navigation
      expect(screen.queryByText(/Back to Customer Signup/i)).not.toBeInTheDocument();
    });

    it('shows "Start Saving Favorites" button for customers', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/Start Saving Favorites/i)).toBeInTheDocument();
    });

    it('navigates to provider signup when CTA is clicked', () => {
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      const providerCtaButton = screen.getByText(/Sign up as a Brand/i);
      fireEvent.click(providerCtaButton);

      expect(window.location.href).toBe('/signup/provider');
    });
  });

  describe('Provider signup flow', () => {
    const providerProps = {
      ...mockProps,
      params: { userType: 'provider' }
    };

    it('renders provider signup when userType is provider', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...providerProps} />
        </TestWrapper>
      );

      // Should show back navigation for provider mode
      expect(screen.getByText(/Back to Customer Signup/i)).toBeInTheDocument();

      // Should NOT show provider CTA (since we're already in provider mode)
      expect(screen.queryByText(/Want to sell products instead/i)).not.toBeInTheDocument();
    });

    it('navigates back to customer signup when back button is clicked', () => {
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      render(
        <TestWrapper>
          <SignupPageComponent {...providerProps} />
        </TestWrapper>
      );

      const backButton = screen.getByText(/Back to Customer Signup/i);
      fireEvent.click(backButton);

      expect(window.location.href).toBe('/signup');
    });
  });

  describe('Form submission', () => {
    it('renders signup form', () => {
      const submitSignupMock = jest.fn();
      const propsWithMockSubmit = {
        ...mockProps,
        submitSignup: submitSignupMock
      };

      render(
        <TestWrapper>
          <SignupPageComponent {...propsWithMockSubmit} />
        </TestWrapper>
      );

      // Should render a form (SignupForm component is rendered)
      expect(document.querySelector('form') || document.querySelector('[data-testid*="form"]')).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('renders without error when no signup error provided', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      // Should render successfully without any error messages
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('displays signup error when provided', () => {
      const propsWithError = {
        ...mockProps,
        signupError: {
          type: 'error',
          name: 'SignupError'
        }
      };

      const TestWrapperWithErrorMessage = ({ children, config = mockConfig }) => (
        <MemoryRouter>
          <IntlProvider locale="en" messages={{
            'SignupPage.alreadyHaveAccount': 'Already have an account?',
            'SignupPage.loginLinkText': 'Log in',
            'SignupPage.signupFailed': 'Signup failed. Please try again.',
            'SignupPage.signupFailedEmailAlreadyTaken': 'An account with this email address already exists.',
            'ValueProposition.customer.title': 'Never Lose Track of Your Favorites',
          }}>
            <ConfigurationProvider value={config}>
              <RouteConfigurationProvider value={mockRouteConfiguration}>
                {children}
              </RouteConfigurationProvider>
            </ConfigurationProvider>
          </IntlProvider>
        </MemoryRouter>
      );

      render(
        <TestWrapperWithErrorMessage>
          <SignupPageComponent {...propsWithError} />
        </TestWrapperWithErrorMessage>
      );

      expect(screen.getByText(/Signup failed/i)).toBeInTheDocument();
    });
  });

  describe('Authentication redirects', () => {
    it('does not render signup form for authenticated users', () => {
      const authenticatedProps = {
        ...mockProps,
        isAuthenticated: true,
        currentUser: { id: '123', attributes: {} }
      };

      const { container } = render(
        <TestWrapper>
          <SignupPageComponent {...authenticatedProps} />
        </TestWrapper>
      );

      // Component should render redirect, not the signup content
      expect(container.querySelector('.contentContainer')).not.toBeInTheDocument();
    });
  });

  describe('Trust indicators', () => {
    it('renders trust indicators', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/Secure signup/i)).toBeInTheDocument();
      expect(screen.getByText(/Instant access/i)).toBeInTheDocument();
      expect(screen.getByText(/Verified accounts/i)).toBeInTheDocument();
    });
  });

  describe('Login navigation', () => {
    it('shows login links at both top and bottom of page', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      // Should have two login links (top and bottom)
      const loginLinks = screen.getAllByTestId('link-LoginPage');
      expect(loginLinks).toHaveLength(2);

      // Both should have the same text
      expect(screen.getAllByText(/Log in/i)).toHaveLength(2);
    });

    it('shows "Already have an account?" text for both login sections', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      // Should have two instances of the "Already have an account?" text
      const alreadyHaveAccountTexts = screen.getAllByText(/Already have an account/i);
      expect(alreadyHaveAccountTexts).toHaveLength(2);
    });

    it('renders top login section with correct styling class', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      const topLoginSection = document.querySelector('.loginSectionTop');
      expect(topLoginSection).toBeInTheDocument();
    });

    it('renders bottom login section with correct styling class', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      const bottomLoginSection = document.querySelector('.loginSection');
      expect(bottomLoginSection).toBeInTheDocument();
    });

    it('positions top login link after value proposition', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      const topLoginSection = document.querySelector('.loginSectionTop');
      const valueProposition = screen.getByText(/Never Lose Track of Your Favorites/i);

      expect(topLoginSection).toBeInTheDocument();
      expect(valueProposition).toBeInTheDocument();

      // Top login section should come after value proposition in DOM order
      const allElements = Array.from(document.querySelectorAll('*'));
      const valuePropositionIndex = allElements.findIndex(el => el.textContent?.includes('Never Lose Track of Your Favorites'));
      const topLoginIndex = allElements.indexOf(topLoginSection);

      expect(topLoginIndex).toBeGreaterThan(valuePropositionIndex);
    });
  });
});