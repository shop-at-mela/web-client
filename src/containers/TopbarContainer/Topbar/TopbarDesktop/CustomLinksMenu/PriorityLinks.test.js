import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { CreateListingMenuLink } from './PriorityLinks';

// Add jest-dom matchers
import '@testing-library/jest-dom';

// Mock the react-intl module
jest.mock('../../../../../util/reactIntl', () => ({
  FormattedMessage: ({ id, ...props }) => <span data-testid={`formatted-message-${id}`} {...props}>{id}</span>,
}));

// Mock NamedLink component
jest.mock('../../../../../components', () => ({
  NamedLink: ({ name, params, className, children }) => (
    <a
      data-testid="named-link"
      data-name={name}
      data-params={JSON.stringify(params)}
      className={className}
    >
      {children}
    </a>
  ),
}));

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('CreateListingMenuLink', () => {
  const defaultProps = {
    customLinksMenuClass: 'test-class',
  };

  it('shows "Post a new listing" for authenticated users', () => {
    const authenticatedUser = {
      id: { uuid: 'user-123' },
      attributes: {
        profile: {
          publicData: {
            userType: 'provider',
          },
        },
      },
    };

    renderWithRouter(
      <CreateListingMenuLink
        {...defaultProps}
        currentUser={authenticatedUser}
      />
    );

    const formattedMessage = document.querySelector('[data-testid="formatted-message-TopbarDesktop.createListing"]');
    expect(formattedMessage).toBeInTheDocument();
  });

  it('shows "Sell on Mela" for unauthenticated users', () => {
    renderWithRouter(
      <CreateListingMenuLink
        {...defaultProps}
        currentUser={null}
      />
    );

    const formattedMessage = document.querySelector('[data-testid="formatted-message-TopbarDesktop.sellOnMela"]');
    expect(formattedMessage).toBeInTheDocument();
  });

  it('shows "Sell on Mela" for users without id', () => {
    const userWithoutId = {
      attributes: {
        profile: {
          publicData: {
            userType: 'provider',
          },
        },
      },
    };

    renderWithRouter(
      <CreateListingMenuLink
        {...defaultProps}
        currentUser={userWithoutId}
      />
    );

    const formattedMessage = document.querySelector('[data-testid="formatted-message-TopbarDesktop.sellOnMela"]');
    expect(formattedMessage).toBeInTheDocument();
  });

  it('renders NamedLink with correct props', () => {
    const authenticatedUser = {
      id: { uuid: 'user-123' },
    };

    renderWithRouter(
      <CreateListingMenuLink
        {...defaultProps}
        currentUser={authenticatedUser}
      />
    );

    const namedLink = document.querySelector('[data-testid="named-link"]');
    expect(namedLink).toBeInTheDocument();
    expect(namedLink.getAttribute('data-name')).toBe('NewListingPage');
    expect(namedLink.getAttribute('data-params')).toBe('{}');
  });

  it('applies custom class to wrapper div', () => {
    const { container } = renderWithRouter(
      <CreateListingMenuLink
        {...defaultProps}
        currentUser={null}
      />
    );

    const wrapperDiv = container.firstChild;
    expect(wrapperDiv).toHaveClass('test-class');
  });

  it('handles undefined currentUser', () => {
    renderWithRouter(
      <CreateListingMenuLink
        {...defaultProps}
        currentUser={undefined}
      />
    );

    const formattedMessage = document.querySelector('[data-testid="formatted-message-TopbarDesktop.sellOnMela"]');
    expect(formattedMessage).toBeInTheDocument();
  });
});