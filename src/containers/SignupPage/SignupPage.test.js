import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';
import { fakeIntl } from '../../util/testData';

import { SignupPageComponent } from './SignupPage';

const { screen, waitFor, userEvent, fireEvent } = testingLibrary;

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

// Mock context providers
const TestWrapper = ({ children, config = mockConfig }) => (
  <div data-testid="config-provider" config={config}>
    <div data-testid="route-config-provider">
      {children}
    </div>
  </div>
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
          <EnhancedSignupPageComponent {...providerProps} />
        </TestWrapper>
      );

      // Should show provider value proposition
      expect(screen.getByText(/Sell to US Indian Families/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero listing fees to start/i)).toBeInTheDocument();

      // Should show back navigation
      expect(screen.getByText(/Back to Customer Signup/i)).toBeInTheDocument();

      // Should NOT show provider CTA
      expect(screen.queryByText(/Want to sell products instead/i)).not.toBeInTheDocument();
    });

    it('shows "Start Selling" button for providers', () => {
      render(
        <TestWrapper>
          <EnhancedSignupPageComponent {...providerProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/Start Selling/i)).toBeInTheDocument();
    });

    it('navigates back to customer signup when back button is clicked', () => {
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      render(
        <TestWrapper>
          <EnhancedSignupPageComponent {...providerProps} />
        </TestWrapper>
      );

      const backButton = screen.getByText(/Back to Customer Signup/i);
      fireEvent.click(backButton);

      expect(window.location.href).toBe('/signup');
    });
  });

  describe('Form submission', () => {
    it('calls submitSignup with correct customer data', async () => {
      const submitSignupMock = jest.fn();
      const propsWithMockSubmit = {
        ...mockProps,
        submitSignup: submitSignupMock
      };

      render(
        <TestWrapper>
          <EnhancedSignupPageComponent {...propsWithMockSubmit} />
        </TestWrapper>
      );

      // Fill out the form
      await userEvent.type(
        screen.getByLabelText(/Email address/i),
        'test@example.com'
      );
      await userEvent.type(
        screen.getByLabelText(/First name/i),
        'John'
      );
      await userEvent.type(
        screen.getByLabelText(/Last name/i),
        'Doe'
      );
      await userEvent.type(
        screen.getByLabelText(/Password/i),
        'password123'
      );

      // Submit the form
      const submitButton = screen.getByText(/Start Saving Favorites/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitSignupMock).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            password: 'password123',
            publicData: expect.objectContaining({
              userType: 'customer'
            })
          })
        );
      });
    });
  });

  describe('Error handling', () => {
    it('displays signup error when provided', () => {
      const propsWithError = {
        ...mockProps,
        signupError: {
          type: 'error',
          name: 'SignupError'
        }
      };

      render(
        <TestWrapper>
          <EnhancedSignupPageComponent {...propsWithError} />
        </TestWrapper>
      );

      expect(screen.getByText(/Signup failed/i)).toBeInTheDocument();
    });

    it('displays email taken error when appropriate', () => {
      const propsWithEmailError = {
        ...mockProps,
        signupError: {
          type: 'error',
          name: 'EmailAlreadyTakenError'
        }
      };

      render(
        <TestWrapper>
          <EnhancedSignupPageComponent {...propsWithEmailError} />
        </TestWrapper>
      );

      expect(screen.getByText(/An account with this email address already exists/i)).toBeInTheDocument();
    });
  });

  describe('Authentication redirects', () => {
    it('redirects authenticated users to landing page', () => {
      const AuthenticatedWrapper = ({ children }) => (
        <TestWrapper>
          {children}
        </TestWrapper>
      );

      const authenticatedProps = {
        ...mockProps,
        isAuthenticated: true,
        currentUser: { id: '123', attributes: {} }
      };

      const { container } = render(
        <AuthenticatedWrapper>
          <EnhancedSignupPageComponent {...authenticatedProps} />
        </AuthenticatedWrapper>
      );

      // Component should render redirect, not the signup form
      expect(container.querySelector('form')).not.toBeInTheDocument();
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
    it('provides link to login page', () => {
      // Mock window.location.href
      delete window.location;
      window.location = { href: '' };

      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      const loginLink = screen.getByText(/Log in/i);
      fireEvent.click(loginLink);

      expect(window.location.href).toBe('/login');
    });

    it('shows "Already have an account?" text', () => {
      render(
        <TestWrapper>
          <SignupPageComponent {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
    });
  });
});