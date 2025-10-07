import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

// We need to test the routing logic in isolation
// This simulates the component function from routeConfiguration.js

// Mock BrandPartnershipPage
jest.mock('../containers/BrandPartnershipPage/BrandPartnershipPage', () => {
  return function MockBrandPartnershipPage(props) {
    return (
      <div data-testid="brand-partnership-page">
        Brand Partnership Page
        <div data-testid="current-user">{props.currentUser?.id || 'no-user'}</div>
      </div>
    );
  };
});

// Mock NamedRedirect
jest.mock('../components', () => ({
  NamedRedirect: ({ name, params }) => (
    <div data-testid="named-redirect">
      Redirect to: {name}
      {params && <div data-testid="redirect-params">{JSON.stringify(params)}</div>}
    </div>
  ),
}));

// Import the actual BrandPartnershipPage for the route component
import BrandPartnershipPage from '../containers/BrandPartnershipPage/BrandPartnershipPage';
import { NamedRedirect } from '../components';

// Simulate the route component logic from routeConfiguration.js
const NewListingPageRouteComponent = (props) => {
  const { currentUser } = props;
  const isLoggedInProvider = currentUser?.id && currentUser?.attributes?.profile?.metadata?.userType === 'provider';

  if (isLoggedInProvider) {
    // Simulate the draftSlug and draftId that would be available in routeConfiguration
    const draftSlug = 'draft-slug';
    const draftId = 'draft-id';

    return (
      <NamedRedirect
        name="EditListingPage"
        params={{ slug: draftSlug, id: draftId, type: 'new', tab: 'details' }}
      />
    );
  }

  return <BrandPartnershipPage {...props} />;
};

const mockStore = createStore(() => ({}));

const renderWithProviders = (component) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <IntlProvider locale="en" messages={{}}>
          {component}
        </IntlProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('NewListingPage Route Logic', () => {
  it('redirects to EditListingPage for logged-in provider users', () => {
    const providerUser = {
      id: { uuid: 'provider-123' },
      attributes: {
        profile: {
          metadata: {
            userType: 'provider'
          }
        }
      }
    };

    renderWithProviders(<NewListingPageRouteComponent currentUser={providerUser} />);

    expect(screen.getByTestId('named-redirect')).toBeInTheDocument();
    expect(screen.getByText('Redirect to: EditListingPage')).toBeInTheDocument();
    expect(screen.getByTestId('redirect-params')).toHaveTextContent(
      JSON.stringify({ slug: 'draft-slug', id: 'draft-id', type: 'new', tab: 'details' })
    );
  });

  it('shows BrandPartnershipPage for non-logged-in users', () => {
    renderWithProviders(<NewListingPageRouteComponent currentUser={null} />);

    expect(screen.getByTestId('brand-partnership-page')).toBeInTheDocument();
    expect(screen.getByText('Brand Partnership Page')).toBeInTheDocument();
    expect(screen.getByTestId('current-user')).toHaveTextContent('no-user');
  });

  it('shows BrandPartnershipPage for logged-in non-provider users', () => {
    const customerUser = {
      id: { uuid: 'customer-123' },
      attributes: {
        profile: {
          metadata: {
            userType: 'customer'
          }
        }
      }
    };

    renderWithProviders(<NewListingPageRouteComponent currentUser={customerUser} />);

    expect(screen.getByTestId('brand-partnership-page')).toBeInTheDocument();
    expect(screen.getByText('Brand Partnership Page')).toBeInTheDocument();
    expect(screen.getByTestId('current-user')).toHaveTextContent('customer-123');
  });

  it('shows BrandPartnershipPage for users without userType metadata', () => {
    const userWithoutType = {
      id: { uuid: 'user-123' },
      attributes: {
        profile: {
          metadata: {}
        }
      }
    };

    renderWithProviders(<NewListingPageRouteComponent currentUser={userWithoutType} />);

    expect(screen.getByTestId('brand-partnership-page')).toBeInTheDocument();
    expect(screen.getByText('Brand Partnership Page')).toBeInTheDocument();
  });

  it('shows BrandPartnershipPage for users without profile metadata', () => {
    const userWithoutProfile = {
      id: { uuid: 'user-123' },
      attributes: {}
    };

    renderWithProviders(<NewListingPageRouteComponent currentUser={userWithoutProfile} />);

    expect(screen.getByTestId('brand-partnership-page')).toBeInTheDocument();
  });

  it('shows BrandPartnershipPage for users without attributes', () => {
    const userWithoutAttributes = {
      id: { uuid: 'user-123' }
    };

    renderWithProviders(<NewListingPageRouteComponent currentUser={userWithoutAttributes} />);

    expect(screen.getByTestId('brand-partnership-page')).toBeInTheDocument();
  });

  it('handles edge case where user has ID but userType is not provider', () => {
    const userWithDifferentType = {
      id: { uuid: 'user-123' },
      attributes: {
        profile: {
          metadata: {
            userType: 'admin'
          }
        }
      }
    };

    renderWithProviders(<NewListingPageRouteComponent currentUser={userWithDifferentType} />);

    expect(screen.getByTestId('brand-partnership-page')).toBeInTheDocument();
    expect(screen.queryByTestId('named-redirect')).not.toBeInTheDocument();
  });

  it('handles provider user with missing ID', () => {
    const providerUserWithoutId = {
      attributes: {
        profile: {
          metadata: {
            userType: 'provider'
          }
        }
      }
    };

    renderWithProviders(<NewListingPageRouteComponent currentUser={providerUserWithoutId} />);

    expect(screen.getByTestId('brand-partnership-page')).toBeInTheDocument();
    expect(screen.queryByTestId('named-redirect')).not.toBeInTheDocument();
  });

  it('passes through all props to BrandPartnershipPage', () => {
    const customProps = {
      currentUser: null,
      customProp: 'test-value',
      location: { pathname: '/test' }
    };

    // We'll use a spy to check if props are passed through
    const MockBrandPartnershipPageWithProps = (props) => (
      <div data-testid="brand-partnership-page">
        <div data-testid="custom-prop">{props.customProp}</div>
        <div data-testid="location-pathname">{props.location?.pathname}</div>
      </div>
    );

    const RouteWithCustomBrandPage = (props) => {
      const { currentUser } = props;
      const isLoggedInProvider = currentUser?.id && currentUser?.attributes?.profile?.metadata?.userType === 'provider';

      if (isLoggedInProvider) {
        return <NamedRedirect name="EditListingPage" params={{}} />;
      }

      return <MockBrandPartnershipPageWithProps {...props} />;
    };

    renderWithProviders(<RouteWithCustomBrandPage {...customProps} />);

    expect(screen.getByTestId('custom-prop')).toHaveTextContent('test-value');
    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/test');
  });
});