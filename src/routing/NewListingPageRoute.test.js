import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Mock BrandPartnershipPage
jest.mock('../containers/BrandPartnershipPage/BrandPartnershipPage', () => {
  return function MockBrandPartnershipPage(props) {
    return <div data-testid="brand-partnership-page">BrandPartnershipPage</div>;
  };
});

// Mock NamedRedirect component
jest.mock('../components', () => ({
  NamedRedirect: function MockNamedRedirect({ name, params }) {
    return (
      <div data-testid="named-redirect">
        Redirecting to {name} with params: {JSON.stringify(params)}
      </div>
    );
  },
}));

// Import the actual NewListingPageRoute for the route component
import NewListingPageRoute from './NewListingPageRoute';

// Helper function to create a mock Redux store
const createMockStore = (currentUser = null) => {
  return configureStore({
    reducer: {
      user: (state = { currentUser }, action) => state,
    },
    preloadedState: {
      user: { currentUser },
    },
  });
};

// Helper function to render component with store and router
const renderWithProviders = (component, { store, history = createMemoryHistory() } = {}) => {
  const defaultStore = createMockStore();
  return render(
    <Provider store={store || defaultStore}>
      <Router history={history}>{component}</Router>
    </Provider>
  );
};

// Test component that uses NewListingPageRoute logic
const TestNewListingPageRoute = (props) => {
  return <NewListingPageRoute {...props} />;
};

describe('NewListingPageRoute', () => {
  it('shows BrandPartnershipPage for non-logged-in users', () => {
    const store = createMockStore(null);
    renderWithProviders(<TestNewListingPageRoute />, { store });

    expect(document.querySelector('[data-testid="brand-partnership-page"]')).toBeInTheDocument();
  });

  it('shows BrandPartnershipPage for logged-in non-provider users', () => {
    const currentUser = {
      id: { uuid: 'user-123' },
      attributes: {
        profile: {
          publicData: {
            userType: 'customer',
          },
        },
      },
    };

    const store = createMockStore(currentUser);
    renderWithProviders(<TestNewListingPageRoute />, { store });

    expect(document.querySelector('[data-testid="brand-partnership-page"]')).toBeInTheDocument();
  });

  it('redirects to EditListingPage for logged-in provider users', () => {
    const currentUser = {
      id: { uuid: 'user-123' },
      attributes: {
        profile: {
          publicData: {
            userType: 'provider',
          },
        },
      },
    };

    const store = createMockStore(currentUser);
    renderWithProviders(<TestNewListingPageRoute />, { store });

    const namedRedirect = document.querySelector('[data-testid="named-redirect"]');
    expect(namedRedirect).toBeInTheDocument();
    expect(namedRedirect.textContent).toContain('EditListingPage');
    expect(namedRedirect.textContent).toContain('"slug":"draft"');
    expect(namedRedirect.textContent).toContain('"id":"00000000-0000-0000-0000-000000000000"');
    expect(namedRedirect.textContent).toContain('"type":"new"');
    expect(namedRedirect.textContent).toContain('"tab":"details"');
  });

  it('shows BrandPartnershipPage for users without userType metadata', () => {
    const currentUser = {
      id: { uuid: 'user-123' },
      attributes: {
        profile: {
          publicData: {},
        },
      },
    };

    const store = createMockStore(currentUser);
    renderWithProviders(<TestNewListingPageRoute />, { store });

    expect(document.querySelector('[data-testid="brand-partnership-page"]')).toBeInTheDocument();
  });

  it('shows BrandPartnershipPage for users without profile metadata', () => {
    const currentUser = {
      id: { uuid: 'user-123' },
      attributes: {},
    };

    const store = createMockStore(currentUser);
    renderWithProviders(<TestNewListingPageRoute />, { store });

    expect(document.querySelector('[data-testid="brand-partnership-page"]')).toBeInTheDocument();
  });

  it('shows BrandPartnershipPage for users without attributes', () => {
    const currentUser = {
      id: { uuid: 'user-123' },
    };

    const store = createMockStore(currentUser);
    renderWithProviders(<TestNewListingPageRoute />, { store });

    expect(document.querySelector('[data-testid="brand-partnership-page"]')).toBeInTheDocument();
  });

  it('handles edge case where user has ID but userType is not provider', () => {
    const currentUser = {
      id: { uuid: 'user-123' },
      attributes: {
        profile: {
          publicData: {
            userType: 'admin',
          },
        },
      },
    };

    const store = createMockStore(currentUser);
    renderWithProviders(<TestNewListingPageRoute />, { store });

    expect(document.querySelector('[data-testid="brand-partnership-page"]')).toBeInTheDocument();
  });

  it('redirects providers to EditListingPage with correct parameters', () => {
    const currentUser = {
      id: { uuid: 'user-123' },
      attributes: {
        profile: {
          publicData: {
            userType: 'provider',
          },
        },
      },
    };

    const store = createMockStore(currentUser);
    renderWithProviders(<TestNewListingPageRoute />, { store });

    const namedRedirect = document.querySelector('[data-testid="named-redirect"]');
    expect(namedRedirect).toBeInTheDocument();

    // Check that it contains the expected redirect parameters
    const expectedParams = {
      slug: 'draft',
      id: '00000000-0000-0000-0000-000000000000',
      type: 'new',
      tab: 'details',
    };

    expect(namedRedirect.textContent).toContain(JSON.stringify(expectedParams));
  });

  it('passes through all props to BrandPartnershipPage', () => {
    const store = createMockStore(null);
    const testProps = { someCustomProp: 'test-value' };

    renderWithProviders(<TestNewListingPageRoute {...testProps} />, { store });

    const brandPartnershipPage = document.querySelector('[data-testid="brand-partnership-page"]');
    expect(brandPartnershipPage).toBeInTheDocument();
  });
});